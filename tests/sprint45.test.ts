import { describe, expect, it } from "vitest";
import { aplicarPeriodo, limitesFechas, periodoPreset } from "@/lib/periodo";
import { calcularDiversificacion } from "@/lib/diversificacion";
import { calcularRendimiento, compararConInflacion } from "@/lib/rendimiento";
import { calcularComisiones } from "@/lib/comisiones";
import { construirResumen } from "@/lib/resumen";
import type { Movimiento } from "@/lib/tipos";

const m = (fecha: string, tipo: Movimiento["tipo"], emisora: string, titulos: number, precio: number, comision = 0): Movimiento =>
  ({ fecha, tipo, emisora, titulos, precio, comision });

const datos = [
  m("2024-01-10", "compra", "AAA", 10, 100, 10),
  m("2024-06-10", "compra", "BBB", 5, 200, 10),
  m("2025-01-10", "venta", "AAA", 4, 150, 6),
  m("2025-06-10", "compra", "AAA", 2, 160, 4),
];

describe("filtro por periodo (Sprint 4)", () => {
  it("sin filtro devuelve todos los movimientos y ningún saldo inicial", () => {
    const d = aplicarPeriodo(datos, {});
    expect(d.reales).toHaveLength(4);
    expect(d.saldoInicial).toBe(0);
  });

  it("filtra por fechas inclusivas", () => {
    const d = aplicarPeriodo(datos, { desde: "2025-01-10", hasta: "2025-06-10" });
    expect(d.reales.map((x) => x.fecha)).toEqual(["2025-01-10", "2025-06-10"]);
  });

  it("toma la tenencia previa como saldo inicial al último precio conocido", () => {
    const d = aplicarPeriodo(datos, { desde: "2025-01-01" });
    // Antes: 10 AAA a 100 y 5 BBB a 200 → 1000 + 1000
    expect(d.saldoInicial).toBeCloseTo(2000);
    expect(d.analisis).toHaveLength(2 + 2);
    // las comisiones solo cuentan los movimientos reales
    expect(calcularComisiones(d.reales).total).toBe(10);
  });

  it("el rendimiento del periodo no cuenta lo ocurrido antes", () => {
    const d = aplicarPeriodo(datos, { desde: "2025-01-01" });
    const r = calcularRendimiento(d.analisis);
    // Capital: 2000 saldo + 320 compra + 10 comisiones = 2330
    expect(r.capitalInvertido).toBeCloseTo(2000 + 2 * 160 + 10);
    expect(r.fechaInicio).toBe("2025-01-01");
  });

  it("ignora posiciones ya vendidas por completo", () => {
    const d = aplicarPeriodo([m("2024-01-01", "compra", "AAA", 5, 10), m("2024-02-01", "venta", "AAA", 5, 12), m("2024-09-01", "compra", "BBB", 1, 10)], { desde: "2024-06-01" });
    expect(d.saldoInicial).toBe(0);
  });

  it("calcula límites y periodos rápidos respecto al último movimiento", () => {
    expect(limitesFechas(datos)).toEqual({ min: "2024-01-10", max: "2025-06-10" });
    expect(periodoPreset("todo", "2025-06-10")).toEqual({});
    expect(periodoPreset("anio", "2025-06-10")).toEqual({ desde: "2025-01-01" });
    expect(periodoPreset("12m", "2025-06-10")).toEqual({ desde: "2024-06-10" });
    expect(periodoPreset("6m", "2025-06-10")).toEqual({ desde: "2024-12-10" });
  });
});

describe("diversificación (Sprint 4)", () => {
  it("calcula pesos que suman 100 % y ordena de mayor a menor", () => {
    const r = calcularRendimiento(datos);
    const d = calcularDiversificacion(r.tenencias);
    expect(d.participaciones.reduce((s, p) => s + p.porcentaje, 0)).toBeCloseTo(1);
    expect(d.participaciones[0].valor).toBeGreaterThanOrEqual(d.participaciones[1].valor);
  });

  it("clasifica la concentración", () => {
    const t = (emisora: string, valor: number) => ({ emisora, titulos: 1, ultimoPrecio: valor, valor });
    expect(calcularDiversificacion([t("A", 80), t("B", 20)]).nivel).toBe("alta");
    expect(calcularDiversificacion([t("A", 40), t("B", 35), t("C", 25)]).nivel).toBe("moderada");
    expect(calcularDiversificacion([t("A", 25), t("B", 25), t("C", 25), t("D", 25)]).nivel).toBe("baja");
  });

  it("maneja un portafolio sin tenencia", () => {
    const d = calcularDiversificacion([]);
    expect(d.mayor).toBeNull();
    expect(d.total).toBe(0);
  });
});

describe("resumen integrado (Sprint 5)", () => {
  it("junta las métricas de todos los módulos", () => {
    const r = calcularRendimiento(datos);
    const c = compararConInflacion(r);
    const com = calcularComisiones(datos);
    const div = calcularDiversificacion(r.tenencias);
    const s = construirResumen(r, c, com, div);
    expect(s.valorActual).toBe(r.valorFinal);
    expect(s.comisionesTotal).toBe(com.total);
    expect(s.rendimientoSimple).toBe(r.rendimientoSimple);
    expect(s.inflacionAcumulada).toBe(c.inflacionAcumulada);
    expect(s.mayorEmisora?.emisora).toBe(div.mayor?.emisora);
  });
});
