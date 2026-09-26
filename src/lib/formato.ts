/** Formato monetario en pesos mexicanos, ej. "$1,234.50". */
export const formatoMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});
