import { formatThousands, stripThousands, batchFormatLines } from '../lib/format.js';
import { numberToRmb } from '../lib/rmb.js';
import { copyText, showToast } from '../common.js';
import { tr } from '../i18n.js';

export function initFormat() {
  const singleWrap = document.getElementById('formatSingle');
  const batchWrap = document.getElementById('formatBatch');
  const resultCard = document.getElementById('formatResultCard');
  const digitsEl = document.getElementById('formatDigits');
  let activeMode = 'thousands';

  function setMode(mode) {
    activeMode = mode;
    document.querySelectorAll('[data-format-mode]').forEach((b) => {
      b.classList.toggle('active', b.dataset.formatMode === mode);
    });
    const isBatch = mode === 'batch';
    singleWrap.hidden = isBatch;
    batchWrap.hidden = !isBatch;
    resultCard.hidden = isBatch;
  }

  document.querySelectorAll('[data-format-mode]').forEach((btn) => {
    btn.addEventListener('click', () => setMode(btn.dataset.formatMode));
  });

  function runSingle() {
    const digits = Number(digitsEl.value) || 2;
    const input = document.getElementById('formatInput');
    const resultEl = document.getElementById('formatResult');
    const errorEl = document.getElementById('formatError');
    errorEl.hidden = true;

    let r;
    if (activeMode === 'strip') {
      r = stripThousands(input.value);
    } else {
      r = formatThousands(input.value, { digits, keepDigits: true });
    }

    if (!r.ok) {
      resultEl.textContent = '';
      errorEl.textContent = r.error;
      errorEl.hidden = false;
      return;
    }
    resultEl.textContent = r.text;
    resultEl.classList.add('finance-result-ok');
  }

  document.getElementById('formatInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSingle();
  });
  document.getElementById('formatCalc')?.addEventListener('click', runSingle);
  document.getElementById('formatCopy')?.addEventListener('click', () => {
    copyText(document.getElementById('formatResult')?.textContent);
  });
  document.getElementById('formatClear')?.addEventListener('click', () => {
    document.getElementById('formatInput').value = '';
    document.getElementById('formatResult').textContent = '';
    document.getElementById('formatError').hidden = true;
  });

  document.getElementById('formatBatchCalc')?.addEventListener('click', () => {
    const text = document.getElementById('formatBatchInput').value;
    const digits = Number(digitsEl.value) || 2;
    const batchMode = document.getElementById('formatBatchMode').value;
    const formatter = batchMode === 'rmb'
      ? (line) => numberToRmb(line)
      : (line) => formatThousands(line, { digits, keepDigits: true });

    const rows = batchFormatLines(text, formatter);
    const tbody = document.getElementById('formatBatchBody');
    tbody.innerHTML = rows
      .filter((row) => row.input)
      .map((row) => {
        const out = row.error ? row.error : row.output;
        const cls = row.error ? 'batch-err' : '';
        return `<tr><td>${row.line}</td><td>${row.input}</td><td class="${cls}">${out}</td></tr>`;
      })
      .join('');

    document.getElementById('formatBatchTable').hidden = rows.every((r) => !r.input);
  });

  document.getElementById('formatBatchCopy')?.addEventListener('click', () => {
    const rows = [...document.querySelectorAll('#formatBatchBody tr')];
    if (!rows.length) {
      showToast(tr('toastNoResults'), { type: 'error' });
      return;
    }
    const lines = rows.map((tr) => tr.cells[2]?.textContent ?? '').filter(Boolean);
    copyText(lines.join('\n'));
  });
}
