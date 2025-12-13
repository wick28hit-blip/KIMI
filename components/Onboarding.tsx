import React, { useState, useEffect } from 'react';
import { User, ChevronLeft, CalendarCheck, Users, Baby, X } from 'lucide-react';
import { UserProfile, CycleData, DailyLog } from '../types';
import PinLock from './PinLock';
import ScrollPicker from './ScrollPicker';
import CircularSlider from './CircularSlider';
import { format, getDaysInMonth, setDate, setMonth, setYear, subMonths, subDays, startOfDay } from 'date-fns';
import { calculateNormalizedBMI } from '../utils/calculations';

interface OnboardingProps {
  onComplete: (user: UserProfile, cycle: CycleData, initialLogs?: Record<string, DailyLog>) => void;
  isAddingProfile?: boolean; 
  onCancel?: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isAddingProfile = false, onCancel }) => {
  const [step, setStep] = useState(0);
  
  // Relationship State
  const [relationship, setRelationship] = useState<'Self' | 'Daughter' | 'Sister' | 'Friend' | 'Other'>('Self');

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState(25);
  
  // Date Picker State - Defaults to Today (Midnight to avoid DST issues)
  const [pickerDate, setPickerDate] = useState(startOfDay(new Date()));
  
  // Cycle State
  const [cycleLength, setCycleLength] = useState(28);
  const [periodDuration, setPeriodDuration] = useState(5);
  
  // PMS Prediction Data (New)
  const [stress, setStress] = useState(5);
  const [sleep, setSleep] = useState(5); // 0-10, will label as "Sleep Issues" to match formula logic
  const [anxiety, setAnxiety] = useState(5);
  const [depression, setDepression] = useState(5);
  
  // Body Metrics
  const [height, setHeight] = useState(165); // cm
  const [weight, setWeight] = useState(65); // kg

  // History State (Step 8)
  const [historyDates, setHistoryDates] = useState<Date[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempEditDate, setTempEditDate] = useState<Date>(startOfDay(new Date()));

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  // Helpers for ScrollPicker Data
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentYear = new Date().getFullYear();
  // Provide previous, current, and next year to prevent accidental edge selection
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const cycleRange = Array.from({ length: 25 }, (_, i) => 21 + i); 
  const durationRange = Array.from({ length: 9 }, (_, i) => 2 + i); 

  // Ranges for Body Metrics
  const heightRange = Array.from({ length: 100 }, (_, i) => 120 + i); // 120cm - 220cm
  const weightRange = Array.from({ length: 120 }, (_, i) => 30 + i); // 30kg - 150kg

  // Date Picker Logic
  const handleDayChange = (day: number) => {
    const daysInMonth = getDaysInMonth(pickerDate);
    const validDay = Math.min(day, daysInMonth);
    // Ensure we keep it at start of day
    setPickerDate(d => startOfDay(setDate(d, validDay)));
  };
  const handleMonthChange = (monthName: string) => {
    const monthIndex = months.indexOf(monthName);
    setPickerDate(d => startOfDay(setMonth(d, monthIndex)));
  };
  const handleYearChange = (year: number) => {
    setPickerDate(d => startOfDay(setYear(d, year)));
  };

  // Temp Date Picker Logic for Editing History
  const handleTempDayChange = (day: number) => {
      const daysInMonth = getDaysInMonth(tempEditDate);
      const validDay = Math.min(day, daysInMonth);
      setTempEditDate(d => startOfDay(setDate(d, validDay)));
  };
  const handleTempMonthChange = (monthName: string) => {
      const monthIndex = months.indexOf(monthName);
      setTempEditDate(d => startOfDay(setMonth(d, monthIndex)));
  };
  const handleTempYearChange = (year: number) => {
      setTempEditDate(d => startOfDay(setYear(d, year)));
  };

  // Initialize History Dates when entering Step 8
  useEffect(() => {
    if (step === 8) {
        // ALGORITHM UPDATE: 
        // Use (CycleLength - 1) as the interval based on user preference that the Nth day is the START of the next period.
        const effectiveInterval = cycleLength - 1;
        
        // We project backwards: Last Period - Interval, and - 2*Interval
        const h1 = subDays(pickerDate, effectiveInterval);
        const h2 = subDays(pickerDate, effectiveInterval * 2);
        setHistoryDates([h1, h2]);
    }
  }, [step, pickerDate, cycleLength]);

  const saveHistoryEdit = () => {
      if (editingIndex !== null) {
          const newDates = [...historyDates];
          newDates[editingIndex] = tempEditDate;
          setHistoryDates(newDates);
          setEditingIndex(null);
      }
  };

  const finishOnboarding = (pin: string | null) => {
    const bmi = calculateNormalizedBMI(height, weight);
    
    const user: UserProfile = {
      id: Date.now().toString(),
      name, 
      relationship,
      age, 
      pin: pin || '',
      notificationsEnabled: true, // Default to true on new profile creation
      pmsData: {
        stress,
        sleep,
        anxiety,
        depression,
        height,
        weight,
        bmi,
        diet: 5 // Default middle value as not explicitly asked in UI
      }
    };
    const cycle: CycleData = {
      lastPeriodDate: format(pickerDate, 'yyyy-MM-dd'),
      cycleLength, 
      periodDuration
    };

    // Generate Initial Logs for History
    const initialLogs: Record<string, DailyLog> = {};
    
    // Helper to add a period log
    const addPeriodLog = (startDate: Date) => {
        const dateStr = format(startDate, 'yyyy-MM-dd');
        initialLogs[dateStr] = {
            date: dateStr,
            waterIntake: 0,
            flow: 'Medium', // Assume medium flow for historical records
            mood: [],
            symptoms: [],
            medication: false,
            didExercise: false,
            habits: { smoked: false, drank: false }
        };
    };

    // Add confirmed last period
    addPeriodLog(pickerDate);
    // Add verified history dates
    historyDates.forEach(d => addPeriodLog(d));

    onComplete(user, cycle, initialLogs);
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Relationship Selection
        return (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-bold text-[#E84C7C] mb-2">{isAddingProfile ? 'New Profile' : 'Welcome to KIMI'}</h1>
            <p className="text-gray-500 mb-8">Who are you tracking for?</p>
            
            <div className="space-y-4">
                <button 
                    onClick={() => { setRelationship('Self'); next(); }}
                    className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all hover:bg-pink-50 ${relationship === 'Self' ? 'border-[#E84C7C] bg-pink-50' : 'border-gray-100 bg-white'}`}
                >
                    <div className="p-3 bg-pink-100 rounded-full text-[#E84C7C]">
                        <User />
                    </div>
                    <span className="font-bold text-lg text-gray-700">Myself</span>
                </button>

                <button 
                    onClick={() => { setRelationship('Daughter'); next(); }}
                    className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all hover:bg-pink-50 ${relationship === 'Daughter' ? 'border-[#E84C7C] bg-pink-50' : 'border-gray-100 bg-white'}`}
                >
                    <div className="p-3 bg-purple-100 rounded-full text-purple-500">
                        <Baby />
                    </div>
                    <span className="font-bold text-lg text-gray-700">My Daughter</span>
                </button>

                <button 
                    onClick={() => { setRelationship('Other'); next(); }}
                    className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all hover:bg-pink-50 ${relationship === 'Other' ? 'border-[#E84C7C] bg-pink-50' : 'border-gray-100 bg-white'}`}
                >
                    <div className="p-3 bg-blue-100 rounded-full text-blue-500">
                        <Users />
                    </div>
                    <span className="font-bold text-lg text-gray-700">Someone Else</span>
                </button>
            </div>
           </div>
        );

      case 1: // Name & Age
        return (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">Profile Details</h2>
            <p className="text-gray-500 mb-8">Let's get to know {relationship === 'Self' ? 'you' : 'them'} better.</p>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-100 flex items-center gap-3 mb-4">
              <User className="text-gray-400" />
              <input
                type="text"
                placeholder={relationship === 'Self' ? "What's your name?" : "What's her name?"}
                className="flex-1 bg-transparent outline-none text-lg text-[#2D2D2D] placeholder-gray-400"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-100 flex items-center gap-3">
              <span className="text-gray-400 w-6 text-center text-sm font-bold">Age</span>
              <input
                type="number"
                placeholder="Age"
                className="flex-1 bg-transparent outline-none text-lg text-[#2D2D2D] placeholder-gray-400"
                value={age}
                onChange={e => setAge(parseInt(e.target.value))}
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

      case 2: // Cycle Data
        return (
          <div className="flex flex-col h-full max-h-[80vh] animate-in fade-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-4 shrink-0">Cycle Details</h2>
            
            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pr-1">
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
      
      // NEW HEALTH METRICS STEPS using Circular Slider

      case 3: // Stress
        return (
          <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center justify-center h-full">
            <CircularSlider 
              value={stress} 
              onChange={setStress} 
              label="Rate Stress Level" 
              color="#F87171"
              maxLabel="Extreme"
            />
            <button onClick={next} className="w-full mt-8 bg-[#E84C7C] text-white py-4 rounded-xl font-semibold shadow-lg shadow-pink-200">
              Next
            </button>
          </div>
        );

      case 4: // Sleep
        return (
          <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center justify-center h-full">
            <CircularSlider 
              value={sleep} 
              onChange={setSleep} 
              label="Rate Sleep Issues" 
              color="#818CF8"
              minLabel="Good Sleep"
              maxLabel="Insomnia"
            />
            <button onClick={next} className="w-full mt-8 bg-[#E84C7C] text-white py-4 rounded-xl font-semibold shadow-lg shadow-pink-200">
              Next
            </button>
          </div>
        );

      case 5: // Anxiety
        return (
          <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center justify-center h-full">
            <CircularSlider 
              value={anxiety} 
              onChange={setAnxiety} 
              label="Rate Anxiety Level" 
              color="#F472B6"
              maxLabel="Panic"
            />
            <button onClick={next} className="w-full mt-8 bg-[#E84C7C] text-white py-4 rounded-xl font-semibold shadow-lg shadow-pink-200">
              Next
            </button>
          </div>
        );

      case 6: // Depression
        return (
          <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center justify-center h-full">
            <CircularSlider 
              value={depression} 
              onChange={setDepression} 
              label="Rate Depression Level" 
              color="#60A5FA"
              maxLabel="Severe"
            />
            <button onClick={next} className="w-full mt-8 bg-[#E84C7C] text-white py-4 rounded-xl font-semibold shadow-lg shadow-pink-200">
              Next
            </button>
          </div>
        );

      case 7: // Body Metrics
        return (
           <div className="animate-in fade-in slide-in-from-right-8 duration-300 flex flex-col h-full max-h-[80vh]">
             <h2 className="text-2xl font-bold text-[#2D2D2D] mb-4">Body Metrics</h2>
             <p className="text-gray-500 mb-6">Height and weight help us calculate BMI factors for cycle health.</p>
             
             <div className="flex-1 overflow-y-auto no-scrollbar">
               <div className="flex gap-4">
                  <div className="flex-1">
                      <label className="block text-center font-bold text-gray-500 mb-2">Height (cm)</label>
                      <ScrollPicker 
                        items={heightRange} 
                        value={height} 
                        onChange={setHeight}
                        height={200}
                      />
                  </div>
                  <div className="flex-1">
                      <label className="block text-center font-bold text-gray-500 mb-2">Weight (kg)</label>
                      <ScrollPicker 
                        items={weightRange} 
                        value={weight} 
                        onChange={setWeight}
                        height={200}
                      />
                  </div>
               </div>
               
               <div className="mt-8 p-4 bg-gray-100 rounded-xl text-center">
                  <span className="text-sm text-gray-500">Calculated BMI</span>
                  <div className="text-2xl font-bold text-gray-800">
                    {(weight / ((height/100) * (height/100))).toFixed(1)}
                  </div>
               </div>
             </div>

             <button onClick={next} className="w-full mt-4 bg-[#E84C7C] text-white py-4 rounded-xl font-semibold shadow-lg shadow-pink-200">
               Calculate Risk
             </button>
           </div>
        );
        
      case 8: // History Check (Last Step before PIN)
        return (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300 relative h-full flex flex-col">
                <h2 className="text-2xl font-bold text-[#2D2D2D] mb-2">Verify History</h2>
                <p className="text-gray-500 mb-6 text-sm">We predicted past dates based on input. Tap to edit if incorrect.</p>
                
                <div className="space-y-4 mb-8 flex-1">
                    {historyDates.map((date, idx) => (
                        <button 
                            key={idx}
                            onClick={() => {
                                setEditingIndex(idx);
                                setTempEditDate(date);
                            }}
                            className="w-full bg-white p-4 rounded-xl border-l-4 border-[#E84C7C] shadow-sm hover:bg-pink-50 transition-colors text-left group"
                        >
                            <span className="text-xs text-gray-400 font-bold uppercase">{idx === 0 ? 'Last Month' : '2 Months Ago'}</span>
                            <div className="flex justify-between items-center mt-1">
                                <span className="font-bold text-gray-800 text-lg">{format(date, 'MMMM do')}</span>
                                <div className="flex items-center gap-2 text-gray-400 group-hover:text-[#E84C7C] transition-colors">
                                    <span className="text-xs font-bold">Edit</span>
                                    <CalendarCheck size={18} />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-auto">
                     <button 
                        onClick={() => {
                            if(isAddingProfile) {
                                finishOnboarding(null);
                            } else {
                                next();
                            }
                        }} 
                        className="w-full bg-[#E84C7C] text-white py-4 rounded-xl font-semibold shadow-lg shadow-pink-200"
                    >
                        Yes, Correct
                    </button>
                </div>
                
                {/* Date Editor Modal */}
                {editingIndex !== null && (
                    <div className="absolute inset-0 z-50 bg-[#FFF0F3] flex flex-col animate-in slide-in-from-bottom-10 rounded-xl">
                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="text-xl font-bold text-[#2D2D2D] mb-6">Edit Period Date</h3>
                             
                             <div className="flex-1 flex flex-col justify-center">
                                 <div className="flex gap-2 mb-4">
                                    <ScrollPicker 
                                    items={days} 
                                    value={tempEditDate.getDate()} 
                                    onChange={handleTempDayChange}
                                    className="flex-1"
                                    height={150}
                                    />
                                    <ScrollPicker 
                                    items={months} 
                                    value={months[tempEditDate.getMonth()]} 
                                    onChange={handleTempMonthChange}
                                    formatLabel={(m) => m.substring(0, 3)}
                                    className="flex-1"
                                    height={150}
                                    />
                                    <ScrollPicker 
                                    items={years} 
                                    value={tempEditDate.getFullYear()} 
                                    onChange={handleTempYearChange}
                                    className="flex-1"
                                    height={150}
                                    />
                                </div>
                             </div>

                             <div className="flex gap-4">
                                <button onClick={() => setEditingIndex(null)} className="flex-1 bg-white text-gray-500 py-4 rounded-xl font-bold shadow-sm">
                                    Cancel
                                </button>
                                <button onClick={saveHistoryEdit} className="flex-1 bg-[#E84C7C] text-white py-4 rounded-xl font-bold shadow-lg shadow-pink-200">
                                    Save Date
                                </button>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        );

      case 9: // PIN Setup (Only for initial setup)
        return (
          <PinLock 
            isSetup 
            onSuccess={(pin) => finishOnboarding(pin)} 
          />
        );
    }
  };

  const isPinStep = step === 9;

  return (
    <div className={`h-screen bg-[#FFF0F3] flex flex-col items-center relative transition-all overflow-hidden ${isPinStep ? 'p-0' : 'p-6'}`}>
      
      {/* Cancel Button for Adding Profile */}
      {isAddingProfile && !isPinStep && (
          <button 
            onClick={onCancel}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/50 text-gray-500 hover:bg-red-50 hover:text-red-500 shadow-sm transition-all z-20"
          >
            <X size={20} />
          </button>
      )}

      {/* Back Button */}
      {step > 0 && !isPinStep && !editingIndex && (
        <button 
          onClick={back}
          className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/50 text-[#E84C7C] hover:bg-white shadow-sm transition-all z-20"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Progress Bar (hidden on PIN step or editing) */}
      {!isPinStep && !editingIndex && (
        <div className="w-full max-w-md mt-12 mb-4 px-2 shrink-0">
           <div className="flex gap-2">
            {[0,1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= step ? 'bg-[#E84C7C]' : 'bg-pink-200'}`} />
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