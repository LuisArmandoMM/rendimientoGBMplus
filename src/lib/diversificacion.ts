import { calcularRendimiento, type Tenencia } from "./rendimiento";
import type { Movimiento } from "./tipos";

export const MAX_SEGMENTOS = 7;

export interface Participacion {
  emisora: string;
  valor: number;
  porcentaje: number;
}

export interface PesoActivo {
  emisora: string;
  valor: number;
  peso: number;
}

export type NivelConcentracion = "diversificada" | "moderada" | "concentrada" | "alta" | "baja";

export interface Diversificacion {
  total: number;
  valorTotal: number;
  activos: PesoActivo[];
  participaciones: PesoActivo[];
  segmentos: PesoActivo[];
  mayor: PesoActivo | null;
  hhi: number;
  activosEfectivos: number;
  nivel: NivelConcentracion;
}

export function calcularDiversificacion(tenencias: Tenencia[]): Diversificacion {
  const valorTotal = tenencias.reduce((s, t) => s + t.valor, 0);
  const activos: PesoActivo[] = tenencias
    .filter((t) => t.valor > 0)
    .map((t) => ({ emisora: t.emisora, valor: t.valor, peso: valorTotal > 0 ? t.valor / valorTotal : 0 }))
    .sort((a, b) => b.valor - a.valor);

  const participaciones = activos;
  const mayor = activos[0] ?? null;
  let segmentos = activos;

  if (activos.length > MAX_SEGMENTOS) {
    const resto = activos.slice(MAX_SEGMENTOS - 1);
    segmentos = [
      ...activos.slice(0, MAX_SEGMENTOS - 1),
      {
        emisora: "Otras",
        valor: resto.reduce((s, a) => s + a.valor, 0),
        peso: resto.reduce((s, a) => s + a.peso, 0),
      },
    ];
  }

  const hhi = activos.reduce((s, a) => s + a.peso ** 2, 0);
  const nivel: NivelConcentracion = hhi < 0.15 ? "diversificada" : hhi <= 0.25 ? "moderada" : "concentrada";

  return {
    total: valorTotal,
    valorTotal,
    activos,
    participaciones,
    segmentos,
    mayor,
    hhi,
    activosEfectivos: hhi > 0 ? 1 / hhi : 0,
    nivel: activos.length ? nivel : "diversificada",
  };
}

export interface OpcionPeriodo {
  id: string;
  etiqueta: string;
  corte: string;
}

export function periodosDisponibles(movimientos: Movimiento[]): OpcionPeriodo[] {
  if (!movimientos.length) return [];
  const fechas = movimientos.map((m) => m.fecha).sort();
  const ultima = fechas[fechas.length - 1];
  const anios = [...new Set(fechas.map((f) => f.slice(0, 4)))].filter((a) => a < ultima.slice(0, 4));
  return [
    { id: "actual", etiqueta: "Actual", corte: ultima },
    ...anios.reverse().map((a) => ({ id: a, etiqueta: `Cierre ${a}`, corte: `${a}-12-31` })),
  ];
}

export function diversificacionAl(movimientos: Movimiento[], corte: string): Diversificacion {
  return calcularDiversificacion(calcularRendimiento(movimientos.filter((m) => m.fecha <= corte)).tenencias);
}

export function ordenEmisoras(movimientos: Movimiento[]): string[] {
  const ordenados = [...movimientos].map((m, i) => ({ m, i }))
    .sort((a, b) => a.m.fecha.localeCompare(b.m.fecha) || a.i - b.i);
  return [...new Set(ordenados.map(({ m }) => m.emisora))];
}
}
