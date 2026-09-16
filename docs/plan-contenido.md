# Mejora de contenido: seguimiento

## Base de trabajo — 15 de septiembre de 2026

La copia local partía de `9eccdef`. Se incorporó por avance directo el `main`
público en `e3d7290`, que ya incluye seis guías y las mejoras editoriales.
No se modificaron manualmente los parámetros generados ni se publicó un despliegue.
El commit exacto desplegado no está expuesto en el sitio: la correspondencia con
producción se comprobó por las guías y páginas visibles, no por un identificador de build.

## Inventario y orden de trabajo

- Cuatro calculadoras: conservar; añadir casos completos visibles y reproducibles.
- Seis guías: conservar y profundizar primero liquidación docente y cotizaciones.
- Diecinueve fichas legales: conservar las referencias; revisar profundidad por ficha.
  Experiencia es la primera ampliación; BRP y seguro de cesantía son las siguientes.
- Portada y biblioteca legal: mejorar enlaces a los casos una vez que existan.
- Metodología, autoría, privacidad, términos y contacto: conservar; revisar contacto
  accesible cuando se defina un canal atendido por el responsable.

## Parte 1: experiencia

- [x] Recuperar los cambios publicados disponibles en main.
- [x] Ampliar la ficha con un ejemplo de jornada mixta, comprobaciones y errores frecuentes.
- [x] Verificar los cuatro resultados del ejemplo contra el motor de cálculo.
- [x] Admitir fechas de revisión por ficha, compartidas por página, JSON-LD y sitemap.
- [ ] Revisión editorial humana antes de publicar.

## Parte 2: caso docente completo

- [x] Caso ficticio con jornada mixta, tres bienios, Avanzado y BRP acreditada.
- [x] Haberes, descuentos y líquido disponibles en el HTML inicial.
- [x] Explicación de cada línea y enlaces a sus fuentes.
- [x] Carga completa de antecedentes, restableciendo parámetros manuales y llevando el foco al resultado.
- [x] Comprobación independiente de haberes y descuentos mensuales; protección frente a mutaciones del ejemplo.
- [x] Recorrido probado en navegador: carga inicial y recarga después de alterar comisión AFP y APV.
- [x] Vista móvil revisada sin desbordamiento horizontal de la página.

El caso usa los parámetros publicados y se recalcula en cada compilación. Los valores
mensuales no están duplicados ni fijados en el texto. Las fechas de las otras calculadoras
se conservan.

## Parte 3: guía de liquidación docente

- [x] Integrar el caso compartido, con supuestos, períodos, haberes, descuentos y líquido.
- [x] Explicar la revisión de RBMN, experiencia, tramo y bases antes de comparar el líquido.
- [x] Comparar dos y tres bienios manteniendo los demás antecedentes; verificar los cambios con pruebas.
- [x] Añadir pasos para reproducir la comparación y preparar una consulta al empleador.
- [x] Actualizar solo la fecha de revisión de esta guía y comprobar HTML, enlaces, JSON-LD y sitemap.
- [x] Validar tipos, 150 pruebas unitarias, 13 pruebas de automatización y compilación; revisar escritorio y móvil.

La PR #20 aportó el caso compartido. Las PR #22 y #23 se integraron en la rama
intermedia; la recuperación aplica sus cambios sobre main, conservando Analytics.

## Partes 4 a 6: contenido restante y revisión técnica

- [x] Ampliar BRP con proporcionalidad, tope, acreditación y caso numérico.
- [x] Ampliar cotizaciones y la ficha específica AFC de asistentes con casos y comprobaciones.
- [x] Conservar ambas fichas: bases comunes y aplicación contractual tienen propósitos distintos.
- [x] Publicar casos en HTML inicial para técnicos SLEP, administrativos DAEM central y progresión docente.
- [x] Permitir cargar antecedentes completos y volver a cargarlos tras modificar datos.
- [x] Enlazar los cuatro casos desde portada y biblioteca legal.
- [x] Validar cifras, enlaces, fechas, metadatos y configuración publicitaria del código.
- [x] Revisar formularios y lectura móvil.
- [ ] Verificar rastreo de producción en Search Console: este entorno recibe HTTP 403.
- [ ] Confirmar ajustes de cuenta AdSense, consentimiento y anuncios reales tras publicar.
- [ ] Revisión editorial humana, integración y despliegue; después solicitar revisión AdSense.

Detalle y comprobaciones reproducibles: [revisión AdSense](revision-adsense.md).
La recuperación reúne estas partes y la guía docente en una PR dirigida a main.

## Datos todavía no disponibles

Fecha exacta del rechazo, versión evaluada por AdSense, Search Console y registros
de acceso del alojamiento. No se asume que Google ya haya rastreado las mejoras.
