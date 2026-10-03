import type { Movimiento, TipoMovimiento } from "./tipos";

export interface FilaComision {
  fecha: string;
  tipo: TipoMovimiento;
  emisora: string;
  monto: number; // titulos × precio
  comision: number;
  /** Comisión como fracción del monto operado. */
  porcentaje: number;
}

export interface ResumenComisiones {
  total: number;
  /** Comisión total sobre el monto total operado (fracción). */
  porcentajeSobreOperado: number;
  filas: FilaComision[];
  porEmisora: { emisora: string; comision: number }[];
}

/**
 * Entregable 3 (E3): total de comisiones pagadas y desglose por movimiento.
 */
export function calcularComisiones(movimientos: Movimiento[]): ResumenComisiones {
  const filas: FilaComision[] = [...movimientos]
    .map((m, i) => ({ m, i }))
    .sort((a, b) => a.m.fecha.localeCompare(b.m.fecha) || a.i - b.i)
    .map(({ m }) => {
      const monto = m.titulos * m.precio;
      return {
        fecha: m.fecha,
        tipo: m.tipo,
        emisora: m.emisora,
        monto,
        comision: m.comision,
        porcentaje: monto > 0 ? m.comision / monto : 0,
      };
    });

  const total = filas.reduce((s, f) => s + f.comision, 0);
  const operado = filas.reduce((s, f) => s + f.monto, 0);

  const mapa = new Map<string, number>();
  for (const f of filas) mapa.set(f.emisora, (mapa.get(f.emisora) ?? 0) + f.comision);
  const porEmisora = [...mapa.entries()]
    .map(([emisora, comision]) => ({ emisora, comision }))
    .sort((a, b) => b.comision - a.comision);

  return { total, porcentajeSobreOperado: operado > 0 ? total / operado : 0, filas, porEmisora };
}
