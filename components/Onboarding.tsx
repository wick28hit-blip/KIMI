import React, { useState, useEffect } from 'react';
import { User, ChevronLeft, CalendarCheck, Users, Baby, X } from 'lucide-react';
import { UserProfile, CycleData, DailyLog } from '../types';
import PinLock from './PinLock';
import ScrollPicker from './ScrollPicker';
import CircularSlider from './CircularSlider';
import { format, getDaysInMonth, setDate, setMonth, setYear, subMonths, subDays, startOfDay } from 'date-fns';
import { calculateNormalizedBMI, calculateWaterTarget } from '../utils/calculations';

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
  
  // Date Picker State - Defaults to Today
  const [pickerDate, setPickerDate] = useState(startOfDay(new Date()));
  
  // Cycle State
  const [cycleLength, setCycleLength] = useState(28);
  const [periodDuration, setPeriodDuration] = useState(5);
  
  // PMS Prediction Data
  const [stress, setStress] = useState(5);
  const [sleep, setSleep] = useState(5); 
  const [anxiety, setAnxiety] = useState(5);
  const [depression, setDepression] = useState(5);
  
  // Body Metrics
  const [height, setHeight] = useState(165); // cm
  const [weight, setWeight] = useState(65); // kg

  // History State
  const [historyDates, setHistoryDates] = useState<Date[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempEditDate, setTempEditDate] = useState<Date>(startOfDay(new Date()));

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  // --- Date Logic Helpers ---
  const today = startOfDay(new Date());
  const prevMonth = subMonths(today, 1);
  
  const validMonthsData = [
    { name: format(prevMonth, 'MMMM'), year: prevMonth.getFullYear(), monthIndex: prevMonth.getMonth() },
    { name: format(today, 'MMMM'), year: today.getFullYear(), monthIndex: today.getMonth() }
  ];
  const validMonthNames = validMonthsData.map(v => v.name);

  const allMonths = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const cycleRange = Array.from({ length: 25 }, (_, i) => 21 + i); 
  const durationRange = Array.from({ length: 9 }, (_, i) => 2 + i); 

  const heightRange = Array.from({ length: 100 }, (_, i) => 120 + i); 
  const weightRange = Array.from({ length: 120 }, (_, i) => 30 + i); 

  const handleRestrictedDayChange = (day: number) => {
    const daysInMonth = getDaysInMonth(pickerDate);
    const validDay = Math.min(day, daysInMonth);
    setPickerDate(d => startOfDay(setDate(d, validDay)));
  };

  const handleRestrictedMonthChange = (monthName: string) => {
    const target = validMonthsData.find(m => m.name === monthName);
    if (target) {
        setPickerDate(prev => {
            let newDate = setYear(setMonth(prev, target.monthIndex), target.year);
            const maxDays = getDaysInMonth(newDate);
            if (newDate.getDate() > maxDays) {
                newDate = setDate(newDate, maxDays);
            }
            return startOfDay(newDate);
        });
    }
  };

  const handleTempDayChange = (day: number) => {
      const daysInMonth = getDaysInMonth(tempEditDate);
      const validDay = Math.min(day, daysInMonth);
      setTempEditDate(d => startOfDay(setDate(d, validDay)));
  };
  const handleTempMonthChange = (monthName: string) => {
      const monthIndex = allMonths.indexOf(monthName);
      setTempEditDate(d => startOfDay(setMonth(d, monthIndex)));
  };

  useEffect(() => {
    if (step === 8) {
        const effectiveInterval = cycleLength - 1;
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
    const waterTarget = calculateWaterTarget(age, weight);
    
    const user: UserProfile = {
      id: Date.now().toString(),
      name, 
      relationship,
      age, 
      pin: pin || '',
      notificationsEnabled: true,
      pmsData: {
        stress,
        sleep,
        anxiety,
        depression,
        height,
        weight,
        bmi,
        diet: 5
      }
    };
    const cycle: CycleData = {
      lastPeriodDate: format(pickerDate, 'yyyy-MM-dd'),
      cycleLength, 
      periodDuration
    };

    const initialLogs: Record<string, DailyLog> = {};
    
    const addPeriodLog = (startDate: Date) => {
        const dateStr = format(startDate, 'yyyy-MM-dd');
        initialLogs[dateStr] = {
            date: dateStr,
            waterIntake: 0,
            waterTarget: waterTarget,
            sleepDuration: 0,
            sleepTarget: 480,
            flow: 'Medium',
            mood: [],
            symptoms: [],
            detailedSymptoms: [],
            medication: false,
            didExercise: false,
            habits: { smoked: false, drank: false }
        };
    };

    addPeriodLog(pickerDate);
    historyDates.forEach(d => addPeriodLog(d));

    onComplete(user, cycle, initialLogs);
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Relationship Selection
        return (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pt-12">
            <div className="mb-6 shrink-0">
                <h1 className="text-3xl font-bold text-[#E84C7C] mb-2">{isAddingProfile ? 'New Profile' : 'Welcome'}</h1>
                <p className="text-gray-500">Who are you tracking for?</p>
            </div>
            
            <div className="flex-1 flex flex-col justify-center gap-4">
                <button 
                    onClick={() => { setRelationship('Self'); next(); }}
                    className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${relationship === 'Self' ? 'neu-active' : 'neu-flat'}`}
                >
                    <div className={`p-3 rounded-full ${relationship === 'Self' ? 'neu-pressed text-[#E84C7C]' : 'bg-pink-50 text-[#E84C7C]'}`}>
                        <User />
                    </div>
                    <span className="font-bold text-lg text-gray-700 dark:text-gray-200">Myself</span>
                </button>

                <button 
                    onClick={() => { setRelationship('Daughter'); next(); }}
                    className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${relationship === 'Daughter' ? 'neu-active' : 'neu-flat'}`}
                >
                    <div className={`p-3 rounded-full ${relationship === 'Daughter' ? 'neu-pressed text-purple-500' : 'bg-purple-50 text-purple-500'}`}>
                        <Baby />
                    </div>
                    <span className="font-bold text-lg text-gray-700 dark:text-gray-200">My Daughter</span>
                </button>

                <button 
                    onClick={() => { setRelationship('Other'); next(); }}
                    className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${relationship === 'Other' ? 'neu-active' : 'neu-flat'}`}
                >
                    <div className={`p-3 rounded-full ${relationship === 'Other' ? 'neu-pressed text-blue-500' : 'bg-blue-50 text-blue-500'}`}>
                        <Users />
                    </div>
                    <span className="font-bold text-lg text-gray-700 dark:text-gray-200">Someone Else</span>
                </button>
            </div>
           </div>
        );

      case 1: // Name & Age
        return (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300 h-full flex flex-col pt-12">
            <div className="mb-8 shrink-0">
                <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white mb-2">Profile Details</h2>
                <p className="text-gray-500">Let's get to know {relationship === 'Self' ? 'you' : 'them'} better.</p>
            </div>
            
            <div className="flex-1 flex flex-col gap-6">
                <div className="neu-pressed p-4 rounded-xl flex items-center gap-3">
                <User className="text-gray-400" />
                <input
                    type="text"
                    placeholder={relationship === 'Self' ? "What's your name?" : "What's her name?"}
                    className="flex-1 bg-transparent outline-none text-lg text-[#2D2D2D] dark:text-white placeholder-gray-400"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />
                </div>
                <div className="neu-pressed p-4 rounded-xl flex items-center gap-3">
                <span className="text-gray-400 w-8 text-center text-sm font-bold">Age</span>
                <input
                    type="number"
                    placeholder="Age"
                    className="flex-1 bg-transparent outline-none text-lg text-[#2D2D2D] dark:text-white placeholder-gray-400"
                    value={age}
                    onChange={e => setAge(parseInt(e.target.value))}
                />
                </div>
            </div>
            
            <div className="mt-auto pt-6">
                <button 
                disabled={!name}
                onClick={next}
                className="neu-btn w-full py-4 rounded-xl font-semibold disabled:opacity-50"
                >
                Continue
                </button>
            </div>
          </div>
        );

      case 2: // Cycle Data
        const currentPickerDays = Array.from({ length: getDaysInMonth(pickerDate) }, (_, i) => i + 1);

        // Using flex-col and justify-between to ensure it fits without scrolling on SE2
        return (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-300 pt-8">
            <div className="shrink-0 mb-2">
                <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white mb-1">Cycle Details</h2>
                <p className="text-sm text-gray-500">Provide accurate data for better predictions.</p>
            </div>
            
            <div className="flex-1 flex flex-col justify-evenly min-h-0">
              
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Last Period Start</label>
                <div className="flex gap-4">
                    <ScrollPicker 
                    items={currentPickerDays} 
                    value={pickerDate.getDate()} 
                    onChange={handleRestrictedDayChange}
                    className="flex-1"
                    height={100} 
                    itemHeight={32}
                    highlightClass="neu-pressed rounded-lg"
                    />
                    <ScrollPicker 
                    items={validMonthNames} 
                    value={format(pickerDate, 'MMMM')} 
                    onChange={handleRestrictedMonthChange}
                    className="flex-[1.5]"
                    height={100}
                    itemHeight={32}
                    highlightClass="neu-pressed rounded-lg"
                    />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Cycle Length (Days)</label>
                <ScrollPicker 
                    items={cycleRange}
                    value={cycleLength}
                    onChange={setCycleLength}
                    className="w-full"
                    height={90}
                    itemHeight={32}
                    highlightClass="neu-pressed rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Period Duration (Days)</label>
                <ScrollPicker 
                    items={durationRange}
                    value={periodDuration}
                    onChange={setPeriodDuration}
                    className="w-full"
                    height={90}
                    itemHeight={32}
                    highlightClass="neu-pressed rounded-lg"
                />
              </div>

            </div>

            <div className="pt-4 shrink-0">
              <button onClick={next} className="neu-btn w-full py-4 rounded-xl font-semibold">
                Next
              </button>
            </div>
          </div>
        );
      
      case 3: // Stress
        return (
          <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center justify-center h-full">
            <CircularSlider 
              value={stress} 
              onChange={setStress} 
              label="Rate Stress Level" 
              color="#F87171"
              maxLabel="Extreme"
              size={240} // Smaller for SE2
            />
            <button onClick={next} className="neu-btn w-full mt-8 py-4 rounded-xl font-semibold">
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
              size={240}
            />
            <button onClick={next} className="neu-btn w-full mt-8 py-4 rounded-xl font-semibold">
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
              size={240}
            />
            <button onClick={next} className="neu-btn w-full mt-8 py-4 rounded-xl font-semibold">
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
              size={240}
            />
            <button onClick={next} className="neu-btn w-full mt-8 py-4 rounded-xl font-semibold">
              Next
            </button>
          </div>
        );

      case 7: // Body Metrics
        return (
           <div className="animate-in fade-in slide-in-from-right-8 duration-300 flex flex-col h-full pt-8">
             <div className="shrink-0 mb-4">
                 <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white mb-2">Body Metrics</h2>
                 <p className="text-gray-500">Height and weight help us calculate BMI and hydration.</p>
             </div>
             
             <div className="flex-1 flex flex-col justify-center gap-8">
               <div className="flex gap-4">
                  <div className="flex-1">
                      <label className="block text-center font-bold text-gray-500 mb-2">Height (cm)</label>
                      <ScrollPicker 
                        items={heightRange} 
                        value={height} 
                        onChange={setHeight}
                        height={160}
                        itemHeight={34}
                        highlightClass="neu-pressed rounded-lg"
                      />
                  </div>
                  <div className="flex-1">
                      <label className="block text-center font-bold text-gray-500 mb-2">Weight (kg)</label>
                      <ScrollPicker 
                        items={weightRange} 
                        value={weight} 
                        onChange={setWeight}
                        height={160}
                        itemHeight={34}
                        highlightClass="neu-pressed rounded-lg"
                      />
                  </div>
               </div>
               
               <div className="p-4 neu-flat rounded-xl text-center mx-4">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Calculated BMI</span>
                  <div className="text-3xl font-bold text-[#E84C7C] mt-1">
                    {(weight / ((height/100) * (height/100))).toFixed(1)}
                  </div>
               </div>
             </div>

             <div className="mt-auto pt-4">
                <button onClick={next} className="neu-btn w-full py-4 rounded-xl font-semibold">
                Calculate Risk
                </button>
             </div>
           </div>
        );
        
      case 8: // History Check
        const editDays = Array.from({ length: getDaysInMonth(tempEditDate) }, (_, i) => i + 1);

        return (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300 relative h-full flex flex-col pt-8">
                <div className="shrink-0 mb-4">
                    <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white mb-1">Verify History</h2>
                    <p className="text-gray-500 text-sm">We predicted past dates based on input. Tap to edit.</p>
                </div>
                
                <div className="space-y-3 mb-8 flex-1 overflow-y-auto no-scrollbar">
                    {historyDates.map((date, idx) => (
                        <button 
                            key={idx}
                            onClick={() => {
                                setEditingIndex(idx);
                                setTempEditDate(date);
                            }}
                            className="neu-flat w-full p-4 rounded-xl flex items-center justify-between text-left group"
                        >
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{idx === 0 ? 'Last Month' : '2 Months Ago'}</span>
                                <div className="font-bold text-gray-800 dark:text-white text-lg mt-1">{format(date, 'MMMM do')}</div>
                            </div>
                            <div className="neu-btn-round w-10 h-10 group-hover:text-[#E84C7C] transition-colors">
                                <CalendarCheck size={18} />
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
                        className="neu-btn w-full py-4 rounded-xl font-semibold"
                    >
                        Yes, Correct
                    </button>
                </div>
                
                {/* Date Editor Modal */}
                {editingIndex !== null && (
                    <div className="absolute inset-0 z-50 bg-[#FFF0F3]/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="neu-flat bg-white dark:bg-gray-800 p-6 w-full max-w-sm">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Edit Date</h3>
                            <div className="flex gap-4 mb-8 h-32">
                                <ScrollPicker 
                                    items={editDays} 
                                    value={tempEditDate.getDate()} 
                                    onChange={handleTempDayChange}
                                    className="flex-1"
                                    height={128}
                                    itemHeight={34}
                                    highlightClass="neu-pressed rounded-lg"
                                />
                                <ScrollPicker 
                                    items={allMonths} 
                                    value={allMonths[tempEditDate.getMonth()]} 
                                    onChange={handleTempMonthChange}
                                    formatLabel={(m) => m.substring(0, 3)}
                                    className="flex-1"
                                    height={128}
                                    itemHeight={34}
                                    highlightClass="neu-pressed rounded-lg"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setEditingIndex(null)}
                                    className="flex-1 py-3 text-gray-500 font-bold"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={saveHistoryEdit}
                                    className="neu-btn flex-1 py-3 rounded-xl font-bold"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );

      case 9:
        if (isAddingProfile) return null; 
        return (
            <PinLock 
                isSetup 
                onSuccess={(pin) => finishOnboarding(pin)} 
            />
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col p-6 relative overflow-hidden">
      {step > 0 && step < 9 && (
        <button onClick={back} className="absolute top-6 left-6 neu-btn-round w-10 h-10 z-10">
          <ChevronLeft className="text-[#2D2D2D]" />
        </button>
      )}

      {isAddingProfile && onCancel && (
          <button 
            onClick={onCancel} 
            className="absolute top-6 right-6 neu-btn-round w-10 h-10 z-10 text-gray-500"
          >
            <X size={20} />
          </button>
      )}
      
      <div className="flex-1 mt-6 overflow-hidden relative">
        {renderStep()}
      </div>
      
      {/* Progress Dots */}
      {step > 0 && step < 9 && (
        <div className="flex justify-center gap-2 mt-2 pb-2 shrink-0">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'w-4 bg-[#E84C7C] shadow-md' : 'w-1.5 bg-gray-300 dark:bg-gray-700'}`} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Onboarding;