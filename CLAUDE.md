# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Academic prototype (Proyectos VII, UDG Virtual): a personal-finance dashboard that ingests a Mexican retail investor's broker statement (CSV, e.g. from GBM) to eventually show real return vs. inflation, total commissions, and asset diversification. Work is organized in 6 sprints (see README "Próximos sprints"); Sprint 1 (CSV ingestion + validation) is done and Sprint 2 (simple portfolio return + total commissions) is implemented; per-movement commission breakdown is Sprint 3 scope — keep it out until then. Code, comments, domain identifiers, and user-facing messages are in **Spanish** — keep new code consistent.

Stack: Next.js 16 (App Router) + React 19 + TypeScript (strict), Tailwind CSS v4, Papa Parse, Zod v4. Planned for later sprints: shadcn/ui + Recharts (Sprint 4), Vitest (Sprint 6). Deployed on Vercel.

## Commands

```bash
npm run dev         # dev server at http://localhost:3000
npm run build       # production build
npm run lint        # ESLint (flat config, eslint-config-next)
npx tsc --noEmit    # type check
```

No test runner is configured yet (Vitest arrives in Sprint 6). Manually verify with `public/sample-data/movimientos-ejemplo.csv` (valid) and `movimientos-con-errores.csv` (intentional per-row errors).

## Architecture

Everything runs client-side; there is no backend or persistence. Import alias `@/*` → `src/*`.

Data flow: `src/components/csv-uploader.tsx` (client component, drag & drop + status state machine `idle | parsing | success | error`) → `parseMovementsCsv` in `src/lib/csv/parse-movements.ts` → returns `ParseMovementsResult { data, errors, fileError }` defined in `src/types/movement.ts`.

Validation happens in three layers, in order:
1. **File-level** (`validateFileBeforeParsing`): extension/MIME, empty file, 5 MB max → `fileError`.
2. **Header-level**: all columns in `COLUMNAS_ESPERADAS` must be present (any order) → `fileError` listing missing columns; rows are not processed.
3. **Row-level**: each row goes through `movementRowSchema` (Zod, `src/lib/csv/schema.ts`). Invalid rows are collected in `errors` (1-based row number + first Zod issue message) while valid rows still go into `data` — a file is never rejected wholesale for bad rows.

Key conventions:
- The CSV uses snake_case columns (`tipo_movimiento`, `tipo_activo`); the domain `Movement` type uses camelCase (`tipoMovimiento`, `tipoActivo`). The mapping happens in `parseMovementsCsv`.
- Allowed enum values live as `as const` arrays (`TIPOS_MOVIMIENTO`, `TIPOS_ACTIVO`) in `src/types/movement.ts`; types and the Zod enums derive from them — change them there only.
- Zod error messages are shown verbatim to end users, so write them as clear Spanish sentences. The schema is intended to be reused for future PDF ingestion.
- Numeric columns are preprocessed by `toNumber` (strips thousands commas); `monto` may be negative, `cantidad`/`precio`/`comision` must be ≥ 0. Dates must be `AAAA-MM-DD`.
- `tipo_movimiento = "valuacion"` rows are not transactions: they carry the current price (`precio`) of an instrument at a cut-off date (`fecha`). They're the only source of market value — the CSV has no other current-price data, so don't infer valuations from past trade prices.
- Cash-flow direction comes from `tipoMovimiento`, never from the sign of `monto` (use `Math.abs`). The `comision` column only applies to `compra`/`venta`; on `comision` rows only `monto` is used (avoids double counting).
- Portfolio return (`src/lib/rendimiento/calcular-rendimiento.ts`) returns a discriminated union (`sin-datos` | `insuficiente` with a user-facing `motivo` | `calculado`); `rendimiento-card.tsx` renders each state instead of showing a number when data is missing.
- When adding columns or rules, update the README "Formato de archivo esperado" table and the sample CSVs accordingly.
