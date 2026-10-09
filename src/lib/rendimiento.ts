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
  /** Rendimiento que habría tenido el portafolio sin pagar comisiones (fracción). */
  rendimientoSinComisiones: number;
  tenencias: Tenencia[];
}

export interface AjustePorInflacion {
  /** Lo que habría que tener hoy para conservar el poder adquisitivo de cada aportación. */
  capitalAjustado: number;
  /** Valor final menos capital ajustado: ganancia en pesos ya descontada la inflación. */
  gananciaReal: number;
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
    rendimientoSinComisiones:
      totalCompras > 0 ? (ganancia + totalComisiones) / totalCompras : 0,
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

/**
 * Sprint 3: ajusta cada aportación (compra + comisión) por la inflación desde su
 * propia fecha hasta el final del periodo. Así una compra reciente no se penaliza
 * con la inflación de todo el periodo.
 * Simplificación: los ingresos por ventas y dividendos se toman a valor nominal.
 */
export function ajustarPorInflacion(movimientos: Movimiento[], r: Rendimiento): AjustePorInflacion {
  let capitalAjustado = 0;
  for (const m of movimientos) {
    const aporte = (m.tipo === "compra" ? m.titulos * m.precio : 0) + m.comision;
    if (aporte <= 0) continue;
    capitalAjustado += aporte * (1 + inflacionAcumulada(m.fecha, r.fechaFin).acumulada);
  }
  return { capitalAjustado, gananciaReal: r.valorFinal - capitalAjustado };
}
