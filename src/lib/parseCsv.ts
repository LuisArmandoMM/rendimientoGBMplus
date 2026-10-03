import Papa from "papaparse";
import { filaSchema } from "./schema";
import { COLUMNAS, type Movimiento, type ResultadoParseo } from "./tipos";

const MAX_ERRORES_MOSTRADOS = 10;
const MAX_FILAS = 50_000;

/**
 * Entregable 1 (E1): valida el contenido de un CSV de movimientos y devuelve
 * movimientos limpios o una lista de mensajes de error comprensibles.
 */
export function parsearCsv(texto: string): ResultadoParseo {
  if (!texto || texto.trim() === "") {
    return { ok: false, errores: ["El archivo está vacío. Sube un CSV con tus movimientos."] };
  }

  const sinBom = texto.replace(/^\uFEFF/, "");
  const parsed = Papa.parse<Record<string, string>>(sinBom, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const columnasArchivo = parsed.meta.fields ?? [];
  const faltantes = COLUMNAS.filter((c) => !columnasArchivo.includes(c));
  if (faltantes.length > 0) {
    return {
      ok: false,
      errores: [
        `Faltan columnas obligatorias: ${faltantes.join(", ")}. ` +
          `El archivo debe incluir: ${COLUMNAS.join(", ")}.`,
      ],
    };
  }

  if (parsed.data.length === 0) {
    return { ok: false, errores: ["El archivo tiene encabezados pero no contiene movimientos."] };
  }
  if (parsed.data.length > MAX_FILAS) {
    return { ok: false, errores: [`El archivo supera el límite de ${MAX_FILAS} movimientos.`] };
  }

  const errores: string[] = [];
  const movimientos: Movimiento[] = [];

  parsed.data.forEach((fila, i) => {
    const linea = i + 2; // +1 por encabezado, +1 porque las líneas inician en 1
    const r = filaSchema.safeParse(fila);
    if (!r.success) {
      const detalle = r.error.issues.map((e) => e.message).join("; ");
      errores.push(`Línea ${linea}: ${detalle}.`);
    } else {
      movimientos.push(r.data as Movimiento);
    }
  });

  // Regla de negocio: no se puede vender más de lo que se tiene (orden cronológico).
  if (errores.length === 0) {
    const tenencia = new Map<string, number>();
    const ordenados = movimientos
      .map((m, idx) => ({ m, idx }))
      .sort((a, b) => a.m.fecha.localeCompare(b.m.fecha) || a.idx - b.idx);
    for (const { m, idx } of ordenados) {
      const actual = tenencia.get(m.emisora) ?? 0;
      if (m.tipo === "compra") tenencia.set(m.emisora, actual + m.titulos);
      if (m.tipo === "venta") {
        if (m.titulos > actual + 1e-9) {
          errores.push(
            `Línea ${idx + 2}: se venden ${m.titulos} títulos de ${m.emisora} pero solo había ${actual} en cartera a esa fecha.`
          );
        } else {
          tenencia.set(m.emisora, actual - m.titulos);
        }
      }
    }
  }

  if (errores.length > 0) {
    const mostrados = errores.slice(0, MAX_ERRORES_MOSTRADOS);
    if (errores.length > MAX_ERRORES_MOSTRADOS) {
      mostrados.push(`… y ${errores.length - MAX_ERRORES_MOSTRADOS} errores más.`);
    }
    return { ok: false, errores: mostrados };
  }

  return { ok: true, movimientos };
}
