export interface UserProfile {
  id: string;
  name: string;
  relationship: 'Self' | 'Daughter' | 'Sister' | 'Friend' | 'Other';
  age?: number;
  pin: string; // The primary user's PIN unlocks the whole app
  notificationsEnabled?: boolean; // New field for preference
  
  // New PMS Prediction Data
  pmsData: {
    stress: number;      // 0-10
    sleep: number;       // 0-10 (0=Good, 10=Bad/Issues to match risk formula weights)
    anxiety: number;     // 0-10
    depression: number;  // 0-10
    height: number;      // cm
    weight: number;      // kg
    bmi: number;         // Normalized 0-10
    diet: number;        // 0-10 (Defaulted for formula)
  };
}

export interface CycleData {
  lastPeriodDate: string; // ISO Date string
  cycleLength: number;
  periodDuration: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  waterIntake: number; // glasses
  flow?: 'Spotting' | 'Light' | 'Medium' | 'Heavy' | null;
  mood: string[]; // Changed to array for multi-select
  symptoms: string[];
  // New Tracking Fields
  medication: boolean;
  didExercise: boolean;
  habits: {
    smoked: boolean;
    drank: boolean;
  };
  intimacy?: 'none' | 'protected' | 'unprotected';
  notes?: string;
}

export interface ProfileData {
  user: UserProfile;
  cycle: CycleData;
  logs: Record<string, DailyLog>;
}

export interface AppState {
  view: 'BOOT' | 'LANDING' | 'ONBOARDING' | 'PIN' | 'HOME' | 'CALENDAR' | 'DAILY_LOG' | 'INSIGHTS' | 'SETTINGS';
  // Multi-profile state
  activeProfileId: string | null;
  profiles: Record<string, ProfileData>;
  // Derived state for the active view (convenience)
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

export type PMSRiskLevel = 'Low' | 'Moderate' | 'High';

export interface PMSAnalysis {
  score: number;
  severity: PMSRiskLevel;
  minDelay: number;
  maxDelay: number;
}