# Revisión técnica y editorial para AdSense

Revisión inicial: 16 de septiembre de 2026. Seguimiento: 24 de septiembre de 2026.

## Comprobado

- Las cuatro calculadoras incluyen un caso visible en el HTML inicial. Los tres
  casos nuevos comparten antecedentes con los botones de carga; los importes
  provienen de los motores, no de copias escritas en la página.
- BRP, cotizaciones y seguro de cesantía de asistentes tienen casos y pasos de
  comprobación. Se conservan sus URL: cotizaciones explica las bases comunes;
  seguro de asistentes explica su aplicación contractual específica.
- Portada y biblioteca legal enlazan directamente a los cuatro casos.
- Canonical, un H1 por página indexable, JSON-LD válido, sitemap de 37 páginas,
  enlaces internos y fragmentos comprobados en la compilación.
- `robots.txt` permite el rastreo y señala el sitemap. `ads.txt` contiene el mismo
  identificador de editor que el script de AdSense: `pub-5034305532752206`.
- El script publicitario se limita a calculadoras. Los espacios manuales de
  `AdSlot.astro` están ocultos y no solicitan anuncios; los anuncios automáticos
  dependen de la configuración externa de AdSense.
- La política de privacidad describe cookies publicitarias y consentimiento.
  El código no permite verificar que exista un mensaje de consentimiento
  publicado en la cuenta. Tampoco permite comprobar configuraciones de anuncios
  automáticos, exclusiones o frecuencia de anuncios.
- Recarga probada tras alterar sueldo, bienios y experiencia. Resultados de los
  casos salarial SLEP ($602.569) y DAEM central ($730.170) coinciden con la interfaz
  usando la copia mensual actual. Estos valores cambiarán al actualizar parámetros.

Validación final: `pnpm check` sin diagnósticos, 155 pruebas unitarias y 13 de
automatización aprobadas, compilación de 37 páginas y auditoría estática correcta.
Revisión móvil a 390 px sin desbordamiento horizontal en portada, las tres fichas
ampliadas y los tres casos nuevos.

## Verificación reproducible

```sh
pnpm check
pnpm test
pnpm test:automation
pnpm build
python3 scripts/audit-static-site.py
git diff --check
```

El auditor requiere Python 3 y usa solo su biblioteca estándar. Inspecciona los
archivos de `dist`; no demuestra que esa misma versión esté desplegada ni que
Google ya la haya rastreado.

## Seguimiento del 24 de septiembre

- La recuperación #25 ya está integrada en `main`; no quedan PR abiertas del plan.
- La portada pública presenta los cuatro enlaces a casos y la descripción ampliada
  de la guía docente. La revisión de contenido en producción confirma las mejoras,
  aunque el alojamiento no expone un identificador del commit desplegado.
- Revisión editorial: se corrige la FAQ de portada para distinguir datos salariales
  locales de cookies de Analytics/AdSense. El README ya no afirma que no existe
  analítica. La fecha de privacidad del JSON-LD y sitemap coincide con su fecha
  visible (16 de septiembre).
- Se añade `Validate site` a cada PR y push a main: diagnósticos, 155 pruebas
  unitarias, 13 de automatización, compilación y auditoría estática. Estos mismos
  comandos pasan localmente. El workflow no despliega ni modifica parámetros.
- El navegador disponible bloqueó `robots.txt` con `ERR_BLOCKED_BY_CLIENT`; la
  consulta HTTP directa falló en la conexión TLS. Esto no prueba un error del
  servidor ni un bloqueo a Google y no justifica desactivar protecciones del sitio.
- Search Console mostró la página pública de acceso. El usuario tiene su sesión
  en Zen, que no está conectado a las herramientas de esta tarea.

## Pendientes externos antes de solicitar otra revisión

1. Publicar la corrección de privacidad del 24 de septiembre. El workflow de imagen
   se ejecuta por etiqueta o manualmente; mergear no garantiza el despliegue.
2. En Search Console, inspeccionar en vivo la portada y una calculadora; comprobar
   acceso permitido e informe de sitemap. Los errores de las herramientas de esta
   tarea no sustituyen esa inspección.
3. En AdSense, verificar estado de ads.txt, anuncios automáticos, exclusiones y
   mensajes de consentimiento. La presencia del script no confirma estos ajustes.
4. Confirmar que el responsable atiende GitHub Issues. El canal está documentado;
   no se inventó una dirección de correo ni se envió un reporte de prueba público.
5. Solicitar revisión cuando la versión revisada esté publicada y sea rastreable.
   No se ha enviado ninguna solicitud desde este trabajo.

## Referencias

- [Políticas para editores de Google](https://support.google.com/adsense/answer/10502938?hl=es).
- [AFC: cotizaciones y cartola](https://www.afc.cl/afiliados/mis-cotizaciones/).
- [Dirección del Trabajo: Ordinario 117, BRP](https://www.dt.gob.cl/legislacion/1624/w3-article-127484.html).

La captura del rechazo informa «contenido de poco valor». No revela la versión
examinada, las URL observadas ni el historial de rastreo. Estas mejoras añaden
contenido comprobable, pero no permiten prometer aprobación de AdSense.
