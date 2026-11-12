import { LegalHoliday, SolarDay } from 'tyme4ts';
import data2026 from '../../data/holidays-2026.json';
import data2027 from '../../data/holidays-2027.json';

/**
 * 节假日数据源
 * - 近期年度：本地 JSON（data/holidays-YYYY.json），可按国务院通知自行维护
 * - 历史年度：tyme4ts 内置数据（2001–2025），仅作历史查询兜底
 * - 用户逐日覆盖：localStorage，优先级最高
 *
 * 未收录的年度不会静默当作「周一至周五」：hasHolidayData() 会返回 false，
 * 由日期计算模块在界面上明确提示「该年度数据未收录，工作日仅供参考」。
 */
const LOCAL_DATASETS = [data2026, data2027];
const LEGACY_MIN_YEAR = 2001;
const LEGACY_MAX_YEAR = 2025;

const LOCAL_YEARS = new Set(LOCAL_DATASETS.map((d) => d.year));
const LOCAL_REST = new Map(); // ymd -> 节假日名称
const LOCAL_WORK = new Set();
const HOLIDAY_GROUPS = []; // { name, startYmd, duration }

const OVERRIDE_KEY = 'finance-toolbox-holiday-overrides';
const LEGACY_DATA_KEY = 'finance-toolbox-holiday-data';

function formatYmd(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseYmd(input) {
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

function todayParts() {
  const n = new Date();
  return { year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate() };
}

/** 把 [from, to] 闭区间展开为 YYYY-MM-DD 列表 */
function expandRange(from, to) {
  const a = parseYmd(from);
  const b = parseYmd(to);
  if (!a || !b) return [];
  const start = new Date(a.year, a.month - 1, a.day);
  const end = new Date(b.year, b.month - 1, b.day);
  const out = [];
  const cur = new Date(start);
  // 防御异常配置导致的超长区间
  let guard = 0;
  while (cur <= end && guard < 400) {
    out.push(formatYmd(cur.getFullYear(), cur.getMonth() + 1, cur.getDate()));
    cur.setDate(cur.getDate() + 1);
    guard += 1;
  }
  return out;
}

for (const ds of LOCAL_DATASETS) {
  for (const group of ds.holidays ?? []) {
    const days = expandRange(group.from, group.to);
    if (!days.length) continue;
    for (const ymd of days) LOCAL_REST.set(ymd, group.name);
    HOLIDAY_GROUPS.push({ name: group.name, startYmd: days[0], duration: days.length });
  }
  for (const ymd of ds.workdays ?? []) LOCAL_WORK.add(ymd);
}

HOLIDAY_GROUPS.sort((a, b) => a.startYmd.localeCompare(b.startYmd));

/** 已收录的年份范围（供设置页展示） */
export const HOLIDAY_DATA_RANGE = `${LEGACY_MIN_YEAR}–${Math.max(...LOCAL_YEARS)}`;
/** 本地配置的年度（供文档与界面说明） */
export const LOCAL_HOLIDAY_YEARS = [...LOCAL_YEARS].sort((a, b) => a - b);

let overrideRest = new Set();
let overrideWork = new Set();

function loadOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      overrideRest = new Set(Array.isArray(data.rest) ? data.rest : []);
      overrideWork = new Set(Array.isArray(data.work) ? data.work : []);
      return;
    }
  } catch {
    /* ignore */
  }
  overrideRest = new Set();
  overrideWork = new Set();
}

function persistOverrides() {
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify({
    rest: [...overrideRest],
    work: [...overrideWork],
  }));
}

loadOverrides();

export function hasCustomOverrides() {
  return overrideRest.size > 0 || overrideWork.size > 0;
}

export function isCustomHolidayData() {
  return hasCustomOverrides();
}

/** 该年度是否有节假日数据（本地配置或历史库） */
export function hasHolidayData(year) {
  return LOCAL_YEARS.has(year) || (year >= LEGACY_MIN_YEAR && year <= LEGACY_MAX_YEAR);
}

/** 界面数据来源标签；当前年份未收录时返回 unavailable */
export function getHolidayLabel() {
  if (hasCustomOverrides()) return 'custom';
  return hasHolidayData(todayParts().year) ? 'builtin' : 'unavailable';
}

export function getOverrideMode(ymd) {
  if (overrideRest.has(ymd)) return 'rest';
  if (overrideWork.has(ymd)) return 'work';
  return null;
}

export function getEffectiveHoliday(year, month, day) {
  const ymd = formatYmd(year, month, day);

  if (overrideWork.has(ymd)) return { name: null, isWork: true, custom: true };
  if (overrideRest.has(ymd)) return { name: null, isWork: false, custom: true };

  if (LOCAL_WORK.has(ymd)) return { name: '调休上班', isWork: true, custom: false };
  if (LOCAL_REST.has(ymd)) return { name: LOCAL_REST.get(ymd), isWork: false, custom: false };

  // 本地已收录的年度：未列出的日期即普通工作日 / 周末，不再回退历史库
  if (LOCAL_YEARS.has(year)) return null;

  if (year >= LEGACY_MIN_YEAR && year <= LEGACY_MAX_YEAR) {
    const legal = LegalHoliday.fromYmd(year, month, day);
    if (!legal) return null;
    return { name: legal.getName(), isWork: legal.isWork(), custom: false };
  }

  // 未收录年度：返回 null，由 isWorkday 按周一至周五估算，
  // 并由 hasHolidayData() 在界面上明确提示，避免用户误以为结果已含节假日
  return null;
}

export function isWorkday(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const h = getEffectiveHoliday(y, m, d);
  if (h) return h.isWork;
  const dow = date.getDay();
  return dow >= 1 && dow <= 5;
}

export function getDayHolidayInfo(year, month, day) {
  const h = getEffectiveHoliday(year, month, day);
  if (!h) return null;
  return { name: h.name, isWork: h.isWork, custom: h.custom };
}

export function setDayOverride(ymd, mode) {
  if (!parseYmd(ymd)) return { ok: false, error: 'invalidDate' };

  overrideRest.delete(ymd);
  overrideWork.delete(ymd);

  if (mode === 'rest') overrideRest.add(ymd);
  else if (mode === 'work') overrideWork.add(ymd);

  try {
    persistOverrides();
  } catch {
    return { ok: false, error: 'saveFailed' };
  }
  document.dispatchEvent(new CustomEvent('holidaychange'));
  return { ok: true };
}

export function getOverrides() {
  return { rest: [...overrideRest], work: [...overrideWork] };
}

export function resetHolidayData() {
  overrideRest = new Set();
  overrideWork = new Set();
  try {
    localStorage.removeItem(OVERRIDE_KEY);
    localStorage.removeItem(LEGACY_DATA_KEY);
  } catch {
    /* ignore */
  }
  document.dispatchEvent(new CustomEvent('holidaychange'));
  return { ok: true };
}

/** 未来假期提醒：取自本地配置，避免依赖已停止更新的内置库 */
export function getUpcomingHolidays(limit = 5) {
  const t = todayParts();
  const todayYmd = formatYmd(t.year, t.month, t.day);
  const today = SolarDay.fromYmd(t.year, t.month, t.day);

  return HOLIDAY_GROUPS
    .filter((g) => g.startYmd > todayYmd)
    .slice(0, limit)
    .map((g) => {
      const [y, m, d] = g.startYmd.split('-').map(Number);
      const day = SolarDay.fromYmd(y, m, d);
      return {
        name: g.name,
        daysUntil: Math.max(0, day.subtract(today) - 1),
        duration: g.duration,
        startYmd: g.startYmd,
      };
    });
}
