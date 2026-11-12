import { parseAmount, roundTo } from './decimal.js';

/** 折旧年限上限：100 年（1200 期明细），避免超大输入长时间阻塞界面 */
const MAX_YEARS = 100;

function parsePositiveInt(input) {
  const n = parseInt(String(input).trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > MAX_YEARS) return null;
  return n;
}

/** 直线折旧法 */
export function calcStraightLine(opts) {
  const cost = parseAmount(opts.cost);
  if (cost == null || cost <= 0) return { ok: false, error: 'invalidCost' };

  const salvage = opts.salvage == null || opts.salvage === ''
    ? 0
    : parseAmount(opts.salvage);
  if (salvage == null || salvage < 0) return { ok: false, error: 'invalidSalvage' };
  if (salvage >= cost) return { ok: false, error: 'salvageTooHigh' };

  const years = parsePositiveInt(opts.years);
  if (years == null) return { ok: false, error: 'invalidYears' };

  const depreciable = roundTo(cost - salvage, 2);
  const annual = roundTo(depreciable / years, 2);
  const monthly = roundTo(depreciable / (years * 12), 2);

  const schedule = [];
  let accumulated = 0;
  for (let m = 1; m <= years * 12; m += 1) {
    let amount = monthly;
    if (m === years * 12) {
      amount = roundTo(depreciable - accumulated, 2);
    }
    accumulated = roundTo(accumulated + amount, 2);
    schedule.push({
      period: m,
      year: Math.ceil(m / 12),
      month: ((m - 1) % 12) + 1,
      amount,
      accumulated,
      bookValue: roundTo(cost - accumulated, 2),
    });
  }

  return {
    ok: true,
    cost: roundTo(cost, 2),
    salvage: roundTo(salvage, 2),
    years,
    depreciable,
    annual,
    monthly,
    schedule,
  };
}
