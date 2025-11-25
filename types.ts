export interface UserProfile {
  name: string;
  age?: number;
  isProfessional: boolean;
  pin: string; // Hashed in a real app, keeping simple for demo logic
  habits: {
    smoking: boolean;
    alcohol: boolean;
    sleep: boolean; // true = good, false = irregular
    stress: boolean; // true = high
    exercise: boolean;
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
  mood?: 'happy' | 'neutral' | 'sad' | 'anxious' | 'energetic';
  symptoms: string[];
  intimacy?: 'protected' | 'unprotected' | 'none';
  notes?: string;
}

export interface AppState {
  view: 'BOOT' | 'ONBOARDING' | 'PIN' | 'HOME' | 'CALENDAR' | 'DAILY_LOG' | 'INSIGHTS' | 'SETTINGS';
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