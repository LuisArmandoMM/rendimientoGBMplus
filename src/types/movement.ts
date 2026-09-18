/**
 * Tipos de dominio para el prototipo "Dashboard de Finanzas Personales".
 *
 * Un Movement representa una fila del CSV de movimientos que el usuario
 * exporta de su broker (por ejemplo GBM). El objetivo del Sprint 1 es
 * únicamente leer y validar este archivo; los cálculos de rendimiento,
 * comisiones y diversificación llegan en sprints posteriores.
 */

export const TIPOS_MOVIMIENTO = [
  "compra",
  "venta",
  "dividendo",
  "comision",
  "deposito",
  "retiro",
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
