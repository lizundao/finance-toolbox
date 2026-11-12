import { parseAmount, roundTo } from './decimal.js';

/**
 * 千分位格式化
 */
export function formatThousands(input, { digits = 2, keepDigits = true } = {}) {
  const n = typeof input === 'number' ? input : parseAmount(input);
  if (n == null) return { ok: false, error: '请输入有效数字' };

  const negative = n < 0;
  const abs = Math.abs(n);
  const fixed = keepDigits ? roundTo(abs, digits).toFixed(digits) : String(abs);
  const [intPart, decPart] = fixed.split('.');
  const withComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const text = decPart ? `${withComma}.${decPart}` : withComma;
  return { ok: true, text: negative ? '-' + text : text, amount: n };
}

/**
 * 去除千分位
 */
export function stripThousands(input) {
  const s = String(input).trim().replace(/,/g, '').replace(/，/g, '');
  if (!s) return { ok: false, error: '请输入内容' };
  const n = parseAmount(s);
  if (n == null) return { ok: false, error: '无法解析为数字' };
  return { ok: true, text: String(n), amount: n };
}

/** 批量：每行一个数字 */
export function batchFormatLines(text, formatter) {
  const lines = String(text).split(/\r?\n/);
  if (lines.length > 5000) {
    return [{ line: 0, input: '', output: '', error: '行数过多（上限 5000 行）' }];
  }
  const results = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      results.push({ line: i + 1, input: '', output: '', error: null });
      continue;
    }
    const r = formatter(line);
    results.push({
      line: i + 1,
      input: line,
      output: r.ok ? r.text : '',
      error: r.ok ? null : r.error,
    });
  }
  return results;
}
