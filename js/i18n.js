import { MESSAGES } from './i18n/messages.js';

const STORAGE_KEY = 'finance-toolbox-locale';

let locale = 'zh';

export function getLocale() {
  return locale;
}

export function tr(key, ...args) {
  const table = MESSAGES[locale] ?? MESSAGES.zh;
  const fallback = MESSAGES.zh;
  let text = table[key] ?? fallback[key] ?? key;
  if (typeof text === 'function') text = text(...args);
  if (args.length && typeof text === 'string') {
    args.forEach((arg, i) => {
      text = text.replace(`{${i}}`, String(arg));
    });
  }
  return text;
}

function applyAttr(selector, attr, keyAttr) {
  document.querySelectorAll(`[${selector}]`).forEach((el) => {
    const key = el.getAttribute(keyAttr);
    if (!key) return;
    const value = tr(key);
    if (attr === 'text') el.textContent = value;
    else if (attr === 'html') el.innerHTML = value;
    else el.setAttribute(attr, value);
  });
}

export function applyI18n() {
  applyAttr('data-i18n', 'text', 'data-i18n');
  applyAttr('data-i18n-html', 'html', 'data-i18n-html');
  applyAttr('data-i18n-placeholder', 'placeholder', 'data-i18n-placeholder');
  applyAttr('data-i18n-title', 'title', 'data-i18n-title');
  applyAttr('data-i18n-aria', 'aria-label', 'data-i18n-aria');

  document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
  document.title = tr('appName');

  const titlebar = document.querySelector('.titlebar-name');
  if (titlebar && titlebar.hasAttribute('data-i18n')) {
    titlebar.textContent = tr('appName');
  }

  document.dispatchEvent(new CustomEvent('localechange', { detail: locale }));
}

export function setLocale(next) {
  locale = next === 'en' ? 'en' : 'zh';
  localStorage.setItem(STORAGE_KEY, locale);
  applyI18n();
}

export function initI18n() {
  const saved = localStorage.getItem(STORAGE_KEY);
  locale = saved === 'en' ? 'en' : 'zh';

  const select = document.getElementById('localeSelect');
  if (select) {
    select.value = locale;
    select.addEventListener('change', () => setLocale(select.value));
  }

  applyI18n();
}
