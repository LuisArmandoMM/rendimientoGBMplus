import datos from "@/data/inflacion.json";

const anual = datos.anual as Record<string, number>;

const MS_DIA = 86_400_000;
const utc = (s: string) => new Date(`${s}T00:00:00Z`).getTime();
const diasDelAnio = (y: number) => ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365);

/** Tasa anual (en %) para un año; si no hay dato usa el último año disponible. */
function tasaDelAnio(y: number): { tasa: number; estimada: boolean } {
  const exacta = anual[String(y)];
  if (exacta !== undefined) return { tasa: exacta, estimada: false };
  const anios = Object.keys(anual).map(Number).sort((a, b) => a - b);
  const cercano = y < anios[0] ? anios[0] : anios[anios.length - 1];
  return { tasa: anual[String(cercano)], estimada: true };
}

export interface InflacionAcumulada {
  /** Inflación acumulada en el periodo, como fracción (0.05 = 5 %). */
  acumulada: number;
  /** true si algún año del periodo no tenía dato y se usó el más cercano. */
  usaEstimado: boolean;
}

/**
 * Inflación acumulada entre dos fechas (AAAA-MM-DD): se aplica la tasa anual de
 * cada año de forma proporcional a los días del periodo que caen en ese año.
 */
export function inflacionAcumulada(inicio: string, fin: string): InflacionAcumulada {
  const t0 = utc(inicio);
  const t1 = utc(fin);
  if (t1 <= t0) return { acumulada: 0, usaEstimado: false };

  let factor = 1;
  let usaEstimado = false;
  const anioInicio = new Date(t0).getUTCFullYear();
  const anioFin = new Date(t1).getUTCFullYear();

  for (let y = anioInicio; y <= anioFin; y++) {
    const desde = Math.max(t0, Date.UTC(y, 0, 1));
    const hasta = Math.min(t1, Date.UTC(y + 1, 0, 1));
    const dias = (hasta - desde) / MS_DIA;
    if (dias <= 0) continue;
    const { tasa, estimada } = tasaDelAnio(y);
    if (estimada) usaEstimado = true;
    factor *= Math.pow(1 + tasa / 100, dias / diasDelAnio(y));
  }
  return { acumulada: factor - 1, usaEstimado };
}

export const FUENTE_INFLACION: string = datos.fuente;
