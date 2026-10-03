export default function Tarjeta({
  titulo, valor, detalle, tono = "neutro",
}: { titulo: string; valor: string; detalle?: string; tono?: "neutro" | "positivo" | "negativo" }) {
  const color = tono === "positivo" ? "text-emerald-700" : tono === "negativo" ? "text-red-700" : "text-slate-900";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </div>
  );
}
