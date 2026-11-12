import { parseAmount, roundTo } from './decimal.js';

function parseAnnualRate(rate) {
  if (typeof rate === 'number') {
    if (!Number.isFinite(rate) || rate < 0) return null;
    return rate > 1 ? rate / 100 : rate;
  }
  const s = String(rate ?? '').trim().replace(/％/g, '%');
  if (!s) return null;
  if (s.endsWith('%')) {
    const n = parseFloat(s.slice(0, -1));
    return Number.isFinite(n) && n >= 0 ? n / 100 : null;
  }
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return n > 1 ? n / 100 : n;
}

/** 期数上限：50 年，避免超大输入生成百万行还款计划卡死界面 */
const MAX_MONTHS = 600;

function parseMonths(input) {
  const n = parseInt(String(input).trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > MAX_MONTHS) return null;
  return n;
}

function buildScheduleSummary(schedule) {
  const totalPayment = roundTo(schedule.reduce((s, row) => s + row.payment, 0), 2);
  const totalInterest = roundTo(schedule.reduce((s, row) => s + row.interest, 0), 2);
  return { totalPayment, totalInterest };
}

/** 等额本息 */
export function calcEqualPayment(principalInput, rateInput, monthsInput) {
  const principal = parseAmount(principalInput);
  if (principal == null || principal <= 0) return { ok: false, error: 'invalidPrincipal' };

  const annualRate = parseAnnualRate(rateInput);
  if (annualRate == null) return { ok: false, error: 'invalidRate' };

  const months = parseMonths(monthsInput);
  if (months == null) return { ok: false, error: 'invalidMonths' };

  const monthlyRate = annualRate / 12;
  let monthlyPayment;
  if (monthlyRate === 0) {
    monthlyPayment = roundTo(principal / months, 2);
  } else {
    const pow = (1 + monthlyRate) ** months;
    monthlyPayment = roundTo(principal * monthlyRate * pow / (pow - 1), 2);
  }

  const schedule = [];
  let balance = principal;
  for (let i = 1; i <= months; i += 1) {
    const interest = roundTo(balance * monthlyRate, 2);
    let principalPart = roundTo(monthlyPayment - interest, 2);
    if (i === months) {
      principalPart = roundTo(balance, 2);
    }
    balance = roundTo(balance - principalPart, 2);
    if (balance < 0) balance = 0;
    schedule.push({
      period: i,
      payment: i === months ? roundTo(principalPart + interest, 2) : monthlyPayment,
      principal: principalPart,
      interest,
      balance,
    });
  }

  const { totalPayment, totalInterest } = buildScheduleSummary(schedule);
  return {
    ok: true,
    mode: 'equalPayment',
    principal: roundTo(principal, 2),
    annualRate,
    ratePercent: roundTo(annualRate * 100, 4),
    months,
    monthlyPayment,
    totalPayment,
    totalInterest,
    schedule,
  };
}

/** 等额本金 */
export function calcEqualPrincipal(principalInput, rateInput, monthsInput) {
  const principal = parseAmount(principalInput);
  if (principal == null || principal <= 0) return { ok: false, error: 'invalidPrincipal' };

  const annualRate = parseAnnualRate(rateInput);
  if (annualRate == null) return { ok: false, error: 'invalidRate' };

  const months = parseMonths(monthsInput);
  if (months == null) return { ok: false, error: 'invalidMonths' };

  const monthlyRate = annualRate / 12;
  const monthlyPrincipal = roundTo(principal / months, 2);

  const schedule = [];
  let balance = principal;
  for (let i = 1; i <= months; i += 1) {
    let principalPart = monthlyPrincipal;
    if (i === months) {
      principalPart = roundTo(balance, 2);
    }
    const interest = roundTo(balance * monthlyRate, 2);
    const payment = roundTo(principalPart + interest, 2);
    balance = roundTo(balance - principalPart, 2);
    if (balance < 0) balance = 0;
    schedule.push({
      period: i,
      payment,
      principal: principalPart,
      interest,
      balance,
    });
  }

  const { totalPayment, totalInterest } = buildScheduleSummary(schedule);
  return {
    ok: true,
    mode: 'equalPrincipal',
    principal: roundTo(principal, 2),
    annualRate,
    ratePercent: roundTo(annualRate * 100, 4),
    months,
    firstPayment: schedule[0]?.payment ?? 0,
    lastPayment: schedule[schedule.length - 1]?.payment ?? 0,
    totalPayment,
    totalInterest,
    schedule,
  };
}

export function scheduleToTsv(schedule) {
  const header = '期数\t月供\t本金\t利息\t剩余本金';
  const lines = schedule.map((r) => [
    r.period,
    r.payment.toFixed(2),
    r.principal.toFixed(2),
    r.interest.toFixed(2),
    r.balance.toFixed(2),
  ].join('\t'));
  return [header, ...lines].join('\n');
}
