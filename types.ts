export interface UserProfile {
  id: string;
  name: string;
  relationship: 'Self' | 'Daughter' | 'Sister' | 'Friend' | 'Other';
  age?: number;
  pin: string;
  notificationsEnabled?: boolean;
  
  pmsData: {
    stress: number;
    sleep: number;
    anxiety: number;
    depression: number;
    height: number;
    weight: number;
    bmi: number;
    diet: number;
  };
}

export interface CycleData {
  lastPeriodDate: string;
  cycleLength: number;
  periodDuration: number;
}

export interface SymptomEntry {
  name: string;
  intensity: number; // 1-4 stars
  category: 'Head' | 'Body' | 'Cervix' | 'Fluid' | 'Abdomen' | 'Mental';
}

export interface DailyLog {
  date: string;
  waterIntake: number; // ml
  waterTarget: number; // ml (default 2000)
  sleepDuration: number; // minutes
  sleepTarget: number; // minutes (default 480 = 8h)
  flow?: 'Spotting' | 'Light' | 'Medium' | 'Heavy' | null;
  detailedSymptoms: SymptomEntry[]; 
  mood: string[]; 
  symptoms: string[]; 
  medication: boolean;
  didExercise: boolean;
  exerciseType?: string;
  exerciseDuration?: number; // minutes
  completedYogaExercises?: YogaExercise[];
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
  reminders?: ReminderConfig[];
}

export interface ReminderConfig {
  id: string;
  label: string;
  time: string; // "HH:mm"
  isEnabled: boolean;
  category: 'Period & fertility' | 'Medicine' | 'Lifestyle' | 'Exercise';
  selectedDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
}

export interface AppState {
  view: 'BOOT' | 'SPLASH' | 'LANDING' | 'ONBOARDING' | 'PIN' | 'HOME' | 'CALENDAR' | 'DAILY_LOG' | 'INSIGHTS' | 'SETTINGS' | 'MINE';
  activeProfileId: string | null;
  profiles: Record<string, ProfileData>;
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

export interface YogaExercise {
  name: string;
  description: string;
  durationSeconds: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}