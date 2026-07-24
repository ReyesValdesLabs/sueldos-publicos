# Sueldos Públicos

Calculadoras estáticas de liquidaciones para docentes de establecimientos públicos municipales o SLEP y para asistentes de la educación contratados por SLEP o DAEM/DEM en Chile. Cada cálculo se ejecuta completamente en el navegador y los conceptos automáticos enlazan a páginas con sus fórmulas y fuentes.

## Desarrollo

Requiere Node.js 22.12 o superior y pnpm.

```sh
pnpm install
pnpm dev
```

El sitio queda disponible en `http://localhost:4321`.

## Despliegue en Cloudflare Pages

El sitio se despliega como proyecto estático desde la rama `main` con esta configuración:

- Comando de build: `pnpm build`
- Directorio de salida: `dist`
- Directorio raíz: vacío
- Versión de Node: `22.16.0` o una versión 22 compatible con `package.json`
- Versión de pnpm: `11.9.0`

No se requiere adaptador de Cloudflare porque Astro genera archivos completamente estáticos. El desarrollo local, Cloudflare Pages y la imagen Docker sirven el sitio desde `/`.

## Validación

```sh
pnpm check
pnpm test
pnpm build
```

La compilación genera únicamente archivos estáticos dentro de `dist/`.

## Docker

La imagen compila el sitio con Node.js y sirve únicamente los archivos estáticos
resultantes mediante Nginx sin privilegios, en el puerto `8080`.

```sh
docker compose up --build -d
```

Después de iniciar, abre `http://localhost:8080`. Para usar otro puerto en el
host, define `SITE_PORT`, por ejemplo:

```sh
SITE_PORT=3000 docker compose up --build -d
```

Comandos útiles:

```sh
docker compose ps
docker compose logs -f web
docker compose down
```

También se puede construir y ejecutar la imagen sin Compose:

```sh
docker build -t sueldos-publicos:local .
docker run --rm -p 8080:8080 sueldos-publicos:local
```

El endpoint `GET /healthz` permite comprobar la salud del contenedor desde el
VPS o desde un proxy inverso.

### Imagen publicada en GHCR

El workflow `Publicar imagen de contenedor` compila y publica una imagen para
`linux/amd64` y `linux/arm64` cuando se crea cualquier tag de Git o cuando se
ejecuta manualmente desde GitHub Actions.

Los tags de versión semántica generan alias. Por ejemplo, `v1.2.3` publica
`v1.2.3`, `1.2.3`, `1.2`, `1`, `latest` y una etiqueta asociada al SHA del
commit. Una ejecución manual permite escoger la etiqueta y no reemplaza
`latest` salvo que se solicite explícitamente.

```sh
docker pull ghcr.io/reyesvaldeslabs/sueldos-publicos:latest
docker run -d \
  --name sueldos-publicos \
  --restart unless-stopped \
  -p 8080:8080 \
  ghcr.io/reyesvaldeslabs/sueldos-publicos:latest
```

El paquete se crea privado inicialmente. Para descargarlo desde un VPS, inicia
sesión con un token de GitHub que tenga permiso `read:packages`, o cambia la
visibilidad del paquete a pública desde su configuración en GitHub.

## Estructura relevante

- `src/components/TeacherCalculator.tsx`: interfaz interactiva para docentes.
- `src/components/TechnicalAssistantCalculator.tsx`: selector único que dirige a la experiencia SLEP o DAEM/DEM según el empleador.
- `src/components/AssistantCalculator.tsx`: interfaz para técnicos/as en educación parvularia SLEP.
- `src/components/DaemAssistantCalculator.tsx`: interfaz para técnicos/as y asistentes contratados por DAEM/DEM.
- `src/lib/calculation/`: motor puro docente y pruebas.
- `src/lib/assistant-calculation/`: motor puro para categoría técnica SLEP y pruebas.
- `src/lib/daem-assistant-calculation/`: motor puro para asistentes DAEM/DEM y pruebas.
- `src/data/parameters/`: parámetros versionados por período.
- `src/data/legal.ts`: conceptos legales y fuentes oficiales.
- `src/pages/legal/`: biblioteca legal generada estáticamente.

## Actualización mensual

Los indicadores previsionales se actualizan con `pnpm update:previred`. El proceso busca el PDF mensual de Previred, extrae UF, UTM, topes y comisiones AFP, valida rangos y genera `src/data/parameters/previred.generated.ts`.

El workflow `.github/workflows/update-previred.yml` ejecuta esa revisión diariamente. Solo si encuentra un período nuevo o una versión corregida ejecuta las pruebas, compila el sitio y publica el archivo actualizado. Para funcionar automáticamente, este proyecto debe estar alojado en un repositorio GitHub con permisos de escritura para Actions.

Si la fuente no está disponible o el período queda atrasado, el sitio conserva la última copia verificada, muestra una advertencia y permite ingresar los parámetros previsionales manualmente para la simulación actual.

Las asignaciones docentes y la tabla de Impuesto Único mantienen sus propias fuentes y revisiones. Los valores históricos deben preservarse para mantener trazabilidad.

## Porcentaje de alumnos prioritarios por establecimiento

El buscador docente usa `public/data/priority-schools-2026.json`, generado desde la Resolución Exenta N.º 1.522 de 25 de marzo de 2026 publicada por Mineduc/CPEIP. La fuente contiene el proceso 2026 calculado con matrícula 2025; la copia del sitio incluye solamente establecimientos SLEP, DAEM y de corporaciones municipales.

Para volver a descargar el PDF oficial, extraer la tabla y regenerar el JSON:

```sh
pnpm update:priority-schools
```

El proceso requiere `pdftotext` de Poppler, valida años, porcentajes, RBD únicos y cantidad mínima de filas, y guarda en el JSON la URL, fecha y huella SHA-256 de la fuente.

## Porcentaje de zona y ruralidad por establecimiento

El mismo selector consulta `public/data/school-zones-2025.json`, generado desde la base oficial de Subvenciones a Establecimientos Educacionales del Centro de Estudios Mineduc. Para cada RBD público conserva `PORC_ZONA`, `RURAL_RBD`, los meses observados, el año de datos y la referencia exacta de descarga.

La interfaz completa automáticamente zona y ruralidad solo cuando todos los meses publicados para el RBD son consistentes. Los establecimientos sin filas en la fuente quedan explícitamente con valor desconocido: la ausencia de información nunca se transforma en 0%.

Para descargar la publicación anual y regenerar el JSON:

```sh
pnpm update:school-zones
```

El proceso requiere Python 3 y `bsdtar`/libarchive. El extractor de XLSX usa únicamente la biblioteca estándar de Python. Si el ejecutable tiene otro nombre, puede indicarse mediante `SCHOOL_ZONES_PYTHON`.

## Alcance

La calculadora docente acepta jornadas que combinen horas de enseñanza básica y media. La vista técnica pide elegir el empleador y mantiene dos motores separados: SLEP se limita a contratos SLEP en categoría técnica; DAEM/DEM cubre asistentes contratados por la administración educacional municipal y usa los haberes locales informados, sin trasladar el piso técnico ni los bienios SLEP. Ninguna debe usarse automáticamente para JUNJI, Integra o jardines VTF. Todas aplican un máximo de 44 horas semanales para un mismo empleador y estiman un mes completo, sin prorratear licencias, ausencias ni fracciones de mes.

El resultado es informativo y no reemplaza la liquidación del empleador ni asesoría jurídica, previsional o tributaria. La primera versión no activa publicidad ni analítica; los espacios futuros están preparados pero ocultos.

## Licencia

Copyright © 2026 ReyesValdesLabs. Este proyecto se distribuye bajo la [GNU Affero General Public License v3.0](LICENSE). Las modificaciones utilizadas para ofrecer el sitio a través de una red deben mantener disponible su código fuente bajo la misma licencia.
