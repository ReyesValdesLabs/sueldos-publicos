import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Building2, Check, ExternalLink, LoaderCircle, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sitePath } from "@/lib/site-path";

interface PrioritySchool {
  rbd: number;
  name: string;
  dependence: string;
  priorityPercentage: number;
  processYear: number;
  enrollmentYear: number;
}

interface PrioritySchoolSource {
  title: string;
  documentUrl: string;
  scope: string;
  includedRows: number;
}

interface PrioritySchoolDataset {
  source: PrioritySchoolSource;
  schools: PrioritySchool[];
}

interface SchoolZone {
  rbd: number;
  zonePercentage: number | null;
  rural: boolean | null;
  monthsObserved: number[];
  consistent: boolean;
}

interface SchoolZoneDataset {
  source: {
    title: string;
    datasetUrl: string;
    dataYear: number;
  };
  schools: SchoolZone[];
}

interface PrioritySchoolSearchProps {
  value: number;
  onChange: (value: number) => void;
  zonePercentage: number;
  onZoneChange: (value: number) => void;
  rural: boolean;
  onRuralChange: (value: boolean) => void;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-CL")
    .replace(/\s+/g, " ")
    .trim();
}

const percentage = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });

export function PrioritySchoolSearch({
  value,
  onChange,
  zonePercentage,
  onZoneChange,
  rural,
  onRuralChange,
}: PrioritySchoolSearchProps) {
  const [dataset, setDataset] = useState<PrioritySchoolDataset | null>(null);
  const [zoneDataset, setZoneDataset] = useState<SchoolZoneDataset | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [zoneLoadError, setZoneLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PrioritySchool | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(sitePath("data/priority-schools-2026.json"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<PrioritySchoolDataset>;
      })
      .then((data) => setDataset(data))
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") setLoadError(true);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(sitePath("data/school-zones-2025.json"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<SchoolZoneDataset>;
      })
      .then((data) => setZoneDataset(data))
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") setZoneLoadError(true);
      });
    return () => controller.abort();
  }, []);

  const selectedZone = useMemo(
    () => selected && zoneDataset ? zoneDataset.schools.find((school) => school.rbd === selected.rbd) ?? null : null,
    [selected, zoneDataset],
  );

  useEffect(() => {
    if (!selectedZone?.consistent || selectedZone.zonePercentage === null || selectedZone.rural === null) return;
    onZoneChange(selectedZone.zonePercentage);
    onRuralChange(selectedZone.rural);
  }, [selectedZone]);

  const results = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    const numericQuery = query.trim().replace(/\D/g, "");
    if (!dataset || (!numericQuery && normalizedQuery.length < 2)) return [];

    const terms = normalizedQuery.split(" ").filter(Boolean);
    return dataset.schools
      .filter((school) => {
        const searchable = `${school.rbd} ${normalizeSearch(school.name)}`;
        return terms.every((term) => searchable.includes(term));
      })
      .sort((left, right) => {
        const leftRbd = String(left.rbd);
        const rightRbd = String(right.rbd);
        const leftName = normalizeSearch(left.name);
        const rightName = normalizeSearch(right.name);
        const score = (rbd: string, name: string) => rbd === numericQuery ? 0 : rbd.startsWith(numericQuery) && numericQuery ? 1 : name.startsWith(normalizedQuery) ? 2 : 3;
        return score(leftRbd, leftName) - score(rightRbd, rightName) || left.rbd - right.rbd;
      })
      .slice(0, 8);
  }, [dataset, query]);

  useEffect(() => setActiveIndex(0), [query]);

  const selectSchool = (school: PrioritySchool) => {
    setSelected(school);
    setQuery(`${school.name} · RBD ${school.rbd}`);
    setOpen(false);
    onChange(school.priorityPercentage);
  };

  const clearSelection = () => {
    setSelected(null);
    setQuery("");
    setOpen(false);
    onChange(0);
    onZoneChange(0);
    onRuralChange(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(results.length - 1, current + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(0, current - 1));
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      selectSchool(results[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const manualOverride = selected && value !== selected.priorityPercentage;
  const manualZoneOverride = selectedZone?.consistent && selectedZone.zonePercentage !== null && zonePercentage !== selectedZone.zonePercentage;
  const manualRuralOverride = selectedZone?.consistent && selectedZone.rural !== null && rural !== selectedZone.rural;
  const manualLocationSummary = [
    manualZoneOverride ? `${percentage.format(zonePercentage)}% de zona` : null,
    manualRuralOverride ? `ruralidad ${rural ? "Sí" : "No"}` : null,
  ].filter(Boolean).join(" y ");
  const resultListId = "priority-school-results";

  return <div
    className="priority-school-search"
    onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}
  >
    <div className="field-group">
      <Label htmlFor="priority-school">Establecimiento público</Label>
      <div className="priority-school-input">
        <Search size={18} aria-hidden="true" />
        <Input
          id="priority-school"
          role="combobox"
          type="text"
          enterKeyHint="search"
          autoComplete="off"
          value={query}
          placeholder={dataset ? "Busca por nombre o RBD" : "Cargando establecimientos…"}
          disabled={!dataset}
          aria-autocomplete="list"
          aria-expanded={open && results.length > 0}
          aria-controls={resultListId}
          aria-activedescendant={open && results.length ? `priority-school-option-${results[activeIndex].rbd}` : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="form-control"
        />
        {!dataset && !loadError && <LoaderCircle className="priority-school-loader" size={18} aria-hidden="true" />}
        {selected && <button type="button" className="priority-school-clear" onClick={clearSelection} aria-label="Quitar establecimiento seleccionado"><X size={16} /></button>}
      </div>
      <p className="field-help">
        Busca entre {dataset ? percentage.format(dataset.source.includedRows) : "los"} establecimientos municipales, DAEM y SLEP. Completaremos prioritarios, zona y ruralidad cuando exista información oficial.
      </p>
    </div>

    {open && results.length > 0 && <div id={resultListId} role="listbox" aria-label="Establecimientos encontrados" className="priority-school-results">
      {results.map((school, index) => <button
        id={`priority-school-option-${school.rbd}`}
        key={school.rbd}
        type="button"
        role="option"
        aria-selected={selected?.rbd === school.rbd}
        className={index === activeIndex ? "is-active" : undefined}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => selectSchool(school)}
      >
        <span><strong>{school.name}</strong><small>RBD {school.rbd} · {school.dependence}</small></span>
        <b>{percentage.format(school.priorityPercentage)}%</b>
      </button>)}
    </div>}

    {open && dataset && query.trim().length >= 2 && results.length === 0 && <p className="priority-school-empty">No encontramos coincidencias. Revisa el nombre o RBD, o ingresa el porcentaje manualmente.</p>}
    {loadError && <p className="field-error" role="alert">No pudimos cargar el buscador. Puedes continuar ingresando el porcentaje manualmente.</p>}

    {selected && dataset && <div className="priority-school-selected" aria-live="polite">
      <span className="priority-school-selected-icon"><Building2 size={19} /></span>
      <div>
        <span className="priority-school-selected-kicker"><Check size={13} /> Establecimiento seleccionado</span>
        <strong>{selected.name}</strong>
        <p>RBD {selected.rbd} · {selected.dependence}</p>
        <p>Concentración oficial: <b>{percentage.format(selected.priorityPercentage)}%</b> · proceso {selected.processYear}, matrícula {selected.enrollmentYear}</p>
        {manualOverride && <p className="priority-school-override">Usarás un valor manual de {percentage.format(value)}% en esta simulación.</p>}
        <a href={dataset.source.documentUrl} target="_blank" rel="noopener noreferrer">
          Fuente: {dataset.source.title} <ExternalLink size={13} />
        </a>
        {selectedZone?.consistent && selectedZone.zonePercentage !== null && selectedZone.rural !== null && zoneDataset && <>
          <p className="priority-school-zone">
            Zona oficial: <b>{percentage.format(selectedZone.zonePercentage)}%</b> · ruralidad: <b>{selectedZone.rural ? "Sí" : "No"}</b> · año {zoneDataset.source.dataYear}
          </p>
          {(manualZoneOverride || manualRuralOverride) && <p className="priority-school-override">
            Usarás {manualLocationSummary} en esta simulación.
          </p>}
          <a href={zoneDataset.source.datasetUrl} target="_blank" rel="noopener noreferrer">
            Fuente de zona y ruralidad: {zoneDataset.source.title} <ExternalLink size={13} />
          </a>
        </>}
        {selectedZone && !selectedZone.consistent && zoneDataset && <p className="priority-school-zone-warning">
          Mineduc no publica un valor 2025 completo y consistente para este RBD. Confirma zona y ruralidad manualmente.
        </p>}
        {selected && !selectedZone && !zoneLoadError && <p className="priority-school-zone-warning">Cargando zona y ruralidad oficial…</p>}
        {selected && zoneLoadError && <p className="priority-school-zone-warning">No pudimos cargar la fuente de zona y ruralidad. Confirma ambos valores manualmente.</p>}
      </div>
    </div>}
  </div>;
}
