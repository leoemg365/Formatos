/**
 * Punto de entrada: inicializa la interfaz y cada formulario.
 */
(function (global) {
  'use strict';

  const Tecnoven = global.Tecnoven;
  const { setFechaHoy, setHoraAhora } = Tecnoven.utils;

  function init() {
    Tecnoven.ui.initNavigation();
    Tecnoven.ui.initTheme();
    Tecnoven.qr.init();

    Tecnoven.forms.fichaInstalacion.init();
    Tecnoven.forms.activacion.init();
    Tecnoven.forms.solicitud.init();

    // Estado inicial: ficha de trabajo con fecha y hora de hoy.
    Tecnoven.ui.showSection('ficha-instalacion');
    setFechaHoy('fecha');
    setHoraAhora('horaInicio');

    Tecnoven.ui.initUpdates();
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
