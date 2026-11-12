import { validateBankCard, validateIdCard } from '../lib/validate.js';
import { copyText } from '../common.js';
import { tr } from '../i18n.js';

function mapIdError(code) {
  const keys = {
    empty: 'valErrEmpty',
    format: 'valIdErrFormat',
    birthDate: 'valIdErrBirth',
    checksum: 'valIdErrChecksum',
  };
  return tr(keys[code] ?? 'errUnknown');
}

function mapBankError(code) {
  const keys = {
    empty: 'valErrEmpty',
    format: 'valBankErrFormat',
    luhn: 'valBankErrLuhn',
  };
  return tr(keys[code] ?? 'errUnknown');
}

let lastIdResult = null;
let lastBankResult = null;

function renderIdResult(r) {
  const wrap = document.getElementById('validateIdRows');
  const errorEl = document.getElementById('validateIdError');
  if (!r.ok) {
    lastIdResult = null;
    wrap.innerHTML = '';
    errorEl.textContent = mapIdError(r.error);
    errorEl.hidden = false;
    return;
  }
  lastIdResult = r;
  errorEl.hidden = true;
  const genderLabel = r.gender === 'male' ? tr('valGenderMale') : tr('valGenderFemale');
  wrap.innerHTML = `
    <div class="meta-row"><dt>${tr('valIdLabel')}</dt><dd class="finance-highlight">${r.id}</dd></div>
    <div class="meta-row"><dt>${tr('valBirth')}</dt><dd>${r.birth}</dd></div>
    <div class="meta-row"><dt>${tr('valGender')}</dt><dd>${genderLabel}</dd></div>
    <div class="meta-row"><dt>${tr('valRegion')}</dt><dd>${r.region}</dd></div>
    <p class="hint val-ok-hint">${tr('valIdOk')}</p>
  `;
}

function renderBankResult(r) {
  const wrap = document.getElementById('validateBankRows');
  const errorEl = document.getElementById('validateBankError');
  if (!r.ok) {
    lastBankResult = null;
    wrap.innerHTML = '';
    errorEl.textContent = mapBankError(r.error);
    errorEl.hidden = false;
    return;
  }
  lastBankResult = r;
  errorEl.hidden = true;
  wrap.innerHTML = `
    <div class="meta-row"><dt>${tr('valBankNumber')}</dt><dd class="finance-highlight">${r.masked}</dd></div>
    <div class="meta-row"><dt>${tr('valBankLength')}</dt><dd>${r.length} ${tr('valDigits')}</dd></div>
    <p class="hint val-ok-hint">${tr('valBankOk')}</p>
  `;
}

export function initValidate() {
  let tab = 'id';

  const idPanel = document.getElementById('validateIdPanel');
  const bankPanel = document.getElementById('validateBankPanel');
  const idResult = document.getElementById('validateIdResult');
  const bankResult = document.getElementById('validateBankResult');

  function setTab(next) {
    tab = next;
    document.querySelectorAll('[data-val-tab]').forEach((b) => {
      b.classList.toggle('active', b.dataset.valTab === next);
    });
    const isId = next === 'id';
    idPanel.hidden = !isId;
    idResult.hidden = !isId;
    bankPanel.hidden = isId;
    bankResult.hidden = isId;
  }

  setTab('id');

  document.querySelectorAll('[data-val-tab]').forEach((btn) => {
    btn.addEventListener('click', () => setTab(btn.dataset.valTab));
  });

  document.getElementById('validateIdBtn')?.addEventListener('click', () => {
    renderIdResult(validateIdCard(document.getElementById('validateIdInput').value));
  });

  document.getElementById('validateBankBtn')?.addEventListener('click', () => {
    renderBankResult(validateBankCard(document.getElementById('validateBankInput').value));
  });

  document.getElementById('validateIdCopy')?.addEventListener('click', () => {
    copyText(lastIdResult?.id ?? '');
  });

  document.getElementById('validateBankCopy')?.addEventListener('click', () => {
    copyText(lastBankResult?.number ?? '');
  });

  document.getElementById('validateIdClear')?.addEventListener('click', () => {
    document.getElementById('validateIdInput').value = '';
    document.getElementById('validateIdRows').innerHTML = '';
    document.getElementById('validateIdError').hidden = true;
    lastIdResult = null;
  });

  document.getElementById('validateBankClear')?.addEventListener('click', () => {
    document.getElementById('validateBankInput').value = '';
    document.getElementById('validateBankRows').innerHTML = '';
    document.getElementById('validateBankError').hidden = true;
    lastBankResult = null;
  });

  document.addEventListener('localechange', () => {
    if (lastIdResult) renderIdResult(lastIdResult);
    if (lastBankResult) renderBankResult(lastBankResult);
  });
}
