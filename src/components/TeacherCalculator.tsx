import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarClock, Check, ExternalLink, FileText, Info, Plus, Printer, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { JULY_2026_PARAMETERS as P, type AfpKey, type PeriodParameters } from "@/data/parameters/2026-07";
import { calculateTeacherSalary } from "@/lib/calculation/calculate";
import { sitePath } from "@/lib/site-path";
import type { CalculationInput, ManualItem, ManualKind } from "@/lib/calculation/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const currency = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const integerMoney = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const decimalMoney = new Intl.NumberFormat("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const trancheNames = { access: "Acceso", initial: "Inicial", early: "Temprano", advanced: "Avanzado", expert1: "Experto I", expert2: "Experto II" } as const;
const afpNames = { capital: "Capital", cuprum: "Cuprum", habitat: "Habitat", modelo: "Modelo", planvital: "PlanVital", provida: "Provida", uno: "Uno" } as const;
const steps = ["Contrato", "Carrera docente", "Previsión y extras", "Resultado"];
const date = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Santiago" });
const month = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric", timeZone: "America/Santiago" });
const sourceUpdatedLabel = date.format(new Date(`${P.previred.sourceUpdatedAt}T12:00:00Z`));
const paymentPeriodLabel = month.format(new Date(`${P.previred.paymentPeriod}-15T12:00:00Z`));

function parseMoney(value: string) {
  const sanitized = value.replace(/[^\d,.]/g, "");
  const dotParts = sanitized.split(".");
  const normalized = sanitized.includes(",")
    ? sanitized.replace(/\./g, "").replace(",", ".")
    : dotParts.length === 2 && dotParts[1].length <= 2
      ? sanitized
      : sanitized.replace(/\./g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function currentChilePeriod() {
  const parts = new Intl.DateTimeFormat("en", { year: "numeric", month: "2-digit", timeZone: "America/Santiago" }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const monthNumber = parts.find((part) => part.type === "month")?.value;
  return `${year}-${monthNumber}`;
}

const initialInput: CalculationInput = {
  basicHours: 44,
  secondaryHours: 0,
  biennia: 5,
  tranche: null,
  trancheSuspended: false,
  hasBrpTitle: true,
  hasBrpMention: false,
  priorityPercentage: 0,
  rural: false,
  priorityExpired: false,
  zonePercentage: 0,
  afp: "habitat",
  healthSystem: "fonasa",
  isaprePlanUf: 0,
  apv: 0,
  apvTaxDeductible: false,
  afcEnabled: false,
  contractType: "indefinite",
  afcContributionEnded: false,
  manualItems: [],
};

function SelectField({ id, label, value, onChange, children, help, error }: { id: string; label: string; value: string; onChange: (value: string) => void; children: ReactNode; help?: string; error?: string }) {
  const describedBy = [help ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return <div className="field-group">
    <Label htmlFor={id}>{label}</Label>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="form-control" aria-describedby={describedBy} aria-invalid={Boolean(error)}>{children}</select>
    {help && <p id={`${id}-help`} className="field-help">{help}</p>}
    {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
  </div>;
}

function NumberField({ id, label, value, onChange, min = 0, max, suffix, help, error, moneyDecimals = 0 }: { id: string; label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; suffix?: string; help?: string; error?: string; moneyDecimals?: 0 | 2 }) {
  const isMoney = suffix === "$";
  const [draftValue, setDraftValue] = useState<string | null>(null);
  const displayValue = draftValue ?? (isMoney ? (moneyDecimals === 2 ? decimalMoney : integerMoney).format(value) : value);
  const describedBy = [help ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  const handleInput = (rawValue: string) => {
    if (rawValue === "") {
      setDraftValue("");
      onChange(0);
      return;
    }
    setDraftValue(null);
    onChange(isMoney ? parseMoney(rawValue) : Number(rawValue));
  };

  return <div className="field-group">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Input
        id={id}
        type={isMoney ? "text" : "number"}
        inputMode={isMoney ? "decimal" : undefined}
        min={isMoney ? undefined : min}
        max={isMoney ? undefined : max}
        value={displayValue}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        onInput={(event) => handleInput(event.currentTarget.value)}
        onBlur={() => setDraftValue(null)}
        className={`form-control${suffix ? " pr-16" : ""}`}
      />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">{suffix}</span>}
    </div>
    {help && <p id={`${id}-help`} className="field-help">{help}</p>}
    {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
  </div>;
}

function CheckField({ id, checked, onChange, label, help }: { id: string; checked: boolean; onChange: (value: boolean) => void; label: string; help?: string }) {
  return <label htmlFor={id} className="check-field">
    <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span className="check-box" aria-hidden="true"><Check size={14} /></span>
    <span><strong>{label}</strong>{help && <small>{help}</small>}</span>
  </label>;
}

export default function TeacherCalculator() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<CalculationInput>(initialInput);
  const [editBase, setEditBase] = useState(false);
  const [sourceStatus, setSourceStatus] = useState<"checking" | "available" | "unavailable">("checking");
  const [manualParameters, setManualParameters] = useState(false);
  const [manualValues, setManualValues] = useState({
    uf: P.uf,
    pensionCapUf: P.pensionCapUf,
    unemploymentCapUf: P.unemploymentCapUf,
    afpCommission: { ...P.afpCommission } as Record<AfpKey, number>,
  });
  const periodStale = currentChilePeriod() > P.previred.paymentPeriod;
  const dataIssue = periodStale || sourceStatus === "unavailable";
  const activeParameters = useMemo<PeriodParameters>(() => manualParameters ? {
    ...P,
    uf: manualValues.uf,
    pensionCapUf: manualValues.pensionCapUf,
    unemploymentCapUf: manualValues.unemploymentCapUf,
    afpCommission: manualValues.afpCommission,
  } : P, [manualParameters, manualValues]);
  const result = useMemo(() => {
    const calculated = calculateTeacherSalary(input, activeParameters);
    return manualParameters ? { ...calculated, warnings: [...calculated.warnings, "El cálculo usa parámetros previsionales ingresados manualmente. Verifica sus fuentes antes de usar el resultado."] } : calculated;
  }, [input, activeParameters, manualParameters]);
  const update = <K extends keyof CalculationInput>(key: K, value: CalculationInput[K]) => setInput((current) => ({ ...current, [key]: value }));
  const appliedBasicHours = Math.max(0, Math.round(input.basicHours || 0));
  const appliedSecondaryHours = Math.max(0, Math.round(input.secondaryHours || 0));
  const declaredHours = appliedBasicHours + appliedSecondaryHours;
  const appliedHours = Math.min(44, declaredHours);
  const hourScale = declaredHours > 44 ? 44 / declaredHours : 1;
  const legalBase = Math.round(
    (activeParameters.hourlyRate.basic * appliedBasicHours + activeParameters.hourlyRate.secondary * appliedSecondaryHours) * hourScale,
  );
  const hoursError = !Number.isInteger(input.basicHours) || !Number.isInteger(input.secondaryHours) || input.basicHours < 0 || input.secondaryHours < 0
    ? "Ingresa horas completas iguales o mayores que cero."
    : input.basicHours + input.secondaryHours === 0
      ? "Ingresa al menos una hora de contrato."
      : input.basicHours + input.secondaryHours > 44
        ? "La suma no puede superar 44 horas con un mismo empleador."
        : undefined;
  const bienniaError = input.biennia < 0 || input.biennia > 15 || !Number.isInteger(input.biennia)
    ? "Ingresa un número entero entre 0 y 15."
    : undefined;
  const trancheError = input.tranche === null ? "Selecciona el tramo profesional que tienes reconocido." : undefined;
  const currentStepInvalid = (step === 0 && Boolean(hoursError)) || (step === 1 && Boolean(bienniaError || trancheError));

  useEffect(() => {
    const controller = new AbortController();
    fetch(P.previred.sourceUrl, { method: "HEAD", signal: controller.signal })
      .then((response) => setSourceStatus(response.ok ? "available" : "unavailable"))
      .catch((error: unknown) => { if ((error as { name?: string }).name !== "AbortError") setSourceStatus("unavailable"); });
    return () => controller.abort();
  }, []);

  const addManualItem = () => update("manualItems", [...input.manualItems, { id: crypto.randomUUID(), name: "", amount: 0, kind: "taxable" }]);
  const patchManualItem = (id: string, patch: Partial<ManualItem>) => update("manualItems", input.manualItems.map((item) => item.id === id ? { ...item, ...patch } : item));
  const removeManualItem = (id: string) => update("manualItems", input.manualItems.filter((item) => item.id !== id));
  const goTo = (nextStep: number) => {
    setStep(Math.min(3, Math.max(0, nextStep)));
    document.querySelector("#calculadora")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <section id="calculadora" className="scroll-mt-24" aria-labelledby="calculator-title">
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <Badge>Valores vigentes · {P.label}</Badge>
        <h2 id="calculator-title" className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">Calcula tu liquidación docente</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">Completa tus antecedentes. Nada de lo que ingreses se guarda o se envía fuera de tu navegador.</p>
        <p className="data-update-line"><CalendarClock size={16} /><span>Última actualización previsional: <strong>{sourceUpdatedLabel}</strong></span><a href={P.previred.sourceUrl} target="_blank" rel="noopener noreferrer">Ver Previred <ExternalLink size={13} /></a></p>
      </div>
      <a href={sitePath("legal/")} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:underline"><ShieldCheck size={18} /> Ver respaldo legal</a>
    </div>

    {dataIssue && <div className="data-alert" role="alert"><AlertTriangle size={20} /><div><strong>{periodStale ? "Los indicadores previsionales pueden estar desactualizados" : "No pudimos comprobar la disponibilidad de Previred"}</strong><p>La copia verificada sigue disponible. También puedes ingresar los valores previsionales para esta simulación.</p></div><Button type="button" size="sm" variant="outline" onClick={() => { setManualParameters(true); goTo(2); }}>Ingresar valores</Button></div>}

    <nav aria-label="Progreso de la calculadora" className="stepper">
      {steps.map((name, index) => <button key={name} type="button" onClick={() => index < step && goTo(index)} disabled={index > step} aria-current={index === step ? "step" : undefined} className="step-item">
        <span>{index < step ? <Check size={15} /> : index + 1}</span><small>{name}</small>
      </button>)}
    </nav>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <Card className="overflow-hidden">
        {step === 0 && <>
          <CardHeader><CardTitle>Tu contrato</CardTitle><CardDescription>Separa las horas por nivel para calcular la RBMN con el valor legal que corresponde a cada una.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="form-grid">
              <NumberField id="basic-hours" label="Horas prebásica, básica o especial" value={input.basicHours} onChange={(value) => update("basicHours", value)} min={0} max={44} suffix="horas" />
              <NumberField id="secondary-hours" label="Horas media o técnico-profesional" value={input.secondaryHours} onChange={(value) => update("secondaryHours", value)} min={0} max={44} suffix="horas" help={`Jornada total declarada: ${input.basicHours + input.secondaryHours} horas.`} error={hoursError} />
            </div>
            <div className="legal-value-card">
              <div className="legal-value-summary" aria-live="polite" aria-atomic="true"><span>RBMN legal calculada</span><strong>{currency.format(legalBase)}</strong><small>{appliedBasicHours > 0 && `${appliedBasicHours} h básica × ${currency.format(activeParameters.hourlyRate.basic)}`}{appliedBasicHours > 0 && appliedSecondaryHours > 0 && " + "}{appliedSecondaryHours > 0 && `${appliedSecondaryHours} h media × ${currency.format(activeParameters.hourlyRate.secondary)}`} · total aplicado: {appliedHours} h</small></div>
              <CheckField id="edit-base" checked={editBase} onChange={(checked) => { setEditBase(checked); update("paidBaseSalary", checked ? legalBase : undefined); }} label="Mi sueldo base pagado es distinto" help="Podrás ingresar el monto real sin alterar la base legal de las asignaciones." />
            </div>
            {editBase && <NumberField id="paid-base" label="Sueldo base pagado" value={input.paidBaseSalary ?? legalBase} onChange={(value) => update("paidBaseSalary", value)} suffix="$" />}
            <div className="warning-inline"><Info size={18} /><p>Esta versión calcula una remuneración mensual completa. No prorratea ingresos, licencias ni ausencias por días.</p></div>
          </CardContent>
        </>}

        {step === 1 && <>
          <CardHeader><CardTitle>Carrera docente</CardTitle><CardDescription>Usa antecedentes acreditados. Si no conoces un beneficio, déjalo desactivado.</CardDescription></CardHeader>
          <CardContent className="space-y-7">
            <div className="warning-inline"><Info size={18} /><p>Selecciona el tramo que figure en tu resolución o Portal Docente. “Acceso” es un tramo transitorio reconocido; no equivale a estar sin tramo.</p></div>
            <div className="form-grid">
              <NumberField id="biennia" label="Bienios reconocidos" value={input.biennia} onChange={(value) => update("biennia", value)} min={0} max={15} help="Cada bienio corresponde a dos años acreditados; máximo 15." error={bienniaError} />
              <SelectField id="tranche" label="Tramo profesional" value={input.tranche ?? ""} onChange={(value) => update("tranche", value ? value as CalculationInput["tranche"] : null)} error={trancheError}>
                <option value="" disabled>Selecciona tu tramo reconocido</option>
                {Object.entries(trancheNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </SelectField>
            </div>
            <div className="option-grid">
              <CheckField id="brp-title" checked={input.hasBrpTitle} onChange={(value) => update("hasBrpTitle", value)} label="Título acreditado para BRP" help="Se paga proporcionalmente hasta 30 horas." />
              <CheckField id="brp-mention" checked={input.hasBrpMention} onChange={(value) => update("hasBrpMention", value)} label="Mención acreditada" help="Solo se considera una mención." />
            </div>
            <details className="advanced-panel">
              <summary>Establecimiento y situaciones especiales</summary>
              <div className="space-y-6 pt-5">
                <div className="form-grid">
                  <NumberField id="priority" label="Concentración de alumnos prioritarios" value={input.priorityPercentage} onChange={(value) => update("priorityPercentage", value)} min={0} max={100} suffix="%" />
                  <NumberField id="zone" label="Porcentaje de asignación de zona" value={input.zonePercentage} onChange={(value) => update("zonePercentage", value)} min={0} max={200} suffix="%" help="Ingresa el porcentaje reconocido al establecimiento." />
                </div>
                <div className="option-grid">
                  <CheckField id="rural" checked={input.rural} onChange={(value) => update("rural", value)} label="Establecimiento rural" />
                  <CheckField id="tranche-suspended" checked={input.trancheSuspended} onChange={(value) => update("trancheSuspended", value)} label="Asignación de tramo suspendida" help="Por aplicación del artículo 19 P." />
                  <CheckField id="priority-expired" checked={input.priorityExpired} onChange={(value) => update("priorityExpired", value)} label="Derecho a prioritarios suspendido" help="Por límite aplicable en tramo Inicial o Temprano." />
                </div>
              </div>
            </details>
          </CardContent>
        </>}

        {step === 2 && <>
          <CardHeader><CardTitle>Previsión y otros conceptos</CardTitle><CardDescription>Estos datos permiten estimar descuentos y el Impuesto Único mensual.</CardDescription></CardHeader>
          <CardContent className="space-y-7">
            <section className={`parameter-panel ${manualParameters ? "is-manual" : ""}`} aria-labelledby="parameter-title">
              <div className="parameter-panel-heading"><div><span className="parameter-status-icon"><RefreshCw size={18} /></span><div><h3 id="parameter-title">Parámetros previsionales</h3><p>Actualizados el {sourceUpdatedLabel} · cotizaciones pagadas en {paymentPeriodLabel}.</p></div></div><Badge className={manualParameters ? "border-destructive/30 bg-destructive/10 text-destructive" : ""}>{manualParameters ? "Valores manuales" : sourceStatus === "available" ? "Fuente disponible" : sourceStatus === "checking" ? "Comprobando fuente" : "Copia verificada"}</Badge></div>
              <div className="parameter-actions"><a href={P.previred.sourceUrl} target="_blank" rel="noopener noreferrer">Abrir documento oficial <ExternalLink size={14} /></a><Button type="button" size="sm" variant="outline" onClick={() => setManualParameters((current) => !current)}>{manualParameters ? "Usar copia verificada" : "Ingresar manualmente"}</Button></div>
              {manualParameters && <div className="manual-parameters" role="group" aria-label="Parámetros previsionales manuales">
                <p className="warning-inline"><Info size={18} /> Estos valores se usarán solo en esta simulación y no se guardarán.</p>
                <div className="manual-afp-group">
                  <div><h4>Tu AFP y su comisión</h4><p>Selecciona tu administradora e ingresa la comisión adicional que corresponda.</p></div>
                  <div className="form-grid">
                    <SelectField id="manual-afp" label="AFP" value={input.afp} onChange={(value) => update("afp", value as CalculationInput["afp"])}>
                      {Object.entries(afpNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </SelectField>
                    <NumberField id="manual-afp-commission" label={`Comisión AFP ${afpNames[input.afp]}`} value={Math.round(manualValues.afpCommission[input.afp] * 10000) / 100} onChange={(value) => setManualValues((current) => ({ ...current, afpCommission: { ...current.afpCommission, [input.afp]: value / 100 } }))} min={0} max={5} suffix="%" help="Ingresa solo la comisión adicional al 10% obligatorio." />
                  </div>
                </div>
                <div className="form-grid">
                  <NumberField id="manual-uf" label="Valor UF" value={manualValues.uf} onChange={(value) => setManualValues((current) => ({ ...current, uf: value }))} min={1} suffix="$" moneyDecimals={2} />
                  <NumberField id="manual-pension-cap" label="Tope imponible AFP" value={manualValues.pensionCapUf} onChange={(value) => setManualValues((current) => ({ ...current, pensionCapUf: value }))} min={1} suffix="UF" />
                  <NumberField id="manual-afc-cap" label="Tope Seguro de Cesantía" value={manualValues.unemploymentCapUf} onChange={(value) => setManualValues((current) => ({ ...current, unemploymentCapUf: value }))} min={1} suffix="UF" />
                </div>
              </div>}
            </section>
            <div className={`form-grid ${manualParameters ? "single-field" : ""}`}>
              {!manualParameters && <SelectField id="afp" label="AFP" value={input.afp} onChange={(value) => update("afp", value as CalculationInput["afp"])}>
                {Object.entries(afpNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </SelectField>}
              <SelectField id="health" label="Sistema de salud" value={input.healthSystem} onChange={(value) => update("healthSystem", value as CalculationInput["healthSystem"])}>
                <option value="fonasa">Fonasa</option><option value="isapre">Isapre</option>
              </SelectField>
            </div>
            {input.healthSystem === "isapre" && <NumberField id="isapre-plan" label="Precio total del plan Isapre" value={input.isaprePlanUf} onChange={(value) => update("isaprePlanUf", value)} min={0} suffix="UF" help="Incluye el valor total pactado informado por tu Isapre." />}
            <div className="form-grid">
              <NumberField id="apv" label="APV descontado por empleador" value={input.apv} onChange={(value) => update("apv", value)} min={0} suffix="$" />
              <div className="space-y-2">
                <CheckField id="apv-tax" checked={input.apvTaxDeductible} onChange={(value) => update("apvTaxDeductible", value)} label="Rebaja la base tributable" help="Actívalo solo si corresponde al régimen tributario informado para tu APV." />
                <a className="context-help-link" href={sitePath("legal/apv/")}><Info size={15} /> ¿Qué significa esta rebaja?</a>
              </div>
            </div>
            <details className="advanced-panel">
              <summary>Seguro de cesantía — uso excepcional</summary>
              <div className="space-y-5 pt-5">
                <div className="warning-inline"><AlertTriangle size={18} /><p>Los docentes municipales y SLEP tienen un régimen especial. Actívalo solo si tu liquidación real descuenta AFC.</p></div>
                <CheckField id="afc" checked={input.afcEnabled} onChange={(value) => update("afcEnabled", value)} label="Mi liquidación descuenta AFC" />
                {input.afcEnabled && <SelectField id="contract-type" label="Tipo de vínculo informado" value={input.contractType} onChange={(value) => update("contractType", value as CalculationInput["contractType"])}><option value="indefinite">Indefinido</option><option value="fixed">Plazo fijo</option></SelectField>}
                {input.afcEnabled && input.contractType === "indefinite" && <CheckField id="afc-ended" checked={input.afcContributionEnded} onChange={(value) => update("afcContributionEnded", value)} label="Ya cumplí 11 años de cotizaciones AFC" help="Después de 11 años por la misma relación laboral deja de descontarse el aporte personal de 0,6%." />}
              </div>
            </details>

            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between gap-3"><div><h3 className="font-bold">Otros haberes o descuentos</h3><p className="text-sm text-muted-foreground">Para incentivos locales, asignación familiar, cuotas u otros ítems. Marca RTM solo si el haber es mensual, permanente y no está legalmente excluido.</p></div><Button type="button" variant="outline" size="sm" onClick={addManualItem}><Plus size={16} /> Agregar</Button></div>
              <div className="mt-4 space-y-3">
                {input.manualItems.length === 0 && <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">No agregaste conceptos adicionales.</p>}
                {input.manualItems.map((item) => <div key={item.id} className="manual-row">
                  <Input aria-label="Nombre del concepto" placeholder="Nombre del concepto" value={item.name} onChange={(event) => patchManualItem(item.id, { name: event.target.value })} />
                  <Input aria-label={`Monto de ${item.name || "concepto"}`} type="text" inputMode="numeric" placeholder="Monto" value={item.amount ? integerMoney.format(item.amount) : ""} onChange={(event) => patchManualItem(item.id, { amount: parseMoney(event.target.value) })} />
                  <select aria-label={`Clasificación de ${item.name || "concepto"}`} className="form-control" value={item.kind} onChange={(event) => patchManualItem(item.id, { kind: event.target.value as ManualKind })}>
                    <option value="taxable">Imponible y tributable</option><option value="imposableNonTaxable">Imponible, no tributable</option><option value="nonImposable">No imponible</option><option value="discount">Descuento</option>
                  </select>
                  {item.kind !== "discount" && <label className="manual-rtm-toggle"><input type="checkbox" checked={Boolean(item.countsForMinimum)} onChange={(event) => patchManualItem(item.id, { countsForMinimum: event.target.checked })} /><span>Computa para RTM</span></label>}
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeManualItem(item.id)} aria-label={`Eliminar ${item.name || "concepto"}`}><Trash2 size={18} /></Button>
                </div>)}
              </div>
            </div>
          </CardContent>
        </>}

        {step === 3 && <>
          <CardHeader className="result-heading"><Badge className={manualParameters ? "border-destructive/30 bg-destructive/10 text-destructive" : ""}>{manualParameters ? "Parámetros manuales" : "Estimación lista"}</Badge><CardTitle className="text-3xl">Tu sueldo líquido estimado</CardTitle><div className="result-total" aria-live="polite">{currency.format(result.netSalary)}</div><CardDescription>Mes completo calculado con valores de {P.label.toLowerCase()}. Datos previsionales actualizados el {sourceUpdatedLabel}.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            {result.warnings.length > 0 && <div className="warning-list" role="status"><AlertTriangle size={20} /><div><strong>Revisa estas consideraciones</strong><ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div></div>}
            <ResultTable title="Haberes" lines={result.earnings} total={result.totalEarnings} positive />
            <ResultTable title="Descuentos" lines={result.discounts} total={result.totalDiscounts} />
            <div className="base-grid"><div><span>Base imponible</span><strong>{currency.format(result.imposableBase)}</strong></div><div><span>Base tributable</span><strong>{currency.format(result.taxableBase)}</strong></div><div><span>RTM aplicable</span><strong>{currency.format(result.minimumTarget)}</strong></div></div>
            <div className="flex flex-col gap-3 sm:flex-row"><Button type="button" onClick={() => window.print()}><Printer size={18} /> Imprimir o guardar PDF</Button><Button type="button" variant="outline" onClick={() => goTo(0)}>Nueva simulación</Button></div>
            <p className="text-xs leading-5 text-muted-foreground">Esta herramienta entrega una estimación informativa y no reemplaza la liquidación emitida por tu empleador ni asesoría profesional.</p>
          </CardContent>
        </>}

        <div className={`flex items-center border-t border-border bg-muted/30 p-4 md:px-8 print:hidden ${step === 0 ? "justify-end" : "justify-between"}`}>
          {step > 0 && <Button type="button" variant="ghost" onClick={() => goTo(step - 1)}><ArrowLeft size={17} /> Anterior</Button>}
          {step < 3 && <Button type="button" onClick={() => !currentStepInvalid && goTo(step + 1)} disabled={currentStepInvalid}>{step === 2 ? "Ver resultado" : "Continuar"}<ArrowRight size={17} /></Button>}
        </div>
      </Card>

      <aside className="hidden lg:block print:hidden" aria-label="Resumen en vivo">
        <div className="sticky top-24 space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-primary p-6 text-primary-foreground"><p className="text-sm font-medium opacity-80">Líquido estimado</p><p className="mt-2 text-3xl font-extrabold tracking-tight" aria-live="polite">{currency.format(result.netSalary)}</p></div>
            <CardContent className="space-y-4 pt-6">
              <SummaryRow label="Total haberes" value={result.totalEarnings} positive />
              <SummaryRow label="Total descuentos" value={result.totalDiscounts} />
              <div className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground"><Info size={15} className="mb-1 inline text-primary" /> Se actualiza mientras completas tus antecedentes.</div>
            </CardContent>
          </Card>
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5 text-sm"><div className="flex items-center gap-2 font-bold text-primary"><FileText size={17} /> Cálculo trazable</div><p className="mt-2 leading-6 text-muted-foreground">Cada concepto automático enlaza a su fórmula y fuente legal.</p></div>
        </div>
      </aside>
    </div>
  </section>;
}

function SummaryRow({ label, value, positive = false }: { label: string; value: number; positive?: boolean }) {
  return <div className="flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><strong className={positive ? "text-emerald-700 dark:text-emerald-400" : ""}>{currency.format(value)}</strong></div>;
}

function ResultTable({ title, lines, total, positive = false }: { title: string; lines: ReturnType<typeof calculateTeacherSalary>["earnings"]; total: number; positive?: boolean }) {
  return <section aria-labelledby={`result-${title}`}>
    <div className="mb-3 flex items-end justify-between"><h3 id={`result-${title}`} className="text-lg font-bold">{title}</h3><strong className={positive ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}>{currency.format(total)}</strong></div>
    <div className="overflow-hidden rounded-2xl border border-border">
      {lines.filter((line) => line.amount > 0).map((line) => <div key={line.id} className="result-row"><div><span>{line.label}</span><small>{line.imposable ? "Imponible" : "No imponible"}{line.taxable ? " · tributable" : ""}</small></div><div className="flex items-center gap-2">{line.legalSlug && <a href={sitePath(`legal/${line.legalSlug}/`)} aria-label={`Ver respaldo legal de ${line.label}`} title="Ver respaldo legal"><FileText size={15} /></a>}<strong>{currency.format(line.amount)}</strong></div></div>)}
    </div>
  </section>;
}
