"use client";

import { useRef, useState } from "react";
import { parsearCsv } from "@/lib/parseCsv";
import type { Movimiento } from "@/lib/tipos";

interface Props {
  onCargado: (movimientos: Movimiento[], nombre: string) => void;
  onLimpiar: () => void;
}

const MAX_BYTES = 5 * 1024 * 1024;

export default function CargaCsv({ onCargado, onLimpiar }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [arrastrando, setArrastrando] = useState(false);

  async function procesar(archivo: File | undefined) {
    if (!archivo) return;
    setErrores([]);

    if (!archivo.name.toLowerCase().endsWith(".csv")) {
      setErrores(["El archivo debe tener extensión .csv."]);
      onLimpiar();
      return;
    }
    if (archivo.size > MAX_BYTES) {
      setErrores(["El archivo supera el tamaño máximo de 5 MB."]);
      onLimpiar();
      return;
    }

    const texto = await archivo.text();
    const resultado = parsearCsv(texto);
    if (resultado.ok) {
      onCargado(resultado.movimientos, archivo.name);
    } else {
      setErrores(resultado.errores);
      onLimpiar();
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <section aria-labelledby="titulo-carga" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 id="titulo-carga" className="text-lg font-semibold">1. Carga tu archivo CSV</h2>
      <p className="mt-1 text-sm text-slate-600">
        Columnas requeridas: <code className="rounded bg-slate-100 px-1">fecha, tipo, emisora, titulos, precio, comision</code>.{" "}
        Tipos válidos: compra, venta, dividendo.{" "}
        <a className="text-blue-700 underline" href="/ejemplo.csv" download>Descargar archivo de ejemplo</a>
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); procesar(e.dataTransfer.files[0]); }}
        className={`mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition ${
          arrastrando ? "border-blue-500 bg-blue-50" : "border-slate-300"
        }`}
      >
        <p className="text-sm text-slate-600">Arrastra tu CSV aquí o</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Seleccionar archivo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => procesar(e.target.files?.[0])}
        />
      </div>

      {errores.length > 0 && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">No pudimos procesar el archivo:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {errores.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
