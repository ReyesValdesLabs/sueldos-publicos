import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, FileText, Info, Plus, Printer, ShieldCheck, Trash2 } from "lucide-react";
import { JULY_2026_ASSISTANT_PARAMETERS as A } from "@/data/parameters/assistants-2026-07";
import { calculateAssistantSalary } from "@/lib/assistant-calculation/calculate";
import type { AssistantCalculationInput } from "@/lib/assistant-calculation/types";
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
const steps = ["Contrato", "Asignaciones", "Previsión y extras", "Resultado"];
export const ASSISTANT_EXPERIENCE_FIELD = {
  label: "Bienios reconocidos para esta asignación",
  help: "Incluye los que el SLEP reconoce por servicios previos al traspaso como asistente con el sostenedor municipal; 2% del mínimo técnico por bienio, máximo 15.",
} as const;

function parseMoney(value: string) {
  const parsed = Number(value.replace(/\D/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

const initialInput: AssistantCalculationInput = {
  weeklyHours: 44,
  countedRemuneration: A.technicalMinimum44h,
  biennia: 0,
  priorityAllowance: 0,
  difficultConditionsPercentage: 0,
  zonePercentage: 0,
  zonePreviousMonthGross: A.technicalMinimum44h,
  territorialAllowance: 0,
  academicExcellenceBonus: 0,
  law19464Increase: 0,
  afp: "habitat",
  healthSystem: "fonasa",
  isaprePlanUf: 0,
  apv: 0,
  apvTaxDeductible: false,
  contractType: "indefinite",
  afcContributionEnded: false,
  manualItems: [],
};

function SelectField({ id, label, value, onChange, children, help }: { id: string; label: string; value: string; onChange: (value: string) => void; children: ReactNode; help?: string }) {
  return <div className="field-group">
    <Label htmlFor={id}>{label}</Label>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="form-control" aria-describedby={help ? `${id}-help` : undefined}>{children}</select>
    {help && <p id={`${id}-help`} className="field-help">{help}</p>}
  </div>;
}

function NumberField({ id, label, value, onChange, min = 0, max, suffix, help, error }: { id: string; label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; suffix?: string; help?: string; error?: string }) {
  const money = suffix === "$";
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? (money ? integerMoney.format(value) : value);
  const describedBy = [help ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  const handleInput = (raw: string) => {
    if (!raw) {
      setDraft("");
      onChange(0);
      return;
    }
    setDraft(null);
    onChange(money ? parseMoney(raw) : Number(raw));
  };
  return <div className="field-group">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Input id={id} type={money ? "text" : "number"} inputMode={money ? "numeric" : undefined} min={money ? undefined : min} max={money ? undefined : max} value={display} onInput={(event) => handleInput(event.currentTarget.value)} onBlur={() => setDraft(null)} aria-describedby={describedBy} aria-invalid={Boolean(error)} className={`form-control${suffix ? " pr-16" : ""}`} />
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

export default function AssistantCalculator({ embedded = false }: { embedded?: boolean }) {
  const [step, setStep] = useState(0);
  const [remunerationEdited, setRemunerationEdited] = useState(false);
  const [zoneGrossEdited, setZoneGrossEdited] = useState(false);
  const [input, setInput] = useState<AssistantCalculationInput>(initialInput);
  const result = useMemo(() => calculateAssistantSalary(input), [input]);
  const update = <K extends keyof AssistantCalculationInput>(key: K, value: AssistantCalculationInput[K]) => setInput((current) => ({ ...current, [key]: value }));
  const hoursError = !Number.isInteger(input.weeklyHours) || input.weeklyHours < 1 || input.weeklyHours > 44 ? "Ingresa una jornada completa entre 1 y 44 horas." : undefined;
  const bienniaError = !Number.isInteger(input.biennia) || input.biennia < 0 || input.biennia > 15 ? "Ingresa un número entero entre 0 y 15." : undefined;
  const difficultError = input.difficultConditionsPercentage < 0 || input.difficultConditionsPercentage > 100 ? "Ingresa un porcentaje entre 0 y 100." : undefined;
  const zoneError = input.zonePercentage < 0 || input.zonePercentage > 600 ? "Ingresa un porcentaje entre 0 y 600." : undefined;
  const zoneGrossError = input.zonePercentage > 0 && input.zonePreviousMonthGross <= 0 ? "Ingresa la remuneración bruta efectiva del mes anterior." : undefined;
  const currentStepInvalid = (step === 0 && Boolean(hoursError)) || (step === 1 && Boolean(bienniaError || difficultError || zoneError || zoneGrossError));
  const minimumForHours = Math.round(A.technicalMinimum44h * Math.min(44, Math.max(0, input.weeklyHours || 0)) / 44);

  const updateHours = (value: number) => {
    setInput((current) => ({
      ...current,
      weeklyHours: value,
      countedRemuneration: remunerationEdited ? current.countedRemuneration : Math.round(A.technicalMinimum44h * Math.min(44, Math.max(0, value || 0)) / 44),
      zonePreviousMonthGross: zoneGrossEdited ? current.zonePreviousMonthGross : Math.round(A.technicalMinimum44h * Math.min(44, Math.max(0, value || 0)) / 44),
    }));
  };
  const addManualItem = () => update("manualItems", [...input.manualItems, { id: crypto.randomUUID(), name: "", amount: 0, kind: "imposableTaxable" }]);
  const patchManualItem = (id: string, patch: Partial<ManualItem>) => update("manualItems", input.manualItems.map((item) => item.id === id ? { ...item, ...patch } : item));
  const removeManualItem = (id: string) => update("manualItems", input.manualItems.filter((item) => item.id !== id));
  const goTo = (nextStep: number) => {
    setStep(Math.min(3, Math.max(0, nextStep)));
    document.querySelector("#calculadora")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <section id={embedded ? undefined : "calculadora"} className="scroll-mt-24" aria-labelledby="assistant-calculator-title">
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <Badge>Categoría técnica SLEP · {A.label}</Badge>
        <h2 id="assistant-calculator-title" className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">Calcula tu liquidación como técnico/a en párvulos</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">Para asistentes de la educación contratados por un SLEP y clasificados en la categoría técnica. Los datos se procesan solo en tu navegador.</p>
      </div>
      <a href={sitePath("legal/asistentes-minimo-experiencia/")} className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:underline"><ShieldCheck size={18} /> Ver respaldo legal</a>
    </div>

    <nav aria-label="Progreso de la calculadora" className="stepper">
      {steps.map((name, index) => <button key={name} type="button" onClick={() => index < step && goTo(index)} disabled={index > step} aria-current={index === step ? "step" : undefined} className="step-item"><span>{index < step ? <Check size={15} /> : index + 1}</span><small>{name}</small></button>)}
    </nav>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <Card className="overflow-hidden">
        {step === 0 && <>
          <CardHeader><CardTitle>¿Esta calculadora corresponde a tu contrato?</CardTitle><CardDescription>Revisa estas tres condiciones antes de completar los datos.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <section className="scope-eligibility" aria-labelledby="scope-eligibility-title">
              <h3 id="scope-eligibility-title">Debes cumplir las tres:</h3>
              <ol className="scope-criteria">
                <li><span>1</span><div><strong>Empleador</strong><small>Tu contrato es directamente con un SLEP.</small></div></li>
                <li><span>2</span><div><strong>Lugar de trabajo</strong><small>Trabajas en una escuela o liceo, no en un jardín VTF.</small></div></li>
                <li><span>3</span><div><strong>Categoría</strong><small>Tu contrato indica “técnico/a” o “categoría técnica” como asistente de la educación.</small></div></li>
              </ol>
            </section>
            <div className="scope-exclusion"><Info size={18} /><p><strong>No uses esta calculadora</strong> si eres educadora de párvulos profesional en Carrera Docente o si trabajas para JUNJI, Integra, una municipalidad o en un jardín VTF.</p></div>
            <div className="form-grid assistant-contract-fields">
              <NumberField id="assistant-hours" label="Horas semanales de contrato" value={input.weeklyHours} onChange={updateHours} min={1} max={44} suffix="horas" error={hoursError} />
              <NumberField id="assistant-counted-remuneration" label="Remuneración mensual que computa para el mínimo" value={input.countedRemuneration} onChange={(value) => { setRemunerationEdited(true); update("countedRemuneration", value); }} suffix="$" help="Suma del contrato y liquidación antes de las asignaciones que la ley excluye del piso." />
            </div>
            <div className="legal-value-card">
              <div className="legal-value-summary"><span>Mínimo bruto técnico estimado</span><strong>{currency.format(minimumForHours)}</strong><small>{currency.format(A.technicalMinimum44h)} para 44 h, proporcional a tu jornada.</small></div>
              <a className="check-field no-underline" href={sitePath("legal/asistentes-minimo-experiencia/")}><FileText size={20} className="text-primary" /><span><strong>Qué entra en este mínimo</strong><small>Revisa las exclusiones antes de copiar tu liquidación.</small></span></a>
            </div>
          </CardContent>
        </>}

        {step === 1 && <>
          <CardHeader><CardTitle>Experiencia y asignaciones</CardTitle><CardDescription>La experiencia se calcula automáticamente. Ingresa otros beneficios solo si están reconocidos en tu liquidación o establecimiento.</CardDescription></CardHeader>
          <CardContent className="space-y-7">
            <div className="form-grid">
              <NumberField id="assistant-biennia" label={ASSISTANT_EXPERIENCE_FIELD.label} value={input.biennia} onChange={(value) => update("biennia", value)} min={0} max={15} help={ASSISTANT_EXPERIENCE_FIELD.help} error={bienniaError} />
              <NumberField id="assistant-priority" label="Asignación por alta concentración" value={input.priorityAllowance} onChange={(value) => update("priorityAllowance", value)} suffix="$" help="Copia el monto mensual reconocido; depende del establecimiento y la jornada." />
            </div>
            <details className="advanced-panel" open>
              <summary>Beneficios especiales del establecimiento</summary>
              <div className="space-y-6 pt-5">
                <div className="form-grid">
                  <NumberField id="assistant-difficult" label="Porcentaje de desempeño difícil 2026" value={input.difficultConditionsPercentage} onChange={(value) => update("difficultConditionsPercentage", value)} min={0} max={100} suffix="%" help="Solo si el establecimiento fue calificado y conoces el porcentaje oficial." error={difficultError} />
                  <NumberField id="assistant-zone-percentage" label="Porcentaje de zona Ley N.º 21.819" value={input.zonePercentage} onChange={(value) => update("zonePercentage", value)} min={0} max={600} suffix="%" help="Usa el porcentaje oficial del artículo 7 del DL N.º 249 para la localidad." error={zoneError} />
                  {input.zonePercentage > 0 && <NumberField id="assistant-zone-previous-gross" label="Bruto del mes anterior para zona" value={input.zonePreviousMonthGross} onChange={(value) => { setZoneGrossEdited(true); update("zonePreviousMonthGross", value); }} suffix="$" help={`La bonificación completa llega hasta $${integerMoney.format(A.zoneBonus.lowerGrossThreshold)} y se reduce hasta desaparecer en $${integerMoney.format(A.zoneBonus.upperGrossThreshold)}.`} error={zoneGrossError} />}
                  <NumberField id="assistant-territorial" label="Beneficio territorial" value={input.territorialAllowance} onChange={(value) => update("territorialAllowance", value)} suffix="$" help="Ingresa el monto que figura en tu liquidación." />
                  <NumberField id="assistant-excellence" label="Bonificación de excelencia académica" value={input.academicExcellenceBonus} onChange={(value) => update("academicExcellenceBonus", value)} suffix="$" />
                  <NumberField id="assistant-law-19464" label="Aumento Ley N.º 19.464" value={input.law19464Increase} onChange={(value) => update("law19464Increase", value)} suffix="$" />
                </div>
              </div>
            </details>
            <div className="warning-inline"><Info size={18} /><p>La zona de la Ley N.º 21.819 se calcula aparte del beneficio territorial: no es imponible ni tributable y, sobre 15% de zona, aplica 50% durante sus primeros doce meses. También se evalúa automáticamente el bono mensual para bajas remuneraciones de 2026.</p></div>
          </CardContent>
        </>}

        {step === 2 && <>
          <CardHeader><CardTitle>Previsión y otros conceptos</CardTitle><CardDescription>Completa los descuentos personales y agrega los conceptos particulares de tu liquidación.</CardDescription></CardHeader>
          <CardContent className="space-y-7">
            <div className="form-grid">
              <SelectField id="assistant-afp" label="AFP" value={input.afp} onChange={(value) => update("afp", value as AssistantCalculationInput["afp"])}>{Object.entries(afpNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
              <SelectField id="assistant-health" label="Sistema de salud" value={input.healthSystem} onChange={(value) => update("healthSystem", value as AssistantCalculationInput["healthSystem"])}><option value="fonasa">Fonasa</option><option value="isapre">Isapre</option></SelectField>
            </div>
            {input.healthSystem === "isapre" && <NumberField id="assistant-isapre" label="Precio total del plan Isapre" value={input.isaprePlanUf} onChange={(value) => update("isaprePlanUf", value)} suffix="UF" />}
            <div className="form-grid">
              <SelectField id="assistant-contract-type" label="Tipo de contrato" value={input.contractType} onChange={(value) => update("contractType", value as AssistantCalculationInput["contractType"])} help="El aporte personal de AFC de 0,6% se descuenta en contratos indefinidos."><option value="indefinite">Indefinido</option><option value="fixed">Plazo fijo</option></SelectField>
              <NumberField id="assistant-apv" label="APV descontado por empleador" value={input.apv} onChange={(value) => update("apv", value)} suffix="$" />
            </div>
            <div className="option-grid">
              {input.contractType === "indefinite" && <CheckField id="assistant-afc-ended" checked={input.afcContributionEnded} onChange={(value) => update("afcContributionEnded", value)} label="Cumplí 11 años de cotizaciones AFC" help="El aporte personal deja de cobrarse para esa relación laboral." />}
              <CheckField id="assistant-apv-tax" checked={input.apvTaxDeductible} onChange={(value) => update("apvTaxDeductible", value)} label="El APV rebaja la base tributable" help="Actívalo solo si corresponde al régimen informado por tu institución." />
            </div>

            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between gap-3"><div><h3 className="font-bold">Otros haberes o descuentos</h3><p className="text-sm text-muted-foreground">Agrega asignación familiar, incentivos locales, cuotas u otros ítems de tu liquidación. Imponibilidad y tributación se clasifican por separado.</p></div><Button type="button" variant="outline" size="sm" onClick={addManualItem}><Plus size={16} /> Agregar</Button></div>
              <div className="mt-4 space-y-3">
                {input.manualItems.length === 0 && <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">No agregaste conceptos adicionales.</p>}
                {input.manualItems.map((item) => <div key={item.id} className="manual-row">
                  <Input aria-label="Nombre del concepto" placeholder="Nombre del concepto" value={item.name} onChange={(event) => patchManualItem(item.id, { name: event.target.value })} />
                  <Input aria-label={`Monto de ${item.name || "concepto"}`} type="text" inputMode="numeric" placeholder="Monto" value={item.amount ? integerMoney.format(item.amount) : ""} onChange={(event) => patchManualItem(item.id, { amount: parseMoney(event.target.value) })} />
                  <select aria-label={`Clasificación de ${item.name || "concepto"}`} className="form-control" value={item.kind} onChange={(event) => patchManualItem(item.id, { kind: event.target.value as ManualKind })}><option value="imposableTaxable">Imponible y tributable</option><option value="imposableNonTaxable">Imponible y no tributable</option><option value="nonImposableTaxable">No imponible y tributable</option><option value="nonImposableNonTaxable">No imponible y no tributable</option><option value="discount">Descuento</option></select>
                  {item.kind !== "discount" && <label className="manual-rtm-toggle"><input type="checkbox" checked={Boolean(item.countsForMinimum)} onChange={(event) => patchManualItem(item.id, { countsForMinimum: event.target.checked })} /><span>Computa para mínimo</span></label>}
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeManualItem(item.id)} aria-label={`Eliminar ${item.name || "concepto"}`}><Trash2 size={18} /></Button>
                </div>)}
              </div>
            </div>
          </CardContent>
        </>}

        {step === 3 && <>
          <CardHeader className="result-heading"><Badge>Estimación lista</Badge><CardTitle className="text-3xl">Tu sueldo líquido estimado</CardTitle><div className="result-total" aria-live="polite">{currency.format(result.netSalary)}</div><CardDescription>Mes completo calculado con valores de {A.label.toLowerCase()}.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            {result.warnings.length > 0 && <div className="warning-list" role="status"><AlertTriangle size={20} /><div><strong>Revisa estas consideraciones</strong><ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div></div>}
            <ResultTable title="Haberes" lines={result.earnings} total={result.totalEarnings} positive />
            <ResultTable title="Descuentos" lines={result.discounts} total={result.totalDiscounts} />
            <div className="base-grid"><div><span>Base imponible</span><strong>{currency.format(result.imposableBase)}</strong></div><div><span>Base tributable</span><strong>{currency.format(result.taxableBase)}</strong></div><div><span>Mínimo técnico aplicable</span><strong>{currency.format(result.minimumTarget)}</strong></div></div>
            <div className="flex flex-col gap-3 sm:flex-row"><Button type="button" onClick={() => window.print()}><Printer size={18} /> Imprimir o guardar PDF</Button><Button type="button" variant="outline" onClick={() => goTo(0)}>Nueva simulación</Button></div>
            <p className="text-xs leading-5 text-muted-foreground">Estimación informativa para categoría técnica SLEP. No reemplaza la liquidación del empleador ni determina por sí sola tu clasificación contractual.</p>
          </CardContent>
        </>}

        <div className={`flex items-center border-t border-border bg-muted/30 p-4 md:px-8 print:hidden ${step === 0 ? "justify-end" : "justify-between"}`}>
          {step > 0 && <Button type="button" variant="ghost" onClick={() => goTo(step - 1)}><ArrowLeft size={17} /> Anterior</Button>}
          {step < 3 && <Button type="button" onClick={() => !currentStepInvalid && goTo(step + 1)} disabled={currentStepInvalid}>{step === 2 ? "Ver resultado" : "Continuar"}<ArrowRight size={17} /></Button>}
        </div>
      </Card>

      <aside className="order-first block print:hidden lg:order-none" aria-label="Resumen en vivo">
        <div className="space-y-4 lg:sticky lg:top-24">
          <Card className="overflow-hidden"><div className="bg-primary p-6 text-primary-foreground"><p className="text-sm font-medium opacity-80">Líquido estimado</p><p className="mt-2 text-3xl font-extrabold tracking-tight" aria-live="polite">{currency.format(result.netSalary)}</p></div><CardContent className="space-y-4 pt-7 md:pt-7"><SummaryRow label="Total haberes" value={result.totalEarnings} positive /><SummaryRow label="Total descuentos" value={result.totalDiscounts} /><SummaryRow label="Experiencia" value={result.earnings.find((line) => line.id === "assistant-experience")?.amount ?? 0} positive /><div className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground"><Info size={15} className="mb-1 inline text-primary" /> Se actualiza mientras completas tus antecedentes.</div></CardContent></Card>
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5 text-sm"><div className="flex items-center gap-2 font-bold text-primary"><FileText size={17} /> Alcance acotado</div><p className="mt-2 leading-6 text-muted-foreground">Categoría técnica en establecimientos escolares dependientes de SLEP. Otros sostenedores usan reglas distintas.</p></div>
        </div>
      </aside>
    </div>
  </section>;
}

function SummaryRow({ label, value, positive = false }: { label: string; value: number; positive?: boolean }) {
  return <div className="flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><strong className={positive ? "text-emerald-700 dark:text-emerald-400" : ""}>{currency.format(value)}</strong></div>;
}

function ResultTable({ title, lines, total, positive = false }: { title: string; lines: ReturnType<typeof calculateAssistantSalary>["earnings"]; total: number; positive?: boolean }) {
  return <section aria-labelledby={`assistant-result-${title}`}><div className="mb-3 flex items-end justify-between"><h3 id={`assistant-result-${title}`} className="text-lg font-bold">{title}</h3><strong className={positive ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}>{currency.format(total)}</strong></div><div className="overflow-hidden rounded-2xl border border-border">{lines.filter((line) => line.amount > 0).map((line) => <div key={line.id} className="result-row"><div><span>{line.label}</span><small>{line.imposable ? "Imponible" : "No imponible"} · {line.taxable ? "tributable" : "no tributable"}</small></div><div className="flex items-center gap-2">{line.legalSlug && <a href={sitePath(`legal/${line.legalSlug}/`)} aria-label={`Ver respaldo legal de ${line.label}`}><FileText size={15} /></a>}<strong>{currency.format(line.amount)}</strong></div></div>)}</div></section>;
}
