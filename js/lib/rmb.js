import { parseAmount, roundTo, toFixedAmount, isSafeAmount } from './decimal.js';

const CN_NUMS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const CN_RADICE = ['', '拾', '佰', '仟'];
const CN_BIG = ['', '万', '亿', '兆'];

function sectionToChinese(section) {
  let str = '';
  let zero = false;
  for (let i = 0; i < 4; i++) {
    const v = Math.floor(section / 10 ** (3 - i)) % 10;
    if (v === 0) {
      zero = true;
    } else {
      if (zero && str.length > 0) str += CN_NUMS[0];
      zero = false;
      str += CN_NUMS[v] + CN_RADICE[3 - i];
    }
  }
  return str;
}

function integerToChinese(intPart) {
  if (intPart === 0) return CN_NUMS[0];
  let result = '';
  let unitPos = 0;
  let needZero = false;
  let n = intPart;

  while (n > 0) {
    const section = n % 10000;
    if (needZero) result = CN_NUMS[0] + result;
    if (section !== 0) {
      let sectionStr = sectionToChinese(section);
      sectionStr += CN_BIG[unitPos];
      result = sectionStr + result;
    }
    needZero = section < 1000 && section > 0;
    n = Math.floor(n / 10000);
    unitPos += 1;
  }
  return result;
}

/**
 * 数字金额 → 人民币大写
 * @param {number|string} input
 * @returns {{ ok: true, text: string, amount: number } | { ok: false, error: string }}
 */
export function numberToRmb(input) {
  const parsed = typeof input === 'number' ? input : parseAmount(input);
  if (parsed == null) return { ok: false, error: '请输入有效的金额数字' };
  if (!isSafeAmount(parsed)) {
    return { ok: false, error: '金额超出精确计算范围（上限约 90 万亿元）' };
  }

  const negative = parsed < 0;
  const abs = roundTo(Math.abs(parsed), 2);

  // 从定点字符串拆分整数与分位，避免 (abs - intPart) * 100 的浮点误差丢失「分」
  const [intStr, fracStr] = toFixedAmount(abs, 2).split('.');
  const intPart = Number(intStr);
  const cents = Number(fracStr);
  const jiao = Math.floor(cents / 10);
  const fen = cents % 10;

  let result = '';

  if (intPart === 0 && cents === 0) {
    result = '零圆整';
  } else {
    if (intPart > 0) {
      result += integerToChinese(intPart) + '圆';
    } else {
      // 不足一元补「零圆」，票据上「壹分」这类写法容易被篡改
      result += '零圆';
    }

    if (jiao === 0 && fen === 0) {
      result += '整';
    } else {
      if (jiao > 0) result += CN_NUMS[jiao] + '角';
      else if (fen > 0) result += CN_NUMS[0]; // 零角有分
      if (fen > 0) result += CN_NUMS[fen] + '分';
    }
  }

  if (negative) result = '负' + result;

  return { ok: true, text: result, amount: negative ? -abs : abs };
}

/** 大写单字 → 数字 */
const RMB_CHAR_MAP = {
  零: 0, 壹: 1, 贰: 2, 叁: 3, 肆: 4, 伍: 5, 陆: 6, 柒: 7, 捌: 8, 玖: 9,
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
  拾: 10, 十: 10, 佰: 100, 百: 100, 仟: 1000, 千: 1000,
  万: 10000, 亿: 100000000, 兆: 1000000000000,
  圆: 0, 元: 0, 角: 0.1, 分: 0.01, 整: 0, 正: 0,
};

function parseChineseInteger(str) {
  if (!str || str === '零') return 0;
  let total = 0;
  let section = 0;
  let num = 0;

  for (const ch of str) {
    const v = RMB_CHAR_MAP[ch];
    if (v == null) return null;
    if (v < 10) {
      num = v;
    } else if (v === 10) {
      section += (num || 1) * 10;
      num = 0;
    } else if (v === 100 || v === 1000) {
      section += (num || 1) * v;
      num = 0;
    } else if (v >= 10000) {
      section += num;
      total += section * v;
      section = 0;
      num = 0;
    }
  }
  return total + section + num;
}

/**
 * 人民币大写 → 数字（用于核对）
 */
export function rmbToNumber(input) {
  let s = String(input).trim();
  if (!s) return { ok: false, error: '请输入大写金额' };

  let negative = false;
  if (/^负/.test(s) || /^[(（]负/.test(s)) {
    negative = true;
    s = s.replace(/^[(（]?负[)）]?/, '').trim();
  }

  s = s.replace(/人民币/g, '').replace(/\s/g, '').replace(/整|正/g, '');

  let jiao = 0;
  let fen = 0;
  const jm = s.match(/([零壹贰叁肆伍陆柒捌玖一二三四五六七八九])角/);
  const fm = s.match(/([零壹贰叁肆伍陆柒捌玖一二三四五六七八九])分/);
  if (jm) jiao = RMB_CHAR_MAP[jm[1]];
  if (fm) fen = RMB_CHAR_MAP[fm[1]];
  s = s.replace(/[零壹贰叁肆伍陆柒捌玖一二三四五六七八九][角分]/g, '');

  const yuanIdx = Math.max(s.indexOf('圆'), s.indexOf('元'));
  const intStr = yuanIdx >= 0 ? s.slice(0, yuanIdx) : s;
  const intVal = parseChineseInteger(intStr);
  if (intVal == null) return { ok: false, error: '无法识别的大写格式' };

  let amount = intVal + jiao * 0.1 + fen * 0.01;
  if (negative) amount = -amount;
  amount = roundTo(amount, 2);

  return { ok: true, amount, text: toFixedAmount(amount) };
}

/** 核对：数字与大写是否一致 */
export function verifyRmbPair(amountInput, rmbInput) {
  const forward = numberToRmb(amountInput);
  if (!forward.ok) return { ok: false, error: forward.error };
  const backward = rmbToNumber(rmbInput);
  if (!backward.ok) return { ok: false, error: backward.error };
  const match = forward.amount === backward.amount;
  return {
    ok: true,
    match,
    amount: forward.amount,
    rmb: forward.text,
    parsedAmount: backward.amount,
  };
}
