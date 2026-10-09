import { describe, expect, it } from "vitest";
import { calcularRendimiento, compararConInflacion } from "@/lib/rendimiento";
import { inflacionAcumulada } from "@/lib/inflacion";
import type { Movimiento } from "@/lib/tipos";

const m = (fecha: string, tipo: Movimiento["tipo"], emisora: string, titulos: number, precio: number, comision = 0): Movimiento =>
  ({ fecha, tipo, emisora, titulos, precio, comision });

describe("calcularRendimiento (E2)", () => {
  it("calcula el rendimiento simple con ventas, dividendos y tenencia", () => {
    // Compra 10 × 100 = 1000 (+10 comisión) | vende 4 × 120 = 480 | dividendo 6 × 2 = 12 | tenencia 6 × 120 = 720
    const r = calcularRendimiento([
      m("2024-01-01", "compra", "AAA", 10, 100, 10),
      m("2024-06-01", "venta", "AAA", 4, 120, 0),
      m("2024-07-01", "dividendo", "AAA", 6, 2, 0),
    ]);
    expect(r.capitalInvertido).toBeCloseTo(1010);
    expect(r.valorFinal).toBeCloseTo(480 + 12 + 720);
    expect(r.ganancia).toBeCloseTo(202);
    expect(r.rendimientoSimple).toBeCloseTo(202 / 1010);
    expect(r.tenencias).toHaveLength(1);
    expect(r.tenencias[0].titulos).toBe(6);
  });

  it("no depende del orden de las filas", () => {
    const filas = [m("2024-06-01", "venta", "AAA", 4, 120), m("2024-01-01", "compra", "AAA", 10, 100)];
    expect(calcularRendimiento(filas).rendimientoSimple).toBeCloseTo(calcularRendimiento([...filas].reverse()).rendimientoSimple);
  });

  it("devuelve 0 cuando no hay capital invertido", () => {
    expect(calcularRendimiento([]).rendimientoSimple).toBe(0);
  });
});

describe("inflación", () => {
  it("un año completo equivale a la tasa anual (2025: 3.69 %)", () => {
    const { acumulada } = inflacionAcumulada("2025-01-01", "2026-01-01");
    expect(acumulada).toBeCloseTo(0.0369, 4);
  });

  it("periodo de cero días no acumula inflación", () => {
    expect(inflacionAcumulada("2025-05-01", "2025-05-01").acumulada).toBe(0);
  });

  it("marca como estimado un año sin dato", () => {
    expect(inflacionAcumulada("2031-01-01", "2031-07-01").usaEstimado).toBe(true);
  });

  it("compara contra la inflación y calcula el rendimiento real", () => {
    const r = calcularRendimiento([m("2025-01-01", "compra", "AAA", 10, 100), m("2026-01-01", "venta", "AAA", 10, 110)]);
    const c = compararConInflacion(r);
    expect(r.rendimientoSimple).toBeCloseTo(0.1);
    expect(c.superaInflacion).toBe(true);
    expect(c.rendimientoReal).toBeCloseTo(1.1 / 1.0369 - 1, 4);
  });
});

import { ajustarPorInflacion } from "@/lib/rendimiento";

describe("sprint 3: ajuste por inflación y comisiones", () => {
  it("ajusta cada aportación desde su propia fecha", () => {
    const movs = [m("2025-01-01", "compra", "AAA", 10, 100, 0), m("2026-01-01", "venta", "AAA", 10, 110)];
    const r = calcularRendimiento(movs);
    const a = ajustarPorInflacion(movs, r);
    expect(a.capitalAjustado).toBeCloseTo(1000 * 1.0369, 1);
    expect(a.gananciaReal).toBeCloseTo(1100 - 1036.9, 1);
  });

  it("una compra hecha el último día no se ajusta", () => {
    const movs = [m("2025-01-01", "compra", "AAA", 1, 100, 0), m("2026-01-01", "compra", "AAA", 10, 100, 0)];
    const r = calcularRendimiento(movs);
    const a = ajustarPorInflacion(movs, r);
    expect(a.capitalAjustado).toBeCloseTo(100 * 1.0369 + 1000, 1);
  });

  it("calcula el rendimiento sin comisiones", () => {
    const r = calcularRendimiento([m("2024-01-01", "compra", "AAA", 10, 100, 10), m("2024-06-01", "venta", "AAA", 10, 120, 10)]);
    expect(r.rendimientoSinComisiones).toBeCloseTo(200 / 1000);
    expect(r.rendimientoSimple).toBeCloseTo(180 / 1010);
  });
});
