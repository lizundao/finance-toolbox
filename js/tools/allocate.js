import { allocateToTsv, calcProportional } from '../lib/allocate.js';
import { copyText } from '../common.js';
import { tr } from '../i18n.js';

function mapError(code) {
  const keys = {
    invalidTotal: 'errInvalidAmount',
    emptyLines: 'allocErrEmpty',
    invalidWeight: 'allocErrWeight',
    zeroWeightSum: 'allocErrZeroSum',
    tooManyLines: 'allocErrTooMany',
  };
  return tr(keys[code] ?? 'errUnknown');
}

let lastResult = null;

function renderResult(r) {
  const tbody = document.querySelector('#allocResultTable tbody');
  const errorEl = document.getElementById('allocError');
  const card = document.getElementById('allocResultCard');
  if (!r.ok) {
    lastResult = null;
    if (tbody) tbody.innerHTML = '';
    if (card) card.hidden = true;
    errorEl.textContent = mapError(r.error);
    errorEl.hidden = false;
    return;
  }
  lastResult = r;
  errorEl.hidden = true;
  if (card) card.hidden = false;

  tbody.innerHTML = r.rows.map((row) => `
    <tr>
      <td>${row.line}</td>
      <td>${row.input}</td>
      <td>${row.weight}</td>
      <td>${row.ratio}%</td>
      <td class="finance-highlight">${row.share.toFixed(2)}</td>
    </tr>
  `).join('') + `
    <tr class="batch-summary">
      <td colspan="2">${tr('allocTotal')}</td>
      <td>${r.weightSum}</td>
      <td>100%</td>
      <td class="finance-highlight">${r.sumShares.toFixed(2)}</td>
    </tr>
  `;
}

export function initAllocate() {
  document.getElementById('allocCalc')?.addEventListener('click', () => {
    renderResult(calcProportional(
      document.getElementById('allocTotal').value,
      document.getElementById('allocWeights').value,
    ));
  });

  document.getElementById('allocCopy')?.addEventListener('click', () => {
    if (!lastResult) return;
    copyText(allocateToTsv(lastResult));
  });

  document.getElementById('allocClear')?.addEventListener('click', () => {
    document.getElementById('allocTotal').value = '';
    document.getElementById('allocWeights').value = '';
    document.querySelector('#allocResultTable tbody').innerHTML = '';
    document.getElementById('allocError').hidden = true;
    document.getElementById('allocResultCard').hidden = true;
    lastResult = null;
  });

  document.addEventListener('localechange', () => {
    if (lastResult) renderResult(lastResult);
  });
}
