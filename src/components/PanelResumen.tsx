"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatoFecha, formatoMXN, formatoPct } from "@/lib/format";
import type { ResumenComisiones } from "@/lib/comisiones";
import type { Diversificacion } from "@/lib/diversificacion";
import type { ComparacionInflacion, Rendimiento } from "@/lib/rendimiento";
import type { PuntoEvolucion } from "@/lib/resumen";
import Tarjeta from "./Tarjeta";

// Mismos dos primeros colores de la paleta categórica validada (Sprint 4).
const COLOR_CAPITAL = "#2a78d6";
const COLOR_VALOR = "#eb6834";

const NIVEL = { diversificada: "Diversificada", moderada: "Moderada", concentrada: "Concentrada" } as const;

const compacto = new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 });
const mesAnio = (iso: string) => {
  const [y, m] = iso.split("-");
  return `${m}/${y.slice(2)}`;
};

interface Props {
  r: Rendimiento;
  c: ComparacionInflacion;
  comisiones: ResumenComisiones;
  diversificacion: Diversificacion;
  evolucion: PuntoEvolucion[];
}

/** Sprint 5: dashboard con las métricas principales del portafolio. */
export default function PanelResumen({ r, c, comisiones, diversificacion: d, evolucion }: Props) {
  const signo = (n: number) => (n >= 0 ? "positivo" : "negativo");

  return (
    <section id="resumen" aria-labelledby="titulo-resumen" className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 id="titulo-resumen" className="text-lg font-semibold">Resumen de tu portafolio</h2>
        <p className="text-sm text-slate-600">
          {formatoFecha(r.fechaInicio)} al {formatoFecha(r.fechaFin)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Tarjeta titulo="Valor de la cartera" valor={formatoMXN(r.valorTenencia)} detalle={`${r.tenencias.length} emisoras en tenencia`} />
        <Tarjeta titulo="Ganancia total" valor={formatoMXN(r.ganancia)} detalle={`Sobre ${formatoMXN(r.capitalInvertido)} invertidos`} tono={signo(r.ganancia)} />
        <Tarjeta titulo="Rendimiento simple" valor={formatoPct(r.rendimientoSimple)} detalle={`Inflación del periodo: ${formatoPct(c.inflacionAcumulada)}`} tono={signo(r.rendimientoSimple)} />
        <Tarjeta
          titulo="Rendimiento real"
          valor={formatoPct(c.rendimientoReal)}
          detalle={c.superaInflacion ? "Superó a la inflación" : "No superó a la inflación"}
          tono={signo(c.rendimientoReal)}
        />
        <Tarjeta
          titulo="Comisiones pagadas"
          valor={formatoMXN(comisiones.total)}
          detalle={`${formatoPct(comisiones.porcentajeSobreOperado)} del monto operado`}
          tono={comisiones.total > 0 ? "negativo" : "neutro"}
        />
        <Tarjeta
          titulo="Diversificación"
          valor={d.activos.length ? NIVEL[d.nivel] : "—"}
          detalle={d.activos.length ? `${d.activosEfectivos.toLocaleString("es-MX", { maximumFractionDigits: 1 })} activos efectivos` : "Sin posiciones abiertas"}
          tono={d.nivel === "concentrada" && d.activos.length ? "negativo" : "neutro"}
        />
      </div>

      {evolucion.length > 1 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold">Capital invertido vs. valor del portafolio</h3>
          <p className="mt-1 text-xs text-slate-500">
            Valor = ventas + dividendos recibidos + tenencia valuada con el último precio registrado a cada fecha.
          </p>
          <div className="mt-3 h-64 sm:h-72" role="img" aria-label="Gráfica de líneas: capital invertido acumulado contra valor del portafolio en el tiempo">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucion} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="fecha" tickFormatter={mesAnio} tick={{ fontSize: 11, fill: "#64748b" }} minTickGap={24} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
                <YAxis tickFormatter={(v: number) => `$${compacto.format(v)}`} tick={{ fontSize: 11, fill: "#64748b" }} width={52} tickLine={false} axisLine={false} />
                <Tooltip
                  labelFormatter={(f: string) => formatoFecha(f)}
                  formatter={(v: number, nombre: string) => [formatoMXN(v), nombre]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" />
                <Line type="linear" dataKey="capitalInvertido" name="Capital invertido" stroke={COLOR_CAPITAL} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="linear" dataKey="valor" name="Valor del portafolio" stroke={COLOR_VALOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
