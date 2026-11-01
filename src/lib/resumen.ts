import type { Diversificacion } from "./diversificacion";
import type { ResumenComisiones } from "./comisiones";
import { calcularRendimiento, type ComparacionInflacion, type Rendimiento } from "./rendimiento";
import type { Movimiento } from "./tipos";

export interface ResumenPortafolio {
  valorActual: number;
  capitalInvertido: number;
  ganancia: number;
  rendimientoSimple: number;
  inflacionAcumulada: number;
  rendimientoReal: number;
  superaInflacion: boolean;
  comisionesTotal: number;
  mayorEmisora: { emisora: string; porcentaje: number } | null;
}

export function construirResumen(
  r: Rendimiento,
  c: ComparacionInflacion,
  com: ResumenComisiones,
  div: Diversificacion
): ResumenPortafolio {
  return {
    valorActual: r.valorFinal,
    capitalInvertido: r.capitalInvertido,
    ganancia: r.ganancia,
    rendimientoSimple: r.rendimientoSimple,
    inflacionAcumulada: c.inflacionAcumulada,
    rendimientoReal: c.rendimientoReal,
    superaInflacion: c.superaInflacion,
    comisionesTotal: com.total,
    mayorEmisora: div.mayor ? { emisora: div.mayor.emisora, porcentaje: div.mayor.peso ?? div.mayor.valor / Math.max(div.total, 1) } : null,
  };
}

export interface PuntoEvolucion {
  fecha: string;
  capitalInvertido: number;
  valor: number;
  rendimiento: number;
}

export function evolucionPortafolio(movimientos: Movimiento[]): PuntoEvolucion[] {
  const fechas = [...new Set(movimientos.map((m) => m.fecha))].sort();
  return fechas.map((fecha) => {
    const r = calcularRendimiento(movimientos.filter((m) => m.fecha <= fecha));
    return { fecha, capitalInvertido: r.capitalInvertido, valor: r.valorFinal, rendimiento: r.rendimientoSimple };
  });
}
}
