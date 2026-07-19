# Sueldos Públicos

Calculadora estática de liquidaciones para docentes de establecimientos públicos municipales y SLEP en Chile. El cálculo se ejecuta completamente en el navegador y cada concepto automático enlaza a una página con su fórmula y fuentes.

## Desarrollo

Requiere Node.js 22.12 o superior y pnpm.

```sh
pnpm install
pnpm dev
```

El sitio queda disponible en `http://localhost:4321`.

## Validación

```sh
pnpm check
pnpm test
pnpm build
```

La compilación genera únicamente archivos estáticos dentro de `dist/`.

## Estructura relevante

- `src/components/TeacherCalculator.tsx`: interfaz interactiva de la calculadora.
- `src/lib/calculation/`: motor puro de cálculo y pruebas.
- `src/data/parameters/`: parámetros versionados por período.
- `src/data/legal.ts`: conceptos legales y fuentes oficiales.
- `src/pages/legal/`: biblioteca legal generada estáticamente.

## Actualización mensual

Los indicadores previsionales se actualizan con `pnpm update:previred`. El proceso busca el PDF mensual de Previred, extrae UF, UTM, topes y comisiones AFP, valida rangos y genera `src/data/parameters/previred.generated.ts`.

El workflow `.github/workflows/update-previred.yml` ejecuta esa revisión diariamente. Solo si encuentra un período nuevo o una versión corregida ejecuta las pruebas, compila el sitio y publica el archivo actualizado. Para funcionar automáticamente, este proyecto debe estar alojado en un repositorio GitHub con permisos de escritura para Actions.

Si la fuente no está disponible o el período queda atrasado, el sitio conserva la última copia verificada, muestra una advertencia y permite ingresar los parámetros previsionales manualmente para la simulación actual.

Las asignaciones docentes y la tabla de Impuesto Único mantienen sus propias fuentes y revisiones. Los valores históricos deben preservarse para mantener trazabilidad.

## Alcance

El resultado es informativo y no reemplaza la liquidación del empleador ni asesoría jurídica, previsional o tributaria. La primera versión no activa publicidad ni analítica; los espacios futuros están preparados pero ocultos.

## Licencia

Copyright © 2026 ReyesValdesLabs. Este proyecto se distribuye bajo la [GNU Affero General Public License v3.0](LICENSE). Las modificaciones utilizadas para ofrecer el sitio a través de una red deben mantener disponible su código fuente bajo la misma licencia.
