# Revisión técnica y editorial para AdSense

Revisión del código y compilación local: 16 de septiembre de 2026.

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

## Pendientes externos antes de solicitar otra revisión

1. Revisar editorialmente e integrar las PR en orden: #20, #22 y la etapa restante;
   cambiar las bases dependientes a `main` cuando corresponda. Publicar y comprobar
   el contenido real después del despliegue.
2. Revisar en Search Console la inspección de URL en vivo y el sitemap. Las peticiones
   públicas realizadas desde este entorno a `robots.txt`, `ads.txt` y `sitemap.xml`
   devolvieron HTTP 403. No sabemos si la restricción afecta a Google o solo a este
   cliente. Si la inspección también falla, revisar reglas de Cloudflare/alojamiento
   y registros de acceso antes de solicitar revisión.
3. En AdSense, verificar estado de `ads.txt`, anuncios automáticos, exclusiones y
   mensajes de privacidad/consentimiento aplicables. Comprobar en móvil que los
   anuncios reales no interrumpan formularios ni se confundan con controles.
4. Confirmar un canal de contacto atendido por el responsable. GitHub Issues existe
   como canal público técnico; no debe recibir liquidaciones ni datos personales.
5. Solicitar revisión cuando la versión revisada esté publicada y sea rastreable.
   No se ha enviado ninguna solicitud desde este trabajo.

## Referencias

- [Políticas para editores de Google](https://support.google.com/adsense/answer/10502938?hl=es).
- [AFC: cotizaciones y cartola](https://www.afc.cl/afiliados/mis-cotizaciones/).
- [Dirección del Trabajo: Ordinario 117, BRP](https://www.dt.gob.cl/legislacion/1624/w3-article-127484.html).

La captura del rechazo informa «contenido de poco valor». No revela la versión
examinada, las URL observadas ni el historial de rastreo. Estas mejoras añaden
contenido comprobable, pero no permiten prometer aprobación de AdSense.
