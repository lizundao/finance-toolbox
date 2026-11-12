import {
  getHolidayLabel,
  hasHolidayData,
  isWorkday as isHolidayWorkday,
} from './holidays.js';

export { getHolidayLabel };

/** 日期跨度上限（约 100 年），避免超大区间长时间阻塞界面 */
const MAX_SPAN_DAYS = 36500;
/** 单次账期天数上限 */
const MAX_DUE_DAYS = 36500;

/**
 * 解析日期：YYYY-MM-DD、YYYY/MM/DD、YYYY.MM.DD、YYYY年M月D日
 */
export function parseDateInput(input) {
  const s = String(input).trim();
  const m = s.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return { year: y, month: mo, day: d, date: dt };
}

export function formatDate(parsed) {
  const p = parsed.date ? parsed : parseDateInput(parsed);
  if (!p) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function isWorkday(date) {
  return isHolidayWorkday(date);
}

/** 区间内是否所有年份都有节假日数据；用于避免静默按周一至周五估算 */
function rangeHasHolidayData(from, to) {
  const y1 = Math.min(from.getFullYear(), to.getFullYear());
  const y2 = Math.max(from.getFullYear(), to.getFullYear());
  for (let y = y1; y <= y2; y += 1) {
    if (!hasHolidayData(y)) return false;
  }
  return true;
}

/** 自然日相差（后者减前者，可为负） */
export function diffNaturalDays(startInput, endInput) {
  const start = parseDateInput(startInput);
  const end = parseDateInput(endInput);
  if (!start || !end) return { ok: false, error: 'invalidDate' };

  const ms = end.date.getTime() - start.date.getTime();
  const diff = Math.round(ms / 86400000);
  const inclusive = Math.abs(diff) + 1;

  return {
    ok: true,
    start: formatDate(start),
    end: formatDate(end),
    diff,
    inclusive,
  };
}

/** 统计两日期之间的工作日数（不含起始日，含结束日；若结束早于起始则交换） */
export function diffWorkDays(startInput, endInput) {
  const start = parseDateInput(startInput);
  const end = parseDateInput(endInput);
  if (!start || !end) return { ok: false, error: 'invalidDate' };

  let from = new Date(start.date);
  let to = new Date(end.date);
  if (from > to) [from, to] = [to, from];

  if (Math.round((to - from) / 86400000) > MAX_SPAN_DAYS) {
    return { ok: false, error: 'rangeTooLarge' };
  }

  let count = 0;
  const cur = new Date(from);
  cur.setDate(cur.getDate() + 1);
  while (cur <= to) {
    if (isWorkday(cur)) count += 1;
    cur.setDate(cur.getDate() + 1);
  }

  return {
    ok: true,
    start: formatDate(start),
    end: formatDate(end),
    workdays: count,
    holidayDataAvailable: rangeHasHolidayData(from, to),
  };
}

export function calcDateDiff(startInput, endInput) {
  const natural = diffNaturalDays(startInput, endInput);
  if (!natural.ok) return natural;
  const work = diffWorkDays(startInput, endInput);
  if (!work.ok) return work;
  return {
    ok: true,
    start: natural.start,
    end: natural.end,
    naturalDays: natural.diff,
    inclusiveDays: natural.inclusive,
    workdays: work.workdays,
    holidayDataAvailable: work.holidayDataAvailable,
  };
}

/** 账期：起始日 + N 天 → 到期日 */
export function calcDueDate(startInput, daysInput, mode = 'natural') {
  const start = parseDateInput(startInput);
  if (!start) return { ok: false, error: 'invalidDate' };

  const days = parseInt(String(daysInput).trim(), 10);
  if (!Number.isFinite(days) || days < 0 || days > MAX_DUE_DAYS) {
    return { ok: false, error: 'invalidDays' };
  }

  const cur = new Date(start.date);

  if (mode === 'work') {
    let added = 0;
    while (added < days) {
      cur.setDate(cur.getDate() + 1);
      if (isWorkday(cur)) added += 1;
    }
  } else {
    cur.setDate(cur.getDate() + days);
  }

  const due = {
    year: cur.getFullYear(),
    month: cur.getMonth() + 1,
    day: cur.getDate(),
    date: cur,
  };

  return {
    ok: true,
    start: formatDate(start),
    days,
    mode,
    due: formatDate(due),
    holidayDataAvailable: mode === 'work'
      ? rangeHasHolidayData(start.date, cur)
      : true,
  };
}
