export type TFn = (key: string) => string;
export type FrequencyType = 'days_of_week' | 'days_of_month' | 'some_days';
export const everyWeekDay = () => [true, true, true, true, true, true, true];

export const getOrdinalSuffix = (day: number, t: TFn) => {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}${t('first')}`;
    case 2: return `${day}${t('second')}`;
    case 3: return `${day}${t('third')}`;
    default: return `${day}${t('th')}`;
  }
};

export const formatMonthDaysDisplay = (days: number[], t: TFn): string => {
  if (days.length === 0) return t('selectAtLeast1Day');

  const sorted = [...days].sort((a, b) => a - b);
  const ranges: string[] = [];
  let rangeStart = sorted[0];
  let prevDay = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const currentDay = sorted[i];
    if (currentDay !== prevDay + 1) {
      if (rangeStart === prevDay) {
        ranges.push(getOrdinalSuffix(rangeStart, t));
      } else if (prevDay === rangeStart + 1) {
        ranges.push(`${getOrdinalSuffix(rangeStart, t)}, ${getOrdinalSuffix(prevDay, t)}`);
      } else {
        ranges.push(`${getOrdinalSuffix(rangeStart, t)} - ${getOrdinalSuffix(prevDay, t)}`);
      }
      rangeStart = currentDay;
    }
    prevDay = currentDay;
  }
  return `${ranges.join(', ')} ${t('ofEachMonth')}`;
};

export const describeWeekDays = (daysArr: boolean[], t: TFn): string => {
  const [sun, mon, tue, wed, thu, fri, sat] = daysArr;
  const count = daysArr.filter(Boolean).length;
  const dayNames = [t('Sunday'), t('Monday'), t('Tuesday'), t('Wednesday'), t('Thursday'), t('Friday'), t('Saturday')];
  if (count === 7) {
    return t('everyday');
  } else if (count === 6) {
    const missingIndex = daysArr.findIndex((val) => !val);
    return `${t('everydayBut')} ${dayNames[missingIndex]}`;
  } else if (count === 5 && mon && tue && wed && thu && fri && !sun && !sat) {
    return t('weekdays');
  } else if (count === 3 && tue && wed && thu && !sun && !mon && !fri && !sat) {
    return t('midweek');
  } else if (count === 2 && sun && sat && !mon && !tue && !wed && !thu && !fri) {
    return t('weekend');
  } else if (count === 4 || count === 5) {
    const extendedDays = [...daysArr, ...daysArr];
    let startIdx = -1;
    for (let i = 0; i < 7; i++) {
      let isConsecutive = true;
      for (let j = 0; j < count; j++) {
        if (!extendedDays[i + j]) {
          isConsecutive = false;
          break;
        }
      }
      if (isConsecutive) {
        startIdx = i;
        break;
      }
    }

    if (startIdx !== -1) {
      const endIdx = (startIdx + count - 1) % 7;
      return `${t('from')}${dayNames[startIdx]} ${t('to')} ${dayNames[endIdx]}`;
    }
  } else if (count === 0) {
    return t('selectAtLeast1Day');
  }
  return daysArr
    .map((isSelected, index) => (isSelected ? dayNames[index] : null))
    .filter(Boolean)
    .join(', ');
};
