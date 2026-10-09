import { describe, expect, it } from "vitest";
import { calcularComisiones } from "@/lib/comisiones";
import type { Movimiento } from "@/lib/tipos";

const m = (fecha: string, tipo: Movimiento["tipo"], emisora: string, titulos: number, precio: number, comision: number): Movimiento =>
  ({ fecha, tipo, emisora, titulos, precio, comision });

describe("calcularComisiones (E3)", () => {
  const datos = [
    m("2024-02-01", "venta", "BBB", 5, 100, 5),
    m("2024-01-01", "compra", "AAA", 10, 100, 10),
    m("2024-03-01", "compra", "AAA", 10, 100, 10),
  ];

  it("suma el total de comisiones", () => {
    expect(calcularComisiones(datos).total).toBe(25);
  });

  it("desglosa por movimiento en orden cronológico con su porcentaje", () => {
    const r = calcularComisiones(datos);
    expect(r.filas).toHaveLength(3);
    expect(r.filas[0].fecha).toBe("2024-01-01");
    expect(r.filas[0].porcentaje).toBeCloseTo(0.01);
  });

  it("agrupa por emisora de mayor a menor", () => {
    const r = calcularComisiones(datos);
    expect(r.porEmisora[0]).toEqual({ emisora: "AAA", comision: 20 });
  });

  it("calcula el porcentaje sobre el monto operado", () => {
    expect(calcularComisiones(datos).porcentajeSobreOperado).toBeCloseTo(25 / 2500);
  });
});

describe("sprint 3: desglose por tipo", () => {
  const datos = [
    m("2024-01-01", "compra", "AAA", 10, 100, 10),
    m("2024-02-01", "venta", "AAA", 5, 100, 4),
    m("2024-03-01", "compra", "BBB", 10, 100, 12),
  ];
  it("agrupa por tipo con número de operaciones", () => {
    const t = calcularComisiones(datos).porTipo;
    expect(t.find((x) => x.tipo === "compra")).toEqual({ tipo: "compra", comision: 22, operaciones: 2 });
    expect(t.find((x) => x.tipo === "venta")?.operaciones).toBe(1);
  });
  it("identifica la comisión más alta", () => {
    expect(calcularComisiones(datos).mayor?.emisora).toBe("BBB");
    expect(calcularComisiones([m("2024-01-01", "compra", "AAA", 1, 1, 0)]).mayor).toBeNull();
  });
});
