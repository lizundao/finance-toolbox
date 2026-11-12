import { parseDateInput } from './date.js';

const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];

function yearToChinese(year) {
  return String(year)
    .split('')
    .map((d) => DIGITS[Number(d)])
    .join('');
}

function monthOrDayToChinese(n, suffix) {
  if (n <= 0 || n > 31) return null;
  if (n <= 9) return DIGITS[n] + suffix;
  if (n === 10) return '拾' + suffix;
  if (n < 20) return '壹拾' + DIGITS[n - 10] + suffix;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  let s = DIGITS[tens] + '拾';
  if (ones) s += DIGITS[ones];
  return s + suffix;
}

export { parseDateInput };

/**
 * 支票日期大写
 */
export function dateToCheckUpper(input) {
  const parsed = input instanceof Object && input.year
    ? input
    : parseDateInput(input);
  if (!parsed) return { ok: false, error: 'invalidDate' };

  const monthStr = monthOrDayToChinese(parsed.month, '月');
  const dayStr = monthOrDayToChinese(parsed.day, '日');
  if (!monthStr || !dayStr) return { ok: false, error: 'invalidDate' };

  const text = `${yearToChinese(parsed.year)}年${monthStr}${dayStr}`;
  return { ok: true, text, ...parsed };
}
