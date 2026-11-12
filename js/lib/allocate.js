import { parseAmount, roundTo } from './decimal.js';

function parseWeight(line) {
  const s = String(line).trim();
  if (!s) return null;
  const n = parseFloat(s.replace(/,/g, ''));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** 比例分摊，最后一项吸收尾差 */
export function calcProportional(totalInput, linesInput) {
  const total = parseAmount(totalInput);
  if (total == null) return { ok: false, error: 'invalidTotal' };

  const lines = String(linesInput ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { ok: false, error: 'emptyLines' };
  if (lines.length > 5000) return { ok: false, error: 'tooManyLines' };

  const rows = [];
  let weightSum = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const weight = parseWeight(lines[i]);
    if (weight == null) {
      rows.push({ line: i + 1, input: lines[i], ok: false, error: 'invalidWeight' });
      continue;
    }
    rows.push({ line: i + 1, input: lines[i], ok: true, weight });
    weightSum += weight;
  }

  const valid = rows.filter((r) => r.ok);
  if (!valid.length) return { ok: false, error: 'invalidWeight' };
  if (!Number.isFinite(weightSum) || weightSum <= 0) {
    return { ok: false, error: 'zeroWeightSum' };
  }

  let allocated = 0;
  for (let i = 0; i < valid.length; i += 1) {
    const row = valid[i];
    if (i === valid.length - 1) {
      row.share = roundTo(total - allocated, 2);
    } else {
      row.share = roundTo(total * row.weight / weightSum, 2);
      allocated = roundTo(allocated + row.share, 2);
    }
    row.ratio = roundTo(row.weight / weightSum * 100, 4);
  }

  const sumShares = roundTo(valid.reduce((s, r) => s + r.share, 0), 2);

  return {
    ok: true,
    total: roundTo(total, 2),
    weightSum: roundTo(weightSum, 4),
    sumShares,
    rows: valid,
  };
}

export function allocateToTsv(result) {
  if (!result.ok) return '';
  const header = '行\t权重\t比例\t分摊金额';
  const lines = result.rows.map((r) => [
    r.line,
    r.weight,
    `${r.ratio}%`,
    r.share.toFixed(2),
  ].join('\t'));
  return [header, ...lines, '', `合计\t${result.weightSum}\t100%\t${result.sumShares.toFixed(2)}`].join('\n');
}
