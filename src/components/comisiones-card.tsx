import { calcularTotalComisiones } from "@/lib/comisiones/calcular-comisiones";
import { formatoMoneda } from "@/lib/formato";
import type { Movement } from "@/types/movement";

interface ComisionesCardProps {
  /** Movimientos válidos del CSV; vacío mientras no se haya cargado un archivo. */
  movimientos: Movement[];
  /** Cantidad de filas del CSV que no pasaron la validación. */
  filasConError: number;
}

export function ComisionesCard({
  movimientos,
  filasConError,
}: ComisionesCardProps) {
  const resultado = calcularTotalComisiones(movimientos);

  return (
    <section
      aria-labelledby="comisiones-titulo"
      className="rounded-xl border border-gray-200 p-5"
    >
      <h2 id="comisiones-titulo" className="text-sm font-medium text-gray-500">
        Comisiones pagadas
      </h2>

      {resultado.estado === "sin-datos" && (
        <p className="mt-3 text-sm text-gray-500">
          Aún no hay información. Sube tu archivo CSV de movimientos para
          calcular el total de comisiones.
        </p>
      )}

      {resultado.estado === "calculado" && (
        <>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatoMoneda.format(resultado.total)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {resultado.movimientosConComision === 0
              ? "No se registraron comisiones en los movimientos cargados."
              : resultado.movimientosConComision === 1
                ? "Total de 1 movimiento con comisión."
                : `Total de ${resultado.movimientosConComision} movimientos con comisión.`}
          </p>

          {filasConError > 0 && (
            <p className="mt-3 text-xs text-amber-700">
              {filasConError === 1
                ? "1 fila del archivo no se incluyó"
                : `${filasConError} filas del archivo no se incluyeron`}{" "}
              por tener errores; el total puede estar incompleto.
            </p>
          )}
        </>
      )}
    </section>
  );
}
