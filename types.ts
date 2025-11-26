export interface UserProfile {
  name: string;
  age?: number;
  isProfessional: boolean;
  pin: string;
  habits: {
    smoking: { value: boolean; frequency?: string };
    alcohol: { value: boolean; frequency?: string; amount?: string };
    sleep: { value: boolean }; 
    stress: { value: boolean };
    exercise: { value: boolean; frequency?: string; type?: string };
  };
}

export interface CycleHistory {
  startDate: string;
  endDate: string;
  isConfirmed: boolean;
  lifestyleImpact?: number;
}

export interface PredictionWindow {
  start: Date;
  end: Date;
  accuracyDays: number;
  confidence: number;
}

export interface PredictionResult {
  lastPeriod: Date;
  nextPeriodDate: Date;
  nextPeriodEnd: Date;
  ovulationDate: Date;
  fertileWindow: { start: Date; end: Date };
  predictionWindow: PredictionWindow;
  variance: number;
  volatility: number;
}

export interface CycleData {
  lastPeriodDate: string;
  cycleLength: number;
  periodDuration: number;
  history: CycleHistory[];
  lifestyleOffset: number;
  adaptiveWeight?: number; 
  confidenceScore?: number;
  varianceOffset?: number;
}

export interface DailyLog {
  date: string;
  waterIntake: number;
  mood?: 'happy' | 'neutral' | 'sad' | 'anxious' | 'energetic';
  symptoms: string[];
  intimacy?: 'protected' | 'unprotected' | 'prefer_not_to_say' | 'none';
  notes?: string;
  habits?: {
    smoked?: { value: boolean; amount?: string };
    alcohol?: { value: boolean; units?: string };
  };
  medication?: {
    taken: boolean;
    types: string[];
  };
  exercise?: {
    performed: boolean;
    type?: 'Cardio' | 'Strength' | 'Yoga' | 'None';
    duration?: number;
  };
}

export interface AppState {
  view: 'BOOT' | 'ONBOARDING' | 'PIN' | 'HOME' | 'CALENDAR' | 'DAILY_LOG' | 'INSIGHTS' | 'SETTINGS' | 'VAULT_PIN' | 'SECRET_VAULT';
  user: UserProfile | null;
  cycle: CycleData | null;
  logs: Record<string, DailyLog>;
  darkMode: boolean;
}
