import { inflacionAcumulada } from "./inflacion";
import type { Movimiento } from "./tipos";

export interface Tenencia {
  emisora: string;
  titulos: number;
  ultimoPrecio: number;
  valor: number;
}

export interface Rendimiento {
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  totalCompras: number;
  totalVentas: number;
  totalDividendos: number;
  totalComisiones: number;
  valorTenencia: number;
  /** Compras + comisiones. */
  capitalInvertido: number;
  /** Ventas + dividendos + valor de la tenencia actual. */
  valorFinal: number;
  ganancia: number;
  /** Rendimiento simple del periodo (fracción). */
  rendimientoSimple: number;
  tenencias: Tenencia[];
}

export interface ComparacionInflacion {
  inflacionAcumulada: number;
  usaEstimado: boolean;
  /** Diferencia en puntos porcentuales (fracción): rendimiento − inflación. */
  diferencia: number;
  /** Rendimiento real = (1 + r) / (1 + inflación) − 1. */
  rendimientoReal: number;
  superaInflacion: boolean;
}

const MS_DIA = 86_400_000;

/**
 * Entregable 2 (E2): rendimiento simple del portafolio.
 * Valúa la tenencia con el último precio registrado de cada emisora en el CSV.
 *
 *   rendimiento = (ventas + dividendos + valor tenencia − compras − comisiones) / (compras + comisiones)
 */
export function calcularRendimiento(movimientos: Movimiento[]): Rendimiento {
  const ordenados = [...movimientos]
    .map((m, i) => ({ m, i }))
    .sort((a, b) => a.m.fecha.localeCompare(b.m.fecha) || a.i - b.i)
    .map((x) => x.m);

  let totalCompras = 0;
  let totalVentas = 0;
  let totalDividendos = 0;
  let totalComisiones = 0;
  const pos = new Map<string, { titulos: number; ultimoPrecio: number }>();

  for (const m of ordenados) {
    const monto = m.titulos * m.precio;
    const p = pos.get(m.emisora) ?? { titulos: 0, ultimoPrecio: m.precio };
    if (m.tipo === "compra") {
      totalCompras += monto;
      p.titulos += m.titulos;
      p.ultimoPrecio = m.precio;
    } else if (m.tipo === "venta") {
      totalVentas += monto;
      p.titulos -= m.titulos;
      p.ultimoPrecio = m.precio;
    } else {
      totalDividendos += monto;
    }
    totalComisiones += m.comision;
    pos.set(m.emisora, p);
  }

  const tenencias: Tenencia[] = [...pos.entries()]
    .filter(([, p]) => p.titulos > 1e-9)
    .map(([emisora, p]) => ({
      emisora,
      titulos: p.titulos,
      ultimoPrecio: p.ultimoPrecio,
      valor: p.titulos * p.ultimoPrecio,
    }))
    .sort((a, b) => b.valor - a.valor);

  const valorTenencia = tenencias.reduce((s, t) => s + t.valor, 0);
  const capitalInvertido = totalCompras + totalComisiones;
  const valorFinal = totalVentas + totalDividendos + valorTenencia;
  const ganancia = valorFinal - capitalInvertido;

  const fechaInicio = ordenados[0]?.fecha ?? "";
  const fechaFin = ordenados[ordenados.length - 1]?.fecha ?? "";
  const dias = fechaInicio
    ? Math.round((Date.parse(`${fechaFin}T00:00:00Z`) - Date.parse(`${fechaInicio}T00:00:00Z`)) / MS_DIA)
    : 0;

  return {
    fechaInicio,
    fechaFin,
    dias,
    totalCompras,
    totalVentas,
    totalDividendos,
    totalComisiones,
    valorTenencia,
    capitalInvertido,
    valorFinal,
    ganancia,
    rendimientoSimple: capitalInvertido > 0 ? ganancia / capitalInvertido : 0,
    tenencias,
  };
}

export function compararConInflacion(r: Rendimiento): ComparacionInflacion {
  const { acumulada, usaEstimado } = inflacionAcumulada(r.fechaInicio, r.fechaFin);
  return {
    inflacionAcumulada: acumulada,
    usaEstimado,
    diferencia: r.rendimientoSimple - acumulada,
    rendimientoReal: (1 + r.rendimientoSimple) / (1 + acumulada) - 1,
    superaInflacion: r.rendimientoSimple > acumulada,
  };
}
