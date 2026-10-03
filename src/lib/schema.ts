import { z } from "zod";
import { TIPOS } from "./tipos";

/** Convierte "$1,234.50" o " 12 " en número. Devuelve NaN si no es numérico. */
export function aNumero(valor: unknown): number {
  if (typeof valor === "number") return valor;
  if (typeof valor !== "string") return NaN;
  const limpio = valor.replace(/[$\s,]/g, "");
  if (limpio === "") return NaN;
  return Number(limpio);
}

const numero = (nombre: string) =>
  z.preprocess(aNumero, z.number({ invalid_type_error: `${nombre} debe ser un número` }));

const fechaValida = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

export const filaSchema = z.object({
  fecha: z
    .string({ required_error: "fecha es obligatoria" })
    .trim()
    .refine(fechaValida, "fecha debe tener formato AAAA-MM-DD y ser una fecha real"),
  tipo: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.enum(TIPOS, { errorMap: () => ({ message: `tipo debe ser: ${TIPOS.join(", ")}` }) })
  ),
  emisora: z.string({ required_error: "emisora es obligatoria" }).trim().min(1, "emisora es obligatoria").transform((s) => s.toUpperCase()),
  titulos: numero("titulos").pipe(z.number().positive("titulos debe ser mayor que 0")),
  precio: numero("precio").pipe(z.number().positive("precio debe ser mayor que 0")),
  comision: numero("comision").pipe(z.number().min(0, "comision no puede ser negativa")),
});
