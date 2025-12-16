import React, { useState, useEffect } from 'react';
import { Droplet, Moon, Dumbbell, Sparkles, Plus, Play, Pause, RotateCcw, X, Clock, Flame, GlassWater, Minus, Sun, Check, Trophy } from 'lucide-react';
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
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar pb-32">
      
      {/* Header */}
      <div className="p-6 pb-4">
        <h1 className="text-3xl font-bold text-[var(--nm-text)] mb-1">Mine</h1>
        <p className="text-[var(--nm-text-muted)] text-sm">Your daily vitals & activity</p>
      </div>

      {/* --- Neumorphic Grid Section --- */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-4">
          
          {/* Hydration Card - Soft 3D Surface */}
          <div 
            onClick={() => setActiveModal('WATER')}
            className="nm-card h-44 p-5 cursor-pointer active:scale-95 transition-transform flex flex-col justify-between"
          >
            <div>
                <div className="w-10 h-10 rounded-full nm-inset flex items-center justify-center mb-3 text-cyan-500">
                    <Droplet size={20} fill="currentColor" />
                </div>
                <h3 className="text-[var(--nm-text)] font-bold text-lg leading-tight">Water<br/>Tracker</h3>
            </div>
            <div>
                <div className="flex items-baseline gap-1 text-[var(--nm-text)]">
                    <span className="text-2xl font-bold">{log.waterIntake}</span>
                    <span className="text-xs opacity-80">ml</span>
                </div>
                <div className="w-full bg-[var(--nm-bg)] h-2 rounded-full mt-2 overflow-hidden shadow-[inset_1px_1px_2px_rgba(201,160,174,0.3)]">
                    <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${waterPercentage}%` }}></div>
                </div>
            </div>
          </div>

          {/* Sleep Card - Soft 3D Surface */}
          <div 
            onClick={() => setActiveModal('SLEEP')}
            className="nm-card h-44 p-5 cursor-pointer active:scale-95 transition-transform flex flex-col justify-between"
          >
            <div>
                <div className="w-10 h-10 rounded-full nm-inset flex items-center justify-center mb-3 text-indigo-500">
                    <Moon size={20} fill="currentColor" />
                </div>
                <h3 className="text-[var(--nm-text)] font-bold text-lg leading-tight">Sleep<br/>Monitor</h3>
            </div>
            <div>
                <div className="flex items-baseline gap-1 text-[var(--nm-text)]">
                    <span className="text-2xl font-bold">{currentSleepHours}</span>
                    <span className="text-xs opacity-80">h</span>
                    <span className="text-2xl font-bold ml-1">{currentSleepMinutes}</span>
                    <span className="text-xs opacity-80">m</span>
                </div>
                <div className="w-full bg-[var(--nm-bg)] h-2 rounded-full mt-2 overflow-hidden shadow-[inset_1px_1px_2px_rgba(201,160,174,0.3)]">
                    <div className="bg-indigo-400 h-full rounded-full transition-all duration-500" style={{ width: `${sleepPercentage}%` }}></div>
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
            className="nm-card h-44 p-5 cursor-pointer active:scale-95 transition-transform flex flex-col justify-between"
          >
             <div>
                <div className="w-10 h-10 rounded-full nm-inset flex items-center justify-center mb-3 text-orange-500">
                    <Dumbbell size={20} />
                </div>
                <h3 className="text-[var(--nm-text)] font-bold text-lg leading-tight">
                    {log.didExercise ? (log.exerciseType || 'Workout') : 'Gym\nWorkout'}
                </h3>
            </div>
            {log.didExercise ? (
                 <span className="text-xl font-bold text-[var(--nm-primary)]">{log.exerciseDuration || 30} min</span>
            ) : (
                 <span className="text-[10px] font-bold text-[var(--nm-text-muted)] uppercase tracking-widest px-2 py-1 rounded-lg nm-inset w-fit">Log Activity</span>
            )}
          </div>

          {/* Yoga Card */}
          <div 
            onClick={fetchYogaExercises}
            className="nm-card h-44 p-5 cursor-pointer active:scale-95 transition-transform flex flex-col justify-between"
          >
            <div>
                <div className="w-10 h-10 rounded-full nm-inset flex items-center justify-center mb-3 text-pink-500">
                    <Sparkles size={20} />
                </div>
                <h3 className="text-[var(--nm-text)] font-bold text-lg leading-tight">Yoga<br/>Flow</h3>
            </div>
            <span className="text-[10px] font-bold text-[var(--nm-text-muted)] uppercase tracking-widest px-2 py-1 rounded-lg nm-inset w-fit">Wellness</span>
          </div>

        </div>
      </div>

      {/* --- Active Yoga List Content --- */}
      {activeModal === 'YOGA' && (
        <div className="px-6 pb-6 animate-in slide-in-from-bottom duration-500">
          <div className="flex justify-between items-end mb-4">
             <h3 className="text-lg font-bold text-[var(--nm-text)]">Recommended Flow</h3>
             <button onClick={() => setActiveModal('NONE')} className="nm-btn px-3 py-1 text-xs">Close</button>
          </div>

          {isLoadingYoga ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
               <div className="w-10 h-10 border-4 border-[var(--nm-surface)] border-t-[var(--nm-primary)] rounded-full animate-spin"></div>
               <p className="text-sm text-[var(--nm-text-muted)] animate-pulse">Loading wellness plan...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {yogaList.map((exercise, idx) => (
                <div 
                  key={idx}
                  onClick={() => openTimer(exercise)}
                  className="nm-card p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-[var(--nm-text)]">{exercise.name}</h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        exercise.difficulty === 'Beginner' ? 'bg-green-100 text-green-600' : 
                        exercise.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {exercise.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--nm-text-muted)] line-clamp-1">{exercise.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[var(--nm-primary)] font-bold text-sm bg-[var(--nm-bg)] px-3 py-1.5 rounded-lg shadow-inner">
                    <Clock size={14} />
                    {exercise.durationSeconds}s
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- Water Modal --- */}
      {activeModal === 'WATER' && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--nm-text)]/20 backdrop-blur-sm animate-in fade-in"
          onClick={() => setActiveModal('NONE')}
        >
           <div 
            className="bg-[var(--nm-bg)] w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[var(--nm-text-muted)]/20 rounded-full"></div>
             
             <div className="text-center mb-6">
                 <h2 className="text-2xl font-bold text-[var(--nm-text)] flex items-center justify-center gap-2">
                     <Droplet className="text-cyan-500 fill-cyan-500" /> Hydration
                 </h2>
                 <p className="text-sm text-[var(--nm-text-muted)] mt-1">Recommended: {log.waterTarget} ml</p>
             </div>

             <div className="flex justify-center mb-10">
                 <div className="relative w-48 h-48 flex items-center justify-center nm-card rounded-full">
                    {/* Ring */}
                    <svg className="w-full h-full rotate-[-90deg] p-4" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--nm-bg)" strokeWidth="8" />
                        <circle 
                            cx="50" cy="50" r="45" fill="none" stroke="#22d3ee" strokeWidth="8" 
                            strokeLinecap="round" strokeDasharray="283" 
                            strokeDashoffset={283 - (283 * (waterPercentage / 100))}
                            className="transition-all duration-500 ease-out drop-shadow-md"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-[var(--nm-text)]">{log.waterIntake}</span>
                        <span className="text-sm text-[var(--nm-text-muted)] font-bold uppercase">ml</span>
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
                        className="nm-btn flex-col p-4 h-24"
                     >
                         <item.icon size={24} className="text-cyan-500 mb-2" />
                         <span className="text-xs font-bold text-[var(--nm-text)]">{item.label}</span>
                         <span className="text-[10px] text-cyan-500 font-bold">+{item.amount}ml</span>
                     </button>
                 ))}
             </div>
             
             <button 
                onClick={() => setActiveModal('NONE')}
                className="nm-btn-primary w-full py-4 rounded-xl font-bold mb-3"
             >
                 Save Hydration
             </button>

             <button 
                onClick={() => handleWaterRemove(250)}
                className="w-full flex items-center justify-center gap-2 text-[var(--nm-text-muted)] hover:text-red-400 transition-colors text-xs font-bold"
             >
                 <Minus size={14} /> Mistake? Remove 250ml
             </button>
          </div>
        </div>
      )}

      {/* --- Sleep Modal --- */}
      {activeModal === 'SLEEP' && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--nm-text)]/20 backdrop-blur-sm animate-in fade-in"
          onClick={() => setActiveModal('NONE')}
        >
           <div 
            className="bg-[var(--nm-bg)] w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[var(--nm-text-muted)]/20 rounded-full"></div>
             
             <div className="text-center mb-6">
                 <h2 className="text-2xl font-bold text-[var(--nm-text)] flex items-center justify-center gap-2">
                     <Moon className="text-indigo-500 fill-indigo-500" /> Sleep Tracking
                 </h2>
                 <p className="text-sm text-[var(--nm-text-muted)] mt-1">Goal: {sleepTargetHours} hours</p>
             </div>

             <div className="flex justify-center mb-8">
                 <div className="relative w-64 h-64 flex items-center justify-center nm-card rounded-full">
                    {/* Outer Progress Ring */}
                    <svg className="w-full h-full rotate-[-90deg] absolute inset-0 p-6" viewBox="0 0 100 100">
                        {/* Track */}
                        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--nm-bg)" strokeWidth="4" />
                        
                        {/* Progress */}
                        <circle 
                            cx="50" cy="50" r="45" fill="none" 
                            stroke={sleepProgressRatio > 0.6 ? "#FBBF24" : "#6366F1"} 
                            strokeWidth="5" 
                            strokeLinecap="round" strokeDasharray="283" 
                            strokeDashoffset={283 - (283 * sleepPercentage / 100)}
                            className="transition-all duration-700 ease-out drop-shadow-md"
                        />
                    </svg>
                    
                    <div className="flex flex-col items-center justify-center">
                         <span className="text-4xl font-bold text-[var(--nm-text)]">
                            {currentSleepHours}<span className="text-lg">h</span> {currentSleepMinutes}<span className="text-lg">m</span>
                         </span>
                    </div>
                 </div>
             </div>

             {/* Time Picker */}
             <div className="flex justify-center gap-4 mb-6">
                <div className="flex flex-col items-center">
                    <div className="h-[100px] w-[70px] relative nm-inset overflow-hidden rounded-xl">
                        <ScrollPicker 
                            items={[0,1,2,3,4,5,6,7,8,9,10,11,12]} 
                            value={currentSleepHours} 
                            onChange={(h) => handleSleepChange(h, currentSleepMinutes)}
                            height={100}
                            itemHeight={34}
                            highlightClass="bg-[var(--nm-primary)]/10"
                            selectedItemClass="text-[var(--nm-primary)] font-bold text-2xl scale-110"
                            itemClass="text-[var(--nm-text-muted)] text-sm font-medium scale-90"
                        />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--nm-text-muted)] mt-2 tracking-widest uppercase">Hours</span>
                </div>
                
                <div className="h-[100px] flex items-center text-[var(--nm-text-muted)] text-2xl font-light pb-4">:</div>

                <div className="flex flex-col items-center">
                    <div className="h-[100px] w-[70px] relative nm-inset overflow-hidden rounded-xl">
                        <ScrollPicker 
                            items={[0,15,30,45]} 
                            value={currentSleepMinutes} 
                            onChange={(m) => handleSleepChange(currentSleepHours, m)}
                            height={100}
                            itemHeight={34}
                            highlightClass="bg-[var(--nm-primary)]/10"
                            selectedItemClass="text-[var(--nm-primary)] font-bold text-2xl scale-110"
                            itemClass="text-[var(--nm-text-muted)] text-sm font-medium scale-90"
                        />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--nm-text-muted)] mt-2 tracking-widest uppercase">Mins</span>
                </div>
            </div>

             <button 
                onClick={() => setActiveModal('NONE')}
                className="nm-btn-primary w-full py-4 rounded-xl font-bold"
             >
                 Save Sleep
             </button>
          </div>
        </div>
      )}

      {/* --- Timer Modal --- */}
      {selectedYoga && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[var(--nm-text)]/20 backdrop-blur-sm animate-in fade-in"
          onClick={() => { setSelectedYoga(null); setIsTimerRunning(false); }}
        >
          <div 
            className="bg-[var(--nm-bg)] w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[var(--nm-text-muted)]/20 rounded-full"></div>

            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 rounded-full nm-inset text-[var(--nm-primary)] text-xs font-bold uppercase tracking-widest mb-4">
                Yoga Flow
              </span>
              <h2 className="text-3xl font-bold text-[var(--nm-text)] mb-2">{selectedYoga.name}</h2>
              <p className="text-[var(--nm-text-muted)] text-sm max-w-xs mx-auto leading-relaxed">
                {selectedYoga.description}
              </p>
            </div>

            {/* Timer Display */}
            {showCompletion ? (
                <div className="flex flex-col items-center justify-center h-64 animate-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-4 shadow-lg shadow-green-200">
                        <Trophy size={48} fill="currentColor" />
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--nm-text)]">Well Done!</h3>
                    <p className="text-[var(--nm-text-muted)] text-sm mt-1">Exercise logged successfully</p>
                </div>
            ) : (
                <div className="flex justify-center mb-10">
                <div className="relative w-64 h-64 flex items-center justify-center nm-card rounded-full">
                    {/* Ring */}
                    <svg className="w-full h-full rotate-[-90deg] p-6" viewBox="0 0 100 100">
                    <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="var(--nm-bg)"
                        strokeWidth="4"
                    />

                    <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="var(--nm-primary)"
                        strokeWidth="6"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * (timerSeconds / selectedYoga.durationSeconds))}
                        strokeLinecap="round"
                        className="transition-all duration-1000 linear"
                        style={{ opacity: timerSeconds > 0 ? 1 : 0.5 }}
                    />
                    </svg>
                    
                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-6xl font-bold text-[var(--nm-text)] font-mono tracking-tighter tabular-nums">
                        {formatTime(timerSeconds)}
                    </div>
                    {isTimerRunning ? (
                        <span className="text-xs text-[var(--nm-primary)] font-bold uppercase tracking-widest mt-2 animate-pulse">Focus</span>
                    ) : (
                        <span className="text-xs text-[var(--nm-text-muted)] font-bold uppercase tracking-widest mt-2">Paused</span>
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
                    className="nm-icon-btn w-14 h-14"
                >
                    <RotateCcw size={22} />
                </button>

                <button 
                    onClick={toggleTimer}
                    className="nm-fab w-20 h-20 text-white bg-[var(--nm-primary)] shadow-lg"
                    style={{border: 'none'}}
                >
                    {isTimerRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>

                <button 
                    onClick={() => { setSelectedYoga(null); setIsTimerRunning(false); }}
                    className="nm-icon-btn w-14 h-14"
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