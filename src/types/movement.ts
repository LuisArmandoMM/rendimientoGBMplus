/**
 * Tipos de dominio para el prototipo "Dashboard de Finanzas Personales".
 *
 * Un Movement representa una fila del CSV de movimientos que el usuario
 * exporta de su broker (por ejemplo GBM), o una fila de valuación con el
 * precio actual de un instrumento (tipoMovimiento = "valuacion").
 */

export const TIPOS_MOVIMIENTO = [
  "compra",
  "venta",
  "dividendo",
  "comision",
  "deposito",
  "retiro",
  // Fila de valuación: no es una operación, sino el precio actual de un
  // instrumento a una fecha de corte (`precio` = precio actual, `fecha` =
  // fecha de corte). Se usa para calcular el valor actual del portafolio.
  "valuacion",
] as const;

export const TIPOS_ACTIVO = [
  "accion",
  "etf",
  "fibra",
  "deuda",
  "efectivo",
  "otro",
] as const;

export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];
export type TipoActivo = (typeof TIPOS_ACTIVO)[number];

export interface Movement {
  fecha: string; // ISO 8601 (YYYY-MM-DD)
  tipoMovimiento: TipoMovimiento;
  instrumento: string;
  tipoActivo: TipoActivo;
  cantidad: number;
  precio: number;
  monto: number;
  comision: number;
}

/** Un error de validación asociado a una fila específica del CSV. */
export interface CsvRowError {
  row: number; // número de fila dentro del archivo (1 = primera fila de datos)
  message: string;
}

/** Resultado devuelto por el parser de movimientos. */
export interface ParseMovementsResult {
  data: Movement[];
  errors: CsvRowError[];
  /** Error a nivel de archivo (encabezados faltantes, archivo vacío, etc.) */
  fileError: string | null;
}
