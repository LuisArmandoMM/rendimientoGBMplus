"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FUENTE_INFLACION } from "@/lib/inflacion";
import { formatoFecha, formatoMXN, formatoPct } from "@/lib/format";
import type { AjustePorInflacion, ComparacionInflacion, Rendimiento } from "@/lib/rendimiento";
import Tarjeta from "./Tarjeta";

export default function PanelRendimiento({ r, c, a }: { r: Rendimiento; c: ComparacionInflacion; a: AjustePorInflacion }) {
  const datos = [
    { nombre: "Rendimiento del portafolio", valor: +(r.rendimientoSimple * 100).toFixed(2), color: r.rendimientoSimple >= 0 ? "#047857" : "#b91c1c" },
    { nombre: "Inflación acumulada", valor: +(c.inflacionAcumulada * 100).toFixed(2), color: "#64748b" },
  ];

  return (
    <section aria-labelledby="titulo-rend" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 id="titulo-rend" className="text-lg font-semibold">2. Rendimiento del portafolio vs. inflación</h2>
      <p className="mt-1 text-sm text-slate-600">
        Periodo analizado: {formatoFecha(r.fechaInicio)} al {formatoFecha(r.fechaFin)} ({r.dias} días).
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta titulo="Capital invertido" valor={formatoMXN(r.capitalInvertido)} detalle="Compras + comisiones" />
        <Tarjeta titulo="Valor actual" valor={formatoMXN(r.valorFinal)} detalle="Ventas + dividendos + tenencia" />
        <Tarjeta
          titulo="Ganancia"
          valor={formatoMXN(r.ganancia)}
          tono={r.ganancia >= 0 ? "positivo" : "negativo"}
        />
        <Tarjeta
          titulo="Rendimiento simple"
          valor={formatoPct(r.rendimientoSimple)}
          tono={r.rendimientoSimple >= 0 ? "positivo" : "negativo"}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Tarjeta
          titulo="Capital ajustado por inflación"
          valor={formatoMXN(a.capitalAjustado)}
          detalle="Lo necesario hoy para conservar el poder adquisitivo de cada aportación"
        />
        <Tarjeta
          titulo="Ganancia real"
          valor={formatoMXN(a.gananciaReal)}
          detalle="Valor actual − capital ajustado"
          tono={a.gananciaReal >= 0 ? "positivo" : "negativo"}
        />
        <Tarjeta
          titulo="Rendimiento sin comisiones"
          valor={formatoPct(r.rendimientoSinComisiones)}
          detalle={`Las comisiones restan ${formatoPct(r.rendimientoSinComisiones - r.rendimientoSimple)} al rendimiento`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="h-64" role="img" aria-label="Gráfica de barras: rendimiento del portafolio contra inflación acumulada">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
              <YAxis unit=" %" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => `${v} %`} />
              <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                {datos.map((d) => <Cell key={d.nombre} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3 text-sm">
          <div className={`rounded-lg p-4 ${c.superaInflacion ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
            <p className="font-semibold">
              {c.superaInflacion ? "Tu portafolio superó a la inflación." : "Tu portafolio no superó a la inflación."}
            </p>
            <p className="mt-1">
              Rendimiento {formatoPct(r.rendimientoSimple)} contra inflación {formatoPct(c.inflacionAcumulada)}:
              diferencia de {formatoPct(c.diferencia)}. Rendimiento real (descontando inflación): {formatoPct(c.rendimientoReal)}.
            </p>
          </div>
          {c.usaEstimado && (
            <p className="rounded-lg bg-slate-100 p-3 text-slate-700">
              Algunos años del periodo no tienen dato oficial cargado; se usó la tasa del año más cercano.
            </p>
          )}
          <p className="text-xs text-slate-500">Fuente de inflación: {FUENTE_INFLACION}</p>
          <p className="text-xs text-slate-500">
            La tenencia actual se valúa con el último precio registrado de cada emisora en el archivo.
          </p>
        </div>
      </div>
    </section>
  );
}
