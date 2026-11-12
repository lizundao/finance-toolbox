import { initTheme } from './theme.js';
import { initNotifications } from './common.js';
import { initMenubar } from './menubar.js';
import { initI18n } from './i18n.js';

const views = [
  'home', 'rmb', 'rmb-reverse', 'check-date', 'format', 'tax',
  'date-calc', 'calendar', 'interest', 'loan', 'depreciation', 'allocate', 'iit', 'validate',
  'settings', 'about', 'license',
];

const inited = {
  rmb: false,
  'rmb-reverse': false,
  'check-date': false,
  format: false,
  tax: false,
  'date-calc': false,
  calendar: false,
  interest: false,
  loan: false,
  depreciation: false,
  allocate: false,
  iit: false,
  validate: false,
  settings: false,
};

const toolLoaders = {
  rmb: () => import('./tools/rmb.js').then((m) => m.initRmb),
  'rmb-reverse': () => import('./tools/rmb-reverse.js').then((m) => m.initRmbReverse),
  'check-date': () => import('./tools/check-date.js').then((m) => m.initCheckDate),
  format: () => import('./tools/format.js').then((m) => m.initFormat),
  tax: () => import('./tools/tax.js').then((m) => m.initTax),
  'date-calc': () => import('./tools/date-calc.js').then((m) => m.initDateCalc),
  calendar: () => import('./tools/calendar.js').then((m) => m.initCalendar),
  interest: () => import('./tools/interest.js').then((m) => m.initInterest),
  loan: () => import('./tools/loan.js').then((m) => m.initLoan),
  depreciation: () => import('./tools/depreciation.js').then((m) => m.initDepreciation),
  allocate: () => import('./tools/allocate.js').then((m) => m.initAllocate),
  iit: () => import('./tools/iit.js').then((m) => m.initIit),
  validate: () => import('./tools/validate.js').then((m) => m.initValidate),
  settings: () => import('./tools/settings.js').then((m) => m.initSettings),
};

async function ensureView(view) {
  if (!Object.hasOwn(inited, view) || inited[view]) return;
  const loader = toolLoaders[view];
  if (!loader) return;
  const init = await loader();
  init();
  inited[view] = true;
}

export async function navigate(view) {
  if (!views.includes(view)) return;

  document.querySelectorAll('[data-view]').forEach((btn) => {
    if (btn.dataset.view) {
      btn.classList.toggle('active', btn.dataset.view === view);
    }
  });
  document.querySelectorAll('.view').forEach((el) => {
    el.classList.toggle('active', el.id === `view-${view}`);
  });

  await ensureView(view);
}

document.querySelectorAll('[data-view]').forEach((btn) => {
  btn.addEventListener('click', () => navigate(btn.dataset.view));
});

document.querySelectorAll('.tool-card[data-goto]').forEach((card) => {
  card.addEventListener('click', () => {
    if (!card.classList.contains('soon')) navigate(card.dataset.goto);
  });
});

document.addEventListener('finance-navigate', (e) => navigate(e.detail));

initI18n();
initTheme();
initNotifications();
initMenubar(navigate);

queueMicrotask(() => {
  import('./lib/date-picker.js').then(({ initDatePickers }) => initDatePickers());
});

navigate('home');
