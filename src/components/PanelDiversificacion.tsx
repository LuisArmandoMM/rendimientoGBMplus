"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatoFecha, formatoMXN, formatoPct } from "@/lib/format";
import { diversificacionAl, ordenEmisoras, periodosDisponibles } from "@/lib/diversificacion";
import type { Movimiento } from "@/lib/tipos";
import Tarjeta from "./Tarjeta";

// Paleta categórica validada (daltonismo). El color sigue a la emisora (orden de primera
// aparición), no a su lugar en la gráfica, para que no cambie al filtrar el periodo.
// "Otras" y las emisoras más allá de la 7.ª van en gris.
const COLORES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6"];
const GRIS_OTRAS = "#94a3b8";

const TEXTO_NIVEL = {
  diversificada: "Cartera diversificada",
  moderada: "Concentración moderada",
  concentrada: "Cartera concentrada",
} as const;

export default function PanelDiversificacion({ movimientos }: { movimientos: Movimiento[] }) {
  const periodos = useMemo(() => periodosDisponibles(movimientos), [movimientos]);
  const orden = useMemo(() => ordenEmisoras(movimientos), [movimientos]);
  const fechas = useMemo(() => movimientos.map((m) => m.fecha).sort(), [movimientos]);
  const [corte, setCorte] = useState(periodos[0]?.corte ?? "");
  const d = useMemo(() => diversificacionAl(movimientos, corte), [movimientos, corte]);

  const colorDe = (emisora: string) => {
    const i = orden.indexOf(emisora);
    return i >= 0 && i < COLORES.length ? COLORES[i] : GRIS_OTRAS;
  };
  const esActual = corte === periodos[0]?.corte;
  const mayor = d.activos[0];
  // Una sola fila apilada al 100 %: cada emisora es un segmento.
  const fila = Object.fromEntries(d.segmentos.map((s) => [s.emisora, +(s.peso * 100).toFixed(2)]));

  return (
    <section id="diversificacion" aria-labelledby="titulo-div" className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 id="titulo-div" className="text-lg font-semibold">4. Diversificación por activo</h2>

      <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Periodo de la gráfica">
        {periodos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setCorte(p.corte)}
            aria-pressed={corte === p.corte}
            className={`rounded-full border px-3 py-1 text-sm ${
              corte === p.corte ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {p.etiqueta}
          </button>
        ))}
        <label className="flex w-full items-center gap-2 text-sm text-slate-600 sm:ml-auto sm:w-auto">
          Al corte del
          <input
            type="date"
            value={corte}
            min={fechas[0]}
            max={fechas[fechas.length - 1]}
            onChange={(e) => e.target.value && setCorte(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-slate-900 sm:flex-none"
          />
        </label>
      </div>

      {!d.activos.length ? (
        <p className="mt-4 text-sm text-slate-600">No había posiciones abiertas al {formatoFecha(corte)}.</p>
      ) : (
      <>
      <p className="mt-3 text-sm text-slate-600">
        Peso de cada emisora en el valor de tu tenencia {esActual ? "actual" : `al ${formatoFecha(corte)}`} ({formatoMXN(d.valorTotal)}),
        valuada con el último precio registrado hasta esa fecha.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tarjeta titulo="Emisoras en cartera" valor={String(d.activos.length)} />
        <Tarjeta titulo="Posición más grande" valor={formatoPct(mayor.peso, 1)} detalle={mayor.emisora} />
        <Tarjeta
          titulo="Activos efectivos"
          valor={d.activosEfectivos.toLocaleString("es-MX", { maximumFractionDigits: 1 })}
          detalle={`${TEXTO_NIVEL[d.nivel]} (HHI ${Math.round(d.hhi * 10_000).toLocaleString("es-MX")})`}
          tono={d.nivel === "concentrada" ? "negativo" : "neutro"}
        />
      </div>

      <div className="mt-6 h-16" role="img" aria-label="Barra apilada: porcentaje del valor de la cartera por emisora">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={[fila]} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap={0}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" hide />
            <Tooltip
              cursor={false}
              formatter={(v: number, nombre: string) => [`${v.toLocaleString("es-MX")} %`, nombre]}
              labelFormatter={() => ""}
            />
            {d.segmentos.map((s) => (
              <Bar
                key={s.emisora}
                dataKey={s.emisora}
                stackId="cartera"
                fill={colorDe(s.emisora)}
                stroke="#ffffff"
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Diversificación de la cartera por emisora</caption>
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-4">Emisora</th>
              <th className="py-2 pr-4 text-right">Valor</th>
              <th className="py-2 pr-4 text-right">Peso</th>
              <th className="hidden w-2/5 py-2 sm:table-cell"><span className="sr-only">Proporción</span></th>
            </tr>
          </thead>
          <tbody>
            {d.segmentos.map((s) => (
              <tr key={s.emisora} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium">
                  <span className="mr-2 inline-block h-3 w-3 rounded-sm align-middle" style={{ background: colorDe(s.emisora) }} aria-hidden />
                  {s.emisora}
                </td>
                <td className="py-2 pr-4 text-right">{formatoMXN(s.valor)}</td>
                <td className="py-2 pr-4 text-right">{formatoPct(s.peso, 1)}</td>
                <td className="hidden py-2 sm:table-cell" aria-hidden>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full" style={{ width: `${s.peso * 100}%`, background: colorDe(s.emisora) }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}
    </section>
  );
}
