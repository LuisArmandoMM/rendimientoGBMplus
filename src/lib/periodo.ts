import type { Movimiento } from "./tipos";

export interface Periodo {
  desde?: string; // AAAA-MM-DD, inclusive
  hasta?: string; // AAAA-MM-DD, inclusive
}

export type PresetPeriodo = "todo" | "anio" | "12m" | "6m";

export interface DatosPeriodo {
  /** Movimientos reales dentro del periodo: se usan para comisiones y tablas. */
  reales: Movimiento[];
  /** Reales + saldo inicial: se usan para rendimiento e inflación. */
  analisis: Movimiento[];
  /** Valor de la tenencia que ya existía al inicio del periodo. */
  saldoInicial: number;
}

const ordenar = (movs: Movimiento[]) =>
  movs
    .map((m, i) => ({ m, i }))
    .sort((a, b) => a.m.fecha.localeCompare(b.m.fecha) || a.i - b.i)
    .map((x) => x.m);

export function limitesFechas(movs: Movimiento[]): { min: string; max: string } {
  const f = movs.map((m) => m.fecha).sort();
  return { min: f[0] ?? "", max: f[f.length - 1] ?? "" };
}

/**
 * Sprint 4: filtro por periodo.
 * Lo que ya se tenía antes de `desde` se toma como saldo inicial: se agrega como una compra
 * sintética en la fecha `desde`, valuada al último precio previo y sin comisión. Así el
 * rendimiento del periodo mide solo lo ocurrido dentro de él.
 */
export function aplicarPeriodo(movs: Movimiento[], periodo: Periodo): DatosPeriodo {
  const { desde, hasta } = periodo;
  const ordenados = ordenar(movs);
  const reales = ordenados.filter((m) => (!desde || m.fecha >= desde) && (!hasta || m.fecha <= hasta));

  const sintéticos: Movimiento[] = [];
  let saldoInicial = 0;
  if (desde) {
    const pos = new Map<string, { titulos: number; precio: number }>();
    for (const m of ordenados) {
      if (m.fecha >= desde) break;
      if (m.tipo === "dividendo") continue;
      const p = pos.get(m.emisora) ?? { titulos: 0, precio: m.precio };
      p.titulos += m.tipo === "compra" ? m.titulos : -m.titulos;
      p.precio = m.precio;
      pos.set(m.emisora, p);
    }
    for (const [emisora, p] of pos) {
      if (p.titulos > 1e-9) {
        sintéticos.push({ fecha: desde, tipo: "compra", emisora, titulos: p.titulos, precio: p.precio, comision: 0 });
        saldoInicial += p.titulos * p.precio;
      }
    }
  }
  return { reales, analisis: ordenar([...sintéticos, ...reales]), saldoInicial };
}

function restarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

function restarMeses(iso: string, meses: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - meses);
  return d.toISOString().slice(0, 10);
}

/** Periodos rápidos, calculados respecto al último movimiento del archivo. */
export function periodoPreset(id: PresetPeriodo, max: string): Periodo {
  if (!max || id === "todo") return {};
  if (id === "anio") return { desde: `${max.slice(0, 4)}-01-01` };
  if (id === "12m") return { desde: restarDias(max, 365) };
  return { desde: restarMeses(max, 6) };
}
