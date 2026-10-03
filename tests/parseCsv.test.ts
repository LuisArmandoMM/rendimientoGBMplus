import { describe, expect, it } from "vitest";
import { parsearCsv } from "@/lib/parseCsv";

const ENCABEZADO = "fecha,tipo,emisora,titulos,precio,comision";

describe("parsearCsv (E1)", () => {
  it("acepta un CSV válido", () => {
    const r = parsearCsv(`${ENCABEZADO}\n2024-01-10,compra,walmex*,10,50,5\n2024-02-10,venta,WALMEX*,4,60,3`);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.movimientos).toHaveLength(2);
      expect(r.movimientos[0].emisora).toBe("WALMEX*");
      expect(r.movimientos[0].titulos).toBe(10);
    }
  });

  it("rechaza archivo vacío con mensaje claro", () => {
    const r = parsearCsv("   ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores[0]).toMatch(/vacío/);
  });

  it("indica las columnas faltantes", () => {
    const r = parsearCsv("fecha,tipo,emisora\n2024-01-10,compra,AAA");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores[0]).toMatch(/titulos, precio, comision/);
  });

  it("reporta la línea y el motivo de una fila inválida", () => {
    const r = parsearCsv(`${ENCABEZADO}\n2024-13-45,compra,AAA,10,50,5\n2024-01-10,regalo,AAA,10,50,5\n2024-01-11,compra,AAA,-1,50,5`);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errores.join(" ")).toMatch(/Línea 2.*fecha/);
      expect(r.errores.join(" ")).toMatch(/Línea 3.*tipo/);
      expect(r.errores.join(" ")).toMatch(/Línea 4.*titulos/);
    }
  });

  it("rechaza vender más títulos de los que se tienen", () => {
    const r = parsearCsv(`${ENCABEZADO}\n2024-01-10,compra,AAA,5,50,1\n2024-02-10,venta,AAA,8,60,1`);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores[0]).toMatch(/Línea 3.*solo había 5/);
  });

  it("acepta montos con $ y comas", () => {
    const r = parsearCsv(`${ENCABEZADO}\n2024-01-10,compra,AAA,"1,000","$50.00",5`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.movimientos[0].titulos).toBe(1000);
  });
});
