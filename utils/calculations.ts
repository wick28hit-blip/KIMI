
import { addDays, format, differenceInDays, parseISO, isSameDay, isWithinInterval, subDays, startOfDay } from 'date-fns';
import { CycleData, UserProfile, CycleHistory, DailyLog, PredictionResult } from '../types';

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
      isConfirmed: false, // Pending calibration
      lifestyleImpact: initialImpact // Track initial impact for volatility
    });
  }
  
  // Return sorted by date (oldest first)
  return history.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

// --- NEW ENGINES ---

// 1. Rolling Variance Engine
const calculateRollingVariance = (history: CycleHistory[], currentCycleLength: number): number => {
  // We need at least 2 cycles to calculate variance. 
  // If history is short, we assume a standard variance (e.g., 1.5 days).
  if (history.length < 2) return 1.5;

  // Take last 6 cycles max
  const recentHistory = history.slice(-6);
  
  // Calculate lengths
  // Note: We need consecutive cycles to calculate true length between starts.
  // For simplicity in this structure, we'll assume the gap between history[i] and history[i+1] is the length.
  const lengths: number[] = [];
  
  for (let i = 0; i < recentHistory.length - 1; i++) {
    const start1 = parseISO(recentHistory[i].startDate);
    const start2 = parseISO(recentHistory[i+1].startDate);
    const length = differenceInDays(start2, start1);
    lengths.push(length);
  }
  
  // Include the current average setting as a data point
  lengths.push(currentCycleLength);

  if (lengths.length < 2) return 1.5;

  const mean = lengths.reduce((sum, val) => sum + val, 0) / lengths.length;
  const squaredDiffs = lengths.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / lengths.length;
  
  return Math.sqrt(avgSquaredDiff); // Std Dev
};

// 2. Lifestyle Volatility Score
const calculateLifestyleVolatility = (history: CycleHistory[], currentImpact: number): number => {
  // Use last 3 cycles
  const recentHistory = history.slice(-3);
  
  // Collect impact factors
  const impacts: number[] = recentHistory.map(h => Math.abs(h.lifestyleImpact || 0));
  impacts.push(Math.abs(currentImpact));
  
  if (impacts.length === 0) return 0;
  
  // Average absolute shift
  const totalShift = impacts.reduce((sum, val) => sum + val, 0);
  return totalShift / impacts.length;
};

// --- CORE ALGORITHM ---

// A. Base + B. ML + New Variance/Volatility Logic
export const calculateCycle = (cycleData: CycleData): PredictionResult | null => {
  if (!cycleData.lastPeriodDate) return null;

  const lastPeriod = parseISO(cycleData.lastPeriodDate);
  
  // 1. Variance & Volatility
  const cycleVariance = calculateRollingVariance(cycleData.history, cycleData.cycleLength);
  const lifestyleVolatility = calculateLifestyleVolatility(cycleData.history, cycleData.lifestyleOffset);
  
  // 3. Prediction Range Width
  const predictionRange = cycleVariance + lifestyleVolatility;
  
  // 4. Accuracy Window
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

  // 5. Final Prediction
  // Base
  const basePrediction = addDays(lastPeriod, cycleData.cycleLength);
  
  // Net Lifestyle Shift (Current)
  // We use the current lifestyle offset as the specific shift for this coming period
  const netShift = cycleData.lifestyleOffset || 0;
  
  // Adaptive Learning Adjustments (Trend)
  const adaptiveAdjustment = (cycleData.varianceOffset || 0) * (cycleData.adaptiveWeight || 0);

  // Final Date
  const finalPredictionDate = addDays(basePrediction, netShift + adaptiveAdjustment);
  
  const nextPeriodEnd = addDays(finalPredictionDate, cycleData.periodDuration);
  
  // Ovulation (14 days before period)
  const ovulationDate = subDays(finalPredictionDate, 14);
  const fertileStart = subDays(ovulationDate, 5);
  const fertileEnd = addDays(ovulationDate, 1);

  return {
    lastPeriod,
    nextPeriodDate: finalPredictionDate,
    nextPeriodEnd,
    ovulationDate,
    fertileWindow: {
      start: fertileStart,
      end: fertileEnd
    },
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

// Helper for Adaptive Learning
export const calculateRollingStdDev = (history: CycleHistory[]): number => {
    if (history.length < 2) return 0;
    // ... simplified logic (already implemented in rollingVariance above, but specific for adaptive variance)
    return calculateRollingVariance(history, 28); // Fallback
};

export const calculateTrendingDirection = (history: CycleHistory[]): number => {
    if (history.length < 3) return 0;
    // Check if lengths are increasing or decreasing
    let increasing = 0;
    let decreasing = 0;
    
    for(let i=0; i<history.length-2; i++) {
        const d1 = parseISO(history[i].startDate);
        const d2 = parseISO(history[i+1].startDate);
        const d3 = parseISO(history[i+2].startDate);
        const len1 = differenceInDays(d2, d1);
        const len2 = differenceInDays(d3, d2);
        
        if (len2 > len1) increasing++;
        if (len2 < len1) decreasing++;
    }
    
    if (increasing > decreasing) return 1;
    if (decreasing > increasing) return -1;
    return 0;
};

// E. Adaptive Learning Recalibration
export const recalibrateCycle = (
    currentCycle: CycleData, 
    actualDate: string
): CycleData => {
    const calc = calculateCycle(currentCycle);
    if (!calc) return currentCycle;

    const predicted = calc.nextPeriodDate;
    const actual = parseISO(actualDate);
    
    // Prediction Error
    const errorDays = differenceInDays(actual, predicted);
    
    // Confidence Score update
    // Base 100, subtract 10 for every day off
    const confidenceScore = Math.max(0, 100 - (Math.abs(errorDays) * 10));
    
    let adaptiveWeight = currentCycle.adaptiveWeight || 0;
    
    // If error > 2 days, increase weight on lifestyle factors
    if (Math.abs(errorDays) > 2) {
        adaptiveWeight += 0.1; // Increase sensitivity
    } else {
        adaptiveWeight = Math.max(0, adaptiveWeight - 0.05); // Decrease sensitivity if accurate
    }

    // Variance & Trend
    const cycleVariance = calculateRollingVariance(currentCycle.history, currentCycle.cycleLength);
    const trend = calculateTrendingDirection(currentCycle.history);
    
    const varianceOffset = cycleVariance * trend;

    // Add new confirmed cycle to history
    // Note: We need to close the previous "future" cycle logic.
    // Ideally, we find the cycle in history closest to this or append.
    // For this simple model, we assume this IS the new period start.
    const newHistoryEntry: CycleHistory = {
        startDate: actualDate,
        endDate: format(addDays(actual, currentCycle.periodDuration), 'yyyy-MM-dd'),
        isConfirmed: true,
        lifestyleImpact: currentCycle.lifestyleOffset // Store the impact that was active during this cycle
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
        varianceOffset,
        // Cache new metrics
        lastVariance: cycleVariance,
        lastVolatility: calc.volatility
    };
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

  if (yesterdayLog?.habits?.alcohol?.value && daysToNextPeriod > 0 && daysToNextPeriod <= 3) {
    return "⚠️ Alcohol can delay your period. Drink water to balance!";
  }
  if (todayLog && todayLog.waterIntake <= 4 && isOnPeriod) {
    return "💧 Stay hydrated! It helps reduce cramps.";
  }
  if (todayLog?.exercise?.performed && isFertile) {
    return "✨ Great timing! Exercise boosts fertility hormones.";
  }

  return null;
};
