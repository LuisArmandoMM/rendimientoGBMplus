export const COLUMNAS = ["fecha", "tipo", "emisora", "titulos", "precio", "comision"] as const;
export const TIPOS = ["compra", "venta", "dividendo"] as const;

export type TipoMovimiento = (typeof TIPOS)[number];

export interface Movimiento {
  fecha: string; // YYYY-MM-DD
  tipo: TipoMovimiento;
  emisora: string;
  titulos: number;
  precio: number; // precio por título (en dividendos: dividendo por título)
  comision: number;
}

export type ResultadoParseo =
  | { ok: true; movimientos: Movimiento[] }
  | { ok: false; errores: string[] };
