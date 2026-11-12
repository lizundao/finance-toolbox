import {
  TAX_RATES,
  TAX_VERSION,
  calcTax,
  batchCalcTax,
  batchToTsv,
  parseRate,
} from '../lib/tax.js';
import { copyText, showToast } from '../common.js';
import { tr } from '../i18n.js';

function getSelectedRate() {
  const sel = document.getElementById('taxRateSelect');
  const isCustom = sel?.value === 'custom';
  const custom = document.getElementById('taxCustomRate')?.value?.trim();

  if (isCustom) {
    if (!custom) return null;
    const r = parseRate(custom);
    if (r == null) return null;
    return { rate: r, text: `${roundPercent(r)}%` };
  }

  const rate = parseFloat(sel?.value);
  if (!Number.isFinite(rate)) return null;
  const opt = sel?.selectedOptions?.[0];
  return { rate, text: opt?.textContent?.split('（')[0]?.trim() ?? '' };
}

function roundPercent(rate) {
  const p = rate * 100;
  return Number.isInteger(p) ? p : Math.round(p * 10000) / 10000;
}

function getMode() {
  return document.querySelector('[data-tax-mode].active')?.dataset.taxMode ?? 'inclusive';
}

function renderSingleResult(r) {
  const wrap = document.getElementById('taxResultRows');
  const errorEl = document.getElementById('taxError');
  if (!r.ok) {
    wrap.innerHTML = '';
    errorEl.textContent = r.error;
    errorEl.hidden = false;
    return;
  }
  errorEl.hidden = true;
  const label = getMode() === 'inclusive' ? tr('taxLabelInputIncl') : tr('taxLabelInputExcl');
  wrap.innerHTML = `
    <div class="meta-row"><dt>${label}</dt><dd>${document.getElementById('taxAmount').value}</dd></div>
    <div class="meta-row"><dt>${tr('taxRate')}</dt><dd>${r.rateText}</dd></div>
    <div class="meta-row"><dt>${tr('taxLabelExcl')}</dt><dd class="finance-highlight">${r.lines.excl}</dd></div>
    <div class="meta-row"><dt>${tr('taxLabelTax')}</dt><dd class="finance-highlight">${r.lines.tax}</dd></div>
    <div class="meta-row"><dt>${tr('taxLabelIncl')}</dt><dd class="finance-highlight">${r.lines.incl}</dd></div>
  `;
}

let lastSingleResult = null;
let lastBatchRows = [];

function runSingle() {
  const rateInfo = getSelectedRate();
  if (!rateInfo) {
    document.getElementById('taxError').textContent = tr('toastInvalidRate');
    document.getElementById('taxError').hidden = false;
    return;
  }
  const r = calcTax(document.getElementById('taxAmount').value, rateInfo.rate, getMode());
  lastSingleResult = r.ok ? r : null;
  renderSingleResult(r);
}

function populateRateSelect() {
  const sel = document.getElementById('taxRateSelect');
  if (!sel) return;
  const descKeys = { '13': 'taxRate13', '9': 'taxRate9', '6': 'taxRate6', '3': 'taxRate3', '1': 'taxRate1' };
  sel.innerHTML = TAX_RATES.map(
    (item) => `<option value="${item.value}">${item.label}（${tr(descKeys[item.id] ?? item.desc)}）</option>`,
  ).join('') + `<option value="custom">${tr('taxCustomOption')}</option>`;
  sel.value = String(TAX_RATES[0]?.value ?? '0.13');

  const ver = document.getElementById('taxRateVersion');
  if (ver) ver.textContent = tr('taxRateVersion', TAX_VERSION);
}

export function initTax() {
  populateRateSelect();

  let activeTab = 'single';
  const singleWrap = document.getElementById('taxSingle');
  const batchWrap = document.getElementById('taxBatch');
  const resultCard = document.getElementById('taxResultCard');

  function setTab(tab) {
    activeTab = tab;
    document.querySelectorAll('[data-tax-tab]').forEach((b) => {
      b.classList.toggle('active', b.dataset.taxTab === tab);
    });
    singleWrap.hidden = tab !== 'single';
    batchWrap.hidden = tab !== 'batch';
    resultCard.hidden = tab === 'batch';
    document.getElementById('taxBatchTable').hidden = tab !== 'batch' || lastBatchRows.length === 0;
  }

  document.querySelectorAll('[data-tax-tab]').forEach((btn) => {
    btn.addEventListener('click', () => setTab(btn.dataset.taxTab));
  });

  document.querySelectorAll('[data-tax-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tax-mode]').forEach((b) => {
        b.classList.toggle('active', b === btn);
      });
      const inclusive = btn.dataset.taxMode === 'inclusive';
      document.getElementById('taxAmountLabel').textContent = inclusive ? tr('taxAmountInclusive') : tr('taxAmountExclusive');
      document.getElementById('taxAmount').placeholder = inclusive ? tr('taxAmountPhIncl') : tr('taxAmountPhExcl');
    });
  });

  document.getElementById('taxRateSelect')?.addEventListener('change', (e) => {
    const customField = document.getElementById('taxCustomRateField');
    customField.hidden = e.target.value !== 'custom';
  });

  document.getElementById('taxCalc')?.addEventListener('click', runSingle);
  document.getElementById('taxAmount')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSingle();
  });

  document.getElementById('taxCopyAll')?.addEventListener('click', () => {
    if (!lastSingleResult) {
      showToast(tr('toastPleaseCalc'), { type: 'error' });
      return;
    }
    copyText(
      tr('taxCopyAllText', lastSingleResult.lines.excl, lastSingleResult.lines.tax, lastSingleResult.lines.incl),
    );
  });

  document.getElementById('taxCopyExcl')?.addEventListener('click', () => {
    if (lastSingleResult) copyText(lastSingleResult.lines.excl);
  });
  document.getElementById('taxCopyTax')?.addEventListener('click', () => {
    if (lastSingleResult) copyText(lastSingleResult.lines.tax);
  });
  document.getElementById('taxCopyIncl')?.addEventListener('click', () => {
    if (lastSingleResult) copyText(lastSingleResult.lines.incl);
  });

  document.getElementById('taxClear')?.addEventListener('click', () => {
    document.getElementById('taxAmount').value = '';
    document.getElementById('taxCustomRate').value = '';
    document.getElementById('taxResultRows').innerHTML = '';
    document.getElementById('taxError').hidden = true;
    lastSingleResult = null;
    document.getElementById('taxAmount').focus();
  });

  document.getElementById('taxBatchCalc')?.addEventListener('click', () => {
    const rateInfo = getSelectedRate();
    if (!rateInfo) {
      showToast(tr('toastInvalidRate'), { type: 'error' });
      return;
    }
    const mode = getMode();
    lastBatchRows = batchCalcTax(document.getElementById('taxBatchInput').value, {
      defaultRate: rateInfo.rate,
      mode,
    });
    const tbody = document.getElementById('taxBatchBody');
    tbody.innerHTML = lastBatchRows
      .map((row) => {
        if (row.error) {
          return `<tr><td>${row.line}</td><td>${row.input}</td><td colspan="4" class="batch-err">${row.error}</td></tr>`;
        }
        return `<tr><td>${row.line}</td><td>${row.input}</td><td>${row.excl}</td><td>${row.tax}</td><td>${row.incl}</td><td>${row.rateText}</td></tr>`;
      })
      .join('');
    document.getElementById('taxBatchTable').hidden = lastBatchRows.length === 0;
  });

  document.getElementById('taxBatchCopy')?.addEventListener('click', () => {
    if (!lastBatchRows.length) {
      showToast(tr('toastNoResults'), { type: 'error' });
      return;
    }
    copyText(batchToTsv(lastBatchRows, getMode()));
  });

  document.addEventListener('localechange', () => {
    populateRateSelect();
    const inclusive = getMode() === 'inclusive';
    document.getElementById('taxAmountLabel').textContent = inclusive ? tr('taxAmountInclusive') : tr('taxAmountExclusive');
    document.getElementById('taxAmount').placeholder = inclusive ? tr('taxAmountPhIncl') : tr('taxAmountPhExcl');
  });
}
