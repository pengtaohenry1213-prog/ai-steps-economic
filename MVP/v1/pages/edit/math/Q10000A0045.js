import { AVERAGE } from './sumIfNpvIrr';

function calculate(
  Q10000A0001,
  Q10000A0008,
  Q10000A0009,
  Q10000A0039,
  Q10000A0042,
  periodCount,
  periodMonths,
) {
  const term1 =
    -Q10000A0001 *
    (Math.min((periodCount * periodMonths) / 12 / Q10000A0008, 1) -
      Math.min(((periodCount - 1) * periodMonths) / 12 / Q10000A0008, 1));

  const term2 =
    ((Q10000A0039 + Q10000A0042) *
      AVERAGE(
        Math.min(
          Math.max(((periodCount - 1) * periodMonths) / 12 - Q10000A0008, 0),
          Q10000A0009,
        ),
        Math.min(
          Math.max((periodCount * periodMonths) / 12 - Q10000A0008, 0),
          Q10000A0009,
        ),
      )) /
    Q10000A0009;

  return term1 + term2;
}

function calculateCount(
  periodNumber,
  periodMonths,
  Q10000A0001,
  Q10000A0008,
  Q10000A0009,
  Q10000A0038,
  Q10000A0042,
) {
  let sum = 0;
  for (let periodCount = 1; periodCount <= periodNumber; periodCount++) {
    const a = calculate(
      Q10000A0001,
      Q10000A0008,
      Q10000A0009,
      Q10000A0038,
      Q10000A0042,
      periodCount,
      periodMonths,
    );
    sum += a;
  }
  return sum;
}

export { calculate, calculateCount };
