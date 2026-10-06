# Sueldos Públicos · imágenes para redes

Entrega: 6 de octubre de 2026. No se crearon cuentas ni se publicó contenido.

## Archivos para subir

- `facebook-perfil.png`: 1024 × 1024, PNG, fondo blanco.
- `instagram-perfil.png`: 1024 × 1024, PNG, mismo diseño.
- `facebook-portada.png`: 1640 × 924, PNG, composición aproximadamente 16:9.

Los perfiles contienen el PNG original del repositorio, escalado proporcionalmente, sin redibujarlo. El mismo archivo original está compuesto en la portada. La portada se creó con la herramienta integrada image_gen y se finalizó con Sharp para conservar el logo original y fijar medidas. Tipografía generada con dirección Poppins; no se garantiza equivalencia tipográfica exacta. Los iconos decorativos siguen el lenguaje de contorno de Lucide; son rasterizados, no los SVG oficiales.

## Recortes y limitaciones de verificación

La ayuda oficial de Meta se intentó consultar el 6 de octubre de 2026:

- https://www.facebook.com/help/125379114252045
- https://www.facebook.com/business/help/125379114252045
- https://help.instagram.com/557544397610546

Facebook redirigió a inicio de sesión/bloqueo temporal e Instagram respondió 429. Por tanto, no se afirma una verificación directa de las especificaciones oficiales vigentes. Las referencias secundarias consultadas discrepan sobre los diseños de portada: algunas describen 820 × 312 en escritorio y 640 × 360 en móvil; otras, 16:9 en escritorio y 2.4:1 en móvil. Se probaron ambos escenarios geométricos. Estas vistas previas son simulaciones de recorte centrado, no capturas reales de Meta.

Referencias secundarias:
- https://socialmagnum.com/blog/facebook-cover-photo-size
- https://outfeed.ai/blog/facebook-cover-photo-size/
- https://linklay.io/social-media/instagram/profile-picture-size

El tamaño de perfil 1024 × 1024 es una decisión de exportación de alta resolución, no un requisito atribuido a Meta. Se comprobó un recorte circular a 320 × 320. El logo ocupa aproximadamente el 65% del ancho final visible y conserva margen.

La portada mantiene su contenido esencial aproximadamente entre x=350–1300 e y=235–690. El recorte centrado más estrecho probado (851:315) conserva la franja aproximada y=158–766; el área inferior izquierda no contiene texto esencial y deja espacio para la superposición del avatar. No existe una zona segura universal verificada: la interfaz y el reposicionamiento pueden variar. Al subir, mantener la imagen centrada y comprobar la vista previa del propio Facebook.

`previews/` contiene el círculo del perfil y recortes a 820 × 312, 640 × 360 y 2.4:1. No subir estas vistas previas como archivos finales.

## Dirección de generación utilizada

Perfil: imagen cuadrada blanca, logo original centrado, amplio margen circular, sin texto ni adornos. La versión generada se descartó en favor de composición directa del archivo original para conservar sus detalles.

Portada: fondo #F6F9FC, azul #0D47A1, turquesa #009688, menta suave y gris #607D8B; líneas curvas discretas en las esquinas; firma central «sueldospublicos.cl» con sueldos azul, publicos turquesa y .cl gris; titular «Entiende tu sueldo, peso por peso.»; subtítulo «Calculadoras informativas · Chile»; logo y textos centrales, sin sellos gubernamentales ni usuarios inventados. Uso de image_gen integrado, sin API externa ni CLI de generación.
