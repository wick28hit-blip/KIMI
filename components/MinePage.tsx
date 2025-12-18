import React, { useState, useEffect } from 'react';
import { Droplet, Moon, Play, Pause, RotateCcw, X, Clock, Flame, GlassWater, Minus, Sun, Trophy, Sparkles, Brain, Heart, Wind, Coffee, Zap, ArrowRight, Activity } from 'lucide-react';
import { DailyLog, UserProfile, YogaExercise } from '../types';
import ScrollPicker from './ScrollPicker';
import { triggerHaptic } from '../utils/haptics';
import { format, subDays } from 'date-fns';

interface MinePageProps {
  log: DailyLog;
  onSaveLog: (log: DailyLog) => void;
  user: UserProfile | null;
}

// --- PERMANENT CURATED CONTENT REPOSITORY ---
const STATIC_WELLNESS_DATA: Record<string, { insight: string; stats: { label: string; value: number; color: string }[] }> = {
  pms: {
    insight: "Magnesium and Vitamin B6 are your best allies. Reducing salt intake 7 days before your period can significantly lower bloating and water retention.",
    stats: [
      { label: "Cramps Reduced", value: 65, color: "from-orange-400 to-red-500" },
      { label: "Mood Stability", value: 80, color: "from-yellow-400 to-orange-500" },
      { label: "Bloating Relief", value: 70, color: "from-blue-400 to-indigo-500" }
    ]
  },
  cycle: {
    insight: "Your cycle has four distinct seasons. Follicular is your 'Spring' for new projects, while Luteal is your 'Autumn' for wrapping up and resting.",
    stats: [
      { label: "Estrogen Peak", value: 90, color: "from-pink-400 to-purple-500" },
      { label: "Energy Level", value: 85, color: "from-green-400 to-teal-500" },
      { label: "Social Drive", value: 75, color: "from-blue-400 to-cyan-500" }
    ]
  },
  yoga: {
    insight: "Gentle forward folds and twists massage the abdominal organs. Child's Pose and Cat-Cow are essential for releasing lower back tension during menstruation.",
    stats: [
      { label: "Flexibility", value: 60, color: "from-rose-400 to-pink-500" },
      { label: "Pain Relief", value: 88, color: "from-green-400 to-emerald-500" },
      { label: "Calmness", value: 95, color: "from-indigo-400 to-purple-500" }
    ]
  },
  nutrition: {
    insight: "Seed cycling (flax/pumpkin in phase 1, sesame/sunflower in phase 2) can naturally balance hormones. Focus on iron-rich foods during your period.",
    stats: [
      { label: "Hormone Balance", value: 75, color: "from-green-400 to-lime-500" },
      { label: "Iron Absorption", value: 60, color: "from-red-400 to-rose-600" },
      { label: "Energy Sustain", value: 80, color: "from-yellow-400 to-amber-500" }
    ]
  },
  mental: {
    insight: "Meditation lowers cortisol, which directly impacts PMS severity. Even 5 minutes of deep breathing can reset your nervous system from 'fight or flight' to 'rest and digest'.",
    stats: [
      { label: "Stress Reduction", value: 90, color: "from-teal-400 to-blue-500" },
      { label: "Focus", value: 70, color: "from-indigo-400 to-violet-500" },
      { label: "Sleep Quality", value: 85, color: "from-purple-400 to-fuchsia-500" }
    ]
  },
  sleep: {
    insight: "Your body temperature drops to initiate sleep. A warm bath before bed mimics this drop when you get out, signaling your body it's time to rest.",
    stats: [
      { label: "Recovery", value: 95, color: "from-indigo-500 to-blue-600" },
      { label: "Immunity", value: 80, color: "from-green-400 to-emerald-600" },
      { label: "Mental Clarity", value: 85, color: "from-cyan-400 to-blue-500" }
    ]
  }
};

const STATIC_YOGA_EXERCISES: YogaExercise[] = [
  { name: "Child's Pose", description: "A resting pose that gently stretches the lower back.", durationSeconds: 60, difficulty: 'Beginner' },
  { name: "Cat-Cow Stretch", description: "Warms up the body and brings flexibility to the spine.", durationSeconds: 60, difficulty: 'Beginner' },
  { name: "Reclined Bound Angle", description: "Opens hips and eases menstrual cramps.", durationSeconds: 120, difficulty: 'Beginner' },
  { name: "Cobra Pose", description: "Strengthens the spine and stretches the chest.", durationSeconds: 45, difficulty: 'Intermediate' },
  { name: "Legs-Up-The-Wall", description: "Relieves tired legs and calms the mind.", durationSeconds: 300, difficulty: 'Beginner' },
  { name: "Bridge Pose", description: "Stretches chest, neck, and spine.", durationSeconds: 60, difficulty: 'Intermediate' }
];

const GYM_EXERCISES = [
    { name: "Chest Press", sets: 3, description: "Strengthens pectorals and triceps." },
    { name: "Squats", sets: 3, description: "Targets quadriceps, hamstrings, and glutes." },
    { name: "Shoulder Press", sets: 3, description: "Works deltoids and upper body stability." },
    { name: "Deadlift", sets: 3, description: "Full body compound movement." },
    { name: "Lat Pulldown", sets: 3, description: "Builds back width and biceps." },
    { name: "Lunges", sets: 3, description: "Unilateral leg strength and balance." }
];

const AI_TOPICS = [
  { id: 'pms', title: 'PMS Mastery', icon: Sparkles, color: 'text-purple-500', bg: 'from-purple-50 to-purple-100' },
  { id: 'cycle', title: 'Cycle Seasons', icon: Sun, color: 'text-pink-500', bg: 'from-pink-50 to-pink-100' },
  { id: 'yoga', title: 'Healing Yoga', icon: Flame, color: 'text-orange-500', bg: 'from-orange-50 to-orange-100' },
  { id: 'nutrition', title: 'Cycle Nutrition', icon: Coffee, color: 'text-green-500', bg: 'from-green-50 to-green-100' },
  { id: 'mental', title: 'Mental Calm', icon: Brain, color: 'text-blue-500', bg: 'from-blue-50 to-blue-100' },
  { id: 'sleep', title: 'Deep Sleep', icon: Moon, color: 'text-indigo-500', bg: 'from-indigo-50 to-indigo-100' }
];

// --- Custom SVGs for Enhanced 3D Look ---
const GymIcon = () => (
  <svg width="42" height="42" viewBox="0 0 48 48" fill="none" className="mb-3 relative z-10 drop-shadow-md">
    <path d="M11 19.5L28.5 37" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    <path d="M14 13L9 18" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 24L13 29" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M35 34L40 39" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M29 28L34 33" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 16C7 16 5 18 6 21" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <path d="M32 31C32 31 30 33 33 36" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    <path d="M16 15L18 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6"/>
  </svg>
);

const YogaIcon = () => (
  <svg width="42" height="42" viewBox="0 0 48 48" fill="none" className="mb-3 relative z-10 drop-shadow-md">
    <path d="M24 8L27 19L38 22L27 25L24 36L21 25L10 22L21 19L24 8Z" stroke="white" strokeWidth="3" strokeLinejoin="round" fill="white" fillOpacity="0.15"/>
    <circle cx="38" cy="12" r="3" fill="white"/>
    <circle cx="10" cy="34" r="2" fill="white" fillOpacity="0.8"/>
    <circle cx="12" cy="10" r="1.5" fill="white" fillOpacity="0.6"/>
    <path d="M8 40C12 40 16 38 24 38C32 38 36 40 40 40" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6"/>
  </svg>
);

const MinePage: React.FC<MinePageProps> = ({ log, onSaveLog, user }) => {
  const [activeModal, setActiveModal] = useState<'NONE' | 'WATER' | 'SLEEP' | 'GYM_LIST' | 'GYM_TIMER' | 'YOGA' | 'CONTENT'>('NONE');
  
  // Gym State
  const [selectedGymExercise, setSelectedGymExercise] = useState<typeof GYM_EXERCISES[0] | null>(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [targetSets, setTargetSets] = useState(3);

  // Yoga State
  const [yogaList, setYogaList] = useState<YogaExercise[]>([]);
  const [isLoadingYoga, setIsLoadingYoga] = useState(false);
  const [selectedYoga, setSelectedYoga] = useState<YogaExercise | null>(null);
  
  // Shared Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  // Content State
  const [selectedTopic, setSelectedTopic] = useState<typeof AI_TOPICS[0] | null>(null);
  const [contentData, setContentData] = useState<any>(null);

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
  const openGymTimer = (exercise: typeof GYM_EXERCISES[0]) => {
      setSelectedGymExercise(exercise);
      setTargetSets(exercise.sets);
      setCurrentSet(1);
      setTimerSeconds(0);
      setIsTimerRunning(false);
      setShowCompletion(false);
      setActiveModal('GYM_TIMER');
      triggerHaptic('medium');
  };

  const incrementSet = () => {
      if (currentSet < targetSets) {
          setCurrentSet(s => s + 1);
          triggerHaptic('success');
      } else {
          handleGymComplete();
      }
  };

  const handleGymComplete = () => {
      setShowCompletion(true);
      triggerHaptic('success');
      onSaveLog({
          ...log,
          didExercise: true,
          exerciseType: 'Gym',
          exerciseDuration: (log.exerciseDuration || 0) + 15
      });
      setTimeout(() => {
          setShowCompletion(false);
          setActiveModal('GYM_LIST');
      }, 2000);
  };

  // --- Yoga Logic ---
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

  const openYogaTimer = (exercise: YogaExercise) => {
    setSelectedYoga(exercise);
    setTimerSeconds(exercise.durationSeconds);
    setIsTimerRunning(false);
    setShowCompletion(false);
    triggerHaptic('light');
  };

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

  // --- Shared Timer Effect ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning) {
        if (activeModal === 'GYM_TIMER') {
            interval = setInterval(() => { setTimerSeconds(prev => prev + 1); }, 1000);
        } else if (selectedYoga && timerSeconds > 0) {
            interval = setInterval(() => { setTimerSeconds((prev) => prev - 1); }, 1000);
        } else if (selectedYoga && timerSeconds === 0) {
            setIsTimerRunning(false);
            handleYogaComplete();
        }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, activeModal, selectedYoga]);

  const toggleTimer = () => {
      setIsTimerRunning(!isTimerRunning);
      triggerHaptic('medium');
  };
  const resetTimer = () => {
    if (selectedYoga) setTimerSeconds(selectedYoga.durationSeconds);
    if (activeModal === 'GYM_TIMER') setTimerSeconds(0);
    setIsTimerRunning(false);
    triggerHaptic('light');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const loadContent = (topic: typeof AI_TOPICS[0]) => {
      setSelectedTopic(topic);
      const data = STATIC_WELLNESS_DATA[topic.id];
      setContentData(data);
      setActiveModal('CONTENT');
      triggerHaptic('medium');
  };

  const waterPercentage = Math.min(100, (log.waterIntake / log.waterTarget) * 100);
  const sleepTargetHours = log.sleepTarget / 60;
  const sleepPercentage = Math.min(100, (log.sleepDuration / log.sleepTarget) * 100);

  return (
    <div className="flex flex-col h-full bg-[#FFF0F3] dark:bg-gray-900 overflow-y-auto no-scrollbar pb-32 transition-colors duration-300">
      
      <div className="p-6 pb-4">
        <h1 className="text-3xl font-bold text-[#2D2D2D] dark:text-white mb-1">Self Care</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Your daily vitals & wellness</p>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-6">
          
          {/* Water Card - Fat 3D Molded Edge + Contact Shadow */}
          <div 
            onClick={() => { setActiveModal('WATER'); triggerHaptic('medium'); }}
            className="group relative h-48 rounded-[2rem] p-5 overflow-hidden cursor-pointer transition-all active:scale-95
            bg-gradient-to-b from-[#4FC3F7] to-[#0288D1] 
            shadow-[6px_6px_12px_rgba(1,87,155,0.3),18px_18px_36px_rgba(1,87,155,0.4),-18px_-18px_36px_rgba(255,255,255,0.5)]"
          >
            {/* Soft Inner Highlight Ring */}
            <div className="absolute inset-0 rounded-[2rem] border border-white/20 pointer-events-none"></div>
            
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
                    <div className="w-full bg-black/20 h-2 rounded-full mt-3 overflow-hidden shadow-inner">
                        <div className="bg-white h-full rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)]" style={{ width: `${waterPercentage}%` }}></div>
                    </div>
                </div>
            </div>
          </div>

          {/* Sleep Card - Fat 3D Molded Edge + Contact Shadow */}
          <div 
            onClick={() => { setActiveModal('SLEEP'); triggerHaptic('medium'); }}
            className="group relative h-48 rounded-[2rem] p-5 overflow-hidden cursor-pointer transition-all active:scale-95
            bg-gradient-to-b from-[#7E57C2] to-[#5E35B1] 
            shadow-[6px_6px_12px_rgba(94,53,177,0.3),18px_18px_36px_rgba(94,53,177,0.4),-18px_-18px_36px_rgba(255,255,255,0.5)]"
          >
             <div className="absolute inset-0 rounded-[2rem] border border-white/20 pointer-events-none"></div>
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
                    <div className="w-full bg-black/20 h-2 rounded-full mt-3 overflow-hidden shadow-inner">
                        <div className="bg-white h-full rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)]" style={{ width: `${sleepPercentage}%` }}></div>
                    </div>
                </div>
            </div>
          </div>

          {/* Gym Card - Fat 3D Molded Edge + Contact Shadow */}
          <div 
            onClick={() => { setActiveModal('GYM_LIST'); triggerHaptic('medium'); }}
            className="group relative h-48 rounded-[2rem] p-5 overflow-hidden cursor-pointer transition-all active:scale-95
            bg-gradient-to-b from-[#FF8A65] to-[#E64A19] 
            shadow-[6px_6px_12px_rgba(216,67,21,0.3),18px_18px_36px_rgba(216,67,21,0.4),-18px_-18px_36px_rgba(255,255,255,0.5)]"
          >
             <div className="absolute inset-0 rounded-[2rem] border border-white/20 pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-[2rem]"></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <GymIcon />
                    <h3 className="text-white font-bold text-lg leading-tight drop-shadow-sm">Gym<br/>Workout</h3>
                </div>
                {log.didExercise && log.exerciseType === 'Gym' ? (
                     <span className="text-xl font-bold text-white drop-shadow-md">{log.exerciseDuration || 30} min</span>
                ) : (
                     <div className="self-start text-[10px] font-bold text-[#BF360C] uppercase tracking-widest bg-white/90 px-3 py-1.5 rounded-lg shadow-sm">
                        Start Session
                     </div>
                )}
            </div>
          </div>

          {/* Yoga Card - Fat 3D Molded Edge + Contact Shadow */}
          <div 
            onClick={fetchYogaExercises}
            className="group relative h-48 rounded-[2rem] p-5 overflow-hidden cursor-pointer transition-all active:scale-95
            bg-gradient-to-b from-[#F06292] to-[#D81B60] 
            shadow-[6px_6px_12px_rgba(194,24,91,0.3),18px_18px_36px_rgba(194,24,91,0.4),-18px_-18px_36px_rgba(255,255,255,0.5)]"
          >
             <div className="absolute inset-0 rounded-[2rem] border border-white/20 pointer-events-none"></div>
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

      <div className="px-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Wellness Knowledge</h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 snap-x px-2 -mx-2">
              {AI_TOPICS.map(topic => (
                  <div 
                    key={topic.id}
                    onClick={() => loadContent(topic)}
                    className={`flex-shrink-0 w-36 h-40 rounded-3xl bg-gradient-to-br ${topic.bg} relative p-4 flex flex-col justify-between snap-center cursor-pointer transition-transform active:scale-95 shadow-[6px_6px_12px_rgba(0,0,0,0.05),12px_12px_24px_rgba(0,0,0,0.1),-10px_-10px_20px_rgba(255,255,255,0.8)] hover:shadow-lg hover:-translate-y-1`}
                  >
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/60 to-transparent pointer-events-none"></div>
                      
                      <div className="relative z-10">
                        <div className={`w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center ${topic.color} shadow-sm backdrop-blur-sm mb-2`}>
                            <topic.icon size={20} />
                        </div>
                        <h4 className="font-bold text-gray-700 text-sm leading-tight">{topic.title}</h4>
                      </div>
                      
                      <div className="relative z-10 flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Explore</span>
                          <div className={`w-6 h-6 rounded-full bg-white/50 flex items-center justify-center ${topic.color}`}>
                              <ArrowRight size={12} />
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>

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
            <div className="space-y-4">
              {yogaList.map((exercise, idx) => (
                <div 
                  key={idx}
                  onClick={() => openYogaTimer(exercise)}
                  className="group relative h-28 bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-5 overflow-hidden shadow-lg cursor-pointer transform transition-transform hover:scale-[1.02]"
                  style={{ perspective: '1000px' }}
                >
                    <div className="absolute top-0 right-0 w-24 h-full bg-white/5 skew-x-12 border-l border-white/10"></div>
                    <div className="absolute bottom-0 right-10 w-16 h-full bg-white/5 skew-x-12 border-l border-white/5"></div>
                    
                    <div className="relative z-10 flex justify-between items-center h-full">
                        <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-white font-bold text-xl tracking-tight">{exercise.name}</h4>
                              <span className={`w-2 h-2 rounded-full ${
                                  exercise.difficulty === 'Beginner' ? 'bg-green-400' : 
                                  exercise.difficulty === 'Intermediate' ? 'bg-yellow-400' : 'bg-red-400'
                              }`}></span>
                            </div>
                            <p className="text-gray-400 text-xs mt-1 line-clamp-2">{exercise.description}</p>
                        </div>
                        <div className="flex flex-col items-end justify-center bg-black/20 p-3 rounded-xl border border-white/10 backdrop-blur-sm min-w-[70px]">
                            <span className="text-3xl font-bold text-[#E84C7C] leading-none">{exercise.durationSeconds}</span>
                            <span className="text-[9px] text-gray-300 uppercase tracking-widest font-bold mt-1">Secs</span>
                        </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeModal === 'GYM_LIST' && (
        <div className="px-6 pb-6 animate-in slide-in-from-bottom duration-500">
          <div className="flex justify-between items-end mb-4">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white">Strength Training</h3>
             <button onClick={() => setActiveModal('NONE')} className="text-xs text-gray-400 font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">Close</button>
          </div>
          <div className="space-y-4">
              {GYM_EXERCISES.map((ex, idx) => (
                  <div 
                    key={idx}
                    onClick={() => openGymTimer(ex)}
                    className="group relative h-28 bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-5 overflow-hidden shadow-lg cursor-pointer transform transition-transform hover:scale-[1.02]"
                    style={{ perspective: '1000px' }}
                  >
                      <div className="absolute top-0 right-0 w-24 h-full bg-white/5 skew-x-12 border-l border-white/10"></div>
                      <div className="absolute bottom-0 right-10 w-16 h-full bg-white/5 skew-x-12 border-l border-white/5"></div>
                      
                      <div className="relative z-10 flex justify-between items-center h-full">
                          <div>
                              <h4 className="text-white font-bold text-xl tracking-tight">{ex.name}</h4>
                              <p className="text-gray-400 text-xs mt-1 max-w-[150px]">{ex.description}</p>
                          </div>
                          <div className="flex flex-col items-end justify-center bg-black/20 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                              <span className="text-3xl font-bold text-orange-500 leading-none">{ex.sets}</span>
                              <span className="text-[9px] text-gray-300 uppercase tracking-widest font-bold mt-1">Sets</span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
        </div>
      )}

      {activeModal === 'CONTENT' && selectedTopic && contentData && (
          <div 
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => setActiveModal('NONE')}
          >
              <div 
                className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2rem] p-0 relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
              >
                  <div className={`h-40 w-full bg-gradient-to-br ${selectedTopic.bg} relative`}>
                      <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"></div>
                      <button onClick={() => setActiveModal('NONE')} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/50 flex items-center justify-center z-20">
                          <X size={16} className="text-gray-600" />
                      </button>
                      <div className="absolute bottom-6 left-6 z-10">
                          <div className={`w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md mb-3 ${selectedTopic.color}`}>
                              <selectedTopic.icon size={28} />
                          </div>
                          <h2 className="text-2xl font-bold text-gray-800">{selectedTopic.title}</h2>
                      </div>
                  </div>
                  
                  <div className="p-6">
                      <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl mb-6 border-l-4 border-[#E84C7C]">
                              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                  {contentData.insight}
                              </p>
                          </div>
                          
                          <div className="space-y-5">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                  <Activity size={14} /> Key Benefits
                              </h4>
                              {contentData.stats.map((stat: any, idx: number) => (
                                  <div key={idx}>
                                      <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                                          <span>{stat.label}</span>
                                          <span>{stat.value}%</span>
                                      </div>
                                      <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden shadow-inner">
                                          <div 
                                            className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000 ease-out`}
                                            style={{ width: `${stat.value}%`, transitionDelay: `${idx * 150}ms` }}
                                          ></div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeModal === 'WATER' && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setActiveModal('NONE')}
        >
           <div 
            className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 relative shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
            onClick={e => e.stopPropagation()}
          >
             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
             
             <div className="text-center mb-6 pt-4">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2">
                     <Droplet className="text-blue-500 fill-blue-500" /> Hydration
                 </h2>
                 <p className="text-sm text-gray-400 mt-1">Recommended: {log.waterTarget} ml</p>
             </div>

             <div className="flex justify-center mb-10">
                 <div className="relative w-48 h-48 flex items-center justify-center">
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

      {activeModal === 'SLEEP' && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setActiveModal('NONE')}
        >
           <div 
            className="w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 relative shadow-2xl bg-gradient-to-b from-[#0F172A] to-[#1E1B4B] max-h-[85vh] overflow-y-auto overflow-x-hidden no-scrollbar"
            onClick={e => e.stopPropagation()}
          >
             <div className="absolute inset-0 z-0 opacity-40">
                <div className="absolute top-10 left-10 w-1 h-1 bg-white rounded-full animate-pulse"></div>
                <div className="absolute top-20 right-20 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-32 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
             </div>

             <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full z-10"></div>
             
             <div className="text-center mb-6 pt-4 relative z-10">
                 <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                     {sleepProgressRatio >= 1 ? <Sun className="text-amber-400 fill-amber-400" /> : <Moon className="text-indigo-300 fill-indigo-300" />}
                     Sleep Tracking
                 </h2>
                 <p className="text-sm text-indigo-200/70 mt-1">Goal: {sleepTargetHours} hours</p>
             </div>

             <div className="flex justify-center mb-8 relative z-10">
                 <div className="relative w-64 h-64 flex items-center justify-center">
                    
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        
                        <svg width="140" height="140" viewBox="0 0 100 100" 
                            className="absolute transition-all duration-1000 ease-in-out"
                            style={{ 
                                opacity: 1 - sleepProgressRatio,
                                transform: `scale(${1 - (0.3 * sleepProgressRatio)}) rotate(${sleepProgressRatio * -20}deg)`
                            }}
                        >
                            <defs>
                                <radialGradient id="realMoonGrad" cx="30%" cy="30%" r="80%">
                                    <stop offset="0%" stopColor="#FFFFFF" />
                                    <stop offset="100%" stopColor="#4B5563" />
                                </radialGradient>
                            </defs>
                            <circle cx="50" cy="50" r="42" fill="url(#realMoonGrad)" />
                        </svg>

                        <svg width="150" height="150" viewBox="0 0 100 100" 
                             className="absolute transition-all duration-1000 ease-in-out"
                             style={{ 
                                opacity: sleepProgressRatio,
                                transform: `scale(${0.6 + (0.4 * sleepProgressRatio)})`
                             }}
                        >
                             <circle cx="50" cy="50" r="38" fill="#F59E0B" />
                        </svg>

                    </div>

                    <svg className="w-full h-full rotate-[-90deg] absolute inset-0" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#312E81" strokeWidth="4" className="opacity-30" />
                        <circle 
                            cx="50" cy="50" r="45" fill="none" 
                            stroke={sleepProgressRatio > 0.6 ? "#FBBF24" : "#6366F1"} 
                            strokeWidth="5" 
                            strokeLinecap="round" strokeDasharray="283" 
                            strokeDashoffset={283 - (283 * sleepPercentage / 100)}
                            className="transition-all duration-700 ease-out"
                        />
                    </svg>
                 </div>
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

      {(selectedYoga || activeModal === 'GYM_TIMER') && (
        <div 
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => { 
              setSelectedYoga(null); 
              setIsTimerRunning(false); 
              if(activeModal === 'GYM_TIMER') setActiveModal('GYM_LIST'); 
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 animate-in slide-in-from-bottom duration-300 relative shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>

            <div className="text-center mb-8 pt-4">
              <span className="inline-block px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 text-[#E84C7C] text-xs font-bold uppercase tracking-widest mb-4">
                {selectedYoga ? 'Yoga Flow' : 'Strength Set'}
              </span>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                  {selectedYoga ? selectedYoga.name : selectedGymExercise?.name}
              </h2>
              {selectedYoga && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">{selectedYoga.description}</p>
              )}
            </div>

            {showCompletion ? (
                <div className="flex flex-col items-center justify-center h-64 animate-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-4 shadow-lg shadow-green-200">
                        <Trophy size={48} fill="currentColor" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {activeModal === 'GYM_TIMER' ? 'Set Complete!' : 'Well Done!'}
                    </h3>
                </div>
            ) : (
                <div className="flex justify-center mb-10">
                <div className="relative w-64 h-64 flex items-center justify-center">
                    
                    <svg className="w-full h-full rotate-[-90deg] drop-shadow-xl" viewBox="0 0 100 100">
                    <defs>
                        <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#E84C7C" />
                        <stop offset="100%" stopColor="#F472B6" />
                        </linearGradient>
                    </defs>

                    <circle cx="50" cy="50" r="45" fill="none" stroke="#F3F4F6" strokeWidth="4" className="dark:stroke-gray-700"/>

                    {selectedYoga ? (
                        <circle
                            cx="50" cy="50" r="45" fill="none" stroke="url(#timerGradient)" strokeWidth="6"
                            strokeDasharray="283"
                            strokeDashoffset={283 - (283 * (timerSeconds / selectedYoga.durationSeconds))}
                            strokeLinecap="round"
                            className="transition-all duration-1000 linear"
                        />
                    ) : (
                        // Gym timer just pulses when active
                        <circle
                            cx="50" cy="50" r="45" fill="none" stroke="url(#timerGradient)" strokeWidth="6"
                            strokeDasharray="283"
                            strokeDashoffset={0}
                            strokeLinecap="round"
                            className={isTimerRunning ? "animate-pulse" : ""}
                            opacity={isTimerRunning ? 1 : 0.2}
                        />
                    )}
                    </svg>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-6xl font-bold text-[#2D2D2D] dark:text-white font-mono tracking-tighter tabular-nums">
                        {formatTime(timerSeconds)}
                    </div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">
                        {isTimerRunning ? 'Active' : 'Paused'}
                    </span>
                    </div>
                </div>
                </div>
            )}

            {activeModal === 'GYM_TIMER' && !showCompletion && (
                <div className="flex justify-center items-center gap-6 mb-8">
                    <button disabled className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold">-</button>
                    <div className="text-center">
                        <div className="text-sm text-gray-400 uppercase tracking-widest font-bold">Set</div>
                        <div className="text-2xl font-bold text-gray-800 dark:text-white">{currentSet} / {targetSets}</div>
                    </div>
                    <button onClick={incrementSet} className="w-10 h-10 rounded-full bg-[#E84C7C] text-white flex items-center justify-center font-bold shadow-lg active:scale-95 transition-transform">+</button>
                </div>
            )}

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
                    onClick={() => { 
                        setSelectedYoga(null); 
                        setIsTimerRunning(false); 
                        if(activeModal === 'GYM_TIMER') setActiveModal('GYM_LIST');
                    }}
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