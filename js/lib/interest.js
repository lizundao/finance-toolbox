import { parseDateInput, diffNaturalDays } from './date.js';
import { parseAmount, roundTo, isSafeAmount } from './decimal.js';

/**
 * 利息计算
 */
export function calcInterest(opts) {
  const principal = typeof opts.principal === 'number'
    ? opts.principal
    : parseAmount(opts.principal);
  if (principal == null || principal < 0 || !isSafeAmount(principal)) {
    return { ok: false, error: 'invalidPrincipal' };
  }

  let rate = opts.rate;
  if (typeof rate === 'string') {
    const s = rate.trim().replace(/％/g, '%');
    if (s.endsWith('%')) rate = parseFloat(s.slice(0, -1)) / 100;
    else {
      rate = parseFloat(s);
      if (rate > 1) rate /= 100;
    }
  }
  if (!Number.isFinite(rate) || rate < 0) return { ok: false, error: 'invalidRate' };

  const basis = opts.basis === 360 ? 360 : 365;
  let days = opts.days;

  if ((days == null || days === '') && opts.startDate && opts.endDate) {
    const d = diffNaturalDays(opts.startDate, opts.endDate);
    if (!d.ok) return { ok: false, error: 'invalidDate' };
    days = Math.abs(d.diff);
  }

  days = Number(days);
  if (!Number.isFinite(days) || days < 0) return { ok: false, error: 'invalidDays' };

  const interest = roundTo(principal * rate * days / basis, 2);
  const total = roundTo(principal + interest, 2);

  return {
    ok: true,
    principal: roundTo(principal, 2),
    rate,
    ratePercent: roundTo(rate * 100, 4),
    days,
    basis,
    interest,
    total,
  };
}
