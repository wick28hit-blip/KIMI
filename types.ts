
export interface UserProfile {
  name: string;
  age?: number;
  isProfessional: boolean;
  pin: string; // Hashed in a real app, keeping simple for demo logic
  habits: {
    smoking: { value: boolean; frequency?: string };
    alcohol: { value: boolean; frequency?: string; amount?: string };
    sleep: { value: boolean }; // true = good (7-9h), false = irregular
    stress: { value: boolean }; // true = high, false = managed
    exercise: { value: boolean; frequency?: string; type?: string };
  };
}

export interface CycleHistory {
  startDate: string;
  endDate: string;
  isConfirmed: boolean;
  lifestyleImpact?: number; // Recorded shift factor for volatility calc
}

export interface PredictionWindow {
  start: Date;
  end: Date;
  accuracyDays: number; // +/- days
  confidence: number; // 0.0 - 1.0
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
  lastPeriodDate: string; // ISO Date string
  cycleLength: number;
  periodDuration: number;
  history: CycleHistory[]; // Past 3 months calibration + confirmed cycles
  lifestyleOffset: number; // Calculated impact in days
  
  // Adaptive & Variance Fields
  adaptiveWeight?: number; 
  confidenceScore?: number;
  varianceOffset?: number;
  
  // Cached metrics
  lastVariance?: number;
  lastVolatility?: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  waterIntake: number; // glasses
  mood?: 'happy' | 'neutral' | 'sad' | 'anxious' | 'energetic';
  symptoms: string[];
  intimacy?: 'protected' | 'unprotected' | 'prefer_not_to_say' | 'none';
  notes?: string;
  
  // New Fields
  habits?: {
    smoked?: { value: boolean; amount?: string }; // amount e.g. "5 cigarettes"
    alcohol?: { value: boolean; units?: string }; // units e.g. "2 glasses"
  };
  medication?: {
    taken: boolean;
    types: string[]; // ['Painkillers', 'Antibiotics', 'Hormonal']
  };
  exercise?: {
    performed: boolean;
    type?: 'Cardio' | 'Strength' | 'Yoga' | 'None';
    duration?: number; // minutes
  };
}

export interface AppState {
  view: 'BOOT' | 'ONBOARDING' | 'PIN' | 'HOME' | 'CALENDAR' | 'DAILY_LOG' | 'INSIGHTS' | 'SETTINGS' | 'VAULT_PIN' | 'SECRET_VAULT';
  user: UserProfile | null;
  cycle: CycleData | null;
  logs: Record<string, DailyLog>;
  darkMode: boolean;
}

export enum Colors {
  Primary = '#E84C7C',
  Secondary = '#F47B9C',
  Background = '#FFF0F3',
  Surface = '#FFF9F5',
  Accent = '#7B86CB',
  Text = '#2D2D2D',
}
