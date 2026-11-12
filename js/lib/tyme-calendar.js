import { SolarDay, SolarMonth } from 'tyme4ts';
import { getEffectiveHoliday } from './holidays.js';
import { getLocale, tr } from '../i18n.js';

export const WEEK_START = 0;

export function todayParts() {
  const n = new Date();
  return { year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate() };
}

export function formatYmd(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function parseYmd(input) {
  const s = String(input ?? '').trim();
  const m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  try {
    SolarDay.validate(year, month, day);
  } catch {
    return null;
  }
  return { year, month, day };
}

export function getMonthTitle(year, month) {
  const locale = getLocale();
  if (locale === 'en') {
    return new Date(year, month - 1, 1).toLocaleString('en', { month: 'long', year: 'numeric' });
  }
  return SolarMonth.fromYm(year, month).toString();
}

export function getWeekdayHeaders() {
  const locale = getLocale();
  if (locale === 'en') return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return ['日', '一', '二', '三', '四', '五', '六'];
}

export function getDayMeta(solarDay) {
  const y = solarDay.getYear();
  const m = solarDay.getMonth();
  const d = solarDay.getDay();
  const lunar = solarDay.getLunarDay();
  const effective = getEffectiveHoliday(y, m, d);
  const weekIdx = solarDay.getWeek().getIndex();
  const termDay = solarDay.getTermDay();
  const term = termDay.getDayIndex() === 0 ? termDay.getName() : null;
  const festival = solarDay.getFestival()?.getName?.() ?? null;
  const holiday = effective
    ? {
      name: effective.name,
      isWork: effective.isWork,
      custom: effective.custom,
    }
    : null;
  return {
    year: y,
    month: m,
    day: d,
    ymd: formatYmd(y, m, d),
    solarLabel: solarDay.toString(),
    lunarShort: lunar.getName(),
    lunarFull: lunar.toString(),
    weekName: solarDay.getWeek().getName(),
    holiday,
    isWeekend: weekIdx === 0 || weekIdx === 6,
    term,
    festival,
  };
}

export function collectMonthDays(year, month) {
  const solarMonth = SolarMonth.fromYm(year, month);
  const weeks = solarMonth.getWeeks(WEEK_START);
  const cells = [];
  weeks.forEach((week) => {
    week.getDays().forEach((day) => {
      cells.push({
        solarDay: day,
        inMonth: day.getMonth() === month,
        meta: getDayMeta(day),
      });
    });
  });
  return cells;
}

export function cellClassName(meta, { inMonth, selectedYmd, todayYmd }) {
  const cls = ['tyme-cal-cell'];
  if (!inMonth) cls.push('is-other-month');
  if (meta.ymd === todayYmd) cls.push('is-today');
  if (meta.ymd === selectedYmd) cls.push('is-selected');
  if (meta.holiday) {
    cls.push(meta.holiday.isWork ? 'is-adjust-work' : 'is-holiday');
  } else if (meta.isWeekend) {
    cls.push('is-weekend');
  }
  return cls.join(' ');
}

export function renderCalendarGrid(container, {
  year,
  month,
  selectedYmd = null,
  onDaySelect = null,
}) {
  const today = todayParts();
  const todayYmd = formatYmd(today.year, today.month, today.day);
  const cells = collectMonthDays(year, month);

  container.innerHTML = '';
  cells.forEach(({ solarDay, inMonth, meta }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = cellClassName(meta, { inMonth, selectedYmd, todayYmd });
    btn.dataset.ymd = meta.ymd;

    const dayNum = document.createElement('span');
    dayNum.className = 'tyme-cal-day';
    dayNum.textContent = String(meta.day);

    const lunar = document.createElement('span');
    lunar.className = 'tyme-cal-lunar';
    lunar.textContent = meta.lunarShort;

    btn.append(dayNum, lunar);

    if (meta.holiday) {
      const badge = document.createElement('span');
      badge.className = 'tyme-cal-badge';
      badge.textContent = meta.holiday.isWork ? tr('calBadgeWork') : tr('calBadgeRest');
      btn.appendChild(badge);
    }

    if (onDaySelect) {
      btn.addEventListener('click', () => onDaySelect(meta, solarDay));
    }

    container.appendChild(btn);
  });
}
