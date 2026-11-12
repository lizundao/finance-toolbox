import { calcEqualPayment, calcEqualPrincipal, scheduleToTsv } from '../lib/loan.js';
import { copyText } from '../common.js';
import { tr } from '../i18n.js';

function mapError(code) {
  const keys = {
    invalidPrincipal: 'errInvalidAmount',
    invalidRate: 'errInvalidRate',
    invalidMonths: 'errInvalidMonths',
  };
  return tr(keys[code] ?? 'errUnknown');
}

let lastResult = null;

function getMode() {
  return document.querySelector('[data-loan-mode].active')?.dataset.loanMode ?? 'payment';
}

function renderScheduleTable(schedule) {
  const tbody = document.querySelector('#loanScheduleTable tbody');
  if (!tbody) return;
  tbody.innerHTML = schedule.map((r) => `
    <tr>
      <td>${r.period}</td>
      <td>${r.payment.toFixed(2)}</td>
      <td>${r.principal.toFixed(2)}</td>
      <td>${r.interest.toFixed(2)}</td>
      <td>${r.balance.toFixed(2)}</td>
    </tr>
  `).join('');
}

function renderResult(r) {
  const summary = document.getElementById('loanSummaryRows');
  const errorEl = document.getElementById('loanError');
  const scheduleCard = document.getElementById('loanScheduleCard');
  if (!r.ok) {
    lastResult = null;
    if (summary) summary.innerHTML = '';
    if (scheduleCard) scheduleCard.hidden = true;
    errorEl.textContent = mapError(r.error);
    errorEl.hidden = false;
    return;
  }
  lastResult = r;
  errorEl.hidden = true;
  if (scheduleCard) scheduleCard.hidden = false;

  const modeLabel = r.mode === 'equalPrincipal' ? tr('loanModePrincipal') : tr('loanModePayment');
  const paymentLine = r.mode === 'equalPrincipal'
    ? `<div class="meta-row"><dt>${tr('loanFirstLast')}</dt><dd>${r.firstPayment.toFixed(2)} / ${r.lastPayment.toFixed(2)}</dd></div>`
    : `<div class="meta-row"><dt>${tr('loanMonthly')}</dt><dd class="finance-highlight">${r.monthlyPayment.toFixed(2)}</dd></div>`;

  summary.innerHTML = `
    <div class="meta-row"><dt>${tr('loanMode')}</dt><dd>${modeLabel}</dd></div>
    <div class="meta-row"><dt>${tr('loanPrincipal')}</dt><dd>${r.principal.toFixed(2)}</dd></div>
    <div class="meta-row"><dt>${tr('loanRate')}</dt><dd>${r.ratePercent}%</dd></div>
    <div class="meta-row"><dt>${tr('loanMonths')}</dt><dd>${r.months}</dd></div>
    ${paymentLine}
    <div class="meta-row"><dt>${tr('loanTotalInterest')}</dt><dd class="finance-highlight">${r.totalInterest.toFixed(2)}</dd></div>
    <div class="meta-row"><dt>${tr('loanTotalPayment')}</dt><dd>${r.totalPayment.toFixed(2)}</dd></div>
  `;
  renderScheduleTable(r.schedule);
}

export function initLoan() {
  document.querySelectorAll('[data-loan-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-loan-mode]').forEach((b) => {
        b.classList.toggle('active', b === btn);
      });
    });
  });

  document.getElementById('loanCalc')?.addEventListener('click', () => {
    const principal = document.getElementById('loanPrincipal').value;
    const rate = document.getElementById('loanRate').value;
    const months = document.getElementById('loanMonths').value;
    const mode = getMode();
    renderResult(mode === 'principal'
      ? calcEqualPrincipal(principal, rate, months)
      : calcEqualPayment(principal, rate, months));
  });

  document.getElementById('loanCopyTsv')?.addEventListener('click', () => {
    if (!lastResult?.schedule) return;
    copyText(scheduleToTsv(lastResult.schedule));
  });

  document.getElementById('loanClear')?.addEventListener('click', () => {
    ['loanPrincipal', 'loanRate', 'loanMonths'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('loanSummaryRows').innerHTML = '';
    document.getElementById('loanError').hidden = true;
    document.getElementById('loanScheduleCard').hidden = true;
    lastResult = null;
  });

  document.addEventListener('localechange', () => {
    if (lastResult) renderResult(lastResult);
  });
}
