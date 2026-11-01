import type { Diversificacion } from "./diversificacion";
import type { ResumenComisiones } from "./comisiones";
import type { ComparacionInflacion, Rendimiento } from "./rendimiento";

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

/** Sprint 5: junta las métricas principales de todos los módulos en un solo objeto. */
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
    mayorEmisora: div.mayor ? { emisora: div.mayor.emisora, porcentaje: div.mayor.porcentaje } : null,
  };
}
