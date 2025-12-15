import React, { useState } from 'react';
import { Droplet, Moon, Dumbbell, Sparkles, Plus, Play, Pause, RotateCcw, X, Clock, Flame, GlassWater, Minus, Sun, Check } from 'lucide-react';
import { DailyLog, UserProfile, YogaExercise } from '../types';
import ScrollPicker from './ScrollPicker';

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

const EXERCISE_TYPES = ['Cardio', 'Strength', 'Yoga', 'HIIT', 'Pilates', 'Walking', 'Running', 'Cycling', 'Swimming', 'Other'];

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

  // --- Water Logic ---
  const handleWaterAdd = (amount: number) => {
    onSaveLog({ ...log, waterIntake: log.waterIntake + amount });
  };
  
  const handleWaterRemove = (amount: number) => {
    onSaveLog({ ...log, waterIntake: Math.max(0, log.waterIntake - amount) });
  };

  // --- Sleep Logic ---
  const handleSleepChange = (h: number, m: number) => {
    onSaveLog({ ...log, sleepDuration: h * 60 + m });
  };
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
  };

  // --- Yoga Logic (Static Data) ---
  const fetchYogaExercises = () => {
    setActiveModal('YOGA');
    
    if (yogaList.length > 0) return;

    setIsLoadingYoga(true);
    setTimeout(() => {
        setYogaList(STATIC_YOGA_EXERCISES);
        setIsLoadingYoga(false);
    }, 600);
  };

  // --- Timer Logic ---
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const openTimer = (exercise: YogaExercise) => {
    setSelectedYoga(exercise);
    setTimerSeconds(exercise.durationSeconds);
    setIsTimerRunning(false);
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    if (selectedYoga) setTimerSeconds(selectedYoga.durationSeconds);
    setIsTimerRunning(false);
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
          
          {/* Hydration Card */}
          <div 
            onClick={() => setActiveModal('WATER')}
            className="group relative h-44 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl p-5 overflow-hidden shadow-lg shadow-blue-200 dark:shadow-none cursor-pointer transition-all active:scale-95 flex flex-col justify-between"
          >
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
            <div>
                <Droplet className="text-white relative z-10 mb-2" size={32} fill="white" fillOpacity={0.3} />
                <h3 className="text-white font-bold text-lg relative z-10 leading-tight">Water<br/>Tracker</h3>
            </div>
            <div className="relative z-10">
                <div className="flex items-baseline gap-1 text-white">
                    <span className="text-2xl font-bold">{log.waterIntake}</span>
                    <span className="text-xs opacity-80">ml</span>
                </div>
                <div className="w-full bg-black/20 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${waterPercentage}%` }}></div>
                </div>
            </div>
          </div>

          {/* Sleep Card */}
          <div 
            onClick={() => setActiveModal('SLEEP')}
            className="group relative h-44 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 overflow-hidden shadow-lg shadow-indigo-200 dark:shadow-none cursor-pointer transition-all active:scale-95 flex flex-col justify-between"
          >
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500"></div>
            <div className="flex justify-between items-start">
                <div>
                    <Moon className="text-white relative z-10 mb-2" size={32} fill="white" fillOpacity={0.3} />
                    <h3 className="text-white font-bold text-lg relative z-10 leading-tight">Sleep<br/>Monitor</h3>
                </div>
            </div>
            <div className="relative z-10">
                <div className="flex items-baseline gap-1 text-white">
                    <span className="text-2xl font-bold">{currentSleepHours}</span>
                    <span className="text-xs opacity-80">h</span>
                    <span className="text-2xl font-bold ml-1">{currentSleepMinutes}</span>
                    <span className="text-xs opacity-80">m</span>
                </div>
                <div className="w-full bg-black/20 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${sleepPercentage}%` }}></div>
                </div>
            </div>
          </div>

          {/* Gym Card */}
          <div 
            onClick={() => {
                setExerciseType(log.exerciseType || 'Cardio');
                setExerciseDuration(log.exerciseDuration || 30);
                setActiveModal('GYM');
            }}
            className="group relative h-44 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl p-5 overflow-hidden shadow-lg shadow-orange-200 dark:shadow-none cursor-pointer transition-all active:scale-95 flex flex-col justify-between"
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            <div>
                <Dumbbell className="text-white relative z-10 mb-2" size={32} />
                <h3 className="text-white font-bold text-lg relative z-10 leading-tight">
                    {log.didExercise ? (log.exerciseType || 'Workout') : 'Gym\nWorkout'}
                </h3>
            </div>
            {log.didExercise ? (
                 <span className="relative z-10 text-xl font-bold text-white">{log.exerciseDuration || 30} min</span>
            ) : (
                 <span className="relative z-10 text-[10px] font-bold text-white/80 uppercase tracking-widest bg-black/10 px-2 py-1 rounded-lg backdrop-blur-sm w-fit">Log Activity</span>
            )}
          </div>

          {/* Yoga Card */}
          <div 
            onClick={fetchYogaExercises}
            className="group relative h-44 bg-gradient-to-br from-pink-400 to-rose-500 rounded-3xl p-5 overflow-hidden shadow-lg shadow-pink-200 dark:shadow-none cursor-pointer transition-all active:scale-95 flex flex-col justify-between"
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
            <div>
                <Sparkles className="text-white relative z-10 mb-2" size={32} />
                <h3 className="text-white font-bold text-lg relative z-10 leading-tight">Yoga<br/>Flow</h3>
            </div>
            <span className="relative z-10 text-[10px] font-bold text-white/80 uppercase tracking-widest bg-black/10 px-2 py-1 rounded-lg backdrop-blur-sm w-fit">Wellness</span>
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

      {/* --- Gym Modal (Bottom Sheet) --- */}
      {activeModal === 'GYM' && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setActiveModal('NONE')}
        >
           <div 
            className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
             {/* Handle */}
             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
             
             <div className="text-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2">
                     <Dumbbell className="text-orange-500" /> Workout Log
                 </h2>
             </div>

             {/* Type Selector */}
             <div className="mb-6">
                <p className="text-center text-sm font-bold text-gray-400 mb-3 uppercase tracking-widest">Exercise Type</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {EXERCISE_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => setExerciseType(type)}
                            className={`px-4 py-2 rounded-xl border font-bold text-xs transition-all ${
                                exerciseType === type 
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' 
                                : 'border-gray-100 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
             </div>

             {/* Duration Picker */}
             <div className="mb-8">
                 <p className="text-center text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">Duration</p>
                 <div className="flex justify-center items-center gap-2 h-32 bg-gray-50 dark:bg-gray-900/50 rounded-2xl relative overflow-hidden">
                    <ScrollPicker 
                        items={Array.from({length: 24}, (_, i) => (i + 1) * 5)} // 5 to 120 mins
                        value={exerciseDuration}
                        onChange={setExerciseDuration}
                        height={128}
                        itemHeight={40}
                        formatLabel={(v) => `${v} min`}
                        highlightClass="bg-orange-100 dark:bg-orange-900/30 rounded-lg"
                        selectedItemClass="text-orange-500 font-bold text-xl scale-110"
                    />
                 </div>
             </div>

             <button 
                onClick={saveExercise}
                className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold shadow-lg shadow-orange-200 dark:shadow-orange-900/30 active:scale-95 transition-all flex items-center justify-center gap-2"
             >
                 <Check size={20} /> Log Workout
             </button>
          </div>
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
                 <p className="text-sm text-gray-400 mt-1">Goal: {log.waterTarget} ml</p>
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

             <div className="grid grid-cols-3 gap-4 mb-4">
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
                onClick={() => handleWaterRemove(250)}
                className="w-full py-3 flex items-center justify-center gap-2 text-gray-400 hover:text-red-400 transition-colors text-sm font-bold"
             >
                 <Minus size={16} /> Mistake? Remove 250ml
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
                onClick={() => setActiveModal('NONE')}
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

            {/* Controls */}
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

          </div>
        </div>
      )}

    </div>
  );
};

export default MinePage;