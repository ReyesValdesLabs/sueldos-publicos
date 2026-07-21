import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CircleHelp, ExternalLink, FileText, Info, Plus, Printer, ShieldCheck, Trash2, X } from "lucide-react";
import { JULY_2026_DAEM_ASSISTANT_PARAMETERS as D } from "@/data/parameters/daem-assistants-2026-07";
import { calculateDaemAssistantSalary, calculateDaemMinimumIncome } from "@/lib/daem-assistant-calculation/calculate";
import type { DaemAssistantCalculationInput } from "@/lib/daem-assistant-calculation/types";
import type { ManualItem, ManualKind } from "@/lib/calculation/types";
import { sitePath } from "@/lib/site-path";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const currency = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const integerMoney = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const afpNames = { capital: "Capital", cuprum: "Cuprum", habitat: "Habitat", modelo: "Modelo", planvital: "PlanVital", provida: "Provida", uno: "Uno" } as const;
const steps = ["Contrato", "Haberes DAEM", "Previsión y extras", "Resultado"];
const initialMinimumIncome = calculateDaemMinimumIncome(44);

type FieldHelpKey = "law19464" | "seniority" | "priority" | "excellence" | "difficult";

const fieldHelp = {
  law19464: {
    title: "Bono Ley N.º 19.464 para asistentes",
    status: "No es un monto fijo nacional por persona",
    summary: "La ley financia un aumento para asistentes de la educación, pero el empleador distribuye los recursos según las reglas aplicables. Por eso dos personas con la misma jornada pueden ver montos diferentes.",
    steps: ["Busca en tu liquidación una línea como “Bono Ley 19.464”, “Aumento Ley 19.464” o similar.", "Ingresa el monto mensual exacto de esa línea, sin sumarlo otra vez al sueldo base.", "Si no aparece o no estás seguro/a, déjalo en $0 y consulta a remuneraciones."],
    source: { label: "Ley N.º 19.464", url: "https://www.bcn.cl/leychile/navegar?idNorma=30831" },
  },
  seniority: {
    title: "Antigüedad o bienios municipales",
    status: "No existe un bienio DAEM único para todo Chile",
    summary: "En un contrato DAEM/DEM este haber puede provenir del contrato individual, un instrumento colectivo o una regla local. No corresponde aplicar automáticamente el 2% por bienio propio de los SLEP.",
    steps: ["Busca una línea llamada “Antigüedad”, “Bienios”, “Asignación de experiencia” o similar.", "Copia el monto mensual efectivamente pagado.", "Si tu contrato o liquidación no reconoce este haber, déjalo en $0."],
    source: { label: "Respaldo sobre remuneraciones DAEM/DEM", url: sitePath("legal/asistentes-daem-remuneraciones/") },
  },
  priority: {
    title: "Alta concentración de alumnos prioritarios",
    status: "Tiene reglas legales, pero no un valor universal",
    summary: "El derecho depende de la concentración oficialmente reconocida para el establecimiento, su ruralidad y la jornada. El monto máximo se reajusta, por lo que aquí conviene usar el valor confirmado por el empleador.",
    steps: ["Revisa si tu liquidación incluye una asignación por alta concentración o alumnos prioritarios.", "Copia el monto mensual indicado, no el porcentaje de alumnos del establecimiento.", "Si no figura, déjalo en $0 y confirma el beneficio con remuneraciones usando el RBD de tu escuela o liceo."],
    source: { label: "Ley N.º 21.109, artículo 44", url: "https://www.bcn.cl/leychile/navegar?idNorma=1123513" },
  },
  excellence: {
    title: "Bonificación de excelencia académica",
    status: "Depende del resultado SNED del establecimiento",
    summary: "No es una cantidad fija para cada trabajador. El establecimiento debe estar seleccionado por el SNED y el pago individual depende de la distribución correspondiente.",
    steps: ["Busca en tu liquidación una línea como “Excelencia académica”, “SNED” o similar.", "Ingresa solo el monto pagado en el mes que estás simulando.", "Si no aparece, déjalo en $0. Puedes consultar el resultado del establecimiento usando su RBD."],
    source: { label: "Resultados SNED 2026–2027", url: "https://sned.mineduc.cl/" },
  },
  difficult: {
    title: "Porcentaje de desempeño difícil",
    status: "La calculadora sí obtiene el monto automáticamente",
    summary: "La ley fija la fórmula para 2026, pero necesitas el porcentaje oficial asignado al establecimiento. No debes ingresar aquí un monto en pesos.",
    steps: ["Busca el porcentaje en la comunicación del empleador o consulta a remuneraciones con el RBD del establecimiento.", "Ingresa solo el número del porcentaje; por ejemplo, 10 para un 10%.", "Si el establecimiento no fue calificado o desconoces el porcentaje, deja 0%."],
    source: { label: "Ley N.º 21.806, artículo 11", url: "https://www.bcn.cl/leychile/navegar?idNorma=1221118" },
  },
} as const;

const initialInput: DaemAssistantCalculationInput = {
  weeklyHours: 44,
  contractRemuneration: initialMinimumIncome,
  previousMonthGross: initialMinimumIncome,
  law19464Increase: 0,
  localSeniorityAllowance: 0,
  priorityAllowance: 0,
  academicExcellenceBonus: 0,
  difficultConditionsPercentage: 0,
  afp: "habitat",
  healthSystem: "fonasa",
  isaprePlanUf: 0,
  apv: 0,
  apvTaxDeductible: false,
  contractType: "indefinite",
  afcContributionEnded: false,
  manualItems: [],
};

function parseMoney(value: string) {
  const parsed = Number(value.replace(/\D/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function SelectField({ id, label, value, onChange, children, help }: { id: string; label: string; value: string; onChange: (value: string) => void; children: ReactNode; help?: string }) {
  return <div className="field-group"><Label htmlFor={id}>{label}</Label><select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="form-control" aria-describedby={help ? `${id}-help` : undefined}>{children}</select>{help && <p id={`${id}-help`} className="field-help">{help}</p>}</div>;
}

function NumberField({ id, label, value, onChange, min = 0, max, suffix, help, error, onInfo }: { id: string; label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; suffix?: string; help?: string; error?: string; onInfo?: () => void }) {
  const money = suffix === "$";
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? (money ? (value ? integerMoney.format(value) : "") : value);
  const describedBy = [help ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  const handleInput = (raw: string) => {
    if (!raw) { setDraft(""); onChange(0); return; }
    setDraft(null);
    onChange(money ? parseMoney(raw) : Number(raw));
  };
  return <div className="field-group"><div className="field-label-row"><Label htmlFor={id}>{label}</Label>{onInfo && <button type="button" className="field-info-button" onClick={onInfo} aria-label={`Más información sobre ${label}`}><CircleHelp size={15} /> Cómo obtenerlo</button>}</div><div className="relative"><Input id={id} type={money ? "text" : "number"} inputMode={money ? "numeric" : undefined} min={money ? undefined : min} max={money ? undefined : max} value={display} onInput={(event) => handleInput(event.currentTarget.value)} onBlur={() => setDraft(null)} aria-describedby={describedBy} aria-invalid={Boolean(error)} className={`form-control${suffix ? " pr-16" : ""}`} />{suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">{suffix}</span>}</div>{help && <p id={`${id}-help`} className="field-help">{help}</p>}{error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}</div>;
}

function FieldHelpDialog({ helpKey, onClose }: { helpKey: FieldHelpKey; onClose: () => void }) {
  const help = fieldHelp[helpKey];
  const titleId = `field-help-${helpKey}`;
  return <div className="field-help-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="field-help-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="field-help-close" onClick={onClose} aria-label="Cerrar ayuda" autoFocus><X size={19} /></button>
      <span className="field-help-kicker"><CircleHelp size={17} /> Ayuda para completar el campo</span>
      <h3 id={titleId}>{help.title}</h3>
      <strong className="field-help-status">{help.status}</strong>
      <p>{help.summary}</p>
      <h4>Qué debes ingresar</h4>
      <ol>{help.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      <a href={help.source.url} target={help.source.url.startsWith("http") ? "_blank" : undefined} rel={help.source.url.startsWith("http") ? "noreferrer" : undefined}>{help.source.label} <ExternalLink size={15} /></a>
      <div className="field-help-actions"><Button type="button" onClick={onClose}>Entendido</Button></div>
    </section>
  </div>;
}

function CheckField({ id, checked, onChange, label, help }: { id: string; checked: boolean; onChange: (value: boolean) => void; label: string; help?: string }) {
  return <label htmlFor={id} className="check-field"><input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span className="check-box" aria-hidden="true"><Check size={14} /></span><span><strong>{label}</strong>{help && <small>{help}</small>}</span></label>;
}

export default function DaemAssistantCalculator({ embedded = false }: { embedded?: boolean }) {
  const [step, setStep] = useState(0);
  const [remunerationEdited, setRemunerationEdited] = useState(false);
  const [previousGrossEdited, setPreviousGrossEdited] = useState(false);
  const [activeFieldHelp, setActiveFieldHelp] = useState<FieldHelpKey | null>(null);
  const [input, setInput] = useState<DaemAssistantCalculationInput>(initialInput);
  const result = useMemo(() => calculateDaemAssistantSalary(input), [input]);
  const update = <K extends keyof DaemAssistantCalculationInput>(key: K, value: DaemAssistantCalculationInput[K]) => setInput((current) => ({ ...current, [key]: value }));
  const hoursError = !Number.isInteger(input.weeklyHours) || input.weeklyHours < 1 || input.weeklyHours > 44 ? "Ingresa una jornada completa entre 1 y 44 horas." : undefined;
  const remunerationError = input.contractRemuneration <= 0 ? "Ingresa la remuneración bruta habitual de tu contrato." : undefined;
  const previousGrossError = input.previousMonthGross <= 0 ? "Ingresa el bruto del mes anterior para evaluar el bono del artículo 59." : undefined;
  const difficultError = input.difficultConditionsPercentage < 0 || input.difficultConditionsPercentage > 100 ? "Ingresa un porcentaje entre 0 y 100." : undefined;
  const currentStepInvalid = (step === 0 && Boolean(hoursError || remunerationError || previousGrossError)) || (step === 1 && Boolean(difficultError));
  const minimumIncomeForHours = calculateDaemMinimumIncome(input.weeklyHours);
  const updateHours = (value: number) => setInput((current) => ({
    ...current,
    weeklyHours: value,
    contractRemuneration: remunerationEdited ? current.contractRemuneration : calculateDaemMinimumIncome(value),
    previousMonthGross: previousGrossEdited ? current.previousMonthGross : calculateDaemMinimumIncome(value),
  }));
  const updateContractRemuneration = (value: number) => {
    setRemunerationEdited(true);
    setInput((current) => ({ ...current, contractRemuneration: value }));
  };
  useEffect(() => {
    if (!activeFieldHelp) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setActiveFieldHelp(null);
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeFieldHelp]);
  const addManualItem = () => update("manualItems", [...input.manualItems, { id: crypto.randomUUID(), name: "", amount: 0, kind: "taxable" }]);
  const patchManualItem = (id: string, patch: Partial<ManualItem>) => update("manualItems", input.manualItems.map((item) => item.id === id ? { ...item, ...patch } : item));
  const removeManualItem = (id: string) => update("manualItems", input.manualItems.filter((item) => item.id !== id));
  const goTo = (nextStep: number) => {
    setStep(Math.min(3, Math.max(0, nextStep)));
    document.querySelector("#calculadora")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <section id={embedded ? undefined : "calculadora"} className="scroll-mt-24" aria-labelledby="daem-calculator-title">
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div><Badge>Asistentes DAEM/DEM · {D.label}</Badge><h2 id="daem-calculator-title" className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">Calcula tu liquidación como técnico/a municipal</h2><p className="mt-2 max-w-3xl text-muted-foreground">Para técnicos/as en educación parvularia y otros asistentes de la educación contratados por un DAEM o DEM municipal. Los datos se procesan solo en tu navegador.</p></div>
      <a href={sitePath("legal/asistentes-daem-remuneraciones/")} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:underline"><ShieldCheck size={18} /> Ver respaldo legal</a>
    </div>

    <nav aria-label="Progreso de la calculadora" className="stepper">{steps.map((name, index) => <button key={name} type="button" onClick={() => index < step && goTo(index)} disabled={index > step} aria-current={index === step ? "step" : undefined} className="step-item"><span>{index < step ? <Check size={15} /> : index + 1}</span><small>{name}</small></button>)}</nav>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <Card className="overflow-hidden">
        {step === 0 && <><CardHeader><CardTitle>¿Esta calculadora corresponde a tu contrato?</CardTitle><CardDescription>Revisa estas tres condiciones antes de completar los datos.</CardDescription></CardHeader><CardContent className="space-y-6">
          <section className="scope-eligibility" aria-labelledby="daem-scope-title"><h3 id="daem-scope-title">Debes cumplir las tres:</h3><ol className="scope-criteria"><li><span>1</span><div><strong>Empleador</strong><small>Tu contrato es con un DAEM o DEM de una municipalidad.</small></div></li><li><span>2</span><div><strong>Lugar de trabajo</strong><small>Trabajas en una escuela o liceo municipal todavía no traspasado a SLEP.</small></div></li><li><span>3</span><div><strong>Función</strong><small>Tu contrato indica funciones técnicas o de asistente de la educación.</small></div></li></ol></section>
          <div className="scope-exclusion"><Info size={18} /><p><strong>No uses esta calculadora</strong> si tu empleador ya es un SLEP, si trabajas en un jardín VTF, JUNJI o Integra, o si eres educadora de párvulos profesional afecta a Carrera Docente.</p></div>
          <div className="form-grid"><NumberField id="daem-hours" label="Horas semanales de contrato" value={input.weeklyHours} onChange={updateHours} min={1} max={44} suffix="horas" error={hoursError} /><NumberField id="daem-contract-remuneration" label="Sueldo base mensual" value={input.contractRemuneration} onChange={updateContractRemuneration} suffix="$" help={`Autocompletado con el ingreso mínimo legal estimado: ${currency.format(minimumIncomeForHours)} para tu jornada. Edítalo si tu contrato indica un monto superior.`} error={remunerationError} /></div>
          <NumberField id="daem-previous-gross" label="Remuneración bruta del mes anterior" value={input.previousMonthGross} onChange={(value) => { setPreviousGrossEdited(true); update("previousMonthGross", value); }} suffix="$" help={`Autocompletado con el mínimo legal estimado para tu jornada. Reemplázalo por el bruto efectivo del mes anterior; el límite 2026 para el bono es ${currency.format(D.article59Bonus.previousMonthGrossLimit)}.`} error={previousGrossError} />
          <div className="legal-value-card"><div className="legal-value-summary"><span>Bono artículo 59 estimado</span><strong>{currency.format(result.article59Bonus)}</strong><small>Hasta {currency.format(D.article59Bonus.maximum44h)} a 44 h, proporcional a tu jornada.</small></div><a className="check-field no-underline" href={sitePath("legal/asistentes-daem-bonos-2026/")}><FileText size={20} className="text-primary" /><span><strong>Por qué pedimos el mes anterior</strong><small>El límite de acceso se revisa con esa remuneración bruta.</small></span></a></div>
        </CardContent></>}

        {step === 1 && <><CardHeader><CardTitle>Haberes propios del régimen municipal</CardTitle><CardDescription>Los cuatro montos en pesos se copian desde tu contrato o liquidación. Solo desempeño difícil se calcula aquí usando el porcentaje oficial.</CardDescription></CardHeader><CardContent className="space-y-7">
          <div className="warning-inline"><Info size={18} /><p><strong>Aquí no se aplica el piso técnico de $668.412 ni el 2% por bienio de los SLEP.</strong> Si tu municipio reconoce antigüedad, ingresa el monto mensual que figura en tu liquidación.</p></div>
          <div className="form-grid"><NumberField id="daem-law-19464" label="Bono Ley N.º 19.464 para asistentes" value={input.law19464Increase} onChange={(value) => update("law19464Increase", value)} suffix="$" help="Nombre legal: aumento de remuneraciones. Copia tu monto personal." onInfo={() => setActiveFieldHelp("law19464")} /><NumberField id="daem-local-seniority" label="Antigüedad o bienios municipales" value={input.localSeniorityAllowance} onChange={(value) => update("localSeniorityAllowance", value)} suffix="$" help="Monto local: solo si tu empleador lo reconoce." onInfo={() => setActiveFieldHelp("seniority")} /><NumberField id="daem-priority" label="Alta concentración de alumnos prioritarios" value={input.priorityAllowance} onChange={(value) => update("priorityAllowance", value)} suffix="$" help="Copia el monto pagado, no el porcentaje del establecimiento." onInfo={() => setActiveFieldHelp("priority")} /><NumberField id="daem-excellence" label="Bonificación de excelencia académica" value={input.academicExcellenceBonus} onChange={(value) => update("academicExcellenceBonus", value)} suffix="$" help="Ingresa el pago SNED que aparezca en el mes simulado." onInfo={() => setActiveFieldHelp("excellence")} /></div>
          <details className="advanced-panel" open><summary>Asignación automática por desempeño difícil</summary><div className="pt-5"><NumberField id="daem-difficult" label="Porcentaje oficial del establecimiento" value={input.difficultConditionsPercentage} onChange={(value) => update("difficultConditionsPercentage", value)} min={0} max={100} suffix="%" help="Ingresa el porcentaje; la calculadora obtiene automáticamente el monto 2026." error={difficultError} onInfo={() => setActiveFieldHelp("difficult")} /></div></details>
          <div className="scope-note"><Info size={18} /><p>La calculadora evalúa además el bono mensual de bajas remuneraciones 2026 usando los haberes de esta simulación.</p></div>
        </CardContent></>}

        {step === 2 && <><CardHeader><CardTitle>Previsión y otros conceptos</CardTitle><CardDescription>Completa tus descuentos personales y cualquier ítem que no aparezca en los campos anteriores.</CardDescription></CardHeader><CardContent className="space-y-7">
          <div className="form-grid"><SelectField id="daem-afp" label="AFP" value={input.afp} onChange={(value) => update("afp", value as DaemAssistantCalculationInput["afp"])}>{Object.entries(afpNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField><SelectField id="daem-health" label="Sistema de salud" value={input.healthSystem} onChange={(value) => update("healthSystem", value as DaemAssistantCalculationInput["healthSystem"])}><option value="fonasa">Fonasa</option><option value="isapre">Isapre</option></SelectField></div>
          {input.healthSystem === "isapre" && <NumberField id="daem-isapre" label="Precio total del plan Isapre" value={input.isaprePlanUf} onChange={(value) => update("isaprePlanUf", value)} suffix="UF" />}
          <div className="form-grid"><SelectField id="daem-contract-type" label="Tipo de contrato" value={input.contractType} onChange={(value) => update("contractType", value as DaemAssistantCalculationInput["contractType"])} help="El 0,6% personal de AFC corresponde a contratos indefinidos."><option value="indefinite">Indefinido</option><option value="fixed">Plazo fijo</option></SelectField><NumberField id="daem-apv" label="APV descontado por empleador" value={input.apv} onChange={(value) => update("apv", value)} suffix="$" /></div>
          <div className="option-grid">{input.contractType === "indefinite" && <CheckField id="daem-afc-ended" checked={input.afcContributionEnded} onChange={(value) => update("afcContributionEnded", value)} label="Cumplí 11 años de cotizaciones AFC" help="El aporte personal deja de cobrarse para esa relación laboral." />}<CheckField id="daem-apv-tax" checked={input.apvTaxDeductible} onChange={(value) => update("apvTaxDeductible", value)} label="El APV rebaja la base tributable" help="Actívalo solo si corresponde al régimen informado por tu institución." /></div>
          <div className="border-t border-border pt-6"><div className="flex items-center justify-between gap-3"><div><h3 className="font-bold">Otros haberes o descuentos</h3><p className="text-sm text-muted-foreground">Agrega asignación familiar, bonos locales, cuotas u otros ítems.</p></div><Button type="button" variant="outline" size="sm" onClick={addManualItem}><Plus size={16} /> Agregar</Button></div><div className="mt-4 space-y-3">{input.manualItems.length === 0 && <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">No agregaste conceptos adicionales.</p>}{input.manualItems.map((item) => <div key={item.id} className="manual-row daem-manual-row"><Input aria-label="Nombre del concepto" placeholder="Nombre del concepto" value={item.name} onChange={(event) => patchManualItem(item.id, { name: event.target.value })} /><Input aria-label={`Monto de ${item.name || "concepto"}`} type="text" inputMode="numeric" placeholder="Monto" value={item.amount ? integerMoney.format(item.amount) : ""} onChange={(event) => patchManualItem(item.id, { amount: parseMoney(event.target.value) })} /><select aria-label={`Clasificación de ${item.name || "concepto"}`} className="form-control" value={item.kind} onChange={(event) => patchManualItem(item.id, { kind: event.target.value as ManualKind })}><option value="taxable">Imponible y tributable</option><option value="imposableNonTaxable">Imponible, no tributable</option><option value="nonImposable">No imponible</option><option value="discount">Descuento</option></select><Button type="button" variant="ghost" size="icon" onClick={() => removeManualItem(item.id)} aria-label={`Eliminar ${item.name || "concepto"}`}><Trash2 size={18} /></Button></div>)}</div></div>
        </CardContent></>}

        {step === 3 && <><CardHeader className="result-heading"><Badge>Estimación lista</Badge><CardTitle className="text-3xl">Tu sueldo líquido estimado</CardTitle><div className="result-total" aria-live="polite">{currency.format(result.netSalary)}</div><CardDescription>Mes completo calculado con valores de {D.label.toLowerCase()}.</CardDescription></CardHeader><CardContent className="space-y-6">
          {result.warnings.length > 0 && <div className="warning-list" role="status"><AlertTriangle size={20} /><div><strong>Revisa estas consideraciones</strong><ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div></div>}
          <ResultTable title="Haberes" lines={result.earnings} total={result.totalEarnings} positive /><ResultTable title="Descuentos" lines={result.discounts} total={result.totalDiscounts} />
          <div className="base-grid daem-base-grid"><div><span>Base imponible</span><strong>{currency.format(result.imposableBase)}</strong></div><div><span>Base tributable</span><strong>{currency.format(result.taxableBase)}</strong></div><div><span>Bono artículo 59</span><strong>{currency.format(result.article59Bonus)}</strong></div><div><span>Bono bajas rentas</span><strong>{currency.format(result.lowIncomeBonus)}</strong></div></div>
          <div className="flex flex-col gap-3 sm:flex-row"><Button type="button" onClick={() => window.print()}><Printer size={18} /> Imprimir o guardar PDF</Button><Button type="button" variant="outline" onClick={() => goTo(0)}>Nueva simulación</Button></div><p className="text-xs leading-5 text-muted-foreground">Estimación informativa para asistentes de la educación contratados bajo DAEM/DEM municipal. No reemplaza la liquidación del empleador ni determina por sí sola tu régimen contractual.</p>
        </CardContent></>}

        <div className={`flex items-center border-t border-border bg-muted/30 p-4 md:px-8 print:hidden ${step === 0 ? "justify-end" : "justify-between"}`}>{step > 0 && <Button type="button" variant="ghost" onClick={() => goTo(step - 1)}><ArrowLeft size={17} /> Anterior</Button>}{step < 3 && <Button type="button" onClick={() => !currentStepInvalid && goTo(step + 1)} disabled={currentStepInvalid}>{step === 2 ? "Ver resultado" : "Continuar"}<ArrowRight size={17} /></Button>}</div>
      </Card>

      <aside className="hidden lg:block print:hidden" aria-label="Resumen en vivo"><div className="sticky top-24 space-y-4"><Card className="overflow-hidden"><div className="bg-primary p-6 text-primary-foreground"><p className="text-sm font-medium opacity-80">Líquido estimado</p><p className="mt-2 text-3xl font-extrabold tracking-tight" aria-live="polite">{currency.format(result.netSalary)}</p></div><CardContent className="space-y-4 pt-6"><SummaryRow label="Total haberes" value={result.totalEarnings} positive /><SummaryRow label="Total descuentos" value={result.totalDiscounts} /><SummaryRow label="Bono artículo 59" value={result.article59Bonus} positive /><SummaryRow label="Bono bajas rentas" value={result.lowIncomeBonus} positive /><div className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground"><Info size={15} className="mb-1 inline text-primary" /> Se actualiza mientras completas tus antecedentes.</div></CardContent></Card><div className="rounded-2xl border border-primary/15 bg-primary/5 p-5 text-sm"><div className="flex items-center gap-2 font-bold text-primary"><FileText size={17} /> Alcance acotado</div><p className="mt-2 leading-6 text-muted-foreground">Contrato DAEM/DEM en escuela o liceo municipal. SLEP, VTF, JUNJI e Integra usan reglas diferentes.</p></div></div></aside>
    </div>
    {activeFieldHelp && <FieldHelpDialog helpKey={activeFieldHelp} onClose={() => setActiveFieldHelp(null)} />}
  </section>;
}

function SummaryRow({ label, value, positive = false }: { label: string; value: number; positive?: boolean }) {
  return <div className="flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><strong className={positive ? "text-emerald-700 dark:text-emerald-400" : ""}>{currency.format(value)}</strong></div>;
}

function ResultTable({ title, lines, total, positive = false }: { title: string; lines: ReturnType<typeof calculateDaemAssistantSalary>["earnings"]; total: number; positive?: boolean }) {
  return <section aria-labelledby={`daem-result-${title}`}><div className="mb-3 flex items-end justify-between"><h3 id={`daem-result-${title}`} className="text-lg font-bold">{title}</h3><strong className={positive ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}>{currency.format(total)}</strong></div><div className="overflow-hidden rounded-2xl border border-border">{lines.filter((line) => line.amount > 0).map((line) => <div key={line.id} className="result-row"><div><span>{line.label}</span><small>{line.imposable ? "Imponible" : "No imponible"}{line.taxable ? " · tributable" : ""}</small></div><div className="flex items-center gap-2">{line.legalSlug && <a href={sitePath(`legal/${line.legalSlug}/`)} aria-label={`Ver respaldo legal de ${line.label}`}><FileText size={15} /></a>}<strong>{currency.format(line.amount)}</strong></div></div>)}</div></section>;
}
