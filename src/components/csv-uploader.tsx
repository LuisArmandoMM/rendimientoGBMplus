"use client";

import { useCallback, useRef, useState } from "react";
import { parseMovementsCsv } from "@/lib/csv/parse-movements";
import type { CsvRowError, Movement } from "@/types/movement";

type Status = "idle" | "parsing" | "success" | "error";

interface ParsedState {
  status: Status;
  fileName: string | null;
  data: Movement[];
  errors: CsvRowError[];
  fileError: string | null;
}

const INITIAL_STATE: ParsedState = {
  status: "idle",
  fileName: null,
  data: [],
  errors: [],
  fileError: null,
};

const PREVIEW_ROWS = 5;
const MAX_ERRORS_SHOWN = 10;

export function CsvUploader() {
  const [state, setState] = useState<ParsedState>(INITIAL_STATE);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setState({ ...INITIAL_STATE, status: "parsing", fileName: file.name });

    const result = await parseMovementsCsv(file);

    setState({
      status: result.fileError ? "error" : "success",
      fileName: file.name,
      data: result.data,
      errors: result.errors,
      fileError: result.fileError,
    });
  }, []);

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
    event.target.value = ""; // permite volver a subir el mismo archivo
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => setState(INITIAL_STATE);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Subir archivo CSV de movimientos"
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onInputChange}
        />
        <p className="text-sm font-medium text-gray-700">
          Arrastra tu archivo CSV de movimientos aquí, o haz clic para
          seleccionarlo
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Formato esperado: fecha, tipo_movimiento, instrumento, tipo_activo,
          cantidad, precio, monto, comision
        </p>
        {state.status === "parsing" && (
          <p className="mt-4 text-sm text-blue-600">Procesando archivo…</p>
        )}
      </div>

      {state.fileError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">No se pudo procesar el archivo</p>
          <p className="mt-1">{state.fileError}</p>
          <button
            onClick={reset}
            className="mt-3 text-xs font-medium text-red-700 underline underline-offset-2"
          >
            Intentar con otro archivo
          </button>
        </div>
      )}

      {state.status === "success" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <span>
              <strong>{state.fileName}</strong> procesado:{" "}
              <strong>{state.data.length}</strong> movimientos válidos
              {state.errors.length > 0 && (
                <>
                  {" "}
                  y <strong>{state.errors.length}</strong> filas con errores
                </>
              )}
              .
            </span>
            <button
              onClick={reset}
              className="text-xs font-medium text-green-800 underline underline-offset-2"
            >
              Subir otro archivo
            </button>
          </div>

          {state.errors.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold">
                Filas que no se pudieron procesar
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {state.errors.slice(0, MAX_ERRORS_SHOWN).map((err, i) => (
                  <li key={i}>
                    Fila {err.row}: {err.message}
                  </li>
                ))}
              </ul>
              {state.errors.length > MAX_ERRORS_SHOWN && (
                <p className="mt-2 text-xs">
                  y {state.errors.length - MAX_ERRORS_SHOWN} filas más con
                  errores.
                </p>
              )}
            </div>
          )}

          {state.data.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Fecha",
                      "Movimiento",
                      "Instrumento",
                      "Activo",
                      "Cantidad",
                      "Precio",
                      "Monto",
                      "Comisión",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-medium text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {state.data.slice(0, PREVIEW_ROWS).map((m, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{m.fecha}</td>
                      <td className="px-3 py-2 capitalize">
                        {m.tipoMovimiento}
                      </td>
                      <td className="px-3 py-2">{m.instrumento}</td>
                      <td className="px-3 py-2 capitalize">{m.tipoActivo}</td>
                      <td className="px-3 py-2">{m.cantidad}</td>
                      <td className="px-3 py-2">{m.precio}</td>
                      <td className="px-3 py-2">{m.monto}</td>
                      <td className="px-3 py-2">{m.comision}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {state.data.length > PREVIEW_ROWS && (
                <p className="px-3 py-2 text-xs text-gray-400">
                  Mostrando {PREVIEW_ROWS} de {state.data.length} movimientos.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
