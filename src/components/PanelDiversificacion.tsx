"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Diversificacion } from "@/lib/diversificacion";
import { formatoMXN, formatoPct } from "@/lib/format";

const COLORES = ["#1d4ed8", "#047857", "#b45309", "#7c3aed", "#be123c", "#0e7490", "#4d7c0f", "#64748b"];

const TEXTO_NIVEL = {
  alta: "Concentración alta: una sola emisora pesa más de la mitad del portafolio.",
  moderada: "Concentración moderada: una emisora pesa más de 30 % del portafolio.",
  baja: "Portafolio diversificado: ninguna emisora pesa más de 30 %.",
} as const;

export default function PanelDiversificacion({ d }: { d: Diversificacion }) {
  return (
    <section id="diversificacion" aria-labelledby="titulo-div" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 id="titulo-div" className="text-lg font-semibold">Diversificación del portafolio</h2>

      {d.participaciones.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No hay tenencia vigente al final del periodo seleccionado.</p>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="h-64" role="img" aria-label="Gráfica de pastel: composición del portafolio por emisora">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={d.participaciones} dataKey="valor" nameKey="emisora" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {d.participaciones.map((p, i) => <Cell key={p.emisora} fill={COLORES[i % COLORES.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatoMXN(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 text-sm">
            <p className="rounded-lg bg-slate-100 p-3 text-slate-700">{TEXTO_NIVEL[d.nivel]}</p>
            <table className="w-full text-left">
              <caption className="sr-only">Participación de cada emisora</caption>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr><th className="py-1">Emisora</th><th className="py-1 text-right">Valor</th><th className="py-1 text-right">Peso</th></tr>
              </thead>
              <tbody>
                {d.participaciones.map((p) => (
                  <tr key={p.emisora} className="border-b border-slate-100">
                    <td className="py-1.5 font-medium">{p.emisora}</td>
                    <td className="py-1.5 text-right">{formatoMXN(p.valor)}</td>
                    <td className="py-1.5 text-right">{formatoPct(p.porcentaje, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
