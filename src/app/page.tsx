"use client";

import { useMemo, useState } from "react";
import CargaCsv from "@/components/CargaCsv";
import PanelComisiones from "@/components/PanelComisiones";
import PanelRendimiento from "@/components/PanelRendimiento";
import { calcularComisiones } from "@/lib/comisiones";
import { ajustarPorInflacion, calcularRendimiento, compararConInflacion } from "@/lib/rendimiento";
import type { Movimiento } from "@/lib/tipos";

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
    };
  }, [movimientos]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold">Dashboard de Finanzas Personales</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sube el CSV con los movimientos de tu portafolio y conoce tu rendimiento frente a la inflación y lo que pagas en comisiones.
          Tus datos se procesan en tu navegador; no se envían a ningún servidor.
        </p>
      </header>

      <CargaCsv
        onCargado={(m, nombre) => { setMovimientos(m); setArchivo(nombre); }}
        onLimpiar={() => { setMovimientos(null); setArchivo(""); }}
      />

      {analisis && (
        <>
          <p className="text-sm text-slate-600">
            Archivo cargado: <span className="font-medium">{archivo}</span> ({movimientos?.length} movimientos válidos)
          </p>
          <PanelRendimiento r={analisis.rendimiento} c={analisis.comparacion} a={analisis.ajuste} />
          <PanelComisiones resumen={analisis.comisiones} />
        </>
      )}
    </main>
  );
}
