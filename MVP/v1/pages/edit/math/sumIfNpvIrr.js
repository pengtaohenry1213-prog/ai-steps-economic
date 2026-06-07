/* eslint-disable jsdoc/require-returns-description */

// Helper functions
function SELECT(index, ...args) {
  return args[index - 1]; // JS arrays are 0-indexed
}

function SUM(...values) {
  return values.reduce((sum, value) => sum + value, 0);
}

function IF(condition, trueValue, falseValue) {
  return condition ? trueValue : falseValue;
}

function NPV(cashFlows, discountRate, dates) {
  if (dates) {
    // Time-based NPV calculation
    const firstDate = new Date(dates[0]);
    let total = 0;
    for (const [i, cashFlow] of cashFlows.entries()) {
      const currentDate = new Date(dates[i]);
      const daysDiff = (currentDate - firstDate) / (1000 * 60 * 60 * 24);
      const years = daysDiff / 365;
      total += cashFlow / (1 + discountRate) ** years;
    }
    return total;
  } else {
    // Regular NPV (period-based)
    let npv = 0;
    for (const [i, cashFlow] of cashFlows.entries()) {
      npv += cashFlow / (1 + discountRate) ** i;
    }
    return npv;
  }
}

function npvDerivative(rate, cashFlows, dates) {
  const firstDate = new Date(dates[0]);
  let total = 0;
  for (const [i, cashFlow] of cashFlows.entries()) {
    const currentDate = new Date(dates[i]);
    const daysDiff = (currentDate - firstDate) / (1000 * 60 * 60 * 24);
    const years = daysDiff / 365;
    total -= (years * cashFlow) / (1 + rate) ** (years + 1);
  }
  return total;
}

// function XIRR(cashFlows, dates, guess = 0.1) {
//   const maxIter = 1000;
//   const tol = 1e-10;

//   for (let i = 0; i < maxIter; i++) {
//     const fValue = NPV(cashFlows, guess, dates);
//     const fDerivative = npvDerivative(guess, cashFlows, dates);
//     const newRate = guess - fValue / fDerivative;

//     if (Math.abs(newRate - guess) < tol) {
//       return newRate;
//     }

//     guess = newRate;
//   }

//   throw new Error('XIRR calculation did not converge');
// }

function IRR(cashFlows, tolerance = 1e-6) {
  let lower = -1;
  let upper = 1;
  let mid = 0;

  while (upper - lower > tolerance) {
    mid = (upper + lower) / 2;
    const npv = NPV(cashFlows, mid);
    if (npv > 0) {
      lower = mid;
    } else {
      upper = mid;
    }
  }
  return mid;
}

/**
 * IFERROR(公式或表达式, 出错时返回的值)
 * @param {*} value 公式或表达式
 * @param {*} errorValue 出错时返回的值
 * @returns
 */
function IFERROR(value, errorValue) {
  if (
    value === false ||
    value === null ||
    value === undefined ||
    Number.isNaN(value) ||
    value === Infinity ||
    value === -Infinity
  ) {
    return errorValue;
  }
  return value;
}

function AVERAGE(...numbers) {
  if (numbers.length === 0) return 0;
  return SUM(...numbers) / numbers.length;
}

function AND(...args) {
  return args.every(Boolean);
}

// num_digits	保留的小数位数（或整数位）
function ROUNDUP(number, num_digits) {
  const value = Math.ceil(number);
  if (num_digits) {
    return value.toFixed(num_digits);
  }
  return value;
}

function SUMIF(values, condition, sumRange) {
  let sum = 0;

  if (Array.isArray(values)) {
    for (const [i, value] of values.entries()) {
      if (value === condition) {
        sum += sumRange ? sumRange[i] : value;
      }
    }
  } else {
    if (values === condition) {
      sum += sumRange || values;
    }
  }

  return sum;
}

function MAX(...args) {
  return Math.max(...args);
}

/**
 * 取余（模）函数，用于计算一个数除以另一个数后的余数。
 * @param  {...any} args 被除数（可以是正数或负数）
 * @returns
 */
function MOD(...args) {
  let result = args[0];
  for (let i = 1; i < args.length; i++) {
    result %= args[i];
  }
  return result;
}

function MIN(...args) {
  return Math.min(...args);
}

function OR(...args) {
  return args.some(Boolean);
}

// 数组内有值的元素个数
function COUNTA(args) {
  return args.filter((e) => !Number.isNaN(Number(e)) && Number(e) > 0).length;
}

export {
  AND,
  AVERAGE,
  COUNTA,
  IF,
  IFERROR,
  IRR,
  MAX,
  MIN,
  MOD,
  NPV,
  npvDerivative,
  OR,
  ROUNDUP,
  SELECT,
  SUM,
  SUMIF,
  // XIRR,
};
