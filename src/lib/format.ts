const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
export const formatoMXN = (n: number) => mxn.format(n);
export const formatoPct = (fraccion: number, decimales = 2) =>
  `${(fraccion * 100).toLocaleString("es-MX", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })} %`;
export const formatoFecha = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
