"use client";

import type { Periodo, PresetPeriodo } from "@/lib/periodo";

const PRESETS: { id: PresetPeriodo; etiqueta: string }[] = [
  { id: "todo", etiqueta: "Todo" },
  { id: "anio", etiqueta: "Año en curso" },
  { id: "12m", etiqueta: "12 meses" },
  { id: "6m", etiqueta: "6 meses" },
];

interface Props {
  periodo: Periodo;
  preset: PresetPeriodo | "personalizado";
  min: string;
  max: string;
  onPreset: (id: PresetPeriodo) => void;
  onFechas: (p: Periodo) => void;
}

export default function FiltroPeriodo({ periodo, preset, min, max, onPreset, onFechas }: Props) {
  const invalido = !!periodo.desde && !!periodo.hasta && periodo.desde > periodo.hasta;
  return (
    <section aria-label="Filtro por periodo" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Periodo</p>
          <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label="Periodos rápidos">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPreset(p.id)}
                aria-pressed={preset === p.id}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  preset === p.id ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white hover:bg-slate-50"
                }`}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>
        </div>
        <label className="text-sm">
          <span className="block text-xs text-slate-500">Desde</span>
          <input
            type="date" min={min} max={max}
            value={periodo.desde ?? ""}
            onChange={(e) => onFechas({ ...periodo, desde: e.target.value || undefined })}
            className="rounded-md border border-slate-300 px-2 py-1"
          />
        </label>
        <label className="text-sm">
          <span className="block text-xs text-slate-500">Hasta</span>
          <input
            type="date" min={min} max={max}
            value={periodo.hasta ?? ""}
            onChange={(e) => onFechas({ ...periodo, hasta: e.target.value || undefined })}
            className="rounded-md border border-slate-300 px-2 py-1"
          />
        </label>
      </div>
      {invalido && (
        <p role="alert" className="mt-3 text-sm text-red-700">La fecha «Desde» no puede ser posterior a «Hasta».</p>
      )}
    </section>
  );
}
