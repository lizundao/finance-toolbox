import { calcDateDiff, calcDueDate, getHolidayLabel } from '../lib/date.js';
import { copyText } from '../common.js';
import { tr } from '../i18n.js';

function mapError(code) {
  const keys = {
    invalidDate: 'errInvalidDate',
    invalidDays: 'errInvalidDays',
    rangeTooLarge: 'errRangeTooLarge',
  };
  return tr(keys[code] ?? 'errUnknown');
}

function updateHolidayVersion() {
  const label = getHolidayLabel();
  const ver = document.getElementById('dateHolidayVersion');
  if (!ver) return;
  ver.textContent = label === 'custom'
    ? tr('dateHolidayVersionCustom')
    : label === 'unavailable'
      ? tr('dateHolidayVersionUnavailable')
      : tr('dateHolidayVersionBuiltin');
}

/** 区间含未收录年份时，明确提示工作日结果为估算值 */
function warningRow(r) {
  return r.ok && r.holidayDataAvailable === false
    ? `<div class="calc-warning">⚠ ${tr('dateHolidayWarning')}</div>`
    : '';
}

function renderDiffResult(r) {
  const wrap = document.getElementById('dateDiffResultRows');
  const errorEl = document.getElementById('dateDiffError');
  if (!r.ok) {
    wrap.innerHTML = '';
    errorEl.textContent = mapError(r.error);
    errorEl.hidden = false;
    return;
  }
  errorEl.hidden = true;
  wrap.innerHTML = `
    <div class="meta-row"><dt>${tr('dateDiffStart')}</dt><dd>${r.start}</dd></div>
    <div class="meta-row"><dt>${tr('dateDiffEnd')}</dt><dd>${r.end}</dd></div>
    <div class="meta-row"><dt>${tr('dateDiffNatural')}</dt><dd class="finance-highlight">${r.naturalDays} ${tr('dateUnitDay')}</dd></div>
    <div class="meta-row"><dt>${tr('dateDiffInclusive')}</dt><dd>${r.inclusiveDays} ${tr('dateUnitDay')}</dd></div>
    <div class="meta-row"><dt>${tr('dateDiffWork')}</dt><dd class="finance-highlight">${r.workdays} ${tr('dateUnitDay')}</dd></div>
    ${warningRow(r)}
  `;
}

function renderDueResult(r) {
  const wrap = document.getElementById('dateDueResultRows');
  const errorEl = document.getElementById('dateDueError');
  if (!r.ok) {
    wrap.innerHTML = '';
    errorEl.textContent = mapError(r.error);
    errorEl.hidden = false;
    return;
  }
  errorEl.hidden = true;
  const modeLabel = r.mode === 'work' ? tr('dateDueModeWork') : tr('dateDueModeNatural');
  wrap.innerHTML = `
    <div class="meta-row"><dt>${tr('dateDueStart')}</dt><dd>${r.start}</dd></div>
    <div class="meta-row"><dt>${tr('dateDueDays')}</dt><dd>${r.days} ${tr('dateUnitDay')}（${modeLabel}）</dd></div>
    <div class="meta-row"><dt>${tr('dateDueResult')}</dt><dd class="finance-highlight">${r.due}</dd></div>
    ${warningRow(r)}
  `;
}

export function initDateCalc() {
  let tab = 'diff';

  updateHolidayVersion();

  const diffPanel = document.getElementById('dateDiffPanel');
  const duePanel = document.getElementById('dateDuePanel');
  const diffResultCard = document.getElementById('dateDiffResultCard');
  const dueResultCard = document.getElementById('dateDueResultCard');

  function setTab(next) {
    tab = next;
    document.querySelectorAll('[data-date-tab]').forEach((b) => {
      b.classList.toggle('active', b.dataset.dateTab === next);
    });
    const isDiff = next === 'diff';
    diffPanel.hidden = !isDiff;
    diffResultCard.hidden = !isDiff;
    duePanel.hidden = isDiff;
    dueResultCard.hidden = isDiff;
  }

  setTab('diff');

  document.querySelectorAll('[data-date-tab]').forEach((btn) => {
    btn.addEventListener('click', () => setTab(btn.dataset.dateTab));
  });

  document.getElementById('dateDiffCalc')?.addEventListener('click', () => {
    renderDiffResult(calcDateDiff(
      document.getElementById('dateDiffStart').value,
      document.getElementById('dateDiffEnd').value,
    ));
  });

  document.getElementById('dateDueCalc')?.addEventListener('click', () => {
    const mode = document.querySelector('[data-due-mode].active')?.dataset.dueMode ?? 'natural';
    renderDueResult(calcDueDate(
      document.getElementById('dateDueStart').value,
      document.getElementById('dateDueDays').value,
      mode,
    ));
  });

  document.getElementById('dateDueCopy')?.addEventListener('click', () => {
    const text = document.querySelector('#dateDueResultRows .finance-highlight')?.textContent;
    copyText(text);
  });

  document.querySelectorAll('[data-due-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-due-mode]').forEach((b) => {
        b.classList.toggle('active', b === btn);
      });
    });
  });

  document.addEventListener('localechange', updateHolidayVersion);
  document.addEventListener('holidaychange', updateHolidayVersion);
}
