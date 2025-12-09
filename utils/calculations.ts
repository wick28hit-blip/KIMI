import { addDays, differenceInDays, parseISO, isSameDay, isWithinInterval, subDays } from 'date-fns';
import { CycleData, UserProfile, PMSAnalysis } from '../types';

/**
 * Calculates BMI and normalizes it to a 0-10 score for the risk formula.
 * Normalization logic: 
 * BMI 18.5 - 25 is healthy (Score ~0-2)
 * BMI > 25 increases score. 
 * We map BMI range [15, 40] to [0, 10].
 */
export const calculateNormalizedBMI = (heightCm: number, weightKg: number): number => {
  if (!heightCm || !weightKg) return 5;
  
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  
  // Normalize BMI 15-40 to 0-10 scale
  const minBMI = 15;
  const maxBMI = 40;
  
  let normalized = ((bmi - minBMI) / (maxBMI - minBMI)) * 10;
  return Math.max(0, Math.min(10, normalized)); // Clamp between 0-10
};

/**
 * Calculates PMS Risk Score based on research-based weights.
 * 
 * Formula:
 * PMS_Risk_Score = (0.18 * S) + (0.26 * SL) + (0.51 * A) + (0.41 * D) + (0.07 * B) + (0.008 * F)
 */
export const analyzePMSRisk = (user?: UserProfile): PMSAnalysis => {
  if (!user || !user.pmsData) {
    return { score: 0, severity: 'Low', minDelay: 0, maxDelay: 0 };
  }

  const { stress, sleep, anxiety, depression, bmi, diet } = user.pmsData;

  // Weights
  const w_stress = 0.18;
  const w_sleep = 0.26;
  const w_anxiety = 0.51;
  const w_depression = 0.41;
  const w_BMI = 0.07;
  const w_diet = 0.008;

  const score = (w_stress * stress) 
              + (w_sleep * sleep) 
              + (w_anxiety * anxiety) 
              + (w_depression * depression) 
              + (w_BMI * bmi) 
              + (w_diet * diet);

  // Severity Classification
  let severity: 'Low' | 'Moderate' | 'High' = 'Low';
  let minDelay = 0;
  let maxDelay = 0;

  if (score < 4) {
    severity = 'Low';
    minDelay = 0;
    maxDelay = 0;
  } else if (score >= 4 && score <= 7) {
    severity = 'Moderate';
    minDelay = 1;
    maxDelay = 2;
  } else {
    severity = 'High';
    minDelay = 2;
    maxDelay = 4;
  }

  return {
    score: parseFloat(score.toFixed(2)),
    severity,
    minDelay,
    maxDelay
  };
};

export const calculateCycle = (cycleData: CycleData, user?: UserProfile) => {
  if (!cycleData.lastPeriodDate) return null;

  const pmsAnalysis = analyzePMSRisk(user);
  
  // Base Last Period (The confirmed log)
  const originalLastPeriod = parseISO(cycleData.lastPeriodDate);
  const today = new Date();
  
  // Calculate Cycle Projection
  // We project "theoretical" cycles if the user hasn't logged for a while (e.g. > 1 cycle length)
  // This ensures the dashboard shows "Day 5" instead of "Day 385".
  const daysSinceOriginal = differenceInDays(today, originalLastPeriod);
  const cycleLen = cycleData.cycleLength;
  
  let currentCycleStart = originalLastPeriod;
  
  // Only project if we are past the first cycle
  if (daysSinceOriginal >= cycleLen) {
      const cyclesPassed = Math.floor(daysSinceOriginal / cycleLen);
      currentCycleStart = addDays(originalLastPeriod, cyclesPassed * cycleLen);
  }
  
  // Calculate PMS Impact (Delay)
  const impactDelay = pmsAnalysis.maxDelay;
  const adjustedCycleLength = cycleLen + impactDelay;

  // Next Period is based on the CURRENT theoretical start
  const nextPeriodDate = addDays(currentCycleStart, adjustedCycleLength);
  
  // Subtract 1 day because interval is inclusive
  const nextPeriodEnd = addDays(nextPeriodDate, Math.max(0, cycleData.periodDuration - 1));
  
  // Ovulation is roughly 14 days before the NEXT period
  const ovulationDate = subDays(nextPeriodDate, 14);
  
  const fertileStart = subDays(ovulationDate, 5);
  const fertileEnd = addDays(ovulationDate, 1);

  return {
    lastPeriod: originalLastPeriod,
    currentCycleStart, // The start of the current active/theoretical cycle
    nextPeriodDate,
    nextPeriodEnd,
    ovulationDate,
    fertileWindow: {
      start: fertileStart,
      end: fertileEnd
    },
    isImpacted: impactDelay > 0,
    impactDelay,
    pmsAnalysis
  };
};

export const getDayStatus = (date: Date, cycleData: CycleData, user?: UserProfile) => {
  const calc = calculateCycle(cycleData, user);
  if (!calc) return 'none';

  // Check predicted next period
  if (isWithinInterval(date, { start: calc.nextPeriodDate, end: calc.nextPeriodEnd })) {
    return 'period'; // Predicted Future Period
  }

  // Check CURRENT theoretical period (if we are in days 1-5 of current cycle)
  const currentPeriodEnd = addDays(calc.currentCycleStart, Math.max(0, cycleData.periodDuration - 1));
  if (isWithinInterval(date, { start: calc.currentCycleStart, end: currentPeriodEnd })) {
    // If this is the original logged period, it's 'period_past', otherwise it's a predicted 'period'
    if (isSameDay(calc.currentCycleStart, calc.lastPeriod)) {
        return 'period_past';
    }
    return 'period'; // Theoretical current period
  }

  // Check predicted ovulation
  if (isSameDay(date, calc.ovulationDate)) {
    return 'ovulation';
  }

  // Check fertile window
  if (isWithinInterval(date, { start: calc.fertileWindow.start, end: calc.fertileWindow.end })) {
    return 'fertile';
  }

  return 'none';
};