import { calcSalaryIit, IIT_VERSION } from '../lib/iit.js';
import { copyText } from '../common.js';
import { tr } from '../i18n.js';

function mapError(code) {
  const keys = {
    invalidMonth: 'iitErrMonth',
    invalidGross: 'errInvalidAmount',
    invalidSocial: 'iitErrSocial',
    invalidAdditional: 'iitErrAdditional',
  };
  return tr(keys[code] ?? 'errUnknown');
}

let lastResult = null;

function renderResult(r) {
  const wrap = document.getElementById('iitResultRows');
  const errorEl = document.getElementById('iitError');
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
    <div class="meta-row"><dt>${tr('iitGross')}</dt><dd>${r.gross.toFixed(2)}</dd></div>
    <div class="meta-row"><dt>${tr('iitSocial')}</dt><dd>${r.social.toFixed(2)}</dd></div>
    <div class="meta-row"><dt>${tr('iitAdditional')}</dt><dd>${r.additional.toFixed(2)}</dd></div>
    <div class="meta-row"><dt>${tr('iitCumulativeTaxable')}</dt><dd>${r.cumulativeTaxable.toFixed(2)}</dd></div>
    <div class="meta-row"><dt>${tr('iitRate')}</dt><dd>${r.ratePercent}%</dd></div>
    <div class="meta-row"><dt>${tr('iitMonthTax')}</dt><dd class="finance-highlight">${r.monthTax.toFixed(2)}</dd></div>
    <div class="meta-row"><dt>${tr('iitNetPay')}</dt><dd class="finance-highlight">${r.netPay.toFixed(2)}</dd></div>
    <div class="meta-row"><dt>${tr('iitCumulativeTax')}</dt><dd>${r.cumulativeTax.toFixed(2)}</dd></div>
  `;
}

export function initIit() {
  const ver = document.getElementById('iitRateVersion');
  if (ver) ver.textContent = tr('iitRateVersion', IIT_VERSION);

  document.getElementById('iitCalc')?.addEventListener('click', () => {
    renderResult(calcSalaryIit({
      month: document.getElementById('iitMonth').value,
      gross: document.getElementById('iitGross').value,
      social: document.getElementById('iitSocial').value,
      additional: document.getElementById('iitAdditional').value,
    }));
  });

  document.getElementById('iitCopy')?.addEventListener('click', () => {
    if (!lastResult) return;
    copyText(tr('iitCopyText', lastResult.monthTax.toFixed(2), lastResult.netPay.toFixed(2)));
  });

  document.getElementById('iitClear')?.addEventListener('click', () => {
    ['iitGross', 'iitSocial', 'iitAdditional'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    document.getElementById('iitResultRows').innerHTML = '';
    document.getElementById('iitError').hidden = true;
    lastResult = null;
  });

  document.addEventListener('localechange', () => {
    if (ver) ver.textContent = tr('iitRateVersion', IIT_VERSION);
    if (lastResult) renderResult(lastResult);
  });
}
