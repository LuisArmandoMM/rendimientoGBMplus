import type { Movement } from "@/types/movement";

/**
 * Rendimiento simple del portafolio.
 *
 * Fórmula:
 *
 *   R = (V − C) / C
 *
 * donde:
 *   C = Capital neto aportado = Σ monto(deposito) − Σ monto(retiro)
 *       Dinero que el usuario metió al portafolio menos lo que sacó.
 *   E = Efectivo disponible (saldo en la cuenta), acumulado así:
 *         deposito   → + monto
 *         retiro     → − monto
 *         compra     → − (monto + comision)
 *         venta      → + (monto − comision)
 *         dividendo  → + monto
 *         comision   → − monto   (solo se usa `monto`; la columna `comision`
 *                                 se ignora en estas filas para no contar
 *                                 la comisión dos veces)
 *         valuacion  → sin efecto (no es un flujo de efectivo)
 *       La columna `comision` solo aplica a filas de compra y venta.
 *   Q_i = Unidades en posesión del instrumento i
 *       = Σ cantidad(compra de i) − Σ cantidad(venta de i)
 *   P_i = Precio actual del instrumento i: el `precio` de la fila
 *         `valuacion` más reciente (por `fecha`) de ese instrumento.
 *   V = Valor actual del portafolio = E + Σ (Q_i × P_i)
 *   G = Ganancia (o pérdida) = V − C
 *
 * R > 0 indica ganancia, R < 0 pérdida y R = 0 que el portafolio vale
 * exactamente lo aportado.
 *
 * La dirección de cada flujo la determina `tipoMovimiento`, no el signo de
 * `monto`: por eso se usa el valor absoluto (el CSV de ejemplo trae, por
 * ejemplo, `monto = -45` en las filas de comisión).
 */

export interface PosicionValuada {
  instrumento: string;
  unidades: number; // Q_i
  precioActual: number; // P_i
  fechaValuacion: string;
  valor: number; // Q_i × P_i
}

export type ResultadoRendimiento =
  | { estado: "sin-datos" }
  | { estado: "insuficiente"; motivo: string }
  | {
      estado: "calculado";
      capitalNeto: number; // C
      efectivo: number; // E
      valorPosiciones: number; // Σ Q_i × P_i
      valorActual: number; // V
      ganancia: number; // G
      rendimiento: number; // R, como fracción (0.0304 = 3.04 %)
      fechaCorte: string; // fecha de valuación más reciente usada
      posiciones: PosicionValuada[];
    };

/** Tolerancia para considerar que unas unidades o un monto son cero. */
const EPSILON = 1e-9;

/** Redondea a centavos para evitar residuos de punto flotante (ej. 1e-13 en vez de 0). */
function redondearCentavos(valor: number): number {
  const redondeado = Math.round(valor * 100) / 100;
  return Object.is(redondeado, -0) ? 0 : redondeado;
}

/** Normaliza el nombre del instrumento para emparejar compras, ventas y valuaciones. */
function claveInstrumento(instrumento: string): string {
  return instrumento.trim().toUpperCase();
}

export function calcularRendimiento(
  movimientos: Movement[]
): ResultadoRendimiento {
  if (movimientos.length === 0) {
    return { estado: "sin-datos" };
  }

  let capitalNeto = 0; // C
  let efectivo = 0; // E
  const unidades = new Map<string, number>(); // Q_i
  const valuaciones = new Map<string, { precio: number; fecha: string }>(); // P_i
  const nombres = new Map<string, string>(); // clave → nombre tal como viene en el CSV

  for (const m of movimientos) {
    const monto = Math.abs(m.monto);
    const clave = claveInstrumento(m.instrumento);

    switch (m.tipoMovimiento) {
      case "deposito":
        capitalNeto += monto;
        efectivo += monto;
        break;
      case "retiro":
        capitalNeto -= monto;
        efectivo -= monto;
        break;
      case "compra":
        efectivo -= monto + m.comision;
        unidades.set(clave, (unidades.get(clave) ?? 0) + m.cantidad);
        nombres.set(clave, m.instrumento);
        break;
      case "venta":
        efectivo += monto - m.comision;
        unidades.set(clave, (unidades.get(clave) ?? 0) - m.cantidad);
        nombres.set(clave, m.instrumento);
        break;
      case "dividendo":
        efectivo += monto;
        break;
      case "comision":
        efectivo -= monto;
        break;
      case "valuacion": {
        const previa = valuaciones.get(clave);
        // Fechas AAAA-MM-DD: la comparación de texto equivale a la cronológica.
        if (!previa || m.fecha >= previa.fecha) {
          valuaciones.set(clave, { precio: m.precio, fecha: m.fecha });
        }
        break;
      }
    }
  }

  if (capitalNeto <= EPSILON) {
    return {
      estado: "insuficiente",
      motivo:
        "No hay capital neto aportado (los depósitos no superan a los retiros), así que no hay una base contra la cual medir el rendimiento.",
    };
  }

  const vendidasDeMas: string[] = [];
  const sinValuacion: string[] = [];
  const posiciones: PosicionValuada[] = [];

  for (const [clave, q] of unidades) {
    const nombre = nombres.get(clave) ?? clave;
    if (q < -EPSILON) {
      vendidasDeMas.push(nombre);
      continue;
    }
    if (q <= EPSILON) continue; // posición cerrada: no aporta valor

    const valuacion = valuaciones.get(clave);
    if (!valuacion) {
      sinValuacion.push(nombre);
      continue;
    }
    posiciones.push({
      instrumento: nombre,
      unidades: q,
      precioActual: valuacion.precio,
      fechaValuacion: valuacion.fecha,
      valor: q * valuacion.precio,
    });
  }

  if (vendidasDeMas.length > 0) {
    return {
      estado: "insuficiente",
      motivo: `Se vendieron más unidades de las compradas en: ${vendidasDeMas.join(", ")}. Revisa que el archivo incluya todas las compras.`,
    };
  }

  if (sinValuacion.length > 0) {
    return {
      estado: "insuficiente",
      motivo: `Falta el precio actual de: ${sinValuacion.join(", ")}. Agrega una fila con tipo_movimiento "valuacion" y el precio actual de cada instrumento que aún tienes.`,
    };
  }

  const valorPosiciones = posiciones.reduce((suma, p) => suma + p.valor, 0);
  const valorActual = efectivo + valorPosiciones; // V
  const ganancia = redondearCentavos(valorActual - capitalNeto); // G
  const rendimiento = ganancia / capitalNeto; // R

  // Si todo está en efectivo no se usa ninguna valuación: la fecha de corte
  // es la del último movimiento.
  const fechaCorte =
    posiciones.map((p) => p.fechaValuacion).sort().at(-1) ??
    movimientos.map((m) => m.fecha).sort().at(-1) ??
    "";

  return {
    estado: "calculado",
    capitalNeto: redondearCentavos(capitalNeto),
    efectivo: redondearCentavos(efectivo),
    valorPosiciones: redondearCentavos(valorPosiciones),
    valorActual: redondearCentavos(valorActual),
    ganancia,
    rendimiento,
    fechaCorte,
    posiciones,
  };
}
