"use client";

import { useMemo, useState } from "react";
import CargaCsv from "@/components/CargaCsv";
import FiltroPeriodo from "@/components/FiltroPeriodo";
import PanelComisiones from "@/components/PanelComisiones";
import PanelDiversificacion from "@/components/PanelDiversificacion";
import PanelRendimiento from "@/components/PanelRendimiento";
import ResumenKpis from "@/components/ResumenKpis";
import { calcularComisiones } from "@/lib/comisiones";
import { calcularDiversificacion } from "@/lib/diversificacion";
import { formatoFecha } from "@/lib/format";
import { aplicarPeriodo, limitesFechas, periodoPreset, type Periodo, type PresetPeriodo } from "@/lib/periodo";
import { ajustarPorInflacion, calcularRendimiento, compararConInflacion } from "@/lib/rendimiento";
import { construirResumen } from "@/lib/resumen";
import type { Movimiento } from "@/lib/tipos";

const SECCIONES = [
  { href: "#resumen", texto: "Resumen" },
  { href: "#rendimiento", texto: "Rendimiento" },
  { href: "#diversificacion", texto: "Diversificación" },
  { href: "#comisiones", texto: "Comisiones" },
];

export default function Home() {
  const [movimientos, setMovimientos] = useState<Movimiento[] | null>(null);
  const [archivo, setArchivo] = useState("");
  const [periodo, setPeriodo] = useState<Periodo>({});
  const [preset, setPreset] = useState<PresetPeriodo | "personalizado">("todo");

  const limites = useMemo(() => (movimientos ? limitesFechas(movimientos) : { min: "", max: "" }), [movimientos]);

  const analisis = useMemo(() => {
    if (!movimientos) return null;
    const datos = aplicarPeriodo(movimientos, periodo);
    if (datos.reales.length === 0) return { vacio: true as const };
    const rendimiento = calcularRendimiento(datos.analisis);
    const comparacion = compararConInflacion(rendimiento);
    const comisiones = calcularComisiones(datos.reales);
    const diversificacion = calcularDiversificacion(rendimiento.tenencias);
    return {
      vacio: false as const,
      rendimiento,
      comparacion,
      ajuste: ajustarPorInflacion(datos.analisis, rendimiento),
      comisiones,
      diversificacion,
      resumen: construirResumen(rendimiento, comparacion, comisiones, diversificacion),
      saldoInicial: datos.saldoInicial,
      total: datos.reales.length,
    };
  }, [movimientos, periodo]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold">Dashboard de Finanzas Personales</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sube el CSV con los movimientos de tu portafolio y conoce tu rendimiento frente a la inflación, tu diversificación y lo que pagas en comisiones.
          Tus datos se procesan en tu navegador; no se envían a ningún servidor.
        </p>
      </header>

      <CargaCsv
        onCargado={(m, nombre) => { setMovimientos(m); setArchivo(nombre); setPeriodo({}); setPreset("todo"); }}
        onLimpiar={() => { setMovimientos(null); setArchivo(""); }}
      />

      {movimientos && analisis && (
        <>
          <nav aria-label="Secciones" className="sticky top-0 z-10 -mx-4 flex flex-wrap gap-4 border-b border-slate-200 bg-slate-50/95 px-4 py-2 text-sm backdrop-blur">
            {SECCIONES.map((s) => (
              <a key={s.href} href={s.href} className="font-medium text-blue-700 hover:underline">{s.texto}</a>
            ))}
          </nav>

          <p className="text-sm text-slate-600">
            Archivo: <span className="font-medium">{archivo}</span> · {movimientos.length} movimientos válidos · datos del{" "}
            {formatoFecha(limites.min)} al {formatoFecha(limites.max)}
          </p>

          <FiltroPeriodo
            periodo={periodo}
            preset={preset}
            min={limites.min}
            max={limites.max}
            onPreset={(id) => { setPreset(id); setPeriodo(periodoPreset(id, limites.max)); }}
            onFechas={(p) => { setPreset("personalizado"); setPeriodo(p); }}
          />

          {analisis.vacio ? (
            <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              No hay movimientos en el periodo seleccionado. Amplía las fechas o elige «Todo».
            </p>
          ) : (
            <>
              {analisis.saldoInicial > 0 && (
                <p className="text-sm text-slate-600">
                  El periodo parte de una tenencia previa valuada en {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(analisis.saldoInicial)}, que se toma como capital inicial.
                </p>
              )}
              <ResumenKpis r={analisis.resumen} />
              <PanelRendimiento r={analisis.rendimiento} c={analisis.comparacion} a={analisis.ajuste} />
              <PanelDiversificacion d={analisis.diversificacion} />
              <PanelComisiones resumen={analisis.comisiones} />
            </>
          )}
        </>
      )}
    </main>
  );
}
