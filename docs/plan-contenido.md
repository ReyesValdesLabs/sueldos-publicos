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

Esta parte depende de la PR #20, que aporta el caso compartido. Se presenta en una PR
separada sobre su rama para revisar únicamente la ampliación de la guía. Primero debe
integrarse #20 y después cambiar la base de esta parte a main antes de integrarla.

## Siguientes partes

1. Ampliar BRP y seguro de cesantía; decidir agrupaciones después de revisar su utilidad.
2. Replicar casos en las otras calculadoras; mejorar acceso desde la portada.
3. Revisar experiencia móvil, rastreo y configuración publicitaria antes de solicitar AdSense.

## Datos todavía no disponibles

Fecha exacta del rechazo, versión evaluada por AdSense, Search Console y registros
de acceso del alojamiento. No se asume que Google ya haya rastreado las mejoras.
