import { useEffect, useState } from "react";
import { Building2, Check, Info, Landmark, RefreshCw } from "lucide-react";
import AssistantCalculator from "@/components/AssistantCalculator";
import DaemAssistantCalculator from "@/components/DaemAssistantCalculator";
import { Button } from "@/components/ui/button";

type Regime = "slep" | "daem";

const regimeDetails = {
  slep: {
    eyebrow: "Servicio Local de Educación Pública",
    title: "Mi empleador es un SLEP",
    description: "Mi contrato indica un Servicio Local y la categoría técnica de asistente de la educación.",
    icon: Landmark,
  },
  daem: {
    eyebrow: "Administración municipal",
    title: "Mi empleador es un DAEM o DEM",
    description: "Mi contrato es municipal y el establecimiento todavía no ha sido traspasado a un SLEP.",
    icon: Building2,
  },
} as const;

function regimeFromUrl(): Regime | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("regimen");
  return value === "slep" || value === "daem" ? value : null;
}

export default function TechnicalAssistantCalculator() {
  const [regime, setRegime] = useState<Regime | null>(null);

  useEffect(() => {
    setRegime(regimeFromUrl());
  }, []);

  const chooseRegime = (nextRegime: Regime) => {
    setRegime(nextRegime);
    const url = new URL(window.location.href);
    url.searchParams.set("regimen", nextRegime);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const clearRegime = () => {
    setRegime(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("regimen");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    document.querySelector("#calculadora")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <section id="calculadora" className="scroll-mt-24" aria-labelledby={!regime ? "technical-assistant-selector-title" : undefined} aria-label={regime ? "Calculadora para técnicos en educación parvularia" : undefined}>
    {!regime && <div className="regime-selector">
      <div className="regime-selector-heading">
        <span className="eyebrow">Paso 1 de 2 · Identifica tu régimen</span>
        <h2 id="technical-assistant-selector-title">¿Quién aparece como empleador en tu contrato?</h2>
        <p>Elige usando el nombre que figura en tu contrato o liquidación. La función puede parecerse, pero SLEP y DAEM/DEM aplican reglas distintas.</p>
      </div>

      <div className="regime-options" role="group" aria-label="Empleador indicado en el contrato">
        {(Object.entries(regimeDetails) as [Regime, (typeof regimeDetails)[Regime]][]).map(([value, details]) => {
          const Icon = details.icon;
          return <button key={value} type="button" className="regime-option" onClick={() => chooseRegime(value)}>
            <span className="regime-option-icon"><Icon size={25} /></span>
            <span className="regime-option-copy">
              <small>{details.eyebrow}</small>
              <strong>{details.title}</strong>
              <span>{details.description}</span>
            </span>
            <span className="regime-option-action">Usar esta calculadora <Check size={17} /></span>
          </button>;
        })}
      </div>

      <div className="scope-note"><Info size={20} /><p><strong>¿Tu contrato dice JUNJI, Integra, jardín VTF u otro empleador?</strong> Esta calculadora todavía no cubre ese régimen. Si eres educador/a de párvulos profesional afecto/a a Carrera Docente, usa la calculadora docente.</p></div>
    </div>}

    {regime && <>
      <div className="regime-current" aria-live="polite">
        <div>
          <span>Régimen seleccionado</span>
          <strong>{regimeDetails[regime].title}</strong>
          <small>{regimeDetails[regime].description}</small>
        </div>
        <Button type="button" variant="outline" onClick={clearRegime}><RefreshCw size={16} /> Cambiar empleador</Button>
      </div>
      {regime === "slep" ? <AssistantCalculator embedded /> : <DaemAssistantCalculator embedded />}
    </>}
  </section>;
}
