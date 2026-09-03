# Checklist para una nueva revisión de AdSense

Este documento separa los cambios verificables en el repositorio de las acciones que requieren acceso a Google AdSense o Search Console.

## Antes de desplegar

- Ejecutar `pnpm check`, `pnpm test`, `pnpm test:automation`, `pnpm build` y `git diff --check`.
- Confirmar que `/sitemap.xml`, `/robots.txt` y `/ads.txt` respondan con `200` en producción.
- Revisar que las fechas visibles distingan los montos legales base del período mensual de Previred.
- Abrir portada, calculadoras, biblioteca legal, autor, metodología, privacidad y guías en escritorio y móvil.
- Verificar que cada guía tenga URL canónica, autor, fecha, fuentes y datos estructurados de artículo.

## Después de desplegar

- En Search Console, inspeccionar la portada, `/guias/`, las seis guías y las cuatro calculadoras.
- Volver a enviar `https://sueldospublicos.cl/sitemap.xml` y comprobar que las nuevas URLs se descubran sin bloqueos.
- Revisar que la versión pública mantenga `ads.txt` con el identificador del editor correcto.
- En AdSense → Privacidad y mensajes, habilitar y publicar el mensaje para normativa europea mediante la CMP certificada de Google, si aún no está activo.
- No comprar tráfico, solicitar clics ni incentivar interacciones con anuncios.
- Evitar cambios editoriales grandes mientras Google procesa la siguiente revisión.

## Evidencia para solicitar la revisión

Conservar el enlace al despliegue o commit, el resultado de las validaciones, una captura de la CMP publicada y la inspección de las URLs principales. La revisión debe solicitarse cuando la versión pública ya contenga estos cambios, no inmediatamente antes del despliegue.
