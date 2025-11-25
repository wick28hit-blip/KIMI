import { addDays, format, differenceInDays, parseISO, isSameDay, isWithinInterval, subDays } from 'date-fns';
import { CycleData } from '../types';

export const calculateCycle = (cycleData: CycleData) => {
  if (!cycleData.lastPeriodDate) return null;

  const lastPeriod = parseISO(cycleData.lastPeriodDate);
  const nextPeriodDate = addDays(lastPeriod, cycleData.cycleLength);
  const nextPeriodEnd = addDays(nextPeriodDate, cycleData.periodDuration);
  
  // Ovulation is roughly 14 days before the NEXT period
  const ovulationDate = subDays(nextPeriodDate, 14);
  
  const fertileStart = subDays(ovulationDate, 5);
  const fertileEnd = addDays(ovulationDate, 1);

  return {
    lastPeriod,
    nextPeriodDate,
    nextPeriodEnd,
    ovulationDate,
    fertileWindow: {
      start: fertileStart,
      end: fertileEnd
    }
  };
};

export const getDayStatus = (date: Date, cycleData: CycleData) => {
  const calc = calculateCycle(cycleData);
  if (!calc) return 'none';

  // Check predicted period
  if (isWithinInterval(date, { start: calc.nextPeriodDate, end: calc.nextPeriodEnd })) {
    return 'period';
  }

  // Check predicted ovulation
  if (isSameDay(date, calc.ovulationDate)) {
    return 'ovulation';
  }

  // Check fertile window
  if (isWithinInterval(date, { start: calc.fertileWindow.start, end: calc.fertileWindow.end })) {
    return 'fertile';
  }

  // Check past period (simple check for the immediate last one)
  const lastPeriodEnd = addDays(calc.lastPeriod, cycleData.periodDuration);
  if (isWithinInterval(date, { start: calc.lastPeriod, end: lastPeriodEnd })) {
    return 'period_past';
  }

  return 'none';
};