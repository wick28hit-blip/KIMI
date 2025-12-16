import { addDays, differenceInDays, parseISO, isSameDay, isWithinInterval, subDays } from 'date-fns';
import { CycleData, UserProfile, PMSAnalysis, DailyLog } from '../types';

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
 * Calculates Recommended Daily Water Intake.
 * Formula: Body Weight (kg) * N
 * N varies by age group.
 */
export const calculateWaterTarget = (age: number, weight: number): number => {
  if (!age || !weight) return 2000;
  
  let n = 35; // Default for 18-30 or young adults
  
  if (age >= 18 && age <= 30) {
    n = 35;
  } else if (age >= 31 && age <= 55) {
    n = 33;
  } else if (age > 55) {
    n = 30;
  } else {
    // Fallback for < 18, assuming similar needs to young adults for active growing bodies
    n = 35;
  }

  // Calculate and round to nearest 50 for cleaner UI numbers
  return Math.ceil((weight * n) / 50) * 50;
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
  
  // ALGORITHM UPDATE:
  // User definition: "If cycle is 28 days, the 28th day is the NEXT period start."
  // This implies the interval between periods is (CycleLength - 1).
  // Standard medical definition is usually exact CycleLength, but we adhere to user preference here.
  const effectiveInterval = Math.max(20, cycleData.cycleLength - 1); 

  // Calculate Cycle Projection
  // We project "theoretical" cycles if the user hasn't logged for a while (e.g. > 1 cycle length)
  const daysSinceOriginal = differenceInDays(today, originalLastPeriod);
  
  let currentCycleStart = originalLastPeriod;
  
  // Only project if we are past the first cycle
  if (daysSinceOriginal >= effectiveInterval) {
      const cyclesPassed = Math.floor(daysSinceOriginal / effectiveInterval);
      currentCycleStart = addDays(originalLastPeriod, cyclesPassed * effectiveInterval);
  }
  
  // Calculate PMS Impact (Delay)
  const impactDelay = pmsAnalysis.maxDelay;
  
  // Adjusted Length adds delay to the interval
  const adjustedCycleInterval = effectiveInterval + impactDelay;

  // Next Period is based on the CURRENT theoretical start
  const nextPeriodDate = addDays(currentCycleStart, adjustedCycleInterval);
  
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

export const getContextAwareHealthTip = (log: DailyLog | undefined, cycleStatus: string, dayOfCycle: number) => {
  // Default tip based on cycle status
  let tip = {
    title: "Daily Insight",
    message: "Tracking your symptoms helps us provide better insights.",
    icon: "Sparkles",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/20"
  };

  // Phase based advice
  if (cycleStatus === 'period' || cycleStatus === 'period_past') {
     tip = { 
       title: "Menstrual Phase", 
       message: "Your body is shedding the lining. Energy might be low. Prioritize warmth and rest.", 
       icon: "Moon", 
       color: "text-[#E84C7C]",
       bg: "bg-pink-50 dark:bg-pink-900/20"
     };
  } else if (cycleStatus === 'ovulation' || cycleStatus === 'fertile') {
     tip = { 
       title: "Ovulation Phase", 
       message: "Estrogen is peaking. You likely feel energetic, confident, and social.", 
       icon: "Star", 
       color: "text-purple-500",
       bg: "bg-purple-50 dark:bg-purple-900/20"
     };
  } else if (dayOfCycle > 14 && cycleStatus === 'none') { // Luteal approximation
     tip = { 
       title: "Luteal Phase", 
       message: "Progesterone rises. You might feel inward or slower. Gentle yoga is great now.", 
       icon: "Coffee", 
       color: "text-indigo-500",
       bg: "bg-indigo-50 dark:bg-indigo-900/20"
     };
  } else if (dayOfCycle <= 14 && cycleStatus === 'none' && dayOfCycle > 5) { // Follicular approximation
      tip = { 
       title: "Follicular Phase", 
       message: "Energy is returning. A great time to start new projects or vigorous exercise.", 
       icon: "Sun", 
       color: "text-yellow-500",
       bg: "bg-yellow-50 dark:bg-yellow-900/20"
     };
  }

  if (!log) return tip;

  // Context Overrides (Priority order)

  // 1. Mood (High Priority)
  if (log.mood && log.mood.length > 0) {
      if (log.mood.includes('Sad') || log.mood.includes('Depressed') || log.mood.includes('Frustrated')) {
          return { 
            title: "Be Gentle With Yourself", 
            message: "It's a heavy day. Comfort food, a warm blanket, or calling a friend might help.", 
            icon: "Heart", 
            color: "text-rose-500",
            bg: "bg-rose-50 dark:bg-rose-900/20"
          };
      }
      if (log.mood.includes('Anxious') || log.mood.includes('Stress') || log.mood.includes('Tension')) {
           return { 
             title: "Breathe Deeply", 
             message: "Anxiety spikes cortisol. Try box breathing: In 4, Hold 4, Out 4, Hold 4.", 
             icon: "Wind", 
             color: "text-cyan-500",
             bg: "bg-cyan-50 dark:bg-cyan-900/20"
           };
      }
  }

  // 2. Symptoms
  if (log.detailedSymptoms && log.detailedSymptoms.length > 0) {
      const cramps = log.detailedSymptoms.find(s => s.name === 'Cramps' || s.name === 'Abdominal cramps');
      if (cramps) {
          return { 
            title: "Soothe the Cramps", 
            message: "Magnesium supplements, heat patches, or ginger tea are excellent for relief.", 
            icon: "Flame", 
            color: "text-orange-500",
            bg: "bg-orange-50 dark:bg-orange-900/20"
          };
      }
      const headache = log.detailedSymptoms.find(s => s.name === 'Headache' || s.name === 'Migraines');
      if (headache) {
           return { 
             title: "Headache Relief", 
             message: "Dim the lights and drink water. Screen breaks are essential right now.", 
             icon: "EyeOff", 
             color: "text-gray-500",
             bg: "bg-gray-50 dark:bg-gray-700/30"
           };
      }
      const bloating = log.detailedSymptoms.find(s => s.name === 'Bloating');
      if (bloating) {
           return { 
             title: "Beat the Bloat", 
             message: "Avoid salty foods today. Peppermint tea or fennel seeds can aid digestion.", 
             icon: "Coffee", 
             color: "text-green-500",
             bg: "bg-green-50 dark:bg-green-900/20"
           };
      }
  }

  // 3. Sleep (If logged and low) - Checked only if no severe symptoms/mood
  if (log.sleepDuration > 0 && log.sleepDuration < 360) { // < 6 hours
      return { 
        title: "Rest Required", 
        message: "You didn't get much sleep. Take it easy today and aim for an early bedtime.", 
        icon: "Moon", 
        color: "text-indigo-500",
        bg: "bg-indigo-50 dark:bg-indigo-900/20"
      };
  }

  // 4. Hydration (If logged and low in afternoon) 
  if (log.waterIntake > 0 && log.waterIntake < 1000) {
      return { 
        title: "Hydration Alert", 
        message: "Your water intake is low. A glass right now will help with focus and energy.", 
        icon: "Droplet", 
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-900/20"
      };
  }

  return tip;
};