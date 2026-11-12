import { dateToCheckUpper } from '../lib/check-date.js';
import { bindToolForm } from '../common.js';
import { tr } from '../i18n.js';

export function initCheckDate() {
  const input = document.getElementById('checkDateInput');
  if (input && !input.value) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    input.value = `${y}-${m}-${d}`;
  }

  const form = bindToolForm({
    inputId: 'checkDateInput',
    resultId: 'checkDateResult',
    errorId: 'checkDateError',
    copyBtnId: 'checkDateCopy',
    clearBtnId: 'checkDateClear',
    compute: (v) => {
      const r = dateToCheckUpper(v);
      if (!r.ok) return { ok: false, error: tr('errInvalidDate') };
      return { ok: true, text: r.text };
    },
  });

  document.getElementById('checkDateCalc')?.addEventListener('click', () => form.run());
  document.getElementById('checkDateToday')?.addEventListener('click', () => {
    const now = new Date();
    input.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    form.run();
  });
}
