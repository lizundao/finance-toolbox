import {
  getOverrideMode,
  hasCustomOverrides,
  hasHolidayData,
  HOLIDAY_DATA_RANGE,
  resetHolidayData,
  setDayOverride,
} from '../lib/holidays.js';
import {
  getMonthTitle,
  getWeekdayHeaders,
  renderCalendarGrid,
  todayParts,
} from '../lib/tyme-calendar.js';
import { showToast } from '../common.js';
import { tr } from '../i18n.js';

let editYear = 0;
let editMonth = 0;
let editMode = 'rest';

function renderStatus() {
  const sourceEl = document.getElementById('settingsHolidaySource');
  const statusEl = document.getElementById('settingsHolidayStatus');
  const resetBtn = document.getElementById('settingsHolidayReset');
  if (!sourceEl || !statusEl) return;

  sourceEl.textContent = tr('settingsHolidaySourceBuiltin', HOLIDAY_DATA_RANGE);
  statusEl.textContent = hasCustomOverrides()
    ? tr('settingsHolidayStatusCustom')
    : tr('settingsHolidayStatusDefault');
  if (resetBtn) resetBtn.disabled = !hasCustomOverrides();
}

function renderEditGrid() {
  const grid = document.getElementById('settingsHolidayGrid');
  const title = document.getElementById('settingsHolidayTitle');
  const weekdays = document.getElementById('settingsHolidayWeekdays');
  if (!grid || !title || !weekdays) return;

  // 未收录年份必须显式提示，避免用户以为该月的节假日已完整
  title.textContent = getMonthTitle(editYear, editMonth)
    + (hasHolidayData(editYear) ? '' : ` · ⚠ ${tr('settingsHolidayYearUnavailable')}`);
  weekdays.innerHTML = getWeekdayHeaders()
    .map((w) => `<span>${w}</span>`)
    .join('');

  renderCalendarGrid(grid, {
    year: editYear,
    month: editMonth,
    selectedYmd: null,
    onDaySelect: (meta) => {
      const current = getOverrideMode(meta.ymd);
      let nextMode = editMode;
      if (editMode === 'clear') nextMode = null;
      else if (current === editMode) nextMode = null;
      const r = setDayOverride(meta.ymd, nextMode);
      if (!r.ok) {
        showToast(tr('settingsHolidayErrSave'), { type: 'error' });
        return;
      }
      renderEditGrid();
      renderStatus();
    },
  });

  grid.querySelectorAll('.tyme-cal-cell').forEach((cell) => {
    const ymd = cell.dataset.ymd;
    const mode = getOverrideMode(ymd);
    if (mode === 'rest') cell.classList.add('is-user-rest');
    if (mode === 'work') cell.classList.add('is-user-work');
  });
}

function shiftEditMonth(delta) {
  editMonth += delta;
  if (editMonth > 12) {
    editMonth = 1;
    editYear += 1;
  } else if (editMonth < 1) {
    editMonth = 12;
    editYear -= 1;
  }
  renderEditGrid();
}

function setEditMode(mode) {
  editMode = mode;
  document.querySelectorAll('[data-holiday-mode]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.holidayMode === mode);
  });
}

export function initSettings() {
  const t = todayParts();
  editYear = t.year;
  editMonth = t.month;

  document.getElementById('settingsHolidayPrev')?.addEventListener('click', () => shiftEditMonth(-1));
  document.getElementById('settingsHolidayNext')?.addEventListener('click', () => shiftEditMonth(1));
  document.getElementById('settingsHolidayToday')?.addEventListener('click', () => {
    const now = todayParts();
    editYear = now.year;
    editMonth = now.month;
    renderEditGrid();
  });

  document.querySelectorAll('[data-holiday-mode]').forEach((btn) => {
    btn.addEventListener('click', () => setEditMode(btn.dataset.holidayMode));
  });

  document.getElementById('settingsHolidayReset')?.addEventListener('click', () => {
    resetHolidayData();
    showToast(tr('settingsHolidayResetDone'), { type: 'info' });
    renderEditGrid();
    renderStatus();
  });

  setEditMode('rest');
  renderStatus();
  renderEditGrid();

  document.addEventListener('localechange', () => {
    renderStatus();
    renderEditGrid();
  });

  document.addEventListener('holidaychange', () => {
    renderEditGrid();
    renderStatus();
  });
}
