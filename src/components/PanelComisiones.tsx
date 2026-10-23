"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatoFecha, formatoMXN, formatoPct } from "@/lib/format";
import type { ResumenComisiones } from "@/lib/comisiones";
import Tarjeta from "./Tarjeta";

export default function PanelComisiones({ resumen }: { resumen: ResumenComisiones }) {
  return (
    <section id="comisiones" aria-labelledby="titulo-com" className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 id="titulo-com" className="text-lg font-semibold">3. Comisiones pagadas</h2>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tarjeta titulo="Total de comisiones" valor={formatoMXN(resumen.total)} tono={resumen.total > 0 ? "negativo" : "neutro"} />
        <Tarjeta titulo="% sobre monto operado" valor={formatoPct(resumen.porcentajeSobreOperado)} />
        <Tarjeta
          titulo="Emisora con más comisión"
          valor={resumen.porEmisora[0]?.emisora ?? "—"}
          detalle={resumen.porEmisora[0] ? formatoMXN(resumen.porEmisora[0].comision) : undefined}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="h-60" role="img" aria-label="Gráfica de barras: comisiones pagadas por emisora">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={resumen.porEmisora.map((e) => ({ ...e, comision: +e.comision.toFixed(2) }))} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="emisora" tick={{ fontSize: 11 }} interval={0} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatoMXN(v)} />
              <Bar dataKey="comision" name="Comisión" fill="#b45309" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Por tipo de movimiento</p>
          <ul className="space-y-1">
            {resumen.porTipo.map((t) => (
              <li key={t.tipo} className="flex justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="capitalize">{t.tipo} ({t.operaciones})</span>
                <span className="font-medium">{formatoMXN(t.comision)}</span>
              </li>
            ))}
          </ul>
          {resumen.mayor && (
            <p className="text-slate-600">
              La comisión más alta fue de {formatoMXN(resumen.mayor.comision)} en la {resumen.mayor.tipo} de{" "}
              {resumen.mayor.emisora} del {formatoFecha(resumen.mayor.fecha)}.
            </p>
          )}
        </div>
      </div>

      {/* Móvil: cada movimiento como tarjeta; desde md se muestra la tabla completa. */}
      <ul className="mt-6 space-y-2 text-sm md:hidden" aria-label="Comisiones desglosadas por movimiento">
        {resumen.filas.map((f, i) => (
          <li key={i} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{f.emisora}</span>
              <span className="text-xs text-slate-500">{formatoFecha(f.fecha)} · <span className="capitalize">{f.tipo}</span></span>
            </div>
            <div className="mt-1 flex justify-between gap-2 text-slate-600">
              <span>Monto {formatoMXN(f.monto)}</span>
              <span className="font-medium text-slate-900">{formatoMXN(f.comision)} ({formatoPct(f.porcentaje)})</span>
            </div>
          </li>
        ))}
        <li className="flex justify-between rounded-lg bg-slate-50 p-3 font-semibold">
          <span>Total</span>
          <span>{formatoMXN(resumen.total)}</span>
        </li>
      </ul>

      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Comisiones desglosadas por movimiento</caption>
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-4">Fecha</th>
              <th className="py-2 pr-4">Tipo</th>
              <th className="py-2 pr-4">Emisora</th>
              <th className="py-2 pr-4 text-right">Monto</th>
              <th className="py-2 pr-4 text-right">Comisión</th>
              <th className="py-2 text-right">% del monto</th>
            </tr>
          </thead>
          <tbody>
            {resumen.filas.map((f, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2 pr-4">{formatoFecha(f.fecha)}</td>
                <td className="py-2 pr-4 capitalize">{f.tipo}</td>
                <td className="py-2 pr-4 font-medium">{f.emisora}</td>
                <td className="py-2 pr-4 text-right">{formatoMXN(f.monto)}</td>
                <td className="py-2 pr-4 text-right">{formatoMXN(f.comision)}</td>
                <td className="py-2 text-right">{formatoPct(f.porcentaje)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td className="py-2" colSpan={4}>Total</td>
              <td className="py-2 pr-4 text-right">{formatoMXN(resumen.total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
