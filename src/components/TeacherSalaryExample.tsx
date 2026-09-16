import { JULY_2026_PARAMETERS as P } from "@/data/parameters/2026-07";
import { teacherExampleResult as result } from "@/data/examples/teacher";
import { sitePath } from "@/lib/site-path";
import { Button } from "@/components/ui/button";

const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
const decimalMoney = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const percent = (value: number) => new Intl.NumberFormat("es-CL", { style: "percent", maximumFractionDigits: 2 }).format(value);
const month = (period: string) => new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric", timeZone: "America/Santiago" }).format(new Date(`${period}-15T12:00:00Z`));
const bracket = P.taxBrackets.find((item) => result.taxableBase <= item.upTo)!;
const explanations: Record<string, string> = {
  base: `20 × ${money(P.hourlyRate.basic)} + 24 × ${money(P.hourlyRate.secondary)}. El sueldo base del caso coincide con la RBMN.`,
  experience: "Tres bienios: 3,38% + 2 × 3,33% = 10,04% de la RBMN.",
  "tranche-experience": "El tramo incorpora su propio componente de experiencia, además del haber anterior.",
  "tranche-progression": `${money(P.progression.advanced)} × 44/44 horas × 3/15 bienios.`,
  "tranche-fixed": `${money(P.fixedComponent.advanced)} × 44/44 horas; sin reducción del componente fijo.`,
  "brp-title": "Título acreditado. Con 44 horas se alcanza el máximo pagable de 30 horas.",
  "brp-mention": "Mención acreditada junto con el título; se aplica el mismo tope de 30 horas.",
  "minimum-supplement": "Complemento hasta el piso mensual, si los haberes computables no lo alcanzan.",
  afp: `${percent(0.1 + P.afpCommission.habitat)} (10% obligatorio + ${percent(P.afpCommission.habitat)} de comisión), sobre la base imponible hasta el tope de ${money(P.uf * P.pensionCapUf)}.`,
  health: "7% de la base imponible, hasta el tope previsional; sin plan Isapre.",
  tax: `Renta tributable × ${percent(bracket.factor)}, menos ${decimalMoney(bracket.rebate)} de rebaja; resultado redondeado al peso.`,
};

export default function TeacherSalaryExample({ onLoad }: { onLoad: () => void }) {
  return <section id="ejemplo-docente" className="teacher-example scroll-mt-24 print:hidden" aria-labelledby="example-title">
    <header>
      <span className="eyebrow">Caso ilustrativo · mes completo</span>
      <h2 id="example-title">De las horas contratadas al sueldo líquido</h2>
      <p>Una persona docente municipal o SLEP con jornada mixta, tramo Avanzado y BRP por título y mención reconocidos. Estos datos son ficticios: no representan una liquidación real.</p>
      <p className="text-sm">Montos legales base de {P.label.toLowerCase()}. Indicadores para remuneraciones de <strong>{month(P.previred.remunerationPeriod)}</strong>, pagadas en {month(P.previred.paymentPeriod)}. El ejemplo se recalcula cuando se actualizan los parámetros publicados.</p>
    </header>
    <dl className="example-facts">
      <div><dt>Jornada</dt><dd>20 h básicas + 24 h medias</dd></div>
      <div><dt>Carrera docente</dt><dd>3 bienios · Avanzado · BRP título y mención</dd></div>
      <div><dt>Previsión</dt><dd>AFP Habitat · Fonasa · sin AFC ni APV</dd></div>
    </dl>
    <p>Sin zona, alta concentración, responsabilidad directiva, bonos locales ni descuentos particulares. El tramo se paga completo. No incluye ausencias, retroactivos ni reliquidaciones.</p>
    <div className="example-summary">
      <div><span>Total haberes</span><strong>{money(result.totalEarnings)}</strong></div>
      <div><span>Total descuentos</span><strong>{money(result.totalDiscounts)}</strong></div>
      <div><span>Líquido del ejemplo</span><strong data-example-net>{money(result.netSalary)}</strong></div>
    </div>
    <div className="example-actions">
      <Button type="button" onClick={onLoad} aria-describedby="example-load-help">Cargar este ejemplo en la calculadora</Button>
      <p id="example-load-help">Reemplaza los datos de tu simulación y usa los parámetros publicados. Después puedes volver a los pasos anteriores y cambiar cualquier antecedente.</p>
    </div>
    <h3>1. Suma los haberes</h3>
    <ExampleTable label="Haberes del ejemplo" lines={result.earnings} />
    <p>Todos los haberes de este caso son imponibles y tributables. Por eso su suma, <strong>{money(result.totalEarnings)}</strong>, es el punto de partida de ambas bases. Esto puede cambiar si agregas otros tipos de haberes.</p>
    <h3>2. Aplica cotizaciones e impuesto</h3>
    <p>La base imponible es <strong>{money(result.imposableBase)}</strong>. Al restar las cotizaciones deducibles, la renta utilizada para el Impuesto Único queda en <strong>{money(result.taxableBase)}</strong>. En este caso no hay APV ni AFC que rebajar.</p>
    <ExampleTable label="Descuentos del ejemplo" lines={result.discounts} />
    <h3>3. Comprueba el líquido</h3>
    <p className="formula">{money(result.totalEarnings)} − {money(result.totalDiscounts)} = {money(result.netSalary)}</p>
    <p>Los haberes y descuentos se redondean al peso antes de sumarse. Al probar otros datos, busca primero qué haber o base cambia; la diferencia final en el líquido no explica por sí sola su causa.</p>
    <p><a href={sitePath("guias/como-leer-liquidacion-docente/")}>Cómo leer tu liquidación</a> · <a href={sitePath("legal/asignacion-tramo/")}>Fuentes de Carrera Docente</a> · <a href={P.previred.sourceUrl} target="_blank" rel="noopener noreferrer">Indicadores Previred del período</a> · <a href={sitePath("legal/impuesto-unico/")}>Tabla y fuentes del Impuesto Único</a></p>
  </section>;
}

function ExampleTable({ label, lines }: { label: string; lines: typeof result.earnings }) {
  return <div className="example-table-scroll" tabIndex={0} role="region" aria-label={label}>
    <table className="example-table">
      <caption className="sr-only">{label}</caption>
      <thead><tr><th scope="col">Concepto</th><th scope="col">Monto</th><th scope="col">Cómo se obtiene</th></tr></thead>
      <tbody>{lines.filter((line) => line.amount > 0).map((line) => <tr key={line.id}>
        <th scope="row">{line.legalSlug ? <a href={sitePath(`legal/${line.legalSlug}/`)}>{line.label}</a> : line.label}</th>
        <td>{money(line.amount)}</td><td>{explanations[line.id]}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
