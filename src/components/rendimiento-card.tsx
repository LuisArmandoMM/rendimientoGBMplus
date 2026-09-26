import { calcularRendimiento } from "@/lib/rendimiento/calcular-rendimiento";
import { formatoMoneda } from "@/lib/formato";
import type { Movement } from "@/types/movement";

const formatoPorcentaje = new Intl.NumberFormat("es-MX", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

interface RendimientoCardProps {
  /** Movimientos válidos del CSV; vacío mientras no se haya cargado un archivo. */
  movimientos: Movement[];
  /** Cantidad de filas del CSV que no pasaron la validación. */
  filasConError: number;
}

export function RendimientoCard({
  movimientos,
  filasConError,
}: RendimientoCardProps) {
  const resultado = calcularRendimiento(movimientos);

  return (
    <section
      aria-labelledby="rendimiento-titulo"
      className="rounded-xl border border-gray-200 p-5"
    >
      <h2
        id="rendimiento-titulo"
        className="text-sm font-medium text-gray-500"
      >
        Rendimiento simple del portafolio
      </h2>

      {resultado.estado === "sin-datos" && (
        <p className="mt-3 text-sm text-gray-500">
          Aún no hay información. Sube tu archivo CSV de movimientos para
          calcular el rendimiento.
        </p>
      )}

      {resultado.estado === "insuficiente" && (
        <div className="mt-3 text-sm text-amber-800">
          <p className="font-semibold">
            No hay datos suficientes para calcular el rendimiento
          </p>
          <p className="mt-1">{resultado.motivo}</p>
        </div>
      )}

      {resultado.estado === "calculado" && (
        <>
          <p
            className={`mt-2 text-3xl font-semibold ${
              resultado.ganancia > 0
                ? "text-green-700"
                : resultado.ganancia < 0
                  ? "text-red-700"
                  : "text-gray-900"
            }`}
          >
            {formatoPorcentaje.format(resultado.rendimiento)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {resultado.ganancia > 0
              ? "Ganancia"
              : resultado.ganancia < 0
                ? "Pérdida"
                : "Sin ganancia ni pérdida"}{" "}
            al {resultado.fechaCorte}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <Dato
              etiqueta="Capital aportado"
              valor={formatoMoneda.format(resultado.capitalNeto)}
            />
            <Dato
              etiqueta="Valor actual"
              valor={formatoMoneda.format(resultado.valorActual)}
            />
            <Dato
              etiqueta="Ganancia / pérdida"
              valor={formatoMoneda.format(resultado.ganancia)}
            />
            <Dato
              etiqueta="Efectivo"
              valor={formatoMoneda.format(resultado.efectivo)}
            />
          </dl>

          <p className="mt-4 text-xs text-gray-400">
            Rendimiento = (valor actual − capital aportado) / capital
            aportado. Valor actual = efectivo + posiciones valuadas al precio
            de la fila “valuacion” más reciente de cada instrumento.
          </p>
        </>
      )}

      {filasConError > 0 && resultado.estado !== "sin-datos" && (
        <p className="mt-3 text-xs text-amber-700">
          {filasConError === 1
            ? "1 fila del archivo no se incluyó"
            : `${filasConError} filas del archivo no se incluyeron`}{" "}
          en el cálculo por tener errores; el resultado puede no reflejar tu
          portafolio completo.
        </p>
      )}
    </section>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{etiqueta}</dt>
      <dd className="font-medium text-gray-900">{valor}</dd>
    </div>
  );
}
