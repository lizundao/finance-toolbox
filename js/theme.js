import { tr } from './i18n.js';

const STORAGE_KEY = 'finance-toolbox-theme';

export function getTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark';
  if (next === 'light') {
    document.documentElement.dataset.theme = 'light';
  } else {
    delete document.documentElement.dataset.theme;
  }
  localStorage.setItem(STORAGE_KEY, next);
  syncThemeToggle(next);
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function syncThemeToggle(theme) {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const icon = btn.querySelector('.theme-toggle-icon');
  if (theme === 'light') {
    icon.textContent = '🌙';
    btn.title = tr('themeLight');
    btn.setAttribute('aria-label', tr('themeLight'));
  } else {
    icon.textContent = '☀';
    btn.title = tr('themeDark');
    btn.setAttribute('aria-label', tr('themeDark'));
  }
}

export function initTheme() {
  syncThemeToggle(getTheme());
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  document.addEventListener('localechange', () => syncThemeToggle(getTheme()));
}
