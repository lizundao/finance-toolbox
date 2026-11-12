import { calcStraightLine } from '../lib/depreciation.js';
import { copyText } from '../common.js';
import { tr } from '../i18n.js';

function mapError(code) {
  const keys = {
    invalidCost: 'errInvalidAmount',
    invalidSalvage: 'deprErrSalvage',
    invalidYears: 'deprErrYears',
    salvageTooHigh: 'deprErrSalvageHigh',
  };
  return tr(keys[code] ?? 'errUnknown');
}

let lastResult = null;

function renderResult(r) {
  const wrap = document.getElementById('deprResultRows');
  const errorEl = document.getElementById('deprError');
  const scheduleCard = document.getElementById('deprScheduleCard');
  if (!r.ok) {
    lastResult = null;
    wrap.innerHTML = '';
    if (scheduleCard) scheduleCard.hidden = true;
    errorEl.textContent = mapError(r.error);
    errorEl.hidden = false;
    return;
  }
  lastResult = r;
  errorEl.hidden = true;
  if (scheduleCard) scheduleCard.hidden = false;

  wrap.innerHTML = `
    <div class="meta-row"><dt>${tr('deprCost')}</dt><dd>${r.cost.toFixed(2)}</dd></div>
    <div class="meta-row"><dt>${tr('deprSalvage')}</dt><dd>${r.salvage.toFixed(2)}</dd></div>
    <div class="meta-row"><dt>${tr('deprYears')}</dt><dd>${r.years}</dd></div>
    <div class="meta-row"><dt>${tr('deprDepreciable')}</dt><dd>${r.depreciable.toFixed(2)}</dd></div>
    <div class="meta-row"><dt>${tr('deprAnnual')}</dt><dd class="finance-highlight">${r.annual.toFixed(2)}</dd></div>
    <div class="meta-row"><dt>${tr('deprMonthly')}</dt><dd class="finance-highlight">${r.monthly.toFixed(2)}</dd></div>
  `;

  const tbody = document.querySelector('#deprScheduleTable tbody');
  if (tbody) {
    tbody.innerHTML = r.schedule.map((row) => `
      <tr>
        <td>${row.period}</td>
        <td>${row.year}</td>
        <td>${row.month}</td>
        <td>${row.amount.toFixed(2)}</td>
        <td>${row.accumulated.toFixed(2)}</td>
        <td>${row.bookValue.toFixed(2)}</td>
      </tr>
    `).join('');
  }
}

export function initDepreciation() {
  document.getElementById('deprCalc')?.addEventListener('click', () => {
    renderResult(calcStraightLine({
      cost: document.getElementById('deprCost').value,
      salvage: document.getElementById('deprSalvage').value,
      years: document.getElementById('deprYears').value,
    }));
  });

  document.getElementById('deprCopy')?.addEventListener('click', () => {
    if (!lastResult) return;
    copyText(tr('deprCopyText', lastResult.monthly.toFixed(2), lastResult.annual.toFixed(2)));
  });

  document.getElementById('deprClear')?.addEventListener('click', () => {
    ['deprCost', 'deprSalvage', 'deprYears'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('deprResultRows').innerHTML = '';
    document.getElementById('deprError').hidden = true;
    document.getElementById('deprScheduleCard').hidden = true;
    lastResult = null;
  });

  document.addEventListener('localechange', () => {
    if (lastResult) renderResult(lastResult);
  });
}
