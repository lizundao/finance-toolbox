import { numberToRmb } from '../lib/rmb.js';
import { bindToolForm } from '../common.js';

export function initRmb() {
  const form = bindToolForm({
    inputId: 'rmbInput',
    resultId: 'rmbResult',
    errorId: 'rmbError',
    copyBtnId: 'rmbCopy',
    clearBtnId: 'rmbClear',
    compute: (v) => {
      const r = numberToRmb(v);
      if (!r.ok) return r;
      return { ok: true, text: r.text };
    },
  });

  document.getElementById('rmbCalc')?.addEventListener('click', () => form.run());
}
