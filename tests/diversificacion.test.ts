import { describe, expect, it } from "vitest";
import { calcularDiversificacion, diversificacionAl, MAX_SEGMENTOS, ordenEmisoras, periodosDisponibles } from "@/lib/diversificacion";
import type { Tenencia } from "@/lib/rendimiento";
import type { Movimiento } from "@/lib/tipos";

const t = (emisora: string, valor: number): Tenencia => ({ emisora, titulos: 1, ultimoPrecio: valor, valor });

describe("calcularDiversificacion (Sprint 4)", () => {
  it("calcula el peso de cada activo sobre el valor total, de mayor a menor", () => {
    const d = calcularDiversificacion([t("BBB", 250), t("AAA", 750)]);
    expect(d.valorTotal).toBe(1000);
    expect(d.activos.map((a) => a.emisora)).toEqual(["AAA", "BBB"]);
    expect(d.activos[0].peso).toBeCloseTo(0.75);
    expect(d.activos.reduce((s, a) => s + a.peso, 0)).toBeCloseTo(1);
  });

  it("un solo activo es cartera concentrada con HHI = 1", () => {
    const d = calcularDiversificacion([t("AAA", 500)]);
    expect(d.hhi).toBeCloseTo(1);
    expect(d.activosEfectivos).toBeCloseTo(1);
    expect(d.nivel).toBe("concentrada");
  });

  it("pesos iguales: activos efectivos = número de activos", () => {
    const d = calcularDiversificacion(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map((e) => t(e, 100)));
    expect(d.activosEfectivos).toBeCloseTo(10);
    expect(d.nivel).toBe("diversificada");
  });

  it("agrupa en 'Otras' lo que excede el máximo de segmentos", () => {
    const d = calcularDiversificacion(Array.from({ length: 10 }, (_, i) => t(`E${i}`, 100 - i)));
    expect(d.segmentos).toHaveLength(MAX_SEGMENTOS);
    expect(d.segmentos.at(-1)?.emisora).toBe("Otras");
    expect(d.segmentos.reduce((s, a) => s + a.peso, 0)).toBeCloseTo(1);
  });

  it("sin tenencia no truena", () => {
    const d = calcularDiversificacion([]);
    expect(d.activos).toEqual([]);
    expect(d.hhi).toBe(0);
  });
});

describe("filtro por periodo (Sprint 4)", () => {
  const mov = (fecha: string, tipo: Movimiento["tipo"], emisora: string, titulos: number, precio: number): Movimiento =>
    ({ fecha, tipo, emisora, titulos, precio, comision: 0 });
  const datos = [
    mov("2024-03-01", "compra", "AAA", 10, 100),
    mov("2025-02-01", "compra", "BBB", 10, 50),
    mov("2025-06-01", "venta", "AAA", 10, 120),
    mov("2026-01-15", "compra", "CCC", 6, 100),
  ];

  it("ofrece 'Actual' y el cierre de cada año anterior, del más reciente al más antiguo", () => {
    expect(periodosDisponibles(datos)).toEqual([
      { id: "actual", etiqueta: "Actual", corte: "2026-01-15" },
      { id: "2025", etiqueta: "Cierre 2025", corte: "2025-12-31" },
      { id: "2024", etiqueta: "Cierre 2024", corte: "2024-12-31" },
    ]);
    expect(periodosDisponibles([])).toEqual([]);
  });

  it("calcula la cartera con los movimientos hasta la fecha de corte", () => {
    expect(diversificacionAl(datos, "2024-12-31").activos.map((a) => a.emisora)).toEqual(["AAA"]);
    const d2025 = diversificacionAl(datos, "2025-12-31");
    expect(d2025.activos.map((a) => a.emisora)).toEqual(["BBB"]);
    expect(diversificacionAl(datos, "2026-01-15").activos.map((a) => a.emisora)).toEqual(["CCC", "BBB"]);
  });

  it("el orden de colores sigue la primera aparición, no el peso", () => {
    expect(ordenEmisoras([...datos].reverse())).toEqual(["AAA", "BBB", "CCC"]);
  });
});
