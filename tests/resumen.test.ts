import { describe, expect, it } from "vitest";
import { calcularRendimiento } from "@/lib/rendimiento";
import { evolucionPortafolio } from "@/lib/resumen";
import type { Movimiento } from "@/lib/tipos";

const m = (fecha: string, tipo: Movimiento["tipo"], emisora: string, titulos: number, precio: number, comision = 0): Movimiento =>
  ({ fecha, tipo, emisora, titulos, precio, comision });

describe("evolucionPortafolio (Sprint 5)", () => {
  const movs = [
    m("2024-06-01", "venta", "AAA", 4, 120),
    m("2024-01-01", "compra", "AAA", 10, 100, 10),
    m("2024-01-01", "compra", "BBB", 5, 50),
    m("2024-07-01", "dividendo", "AAA", 6, 2),
  ];

  it("genera un punto por fecha distinta, en orden cronológico", () => {
    expect(evolucionPortafolio(movs).map((p) => p.fecha)).toEqual(["2024-01-01", "2024-06-01", "2024-07-01"]);
  });

  it("acumula capital y valor con los movimientos hasta cada fecha", () => {
    const [p1, p2] = evolucionPortafolio(movs);
    expect(p1.capitalInvertido).toBeCloseTo(1000 + 10 + 250);
    expect(p1.valor).toBeCloseTo(1000 + 250);
    // Vende 4 a 120: AAA se revalúa a 120 → 480 + 6 × 120 + 250
    expect(p2.valor).toBeCloseTo(480 + 720 + 250);
  });

  it("el último punto coincide con el rendimiento del periodo", () => {
    const serie = evolucionPortafolio(movs);
    const r = calcularRendimiento(movs);
    expect(serie[serie.length - 1].rendimiento).toBeCloseTo(r.rendimientoSimple);
    expect(serie[serie.length - 1].valor).toBeCloseTo(r.valorFinal);
  });

  it("sin movimientos devuelve una serie vacía", () => {
    expect(evolucionPortafolio([])).toEqual([]);
  });
});
