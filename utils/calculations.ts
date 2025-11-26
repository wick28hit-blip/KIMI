import { addDays, format, differenceInDays, parseISO, isSameDay, isWithinInterval, subDays } from 'date-fns';
import { CycleData, UserProfile, CycleHistory, DailyLog, PredictionResult } from '../types';

export const getLifestyleImpact = (user: UserProfile): number => {
  let impact = 0;
  const { habits, isProfessional } = user;
  if (habits.smoking.value) impact += 2; 
  if (habits.alcohol.value) impact += 2;
  if (habits.stress.value || isProfessional) impact += 2.5;
  if (!habits.sleep.value) impact += 2;
  if (habits.exercise.value) impact -= 0.5;
  return impact;
};

export const generateHistoricalCycles = (
  lastPeriodDate: Date, 
  cycleLength: number, 
  periodDuration: number,
  initialImpact: number = 0
): CycleHistory[] => {
  const history: CycleHistory[] = [];
  for (let i = 1; i <= 3; i++) {
    const pastStart = subDays(lastPeriodDate, cycleLength * i);
    const pastEnd = addDays(pastStart, periodDuration);
    history.push({
      startDate: format(pastStart, 'yyyy-MM-dd'),
      endDate: format(pastEnd, 'yyyy-MM-dd'),
      isConfirmed: false,
      lifestyleImpact: initialImpact
    });
  }
  return history.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

const calculateRollingVariance = (history: CycleHistory[], currentCycleLength: number): number => {
  if (history.length < 2) return 1.5;
  const recentHistory = history.slice(-6);
  const lengths: number[] = [];
  
  for (let i = 0; i < recentHistory.length - 1; i++) {
    const start1 = parseISO(recentHistory[i].startDate);
    const start2 = parseISO(recentHistory[i+1].startDate);
    lengths.push(differenceInDays(start2, start1));
  }
  lengths.push(currentCycleLength);

  if (lengths.length < 2) return 1.5;

  const mean = lengths.reduce((sum, val) => sum + val, 0) / lengths.length;
  const squaredDiffs = lengths.map(val => Math.pow(val - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / lengths.length);
};

const calculateLifestyleVolatility = (history: CycleHistory[], currentImpact: number): number => {
  const recentHistory = history.slice(-3);
  const impacts: number[] = recentHistory.map(h => Math.abs(h.lifestyleImpact || 0));
  impacts.push(Math.abs(currentImpact));
  if (impacts.length === 0) return 0;
  return impacts.reduce((sum, val) => sum + val, 0) / impacts.length;
};

export const calculateCycle = (cycleData: CycleData): PredictionResult | null => {
  if (!cycleData.lastPeriodDate) return null;
  const lastPeriod = parseISO(cycleData.lastPeriodDate);
  
  const cycleVariance = calculateRollingVariance(cycleData.history, cycleData.cycleLength);
  const lifestyleVolatility = calculateLifestyleVolatility(cycleData.history, cycleData.lifestyleOffset);
  const predictionRange = cycleVariance + lifestyleVolatility;
  
  let accuracyDays = 3;
  let confidence = 0.90;
  
  if (predictionRange <= 1.2) {
      accuracyDays = 1;
      confidence = 0.95;
  } else if (predictionRange <= 2.5) {
      accuracyDays = 2;
      confidence = 0.93;
  } else {
      accuracyDays = 3;
      confidence = 0.89;
  }

  const basePrediction = addDays(lastPeriod, cycleData.cycleLength);
  const netShift = cycleData.lifestyleOffset || 0;
  const adaptiveAdjustment = (cycleData.varianceOffset || 0) * (cycleData.adaptiveWeight || 0);
  const finalPredictionDate = addDays(basePrediction, netShift + adaptiveAdjustment);
  const nextPeriodEnd = addDays(finalPredictionDate, cycleData.periodDuration);
  const ovulationDate = subDays(finalPredictionDate, 14);

  return {
    lastPeriod,
    nextPeriodDate: finalPredictionDate,
    nextPeriodEnd,
    ovulationDate,
    fertileWindow: { start: subDays(ovulationDate, 5), end: addDays(ovulationDate, 1) },
    predictionWindow: {
      start: subDays(finalPredictionDate, accuracyDays),
      end: addDays(finalPredictionDate, accuracyDays),
      accuracyDays,
      confidence
    },
    variance: cycleVariance,
    volatility: lifestyleVolatility
  };
};

export const getDayStatus = (date: Date, cycleData: CycleData) => {
  const inHistory = cycleData.history.find(h => {
    const start = parseISO(h.startDate);
    const end = parseISO(h.endDate);
    return isWithinInterval(date, { start, end });
  });

  if (inHistory) return 'period_past';

  const calc = calculateCycle(cycleData);
  if (!calc) return 'none';

  if (isWithinInterval(date, { start: calc.nextPeriodDate, end: calc.nextPeriodEnd })) return 'period';
  if (isSameDay(date, calc.ovulationDate)) return 'ovulation';
  if (isWithinInterval(date, { start: calc.fertileWindow.start, end: calc.fertileWindow.end })) return 'fertile';

  return 'none';
};

export const recalibrateCycle = (currentCycle: CycleData, actualDate: string): CycleData => {
    const calc = calculateCycle(currentCycle);
    if (!calc) return currentCycle;

    const predicted = calc.nextPeriodDate;
    const actual = parseISO(actualDate);
    const errorDays = differenceInDays(actual, predicted);
    
    const confidenceScore = Math.max(0, 100 - (Math.abs(errorDays) * 10));
    let adaptiveWeight = currentCycle.adaptiveWeight || 0;
    
    if (Math.abs(errorDays) > 2) {
        adaptiveWeight += 0.1; 
    } else {
        adaptiveWeight = Math.max(0, adaptiveWeight - 0.05); 
    }

    const trend = 0; // Simplified trend
    const varianceOffset = 1.5 * trend;

    const newHistoryEntry: CycleHistory = {
        startDate: actualDate,
        endDate: format(addDays(actual, currentCycle.periodDuration), 'yyyy-MM-dd'),
        isConfirmed: true,
        lifestyleImpact: currentCycle.lifestyleOffset
    };

    const newHistory = [...currentCycle.history, newHistoryEntry].sort((a,b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return {
        ...currentCycle,
        lastPeriodDate: actualDate,
        history: newHistory,
        adaptiveWeight,
        confidenceScore,
        varianceOffset
    };
};

export const generateRuleBasedInsights = (cycleData: CycleData, logs: Record<string, DailyLog>, today: Date): string | null => {
  const calc = calculateCycle(cycleData);
  if (!calc) return null;

  const todayStr = format(today, 'yyyy-MM-dd');
  const todayLog = logs[todayStr];
  const isOnPeriod = getDayStatus(today, cycleData).includes('period');
  const isFertile = getDayStatus(today, cycleData) === 'fertile';

  if (todayLog && todayLog.waterIntake <= 4 && isOnPeriod) {
    return "💧 Stay hydrated! It helps reduce cramps.";
  }
  if (todayLog?.exercise?.performed && isFertile) {
    return "✨ Great timing! Exercise boosts fertility hormones.";
  }
  return null;
};
