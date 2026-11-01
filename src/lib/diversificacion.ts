import type { Tenencia } from "./rendimiento";

export interface Participacion {
  emisora: string;
  valor: number;
  /** Fracción del portafolio (0.25 = 25 %). */
  porcentaje: number;
}

export type NivelConcentracion = "alta" | "moderada" | "baja";

export interface Diversificacion {
  total: number;
  participaciones: Participacion[];
  mayor: Participacion | null;
  nivel: NivelConcentracion;
}

/**
 * Sprint 4: composición del portafolio por emisora, a partir de la tenencia valuada.
 * Concentración: alta si una emisora pesa más de 50 %, moderada si pesa más de 30 %.
 */
export function calcularDiversificacion(tenencias: Tenencia[]): Diversificacion {
  const total = tenencias.reduce((s, t) => s + t.valor, 0);
  const participaciones = tenencias
    .map((t) => ({ emisora: t.emisora, valor: t.valor, porcentaje: total > 0 ? t.valor / total : 0 }))
    .sort((a, b) => b.valor - a.valor);
  const mayor = participaciones[0] ?? null;
  const nivel: NivelConcentracion = !mayor || mayor.porcentaje > 0.5 ? "alta" : mayor.porcentaje > 0.3 ? "moderada" : "baja";
  return { total, participaciones, mayor, nivel };
}
