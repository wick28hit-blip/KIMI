import React, { useState, useEffect } from 'react';
import { Droplet, Moon, Plus, Play, Pause, RotateCcw, X, Clock, Flame, GlassWater, Minus, Sun, Check, Trophy } from 'lucide-react';
import { DailyLog, UserProfile, YogaExercise } from '../types';
import ScrollPicker from './ScrollPicker';
import { triggerHaptic } from '../utils/haptics';

interface MinePageProps {
  log: DailyLog;
  onSaveLog: (log: DailyLog) => void;
  user: UserProfile | null;
}

const STATIC_YOGA_EXERCISES: YogaExercise[] = [
  { 
    name: "Child's Pose", 
    description: "A resting pose that gently stretches the lower back and hips, helping to relieve stress and fatigue.", 
    durationSeconds: 60, 
    difficulty: 'Beginner' 
  },
  { 
    name: "Cat-Cow Stretch", 
    description: "A gentle flow between two poses that warms up the body and brings flexibility to the spine.", 
    durationSeconds: 60, 
    difficulty: 'Beginner' 
  },
  { 
    name: "Reclined Bound Angle", 
    description: "Opens the hips and stimulates abdominal organs, easing menstrual cramps and stress.", 
    durationSeconds: 120, 
    difficulty: 'Beginner' 
  },
  { 
    name: "Cobra Pose", 
    description: "Strengthens the spine and stretches the chest, lungs, shoulders, and abdomen.", 
    durationSeconds: 45, 
    difficulty: 'Intermediate' 
  },
  { 
    name: "Legs-Up-The-Wall", 
    description: "A restorative inversion that relieves tired legs and feet, and calms the mind.", 
    durationSeconds: 300, 
    difficulty: 'Beginner' 
  },
  { 
    name: "Bridge Pose", 
    description: "Stretches the chest, neck, and spine while calming the brain and reducing anxiety.", 
    durationSeconds: 60, 
    difficulty: 'Intermediate' 
  }
];

// --- Custom SVGs for Enhanced 3D Look ---

const GymIcon = () => (
  <svg width="42" height="42" viewBox="0 0 48 48" fill="none" className="mb-3 relative z-10 drop-shadow-md">
    <path d="M11 19.5L28.5 37" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    <path d="M14 13L9 18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 24L13 29" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M35 34L40 39" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M29 28L34 33" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Weights Detail */}
    <path d="M7 16C7 16 5 18 6 21" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <path d="M32 31C32 31 30 33 33 36" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    {/* Shine */}
    <path d="M16 15L18 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6"/>
  </svg>
);

const YogaIcon = () => (
  <svg width="42" height="42" viewBox="0 0 48 48" fill="none" className="mb-3 relative z-10 drop-shadow-md">
    {/* Center Star/Sparkle */}
    <path d="M24 8L27 19L38 22L27 25L24 36L21 25L10 22L21 19L24 8Z" stroke="white" strokeWidth="3" strokeLinejoin="round" fill="white" fillOpacity="0.15"/>
    {/* Floating Orbs */}
    <circle cx="38" cy="12" r="3" fill="white"/>
    <circle cx="10" cy="34" r="2" fill="white" fillOpacity="0.8"/>
    <circle cx="12" cy="10" r="1.5" fill="white" fillOpacity="0.6"/>
    {/* Swoosh */}
    <path d="M8 40C12 40 16 38 24 38C32 38 36 40 40 40" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6"/>
  </svg>
);

const MinePage: React.FC<MinePageProps> = ({ log, onSaveLog, user }) => {
  const [activeModal, setActiveModal] = useState<'NONE' | 'WATER' | 'SLEEP' | 'GYM' | 'YOGA'>('NONE');
  
  // Gym/Exercise State
  const [exerciseType, setExerciseType] = useState(log.exerciseType || 'Cardio');
  const [exerciseDuration, setExerciseDuration] = useState(log.exerciseDuration || 30);

  // Yoga State
  const [yogaList, setYogaList] = useState<YogaExercise[]>([]);
  const [isLoadingYoga, setIsLoadingYoga] = useState(false);
  const [selectedYoga, setSelectedYoga] = useState<YogaExercise | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  // --- Water Logic ---
  const handleWaterAdd = (amount: number) => {
    onSaveLog({ ...log, waterIntake: log.waterIntake + amount });
    triggerHaptic('light');
  };
  
  const handleWaterRemove = (amount: number) => {
    onSaveLog({ ...log, waterIntake: Math.max(0, log.waterIntake - amount) });
    triggerHaptic('light');
  };

  const saveHydration = () => {
    setActiveModal('NONE');
    triggerHaptic('success');
  };

  // --- Sleep Logic ---
  const handleSleepChange = (h: number, m: number) => {
    onSaveLog({ ...log, sleepDuration: h * 60 + m });
  };
  
  const saveSleep = () => {
    setActiveModal('NONE');
    triggerHaptic('success');
  }

  const currentSleepHours = Math.floor(log.sleepDuration / 60);
  const currentSleepMinutes = log.sleepDuration % 60;
  
  // Sleep Transition Logic
  const sleepProgressRatio = Math.min(1, log.sleepDuration / 480);

  // --- Gym Logic ---
  const saveExercise = () => {
    onSaveLog({
        ...log,
        didExercise: true,
        exerciseType: exerciseType,
        exerciseDuration: exerciseDuration
    });
    setActiveModal('NONE');
    triggerHaptic('success');
  };

  // --- Yoga Logic (Static Data) ---
  const fetchYogaExercises = () => {
    setActiveModal('YOGA');
    triggerHaptic('medium');
    
    if (yogaList.length > 0) return;

    setIsLoadingYoga(true);
    setTimeout(() => {
        setYogaList(STATIC_YOGA_EXERCISES);
        setIsLoadingYoga(false);
    }, 600);
  };

  // --- Timer Logic ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      // TIMER COMPLETED
      setIsTimerRunning(false);
      handleYogaComplete();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleYogaComplete = () => {
    if (!selectedYoga) return;
    setShowCompletion(true);
    triggerHaptic('success');
    
    const durationMins = Math.ceil(selectedYoga.durationSeconds / 60);
    const existingList = log.completedYogaExercises || [];
    const newList = [...existingList, selectedYoga];
    const newTotalDuration = (log.exerciseDuration || 0) + durationMins;

    onSaveLog({
        ...log,
        didExercise: true,
        exerciseType: 'Yoga', 
        exerciseDuration: newTotalDuration,
        completedYogaExercises: newList
    });

    setTimeout(() => {
        setShowCompletion(false);
        setSelectedYoga(null);
    }, 2500);
  };

  const openTimer = (exercise: YogaExercise) => {
    setSelectedYoga(exercise);
    setTimerSeconds(exercise.durationSeconds);
    setIsTimerRunning(false);
    setShowCompletion(false);
    triggerHaptic('light');
  };

  const toggleTimer = () => {
      setIsTimerRunning(!isTimerRunning);
      triggerHaptic('medium');
  };
  const resetTimer = () => {
    if (selectedYoga) setTimerSeconds(selectedYoga.durationSeconds);
    setIsTimerRunning(false);
    triggerHaptic('light');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helpers for Hydration Ring
  const waterPercentage = Math.min(100, (log.waterIntake / log.waterTarget) * 100);
  
  // Helpers for Sleep Ring
  const sleepTargetHours = log.sleepTarget / 60;
  const sleepPercentage = Math.min(100, (log.sleepDuration / log.sleepTarget) * 100);

  return (
    <div className="flex flex-col h-full bg-[#FFF0F3] dark:bg-gray-900 overflow-y-auto no-scrollbar pb-32 transition-colors duration-300">
      
      {/* Header */}
      <div className="p-6 pb-4">
        <h1 className="text-3xl font-bold text-[#2D2D2D] dark:text-white mb-1">Mine</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Your daily vitals & activity</p>
      </div>

      {/* --- Unified Grid Section --- */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-4">
          
          {/* Water Card - 3D Block Style */}
          <div 
            onClick={() => { setActiveModal('WATER'); triggerHaptic('medium'); }}
            className="group relative h-48 rounded-[2rem] p-5 overflow-hidden cursor-pointer transition-all active:translate-y-2 active:border-b-0
            bg-gradient-to-b from-[#4FC3F7] to-[#0288D1] 
            border-b-[8px] border-[#01579B] 
            shadow-[0_12px_25px_-5px_rgba(2,136,209,0.4)]"
          >
            {/* Highlight Shine */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-[2rem]"></div>
            
            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <Droplet className="text-white mb-3 drop-shadow-md" size={38} strokeWidth={2.5} />
                    <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm">Water<br/>Tracker</h3>
                </div>
                <div>
                    <div className="flex items-baseline gap-1 text-white drop-shadow-md">
                        <span className="text-2xl font-bold">{log.waterIntake}</span>
                        <span className="text-xs font-bold opacity-90">ml</span>
                    </div>
                    {/* Progress Bar with Bevel */}
                    <div className="w-full bg-black/20 h-2 rounded-full mt-3 overflow-hidden shadow-inner">
                        <div className="bg-white h-full rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)]" style={{ width: `${waterPercentage}%` }}></div>
                    </div>
                </div>
            </div>
          </div>

          {/* Sleep Card - 3D Block Style */}
          <div 
            onClick={() => { setActiveModal('SLEEP'); triggerHaptic('medium'); }}
            className="group relative h-48 rounded-[2rem] p-5 overflow-hidden cursor-pointer transition-all active:translate-y-2 active:border-b-0
            bg-gradient-to-b from-[#7E57C2] to-[#5E35B1] 
            border-b-[8px] border-[#4527A0] 
            shadow-[0_12px_25px_-5px_rgba(94,53,177,0.4)]"
          >
             {/* Highlight Shine */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-[2rem]"></div>

            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <Moon className="text-white mb-3 drop-shadow-md" size={38} strokeWidth={2.5} />
                    <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm">Sleep<br/>Monitor</h3>
                </div>
                <div>
                    <div className="flex items-baseline gap-1 text-white drop-shadow-md">
                        <span className="text-2xl font-bold">{currentSleepHours}</span>
                        <span className="text-xs font-bold opacity-90">h</span>
                        <span className="text-2xl font-bold ml-1">{currentSleepMinutes}</span>
                        <span className="text-xs font-bold opacity-90">m</span>
                    </div>
                    {/* Progress Bar with Bevel */}
                    <div className="w-full bg-black/20 h-2 rounded-full mt-3 overflow-hidden shadow-inner">
                        <div className="bg-white h-full rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)]" style={{ width: `${sleepPercentage}%` }}></div>
                    </div>
                </div>
            </div>
          </div>

          {/* Gym Card - 3D Block Style */}
          <div 
            onClick={() => {
                setExerciseType(log.exerciseType || 'Cardio');
                setExerciseDuration(log.exerciseDuration || 30);
                setActiveModal('GYM');
                triggerHaptic('medium');
            }}
            className="group relative h-48 rounded-[2rem] p-5 overflow-hidden cursor-pointer transition-all active:translate-y-2 active:border-b-0
            bg-gradient-to-b from-[#FF8A65] to-[#E64A19] 
            border-b-[8px] border-[#BF360C] 
            shadow-[0_12px_25px_-5px_rgba(230,74,25,0.4)]"
          >
            {/* Highlight Shine */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-[2rem]"></div>

            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <GymIcon />
                    <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm">
                        {log.didExercise ? (log.exerciseType || 'Workout') : 'Gym\nWorkout'}
                    </h3>
                </div>
                {log.didExercise ? (
                     <span className="text-xl font-bold text-white drop-shadow-md">{log.exerciseDuration || 30} min</span>
                ) : (
                     <div className="self-start text-[10px] font-bold text-[#BF360C] uppercase tracking-widest bg-white/90 px-3 py-1.5 rounded-lg shadow-sm">
                        Log Activity
                     </div>
                )}
            </div>
          </div>

          {/* Yoga Card - 3D Block Style */}
          <div 
            onClick={fetchYogaExercises}
            className="group relative h-48 rounded-[2rem] p-5 overflow-hidden cursor-pointer transition-all active:translate-y-2 active:border-b-0
            bg-gradient-to-b from-[#F06292] to-[#D81B60] 
            border-b-[8px] border-[#880E4F] 
            shadow-[0_12px_25px_-5px_rgba(216,27,96,0.4)]"
          >
            {/* Highlight Shine */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-[2rem]"></div>

            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <YogaIcon />
                    <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm">Yoga<br/>Flow</h3>
                </div>
                 <div className="self-start text-[10px] font-bold text-[#880E4F] uppercase tracking-widest bg-white/90 px-3 py-1.5 rounded-lg shadow-sm">
                    Wellness
                 </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- Active Yoga List Content (Inside Page) --- */}
      {activeModal === 'YOGA' && (
        <div className="px-6 pb-6 animate-in slide-in-from-bottom duration-500">
          <div className="flex justify-between items-end mb-4">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recommended Flow</h3>
             <button onClick={() => setActiveModal('NONE')} className="text-xs text-gray-400 font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">Close</button>
          </div>

          {isLoadingYoga ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
               <div className="w-10 h-10 border-4 border-pink-200 border-t-[#E84C7C] rounded-full animate-spin"></div>
               <p className="text-sm text-gray-500 animate-pulse">Loading wellness plan...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {yogaList.map((exercise, idx) => (
                <div 
                  key={idx}
                  onClick={() => openTimer(exercise)}
                  className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-pink-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-800 dark:text-white">{exercise.name}</h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        exercise.difficulty === 'Beginner' ? 'bg-green-100 text-green-600' : 
                        exercise.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {exercise.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{exercise.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#E84C7C] font-bold text-sm bg-pink-50 dark:bg-pink-900/20 px-3 py-1.5 rounded-lg">
                    <Clock size={14} />
                    {exercise.durationSeconds}s
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Water Modal (Bottom Sheet) --- */}
      {activeModal === 'WATER' && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setActiveModal('NONE')}
        >
           <div 
            className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
             
             <div className="text-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2">
                     <Droplet className="text-blue-500 fill-blue-500" /> Hydration
                 </h2>
                 <p className="text-sm text-gray-400 mt-1">Recommended: {log.waterTarget} ml</p>
             </div>

             <div className="flex justify-center mb-10">
                 <div className="relative w-48 h-48 flex items-center justify-center">
                    {/* Ring */}
                    <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#E0F2FE" strokeWidth="8" className="dark:stroke-gray-700" />
                        <circle 
                            cx="50" cy="50" r="45" fill="none" stroke="#3B82F6" strokeWidth="8" 
                            strokeLinecap="round" strokeDasharray="283" 
                            strokeDashoffset={283 - (283 * (waterPercentage / 100))}
                            className="transition-all duration-500 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-gray-800 dark:text-white">{log.waterIntake}</span>
                        <span className="text-sm text-gray-400 font-bold uppercase">ml</span>
                    </div>
                 </div>
             </div>

             <div className="grid grid-cols-3 gap-4 mb-6">
                 {[
                     { label: 'Glass', amount: 250, icon: GlassWater },
                     { label: 'Bottle', amount: 500, icon: Droplet },
                     { label: 'Large', amount: 750, icon: Droplet }
                 ].map((item, idx) => (
                     <button
                        key={idx}
                        onClick={() => handleWaterAdd(item.amount)}
                        className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-gray-700 rounded-2xl hover:bg-blue-100 dark:hover:bg-gray-600 active:scale-95 transition-all"
                     >
                         <item.icon size={24} className="text-blue-500 mb-2" />
                         <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{item.label}</span>
                         <span className="text-[10px] text-blue-400 font-bold">+{item.amount}ml</span>
                     </button>
                 ))}
             </div>
             
             <button 
                onClick={saveHydration}
                className="w-full py-4 mb-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/30 active:scale-95 transition-all flex items-center justify-center gap-2"
             >
                 Save Hydration
             </button>

             <button 
                onClick={() => handleWaterRemove(250)}
                className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-xs font-bold"
             >
                 <Minus size={14} /> Mistake? Remove 250ml
             </button>
          </div>
        </div>
      )}

      {/* --- Sleep Modal (Bottom Sheet) --- */}
      {activeModal === 'SLEEP' && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setActiveModal('NONE')}
        >
           <div 
            className="w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 relative shadow-2xl overflow-hidden bg-gradient-to-b from-[#0F172A] to-[#1E1B4B]"
            onClick={e => e.stopPropagation()}
          >
             {/* Starry Background Effect */}
             <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                <div className="absolute top-20 right-20 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-32 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-1/2 right-10 w-0.5 h-0.5 bg-white rounded-full"></div>
                <div className="absolute top-1/4 left-1/4 w-0.5 h-0.5 bg-white rounded-full"></div>
             </div>

             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-10"></div>
             
             <div className="text-center mb-6 relative z-10">
                 <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                     {sleepProgressRatio >= 1 ? <Sun className="text-amber-400 fill-amber-400" /> : <Moon className="text-indigo-300 fill-indigo-300" />}
                     Sleep Tracking
                 </h2>
                 <p className="text-sm text-indigo-200/70 mt-1">Goal: {sleepTargetHours} hours</p>
             </div>

             <div className="flex justify-center mb-8 relative z-10">
                 <div className="relative w-64 h-64 flex items-center justify-center">
                    
                    {/* Dynamic Sun/Moon Graphic Container */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        
                        {/* Realistic 3D Moon SVG (Fades Out) */}
                        <svg width="140" height="140" viewBox="0 0 100 100" 
                            className="absolute transition-all duration-1000 ease-in-out"
                            style={{ 
                                opacity: 1 - sleepProgressRatio,
                                transform: `scale(${1 - (0.3 * sleepProgressRatio)}) rotate(${sleepProgressRatio * -20}deg)`
                            }}
                        >
                            <defs>
                                {/* Main sphere gradient */}
                                <radialGradient id="realMoonGrad" cx="30%" cy="30%" r="80%">
                                    <stop offset="0%" stopColor="#FFFFFF" />
                                    <stop offset="20%" stopColor="#E6E6FA" />
                                    <stop offset="100%" stopColor="#4B5563" />
                                </radialGradient>
                                <filter id="softGlow">
                                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                                </filter>
                                {/* Inner shadow for 3D crater look */}
                                <filter id="innerShadow">
                                    <feOffset dx="1" dy="1"/>
                                    <feGaussianBlur stdDeviation="1" result="offset-blur"/>
                                    <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
                                    <feFlood floodColor="black" floodOpacity="0.6" result="color"/>
                                    <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
                                    <feComposite operator="over" in="shadow" in2="SourceGraphic"/> 
                                </filter>
                            </defs>
                            
                            <circle cx="50" cy="50" r="42" fill="url(#realMoonGrad)" filter="url(#softGlow)" />
                            
                            {/* Craters */}
                            <g fill="#9CA3AF" filter="url(#innerShadow)" opacity="0.6">
                                <ellipse cx="30" cy="35" rx="6" ry="5" transform="rotate(-15 30 35)" />
                                <ellipse cx="65" cy="65" rx="10" ry="9" transform="rotate(-10 65 65)" />
                                <ellipse cx="75" cy="30" rx="5" ry="4" />
                                <circle cx="45" cy="80" r="3" />
                                <circle cx="20" cy="55" r="2.5" />
                            </g>
                        </svg>

                        {/* Realistic 3D Sun SVG (Fades In) */}
                        <svg width="150" height="150" viewBox="0 0 100 100" 
                             className="absolute transition-all duration-1000 ease-in-out"
                             style={{ 
                                opacity: sleepProgressRatio,
                                transform: `scale(${0.6 + (0.4 * sleepProgressRatio)})`
                             }}
                        >
                             <defs>
                                <radialGradient id="realSunGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                    <stop offset="0%" stopColor="#FFFBEB" />
                                    <stop offset="30%" stopColor="#FCD34D" />
                                    <stop offset="70%" stopColor="#F59E0B" />
                                    <stop offset="100%" stopColor="#B45309" />
                                </radialGradient>
                                <filter id="sunCorona" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
                                    <feComponentTransfer>
                                        <feFuncA type="linear" slope="1.5" />
                                    </feComponentTransfer>
                                </filter>
                             </defs>
                             
                             {/* Corona / Glow */}
                             <circle cx="50" cy="50" r="38" fill="#F59E0B" filter="url(#sunCorona)" opacity="0.6" className="animate-pulse" style={{animationDuration: '3s'}} />
                             
                             {/* Main Body */}
                             <circle cx="50" cy="50" r="38" fill="url(#realSunGrad)" />
                             
                             {/* Surface Details (Hotspots) */}
                             <circle cx="35" cy="35" r="10" fill="#FEF3C7" fillOpacity="0.3" filter="url(#sunCorona)" />
                             <ellipse cx="70" cy="60" rx="8" ry="5" fill="#B45309" fillOpacity="0.2" transform="rotate(20 70 60)" />

                             {/* Rays (Subtle, rotating) */}
                             <g stroke="url(#realSunGrad)" strokeWidth="2" strokeLinecap="round" className="animate-[spin_20s_linear_infinite]" opacity="0.5">
                                {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340].map(deg => (
                                     <line key={deg} x1="50" y1="50" x2="50" y2="5" transform={`rotate(${deg} 50 50)`} />
                                ))}
                             </g>
                        </svg>

                    </div>

                    {/* Outer Progress Ring */}
                    <svg className="w-full h-full rotate-[-90deg] absolute inset-0" viewBox="0 0 100 100">
                        {/* Track */}
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#312E81" strokeWidth="4" className="opacity-30" />
                        
                        {/* Progress */}
                        <circle 
                            cx="50" cy="50" r="45" fill="none" 
                            stroke={sleepProgressRatio > 0.6 ? "#FBBF24" : "#6366F1"} 
                            strokeWidth="5" 
                            strokeLinecap="round" strokeDasharray="283" 
                            strokeDashoffset={283 - (283 * sleepPercentage / 100)}
                            className="transition-all duration-700 ease-out"
                            style={{
                                filter: `drop-shadow(0 0 8px ${sleepProgressRatio > 0.6 ? 'rgba(251, 191, 36, 0.6)' : 'rgba(99, 102, 241, 0.6)'})`
                            }}
                        />
                    </svg>
                 </div>
             </div>

             {/* Redesigned Time Picker */}
             <div className="flex justify-center gap-4 mb-6 relative z-10">
                <div className="flex flex-col items-center">
                    <div className="h-[100px] w-[70px] relative">
                        <ScrollPicker 
                            items={[0,1,2,3,4,5,6,7,8,9,10,11,12]} 
                            value={currentSleepHours} 
                            onChange={(h) => handleSleepChange(h, currentSleepMinutes)}
                            height={100}
                            itemHeight={34}
                            highlightClass="bg-white/10 rounded-lg"
                            selectedItemClass="text-white font-bold text-2xl scale-110"
                            itemClass="text-indigo-200/40 text-sm font-medium scale-90"
                        />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-300 mt-2 tracking-widest uppercase">Hours</span>
                </div>
                
                <div className="h-[100px] flex items-center text-white/20 text-2xl font-light pb-4">:</div>

                <div className="flex flex-col items-center">
                    <div className="h-[100px] w-[70px] relative">
                        <ScrollPicker 
                            items={[0,15,30,45]} 
                            value={currentSleepMinutes} 
                            onChange={(m) => handleSleepChange(currentSleepHours, m)}
                            height={100}
                            itemHeight={34}
                            highlightClass="bg-white/10 rounded-lg"
                            selectedItemClass="text-white font-bold text-2xl scale-110"
                            itemClass="text-indigo-200/40 text-sm font-medium scale-90"
                        />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-300 mt-2 tracking-widest uppercase">Mins</span>
                </div>
            </div>

             <button 
                onClick={saveSleep}
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/50 transition-all active:scale-95 relative z-10"
             >
                 Save Sleep
             </button>
          </div>
        </div>
      )}


      {/* --- Timer Modal (Bottom Sheet - Existing) --- */}
      {selectedYoga && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => { setSelectedYoga(null); setIsTimerRunning(false); }}
        >
          <div 
            className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>

            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 text-[#E84C7C] text-xs font-bold uppercase tracking-widest mb-4">
                Yoga Flow
              </span>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{selectedYoga.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                {selectedYoga.description}
              </p>
            </div>

            {/* Timer Display */}
            {showCompletion ? (
                <div className="flex flex-col items-center justify-center h-64 animate-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-4 shadow-lg shadow-green-200">
                        <Trophy size={48} fill="currentColor" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Well Done!</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Exercise logged successfully</p>
                </div>
            ) : (
                <div className="flex justify-center mb-10">
                <div className="relative w-64 h-64 flex items-center justify-center">
                    
                    {/* 3D Glowing Ring SVG */}
                    <svg className="w-full h-full rotate-[-90deg] drop-shadow-xl" viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#E84C7C" />
                        <stop offset="100%" stopColor="#F472B6" />
                        </linearGradient>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                        </filter>
                    </defs>

                    {/* Background Track */}
                    <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="#F3F4F6"
                        strokeWidth="4"
                        className="dark:stroke-gray-700"
                    />

                    {/* Active Progress Ring */}
                    <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="url(#timerGradient)"
                        strokeWidth="6"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * (timerSeconds / selectedYoga.durationSeconds))}
                        strokeLinecap="round"
                        className="transition-all duration-1000 linear"
                        filter="url(#glow)"
                        style={{ opacity: timerSeconds > 0 ? 1 : 0.5 }}
                    />
                    </svg>
                    
                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-6xl font-bold text-[#2D2D2D] dark:text-white font-mono tracking-tighter tabular-nums">
                        {formatTime(timerSeconds)}
                    </div>
                    {isTimerRunning ? (
                        <span className="text-xs text-[#E84C7C] font-bold uppercase tracking-widest mt-2 animate-pulse">Focus</span>
                    ) : (
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Paused</span>
                    )}
                    </div>
                </div>
                </div>
            )}

            {/* Controls */}
            {!showCompletion && (
                <div className="flex items-center justify-center gap-8">
                <button 
                    onClick={resetTimer}
                    className="p-4 rounded-full bg-gray-50 dark:bg-gray-700/50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all active:scale-95"
                >
                    <RotateCcw size={22} />
                </button>

                <button 
                    onClick={toggleTimer}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E84C7C] to-[#D63E6D] text-white flex items-center justify-center shadow-lg shadow-pink-300/50 dark:shadow-pink-900/30 active:scale-95 transition-all hover:scale-105"
                >
                    {isTimerRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>

                <button 
                    onClick={() => { setSelectedYoga(null); setIsTimerRunning(false); }}
                    className="p-4 rounded-full bg-gray-50 dark:bg-gray-700/50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all active:scale-95"
                >
                    <X size={22} />
                </button>
                </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default MinePage;