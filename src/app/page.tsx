"use client";

import { useMemo, useState } from "react";
import CargaCsv from "@/components/CargaCsv";
import PanelComisiones from "@/components/PanelComisiones";
import PanelDiversificacion from "@/components/PanelDiversificacion";
import PanelRendimiento from "@/components/PanelRendimiento";
import PanelResumen from "@/components/PanelResumen";
import { calcularComisiones } from "@/lib/comisiones";
import { calcularDiversificacion } from "@/lib/diversificacion";
import { ajustarPorInflacion, calcularRendimiento, compararConInflacion } from "@/lib/rendimiento";
import { evolucionPortafolio } from "@/lib/resumen";
import type { Movimiento } from "@/lib/tipos";

const SECCIONES = [
  { id: "resumen", etiqueta: "Resumen" },
  { id: "rendimiento", etiqueta: "Rendimiento" },
  { id: "comisiones", etiqueta: "Comisiones" },
  { id: "diversificacion", etiqueta: "Diversificación" },
  { id: "carga", etiqueta: "Cambiar archivo" },
];

export default function Home() {
  const [movimientos, setMovimientos] = useState<Movimiento[] | null>(null);
  const [archivo, setArchivo] = useState("");

  const analisis = useMemo(() => {
    if (!movimientos) return null;
    const rendimiento = calcularRendimiento(movimientos);
    return {
      rendimiento,
      comparacion: compararConInflacion(rendimiento),
      ajuste: ajustarPorInflacion(movimientos, rendimiento),
      comisiones: calcularComisiones(movimientos),
      diversificacion: calcularDiversificacion(rendimiento.tenencias),
      evolucion: evolucionPortafolio(movimientos),
    };
  }, [movimientos]);

  return (
    <>
      {analisis && (
        <nav aria-label="Secciones del dashboard" className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2 text-sm whitespace-nowrap">
            {SECCIONES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-full px-3 py-1.5 text-slate-700 hover:bg-slate-100">
                  {s.etiqueta}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
        <header>
          <h1 className="text-xl font-bold sm:text-2xl">Dashboard de Finanzas Personales</h1>
          <p className="mt-1 text-sm text-slate-600">
            Sube el CSV con los movimientos de tu portafolio y conoce tu rendimiento frente a la inflación y lo que pagas en comisiones.
            Tus datos se procesan en tu navegador; no se envían a ningún servidor.
          </p>
          {analisis && (
            <p className="mt-2 text-sm text-slate-600">
              Archivo cargado: <span className="font-medium break-all">{archivo}</span> ({movimientos?.length} movimientos válidos)
            </p>
          )}
        </header>

        {analisis && (
          <PanelResumen
            r={analisis.rendimiento}
            c={analisis.comparacion}
            comisiones={analisis.comisiones}
            diversificacion={analisis.diversificacion}
            evolucion={analisis.evolucion}
          />
        )}

        <CargaCsv
          onCargado={(m, nombre) => { setMovimientos(m); setArchivo(nombre); }}
          onLimpiar={() => { setMovimientos(null); setArchivo(""); }}
        />

        {analisis && (
          <>
            <PanelRendimiento r={analisis.rendimiento} c={analisis.comparacion} a={analisis.ajuste} />
            <PanelComisiones resumen={analisis.comisiones} />
            {movimientos && <PanelDiversificacion key={archivo} movimientos={movimientos} />}
          </>
        )}
      </main>
    </>
  );
}
