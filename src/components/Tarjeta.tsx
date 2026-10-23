export default function Tarjeta({
  titulo, valor, detalle, tono = "neutro",
}: { titulo: string; valor: string; detalle?: string; tono?: "neutro" | "positivo" | "negativo" }) {
  const color = tono === "positivo" ? "text-emerald-700" : tono === "negativo" ? "text-red-700" : "text-slate-900";
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">{titulo}</p>
      <p className={`mt-1 break-words text-lg font-semibold tabular-nums sm:text-2xl ${color}`}>{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </div>
  );
}
