import { calcularRendimiento } from "./rendimiento";
import type { Movimiento } from "./tipos";

export interface PuntoEvolucion {
  fecha: string;
  /** Compras + comisiones acumuladas hasta la fecha. */
  capitalInvertido: number;
  /** Ventas + dividendos acumulados + tenencia valuada con el último precio hasta la fecha. */
  valor: number;
  /** Rendimiento simple acumulado a la fecha (fracción). */
  rendimiento: number;
}

/**
 * Sprint 5: evolución del portafolio en cada fecha con movimientos.
 * Cada punto es el rendimiento simple (E2) calculado con los movimientos hasta ese día,
 * así el último punto coincide con el rendimiento del periodo completo.
 */
export function evolucionPortafolio(movimientos: Movimiento[]): PuntoEvolucion[] {
  const fechas = [...new Set(movimientos.map((m) => m.fecha))].sort();
  return fechas.map((fecha) => {
    const r = calcularRendimiento(movimientos.filter((m) => m.fecha <= fecha));
    return { fecha, capitalInvertido: r.capitalInvertido, valor: r.valorFinal, rendimiento: r.rendimientoSimple };
  });
}
