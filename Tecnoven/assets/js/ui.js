/**
 * Interfaz general: navegación, tema, avisos y ventanas de novedades.
 */
(function (global) {
  'use strict';

  const Tecnoven = global.Tecnoven;
  const { $ } = Tecnoven.utils;
  const { APP_VERSION, UPDATE_FEATURES } = Tecnoven.config;

  let messageTimer = null;

  /** Muestra un aviso flotante durante 3 segundos. */
  function showMessage(message) {
    const box = $('messageBox');
    if (!box) return;

    box.textContent = message;
    box.classList.add('show');

    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => box.classList.remove('show'), 3000);
  }

  /** Activa una sección y marca su enlace en el menú. */
  function showSection(targetId) {
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.toggle('active', link.dataset.target === targetId);
    });

    document.querySelectorAll('.content-section').forEach((section) => {
      section.classList.toggle('active', section.id === targetId);
    });
  }

  /** Menú lateral y navegación entre formatos. */
  function initNavigation() {
    const navMenu = document.querySelector('.nav-menu');
    const menuToggle = document.querySelector('.menu-toggle');

    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        showSection(link.dataset.target);

        if (window.innerWidth < 768 && navMenu) {
          navMenu.classList.remove('active');
        }
      });
    });

    if (menuToggle && navMenu) {
      menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
      });
    }
  }

  /** Tema claro/oscuro persistido en localStorage. */
  function initTheme() {
    const themeBtn = $('toggleThemeBtn');
    if (!themeBtn) return;

    if (localStorage.getItem('darkMode') === '1') {
      document.body.classList.add('dark-mode');
      themeBtn.textContent = '☀️';
    }

    themeBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-mode');
      themeBtn.textContent = isDark ? '☀️' : '🌙';
      localStorage.setItem('darkMode', isDark ? '1' : '0');
    });
  }

  function showUpdatesModal() {
    $('updatesTitle').innerHTML = `🚀 Novedades v${APP_VERSION}`;
    $('updatesBody').innerHTML = `<ul>${UPDATE_FEATURES.join('')}</ul>`;
    $('updatesModal').style.display = 'flex';
  }

  function hideUpdatesModal() {
    $('updatesModal').style.display = 'none';
    localStorage.setItem('lastVersionSeen', APP_VERSION);
  }

  /** Muestra el progreso de actualización y, después, las novedades. */
  function initUpdates() {
    const closeBtn = $('closeUpdatesModal');
    if (closeBtn) closeBtn.addEventListener('click', hideUpdatesModal);

    const lastVersionSeen = localStorage.getItem('lastVersionSeen');
    const appliedVersion = localStorage.getItem('appliedAppVersion');
    const hasUpdates = lastVersionSeen !== APP_VERSION;

    if (appliedVersion !== APP_VERSION) {
      const modal = $('applyingUpdateModal');
      const progressBar = modal.querySelector('.update-progress-bar');

      modal.style.display = 'flex';
      progressBar.addEventListener(
        'animationend',
        () => {
          localStorage.setItem('appliedAppVersion', APP_VERSION);
          modal.style.display = 'none';
          if (hasUpdates) showUpdatesModal();
        },
        { once: true }
      );
    } else if (hasUpdates) {
      showUpdatesModal();
    }
  }

  Tecnoven.ui = {
    showMessage,
    showSection,
    initNavigation,
    initTheme,
    showUpdatesModal,
    hideUpdatesModal,
    initUpdates
  };
})(window);
