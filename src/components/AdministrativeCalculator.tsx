import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  FileText,
  Info,
  Landmark,
  Plus,
  Printer,
  RefreshCw,
  School,
  Trash2,
} from "lucide-react";
import { JULY_2026_DAEM_ASSISTANT_PARAMETERS as D } from "@/data/parameters/daem-assistants-2026-07";
import {
  calculateAdministrativeMinimumIncome,
  calculateAdministrativeSalary,
  getAdministrativeMaximumWeeklyHours,
} from "@/lib/administrative-calculation/calculate";
import type {
  AdministrativeCalculationInput,
  AdministrativeRegime,
} from "@/lib/administrative-calculation/types";
import type { ManualItem, ManualKind, ResultLine } from "@/lib/calculation/types";
import { sitePath } from "@/lib/site-path";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const currency = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const integerMoney = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });
const steps = ["Régimen", "Haberes", "Previsión", "Resultado"];
const initialMinimumIncome = calculateAdministrativeMinimumIncome(44);

const regimeDetails = {
  educationEstablishment: {
    eyebrow: "Escuela o liceo municipal",
    title: "Administrativo/a asistente de la educación",
    description: "Trabajo dentro de un establecimiento municipal administrado por DAEM/DEM y mi contrato reconoce funciones administrativas de asistente.",
    icon: School,
  },
  daemCentral: {
    eyebrow: "Nivel central de educación",
    title: "Administrativo/a del DAEM o DEM",
    description: "Trabajo en las oficinas centrales del DAEM/DEM bajo el Código del Trabajo y no tengo nombramiento municipal de planta o contrata.",
    icon: Landmark,
  },
  municipalStatute: {
    eyebrow: "Municipalidad o DAEM/DEM",
    title: "Funcionario/a de planta o contrata",
    description: "Tengo nombramiento municipal, estamento y grado bajo la Ley N.º 18.883, aunque esté destinado/a al DAEM/DEM.",
    icon: Building2,
  },
} as const;

const initialInput: AdministrativeCalculationInput = {
  regime: "educationEstablishment",
  ageBracket: "adult",
  weeklyHours: 44,
  baseSalary: initialMinimumIncome,
  previousMonthGross: initialMinimumIncome,
  law19464Increase: 0,
  localSeniorityAllowance: 0,
  priorityAllowance: 0,
  academicExcellenceBonus: 0,
  difficultConditionsPercentage: 0,
  municipalGrade: 18,
  municipalAllowance: 0,
  municipalBiennia: 0,
  managementAllowanceQuarterlyPayment: 0,
  applyLowIncomeBonus: true,
  pensionStatus: "afpContributor",
  afp: "habitat",
  healthSystem: "fonasa",
  isaprePlanUf: 0,
  apv: 0,
  apvTaxDeductible: false,
  contractType: "indefinite",
  afcContributionEnded: false,
  manualItems: [],
};

function regimeFromUrl(): AdministrativeRegime | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("caso");
  return value === "educationEstablishment"
    || value === "daemCentral"
    || value === "municipalStatute"
    ? value
    : null;
}

function parseMoney(value: string) {
  const parsed = Number(value.replace(/\D/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max,
  step,
  suffix,
  help,
  error,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  help?: string;
  error?: string;
}) {
  const money = suffix === "$";
  const display = money ? (value ? integerMoney.format(value) : "") : value;
  const describedBy = [help ? `${id}-help` : "", error ? `${id}-error` : ""]
    .filter(Boolean)
    .join(" ") || undefined;
  return <div className="field-group">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Input
        id={id}
        type={money ? "text" : "number"}
        inputMode={money ? "numeric" : undefined}
        min={money ? undefined : min}
        max={money ? undefined : max}
        step={money ? undefined : step}
        value={display}
        onChange={(event) => onChange(money ? parseMoney(event.target.value) : Number(event.target.value))}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={suffix ? "pr-16" : undefined}
      />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">{suffix}</span>}
    </div>
    {help && <p id={`${id}-help`} className="field-help">{help}</p>}
    {error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}
  </div>;
}

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
  help,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  help?: string;
}) {
  return <div className="field-group">
    <Label htmlFor={id}>{label}</Label>
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="form-control"
      aria-describedby={help ? `${id}-help` : undefined}
    >
      {children}
    </select>
    {help && <p id={`${id}-help`} className="field-help">{help}</p>}
  </div>;
}

function CheckField({
  id,
  checked,
  onChange,
  label,
  help,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  help?: string;
}) {
  return <label htmlFor={id} className="check-field">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span className="check-box" aria-hidden="true"><Check size={14} /></span>
    <span><strong>{label}</strong>{help && <small>{help}</small>}</span>
  </label>;
}

export default function AdministrativeCalculator() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<AdministrativeCalculationInput>(initialInput);
  const result = useMemo(() => calculateAdministrativeSalary(input), [input]);
  const regime = input.regime;
  const isMunicipalStatute = regime === "municipalStatute";
  const isEducationEstablishment = regime === "educationEstablishment";
  const isDaemCentral = regime === "daemCentral";
  const maximumWeeklyHours = getAdministrativeMaximumWeeklyHours(regime);
  const pensionContributionsExempt = input.pensionStatus
    === "afpOldAgeOrTotalDisabilityPensionerExempt";
  const pensionerExemptFromAfc = pensionContributionsExempt
    || input.pensionStatus === "afpOldAgeOrTotalDisabilityPensionerContributor";
  const hasPendingManagementReliquidations = !result.calculationComplete
    && input.managementAllowanceQuarterlyPayment > 0;

  useEffect(() => {
    const urlRegime = regimeFromUrl();
    if (!urlRegime) return;
    const codeLabor = urlRegime !== "municipalStatute";
    setInput((current) => ({
      ...current,
      regime: urlRegime,
      weeklyHours: Math.min(
        current.weeklyHours,
        getAdministrativeMaximumWeeklyHours(urlRegime),
      ),
      baseSalary: codeLabor ? (current.baseSalary || initialMinimumIncome) : 0,
      previousMonthGross: codeLabor ? (current.previousMonthGross || initialMinimumIncome) : 0,
      applyLowIncomeBonus: urlRegime !== "daemCentral",
    }));
    setStep(1);
  }, []);

  const update = <K extends keyof AdministrativeCalculationInput>(
    key: K,
    value: AdministrativeCalculationInput[K],
  ) => setInput((current) => ({ ...current, [key]: value }));

  const hoursError = !Number.isInteger(input.weeklyHours)
    || input.weeklyHours < 1
    || input.weeklyHours > maximumWeeklyHours
    ? `Ingresa una jornada entre 1 y ${maximumWeeklyHours} horas.`
    : undefined;
  const baseSalaryError = input.baseSalary <= 0
    ? isMunicipalStatute
      ? "Copia el sueldo base vigente de tu grado."
      : "Ingresa el sueldo base indicado en tu contrato."
    : undefined;
  const previousGrossError = !isMunicipalStatute && input.previousMonthGross <= 0
    ? "Ingresa el bruto del mes anterior para evaluar el bono del artículo 59."
    : undefined;
  const gradeError = isMunicipalStatute
    && (!Number.isInteger(input.municipalGrade)
      || input.municipalGrade < 1
      || input.municipalGrade > 20)
    ? "Ingresa un grado municipal entre 1 y 20."
    : undefined;
  const difficultError = input.difficultConditionsPercentage < 0
    || input.difficultConditionsPercentage > 100
    ? "Ingresa un porcentaje entre 0 y 100."
    : undefined;
  const earningsInvalid = Boolean(
    hoursError
    || baseSalaryError
    || previousGrossError
    || gradeError
    || (isEducationEstablishment && difficultError),
  );

  const selectRegime = (nextRegime: AdministrativeRegime) => {
    const codeLabor = nextRegime !== "municipalStatute";
    setInput((current) => ({
      ...current,
      regime: nextRegime,
      weeklyHours: Math.min(
        current.weeklyHours,
        getAdministrativeMaximumWeeklyHours(nextRegime),
      ),
      baseSalary: codeLabor ? (current.baseSalary || initialMinimumIncome) : 0,
      previousMonthGross: codeLabor ? (current.previousMonthGross || initialMinimumIncome) : 0,
      applyLowIncomeBonus: nextRegime !== "daemCentral",
    }));
    setStep(1);
    const url = new URL(window.location.href);
    url.searchParams.set("caso", nextRegime);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const clearRegime = () => {
    setStep(0);
    const url = new URL(window.location.href);
    url.searchParams.delete("caso");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    document.querySelector("#calculadora")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goTo = (nextStep: number) => {
    setStep(Math.min(3, Math.max(0, nextStep)));
    document.querySelector("#calculadora")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const addManualItem = () => update("manualItems", [
    ...input.manualItems,
    {
      id: crypto.randomUUID(),
      name: "",
      amount: 0,
      kind: "imposableTaxable",
    },
  ]);
  const patchManualItem = (id: string, patch: Partial<ManualItem>) => update(
    "manualItems",
    input.manualItems.map((item) => item.id === id ? { ...item, ...patch } : item),
  );
  const removeManualItem = (id: string) => update(
    "manualItems",
    input.manualItems.filter((item) => item.id !== id),
  );

  return <section id="calculadora" className="scroll-mt-24">
    {step === 0 && <div className="regime-selector">
      <div className="regime-selector-heading">
        <span className="eyebrow">Paso 1 · Identifica tu vínculo</span>
        <h2>¿Dónde trabajas y qué dice tu contrato o nombramiento?</h2>
        <p>El lugar físico no basta. Elige usando tu empleador, la unidad en que prestas servicios y si tienes contrato de trabajo o nombramiento municipal.</p>
      </div>
      <div className="regime-options administrative-regime-options" role="group" aria-label="Tipo de vínculo administrativo">
        {(Object.entries(regimeDetails) as [AdministrativeRegime, (typeof regimeDetails)[AdministrativeRegime]][])
          .map(([value, details]) => {
            const Icon = details.icon;
            return <button
              key={value}
              type="button"
              className="regime-option"
              onClick={() => selectRegime(value)}
            >
              <span className="regime-option-icon"><Icon size={25} /></span>
              <span className="regime-option-copy">
                <small>{details.eyebrow}</small>
                <strong>{details.title}</strong>
                <span>{details.description}</span>
              </span>
              <span className="regime-option-action">Usar este recorrido <Check size={17} /></span>
            </button>;
          })}
      </div>
      <div className="scope-note">
        <Info size={20} />
        <p><strong>No elijas por el nombre informal del cargo.</strong> Honorarios, corporaciones municipales y personal ya traspasado a un SLEP necesitan recorridos distintos. Si cotizas en el régimen antiguo administrado por IPS, podrás identificarlo en cualquiera de los tres recorridos, pero el cálculo se detendrá antes de aplicar tasas AFP.</p>
      </div>
    </div>}

    {step > 0 && <>
      <div className="regime-current">
        <div>
          <span>Recorrido seleccionado</span>
          <strong>{regimeDetails[regime].title}</strong>
          <small>{regimeDetails[regime].description}</small>
        </div>
        <Button type="button" variant="outline" onClick={clearRegime}>
          <RefreshCw size={16} /> Cambiar régimen
        </Button>
      </div>

      <nav aria-label="Progreso de la calculadora" className="stepper">
        {steps.map((name, index) => <button
          key={name}
          type="button"
          onClick={() => index === 0 ? clearRegime() : index < step && goTo(index)}
          disabled={index > step}
          aria-current={index === step ? "step" : undefined}
          className="step-item"
        >
          <span>{index < step ? <Check size={15} /> : index + 1}</span>
          <small>{name}</small>
        </button>)}
      </nav>

      <div className={step === 3 ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]" : "grid gap-6"}>
        <Card className="overflow-hidden">
          {step === 1 && <>
            <CardHeader>
              <Badge>{regimeDetails[regime].eyebrow} · Julio de 2026</Badge>
              <CardTitle>Completa tus haberes según este régimen</CardTitle>
              <CardDescription>Usa los montos que aparecen en tu contrato, nombramiento, escala de transparencia o liquidación. No mezcles columnas de otro régimen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="form-grid">
                <NumberField
                  id="administrative-hours"
                  label="Horas semanales"
                  value={input.weeklyHours}
                  onChange={(value) => update("weeklyHours", value)}
                  min={1}
                  max={maximumWeeklyHours}
                  suffix="horas"
                  error={hoursError}
                />
                {!isMunicipalStatute && <SelectField
                  id="administrative-age-bracket"
                  label="Tramo etario"
                  value={input.ageBracket}
                  onChange={(value) => update("ageBracket", value as AdministrativeCalculationInput["ageBracket"])}
                  help="Determina el ingreso mínimo aplicable. Ser mayor de 65 años no exime por sí solo del Seguro de Cesantía."
                >
                  <option value="adult">De 18 a 65 años</option>
                  <option value="under18">Menor de 18 años</option>
                  <option value="over65">Mayor de 65 años</option>
                </SelectField>}
                {isMunicipalStatute && <NumberField
                  id="municipal-grade"
                  label="Grado municipal"
                  value={input.municipalGrade}
                  onChange={(value) => update("municipalGrade", value)}
                  min={1}
                  max={20}
                  help="Se usa para identificar tu escala; no autocompleta montos locales."
                  error={gradeError}
                />}
                <NumberField
                  id="administrative-base-salary"
                  label={isMunicipalStatute ? "Sueldo base del grado" : "Sueldo base mensual"}
                  value={input.baseSalary}
                  onChange={(value) => update("baseSalary", value)}
                  suffix="$"
                  help={isMunicipalStatute
                    ? "Cópialo de la escala de remuneraciones vigente publicada por tu municipalidad."
                    : `El ingreso mínimo estimado para el tramo etario y la jornada seleccionados es ${currency.format(calculateAdministrativeMinimumIncome(input.weeklyHours, regime, input.ageBracket))}.`}
                  error={baseSalaryError}
                />
              </div>

              {!isMunicipalStatute && <NumberField
                id="administrative-previous-gross"
                label="Remuneración bruta del mes anterior"
                value={input.previousMonthGross}
                onChange={(value) => update("previousMonthGross", value)}
                suffix="$"
                help={`Se usa para el bono del artículo 59; el límite 2026 es ${currency.format(D.article59Bonus.previousMonthGrossLimit)}.`}
                error={previousGrossError}
              />}

              {isEducationEstablishment && <section className="space-y-4 border-t border-border pt-6">
                <div>
                  <h3 className="font-bold">Haberes del establecimiento</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Estos campos solo aparecen para asistentes administrativos que trabajan dentro de una escuela o liceo municipal.</p>
                </div>
                <div className="form-grid">
                  <NumberField id="administrative-law-19464" label="Aumento Ley N.º 19.464" value={input.law19464Increase} onChange={(value) => update("law19464Increase", value)} suffix="$" help="Copia tu monto personal; no existe un valor nacional único." />
                  <NumberField id="administrative-local-seniority" label="Antigüedad o bienios locales" value={input.localSeniorityAllowance} onChange={(value) => update("localSeniorityAllowance", value)} suffix="$" help="Solo si tu contrato o instrumento local lo reconoce." />
                  <NumberField id="administrative-priority" label="Alta concentración de prioritarios" value={input.priorityAllowance} onChange={(value) => update("priorityAllowance", value)} suffix="$" help="Ingresa el monto pagado, no el porcentaje del establecimiento." />
                  <NumberField id="administrative-excellence" label="Bonificación de excelencia académica" value={input.academicExcellenceBonus} onChange={(value) => update("academicExcellenceBonus", value)} suffix="$" />
                  <NumberField id="administrative-difficult" label="Desempeño difícil" value={input.difficultConditionsPercentage} onChange={(value) => update("difficultConditionsPercentage", value)} min={0} max={100} suffix="%" help="Porcentaje oficial asignado al establecimiento." error={difficultError} />
                </div>
              </section>}

              {regime === "daemCentral" && <div className="scope-exclusion">
                <Info size={18} />
                <p><strong>Nivel central DAEM/DEM bajo Código del Trabajo:</strong> este recorrido no agrega un bienio legal automático ni beneficios del establecimiento. Si tienes nombramiento municipal de planta o contrata, vuelve a «Régimen» y elige ese caso: allí la antigüedad se calcula al 2% del sueldo base por bienio. Los haberes pactados en un contrato o instrumento local se pueden incorporar en el paso siguiente.</p>
              </div>}

              {isMunicipalStatute && <section className="space-y-4 border-t border-border pt-6">
                <div>
                  <h3 className="font-bold">Escala y asignaciones municipales</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">También corresponde si tu nombramiento municipal de planta o contrata está destinado al DAEM/DEM. Copia los montos de la escala local vigente; la herramienta automatiza la antigüedad legal.</p>
                </div>
                <div className="form-grid">
                  <NumberField id="municipal-allowance" label="Asignación municipal" value={input.municipalAllowance} onChange={(value) => update("municipalAllowance", value)} suffix="$" help="Monto exacto de tu estamento y grado; se trata como no imponible y tributable." />
                  <NumberField id="municipal-biennia" label="Bienios reconocidos" value={input.municipalBiennia} onChange={(value) => update("municipalBiennia", Math.trunc(value))} min={0} max={15} step={1} help={`Ingresa solo bienios completos. La estimación actual es ${currency.format(result.municipalBienniaAllowance)}: 2% del sueldo base por bienio, con máximo de 15.`} />
                  <NumberField id="municipal-management" label="Cuota de gestión pagada en julio" value={input.managementAllowanceQuarterlyPayment} onChange={(value) => update("managementAllowanceQuarterlyPayment", value)} suffix="$" help="Ingresa la cuota completa correspondiente a abril-junio. Se incluye como haber, pero esta estimación no calcula sus cotizaciones, bonificación compensatoria ni reliquidación tributaria sin las liquidaciones históricas." />
                </div>
              </section>}
            </CardContent>
          </>}

          {step === 2 && <>
            <CardHeader>
              <CardTitle>Previsión y conceptos adicionales</CardTitle>
              <CardDescription>Los parámetros previsionales y tributarios corresponden a julio de 2026.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="form-grid">
                <SelectField
                  id="administrative-pension-status"
                  label="Situación previsional"
                  value={input.pensionStatus}
                  onChange={(value) => update("pensionStatus", value as AdministrativeCalculationInput["pensionStatus"])}
                  help="La edad no activa una exención. Elige una condición pensionaria solo si la tienes reconocida y, cuando corresponda, declaraste la exención a tu empleador y AFP."
                >
                  <option value="afpContributor">AFP · cotizante ordinario</option>
                  <option value="afpOldAgeOrTotalDisabilityPensionerExempt">AFP · pensión de vejez o invalidez total con exención declarada</option>
                  <option value="afpOldAgeOrTotalDisabilityPensionerContributor">AFP · pensión de vejez o invalidez total, continúa cotizando</option>
                  <option value="afpPartialDisabilityPensioner">AFP · pensión de invalidez parcial, continúa cotizando</option>
                  <option value="ips">IPS / régimen antiguo</option>
                </SelectField>
                {input.pensionStatus !== "ips" && !pensionContributionsExempt && <SelectField id="administrative-afp" label="AFP" value={input.afp} onChange={(value) => update("afp", value as AdministrativeCalculationInput["afp"])}>
                    <option value="capital">Capital</option>
                    <option value="cuprum">Cuprum</option>
                    <option value="habitat">Habitat</option>
                    <option value="modelo">Modelo</option>
                    <option value="planvital">PlanVital</option>
                    <option value="provida">Provida</option>
                    <option value="uno">Uno</option>
                  </SelectField>}
                <SelectField id="administrative-health" label="Sistema de salud" value={input.healthSystem} onChange={(value) => update("healthSystem", value as AdministrativeCalculationInput["healthSystem"])}>
                  <option value="fonasa">Fonasa</option>
                  <option value="isapre">Isapre</option>
                </SelectField>
                {input.healthSystem === "isapre" && <NumberField id="administrative-isapre" label="Plan Isapre" value={input.isaprePlanUf} onChange={(value) => update("isaprePlanUf", value)} suffix="UF" />}
                <NumberField id="administrative-apv" label="APV descontado por empleador" value={input.apv} onChange={(value) => update("apv", value)} suffix="$" />
                {!isMunicipalStatute && <SelectField id="administrative-contract" label="Tipo de contrato" value={input.contractType} onChange={(value) => update("contractType", value as AdministrativeCalculationInput["contractType"])} help="Solo los contratos indefinidos consideran el 0,6% personal de AFC.">
                  <option value="indefinite">Indefinido</option>
                  <option value="fixed">Plazo fijo</option>
                </SelectField>}
              </div>
              {!result.supported && <div className="scope-exclusion" role="alert">
                <AlertTriangle size={18} />
                <p><strong>Régimen IPS aún no calculable:</strong> no mostraremos un líquido usando tasas AFP incorrectas. Confirma tus descuentos en la liquidación o utiliza este recorrido cuando se incorpore el régimen antiguo.</p>
              </div>}
              <div className="option-grid">
                {!isDaemCentral && <CheckField id="administrative-low-income" checked={input.applyLowIncomeBonus} onChange={(value) => update("applyLowIncomeBonus", value)} label="Mi vínculo está cubierto por el bono de bajas remuneraciones 2026" help="Desactívalo si remuneraciones confirmó que tu esquema contractual queda fuera." />}
                {input.contractType === "indefinite"
                  && !isMunicipalStatute
                  && input.ageBracket !== "under18"
                  && !pensionerExemptFromAfc
                  && <CheckField id="administrative-afc-ended" checked={input.afcContributionEnded} onChange={(value) => update("afcContributionEnded", value)} label="Cumplí 11 años de cotizaciones AFC" help="El aporte personal termina para esa relación laboral." />}
                <CheckField id="administrative-apv-tax" checked={input.apvTaxDeductible} onChange={(value) => update("apvTaxDeductible", value)} label="El APV rebaja la base tributable" help="Actívalo solo si corresponde al régimen informado por tu institución." />
              </div>
              {isDaemCentral && <div className="scope-exclusion">
                <Info size={18} />
                <p><strong>Nivel central DAEM/DEM:</strong> el bono mensual del artículo 13 de la Ley N.º 21.806 no se agrega en este recorrido. Si existe otro pago local, incorpóralo como haber manual con el tratamiento de tu liquidación.</p>
              </div>}

              <section className="border-t border-border pt-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold">Otros haberes o descuentos</h3>
                    <p className="text-sm leading-6 text-muted-foreground">Agrega bonos locales, zona, cuotas u otros conceptos usando el tratamiento de tu liquidación.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addManualItem}>
                    <Plus size={16} /> Agregar
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  {input.manualItems.length === 0 && <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">No agregaste conceptos adicionales.</p>}
                  {input.manualItems.map((item) => <div key={item.id} className="manual-row daem-manual-row">
                    <Input aria-label="Nombre del concepto" placeholder="Nombre del concepto" value={item.name} onChange={(event) => patchManualItem(item.id, { name: event.target.value })} />
                    <Input aria-label={`Monto de ${item.name || "concepto"}`} type="text" inputMode="numeric" placeholder="Monto" value={item.amount ? integerMoney.format(item.amount) : ""} onChange={(event) => patchManualItem(item.id, { amount: parseMoney(event.target.value) })} />
                    <select aria-label={`Clasificación de ${item.name || "concepto"}`} className="form-control" value={item.kind} onChange={(event) => patchManualItem(item.id, { kind: event.target.value as ManualKind })}>
                      <option value="imposableTaxable">Imponible y tributable</option>
                      <option value="imposableNonTaxable">Imponible y no tributable</option>
                      <option value="nonImposableTaxable">No imponible y tributable</option>
                      <option value="nonImposableNonTaxable">No imponible y no tributable</option>
                      <option value="discount">Descuento</option>
                    </select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeManualItem(item.id)} aria-label={`Eliminar ${item.name || "concepto"}`}>
                      <Trash2 size={18} />
                    </Button>
                  </div>)}
                </div>
              </section>
            </CardContent>
          </>}

          {step === 3 && <>
            <CardHeader className="result-heading">
              <Badge>{hasPendingManagementReliquidations ? "Estimación incompleta" : "Estimación lista"}</Badge>
              <CardTitle className="text-3xl">{hasPendingManagementReliquidations ? "Subtotal líquido antes de reliquidaciones" : "Sueldo líquido estimado"}</CardTitle>
              <div className="result-total" aria-live="polite">{currency.format(result.netSalary)}</div>
              <CardDescription>{hasPendingManagementReliquidations
                ? "Incluye la cuota pagada en julio, pero faltan las reliquidaciones previsionales y tributarias del trimestre."
                : "Mes completo calculado con parámetros de julio de 2026."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {result.warnings.length > 0 && <div className="warning-list" role="status">
                <AlertTriangle size={20} />
                <div>
                  <strong>Revisa estas consideraciones</strong>
                  <ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
                </div>
              </div>}
              <ResultTable title={hasPendingManagementReliquidations ? "Haberes incluidos en el subtotal" : "Haberes"} lines={result.earnings} total={result.totalEarnings} positive />
              <ResultTable title={hasPendingManagementReliquidations ? "Descuentos calculados antes de reliquidaciones" : "Descuentos"} lines={result.discounts} total={result.totalDiscounts} />
              <div className="base-grid daem-base-grid">
                <div><span>{hasPendingManagementReliquidations ? "Base imponible corriente, sin reliquidar cuota" : "Base imponible de julio"}</span><strong>{currency.format(result.imposableBase)}</strong></div>
                <div><span>{hasPendingManagementReliquidations ? "Base tributable corriente, sin reliquidar cuota" : "Base tributable de julio"}</span><strong>{currency.format(result.taxableBase)}</strong></div>
                <div><span>Bono artículo 59</span><strong>{currency.format(result.article59Bonus)}</strong></div>
                <div><span>Bono bajas rentas</span><strong>{currency.format(result.lowIncomeBonus)}</strong></div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" onClick={() => window.print()}><Printer size={18} /> Imprimir o guardar PDF</Button>
                <Button type="button" variant="outline" onClick={() => goTo(1)}>Nueva simulación</Button>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">Estimación informativa. No reemplaza la liquidación, la escala de remuneraciones municipal, el contrato ni el acto administrativo que reconoce tu grado y asignaciones.</p>
            </CardContent>
          </>}

          <div className={`flex items-center border-t border-border bg-muted/30 p-4 md:px-8 print:hidden ${step === 1 ? "justify-end" : "justify-between"}`}>
            {step > 1 && <Button type="button" variant="ghost" onClick={() => goTo(step - 1)}><ArrowLeft size={17} /> Anterior</Button>}
            {step < 3 && <Button
              type="button"
              onClick={() => step === 1 && earningsInvalid
                ? undefined
                : step === 2 && !result.supported
                  ? undefined
                  : goTo(step + 1)}
              disabled={(step === 1 && earningsInvalid) || (step === 2 && !result.supported)}
            >
              {step === 2 ? "Ver resultado" : "Continuar"} <ArrowRight size={17} />
            </Button>}
          </div>
        </Card>

        {step === 3 && <aside className="block print:hidden" aria-label="Resumen del resultado">
          <div className="space-y-4 lg:sticky lg:top-24">
            <Card className="overflow-hidden">
              <div className="bg-primary p-6 text-primary-foreground">
                <p className="text-sm font-medium opacity-80">{hasPendingManagementReliquidations ? "Subtotal líquido antes de reliquidaciones" : "Líquido estimado"}</p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight" aria-live="polite">{currency.format(result.netSalary)}</p>
              </div>
              <CardContent className="space-y-4 pt-7 md:pt-7">
                <SummaryRow label={hasPendingManagementReliquidations ? "Haberes incluidos en el subtotal" : "Total haberes"} value={result.totalEarnings} positive />
                <SummaryRow label={hasPendingManagementReliquidations ? "Descuentos antes de reliquidaciones" : "Total descuentos"} value={result.totalDiscounts} />
                <SummaryRow label={hasPendingManagementReliquidations ? "Base imponible corriente, sin reliquidar cuota" : "Base imponible de julio"} value={result.imposableBase} />
                <div className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
                  <Info size={15} className="mb-1 inline text-primary" /> {hasPendingManagementReliquidations
                    ? "Este subtotal no es el líquido final: faltan las reliquidaciones de la cuota de gestión."
                    : "Resumen final de esta estimación."}
                </div>
              </CardContent>
            </Card>
            <a href={sitePath("legal/administrativos-daem-municipales/")} className="block rounded-2xl border border-primary/15 bg-primary/5 p-5 text-sm no-underline">
              <div className="flex items-center gap-2 font-bold text-primary"><FileText size={17} /> Respaldo de los tres regímenes</div>
              <p className="mt-2 leading-6 text-muted-foreground">Revisa qué beneficios se incluyen o excluyen en cada recorrido.</p>
            </a>
          </div>
        </aside>}
      </div>
    </>}
  </section>;
}

function SummaryRow({ label, value, positive = false }: { label: string; value: number; positive?: boolean }) {
  return <div className="flex items-center justify-between gap-4 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <strong className={positive ? "text-emerald-700 dark:text-emerald-400" : ""}>{currency.format(value)}</strong>
  </div>;
}

function ResultTable({
  title,
  lines,
  total,
  positive = false,
}: {
  title: string;
  lines: ResultLine[];
  total: number;
  positive?: boolean;
}) {
  return <section aria-labelledby={`administrative-result-${title}`}>
    <div className="mb-3 flex items-end justify-between">
      <h3 id={`administrative-result-${title}`} className="text-lg font-bold">{title}</h3>
      <strong className={positive ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}>{currency.format(total)}</strong>
    </div>
    <div className="overflow-hidden rounded-2xl border border-border">
      {lines.filter((line) => line.amount > 0).map((line) => <div key={line.id} className="result-row">
        <div>
          <span>{line.label}</span>
          <small>{line.imposable ? "Imponible" : "No imponible"} · {line.taxable ? "tributable" : "no tributable"}</small>
        </div>
        <div className="flex items-center gap-2">
          {line.legalSlug && <a href={sitePath(`legal/${line.legalSlug}/`)} aria-label={`Ver respaldo legal de ${line.label}`}><FileText size={15} /></a>}
          <strong>{currency.format(line.amount)}</strong>
        </div>
      </div>)}
    </div>
  </section>;
}
