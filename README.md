# Dashboard de Finanzas Personales

Prototipo para inversionistas retail en México. Procesa un CSV de movimientos del portafolio y muestra
rendimiento simple, comparación contra inflación y comisiones. Todo se procesa en el navegador.

**Stack:** Next.js 15 (App Router) · TypeScript · React 19 · Tailwind CSS · Recharts · Papa Parse · Zod · Vitest

## Ejecutar

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # pruebas unitarias
npm run build    # compilación de producción
```

## Formato del CSV

```csv
fecha,tipo,emisora,titulos,precio,comision
2024-02-05,compra,WALMEX*,50,58.40,14.60
```

| Columna  | Regla |
|----------|-------|
| fecha    | `AAAA-MM-DD`, fecha real |
| tipo     | `compra`, `venta` o `dividendo` |
| emisora  | texto obligatorio (se guarda en mayúsculas) |
| titulos  | número > 0 |
| precio   | número > 0 (en `dividendo`: dividendo por título) |
| comision | número ≥ 0 |

Además se valida que nunca se venda más de lo que hay en cartera. Un ejemplo está en `public/ejemplo.csv`.

## Entregables y dónde viven

| Entregable | Código |
|-----------|--------|
| E1 Carga y validación de CSV | `src/lib/schema.ts`, `src/lib/parseCsv.ts`, `src/components/CargaCsv.tsx` |
| E2 Rendimiento vs. inflación | `src/lib/rendimiento.ts`, `src/lib/inflacion.ts`, `src/data/inflacion.json`, `src/components/PanelRendimiento.tsx` |
| E3 Comisiones | `src/lib/comisiones.ts`, `src/components/PanelComisiones.tsx` |

## Cálculos

- **Rendimiento simple** = (ventas + dividendos + valor de la tenencia − compras − comisiones) / (compras + comisiones).
  La tenencia se valúa con el último precio registrado de cada emisora en el CSV.
- **Inflación acumulada**: se aplica la tasa anual de cada año de forma proporcional a los días del periodo
  (`src/data/inflacion.json`, datos INEGI; actualizar cuando se publiquen nuevos).
- **Rendimiento real** = (1 + rendimiento) / (1 + inflación) − 1.

## Sprint 3 – Comparación vs. inflación + comisiones desglosadas

- Inflación ajustada por aportación (`ajustarPorInflacion`): cada compra se actualiza desde su fecha; se muestran capital ajustado y ganancia real.
- Rendimiento sin comisiones y puntos porcentuales que restan las comisiones.
- Comisiones por movimiento, por emisora (gráfica), por tipo de movimiento y comisión más alta.
- 22 pruebas unitarias (`npm test`).
