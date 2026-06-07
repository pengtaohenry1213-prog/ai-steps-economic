/**
 * 根据季度获取该季度的起止日期
 * @param {string} dateStr 季度字符串，格式如 "2024-2"
 * @returns {object} 包含起止日期的对象，格式为 { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
 */
// function getQuarterDateRange(quarterStr) {
//   // 验证输入格式
//   if (!/^\d{4}-[1-4]$/.test(quarterStr)) {
//     throw new Error(
//       `${quarterStr}季度格式不正确，应为 "YYYY-Q" 格式，其中 Q 为 1-4`,
//     );
//   }

//   const [year, quarter] = quarterStr.split('-').map(Number);

//   // 计算季度对应的月份
//   const startMonth = (quarter - 1) * 3 + 1;
//   const endMonth = startMonth + 2;

//   // 创建起始日期（季度的第一天）
//   const startDate = new Date(year, startMonth - 1, 1);

//   // 创建结束日期（季度的最后一天）
//   const endDate = new Date(year, endMonth, 0);

//   // 格式化日期为 YYYY-MM-DD
//   const format = (date) => {
//     const y = date.getFullYear();
//     const m = String(date.getMonth() + 1).padStart(2, '0');
//     const d = String(date.getDate()).padStart(2, '0');
//     return `${y}-${m}-${d}`;
//   };

//   return {
//     start: format(startDate),
//     end: format(endDate),
//   };
// }

function dateToExcelSerial(dateStr) {
  // 尝试用Date对象直接解析日期字符串
  const dateObj = new Date(dateStr);

  // 如果直接解析失败（返回Invalid Date），尝试手动解析常见格式
  if (Number.isNaN(dateObj.getTime())) {
    // 尝试解析常见的分隔符（/、-、.等）
    const separators = ['/', '-', '.', '年', '月', '日'];
    let foundSeparator = null;

    for (const sep of separators) {
      if (dateStr.includes(sep)) {
        foundSeparator = sep;
        break;
      }
    }

    if (foundSeparator) {
      // 根据找到的分隔符拆分日期
      const parts = dateStr
        .split(foundSeparator)
        .map((part) => part.replaceAll(/\D/g, '')) // 移除非数字字符
        .filter((part) => part.length > 0); // 过滤空部分

      if (parts.length >= 3) {
        const year = Number.parseInt(parts[0], 10);
        const month = Number.parseInt(parts[1], 10);
        const day = Number.parseInt(parts[2], 10);

        // 处理两位数的年份（假设20xx）
        const fullYear = year < 100 ? 2000 + year : year;
        dateObj.setFullYear(fullYear, month - 1, day);
      }
    }
  }

  // 检查是否成功解析日期
  if (Number.isNaN(dateObj.getTime())) {
    throw new TypeError(`无法解析日期字符串: ${dateStr}`);
  }

  // Excel基准日期（1900-01-01）
  const baseDate = new Date(1900, 0, 1);

  // 计算天数差
  const diffTime = dateObj - baseDate;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  // 添加2天以修正Excel的1900闰年错误
  return diffDays + 2;
}

// Helper function: Calculate years between two dates (365 days/year)
function yearsBetweenDates(startDate, endDate) {
  const startSerial = dateToExcelSerial(startDate);
  const endSerial = dateToExcelSerial(endDate);
  return (endSerial - startSerial) / 365;
}

// Calculate NPV with dates
function npvWithDates(dates, cashflows, rate, startDate) {
  let npv = 0;
  for (const [i, date] of dates.entries()) {
    const cashflow = cashflows[i];
    const t = yearsBetweenDates(startDate, date);
    npv += cashflow / (1 + rate) ** t;
  }
  return npv;
}

// Calculate XIRR using bisection method
// 计算XIRR：XIRR是扩展内部收益率，用于计算具有不规则时间间隔的现金流序列的内部收益率。
function xirrWithBisection(dates, cashflows, tolerance, startDate) {
  // 处理季度
  // dates = dates.map((item) => {
  //   if (/^\d{4}-[1-4]$/.test(item)) {
  //     return getQuarterDateRange(item).start;
  //   }
  //   return item;
  // });
  // startDate = /^\d{4}-[1-4]$/.test(startDate)
  //   ? getQuarterDateRange(startDate).start
  //   : startDate;
  // console.log(dates);
  // console.log(startDate);

  // 初始区间设置： 设置初始搜索区间：low = -0.99（-99%），high = 10（1000%）
  let low = -0.99;
  let high = 10;
  let mid;
  const maxIterations = 1000;
  let iterations = 0;

  // Ensure initial interval contains solution
  let npvLow = npvWithDates(dates, cashflows, low, startDate);
  let npvHigh = npvWithDates(dates, cashflows, high, startDate);

  // If initial interval doesn't contain solution, expand it
  while (npvLow * npvHigh > 0) {
    low *= 2;
    high *= 2;
    npvLow = npvWithDates(dates, cashflows, low, startDate);
    npvHigh = npvWithDates(dates, cashflows, high, startDate);
  }

  for (let i = 0; i < maxIterations; i++) {
    mid = (low + high) / 2;
    const npvMid = npvWithDates(dates, cashflows, mid, startDate);

    // Check for convergence
    if (Math.abs(npvMid) < tolerance) {
      return mid;
    }

    // Update bounds
    if (npvLow * npvMid < 0) {
      high = mid;
    } else {
      low = mid;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    iterations++;
  }

  // throw new Error(
  //   `Bisection method failed to converge within maximum iterations.\n
  //   ${startDate}\n
  //   ${JSON.stringify(dates)}\n
  //   ${JSON.stringify(cashflows)}\n
  //   `,
  // );

  // 记录错误信息
  // console.warn(
  //   `Bisection method failed to converge within maximum iterations.\n` +
  //     `startDate: ${startDate}\n` +
  //     `dates: ${JSON.stringify(dates)}\n` +
  //     `cashflows: ${JSON.stringify(cashflows)}\n`,
  // );

  return 0;
}

// Calculate XIRR using Newton-Raphson method
function XIRR(cashflows, dates, initialGuess, maxIterations, tolerance) {
  // 处理季度
  // dates = dates.map((item) => {
  //   if (/^\d{4}-[1-4]$/.test(item)) {
  //     return getQuarterDateRange(item).start;
  //   }
  //   return item;
  // });

  const startDate = dates[0]; // Use first date as reference date
  let rate = initialGuess || 0.1; // Default guess is 10%
  let iterations = 0;
  const maxIter = maxIterations || 1000;

  // eslint-disable-next-line unicorn/prefer-default-parameters
  const tol = tolerance || 1e-14;
  const eps = 1e-8; // Small increment for numerical differentiation

  do {
    const npvVal = npvWithDates(dates, cashflows, rate, startDate);

    // Use central difference for derivative
    const npvPlus = npvWithDates(dates, cashflows, rate + eps, startDate);
    const npvMinus = npvWithDates(dates, cashflows, rate - eps, startDate);
    const npvPrime = (npvPlus - npvMinus) / (2 * eps);

    // Check if derivative is near zero
    if (Math.abs(npvPrime) < tol) {
      // If derivative is near zero, switch to bisection
      return xirrWithBisection(dates, cashflows, tol, startDate);
    }

    // Update rate
    const newRate = rate - npvVal / npvPrime;

    // Check for convergence
    if (Math.abs(newRate - rate) < tol) {
      return newRate;
    }

    rate = newRate;
    iterations++;
  } while (iterations < maxIter);

  // If Newton-Raphson fails, switch to bisection
  return xirrWithBisection(dates, cashflows, tol, startDate);
}

// Example usage:
// const dates = ["2024/07/01", "2025/01/01", "2025/07/01", "2026/01/01", "2026/07/01"];
// const cashflows = [-8000, -8000, 388, 876, 1183];
// const result = XIRR(cashflows, dates);
// console.log("XIRR:", result);

export {
  dateToExcelSerial,
  npvWithDates,
  XIRR,
  xirrWithBisection,
  yearsBetweenDates,
};
