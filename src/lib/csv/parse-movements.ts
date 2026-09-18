import Papa from "papaparse";
import { COLUMNAS_ESPERADAS, movementRowSchema } from "./schema";
import type { Movement, ParseMovementsResult } from "@/types/movement";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB, suficiente para un estado de cuenta

/**
 * Valida las condiciones mínimas del archivo antes de intentar parsearlo:
 * extensión, tamaño y que no esté vacío. Devuelve un mensaje de error listo
 * para mostrar al usuario, o null si el archivo puede procesarse.
 *
 * Cubre la historia "Como usuario quiero ver un mensaje claro si el archivo
 * no es válido".
 */
export function validateFileBeforeParsing(file: File): string | null {
  const isCsvExtension = file.name.toLowerCase().endsWith(".csv");
  const isCsvMimeType =
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel" ||
    file.type === "";

  if (!isCsvExtension || !isCsvMimeType) {
    return "El archivo debe tener formato .csv. Verifica que lo hayas exportado correctamente desde tu broker.";
  }

  if (file.size === 0) {
    return "El archivo está vacío. Exporta de nuevo tu estado de cuenta e inténtalo otra vez.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "El archivo es demasiado grande (máximo 5 MB). Exporta un periodo más corto.";
  }

  return null;
}

/**
 * Revisa que el encabezado del CSV contenga todas las columnas esperadas.
 * No importa el orden de las columnas, pero sí que ninguna falte.
 */
function findMissingColumns(headerRow: string[]): string[] {
  const normalized = headerRow.map((h) => h.trim().toLowerCase());
  return COLUMNAS_ESPERADAS.filter((col) => !normalized.includes(col));
}

/**
 * Lee un archivo CSV de movimientos, valida el encabezado y cada fila, y
 * regresa tanto los movimientos válidos como la lista de errores por fila.
 * El archivo nunca se rechaza por completo si solo algunas filas fallan:
 * se procesan las filas válidas y se reportan las inválidas, para que el
 * usuario pueda corregir su archivo con información concreta.
 */
export function parseMovementsCsv(file: File): Promise<ParseMovementsResult> {
  const fileError = validateFileBeforeParsing(file);
  if (fileError) {
    return Promise.resolve({ data: [], errors: [], fileError });
  }

  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headerRow = results.meta.fields ?? [];
        const missingColumns = findMissingColumns(headerRow);

        if (headerRow.length === 0) {
          resolve({
            data: [],
            errors: [],
            fileError:
              "No se pudo leer el encabezado del archivo. Verifica que la primera fila tenga los nombres de columna.",
          });
          return;
        }

        if (missingColumns.length > 0) {
          resolve({
            data: [],
            errors: [],
            fileError: `Al archivo le faltan las columnas: ${missingColumns.join(", ")}. Las columnas esperadas son: ${COLUMNAS_ESPERADAS.join(", ")}.`,
          });
          return;
        }

        const data: Movement[] = [];
        const errors: { row: number; message: string }[] = [];

        results.data.forEach((rawRow, index) => {
          const parsed = movementRowSchema.safeParse(rawRow);

          if (!parsed.success) {
            const firstIssue = parsed.error.issues[0];
            errors.push({
              row: index + 1,
              message: firstIssue?.message ?? "Fila inválida",
            });
            return;
          }

          const row = parsed.data;
          data.push({
            fecha: row.fecha,
            tipoMovimiento: row.tipo_movimiento,
            instrumento: row.instrumento,
            tipoActivo: row.tipo_activo,
            cantidad: row.cantidad,
            precio: row.precio,
            monto: row.monto,
            comision: row.comision,
          });
        });

        resolve({ data, errors, fileError: null });
      },
      error: (err: Error) => {
        resolve({
          data: [],
          errors: [],
          fileError: `No se pudo leer el archivo: ${err.message}`,
        });
      },
    });
  });
}
