const ID_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const ID_CHECK_CHARS = '10X98765432';

function normalizeId(id) {
  return String(id ?? '').trim().toUpperCase().replace(/\s/g, '');
}

function isValidBirthDate(y, m, d) {
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function validateIdCard(input) {
  const id = normalizeId(input);
  if (!id) return { ok: false, error: 'empty' };
  if (!/^\d{17}[\dX]$/.test(id)) return { ok: false, error: 'format' };

  const y = Number(id.slice(6, 10));
  const m = Number(id.slice(10, 12));
  const d = Number(id.slice(12, 14));
  if (!isValidBirthDate(y, m, d)) return { ok: false, error: 'birthDate' };

  let sum = 0;
  for (let i = 0; i < 17; i += 1) {
    sum += Number(id[i]) * ID_WEIGHTS[i];
  }
  const check = ID_CHECK_CHARS[sum % 11];
  if (check !== id[17]) return { ok: false, error: 'checksum' };

  const region = id.slice(0, 6);
  const seq = id.slice(14, 17);
  const gender = Number(seq) % 2 === 1 ? 'male' : 'female';

  return {
    ok: true,
    id,
    region,
    birth: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    gender,
  };
}

function normalizeCard(input) {
  return String(input ?? '').replace(/\s|-/g, '');
}

export function validateBankCard(input) {
  const num = normalizeCard(input);
  if (!num) return { ok: false, error: 'empty' };
  if (!/^\d{12,19}$/.test(num)) return { ok: false, error: 'format' };

  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i -= 1) {
    let n = Number(num[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  if (sum % 10 !== 0) return { ok: false, error: 'luhn' };

  return {
    ok: true,
    number: num,
    length: num.length,
    masked: num.replace(/^(\d{4})(\d+)(\d{4})$/, '$1 **** **** $3'),
  };
}
