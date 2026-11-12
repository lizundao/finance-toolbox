import { parseAmount, roundTo, isSafeAmount } from './decimal.js';
import iitConfig from '../../data/iit-brackets.json';

export const IIT_VERSION = iitConfig.version;
export const IIT_BRACKETS = iitConfig.brackets;
export const BASIC_DEDUCTION_MONTHLY = iitConfig.basicDeductionMonthly ?? 5000;

export function taxOnCumulativeTaxable(taxable) {
  const t = Math.max(0, taxable);
  for (const b of IIT_BRACKETS) {
    if (b.max == null || t <= b.max) {
      return roundTo(t * b.rate - b.quickDeduction, 2);
    }
  }
  return 0;
}

function parseMonth(input) {
  const n = parseInt(String(input).trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > 12) return null;
  return n;
}

/**
 * 工资薪金累计预扣法（假定每月收入与扣除相同）
 */
export function calcSalaryIit(opts) {
  const month = parseMonth(opts.month);
  if (month == null) return { ok: false, error: 'invalidMonth' };

  const gross = parseAmount(opts.gross);
  if (gross == null || gross < 0) return { ok: false, error: 'invalidGross' };

  const social = opts.social == null || opts.social === ''
    ? 0
    : parseAmount(opts.social);
  if (social == null || social < 0) return { ok: false, error: 'invalidSocial' };

  const additional = opts.additional == null || opts.additional === ''
    ? 0
    : parseAmount(opts.additional);
  if (additional == null || additional < 0) return { ok: false, error: 'invalidAdditional' };

  const monthlyDeduction = BASIC_DEDUCTION_MONTHLY + social + additional;

  const cumulativeIncome = gross * month;
  const cumulativeDeduction = monthlyDeduction * month;
  const cumulativeTaxable = roundTo(Math.max(0, cumulativeIncome - cumulativeDeduction), 2);
  if (!isSafeAmount(cumulativeIncome) || !isSafeAmount(cumulativeTaxable)) {
    return { ok: false, error: 'invalidGross' };
  }

  const cumulativeTax = taxOnCumulativeTaxable(cumulativeTaxable);

  let prevCumulativeTax = 0;
  if (month > 1) {
    const prevTaxable = roundTo(Math.max(0, gross * (month - 1) - monthlyDeduction * (month - 1)), 2);
    prevCumulativeTax = taxOnCumulativeTaxable(prevTaxable);
  }

  const monthTax = roundTo(Math.max(0, cumulativeTax - prevCumulativeTax), 2);
  const netPay = roundTo(gross - social - monthTax, 2);

  const bracket = IIT_BRACKETS.find((b) => b.max == null || cumulativeTaxable <= b.max);

  return {
    ok: true,
    month,
    gross: roundTo(gross, 2),
    social: roundTo(social, 2),
    additional: roundTo(additional, 2),
    basicDeduction: BASIC_DEDUCTION_MONTHLY,
    cumulativeIncome,
    cumulativeDeduction,
    cumulativeTaxable,
    cumulativeTax,
    monthTax,
    netPay,
    ratePercent: bracket ? roundTo(bracket.rate * 100, 0) : 0,
  };
}
