# Sueldos Públicos

Calculadora estática de liquidaciones para docentes de establecimientos públicos municipales y SLEP en Chile. El cálculo se ejecuta completamente en el navegador y cada concepto automático enlaza a una página con su fórmula y fuentes.

## Desarrollo

Requiere Node.js 22.12 o superior y pnpm.

```sh
pnpm install
pnpm dev
```

El sitio queda disponible en `http://localhost:4321`.

## Demo en GitHub Pages

Cada push a `main` ejecuta el workflow `Publicar demo en GitHub Pages` y publica
el sitio en:

`https://reyesvaldeslabs.github.io/sueldos-publicos/`

La ruta base de Pages se activa únicamente durante ese workflow. El desarrollo
local y la imagen Docker continúan sirviendo el sitio desde `/`.

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
