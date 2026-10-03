import { formatoFecha, formatoMXN, formatoPct } from "@/lib/format";
import type { ResumenComisiones } from "@/lib/comisiones";
import Tarjeta from "./Tarjeta";

export default function PanelComisiones({ resumen }: { resumen: ResumenComisiones }) {
  return (
    <section aria-labelledby="titulo-com" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 id="titulo-com" className="text-lg font-semibold">3. Comisiones pagadas</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Tarjeta titulo="Total de comisiones" valor={formatoMXN(resumen.total)} tono={resumen.total > 0 ? "negativo" : "neutro"} />
        <Tarjeta titulo="% sobre monto operado" valor={formatoPct(resumen.porcentajeSobreOperado)} />
        <Tarjeta
          titulo="Emisora con más comisión"
          valor={resumen.porEmisora[0]?.emisora ?? "—"}
          detalle={resumen.porEmisora[0] ? formatoMXN(resumen.porEmisora[0].comision) : undefined}
        />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
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
