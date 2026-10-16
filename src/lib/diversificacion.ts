import { calcularRendimiento, type Tenencia } from "./rendimiento";
import type { Movimiento } from "./tipos";

/** Máximo de emisoras con color propio; el resto se agrupa en "Otras". */
export const MAX_SEGMENTOS = 7;

export interface PesoActivo {
  emisora: string;
  valor: number;
  /** Fracción del valor total de la tenencia. */
  peso: number;
}

export interface Diversificacion {
  valorTotal: number;
  activos: PesoActivo[];
  /** Activos para la gráfica: los MAX_SEGMENTOS más grandes + "Otras" si sobran. */
  segmentos: PesoActivo[];
  /** Índice Herfindahl-Hirschman (Σ peso²): 1 = todo en un activo. */
  hhi: number;
  /** 1 / HHI: cuántos activos de igual peso equivaldrían a esta cartera. */
  activosEfectivos: number;
  nivel: "diversificada" | "moderada" | "concentrada";
}

/**
 * Sprint 4: diversificación de la tenencia actual por activo (emisora),
 * ponderada por el valor de mercado con el último precio registrado.
 */
export function calcularDiversificacion(tenencias: Tenencia[]): Diversificacion {
  const valorTotal = tenencias.reduce((s, t) => s + t.valor, 0);
  const activos: PesoActivo[] = tenencias
    .filter((t) => t.valor > 0)
    .map((t) => ({ emisora: t.emisora, valor: t.valor, peso: valorTotal > 0 ? t.valor / valorTotal : 0 }))
    .sort((a, b) => b.valor - a.valor);

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
  // Umbrales usuales del HHI (escala 0–10 000): < 1 500 y > 2 500.
  const nivel = hhi < 0.15 ? "diversificada" : hhi <= 0.25 ? "moderada" : "concentrada";

  return {
    valorTotal,
    activos,
    segmentos,
    hhi,
    activosEfectivos: hhi > 0 ? 1 / hhi : 0,
    nivel: activos.length ? nivel : "diversificada",
  };
}

export interface OpcionPeriodo {
  id: string;
  etiqueta: string;
  /** Fecha de corte (YYYY-MM-DD): se toman los movimientos hasta ese día, inclusive. */
  corte: string;
}

/**
 * Sprint 4: periodos para filtrar la gráfica. "Actual" es la última fecha del CSV;
 * además, el cierre de cada año completo que tenga movimientos.
 */
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

/** Diversificación de la cartera tal como estaba en la fecha de corte (valuada con el último precio hasta ese día). */
export function diversificacionAl(movimientos: Movimiento[], corte: string): Diversificacion {
  return calcularDiversificacion(calcularRendimiento(movimientos.filter((m) => m.fecha <= corte)).tenencias);
}

/**
 * Orden fijo de emisoras para asignar colores: por primera aparición en el CSV.
 * Así una emisora conserva su color aunque cambie de lugar al filtrar el periodo.
 */
export function ordenEmisoras(movimientos: Movimiento[]): string[] {
  const ordenados = [...movimientos].map((m, i) => ({ m, i }))
    .sort((a, b) => a.m.fecha.localeCompare(b.m.fecha) || a.i - b.i);
  return [...new Set(ordenados.map(({ m }) => m.emisora))];
}
