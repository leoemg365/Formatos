# Tecnoven Formatos

Aplicación web para generar reportes de instalación, activación y solicitud de trabajo.
El proyecto está separado en HTML, CSS y JavaScript, sin frameworks ni proceso de compilación.

## Estructura

```text
Tecnoven_Formatos/
├── index.html                  Estructura de la aplicación
├── inventario.html             Gestor de inventario (página independiente)
├── README.md
└── assets/
    ├── css/
    │   ├── base.css            Variables, reset y estilos globales
    │   ├── layout.css          Menú, contenido principal, footer y WhatsApp
    │   ├── components.css      Formularios, botones, contadores, modales y avisos
    │   ├── themes.css          Tema oscuro
    │   └── responsive.css      Adaptación a tablet, escritorio y móvil
    └── js/
        ├── config.js           Versión de la app y novedades
        ├── utils.js            Helpers: DOM, fechas, horas y portapapeles
        ├── ui.js               Navegación, tema, avisos y modales
        ├── qr.js               Escáner QR de seriales
        ├── app.js              Punto de entrada (inicializa todo)
        └── forms/
            ├── ficha-instalacion.js   Ficha de trabajo
            ├── activacion.js          Proceso de activación
            └── solicitud.js           Solicitud de trabajo
```

## Cómo abrirla

- **Uso normal:** abre `index.html` con doble clic. El proyecto usa scripts clásicos
  (no módulos ES), por lo que funciona directamente desde `file://`.
- **Escáner QR y ubicación GPS:** la cámara y la geolocalización requieren un contexto
  seguro. Usa `https://` o un servidor local:

  ```bash
  cd Tecnoven_Formatos
  python -m http.server 8000
  ```

  Luego abre `http://localhost:8000`. Si abres el archivo directamente con `file://`,
  el navegador puede denegar el permiso de ubicación.

- **Inventario:** `inventario.html` usa Tailwind y Google Fonts por CDN, así que necesita
  conexión a internet. Se incluyó tal cual, solo se actualizó su enlace «Volver» a
  `index.html`.

## Dónde editar cada cosa

| Necesito cambiar... | Archivo |
| --- | --- |
| Textos, campos o secciones del formulario | `index.html` |
| Lista de técnicos | `index.html` (opciones de `#tecnicosSelect`) |
| Plantilla del reporte de instalación | `assets/js/forms/ficha-instalacion.js` |
| Ubicación GPS y su línea del reporte | `assets/js/forms/ficha-instalacion.js` |
| Plantilla de activación | `assets/js/forms/activacion.js` |
| Plantilla de solicitud | `assets/js/forms/solicitud.js` |
| Versión y novedades | `assets/js/config.js` |
| Navegación, tema oscuro o avisos | `assets/js/ui.js` |
| Colores y estilos generales | `assets/css/base.css` |
| Estilos de botones, inputs, modales | `assets/css/components.css` |
| Comportamiento del escáner QR | `assets/js/qr.js` |

### Publicar una nueva versión

1. Cambia `APP_VERSION` en `assets/js/config.js`.
2. Añade las novedades en `UPDATE_FEATURES` (mismo archivo).
3. Actualiza el número de versión visible en el footer de `index.html`.

El aviso de novedades se muestra una vez por versión y se guarda en `localStorage`
(`lastVersionSeen`, `appliedAppVersion`).

## Orden de carga de los scripts

`index.html` carga los scripts con `defer` en este orden:

```text
config.js → utils.js → ui.js → qr.js → forms/*.js → app.js
```

Todos exponen sus funciones en el espacio global `window.Tecnoven`
(`Tecnoven.config`, `Tecnoven.utils`, `Tecnoven.ui`, `Tecnoven.qr`,
`Tecnoven.forms`). Si añades un módulo nuevo, inclúyelo antes de `app.js`.

## Notas

- Se eliminó la sección «Ficha de Inalámbrico», que no se utilizará.
- Los cuatro metrajes ahora usan un único control integrado (`−  valor  +`), sin el
  número duplicado que aparecía antes.
- Los contadores se organizan en dos columnas en escritorio y en una columna en móvil.
- La ficha de trabajo incluye **Ubicación GPS** antes de los técnicos. Al pulsar
  «Obtener ubicación» se solicita permiso y se guardan las coordenadas con el formato
  `latitud, longitud`; el reporte agrega la línea `UBICACIÓN:` antes de `TÉCNICOS:`.
- Se corrigió el enlace de «Inventario», que usaba `class="_blank"` en lugar de
  `target="_blank"`.
- El código JavaScript se verificó con pruebas de DOM (generación de reportes,
  contadores, técnicos, GPS, navegación, tema y reinicio de formularios).
