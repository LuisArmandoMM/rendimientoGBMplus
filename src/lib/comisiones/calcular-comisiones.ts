import type { Movement } from "@/types/movement";

/**
 * Total de comisiones pagadas.
 *
 * Fórmula:
 *
 *   T = Σ comision(compra, venta) + Σ |monto|(comision)
 *
 * Misma regla que usa el cálculo de rendimiento: la columna `comision` solo
 * aplica a filas de compra y venta; en filas de tipo `comision` se usa
 * únicamente `monto` (su valor absoluto), para no contar la misma comisión
 * dos veces. Los demás tipos de movimiento no aportan comisiones.
 *
 * Solo se calcula el total; el desglose por movimiento corresponde al
 * Sprint 3.
 */

export type ResultadoComisiones =
  | { estado: "sin-datos" }
  | {
      estado: "calculado";
      total: number; // T, en pesos
      /** Movimientos que aportaron una comisión mayor a cero. */
      movimientosConComision: number;
    };

/**
 * Devuelve la comisión de un movimiento en centavos enteros, o 0 si el
 * movimiento no genera comisión o el valor no es un número válido. Sumar en
 * centavos evita errores de punto flotante (0.1 + 0.2 ≠ 0.3).
 */
function comisionEnCentavos(m: Movement): number {
  let valor: unknown;
  if (m.tipoMovimiento === "compra" || m.tipoMovimiento === "venta") {
    valor = m.comision;
  } else if (m.tipoMovimiento === "comision") {
    valor = m.monto;
  } else {
    return 0;
  }

  // El esquema Zod ya rechaza filas con valores vacíos o no numéricos; esta
  // guarda protege el cálculo si llegara un null, undefined o NaN.
  if (typeof valor !== "number" || !Number.isFinite(valor)) return 0;
  return Math.round(Math.abs(valor) * 100);
}

export function calcularTotalComisiones(
  movimientos: Movement[]
): ResultadoComisiones {
  if (movimientos.length === 0) {
    return { estado: "sin-datos" };
  }

  let totalCentavos = 0;
  let movimientosConComision = 0;

  for (const m of movimientos) {
    const centavos = comisionEnCentavos(m);
    if (centavos > 0) {
      totalCentavos += centavos;
      movimientosConComision += 1;
    }
  }

  return {
    estado: "calculado",
    total: totalCentavos / 100,
    movimientosConComision,
  };
}
