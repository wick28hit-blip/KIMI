
import React, { useState, useRef } from 'react';
import { ArrowRight, Calendar, User, Briefcase, Moon, Cigarette, Wine, Activity, ChevronLeft, Check, X, Dumbbell } from 'lucide-react';
import { UserProfile, CycleData } from '../types';
import PinLock from './PinLock';
import ScrollPicker from './ScrollPicker';
import { format, getDaysInMonth, setDate, setMonth, setYear } from 'date-fns';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

interface OnboardingProps {
  onComplete: (user: UserProfile, cycle: CycleData) => void;
}

// --- Habit Types & Data ---

type HabitKey = 'smoking' | 'alcohol' | 'sleep' | 'stress' | 'exercise';

interface HabitCardConfig {
  id: HabitKey;
  title: string;
  question: string;
  icon: React.ElementType;
  color: string;
}

const HABIT_CARDS: HabitCardConfig[] = [
  { id: 'smoking', title: 'Smoking', question: 'Do you smoke?', icon: Cigarette, color: '#EF4444' },
  { id: 'alcohol', title: 'Alcohol', question: 'Do you consume alcohol?', icon: Wine, color: '#F59E0B' },
  { id: 'sleep', title: 'Sleep Pattern', question: 'Do you maintain regular sleep (7-9h)?', icon: Moon, color: '#6366F1' },
  { id: 'stress', title: 'Stress Level', question: 'Do you experience high stress?', icon: Activity, color: '#EC4899' },
  { id: 'exercise', title: 'Exercise Routine', question: 'Do you exercise regularly?', icon: Dumbbell, color: '#10B981' },
];

interface HabitCardProps {
  config: HabitCardConfig;
  onSwipe: (direction: 'left' | 'right') => void;
  index: number;
}

const HabitCard: React.FC<HabitCardProps> = ({ 
  config, 
  onSwipe, 
  index 
}) => {
  const x = useMotionValue(0);
  // Smoother rotation range
  const rotate = useTransform(x, [-200, 200], [-15, 15]); 
  // Smoother opacity transition
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  
  // Overlay Opacities
  const likeOpacity = useTransform(x, [20, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-20, -150], [0, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    // Increased threshold for deliberate swipes
    if (info.offset.x > 80) {
      onSwipe('right');
    } else if (info.offset.x < -80) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, zIndex: 100 - index }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      // Softer spring for smoother feel
      dragTransition={{ bounceStiffness: 200, bounceDamping: 20 }} 
      dragSnapToOrigin={true} // Always snap back if not swiped far enough
      onDragEnd={handleDragEnd}
      className="absolute top-0 w-full h-full bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center justify-center p-6 cursor-grab active:cursor-grabbing origin-bottom"
      initial={{ scale: 0.95, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Swipe Overlays */}
      <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 border-4 border-green-500 rounded-lg px-4 py-2 -rotate-12 z-20 bg-white/50 backdrop-blur-sm pointer-events-none">
        <span className="text-green-500 font-bold text-2xl uppercase">Yes</span>
      </motion.div>
      <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-8 border-4 border-red-500 rounded-lg px-4 py-2 rotate-12 z-20 bg-white/50 backdrop-blur-sm pointer-events-none">
        <span className="text-red-500 font-bold text-2xl uppercase">No</span>
      </motion.div>

      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 bg-opacity-10 pointer-events-none`} style={{ backgroundColor: `${config.color}20` }}>
        <config.icon size={48} style={{ color: config.color }} />
      </div>
      <h3 className="text-2xl font-bold text-center mb-2 text-[#2D2D2D] pointer-events-none">{config.title}</h3>
      <p className="text-gray-500 text-center text-lg pointer-events-none">{config.question}</p>
      
      <div className="absolute bottom-8 flex gap-4 text-sm text-gray-400 pointer-events-none">
         <span className="flex items-center gap-1"><ChevronLeft size={16}/> Swipe Left for NO</span>
         <span className="flex items-center gap-1">Swipe Right for YES <ArrowRight size={16}/></span>
      </div>
    </motion.div>
  );
};

// --- Main Component ---

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  
  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState(25);
  
  // Date Picker State
  const [pickerDate, setPickerDate] = useState(new Date());
  
  // Cycle State
  const [cycleLength, setCycleLength] = useState(28);
  const [periodDuration, setPeriodDuration] = useState(5);
  const [isPro, setIsPro] = useState(false);
  
  // Habits State
  const [currentHabitIndex, setCurrentHabitIndex] = useState(0);
  const [habits, setHabits] = useState({
    smoking: { value: false },
    alcohol: { value: false },
    sleep: { value: true },
    stress: { value: false },
    exercise: { value: true }
  });

  const next = () => setStep(s => s + 1);
  const back = () => {
    if (step === 3 && currentHabitIndex > 0) {
      setCurrentHabitIndex(i => i - 1);
    } else {
      setStep(s => Math.max(0, s - 1));
    }
  };

  // Helpers for ScrollPicker Data
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 2 }, (_, i) => currentYear - 1 + i); // Last year and this year
  const cycleRange = Array.from({ length: 25 }, (_, i) => 21 + i); // 21 - 45
  const durationRange = Array.from({ length: 9 }, (_, i) => 2 + i); // 2 - 10

  // Date Picker Logic
  const handleDayChange = (day: number) => {
    const daysInMonth = getDaysInMonth(pickerDate);
    const validDay = Math.min(day, daysInMonth);
    setPickerDate(d => setDate(d, validDay));
  };

  const handleMonthChange = (monthName: string) => {
    const monthIndex = months.indexOf(monthName);
    setPickerDate(d => {
      const newDate = setMonth(d, monthIndex);
      return newDate;
    });
  };

  const handleYearChange = (year: number) => {
    setPickerDate(d => setYear(d, year));
  };

  // Swipe Handlers
  const handleHabitSwipe = (direction: 'left' | 'right') => {
    const currentHabit = HABIT_CARDS[currentHabitIndex];
    const isYes = direction === 'right';

    // Store basic boolean value immediately. 
    // Detailed editing is now handled in the "Secret Vault" after onboarding.
    setHabits(prev => ({
      ...prev,
      [currentHabit.id]: { 
        value: isYes,
        // Set default text for yes answers so they aren't empty in the Vault
        frequency: isYes ? 'Not specified' : undefined 
      }
    }));
    
    advanceHabit();
  };

  const advanceHabit = () => {
    if (currentHabitIndex < HABIT_CARDS.length - 1) {
      setCurrentHabitIndex(i => i + 1);
    } else {
      // Small delay to let the last card fly off
      setTimeout(() => next(), 200);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Name
        return (
          <div className="animate-float">
            <h1 className="text-3xl font-bold text-[#E84C7C] mb-2">Welcome to KIMI</h1>
            <p className="text-gray-500 mb-8">Let's get to know you better.</p>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-100 flex items-center gap-3">
              <User className="text-gray-400" />
              <input
                type="text"
                placeholder="What's your name?"
                className="flex-1 bg-transparent outline-none text-lg text-[#2D2D2D] placeholder-gray-400"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <button 
              disabled={!name}
              onClick={next}
              className="w-full mt-8 bg-[#E84C7C] text-white py-4 rounded-xl font-semibold shadow-lg shadow-pink-200 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        );

      case 1: // Cycle Data
        return (
          <div className="flex flex-col h-full max-h-[80vh]">
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-4 shrink-0">Cycle Details</h2>
            
            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pr-1">
              {/* Last Period Picker */}
              <label className="block text-sm font-medium text-gray-500 mb-2">Last Period Start Date</label>
              <div className="flex gap-2 mb-4">
                <ScrollPicker 
                  items={days} 
                  value={pickerDate.getDate()} 
                  onChange={handleDayChange}
                  className="flex-1"
                  height={120}
                />
                <ScrollPicker 
                  items={months} 
                  value={months[pickerDate.getMonth()]} 
                  onChange={handleMonthChange}
                  formatLabel={(m) => m.substring(0, 3)}
                  className="flex-1"
                  height={120}
                />
                <ScrollPicker 
                  items={years} 
                  value={pickerDate.getFullYear()} 
                  onChange={handleYearChange}
                  className="flex-1"
                  height={120}
                />
              </div>

              {/* Cycle Length */}
              <label className="block text-sm font-medium text-gray-500 mb-2">Average Cycle Length (Days)</label>
              <div className="mb-4">
                 <ScrollPicker 
                    items={cycleRange}
                    value={cycleLength}
                    onChange={setCycleLength}
                    className="w-full"
                    height={100}
                 />
              </div>

              {/* Period Duration */}
              <label className="block text-sm font-medium text-gray-500 mb-2">Period Duration (Days)</label>
              <div className="mb-4">
                 <ScrollPicker 
                    items={durationRange}
                    value={periodDuration}
                    onChange={setPeriodDuration}
                    className="w-full"
                    height={100}
                 />
              </div>
            </div>

            <div className="pt-4 shrink-0">
              <button onClick={next} className="w-full bg-[#E84C7C] text-white py-4 rounded-xl font-semibold shadow-lg shadow-pink-200">
                Next
              </button>
            </div>
          </div>
        );

      case 2: // Professional
        return (
          <div>
             <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">Lifestyle</h2>
             <p className="text-gray-500 mb-8">This helps us predict stress impact.</p>
             
             <div 
              onClick={() => setIsPro(!isPro)}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 mb-8 ${
                isPro ? 'border-[#E84C7C] bg-pink-50' : 'border-transparent bg-white shadow-sm'
              }`}
             >
                <div className="p-3 bg-white rounded-full shadow-sm text-[#E84C7C]">
                  <Briefcase />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Working Professional</h3>
                  <p className="text-sm text-gray-500">I have a demanding job or schedule</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isPro ? 'border-[#E84C7C]' : 'border-gray-300'}`}>
                  {isPro && <div className="w-3 h-3 bg-[#E84C7C] rounded-full" />}
                </div>
             </div>

             <button onClick={next} className="w-full bg-[#E84C7C] text-white py-4 rounded-xl font-semibold shadow-lg shadow-pink-200">
              Continue
            </button>
          </div>
        );

      case 3: // Habits (Tinder Swipe)
        return (
          <div className="h-[400px] relative">
             <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2 text-center">Habit Check</h2>
             <p className="text-gray-500 mb-6 text-center">Swipe Right for Yes, Left for No</p>
             
             <div className="relative w-full h-[320px]">
                <AnimatePresence>
                  {HABIT_CARDS.map((card, index) => {
                    // Only render current card and maybe next one for stack effect
                    if (index < currentHabitIndex) return null;
                    if (index > currentHabitIndex + 1) return null;
                    
                    return (
                      <HabitCard 
                        key={card.id} 
                        config={card} 
                        index={index - currentHabitIndex}
                        onSwipe={handleHabitSwipe}
                      />
                    );
                  })}
                </AnimatePresence>
             </div>
          </div>
        );

      case 4: // PIN Setup
        return (
          <PinLock 
            isSetup 
            onSuccess={(pin) => {
              const user: UserProfile = {
                name, age, isProfessional: isPro, pin, habits
              };
              const cycle: CycleData = {
                lastPeriodDate: format(pickerDate, 'yyyy-MM-dd'),
                cycleLength, 
                periodDuration
              };
              onComplete(user, cycle);
            }} 
          />
        );
    }
  };

  const isPinStep = step === 4;

  return (
    <div className={`h-screen bg-[#FFF0F3] flex flex-col items-center relative transition-all overflow-hidden ${isPinStep ? 'p-0' : 'p-6'}`}>
      
      {/* Back Button */}
      {step > 0 && (
        <button 
          onClick={back}
          className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/50 text-[#E84C7C] hover:bg-white shadow-sm transition-all z-20"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Progress Bar (hidden on PIN step) */}
      {step < 4 && (
        <div className="w-full max-w-md mt-12 mb-4 px-2 shrink-0">
           <div className="flex gap-2">
            {[0,1,2,3].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-[#E84C7C]' : 'bg-pink-200'}`} />
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="w-full max-w-md flex-1 flex flex-col justify-center min-h-0">
        {renderStep()}
      </div>
    </div>
  );
};

export default Onboarding;
