import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Check, CircleAlert, CircleCheck, ExternalLink, Flag, Grid3X3, Info, Scale, SlidersHorizontal, X } from "lucide-react";
import type { Tranche } from "@/lib/calculation/types";
import { assessGoal, calculateTrancheProgression, minimumCombinationFor, minimumExperienceFor, nextGoal, RESULT_MATRIX, TRANCHE_NAMES, TRANCHE_ORDER } from "@/lib/tranche-progression/calculate";
import type { EcepCategory, EcepResult, PortfolioCategory, PortfolioResult, TrancheProgressionInput } from "@/lib/tranche-progression/types";
import { sitePath } from "@/lib/site-path";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const portfolioCategories: PortfolioCategory[] = ["A", "B", "C", "D", "E"];
const ecepCategories: EcepCategory[] = ["A", "B", "C", "D"];
const goalOptions: Exclude<Tranche, "access">[] = ["initial", "early", "advanced", "expert1", "expert2"];
const renderedPortfolioOption = { value: "rendered", label: "Lo rendí en este proceso" } as const;
const renderedEcepOption = { value: "rendered", label: "La rendí en este proceso" } as const;

const initialInput: TrancheProgressionInput = {
  currentTranche: "initial",
  experienceYears: 4,
  yearsInCurrentTranche: 0,
  portfolioResult: { category: "A", status: "rendered" },
  ecepResult: { category: "B", status: "rendered" },
  enteredEarlyWithA: false,
  enteredAdvancedWithDoubleA: false,
  previousProcessWithoutAdvancement: false,
  accessDeadlineExpired: false,
};

function SelectField({ id, label, value, onChange, children, help }: { id: string; label: string; value: string; onChange: (value: string) => void; children: ReactNode; help?: string }) {
  return <div className="field-group">
    <label htmlFor={id} className="font-semibold">{label}</label>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="form-control">{children}</select>
    {help && <p id={`${id}-help`} className="field-help">{help}</p>}
  </div>;
}

function NumberField({ id, label, value, onChange, help }: { id: string; label: string; value: number; onChange: (value: number) => void; help?: string }) {
  return <div className="field-group">
    <label htmlFor={id} className="font-semibold">{label}</label>
    <input id={id} type="number" min={0} max={50} step={1} value={value} onChange={(event) => onChange(Math.max(0, Math.min(50, Math.round(Number(event.target.value) || 0))))} className="form-control" />
    {help && <p id={`${id}-help`} className="field-help">{help}</p>}
  </div>;
}

function CheckField({ id, checked, onChange, label, help }: { id: string; checked: boolean; onChange: (value: boolean) => void; label: string; help?: string }) {
  return <label htmlFor={id} className="check-field">
    <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span className="check-box" aria-hidden="true"><Check size={14} /></span>
    <span><strong>{label}</strong>{help && <small>{help}</small>}</span>
  </label>;
}

function rank(tranche: Tranche) {
  return TRANCHE_ORDER.indexOf(tranche);
}

export function availablePortfolioStatuses(category: PortfolioCategory) {
  if (category === "A") return [renderedPortfolioOption, { value: "retained-a-next-process", label: "Conservo A para el proceso siguiente" } as const];
  if (category === "B") return [renderedPortfolioOption, { value: "retained-consecutive-b-next-process", label: "Conservo B tras dos B consecutivas" } as const];
  return [renderedPortfolioOption];
}

export function availableEcepStatuses(category: EcepCategory) {
  if (category === "A" || category === "B") return [renderedEcepOption, { value: "retained-following-process", label: "Conservo este resultado A/B vigente" } as const];
  return [renderedEcepOption];
}

export function buildPortfolioResult(category: PortfolioCategory, status: PortfolioResult["status"]): PortfolioResult {
  if (status === "retained-a-next-process" && category === "A") return { category, status };
  if (status === "retained-consecutive-b-next-process" && category === "B") return { category, status };
  return { category, status: "rendered" };
}

export function buildEcepResult(category: EcepCategory, status: EcepResult["status"]): EcepResult {
  if (status === "retained-following-process" && (category === "A" || category === "B")) return { category, status };
  return { category, status: "rendered" };
}

function Requirement({ met, title, children }: { met: boolean; title: string; children: ReactNode }) {
  return <li className={met ? "is-met" : "is-missing"}>
    <span aria-hidden="true">{met ? <CircleCheck size={22} /> : <CircleAlert size={22} />}</span>
    <div><strong>{title}</strong><p>{children}</p></div>
  </li>;
}

export default function TrancheCalculator() {
  const [input, setInput] = useState(initialInput);
  const [target, setTarget] = useState<Exclude<Tranche, "access">>("early");
  const result = useMemo(() => calculateTrancheProgression(input), [input]);
  const goal = useMemo(() => assessGoal(input, target), [input, target]);
  const availableGoals = goalOptions.filter((tranche) => rank(tranche) > rank(input.currentTranche));
  const displayedGoals = availableGoals.length > 0 ? availableGoals : ["expert2" as const];
  const portfolioRetained = input.portfolioResult.status !== "rendered";
  const ecepRetained = input.ecepResult.status !== "rendered";
  const patch = <K extends keyof TrancheProgressionInput>(key: K, value: TrancheProgressionInput[K]) => setInput((current) => ({ ...current, [key]: value }));

  const changeCurrentTranche = (value: Tranche) => {
    setInput((current) => ({
      ...current,
      currentTranche: value,
      yearsInCurrentTranche: 0,
      enteredEarlyWithA: false,
      enteredAdvancedWithDoubleA: false,
      previousProcessWithoutAdvancement: false,
      accessDeadlineExpired: false,
    }));
    if (rank(target) <= rank(value)) setTarget(nextGoal(value));
  };

  const status = result.legalStatus === "exit" ? "SALIDA DEL SISTEMA" : result.legalStatus === "access-reassigned" ? "REASIGNACIÓN LEGAL" : !result.instrumentResultsValid ? "RESULTADO NO VÁLIDO" : !result.hasCurrentInstrument ? "FALTA INSTRUMENTO" : result.advances ? "SUBE" : input.currentTranche === "access" ? "PRIMER RECONOCIMIENTO" : "MANTIENE";
  const resultCopy = result.legalStatus === "exit"
    ? "Los antecedentes declarados configuran la causal del artículo 19 S. El sostenedor y la resolución oficial determinan su aplicación."
    : result.legalStatus === "access-reassigned"
      ? "La proyección pasa a Inicial por el vencimiento del máximo de cuatro años en Acceso sin rendir instrumentos disponibles."
      : !result.instrumentResultsValid
        ? "No es posible proyectar un avance con una categoría que no habilita conservar ese instrumento."
      : !result.hasCurrentInstrument
    ? "No es posible proyectar un avance: debes rendir Portafolio o ECEP en este proceso."
    : result.advances
      ? `Desde ${TRANCHE_NAMES[input.currentTranche]}. La proyección queda limitada por el menor de los requisitos legales.`
      : input.currentTranche === "access"
        ? "Proyección de la asignación en el primer proceso de reconocimiento, sujeta a resolución oficial."
        : "La combinación no produce un tramo superior en este proceso, pero el sistema conserva el tramo ya reconocido.";

  return <section id="calculadora-tramos" aria-labelledby="tranche-calculator-title">
    <div className="tranche-intro">
      <div><Badge>Simulador informativo</Badge><h2 id="tranche-calculator-title">Proyecta tu progresión en Carrera Docente</h2><p>Cada cambio recalcula el resultado en tu navegador. Usa años acreditados y resultados oficiales.</p></div>
      <a href={sitePath("legal/progresion-tramos/")} className="context-help-link"><Scale size={18} /> Ver reglas y fuentes</a>
    </div>

    <div className="tranche-layout">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><SlidersHorizontal size={22} className="text-primary" /> Los requisitos del proceso</CardTitle><CardDescription>El resultado combina instrumentos, experiencia, progresión y permanencia. No basta solo con el paso del tiempo.</CardDescription></CardHeader>
        <CardContent className="space-y-7">
          <SelectField id="current-tranche" label="Tramo actual reconocido" value={input.currentTranche} onChange={(value) => changeCurrentTranche(value as Tranche)} help="Debe coincidir con tu resolución vigente o Portal Docente.">
            {TRANCHE_ORDER.map((tranche) => <option key={tranche} value={tranche}>{TRANCHE_NAMES[tranche]}</option>)}
          </SelectField>

          <div className="form-grid">
            <NumberField id="experience-years" label="Años de experiencia acreditados" value={input.experienceYears} onChange={(value) => patch("experienceYears", value)} help="Cumplidos al 1 de mayo del año siguiente a la participación." />
            {(input.currentTranche === "advanced" || input.currentTranche === "expert1") && <NumberField id="years-in-tranche" label={`Años cumplidos en ${TRANCHE_NAMES[input.currentTranche]}`} value={input.yearsInCurrentTranche} onChange={(value) => patch("yearsInCurrentTranche", value)} help="Permanencia desde la resolución que reconoció este tramo." />}
          </div>

          {input.currentTranche === "early" && <CheckField id="early-with-a" checked={input.enteredEarlyWithA} onChange={(value) => patch("enteredEarlyWithA", value)} label="Ingresé a Temprano con una A" help="Marca solo si en el proceso que te asignó Temprano obtuviste A en Portafolio o ECEP." />}
          {input.currentTranche === "advanced" && <CheckField id="advanced-double-a" checked={input.enteredAdvancedWithDoubleA} onChange={(value) => patch("enteredAdvancedWithDoubleA", value)} label="Ingresé a Avanzado con A + A" help="Esta excepción reduce a dos años la permanencia exigida para optar a Experto I." />}
          {(input.currentTranche === "initial" || input.currentTranche === "early") && <CheckField id="previous-no-advance" checked={input.previousProcessWithoutAdvancement} onChange={(value) => patch("previousProcessWithoutAdvancement", value)} label="Mis resultados del proceso anterior tampoco permitieron avanzar" help="Si los resultados de este proceso vuelven a ser insuficientes, el artículo 19 S dispone la desvinculación." />}
          {input.currentTranche === "access" && <CheckField id="access-deadline" checked={input.accessDeadlineExpired} onChange={(value) => patch("accessDeadlineExpired", value)} label="Venció mi plazo máximo de cuatro años en Acceso" help="Marca solo si no rendiste instrumentos disponibles dentro del plazo informado por CPEIP o Portal Docente." />}

          <div>
            <h3 className="mb-3 font-bold">Resultados de los instrumentos</h3>
            <div className="form-grid">
              <SelectField id="portfolio-result" label="Portafolio" value={input.portfolioResult.category} onChange={(value) => patch("portfolioResult", buildPortfolioResult(value as PortfolioCategory, input.portfolioResult.status))}>
                {portfolioCategories.map((category) => <option key={category} value={category}>Categoría {category}</option>)}
              </SelectField>
              <SelectField id="ecep-result" label="ECEP" value={input.ecepResult.category} onChange={(value) => patch("ecepResult", buildEcepResult(value as EcepCategory, input.ecepResult.status))}>
                {ecepCategories.map((category) => <option key={category} value={category}>Categoría {category}</option>)}
              </SelectField>
            </div>
          </div>

          <div className="form-grid">
            <SelectField
              id="portfolio-status"
              label="Uso del resultado de Portafolio"
              value={input.portfolioResult.status}
              onChange={(value) => patch("portfolioResult", buildPortfolioResult(input.portfolioResult.category, value as PortfolioResult["status"]))}
              help={input.portfolioResult.category === "A"
                ? "La A puede conservarse solo para el proceso siguiente."
                : input.portfolioResult.category === "B"
                  ? "La B puede conservarse solo para el proceso siguiente y tras dos B consecutivas."
                  : "Esta categoría no habilita exención de Portafolio."}
            >
              {availablePortfolioStatuses(input.portfolioResult.category).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </SelectField>
            <SelectField
              id="ecep-status"
              label="Uso del resultado de ECEP"
              value={input.ecepResult.status}
              onChange={(value) => patch("ecepResult", buildEcepResult(input.ecepResult.category, value as EcepResult["status"]))}
              help={input.ecepResult.category === "A" || input.ecepResult.category === "B"
                ? "El último resultado A o B puede mantenerse en procesos posteriores."
                : "Esta categoría no habilita exención de ECEP."}
            >
              {availableEcepStatuses(input.ecepResult.category).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </SelectField>
          </div>
          {(portfolioRetained || ecepRetained) && result.hasCurrentInstrument && <div className="warning-inline"><Info size={18} /><p>Usa la exención solo si CPEIP o Portal Docente confirmó que está vigente para este proceso.</p></div>}
          {!result.hasCurrentInstrument && <div className="warning-inline" role="alert"><CircleAlert size={18} /><p>La ley exige rendir al menos un instrumento en el proceso. Declara Portafolio o ECEP como rendido para obtener una proyección.</p></div>}
        </CardContent>
      </Card>

      <aside className="tranche-result-column" aria-live="polite">
        <Card className={`tranche-result-card ${result.advances ? "is-advance" : ""}`}>
          <CardContent className="p-6 md:p-7">
            <span className="tranche-result-kicker">Tramo proyectado</span>
            <div className="tranche-result-heading"><strong>{result.resultTranche === null ? "Sin tramo proyectado" : TRANCHE_NAMES[result.resultTranche]}</strong><span>{status}</span></div>
            <p>{resultCopy}</p>
            <div className="tranche-ceilings">
              <div><span>Instrumentos</span><strong>{TRANCHE_NAMES[result.matrixCeiling]}</strong></div>
              <div><span>Experiencia</span><strong>{TRANCHE_NAMES[result.experienceCeiling]}</strong></div>
              <div><span>Progresión</span><strong>{TRANCHE_NAMES[result.progressionCeiling]}</strong></div>
              <div><span>Permanencia</span><strong>{TRANCHE_NAMES[result.permanenceCeiling]}</strong></div>
            </div>
            {result.reasons.length > 0 && <ul className="tranche-reasons">{result.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
          </CardContent>
        </Card>
        <div className="tranche-official-note"><CircleAlert size={19} /><p><strong>La resolución oficial manda.</strong> No uses este tramo proyectado para estimar tu sueldo hasta que esté formalmente reconocido.</p></div>
      </aside>
    </div>

    <Card className="mt-6">
      <CardHeader><CardTitle className="flex items-center gap-2"><Grid3X3 size={22} className="text-primary" /> Techo por combinación de resultados</CardTitle><CardDescription>Esta matriz muestra solo el máximo por Portafolio y ECEP; luego se aplican experiencia, progresión y permanencia.</CardDescription></CardHeader>
      <CardContent>
        <div className="tranche-matrix-scroll">
          <table className="tranche-matrix">
            <caption className="sr-only">Matriz de tramo por categoría de Portafolio y ECEP</caption>
            <thead><tr><th scope="col">Portafolio ↓</th>{ecepCategories.map((ecep) => <th key={ecep} scope="col">ECEP {ecep}</th>)}</tr></thead>
            <tbody>{portfolioCategories.map((portfolio) => <tr key={portfolio}><th scope="row">Port. {portfolio}</th>{ecepCategories.map((ecep) => {
              const tranche = RESULT_MATRIX[portfolio][ecep];
              const selected = portfolio === input.portfolioResult.category && ecep === input.ecepResult.category;
              return <td key={ecep} className={selected ? "is-selected" : ""}><span className={`matrix-tranche matrix-${tranche}`}>{TRANCHE_NAMES[tranche]}</span></td>;
            })}</tr>)}</tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <Card className="mt-6">
      <CardHeader><CardTitle className="flex items-center gap-2"><Flag size={22} className="text-primary" /> Modo objetivo: ¿qué me falta?</CardTitle><CardDescription>Comprueba si el tramo que buscas es alcanzable en el próximo proceso con los antecedentes declarados.</CardDescription></CardHeader>
      <CardContent className="space-y-6">
        <SelectField id="target-tranche" label="Quiero llegar a" value={target} onChange={(value) => setTarget(value as Exclude<Tranche, "access">)}>
          {displayedGoals.map((tranche) => <option key={tranche} value={tranche}>{TRANCHE_NAMES[tranche]}</option>)}
        </SelectField>
        <ul className="goal-requirements">
          <Requirement met={goal.experience} title={`Experiencia: ${minimumExperienceFor(target)} años`}>{goal.experience ? `Cumples con ${input.experienceYears} años acreditados.` : `Tienes ${input.experienceYears}; aún no alcanzas el mínimo al 1 de mayo aplicable.`}</Requirement>
          <Requirement met={goal.results} title="Resultados Portafolio + ECEP">Mínimo orientativo: {minimumCombinationFor(target)}. Tu combinación es {input.portfolioResult.category} + {input.ecepResult.category}.</Requirement>
          <Requirement met={goal.progressionAndPermanence} title="Progresión y permanencia">{goal.progressionAndPermanence ? "La trayectoria declarada permite llegar a este tramo en el próximo proceso." : "La linealidad, una excepción histórica o la permanencia todavía impiden llegar en un solo proceso."}</Requirement>
          <Requirement met={goal.currentInstrument} title="Instrumento rendido en este proceso">{goal.currentInstrument ? "Declaraste al menos un instrumento rendido actualmente." : "Debes rendir Portafolio o ECEP en este proceso."}</Requirement>
          <Requirement met={goal.legalContinuity} title="Continuidad en el sistema">{goal.legalContinuity ? "No se configura una causal de salida con los antecedentes declarados." : "El segundo proceso consecutivo con resultados insuficientes configura la causal del artículo 19 S."}</Requirement>
        </ul>
        <p className={`goal-summary ${goal.reachableNextProcess ? "is-reachable" : ""}`}>{goal.reachableNextProcess ? <CircleCheck size={20} /> : <X size={20} />}<span><strong>{goal.reachableNextProcess ? "Alcanzable en el próximo proceso" : "Aún no aparece alcanzable en el próximo proceso"}</strong> según los datos ingresados y sujeto a validación oficial.</span></p>
      </CardContent>
    </Card>

    <div className="tranche-next-actions">
      <div><strong>¿Ya tienes una resolución con tu nuevo tramo?</strong><p>Úsalo recién entonces en la calculadora de liquidación.</p></div>
      <a className="hero-button primary" href={sitePath("calculadoras/docentes/")}>Ir a liquidación docente <ArrowRight size={17} /></a>
      <a className="hero-button" href="https://portaldocente.mineduc.cl/" target="_blank" rel="noopener noreferrer">Abrir Portal Docente <ExternalLink size={16} /></a>
    </div>
  </section>;
}
