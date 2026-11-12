import { SolarDay } from 'tyme4ts';
import {
  formatYmd,
  getDayMeta,
  getMonthTitle,
  getWeekdayHeaders,
  parseYmd,
  renderCalendarGrid,
  todayParts,
} from './tyme-calendar.js';
import { tr } from '../i18n.js';

let backdrop = null;
let panel = null;
let titleEl = null;
let gridEl = null;
let detailEl = null;
let weekdayEl = null;

let viewYear = 0;
let viewMonth = 0;
let selectedYmd = null;
let anchorInput = null;
let onPick = null;

function ensureShell() {
  if (backdrop) return;

  backdrop = document.createElement('div');
  backdrop.className = 'tyme-picker-backdrop';
  backdrop.hidden = true;
  backdrop.innerHTML = `
    <div class="tyme-picker" role="dialog" aria-modal="true" aria-labelledby="tymePickerTitle" tabindex="-1">
      <div class="tyme-picker-header">
        <button type="button" class="tyme-cal-nav" data-nav="prev" aria-label="prev">‹</button>
        <div class="tyme-picker-title-wrap">
          <h3 class="tyme-picker-title" id="tymePickerTitle"></h3>
          <button type="button" class="link-btn tyme-picker-today" data-action="today"></button>
        </div>
        <button type="button" class="tyme-cal-nav" data-nav="next" aria-label="next">›</button>
      </div>
      <div class="tyme-cal-weekdays" id="tymePickerWeekdays"></div>
      <div class="tyme-cal-grid" id="tymePickerGrid"></div>
      <div class="tyme-picker-detail" id="tymePickerDetail"></div>
      <div class="tyme-picker-actions">
        <button type="button" class="btn btn-secondary" data-action="cancel"></button>
        <button type="button" class="btn" data-action="confirm"></button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  panel = backdrop.querySelector('.tyme-picker');
  titleEl = backdrop.querySelector('.tyme-picker-title');
  gridEl = backdrop.querySelector('#tymePickerGrid');
  detailEl = backdrop.querySelector('#tymePickerDetail');
  weekdayEl = backdrop.querySelector('#tymePickerWeekdays');

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closePicker();
  });

  backdrop.querySelector('[data-action="cancel"]')?.addEventListener('click', closePicker);
  backdrop.querySelector('[data-action="confirm"]')?.addEventListener('click', confirmPick);
  backdrop.querySelector('[data-action="today"]')?.addEventListener('click', goToday);
  backdrop.querySelector('[data-nav="prev"]')?.addEventListener('click', () => shiftMonth(-1));
  backdrop.querySelector('[data-nav="next"]')?.addEventListener('click', () => shiftMonth(1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop && !backdrop.hidden) closePicker();
  });

  document.addEventListener('localechange', () => {
    if (backdrop && !backdrop.hidden) refreshPickerView();
    refreshPickerButtonLabels();
  });
}

function renderDetail(meta) {
  if (!detailEl) return;
  if (!meta) {
    detailEl.innerHTML = '';
    return;
  }
  const holidayLine = meta.holiday
    ? `<div class="tyme-detail-row"><span>${tr('calHoliday')}</span><strong>${meta.holiday.name || (meta.holiday.isWork ? tr('calCustomWorkday') : tr('calCustomRest'))} · ${meta.holiday.isWork ? tr('calBadgeWork') : tr('calBadgeRest')}</strong></div>`
    : '';
  const termLine = meta.term
    ? `<div class="tyme-detail-row"><span>${tr('calTerm')}</span><strong>${meta.term}</strong></div>`
    : '';
  detailEl.innerHTML = `
    <div class="tyme-detail-row"><span>${tr('calSolar')}</span><strong>${meta.solarLabel}</strong></div>
    <div class="tyme-detail-row"><span>${tr('calLunar')}</span><strong>${meta.lunarFull}</strong></div>
    <div class="tyme-detail-row"><span>${tr('calWeekday')}</span><strong>${meta.weekName}</strong></div>
    ${holidayLine}
    ${termLine}
  `;
}

function refreshPickerView() {
  if (!gridEl || !titleEl || !weekdayEl) return;

  titleEl.textContent = getMonthTitle(viewYear, viewMonth);
  weekdayEl.innerHTML = getWeekdayHeaders()
    .map((w) => `<span>${w}</span>`)
    .join('');

  backdrop.querySelector('[data-action="today"]').textContent = tr('calToday');
  backdrop.querySelector('[data-action="cancel"]').textContent = tr('calPickerCancel');
  backdrop.querySelector('[data-action="confirm"]').textContent = tr('calPickerConfirm');

  renderCalendarGrid(gridEl, {
    year: viewYear,
    month: viewMonth,
    selectedYmd,
    onDaySelect: (meta) => {
      selectedYmd = meta.ymd;
      renderDetail(meta);
      refreshPickerView();
    },
  });

  if (selectedYmd) {
    const parsed = parseYmd(selectedYmd);
    if (parsed) {
      renderDetail(getDayMeta(SolarDay.fromYmd(parsed.year, parsed.month, parsed.day)));
    }
  } else {
    renderDetail(null);
  }
}

function shiftMonth(delta) {
  viewMonth += delta;
  if (viewMonth > 12) {
    viewMonth = 1;
    viewYear += 1;
  } else if (viewMonth < 1) {
    viewMonth = 12;
    viewYear -= 1;
  }
  refreshPickerView();
}

function goToday() {
  const t = todayParts();
  viewYear = t.year;
  viewMonth = t.month;
  selectedYmd = formatYmd(t.year, t.month, t.day);
  refreshPickerView();
}

function confirmPick() {
  if (!selectedYmd || !anchorInput) {
    closePicker();
    return;
  }
  anchorInput.value = selectedYmd;
  anchorInput.dispatchEvent(new Event('input', { bubbles: true }));
  anchorInput.dispatchEvent(new Event('change', { bubbles: true }));
  onPick?.(selectedYmd);
  closePicker();
}

function closePicker() {
  if (backdrop) backdrop.hidden = true;
  anchorInput = null;
  onPick = null;
}

export function openDatePicker(input, { onSelect } = {}) {
  ensureShell();
  anchorInput = input;
  onPick = onSelect ?? null;

  const parsed = parseYmd(input?.value) ?? todayParts();
  viewYear = parsed.year;
  viewMonth = parsed.month;
  selectedYmd = parseYmd(input?.value)
    ? formatYmd(parsed.year, parsed.month, parsed.day)
    : null;

  backdrop.hidden = false;
  refreshPickerView();
  panel?.focus();
}

function refreshPickerButtonLabels() {
  document.querySelectorAll('.date-picker-btn').forEach((btn) => {
    btn.setAttribute('aria-label', tr('calOpenPicker'));
  });
}

function wrapInput(input) {
  if (input.closest('.date-field')) return;
  const wrap = document.createElement('div');
  wrap.className = 'date-field';
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'date-picker-btn';
  btn.setAttribute('aria-label', tr('calOpenPicker'));
  btn.innerHTML = '<span aria-hidden="true">📅</span>';
  btn.addEventListener('click', () => openDatePicker(input));
  wrap.appendChild(btn);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'F4' || (e.altKey && e.key === 'ArrowDown')) {
      e.preventDefault();
      openDatePicker(input);
    }
  });
}

export function initDatePickers(root = document) {
  ensureShell();
  root.querySelectorAll('[data-date-picker]').forEach((input) => {
    if (input.dataset.pickerReady) return;
    input.dataset.pickerReady = 'true';
    wrapInput(input);
  });
  refreshPickerButtonLabels();
}
