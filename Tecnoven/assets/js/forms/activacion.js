/**
 * Proceso de Activación.
 */
(function (global) {
  'use strict';

  const Tecnoven = global.Tecnoven;
  const { $, toNA, copyText } = Tecnoven.utils;
  const { showMessage } = Tecnoven.ui;

  function generarReporte() {
    const tipoActivacion = $('tipoActivacion').value;
    const cliente = $('clienteAct').value;
    const napRegion = $('napRegionAct').value;
    const napNumber = $('napNumberAct').value;
    const puerto = $('puertoAct').value;
    const serial = $('serialAct').value;
    const nap = napRegion && napNumber ? `${napRegion}-${napNumber}` : '';

    const lineas = [
      `ACTIVACIÓN: ${tipoActivacion}`,
      `NOMBRE DE CLIENTE: ${toNA(cliente)}`,
      `NAP: ${toNA(nap)}`,
      `PUERTO: ${toNA(puerto)}`,
      `SERIAL: ${toNA(serial)}`
    ];

    $('resultadoAct').textContent = lineas.join('\n');
  }

  async function copiarReporte() {
    const texto = $('resultadoAct').textContent;

    if (!texto) {
      showMessage('Genera el reporte primero.');
      return;
    }

    await copyText(texto);
    showMessage('Copiado al portapapeles ✅');
  }

  function nuevoFormato() {
    document
      .querySelectorAll('#proceso-activacion input, #proceso-activacion select')
      .forEach((el) => {
        if (el.type !== 'button') el.value = '';
      });

    $('resultadoAct').textContent = '';
  }

  function init() {
    $('btnGenerarAct').addEventListener('click', generarReporte);
    $('btnCopiarAct').addEventListener('click', copiarReporte);
    $('btnNuevoAct').addEventListener('click', nuevoFormato);
  }

  Tecnoven.forms = Tecnoven.forms || {};
  Tecnoven.forms.activacion = { init };
})(window);
