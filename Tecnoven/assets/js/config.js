/**
 * Configuración general de la aplicación.
 */
(function (global) {
  'use strict';

  const Tecnoven = (global.Tecnoven = global.Tecnoven || {});

  const APP_VERSION = '2.0';

  const UPDATE_FEATURES = [
    '<li><span class="chip new">Nuevo</span>Se ha añadido la ventana de novedades para informarte de los cambios.</li>',
    '<li><span class="chip new">Nuevo</span>Inventario, ahora puedes pegar el texto generado y se guardará relación</li>',
    '<li><span class="chip improved">Mejora</span>Se agregó boton de WhatsApp para ir directam a la aplicación</li>',
    '<li><span class="chip fixed">Corregido</span>Nombres en Orden</li>',
    '<li><span class="chip improved">Mejora</span>No se muestra el mensaje de error al intentar acceder a una sección no disponible</li>'
  ];

  Tecnoven.config = Object.freeze({
    APP_VERSION,
    UPDATE_FEATURES
  });
})(window);
