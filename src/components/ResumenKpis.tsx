import { formatoMXN, formatoPct } from "@/lib/format";
import type { ResumenPortafolio } from "@/lib/resumen";
import Tarjeta from "./Tarjeta";

export default function ResumenKpis({ r }: { r: ResumenPortafolio }) {
  const signo = (n: number) => (n >= 0 ? "positivo" : "negativo") as "positivo" | "negativo";
  return (
    <section id="resumen" aria-labelledby="titulo-res" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-res" className="text-lg font-semibold">Resumen del portafolio</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            r.superaInflacion ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {r.superaInflacion ? "Supera a la inflación" : "No supera a la inflación"}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tarjeta titulo="Valor actual" valor={formatoMXN(r.valorActual)} detalle="Ventas + dividendos + tenencia" />
        <Tarjeta titulo="Capital invertido" valor={formatoMXN(r.capitalInvertido)} detalle="Compras + comisiones" />
        <Tarjeta titulo="Ganancia" valor={formatoMXN(r.ganancia)} tono={signo(r.ganancia)} />
        <Tarjeta titulo="Rendimiento simple" valor={formatoPct(r.rendimientoSimple)} tono={signo(r.rendimientoSimple)} />
        <Tarjeta titulo="Inflación acumulada" valor={formatoPct(r.inflacionAcumulada)} detalle="Mismo periodo" />
        <Tarjeta titulo="Rendimiento real" valor={formatoPct(r.rendimientoReal)} tono={signo(r.rendimientoReal)} detalle="Descontando inflación" />
        <Tarjeta titulo="Comisiones pagadas" valor={formatoMXN(r.comisionesTotal)} tono={r.comisionesTotal > 0 ? "negativo" : "neutro"} />
        <Tarjeta
          titulo="Mayor concentración"
          valor={r.mayorEmisora ? r.mayorEmisora.emisora : "—"}
          detalle={r.mayorEmisora ? `${formatoPct(r.mayorEmisora.porcentaje, 1)} del portafolio` : undefined}
        />
      </div>
    </section>
  );
}
