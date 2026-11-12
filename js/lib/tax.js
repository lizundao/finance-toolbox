import { parseAmount, roundTo, toFixedAmount, isSafeAmount } from './decimal.js';
import taxConfig from '../../data/tax-rates.json';

export const TAX_RATES = taxConfig.rates;
export const TAX_VERSION = taxConfig.version;

/** 解析税率：13 / 13% / 0.13 */
export function parseRate(input) {
  if (input == null || input === '') return null;
  let s = String(input).trim().replace(/％/g, '%');
  if (s.endsWith('%')) {
    const n = parseFloat(s.slice(0, -1));
    // 税率上限 100%，避免误输入 1000 之类的数值算出无效结果
    if (!Number.isFinite(n) || n < 0 || n > 100) return null;
    return roundTo(n / 100, 6);
  }
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  if (n > 1) return roundTo(n / 100, 6);
  return roundTo(n, 6);
}

function fmt(n) {
  return toFixedAmount(n, 2);
}

/**
 * @param {'inclusive'|'exclusive'} mode - 输入金额为含税或不含税
 */
export function calcTax(amountInput, rateInput, mode = 'inclusive') {
  const amount = typeof amountInput === 'number' ? amountInput : parseAmount(amountInput);
  if (amount == null || !isSafeAmount(amount)) return { ok: false, error: '请输入有效金额' };

  const rate = typeof rateInput === 'number' ? rateInput : parseRate(rateInput);
  if (rate == null || !Number.isFinite(rate) || rate < 0 || rate > 1) {
    return { ok: false, error: '请输入有效税率（如 13 或 13%）' };
  }

  let excl;
  let incl;
  let tax;

  if (mode === 'inclusive') {
    incl = roundTo(amount, 2);
    excl = roundTo(incl / (1 + rate), 2);
    tax = roundTo(incl - excl, 2);
  } else {
    excl = roundTo(amount, 2);
    tax = roundTo(excl * rate, 2);
    incl = roundTo(excl + tax, 2);
  }

  const ratePercent = roundTo(rate * 100, 4);
  const rateText = Number.isInteger(ratePercent) ? `${ratePercent}%` : `${ratePercent}%`;

  return {
    ok: true,
    mode,
    rate,
    rateText,
    excl,
    incl,
    tax,
    text: `不含税 ${fmt(excl)} · 税额 ${fmt(tax)} · 含税 ${fmt(incl)}`,
    lines: {
      excl: fmt(excl),
      tax: fmt(tax),
      incl: fmt(incl),
    },
  };
}

/**
 * 批量价税：每行「金额」或「金额,税率」或「金额\t税率」
 */
export function batchCalcTax(text, { defaultRate, mode = 'inclusive' } = {}) {
  const lines = String(text).split(/\r?\n/);
  if (lines.length > 5000) {
    return [{ line: 0, input: '', error: '行数过多（上限 5000 行）' }];
  }
  const results = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;

    const parts = raw.split(/[\t,，;；]/).map((p) => p.trim());
    const amountStr = parts[0];
    const rateStr = parts[1] ?? defaultRate;
    const r = calcTax(amountStr, rateStr, mode);

    results.push({
      line: i + 1,
      input: raw,
      ...(r.ok
        ? { excl: r.lines.excl, tax: r.lines.tax, incl: r.lines.incl, rateText: r.rateText }
        : { error: r.error }),
    });
  }

  return results;
}

/** TSV 复制用 */
export function batchToTsv(rows, mode) {
  const header = mode === 'inclusive'
    ? '输入\t不含税\t税额\t含税\t税率'
    : '输入\t不含税\t税额\t含税\t税率';
  const body = rows
    .map((r) => {
      if (r.error) return `${r.input}\t${r.error}`;
      return `${r.input}\t${r.excl}\t${r.tax}\t${r.incl}\t${r.rateText}`;
    })
    .join('\n');
  return `${header}\n${body}`;
}
