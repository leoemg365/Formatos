/**
 * Escáner de códigos QR para los campos de serial.
 */
(function (global) {
  'use strict';

  const Tecnoven = global.Tecnoven;
  const { $ } = Tecnoven.utils;
  const { showMessage } = Tecnoven.ui;

  let scanner = null;

  function openScanner(serialInputId) {
    const modal = $('qrModal');
    if (!modal || typeof Html5Qrcode === 'undefined') {
      showMessage('El escáner QR no está disponible.');
      return;
    }

    modal.style.display = 'flex';

    const config = { fps: 10, qrbox: 250 };
    scanner = new Html5Qrcode('scanner-container');

    scanner
      .start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          const match = decodedText.match(/PON SN:(\S+)/);
          let serial = decodedText;

          if (match && match[1]) {
            serial = match[1];
            showMessage('PON SN: extraído con éxito.');
          } else {
            showMessage('Código escaneado. Utilizando el texto completo.');
          }

          $(serialInputId).value = serial;
          closeScanner();
        }
      )
      .catch((error) => {
        console.error('Error al iniciar escáner:', error);
        showMessage('Error al iniciar escáner. Revisa los permisos de la cámara.');
      });
  }

  function closeScanner() {
    const modal = $('qrModal');

    if (scanner && scanner.isScanning) {
      scanner
        .stop()
        .then(() => {
          if (modal) modal.style.display = 'none';
        })
        .catch((error) => {
          console.error('Error al detener el escáner:', error);
          if (modal) modal.style.display = 'none';
        });
    } else if (modal) {
      modal.style.display = 'none';
    }
  }

  /** Conecta los botones de escaneo con sus campos de serial. */
  function init() {
    const btnInst = $('btnScanQRInst');
    const btnAct = $('btnScanQRAct');
    const btnClose = $('btnCloseScanner');

    if (btnInst) btnInst.addEventListener('click', () => openScanner('serialInst'));
    if (btnAct) btnAct.addEventListener('click', () => openScanner('serialAct'));
    if (btnClose) btnClose.addEventListener('click', closeScanner);
  }

  Tecnoven.qr = { init };
})(window);
