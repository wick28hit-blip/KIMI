
import React, { useState, useEffect } from 'react';
import { UserProfile, CycleData, AppState, DailyLog, CycleHistory } from './types';
import { STORAGE_KEY, HAS_ACCOUNT_KEY, encryptData, decryptData } from './utils/crypto';
import Onboarding from './components/Onboarding';
import PinLock from './components/PinLock';
import BubbleDashboard from './components/BubbleDashboard';
import Settings from './components/Settings';
import CalibrationPopup from './components/CalibrationPopup';
import { Home, Calendar, PlusCircle, BarChart2, Droplet, Activity, Settings as SettingsIcon, Pill, Heart, AlertTriangle, Lock, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, parseISO } from 'date-fns';
import { getDayStatus, getLifestyleImpact, generateHistoricalCycles, generateRuleBasedInsights } from './utils/calculations';
import { getWellnessInsight } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: 'BOOT',
    user: null,
    cycle: null,
    logs: {},
    darkMode: false
  });

  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loginError, setLoginError] = useState(false);
  
  // Custom Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);

  // Load Data and Theme
  useEffect(() => {
    // 1. Theme Logic
    const storedTheme = localStorage.getItem('KIMI_THEME');
    const isDark = storedTheme === 'dark';
    if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
    }

    // 2. Auth Logic
    const hasAccount = localStorage.getItem(HAS_ACCOUNT_KEY);
    if (!hasAccount) {
      setState(s => ({ ...s, view: 'ONBOARDING', darkMode: isDark }));
    } else {
      setState(s => ({ ...s, view: 'PIN', darkMode: isDark }));
    }
  }, []);

  // Sync Dark Mode changes
  useEffect(() => {
      localStorage.setItem('KIMI_THEME', state.darkMode ? 'dark' : 'light');
      if (state.darkMode) {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
      }
  }, [state.darkMode]);

  const toggleDarkMode = () => {
      setState(s => ({ ...s, darkMode: !s.darkMode }));
  };

  const handleLogin = (pin: string) => {
    // Determine context: Initial login vs Vault unlock
    if (state.view === 'VAULT_PIN') {
       if (state.user && state.user.pin === pin) {
         setLoginError(false);
         setState(s => ({ ...s, view: 'SECRET_VAULT' }));
       } else {
         setLoginError(true);
       }
       return;
    }

    const encryptedData = localStorage.getItem(STORAGE_KEY);
    if (encryptedData) {
      const data = decryptData(encryptedData, pin);
      if (data && data.user) {
        setLoginError(false);
        setState(s => ({
          ...s,
          view: 'HOME',
          user: data.user,
          cycle: data.cycle,
          logs: data.logs || {}
        }));
      } else {
        setLoginError(true);
      }
    } else {
      // Should not happen if HAS_ACCOUNT_KEY is present, but handle anyway
       setLoginError(true);
    }
  };

  const handleLogout = () => {
    setState(s => ({
      ...s,
      view: 'PIN',
      user: null,
      cycle: null,
      logs: {}
    }));
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HAS_ACCOUNT_KEY);
    setState({
      view: 'ONBOARDING',
      user: null,
      cycle: null,
      logs: {},
      darkMode: state.darkMode
    });
  };

  const handleSignup = (user: UserProfile, cycle: CycleData) => {
    // 1. Calculate Lifestyle Impact Offset
    const lifestyleOffset = getLifestyleImpact(user);
    
    // 2. Generate Historical Calibration Data
    const history = generateHistoricalCycles(
      parseISO(cycle.lastPeriodDate), 
      cycle.cycleLength, 
      cycle.periodDuration
    );

    const fullCycleData: CycleData = {
      ...cycle,
      lifestyleOffset,
      history
    };

    const newData = { user, cycle: fullCycleData, logs: {} };
    const encrypted = encryptData(newData, user.pin);
    localStorage.setItem(STORAGE_KEY, encrypted);
    localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
    
    setState(s => ({
      ...s,
      view: 'HOME',
      user,
      cycle: fullCycleData,
      logs: {}
    }));
    
    // Trigger Calibration Popup
    setShowCalibration(true);
  };

  const handleConfirmCalibration = () => {
    if (!state.user || !state.cycle) return;
    
    // Mark history as confirmed
    const updatedHistory = state.cycle.history.map(h => ({ ...h, isConfirmed: true }));
    const updatedCycle = { ...state.cycle, history: updatedHistory };
    
    // Save
    const newState = { ...state, cycle: updatedCycle };
    const encrypted = encryptData({ user: state.user, cycle: updatedCycle, logs: state.logs }, state.user.pin);
    localStorage.setItem(STORAGE_KEY, encrypted);
    
    setState(newState);
    setShowCalibration(false);
  };

  const handleSaveCalibration = (updatedHistory: CycleHistory[]) => {
    if (!state.user || !state.cycle) return;

    // Mark updated history as confirmed
    const confirmedHistory = updatedHistory.map(h => ({ ...h, isConfirmed: true }));
    const updatedCycle = { ...state.cycle, history: confirmedHistory };

    // Save
    const newState = { ...state, cycle: updatedCycle };
    const encrypted = encryptData({ user: state.user, cycle: updatedCycle, logs: state.logs }, state.user.pin);
    localStorage.setItem(STORAGE_KEY, encrypted);

    setState(newState);
    setShowCalibration(false);
  };

  const saveLog = (log: DailyLog) => {
    const newLogs = { ...state.logs, [log.date]: log };
    const newState = { ...state, logs: newLogs };
    
    if (state.user) {
      const encrypted = encryptData(newState, state.user.pin);
      localStorage.setItem(STORAGE_KEY, encrypted);
    }
    setState(newState);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    const newState = { ...state, user: updatedUser };
    if (state.user) {
        const encrypted = encryptData(newState, state.user.pin);
        localStorage.setItem(STORAGE_KEY, encrypted);
    }
    setState(newState);
  };

  const fetchAIInsight = async () => {
    if (!state.user || !state.cycle) return;
    setInsightLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const log = state.logs[today] || { date: today, waterIntake: 0, symptoms: [] };
    
    const text = await getWellnessInsight(state.user, state.cycle, log);
    setInsight(text);
    setInsightLoading(false);
  };

  const handleExportData = () => {
    if (!state.user) return;
    const dataToExport = { user: state.user, cycle: state.cycle, logs: state.logs };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kimi_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.user && json.cycle) {
          const importedUser = json.user as UserProfile;
          const encrypted = encryptData(json, importedUser.pin);
          localStorage.setItem(STORAGE_KEY, encrypted);
          localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
          setState(s => ({
            ...s,
            view: 'HOME',
            user: importedUser,
            cycle: json.cycle,
            logs: json.logs || {}
          }));
          alert('Data imported successfully!');
        } else {
          alert('Invalid file format.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to import data. File may be corrupted.');
      }
    };
    reader.readAsText(file);
  };

  const confirmDelete = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HAS_ACCOUNT_KEY);
    localStorage.removeItem('KIMI_THEME');
    window.location.reload();
  };

  // --- Views ---

  if (state.view === 'BOOT') return <div className="min-h-screen bg-[#FFF0F3] dark:bg-gray-900" />;
  if (state.view === 'ONBOARDING') return <Onboarding onComplete={handleSignup} />;
  
  if (state.view === 'PIN' || state.view === 'VAULT_PIN') {
    return (
      <PinLock 
        onSuccess={handleLogin} 
        expectedPin={state.user?.pin} 
        onReset={state.view === 'PIN' ? handleReset : undefined} 
        loginError={loginError}
        onClearLoginError={() => setLoginError(false)}
        isSetup={false}
      />
    );
  }

  const renderCalendar = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    const weekDays = ['S','M','T','W','T','F','S'];

    return (
      <div className="p-4 pt-10 h-full overflow-y-auto bg-[#FFF0F3] dark:bg-gray-900 transition-colors">
        <div className="flex justify-between items-center mb-6">
           <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="text-[#E84C7C] font-bold p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-full">&lt;</button>
           <h2 className="text-xl font-bold text-[#2D2D2D] dark:text-white">{format(currentDate, 'MMMM yyyy')}</h2>
           <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="text-[#E84C7C] font-bold p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-full">&gt;</button>
        </div>
        
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(d => <div key={d} className="text-center text-gray-400 dark:text-gray-500 text-sm font-medium">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-y-4 gap-x-2">
           {days.map(day => {
             const status = state.cycle ? getDayStatus(day, state.cycle) : 'none';
             let bg = 'bg-transparent';
             let text = 'text-gray-700 dark:text-gray-300';
             
             if (status === 'period') { bg = 'bg-[#E84C7C]'; text = 'text-white'; }
             else if (status === 'ovulation') { bg = 'bg-[#7B86CB]'; text = 'text-white'; }
             else if (status === 'fertile') { bg = 'bg-pink-100 dark:bg-pink-900/40'; text = 'text-[#E84C7C] dark:text-pink-300'; }
             else if (status === 'period_past') { bg = 'bg-[#E84C7C] opacity-50'; text = 'text-white'; }

             return (
               <div key={day.toString()} className="flex flex-col items-center">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${bg} ${text} ${isToday(day) ? 'border-2 border-[#2D2D2D] dark:border-white' : ''}`}>
                   {format(day, 'd')}
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar bg-[#FFF0F3] dark:bg-gray-900 transition-colors">
      <header className="p-6 pb-2">
        <h1 className="text-2xl font-bold text-[#2D2D2D] dark:text-white">Hello, {state.user?.name}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Today is {format(new Date(), 'EEEE, MMMM do')}</p>
      </header>

      {state.cycle && <BubbleDashboard cycleData={state.cycle} />}

      <div className="px-6 text-center text-gray-400 dark:text-gray-500 text-sm mt-10">
        <p>Your cycle is being tracked privately.</p>
        <p>Use the + button to log daily activity.</p>
      </div>
    </div>
  );

  const renderInsights = () => {
    // Check for rule-based insights
    const ruleBasedInsight = (state.cycle && state.logs) 
      ? generateRuleBasedInsights(state.cycle, state.logs, new Date()) 
      : null;

    return (
      <div className="p-6 h-full overflow-y-auto pb-32 bg-[#FFF0F3] dark:bg-gray-900 transition-colors">
        <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white mb-6">Insights</h2>
        
        {/* Rule-Based Alert Card */}
        {ruleBasedInsight && (
          <div className="bg-white dark:bg-gray-800 border-l-4 border-yellow-400 p-4 rounded-r-xl shadow-sm mb-6 flex items-start gap-3">
             <AlertTriangle className="text-yellow-500 shrink-0" />
             <div>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">Daily Alert</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{ruleBasedInsight}</p>
             </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-[#7B86CB] to-[#5C6BC0] p-6 rounded-2xl shadow-lg mb-6 text-white relative overflow-hidden">
          <div className="flex items-center justify-between mb-2 relative z-10">
            <h3 className="font-bold flex items-center gap-2"><Activity size={18}/> KIMI Advisor</h3>
          </div>
          <p className="text-white/90 text-sm mb-4 relative z-10 min-h-[60px]">
            {insightLoading ? "Thinking..." : insight || "Tap the button to get personalized wellness advice based on your logs."}
          </p>
          <button onClick={fetchAIInsight} disabled={insightLoading} className="bg-white text-[#7B86CB] px-4 py-2 rounded-lg text-sm font-bold shadow-sm relative z-10 active:scale-95 transition-transform">
            {insight ? "Refresh" : "Analyze My Logs"}
          </button>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        </div>
      </div>
    );
  };

  const renderDailyLog = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const log = state.logs[today] || { 
      date: today, 
      waterIntake: 0, 
      symptoms: [],
      medication: { taken: false, types: [] },
      exercise: { performed: false },
      intimacy: 'none'
    };
    
    // Helper to save sub-objects
    const updateHabit = (type: 'smoking' | 'alcohol', val: boolean, detailKey: 'frequency' | 'amount' | 'units', detailVal: string) => {
        const newHabits = { ...log.habits };
        // @ts-ignore
        newHabits[type] = { value: val, [detailKey]: detailVal };
        saveLog({ ...log, habits: newHabits });
    };

    const toggleSymptom = (sym: string) => {
       const exists = log.symptoms.includes(sym);
       const newSym = exists ? log.symptoms.filter(s => s !== sym) : [...log.symptoms, sym];
       saveLog({ ...log, symptoms: newSym });
    };

    const toggleMedType = (type: string) => {
        const currentTypes = log.medication?.types || [];
        const newTypes = currentTypes.includes(type) 
            ? currentTypes.filter(t => t !== type) 
            : [...currentTypes, type];
        saveLog({ 
            ...log, 
            medication: { taken: newTypes.length > 0, types: newTypes } 
        });
    };

    return (
      <div className="p-6 pb-32 overflow-y-auto h-full bg-[#FFF0F3] dark:bg-gray-900 transition-colors">
         <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white mb-6">Log Today</h2>
         
         {/* 6.a Water Intake */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-semibold text-lg flex items-center gap-2 dark:text-gray-200"><Droplet className="text-blue-400" /> Water Intake</h3>
               <span className="text-2xl font-bold text-blue-400">{log.waterIntake}/8</span>
            </div>
            {/* 8 Glass Visual */}
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map(n => (
                <button 
                    key={n} 
                    onClick={() => saveLog({ ...log, waterIntake: n === log.waterIntake ? n - 1 : n })} 
                    className={`aspect-[3/4] rounded-b-lg rounded-t-sm border-2 border-blue-200 dark:border-blue-900 flex items-end justify-center overflow-hidden relative transition-all active:scale-95 ${n <= log.waterIntake ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                    <div 
                        className={`w-full bg-blue-400 transition-all duration-500 ease-out`}
                        style={{ height: n <= log.waterIntake ? '80%' : '0%' }}
                    />
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">Target: 2000ml (8 glasses)</p>
         </div>

        {/* 6.b Habits (Conditional) */}
        {state.user?.habits.smoking.value && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Smoking</h3>
                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">May delay period 1-2d</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">Did you smoke today?</p>
                <div className="flex gap-2">
                    <button 
                        onClick={() => updateHabit('smoking', false, 'amount', '')}
                        className={`flex-1 py-2 rounded-lg font-medium border ${!log.habits?.smoked?.value ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-white border-gray-200 text-gray-400'}`}
                    >No</button>
                    <button 
                         onClick={() => updateHabit('smoking', true, 'amount', 'Yes')}
                         className={`flex-1 py-2 rounded-lg font-medium border ${log.habits?.smoked?.value ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-red-200 text-red-500'}`}
                    >Yes</button>
                </div>
            </div>
        )}

        {state.user?.habits.alcohol.value && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Alcohol</h3>
                    <span className="text-[10px] bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full font-bold">May delay period 1-2d</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">Did you drink alcohol today?</p>
                <div className="flex gap-2">
                    <button 
                        onClick={() => updateHabit('alcohol', false, 'units', '')}
                        className={`flex-1 py-2 rounded-lg font-medium border ${!log.habits?.alcohol?.value ? 'bg-gray-100 border-gray-300 text-gray-600' : 'bg-white border-gray-200 text-gray-400'}`}
                    >No</button>
                    <button 
                         onClick={() => updateHabit('alcohol', true, 'units', 'Yes')}
                         className={`flex-1 py-2 rounded-lg font-medium border ${log.habits?.alcohol?.value ? 'bg-yellow-500 border-yellow-500 text-white' : 'bg-white border-yellow-200 text-yellow-500'}`}
                    >Yes</button>
                </div>
            </div>
        )}

         {/* 6.c Medication */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-3 dark:text-gray-200"><Pill className="text-purple-400" /> Medication</h3>
            <p className="text-sm text-gray-500 mb-3">Any medication today?</p>
            <div className="flex flex-wrap gap-2">
                {['Painkillers', 'Antibiotics', 'Hormonal', 'Birth Control'].map(type => (
                     <button 
                        key={type}
                        onClick={() => toggleMedType(type)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${log.medication?.types.includes(type) ? 'bg-purple-500 text-white border-purple-500' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}
                     >
                        {type}
                     </button>
                ))}
            </div>
         </div>

         {/* 6.d Exercise */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700">
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-3 dark:text-gray-200"><Activity className="text-green-500" /> Exercise</h3>
            <p className="text-sm text-gray-500 mb-3">Exercise today?</p>
            
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                {['Cardio', 'Strength', 'Yoga', 'None'].map(type => (
                    <button
                        key={type}
                        onClick={() => saveLog({ 
                            ...log, 
                            exercise: { 
                                performed: type !== 'None', 
                                type: type as any, 
                                duration: log.exercise?.duration || 30 
                            } 
                        })}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium border ${log.exercise?.type === type ? 'bg-green-500 text-white border-green-500' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>
            
            {log.exercise?.performed && (
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                        <span>Duration</span>
                        <span>{log.exercise.duration} min</span>
                    </div>
                    <input 
                        type="range" 
                        min="15" 
                        max="120" 
                        step="15"
                        value={log.exercise.duration || 30}
                        onChange={(e) => saveLog({ 
                            ...log, 
                            exercise: { ...log.exercise!, duration: parseInt(e.target.value) } 
                        })}
                        className="w-full accent-green-500"
                    />
                </div>
            )}
         </div>

         {/* 6.e Intimacy Tracking */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 dark:text-gray-200"><Heart className="text-red-400" /> Intimacy</h3>
                <Lock size={16} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 mb-4">💕 Were you intimate today?</p>
            
            <div className="flex flex-col gap-2">
                {[
                    { val: 'protected', label: 'Yes, protected 🛡️' },
                    { val: 'unprotected', label: 'Yes, unprotected' },
                    { val: 'prefer_not_to_say', label: 'Prefer not to say' },
                    { val: 'none', label: 'No' }
                ].map(opt => (
                    <button
                        key={opt.val}
                        onClick={() => saveLog({ ...log, intimacy: opt.val as any })}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${log.intimacy === opt.val ? 'bg-pink-50 border-[#E84C7C] text-[#E84C7C] font-medium' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-3 flex items-center justify-center gap-1">
                <Lock size={10} /> Only you can see this
            </p>
         </div>

         {/* Symptoms */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700 transition-colors">
           <h3 className="font-semibold text-lg mb-4 dark:text-gray-200">Symptoms</h3>
           <div className="flex flex-wrap gap-2">
             {['Cramps', 'Headache', 'Bloating', 'Fatigue', 'Acne', 'Cravings', 'Mood Swing'].map(s => (
               <button key={s} onClick={() => toggleSymptom(s)} className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${log.symptoms.includes(s) ? 'bg-[#E84C7C] text-white border-[#E84C7C]' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>{s}</button>
             ))}
           </div>
         </div>

         {/* Save Button */}
         <button 
            onClick={() => setState(s => ({ ...s, view: 'HOME' }))}
            className="w-full py-4 bg-[#E84C7C] text-white rounded-xl font-bold shadow-lg shadow-pink-200 dark:shadow-none hover:bg-pink-600 transition-colors mt-6"
         >
            Save Log
         </button>
      </div>
    );
  };

  return (
    <div className={`max-w-md mx-auto bg-[#FFF0F3] dark:bg-gray-900 min-h-screen relative shadow-2xl overflow-hidden flex flex-col transition-colors duration-300`}>
      <main className="flex-1 overflow-hidden relative">
        {state.view === 'HOME' && renderHome()}
        {state.view === 'CALENDAR' && renderCalendar()}
        {state.view === 'DAILY_LOG' && renderDailyLog()}
        {state.view === 'INSIGHTS' && renderInsights()}
        {(state.view === 'SETTINGS' || state.view === 'SECRET_VAULT') && (
            <Settings 
                onExport={handleExportData}
                onImport={handleImportData}
                onDeleteData={() => setShowDeleteModal(true)}
                isDarkMode={state.darkMode}
                onToggleDarkMode={toggleDarkMode}
                onLogout={handleLogout}
                onOpenSecretVault={() => state.view === 'SECRET_VAULT' ? setState(s => ({...s, view: 'SETTINGS'})) : setState(s => ({...s, view: 'VAULT_PIN'}))}
                isVaultView={state.view === 'SECRET_VAULT'}
                user={state.user}
                onUpdateUser={handleUpdateUser}
            />
        )}
      </main>

      {/* Calibration Popup */}
      {showCalibration && state.cycle && (
        <CalibrationPopup 
          history={state.cycle.history} 
          onConfirm={handleConfirmCalibration}
          onSave={handleSaveCalibration}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-sm border border-red-100 dark:border-red-900/30">
             <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 text-red-500"><Activity size={24} className="rotate-45" /></div>
             <h3 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">Delete All Data?</h3>
             <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">This action cannot be undone. Please export your data first.</p>
             <div className="flex flex-col gap-3">
                 <button onClick={handleExportData} className="w-full py-3 border-2 border-[#E84C7C] text-[#E84C7C] rounded-xl font-bold hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors">Export Backup</button>
                 <button onClick={confirmDelete} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-md shadow-red-200 dark:shadow-none transition-colors">Yes, Delete Everything</button>
                 <button onClick={() => setShowDeleteModal(false)} className="w-full py-3 text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-200">Cancel</button>
             </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      {(state.view !== 'SECRET_VAULT') && (
        <nav className="absolute bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-pink-100 dark:border-gray-700 flex justify-between px-2 py-3 pb-6 z-50 rounded-t-3xl shadow-[0_-5px_20px_rgba(232,76,124,0.1)] transition-colors">
            <button onClick={() => setState(s => ({...s, view: 'HOME'}))} className={`flex-1 flex flex-col items-center gap-1 transition-colors ${state.view === 'HOME' ? 'text-[#E84C7C]' : 'text-gray-400 dark:text-gray-500'}`}><Home size={22} /><span className="text-[10px] font-medium">Home</span></button>
            <button onClick={() => setState(s => ({...s, view: 'CALENDAR'}))} className={`flex-1 flex flex-col items-center gap-1 transition-colors ${state.view === 'CALENDAR' ? 'text-[#E84C7C]' : 'text-gray-400 dark:text-gray-500'}`}><Calendar size={22} /><span className="text-[10px] font-medium">Calendar</span></button>
            <div className="w-16" /> 
            <button onClick={() => setState(s => ({...s, view: 'INSIGHTS'}))} className={`flex-1 flex flex-col items-center gap-1 transition-colors ${state.view === 'INSIGHTS' ? 'text-[#E84C7C]' : 'text-gray-400 dark:text-gray-500'}`}><BarChart2 size={22} /><span className="text-[10px] font-medium">Insights</span></button>
            <button onClick={() => setState(s => ({...s, view: 'SETTINGS'}))} className={`flex-1 flex flex-col items-center gap-1 transition-colors ${state.view === 'SETTINGS' ? 'text-[#E84C7C]' : 'text-gray-400 dark:text-gray-500'}`}><SettingsIcon size={22} /><span className="text-[10px] font-medium">Settings</span></button>
        </nav>
      )}

      {/* FAB */}
      {(state.view !== 'SECRET_VAULT') && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
            <button onClick={() => setState(s => ({...s, view: 'DAILY_LOG'}))} className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform border-4 border-[#FFF0F3] dark:border-gray-900 ${state.view === 'DAILY_LOG' ? 'bg-[#2D2D2D] dark:bg-gray-600' : 'bg-[#E84C7C] shadow-pink-300 dark:shadow-none'}`}><PlusCircle size={28} /></button>
        </div>
      )}
    </div>
  );
};

export default App;
