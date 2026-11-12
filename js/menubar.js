import { getCurrentWindow } from '@tauri-apps/api/window';

function closeAllMenus() {
  document.querySelectorAll('.menu-root.open').forEach((root) => {
    root.classList.remove('open');
    root.querySelector('.menu-popup')?.setAttribute('hidden', '');
  });
}

function setupTitlebarDrag(win) {
  const titlebar = document.querySelector('.titlebar');
  if (!titlebar) return;

  titlebar.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const target = e.target;
    if (target.closest('.window-controls, .menu-root, .menu-popup, button, a, select, input')) {
      return;
    }
    e.preventDefault();
    win.startDragging().catch(() => {});
  });
}

export function initMenubar(navigate) {
  const win = getCurrentWindow();

  setupTitlebarDrag(win);

  document.querySelectorAll('.menu-root').forEach((root) => {
    const trigger = root.querySelector('.menu-trigger');
    const popup = root.querySelector('.menu-popup');
    if (!trigger || !popup) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = root.classList.contains('open');
      closeAllMenus();
      if (!isOpen) {
        root.classList.add('open');
        popup.hidden = false;
      }
    });

    popup.querySelectorAll('[data-view]').forEach((item) => {
      item.addEventListener('click', () => {
        navigate(item.dataset.view);
        closeAllMenus();
      });
    });
  });

  document.getElementById('menuQuit')?.addEventListener('click', () => {
    win.close().catch(() => {});
  });

  document.addEventListener('click', closeAllMenus);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllMenus();
  });

  document.getElementById('winMinimize')?.addEventListener('click', () => {
    win.minimize().catch(() => {});
  });
  document.getElementById('winMaximize')?.addEventListener('click', async () => {
    try {
      if (await win.isMaximized()) await win.unmaximize();
      else await win.maximize();
    } catch { /* ignore */ }
  });
  document.getElementById('winClose')?.addEventListener('click', () => {
    win.close().catch(() => {});
  });

  win.onResized(async () => {
    const btn = document.getElementById('winMaximize');
    if (!btn) return;
    try {
      btn.textContent = (await win.isMaximized()) ? '❐' : '□';
    } catch { /* ignore */ }
  });
}
