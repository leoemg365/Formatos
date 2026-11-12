/**
 * Utilidades compartidas: acceso al DOM, formateo y portapapeles.
 */
(function (global) {
  'use strict';

  const Tecnoven = (global.Tecnoven = global.Tecnoven || {});

  /** Atajo para document.getElementById. */
  const $ = (id) => document.getElementById(id);

  /** Devuelve "n/a" cuando el valor está vacío o es 0. */
  function toNA(value) {
    const v = String(value == null ? '' : value).trim();
    return v === '' || v === '0' ? 'n/a' : v;
  }

  /** Normaliza una fecha a DD/MM/AAAA. */
  function formatFecha(value) {
    let v = toNA(value);
    if (v === 'n/a') return v;

    v = v.replace(/-/g, '/').replace(/\s+/g, '/');
    const parts = v.split('/');

    if (parts.length === 3) {
      return (
        parts[0].padStart(2, '0') +
        '/' +
        parts[1].padStart(2, '0') +
        '/' +
        parts[2]
      );
    }

    return v;
  }

  /** Convierte "9 37" en "9:37AM" (formato usado en los reportes). */
  function formatHora(value) {
    const v = toNA(value);
    if (v === 'n/a') return v;

    const parts = v.split(' ');
    if (parts.length === 2) {
      let hora = parseInt(parts[0], 10);
      const minutos = parts[1].padStart(2, '0');
      const sufijo = hora >= 12 ? 'PM' : 'AM';

      if (hora > 12) hora -= 12;
      if (hora === 0) hora = 12;

      return `${hora}:${minutos}${sufijo}`;
    }

    return v;
  }

  /** Coloca la hora actual en el input indicado con el formato "H MM". */
  function setHoraAhora(id) {
    const el = $(id);
    if (!el) return;

    const now = new Date();
    el.value = `${now.getHours()} ${String(now.getMinutes()).padStart(2, '0')}`;
  }

  /** Coloca la fecha actual (DD/MM/AAAA) en el input indicado. */
  function setFechaHoy(id) {
    const el = $(id);
    if (!el) return;

    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    el.value = `${dia}/${mes}/${now.getFullYear()}`;
  }

  /** Copia texto al portapapeles con respaldo para navegadores antiguos. */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  Tecnoven.utils = {
    $,
    toNA,
    formatFecha,
    formatHora,
    setHoraAhora,
    setFechaHoy,
    copyText
  };
})(window);
