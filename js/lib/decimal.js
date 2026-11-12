/**
 * 金额可精确计算的上限。
 * JS 安全整数为 2^53-1，金额需保留 2 位小数，故整数部分不得超过 MAX_SAFE_INTEGER / 100。
 * 超过后整数与小数都会失真（例如 90071992547409.93 会被读成 ...94）。
 */
export const MAX_SAFE_AMOUNT = Math.floor(Number.MAX_SAFE_INTEGER / 100); // 90,071,992,547,409

/** 是否在精确计算范围内 */
export function isSafeAmount(n) {
  return Number.isFinite(n) && Math.abs(n) <= MAX_SAFE_AMOUNT;
}

/** 解析金额字符串，支持千分位、括号负数 */
export function parseAmount(input) {
  if (input == null) return null;
  let s = String(input).trim();
  if (!s) return null;

  let negative = false;
  if (/^[-−－]/.test(s)) {
    negative = true;
    s = s.slice(1).trim();
  } else if (/^[（(].*[）)]$/.test(s)) {
    negative = true;
    s = s.slice(1, -1).trim();
  }

  s = s.replace(/,/g, '').replace(/，/g, '').replace(/\s/g, '');
  if (!s) return null;
  if (!/^\d+(\.\d+)?$/.test(s)) return null;

  const num = Number(s);
  if (!isSafeAmount(num)) return null; // 超范围直接拒绝，避免静默算错钱
  return negative ? -num : num;
}

/**
 * 定点四舍五入，规避二进制浮点误差。
 * 直接 n * 100 时 1.005 * 100 === 100.49999999999999，会错误地舍成 1.00。
 * 改用十进制指数移位 Number(`${n}e${digits}`) 精确放大，再取整还原。
 * 负数按「绝对值四舍五入后带回符号」，符合财务习惯（-1.005 → -1.01）。
 */
export function roundTo(n, digits = 2) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return NaN;
  const f = 10 ** digits;
  const sign = n < 0 ? -1 : 1;
  const magnitude = Math.abs(n);
  const shifted = Number(`${magnitude}e${digits}`);
  const scaled = Number.isFinite(shifted)
    ? Math.round(shifted)
    : Math.round(magnitude * f); // 科学计数法字符串等极少数情况降级
  return sign * scaled / f;
}

/** 格式化为固定小数位字符串（无千分位） */
export function toFixedAmount(n, digits = 2) {
  return roundTo(n, digits).toFixed(digits);
}
