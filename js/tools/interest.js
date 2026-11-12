import { calcInterest } from '../lib/interest.js';
import { copyText } from '../common.js';
import { tr } from '../i18n.js';

function mapError(code) {
  const keys = {
    invalidPrincipal: 'errInvalidAmount',
    invalidRate: 'errInvalidRate',
    invalidDate: 'errInvalidDate',
    invalidDays: 'errInvalidDays',
  };
  return tr(keys[code] ?? 'errUnknown');
}

let lastResult = null;

function getDaysMode() {
  return document.querySelector('[data-int-days-mode].active')?.dataset.intDaysMode ?? 'manual';
}

function renderResult(r) {
  const wrap = document.getElementById('interestResultRows');
  const errorEl = document.getElementById('interestError');
  if (!r.ok) {
    lastResult = null;
    wrap.innerHTML = '';
    errorEl.textContent = mapError(r.error);
    errorEl.hidden = false;
    return;
  }
  lastResult = r;
  errorEl.hidden = true;
  wrap.innerHTML = `
    <div class="meta-row"><dt>${tr('intLabelPrincipal')}</dt><dd>${r.principal.toFixed(2)}</dd></div>
    <div class="meta-row"><dt>${tr('intLabelRate')}</dt><dd>${r.ratePercent}%</dd></div>
    <div class="meta-row"><dt>${tr('intLabelDays')}</dt><dd>${r.days} ${tr('dateUnitDay')}</dd></div>
    <div class="meta-row"><dt>${tr('intLabelBasis')}</dt><dd>${r.basis}</dd></div>
    <div class="meta-row"><dt>${tr('intLabelInterest')}</dt><dd class="finance-highlight">${r.interest.toFixed(2)}</dd></div>
    <div class="meta-row"><dt>${tr('intLabelTotal')}</dt><dd>${r.total.toFixed(2)}</dd></div>
  `;
}

export function initInterest() {
  const manualWrap = document.getElementById('interestDaysManual');
  const rangeWrap = document.getElementById('interestDaysRange');

  function setDaysMode(mode) {
    document.querySelectorAll('[data-int-days-mode]').forEach((b) => {
      b.classList.toggle('active', b.dataset.intDaysMode === mode);
    });
    manualWrap.hidden = mode !== 'manual';
    rangeWrap.hidden = mode !== 'range';
  }

  document.querySelectorAll('[data-int-days-mode]').forEach((btn) => {
    btn.addEventListener('click', () => setDaysMode(btn.dataset.intDaysMode));
  });

  document.getElementById('interestCalc')?.addEventListener('click', () => {
    const mode = getDaysMode();
    const basis = document.getElementById('interestBasis').value === '360' ? 360 : 365;
    const opts = {
      principal: document.getElementById('interestPrincipal').value,
      rate: document.getElementById('interestRate').value,
      basis,
    };
    if (mode === 'range') {
      opts.startDate = document.getElementById('interestStart').value;
      opts.endDate = document.getElementById('interestEnd').value;
    } else {
      opts.days = document.getElementById('interestDays').value;
    }
    renderResult(calcInterest(opts));
  });

  document.getElementById('interestCopy')?.addEventListener('click', () => {
    if (!lastResult) return;
    copyText(tr('intCopyText', lastResult.interest.toFixed(2), lastResult.days, lastResult.basis));
  });

  document.getElementById('interestClear')?.addEventListener('click', () => {
    ['interestPrincipal', 'interestRate', 'interestDays', 'interestStart', 'interestEnd'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('interestResultRows').innerHTML = '';
    document.getElementById('interestError').hidden = true;
    lastResult = null;
  });

  document.addEventListener('localechange', () => {
    if (lastResult) renderResult(lastResult);
  });
}
