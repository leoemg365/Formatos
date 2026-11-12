/**
 * Ficha de Trabajo (instalación / soporte).
 */
(function (global) {
  'use strict';

  const Tecnoven = global.Tecnoven;
  const {
    $,
    toNA,
    formatFecha,
    formatHora,
    setHoraAhora,
    setFechaHoy,
    copyText
  } = Tecnoven.utils;
  const { showMessage } = Tecnoven.ui;

  const METRAJE_MANUAL_FIELDS = ['utpManual', 'dropManual', 'coaxialManual', 'flapManual'];
  const METRAJE_TYPES = ['utp', 'drop', 'coaxial', 'flap'];
  const COUNTER_FIELDS = [
    'apc',
    'upc',
    'rg6',
    'rj45',
    'splitter',
    'roseta',
    'manguita',
    'couple',
    'utp',
    'drop',
    'coaxial',
    'flap',
    'mastil',
    'tensores',
    'preformados',
    'grapas',
    'ramplug'
  ];

  let tecnicosSeleccionados = [];

  function renderChips() {
    const container = $('chipsContainer');
    container.innerHTML = '';

    tecnicosSeleccionados.forEach((tecnico, index) => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.textContent = `${tecnico} `;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '❌';
      removeBtn.setAttribute('aria-label', `Quitar a ${tecnico}`);
      removeBtn.addEventListener('click', () => {
        tecnicosSeleccionados.splice(index, 1);
        renderChips();
      });

      chip.appendChild(removeBtn);
      container.appendChild(chip);
    });

    $('otroNombre').style.display = tecnicosSeleccionados.includes('Otro') ? 'block' : 'none';
  }

  function agregarTecnico() {
    const select = $('tecnicosSelect');
    const valor = select.value;

    if (valor && !tecnicosSeleccionados.includes(valor)) {
      tecnicosSeleccionados.push(valor);
      renderChips();
    }

    select.value = '';
  }

  function obtenerTecnicosFinales() {
    const tecnicos = tecnicosSeleccionados.filter((t) => t !== 'Otro');
    const otroInput = $('otroNombre');

    if (otroInput.style.display === 'block' && otroInput.value.trim() !== '') {
      const nombresExtra = otroInput.value
        .trim()
        .split(',')
        .map((nombre) => nombre.trim());

      tecnicos.push(...nombresExtra);
    }

    return tecnicos.filter(Boolean).join(' - ') || 'n/a';
  }

  function obtenerValoresContadores() {
    const valores = {};

    COUNTER_FIELDS.forEach((type) => {
      const span = document.querySelector(`#ficha-instalacion span[data-type="${type}"]`);
      const manualInput = $(`${type}Manual`);

      if (METRAJE_MANUAL_FIELDS.includes(`${type}Manual`)) {
        valores[type] = manualInput ? manualInput.value : span ? span.textContent : '0';
      } else {
        valores[type] = span ? span.textContent : '0';
      }
    });

    return valores;
  }

  function generarReporte() {
    const tipo = $('tipoTrabajo').value;
    const observacionInput = $('observacion');
    const observacion = observacionInput.value.trim();

    if (tipo === 'soporte' && !observacion) {
      showMessage('Debes escribir una observación en soporte');
      observacionInput.focus();
      observacionInput.style.border = '2px solid red';
      observacionInput.style.backgroundColor = '#fff0f0';
      return;
    }

    const servicio = $('servicio').value === 'Ambos' ? 'Internet + TV' : $('servicio').value;
    const napRegion = $('napRegionInst').value;
    const napNumber = $('napNumberInst').value;
    const nap = napNumber ? `${napRegion}-${napNumber}` : '';
    const contadores = obtenerValoresContadores();
    const tecnicos = obtenerTecnicosFinales();

    const observacionFinal =
      tipo === 'instalacion' && !observacion
        ? 'Se realizó la instalación quedando con servicio operativo.'
        : observacion;

    const lineas = [
      `TIPO DE TRABAJO: ${tipo === 'instalacion' ? 'Instalación' : 'Soporte'}`,
      `SERVICIO: ${servicio}`,
      `FECHA: ${formatFecha($('fecha').value)}`,
      `NOMBRE DE CLIENTE: ${toNA($('cliente').value)}`,
      `HORA INICIO: ${formatHora($('horaInicio').value)}`,
      `HORA FIN: ${formatHora($('horaFin').value)}`,
      `SERIAL: ${toNA($('serialInst').value)}`,
      `NAP: ${toNA(nap)}`,
      `PUERTO: ${toNA($('puertoInst').value)}`,
      `POTENCIA: ${toNA($('potencia').value)}`,
      `CONECTOR APC: ${toNA(contadores.apc)}`,
      `CONECTOR UPC: ${toNA(contadores.upc)}`,
      `CONECTOR RG6: ${toNA(contadores.rg6)}`,
      `CONECTOR RJ45: ${toNA(contadores.rj45)}`,
      `SPLITTER TV: ${toNA(contadores.splitter)}`,
      `ROSETA: ${toNA(contadores.roseta)}`,
      `MANGUITA: ${toNA(contadores.manguita)}`,
      `COUPLE: ${toNA(contadores.couple)}`,
      `METRAJE UTP: ${toNA(contadores.utp)}`,
      `METRAJE DROP: ${toNA(contadores.drop)}`,
      `METRAJE COAXIAL: ${toNA(contadores.coaxial)}`,
      `METRAJE FLAP: ${toNA(contadores.flap)}`,
      `MASTIL: ${toNA(contadores.mastil)}`,
      `TENSORES: ${toNA(contadores.tensores)}`,
      `PREFORMADOS: ${toNA(contadores.preformados)}`,
      `GRAPAS y CLAVOS: ${toNA(contadores.grapas)}`,
      `Ramplug y Tornillos: ${toNA(contadores.ramplug)}`,
      `UBICACIÓN: ${toNA($('ubicacion').value)}`,
      `TÉCNICOS: ${tecnicos}`,
      `Cobrar: ${toNA($('cobro').value)}`,
      `Observación:\n${observacionFinal}`
    ];

    $('resultadoInst').textContent = lineas.join('\n');
  }

  async function copiarReporte() {
    const texto = $('resultadoInst').textContent;

    if (!texto) {
      showMessage('Genera primero');
      return;
    }

    await copyText(texto);
    showMessage('Copiado ✅');
  }

  function nuevoFormato() {
    document
      .querySelectorAll('#ficha-instalacion input, #ficha-instalacion textarea, #ficha-instalacion select')
      .forEach((el) => {
        if (el.type !== 'button') el.value = '';
      });

    tecnicosSeleccionados = [];
    renderChips();
    $('resultadoInst').textContent = '';

    const btnUbicacion = $('btnUbicacion');
    btnUbicacion.disabled = false;
    btnUbicacion.textContent = 'Obtener ubicación';

    COUNTER_FIELDS.forEach((type) => {
      const span = document.querySelector(`#ficha-instalacion span[data-type="${type}"]`);
      if (span) span.textContent = '0';
    });

    METRAJE_MANUAL_FIELDS.forEach((id) => {
      const el = $(id);
      if (el) el.value = '0';
    });

    setFechaHoy('fecha');
    setHoraAhora('horaInicio');
  }

  function actualizarContador(button) {
    const { type, action } = button.dataset;
    const esMetraje = METRAJE_TYPES.includes(type);

    if (esMetraje) {
      const manualInput = $(`${type}Manual`);
      if (!manualInput) return;

      let valor = parseInt(manualInput.value || '0', 10) || 0;
      valor += action === 'increase' ? 10 : -10;
      manualInput.value = Math.max(0, valor);
      return;
    }

    const span = button.parentElement.querySelector(`span[data-type="${type}"]`);
    if (!span) return;

    let valor = parseInt(span.textContent, 10) || 0;
    valor += action === 'increase' ? 1 : -1;
    span.textContent = Math.max(0, valor);
  }

  function obtenerUbicacion() {
    const input = $('ubicacion');
    const button = $('btnUbicacion');

    if (!navigator.geolocation) {
      showMessage('Este dispositivo no soporta geolocalización.');
      return;
    }

    button.disabled = true;
    button.textContent = 'Obteniendo…';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        input.value = `${latitude}, ${longitude}`;
        button.disabled = false;
        button.textContent = 'Actualizar ubicación';
        showMessage('Ubicación obtenida ✅');
      },
      (error) => {
        button.disabled = false;
        button.textContent = 'Obtener ubicación';

        const mensajes = {
          1: 'Permiso de ubicación denegado.',
          2: 'No se pudo obtener la ubicación.',
          3: 'La ubicación tardó demasiado. Intenta de nuevo.'
        };

        showMessage(mensajes[error.code] || 'No se pudo obtener la ubicación.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  /** Conecta todos los controles de la ficha. */
  function init() {
    $('tecnicosSelect').addEventListener('change', agregarTecnico);

    $('btnFecha').addEventListener('click', () => setFechaHoy('fecha'));
    $('btnAhoraIni').addEventListener('click', () => setHoraAhora('horaInicio'));
    $('btnAhoraFin').addEventListener('click', () => setHoraAhora('horaFin'));

    $('observacion').addEventListener('input', (event) => {
      event.target.style.border = '';
      event.target.style.backgroundColor = '';
    });

    $('btnGenerarInst').addEventListener('click', generarReporte);
    $('btnCopiarInst').addEventListener('click', copiarReporte);
    $('btnNuevoInst').addEventListener('click', nuevoFormato);
    $('btnUbicacion').addEventListener('click', obtenerUbicacion);

    document.querySelectorAll('#ficha-instalacion .counter-control button').forEach((button) => {
      button.addEventListener('click', () => actualizarContador(button));
    });

    renderChips();
  }

  Tecnoven.forms = Tecnoven.forms || {};
  Tecnoven.forms.fichaInstalacion = { init };
})(window);
