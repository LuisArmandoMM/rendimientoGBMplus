# Dashboard de Finanzas Personales

Prototipo académico — **Proyectos VII**, UDG Virtual.
Equipo: Luis Armando Mercado Mojica, Yael Isai Ochoa Gutiérrez.

Dashboard que procesa el estado de cuenta (CSV) de un inversionista retail
mexicano para mostrarle su rendimiento real frente a la inflación, el total
de comisiones pagadas y la diversificación de sus activos: información que
brokers como GBM no ofrecen de forma consolidada.

## Stack técnico

| Capa | Herramienta |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| UI | React, Tailwind CSS (shadcn/ui a partir del Sprint 4) |
| Gráficas | Recharts (a partir del Sprint 4) |
| Parseo de CSV | Papa Parse |
| Validación de datos | Zod |
| Pruebas | Vitest (a partir del Sprint 6) |
| Despliegue | Vercel |

## Estado del proyecto: Sprint 2 de 6

**Sprint 1** ("Ingesta y validación de CSV + documentación base"):

- Subir un archivo CSV con movimientos.
- Validar el formato del archivo (encabezados, tipos de dato, filas).
- Mostrar un mensaje de error claro si el archivo no es válido.
- Documentación técnica básica (este documento).

**Sprint 2**:

- Rendimiento simple del portafolio (ver sección más abajo).
- Total de comisiones pagadas (sin desglose; el desglose es del Sprint 3).

La comparación contra inflación, las comisiones desglosadas y las gráficas
de diversificación llegan en los Sprints 3 a 5.

## Estructura del proyecto

```
dashboard-finanzas/
├── public/
│   └── sample-data/
│       ├── movimientos-ejemplo.csv        # CSV válido para probar la carga
│       └── movimientos-con-errores.csv    # CSV con errores intencionales
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Layout raíz + metadata
│   │   ├── page.tsx        # Página principal (usa CsvUploader)
│   │   └── globals.css     # Estilos globales (Tailwind)
│   ├── components/
│   │   ├── csv-uploader.tsx     # Componente cliente: drag&drop, estados, tabla de vista previa
│   │   ├── rendimiento-card.tsx # Tarjeta con el rendimiento simple y sus estados
│   │   └── comisiones-card.tsx  # Tarjeta con el total de comisiones
│   ├── lib/
│   │   ├── formato.ts  # Formato monetario (MXN) compartido
│   │   ├── comisiones/
│   │   │   └── calcular-comisiones.ts # Total de comisiones pagadas
│   │   ├── csv/
│   │   │   ├── schema.ts          # Esquema Zod de una fila del CSV
│   │   │   └── parse-movements.ts # Validación de archivo + parseo con Papa Parse
│   │   └── rendimiento/
│   │       └── calcular-rendimiento.ts # Fórmula del rendimiento simple
│   └── types/
│       └── movement.ts     # Tipos de dominio (Movement, TipoMovimiento, etc.)
└── README.md
```

## Formato de archivo esperado

El CSV debe incluir las siguientes columnas (en cualquier orden):

| Columna | Tipo | Ejemplo | Notas |
|---|---|---|---|
| `fecha` | fecha `AAAA-MM-DD` | `2026-03-01` | |
| `tipo_movimiento` | texto | `compra` | uno de: compra, venta, dividendo, comision, deposito, retiro, valuacion |
| `instrumento` | texto | `NAFTRAC` | |
| `tipo_activo` | texto | `etf` | uno de: accion, etf, fibra, deuda, efectivo, otro |
| `cantidad` | número ≥ 0 | `50` | |
| `precio` | número ≥ 0 | `25.40` | |
| `monto` | número | `1270` | puede ser negativo (ej. comisiones) |
| `comision` | número ≥ 0 | `15` | |

### Reglas de interpretación

- La dirección de cada flujo la define `tipo_movimiento`, no el signo de
  `monto` (se toma su valor absoluto).
- `comision` solo aplica en filas `compra` y `venta`. En filas de tipo
  `comision` se usa únicamente `monto`, para no contar la comisión dos veces.
- Una fila `valuacion` no es una operación: indica el precio actual de un
  instrumento (`precio`) a una fecha de corte (`fecha`). Se usa `cantidad`,
  `monto` y `comision` en 0. Cada instrumento que aún se tenga necesita al
  menos una fila `valuacion`; si hay varias, se usa la más reciente.

## Rendimiento simple del portafolio (Sprint 2)

```
R = (V − C) / C
C = Σ depósitos − Σ retiros                       (capital neto aportado)
E = efectivo tras depósitos, retiros, compras (+comisión), ventas (−comisión),
    dividendos y comisiones                         (efectivo disponible)
V = E + Σ unidades_i × precio_actual_i             (valor actual)
```

La implementación y la documentación detallada de cada variable están en
`src/lib/rendimiento/calcular-rendimiento.ts`. Si falta la valuación de
algún instrumento en posesión, si se vendieron más unidades de las
compradas o si el capital neto no es positivo, la interfaz explica por qué
no se puede calcular en lugar de mostrar un número.

## Total de comisiones pagadas (Sprint 2)

```
T = Σ comision de filas compra y venta + Σ |monto| de filas comision
```

Implementado en `src/lib/comisiones/calcular-comisiones.ts`. La suma se
hace en centavos para evitar errores de redondeo, y cualquier valor no
numérico que llegara al cálculo se ignora. Si no hay comisiones, se muestra
$0.00 con una nota. Con el CSV de ejemplo el total es $90.00
(15 + 20 + 10 + 45).

Puedes probar el flujo con los archivos incluidos en
`public/sample-data/`: uno pasa la validación completa y el otro contiene
errores a propósito (fecha con formato incorrecto, `tipo_movimiento`
inválido, `tipo_activo` inválido y una cantidad negativa) para mostrar el
manejo de errores fila por fila.

## Decisiones técnicas del Sprint 1

- **Validación por fila, no por archivo completo**: si algunas filas tienen
  errores, el archivo no se rechaza entero — se muestran los movimientos
  válidos y, aparte, la lista de filas con problema y por qué fallaron. Esto
  le da al usuario información accionable para corregir su CSV.
- **Validación de encabezado antes que de contenido**: si al archivo le
  faltan columnas, se informa de inmediato qué columnas faltan, sin intentar
  procesar filas que de todos modos no tendrían los datos necesarios.
- **Zod como capa de validación**: se eligió Zod (ya considerado en el stack
  del proyecto) para centralizar las reglas de cada columna y sus mensajes
  de error en un solo lugar (`src/lib/csv/schema.ts`), reutilizable cuando
  se agregue lectura de PDF en una etapa futura.
- **Todo corre en el cliente**: por ahora no hay backend; el parseo y la
  validación ocurren en el navegador con Papa Parse. Esto es suficiente para
  el alcance del prototipo (nadie más ve el estado de cuenta del usuario) y
  se revisará si en sprints posteriores se necesita persistencia.

## Cómo correr el proyecto

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y sube uno de los
archivos de `public/sample-data/`.

Otros comandos útiles:

```bash
npm run build      # build de producción
npm run lint        # ESLint
npx tsc --noEmit    # verificación de tipos
```

## Próximos sprints (referencia)

| Sprint | Contenido |
|---|---|
| 2 | Rendimiento simple del portafolio + comisiones totales |
| 3 | Comparación vs. inflación + comisiones desglosadas |
| 4 | Gráfica de diversificación + filtro por periodo |
| 5 | Dashboard integrado con métricas principales |
| 6 | Responsividad + pruebas unitarias |
