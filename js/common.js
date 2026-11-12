import { tr } from './i18n.js';

export function showToast(message, { type = 'info', duration = 3000 } = {}) {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  stack.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 280);
  }, duration);
}

export async function copyText(text, { silent = false, emptyMsg } = {}) {
  if (!text) {
    if (!silent) showToast(emptyMsg ?? tr('toastNoContent'), { type: 'error' });
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    if (!silent) showToast(tr('toastCopied'), { type: 'info', duration: 2000 });
    return true;
  } catch {
    if (!silent) showToast(tr('toastCopyFailed'), { type: 'error' });
    return false;
  }
}

export function bindToolForm({
  inputId,
  resultId,
  errorId,
  compute,
  onSuccess,
  copyBtnId,
  clearBtnId,
}) {
  const input = document.getElementById(inputId);
  const resultEl = document.getElementById(resultId);
  const errorEl = errorId ? document.getElementById(errorId) : null;

  function run() {
    const r = compute(input?.value ?? '');
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }
    if (!r.ok) {
      if (resultEl) {
        resultEl.textContent = '';
        resultEl.classList.remove('finance-result-ok');
      }
      if (errorEl) {
        errorEl.textContent = r.error;
        errorEl.hidden = false;
      }
      return null;
    }
    if (resultEl) {
      resultEl.textContent = r.text ?? r.output ?? '';
      resultEl.classList.add('finance-result-ok');
    }
    onSuccess?.(r);
    return r;
  }

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      run();
    }
    if (e.key === 'Escape') {
      input.value = '';
      if (resultEl) resultEl.textContent = '';
      if (errorEl) errorEl.hidden = true;
    }
  });

  input?.addEventListener('input', () => {
    if (input.dataset.live === 'true') run();
  });

  document.getElementById(copyBtnId)?.addEventListener('click', () => {
    copyText(resultEl?.textContent ?? '');
  });

  document.getElementById(clearBtnId)?.addEventListener('click', () => {
    if (input) input.value = '';
    if (resultEl) {
      resultEl.textContent = '';
      resultEl.classList.remove('finance-result-ok');
    }
    if (errorEl) errorEl.hidden = true;
    input?.focus();
  });

  return { run };
}

export function initNotifications() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-goto]');
    if (!el || el.classList.contains('soon')) return;
    const view = el.dataset.goto;
    if (view) document.dispatchEvent(new CustomEvent('finance-navigate', { detail: view }));
  });
}
