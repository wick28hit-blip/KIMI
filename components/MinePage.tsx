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
  
  const [exerciseType, setExerciseType] = useState(log.exerciseType || 'Cardio');
  const [exerciseDuration, setExerciseDuration] = useState(log.exerciseDuration || 30);

  const [yogaList, setYogaList] = useState<YogaExercise[]>([]);
  const [isLoadingYoga, setIsLoadingYoga] = useState(false);
  const [selectedYoga, setSelectedYoga] = useState<YogaExercise | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const handleWaterAdd = (amount: number) => {
    onSaveLog({ ...log, waterIntake: log.waterIntake + amount });
  };
  
  const handleWaterRemove = (amount: number) => {
    onSaveLog({ ...log, waterIntake: Math.max(0, log.waterIntake - amount) });
  };

  const handleSleepChange = (h: number, m: number) => {
    onSaveLog({ ...log, sleepDuration: h * 60 + m });
  };
  const currentSleepHours = Math.floor(log.sleepDuration / 60);
  const currentSleepMinutes = log.sleepDuration % 60;
  
  const sleepProgressRatio = Math.min(1, log.sleepDuration / 480);

  const fetchYogaExercises = () => {
    setActiveModal('YOGA');
    if (yogaList.length > 0) return;
    setIsLoadingYoga(true);
    setTimeout(() => {
        setYogaList(STATIC_YOGA_EXERCISES);
        setIsLoadingYoga(false);
    }, 600);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
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

  const waterPercentage = Math.min(100, (log.waterIntake / log.waterTarget) * 100);
  const sleepTargetHours = log.sleepTarget / 60;
  const sleepPercentage = Math.min(100, (log.sleepDuration / log.sleepTarget) * 100);

  return (
    <div className="flex flex-col h-full bg-transparent pb-32">
      
      {/* Header */}
      <div className="p-6 pb-4">
        <h1 className="text-3xl font-bold text-[#2D2D2D] dark:text-white mb-1">Mine</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Your daily vitals & activity</p>
      </div>

      {/* --- Unified Grid Section --- */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-4">
          
          {/* Hydration Card - Neumorphic Tactile */}
          <button 
            onClick={() => setActiveModal('WATER')}
            className="nm-btn h-44 p-5 flex flex-col justify-between items-start text-left group"
          >
            <div>
                <div className="p-2 nm-inset rounded-full w-fit mb-2 text-blue-500">
                    <Droplet size={24} fill="currentColor" fillOpacity={0.2} />
                </div>
                <h3 className="text-[#2D2D2D] font-bold text-lg leading-tight">Water<br/>Tracker</h3>
            </div>
            <div className="w-full">
                <div className="flex items-baseline gap-1 text-[#2D2D2D]">
                    <span className="text-2xl font-bold">{log.waterIntake}</span>
                    <span className="text-xs opacity-60">ml</span>
                </div>
                <div className="w-full nm-inset h-1.5 rounded-full mt-2 overflow-hidden bg-gray-100">
                    <div className="bg-blue-400 h-full rounded-full transition-all duration-500" style={{ width: `${waterPercentage}%` }}></div>
                </div>
            </div>
          </button>

          {/* Sleep Card */}
          <button 
            onClick={() => setActiveModal('SLEEP')}
            className="nm-btn h-44 p-5 flex flex-col justify-between items-start text-left group"
          >
            <div>
                <div className="p-2 nm-inset rounded-full w-fit mb-2 text-indigo-500">
                    <Moon size={24} fill="currentColor" fillOpacity={0.2} />
                </div>
                <h3 className="text-[#2D2D2D] font-bold text-lg leading-tight">Sleep<br/>Monitor</h3>
            </div>
            <div className="w-full">
                <div className="flex items-baseline gap-1 text-[#2D2D2D]">
                    <span className="text-2xl font-bold">{currentSleepHours}</span>
                    <span className="text-xs opacity-60">h</span>
                    <span className="text-2xl font-bold ml-1">{currentSleepMinutes}</span>
                    <span className="text-xs opacity-60">m</span>
                </div>
                <div className="w-full nm-inset h-1.5 rounded-full mt-2 overflow-hidden bg-gray-100">
                    <div className="bg-indigo-400 h-full rounded-full transition-all duration-500" style={{ width: `${sleepPercentage}%` }}></div>
                </div>
            </div>
          </button>

          {/* Gym Card */}
          <button 
            onClick={() => {
                setExerciseType(log.exerciseType || 'Cardio');
                setExerciseDuration(log.exerciseDuration || 30);
                setActiveModal('GYM');
            }}
            className="nm-btn h-44 p-5 flex flex-col justify-between items-start text-left group"
          >
            <div>
                <div className="p-2 nm-inset rounded-full w-fit mb-2 text-orange-500">
                    <Dumbbell size={24} />
                </div>
                <h3 className="text-[#2D2D2D] font-bold text-lg leading-tight">
                    {log.didExercise ? (log.exerciseType || 'Workout') : 'Gym\nWorkout'}
                </h3>
            </div>
            {log.didExercise ? (
                 <span className="text-xl font-bold text-orange-500">{log.exerciseDuration || 30} min</span>
            ) : (
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-lg w-fit">Log Activity</span>
            )}
          </button>

          {/* Yoga Card */}
          <button 
            onClick={fetchYogaExercises}
            className="nm-btn h-44 p-5 flex flex-col justify-between items-start text-left group"
          >
            <div>
                <div className="p-2 nm-inset rounded-full w-fit mb-2 text-pink-500">
                    <Sparkles size={24} />
                </div>
                <h3 className="text-[#2D2D2D] font-bold text-lg leading-tight">Yoga<br/>Flow</h3>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-lg w-fit">Wellness</span>
          </button>

        </div>
      </div>

      {/* --- Active Yoga List Content --- */}
      {activeModal === 'YOGA' && (
        <div className="px-6 pb-6 animate-in slide-in-from-bottom duration-500">
          <div className="flex justify-between items-end mb-4">
             <h3 className="text-lg font-bold text-[#2D2D2D] dark:text-white">Recommended Flow</h3>
             <button onClick={() => setActiveModal('NONE')} className="nm-btn px-4 py-2 text-xs font-bold text-gray-500">Close</button>
          </div>

          {isLoadingYoga ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
               <div className="w-10 h-10 border-4 border-pink-100 border-t-[var(--nm-accent)] rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {yogaList.map((exercise, idx) => (
                <div 
                  key={idx}
                  onClick={() => openTimer(exercise)}
                  className="nm-card p-4 flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-transform"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-[#2D2D2D] dark:text-white">{exercise.name}</h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase nm-inset ${
                        exercise.difficulty === 'Beginner' ? 'text-green-600 bg-green-50' : 
                        exercise.difficulty === 'Intermediate' ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'
                      }`}>
                        {exercise.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{exercise.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[var(--nm-accent)] font-bold text-sm nm-inset px-3 py-1.5 rounded-lg">
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
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/20 backdrop-blur-sm animate-in fade-in"
          onClick={() => setActiveModal('NONE')}
        >
           <div 
            className="nm-bg w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 relative shadow-[var(--shadow-card)]"
            onClick={e => e.stopPropagation()}
          >
             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full"></div>
             
             <div className="text-center mb-6">
                 <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white flex items-center justify-center gap-2">
                     <Droplet className="text-blue-500 fill-blue-500" /> Hydration
                 </h2>
                 <p className="text-sm text-gray-500 mt-1">Recommended: {log.waterTarget} ml</p>
             </div>

             <div className="flex justify-center mb-10">
                 <div className="relative w-48 h-48 flex items-center justify-center nm-inset rounded-full shadow-inner">
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-[#2D2D2D] dark:text-white">{log.waterIntake}</span>
                        <span className="text-sm text-gray-500 font-bold uppercase">ml</span>
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
                        className="nm-btn flex flex-col items-center justify-center p-4 active:scale-95"
                     >
                         <item.icon size={24} className="text-blue-500 mb-2" />
                         <span className="text-xs font-bold text-[#2D2D2D] dark:text-white">{item.label}</span>
                         <span className="text-[10px] text-blue-400 font-bold">+{item.amount}ml</span>
                     </button>
                 ))}
             </div>
             
             <button 
                onClick={() => setActiveModal('NONE')}
                className="w-full py-4 mb-3 nm-btn-primary font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
             >
                 Save Hydration
             </button>
          </div>
        </div>
      )}

      {/* --- Sleep Modal (Bottom Sheet) --- */}
      {activeModal === 'SLEEP' && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/20 backdrop-blur-sm animate-in fade-in"
          onClick={() => setActiveModal('NONE')}
        >
           <div 
            className="nm-bg w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 relative shadow-[var(--shadow-card)]"
            onClick={e => e.stopPropagation()}
          >
             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full"></div>
             
             <div className="text-center mb-6">
                 <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white flex items-center justify-center gap-2">
                     <Moon className="text-indigo-500 fill-indigo-500" /> Sleep
                 </h2>
                 <p className="text-sm text-gray-500 mt-1">Goal: {sleepTargetHours} hours</p>
             </div>

             <div className="flex justify-center gap-4 mb-6 relative z-10">
                <div className="flex flex-col items-center">
                    <div className="h-[100px] w-[70px] relative">
                        <ScrollPicker 
                            items={[0,1,2,3,4,5,6,7,8,9,10,11,12]} 
                            value={currentSleepHours} 
                            onChange={(h) => handleSleepChange(h, currentSleepMinutes)}
                            height={100}
                            itemHeight={34}
                            highlightClass="nm-inset rounded-lg bg-gray-100"
                            selectedItemClass="text-[var(--nm-accent)] font-bold text-2xl scale-110"
                            itemClass="text-gray-400 text-sm font-medium scale-90"
                        />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 mt-2 tracking-widest uppercase">Hours</span>
                </div>
                
                <div className="h-[100px] flex items-center text-gray-300 text-2xl font-light pb-4">:</div>

                <div className="flex flex-col items-center">
                    <div className="h-[100px] w-[70px] relative">
                        <ScrollPicker 
                            items={[0,15,30,45]} 
                            value={currentSleepMinutes} 
                            onChange={(m) => handleSleepChange(currentSleepHours, m)}
                            height={100}
                            itemHeight={34}
                            highlightClass="nm-inset rounded-lg bg-gray-100"
                            selectedItemClass="text-[var(--nm-accent)] font-bold text-2xl scale-110"
                            itemClass="text-gray-400 text-sm font-medium scale-90"
                        />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 mt-2 tracking-widest uppercase">Mins</span>
                </div>
            </div>

             <button 
                onClick={() => setActiveModal('NONE')}
                className="w-full py-4 nm-btn-primary font-bold active:scale-95 transition-all"
             >
                 Save Sleep
             </button>
          </div>
        </div>
      )}

      {/* --- Timer Modal --- */}
      {selectedYoga && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/20 backdrop-blur-sm animate-in fade-in"
          onClick={() => { setSelectedYoga(null); setIsTimerRunning(false); }}
        >
          <div 
            className="nm-bg w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 relative shadow-[var(--shadow-card)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full"></div>

            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 rounded-full nm-inset text-[var(--nm-accent)] text-xs font-bold uppercase tracking-widest mb-4">
                Yoga Flow
              </span>
              <h2 className="text-3xl font-bold text-[#2D2D2D] dark:text-white mb-2">{selectedYoga.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                {selectedYoga.description}
              </p>
            </div>

            {/* Timer Display */}
            {showCompletion ? (
                <div className="flex flex-col items-center justify-center h-64 animate-in zoom-in duration-300">
                    <div className="w-24 h-24 nm-inset rounded-full flex items-center justify-center text-green-500 mb-4">
                        <Trophy size={48} fill="currentColor" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#2D2D2D] dark:text-white">Well Done!</h3>
                </div>
            ) : (
                <div className="flex justify-center mb-10">
                    <div className="relative w-64 h-64 flex items-center justify-center nm-inset rounded-full shadow-inner">
                        <div className="text-6xl font-bold text-[#2D2D2D] dark:text-white font-mono tracking-tighter tabular-nums">
                            {formatTime(timerSeconds)}
                        </div>
                    </div>
                </div>
            )}

            {/* Controls */}
            {!showCompletion && (
                <div className="flex items-center justify-center gap-8">
                <button 
                    onClick={resetTimer}
                    className="nm-btn w-16 h-16 rounded-full flex items-center justify-center active:scale-95"
                >
                    <RotateCcw size={22} />
                </button>

                <button 
                    onClick={toggleTimer}
                    className="nm-btn-primary w-20 h-20 flex items-center justify-center active:scale-95 transition-all hover:scale-105"
                >
                    {isTimerRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>

                <button 
                    onClick={() => { setSelectedYoga(null); setIsTimerRunning(false); }}
                    className="nm-btn w-16 h-16 rounded-full flex items-center justify-center active:scale-95"
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