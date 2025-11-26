
import { addDays, format, differenceInDays, parseISO, isSameDay, isWithinInterval, subDays } from 'date-fns';
import { CycleData, UserProfile, CycleHistory, DailyLog } from '../types';

// C. Lifestyle Impact Matrix (Medical Research Based)
export const getLifestyleImpact = (user: UserProfile): number => {
  let impact = 0;
  const { habits, isProfessional } = user;

  // Smoking Impact: Daily smoker (+1 to +3 days)
  if (habits.smoking.value) {
    impact += 2; 
  }

  // Alcohol Impact: Heavy drinking (+2 days)
  if (habits.alcohol.value) {
    impact += 2;
  }

  // Stress Impact: High stress or Professional (+1 to +4 days)
  if (habits.stress.value || isProfessional) {
    impact += 2.5;
  }

  // Sleep Deprivation: <6 hours (+2 days) - false means irregular/bad sleep
  if (!habits.sleep.value) {
    impact += 2;
  }

  // Exercise: Moderate (-0.5), we assume value=true is moderate/good
  if (habits.exercise.value) {
    impact -= 0.5;
  }

  return impact;
};

// D. Three-Month Historical Calibration
export const generateHistoricalCycles = (
  lastPeriodDate: Date, 
  cycleLength: number, 
  periodDuration: number
): CycleHistory[] => {
  const history: CycleHistory[] = [];
  
  for (let i = 1; i <= 3; i++) {
    const pastStart = subDays(lastPeriodDate, cycleLength * i);
    const pastEnd = addDays(pastStart, periodDuration);
    
    history.push({
      startDate: format(pastStart, 'yyyy-MM-dd'),
      endDate: format(pastEnd, 'yyyy-MM-dd'),
      isConfirmed: false // Pending calibration
    });
  }
  
  // Return sorted by date (oldest first)
  return history.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

// A. Base Calculation + B. Machine Learning Adjustments
export const calculateCycle = (cycleData: CycleData) => {
  if (!cycleData.lastPeriodDate) return null;

  const lastPeriod = parseISO(cycleData.lastPeriodDate);
  
  // Apply Lifestyle Offset to the Cycle Length for prediction
  const adjustedCycleLength = cycleData.cycleLength + (cycleData.lifestyleOffset || 0);
  
  const nextPeriodDate = addDays(lastPeriod, adjustedCycleLength);
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
  // 1. Check History First (Historical Calibration)
  const dateStr = format(date, 'yyyy-MM-dd');
  const inHistory = cycleData.history.find(h => {
    const start = parseISO(h.startDate);
    const end = parseISO(h.endDate);
    return isWithinInterval(date, { start, end });
  });

  if (inHistory) {
    return 'period_past';
  }

  // 2. Future Predictions
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

  // Check immediate last period (Base Reference)
  const lastPeriodEnd = addDays(calc.lastPeriod, cycleData.periodDuration);
  if (isWithinInterval(date, { start: calc.lastPeriod, end: lastPeriodEnd })) {
    return 'period_past';
  }

  return 'none';
};

// Generate Rule-Based Insights
export const generateRuleBasedInsights = (
  cycleData: CycleData,
  logs: Record<string, DailyLog>,
  today: Date
): string | null => {
  const calc = calculateCycle(cycleData);
  if (!calc) return null;

  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
  
  const todayLog = logs[todayStr];
  const yesterdayLog = logs[yesterdayStr];
  
  const daysToNextPeriod = differenceInDays(calc.nextPeriodDate, today);
  const isOnPeriod = getDayStatus(today, cycleData).includes('period');
  const isFertile = getDayStatus(today, cycleData) === 'fertile';

  // Rule 1: Alcohol & Period Delay
  // Logic: If heavy drinking yesterday (we assume presence of alcohol log implies drinking) AND due period in 3 days
  if (yesterdayLog?.habits?.alcohol?.value && daysToNextPeriod > 0 && daysToNextPeriod <= 3) {
    return "⚠️ Alcohol can delay your period. Drink water to balance!";
  }

  // Rule 2: Low Water & Period Cramps
  // Logic: If low water intake (<= 4 glasses) AND on period
  if (todayLog && todayLog.waterIntake <= 4 && isOnPeriod) {
    return "💧 Stay hydrated! It helps reduce cramps.";
  }

  // Rule 3: Exercise & Fertility
  // Logic: If exercise logged AND fertile window
  if (todayLog?.exercise?.performed && isFertile) {
    return "✨ Great timing! Exercise boosts fertility hormones.";
  }

  return null;
};
