import React, { useState, useEffect } from 'react';
import { ArrowRight, Calendar, User, Briefcase, Moon, Cigarette, Wine, Activity, ChevronLeft } from 'lucide-react';
import { UserProfile, CycleData } from '../types';
import PinLock from './PinLock';
import ScrollPicker from './ScrollPicker';
import { format, getDaysInMonth, setDate, setMonth, setYear } from 'date-fns';

interface OnboardingProps {
  onComplete: (user: UserProfile, cycle: CycleData) => void;
}

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
  
  // Habits
  const [habits, setHabits] = useState({
    smoking: false,
    alcohol: false,
    sleep: true,
    stress: false,
    exercise: true
  });

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

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
    // Clamp day to max days in current month
    const daysInMonth = getDaysInMonth(pickerDate);
    const validDay = Math.min(day, daysInMonth);
    setPickerDate(d => setDate(d, validDay));
  };

  const handleMonthChange = (monthName: string) => {
    const monthIndex = months.indexOf(monthName);
    setPickerDate(d => {
      // Temporarily set day to 1 to avoid overflow (e.g. Jan 31 -> Feb -> Mar 3)
      // Then re-clamp day. date-fns handles this but being explicit helps.
      const newDate = setMonth(d, monthIndex);
      return newDate;
    });
  };

  const handleYearChange = (year: number) => {
    setPickerDate(d => setYear(d, year));
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
        // Using flex-col and overflow-hidden to ensure it fits on screen
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

      case 3: // Habits (Simplified Swipe)
        return (
          <div>
            <h2 className="text-2xl font-bold text-[#2D2D2D] mb-6">Quick Check</h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                <span className="flex items-center gap-2"><Cigarette size={20} className="text-gray-400"/> Do you smoke?</span>
                <input type="checkbox" checked={habits.smoking} onChange={e => setHabits({...habits, smoking: e.target.checked})} className="accent-[#E84C7C] w-5 h-5"/>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                <span className="flex items-center gap-2"><Wine size={20} className="text-gray-400"/> Drink alcohol?</span>
                <input type="checkbox" checked={habits.alcohol} onChange={e => setHabits({...habits, alcohol: e.target.checked})} className="accent-[#E84C7C] w-5 h-5"/>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                <span className="flex items-center gap-2"><Moon size={20} className="text-gray-400"/> Good sleep?</span>
                <input type="checkbox" checked={habits.sleep} onChange={e => setHabits({...habits, sleep: e.target.checked})} className="accent-[#E84C7C] w-5 h-5"/>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between">
                <span className="flex items-center gap-2"><Activity size={20} className="text-gray-400"/> High stress?</span>
                <input type="checkbox" checked={habits.stress} onChange={e => setHabits({...habits, stress: e.target.checked})} className="accent-[#E84C7C] w-5 h-5"/>
              </div>
            </div>
            <button onClick={next} className="w-full mt-8 bg-[#E84C7C] text-white py-4 rounded-xl font-semibold shadow-lg shadow-pink-200">
              Almost Done
            </button>
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