import { rmbToNumber, numberToRmb, verifyRmbPair } from '../lib/rmb.js';
import { bindToolForm, copyText } from '../common.js';
import { tr } from '../i18n.js';

export function initRmbReverse() {
  const amountInput = document.getElementById('rmbRevAmount');
  const rmbInput = document.getElementById('rmbRevInput');
  const resultEl = document.getElementById('rmbRevResult');
  const verifyEl = document.getElementById('rmbRevVerify');
  const errorEl = document.getElementById('rmbRevError');

  function runReverse() {
    errorEl.hidden = true;
    const r = rmbToNumber(rmbInput?.value ?? '');
    if (!r.ok) {
      resultEl.textContent = '';
      verifyEl.hidden = true;
      errorEl.textContent = r.error;
      errorEl.hidden = false;
      return;
    }
    resultEl.textContent = r.text;
    resultEl.classList.add('finance-result-ok');

    const amt = amountInput?.value?.trim();
    if (amt) {
      const v = verifyRmbPair(amt, rmbInput.value);
      if (v.ok) {
        verifyEl.hidden = false;
        verifyEl.className = v.match ? 'finance-verify match' : 'finance-verify mismatch';
        verifyEl.textContent = v.match
          ? tr('rmbRevMatchOk', v.amount)
          : tr('rmbRevMismatchLeft', v.parsedAmount, v.amount);
      }
    } else {
      verifyEl.hidden = true;
    }
  }

  function runForwardCheck() {
    const amt = amountInput?.value?.trim();
    if (!amt || !rmbInput?.value?.trim()) return;
    const v = verifyRmbPair(amt, rmbInput.value);
    if (!v.ok) return;
    verifyEl.hidden = false;
    verifyEl.className = v.match ? 'finance-verify match' : 'finance-verify mismatch';
    verifyEl.textContent = v.match
      ? tr('rmbRevMatchPair', v.amount)
      : tr('rmbRevMismatchPair', v.rmb);
  }

  rmbInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runReverse();
    if (e.key === 'Escape') {
      rmbInput.value = '';
      amountInput.value = '';
      resultEl.textContent = '';
      verifyEl.hidden = true;
      errorEl.hidden = true;
    }
  });

  amountInput?.addEventListener('input', runForwardCheck);
  rmbInput?.addEventListener('input', () => {
    if (rmbInput.value.trim()) runReverse();
    else verifyEl.hidden = true;
  });

  document.getElementById('rmbRevCalc')?.addEventListener('click', runReverse);
  document.getElementById('rmbRevCopy')?.addEventListener('click', () => copyText(resultEl.textContent));
  document.getElementById('rmbRevClear')?.addEventListener('click', () => {
    amountInput.value = '';
    rmbInput.value = '';
    resultEl.textContent = '';
    verifyEl.hidden = true;
    errorEl.hidden = true;
    rmbInput.focus();
  });

  document.getElementById('rmbRevSuggest')?.addEventListener('click', () => {
    const r = numberToRmb(amountInput?.value ?? '');
    if (r.ok) rmbInput.value = r.text;
    runReverse();
  });
}
