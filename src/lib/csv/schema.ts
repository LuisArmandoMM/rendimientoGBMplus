import { z } from "zod";
import { TIPOS_ACTIVO, TIPOS_MOVIMIENTO } from "@/types/movement";

/**
 * Columnas que el archivo CSV debe traer en el encabezado, en cualquier
 * orden. Este set se usa para dar un mensaje de error claro y específico
 * cuando el usuario sube un archivo con un formato distinto al esperado
 * (historia "Validar formato del archivo").
 */
export const COLUMNAS_ESPERADAS = [
  "fecha",
  "tipo_movimiento",
  "instrumento",
  "tipo_activo",
  "cantidad",
  "precio",
  "monto",
  "comision",
] as const;

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Convierte "1,234.50", "1234.50" o "" a number, o deja pasar el valor para que Zod marque el error. */
function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return value;
  const cleaned = value.replace(/,/g, "").trim();
  if (cleaned === "") return undefined;
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? value : parsed;
}

/**
 * Esquema de una fila cruda del CSV (todo llega como string desde Papa
 * Parse) transformada a los tipos correctos. Cada mensaje está pensado
 * para mostrarse directamente al usuario final.
 */
export const movementRowSchema = z.object({
  fecha: z
    .string({ error: "La columna 'fecha' es obligatoria" })
    .trim()
    .min(1, "La columna 'fecha' es obligatoria")
    .regex(FECHA_REGEX, "La fecha debe tener el formato AAAA-MM-DD"),
  tipo_movimiento: z
    .string({ error: "La columna 'tipo_movimiento' es obligatoria" })
    .trim()
    .min(1, "La columna 'tipo_movimiento' es obligatoria")
    .toLowerCase()
    .pipe(
      z.enum(TIPOS_MOVIMIENTO, {
        error: `tipo_movimiento debe ser uno de: ${TIPOS_MOVIMIENTO.join(", ")}`,
      })
    ),
  instrumento: z
    .string({ error: "La columna 'instrumento' es obligatoria" })
    .trim()
    .min(1, "El instrumento no puede estar vacío"),
  tipo_activo: z
    .string({ error: "La columna 'tipo_activo' es obligatoria" })
    .trim()
    .min(1, "La columna 'tipo_activo' es obligatoria")
    .toLowerCase()
    .pipe(
      z.enum(TIPOS_ACTIVO, {
        error: `tipo_activo debe ser uno de: ${TIPOS_ACTIVO.join(", ")}`,
      })
    ),
  cantidad: z.preprocess(
    toNumber,
    z
      .number({ error: "La cantidad debe ser numérica" })
      .nonnegative("La cantidad no puede ser negativa")
  ),
  precio: z.preprocess(
    toNumber,
    z
      .number({ error: "El precio debe ser numérico" })
      .nonnegative("El precio no puede ser negativo")
  ),
  monto: z.preprocess(
    toNumber,
    z.number({ error: "El monto debe ser numérico" })
  ),
  comision: z.preprocess(
    toNumber,
    z
      .number({ error: "La comisión debe ser numérica" })
      .nonnegative("La comisión no puede ser negativa")
  ),
});

export type MovementRowInput = z.infer<typeof movementRowSchema>;
