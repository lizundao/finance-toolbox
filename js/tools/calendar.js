import { SolarDay } from 'tyme4ts';
import {
  formatYmd,
  getDayMeta,
  getMonthTitle,
  getWeekdayHeaders,
  parseYmd,
  renderCalendarGrid,
  todayParts,
} from '../lib/tyme-calendar.js';
import { getUpcomingHolidays, hasCustomOverrides } from '../lib/holidays.js';
import { tr } from '../i18n.js';

let viewYear = 0;
let viewMonth = 0;
let selectedYmd = null;

function holidayDisplayName(meta) {
  if (!meta.holiday) return '';
  if (meta.holiday.name) return meta.holiday.name;
  return meta.holiday.isWork ? tr('calCustomWorkday') : tr('calCustomRest');
}

function renderDetail(meta) {
  const wrap = document.getElementById('calendarDetailBody');
  if (!wrap) return;
  if (!meta) {
    wrap.innerHTML = `<p class="hint">${tr('calSelectDay')}</p>`;
    return;
  }

  const holidayLine = meta.holiday
    ? `<div class="meta-row"><dt>${tr('calHoliday')}</dt><dd>${holidayDisplayName(meta)} · ${meta.holiday.isWork ? tr('calBadgeWork') : tr('calBadgeRest')}</dd></div>`
    : '';
  const termLine = meta.term
    ? `<div class="meta-row"><dt>${tr('calTerm')}</dt><dd>${meta.term}</dd></div>`
    : '';
  const festivalLine = meta.festival
    ? `<div class="meta-row"><dt>${tr('calFestival')}</dt><dd>${meta.festival}</dd></div>`
    : '';

  wrap.innerHTML = `
    <dl class="meta-table">
      <div class="meta-row"><dt>${tr('calSolar')}</dt><dd class="finance-highlight">${meta.solarLabel}</dd></div>
      <div class="meta-row"><dt>${tr('calLunar')}</dt><dd>${meta.lunarFull}</dd></div>
      <div class="meta-row"><dt>${tr('calWeekday')}</dt><dd>${meta.weekName}</dd></div>
      ${holidayLine}
      ${termLine}
      ${festivalLine}
    </dl>
  `;
}

function formatReminderDays(daysUntil) {
  if (daysUntil <= 0) return tr('calReminderSoon');
  return tr('calReminderDays', daysUntil);
}

function renderReminders() {
  const wrap = document.getElementById('calendarReminderList');
  if (!wrap) return;

  const items = getUpcomingHolidays(5);
  if (!items.length) {
    wrap.innerHTML = `<p class="hint">${tr('calReminderEmpty')}</p>`;
    return;
  }

  wrap.innerHTML = items.map((item) => `
    <button type="button" class="cal-reminder-item" data-ymd="${item.startYmd}">
      <span class="cal-reminder-name">${item.name}</span>
      <span class="cal-reminder-days">${formatReminderDays(item.daysUntil)}</span>
      <span class="cal-reminder-duration">${tr('calReminderOff', item.duration)}</span>
    </button>
  `).join('');

  wrap.querySelectorAll('.cal-reminder-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const parsed = parseYmd(btn.dataset.ymd);
      if (!parsed) return;
      viewYear = parsed.year;
      viewMonth = parsed.month;
      selectedYmd = btn.dataset.ymd;
      renderMonthList();
    });
  });
}

function renderMonthList() {
  const grid = document.getElementById('calendarGrid');
  const title = document.getElementById('calendarTitle');
  const weekdays = document.getElementById('calendarWeekdays');
  if (!grid || !title || !weekdays) return;

  title.textContent = getMonthTitle(viewYear, viewMonth);
  weekdays.innerHTML = getWeekdayHeaders()
    .map((w) => `<span>${w}</span>`)
    .join('');

  renderCalendarGrid(grid, {
    year: viewYear,
    month: viewMonth,
    selectedYmd,
    onDaySelect: (meta) => {
      selectedYmd = meta.ymd;
      renderDetail(meta);
      renderMonthList();
    },
  });

  if (selectedYmd) {
    const parsed = parseYmd(selectedYmd);
    if (parsed) {
      renderDetail(getDayMeta(SolarDay.fromYmd(parsed.year, parsed.month, parsed.day)));
    }
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
  renderMonthList();
}

function goToday() {
  const t = todayParts();
  viewYear = t.year;
  viewMonth = t.month;
  selectedYmd = formatYmd(t.year, t.month, t.day);
  renderMonthList();
}

function updateHolidayLink() {
  const el = document.getElementById('dateHolidayVersion');
  if (!el) return;
  el.textContent = hasCustomOverrides()
    ? tr('dateHolidayVersionCustom')
    : tr('dateHolidayVersionBuiltin');
}

export function initCalendar() {
  const t = todayParts();
  viewYear = t.year;
  viewMonth = t.month;
  selectedYmd = formatYmd(t.year, t.month, t.day);

  document.getElementById('calendarPrev')?.addEventListener('click', () => shiftMonth(-1));
  document.getElementById('calendarNext')?.addEventListener('click', () => shiftMonth(1));
  document.getElementById('calendarToday')?.addEventListener('click', goToday);

  renderMonthList();
  renderReminders();

  document.addEventListener('localechange', () => {
    renderMonthList();
    renderReminders();
  });

  document.addEventListener('holidaychange', () => {
    renderMonthList();
    renderReminders();
    updateHolidayLink();
  });
}
