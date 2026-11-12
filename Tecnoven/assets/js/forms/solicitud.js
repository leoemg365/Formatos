/**
 * Solicitud de Trabajo.
 */
(function (global) {
  'use strict';

  const Tecnoven = global.Tecnoven;
  const { $, toNA, copyText } = Tecnoven.utils;
  const { showMessage } = Tecnoven.ui;

  function generarReporte() {
    const servicio = $('servicioSol').value;
    const napRegion = $('napRegionSol').value;
    const napNumber = $('napNumberSol').value;
    const cliente = $('clienteSol').value;
    const nap = napRegion && napNumber ? `${napRegion}-${napNumber}` : '';

    const lineas = [
      'SOLICITUD DE TRABAJO',
      `Servicio: ${toNA(servicio)}`,
      `NAP: ${toNA(nap)}`,
      `Nombre: ${toNA(cliente)}`
    ];

    $('resultadoSol').textContent = lineas.join('\n');
  }

  async function copiarReporte() {
    const texto = $('resultadoSol').textContent;

    if (!texto) {
      showMessage('Genera el reporte primero.');
      return;
    }

    await copyText(texto);
    showMessage('Copiado al portapapeles ✅');
  }

  function nuevoFormato() {
    document
      .querySelectorAll('#solicitud input, #solicitud select')
      .forEach((el) => {
        if (el.type !== 'button') el.value = '';
      });

    $('resultadoSol').textContent = '';
  }

  function init() {
    $('btnGenerarSol').addEventListener('click', generarReporte);
    $('btnCopiarSol').addEventListener('click', copiarReporte);
    $('btnNuevoSol').addEventListener('click', nuevoFormato);
  }

  Tecnoven.forms = Tecnoven.forms || {};
  Tecnoven.forms.solicitud = { init };
})(window);
