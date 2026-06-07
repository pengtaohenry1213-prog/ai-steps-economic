import { calculate } from './Q10000A0045';
import { IFERROR, IRR } from './sumIfNpvIrr';

function iRRResult(cashFlows, periodMonths) {
  // Calculate IRR
  const irrValue = IRR(cashFlows, 0.000_01); // tolerance of 0.00001

  // Handle potential errors in IRR calculation
  const irrResult = IFERROR(irrValue, 'false');

  // If IRR calculation failed, return "false"
  if (irrResult === 'false') {
    return 'false';
  }

  // Convert to annualized return
  return (1 + irrResult) ** (12 / periodMonths) - 1;
}

// Function to generate cash flows and calculate IRR
function irrs(
  periodNumber,
  periodMonths,
  Q10000A0001,
  Q10000A0008,
  Q10000A0009,
  Q10000A0039,
  Q10000A0042,
) {
  const cashFlows = [];

  for (let periodCount = 1; periodCount <= periodNumber; periodCount++) {
    const a = calculate(
      Q10000A0001,
      Q10000A0008,
      Q10000A0009,
      Q10000A0039,
      Q10000A0042,
      periodCount,
      periodMonths,
    );
    cashFlows.push(a);
  }

  return iRRResult(cashFlows, periodMonths);
}

export { iRRResult, irrs };
