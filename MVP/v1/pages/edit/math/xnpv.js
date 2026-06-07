// Helper function: Convert date string to timestamp
function dateToSerial(dateStr) {
  const parts = dateStr.match(/(\d+)\D+(\d+)\D+(\d+)/);
  const year = Number.parseInt(parts[1], 10);
  const month = Number.parseInt(parts[2], 10) - 1; // JavaScript months are 0-indexed
  const day = Number.parseInt(parts[3], 10);
  return new Date(year, month, day).getTime();
}

// // Calculate days between two dates
function daysBetweenDates(startDate, endDate) {
  const diffMs = dateToSerial(endDate) - dateToSerial(startDate);
  return diffMs / (1000 * 60 * 60 * 24); // Convert milliseconds to days
}

// // XNPV function 有bug，仅支持2个指标code
// function XNPV(a, b, dates, rate = 0) {
//   let npv = 0;
//   console.log(dates);
//   const startDate = dates[0]; // JavaScript arrays are 0-indexed

//   [a, b].forEach((cashflow, i) => {
//     const currentDate = dates[i];
//     const days = daysBetweenDates(startDate, currentDate);
//     npv += cashflow / (1 + rate) ** (days / 365);
//   });

//   return npv;
// }
// XNPV((0),(0),(["2025","2026","2027","2028","2029","2030","2031","2032","2033","2034","2035","2036","2037","2038","2039","2040","2041","2042","2043","2044"]))

// Example usage:
// const rate = 0.375;  // Discount rate 37.5%
// const values = [-8000, -8000, 388, 876, 1183];  // Cash flows
// const dates = ["2024/07/01", "2025/01/01", "2025/07/0
// 1", "2026/01/01", "2026/07/01"];  // Dates
// const result = XNPV(rate, values, dates);
// console.log("XNPV:", result);

/**
 * 计算现金流的净现值（XNPV）
 * @param {number} rate 贴现率
 * @param {number[]} values 现金流数组（包含初始投资）
 * @param {Date[]} dates 对应的日期数组
 * @returns {number} 净现值
 */
function XNPV(rate, values, dates) {
  // 参数验证
  if (values.length !== dates.length) {
    throw new Error('现金流数组和日期数组长度必须相同');
  }
  if (values.length === 0) {
    return 0;
  }

  // 获取基准日期（第一个日期）
  const firstDate = new Date(dates[0]);

  let xnpv = 0;
  if (Array.isArray(values)) {
    for (const [i, value] of values.entries()) {
      // 计算天数差
      const currentDate = new Date(dates[i]);
      const daysDiff = (currentDate - firstDate) / (1000 * 60 * 60 * 24);

      // 计算现值并累加
      xnpv += value / (1 + rate) ** (daysDiff / 365);
    }
  }
  // else {
  //   debugger
  // }

  return xnpv;
}

export { dateToSerial, daysBetweenDates, XNPV };
