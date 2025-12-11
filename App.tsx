import React, { useState, useEffect } from 'react';
import { UserProfile, CycleData, AppState, DailyLog, ProfileData } from './types';
import { STORAGE_KEY, HAS_ACCOUNT_KEY, encryptData, decryptData } from './utils/crypto';
import Onboarding from './components/Onboarding';
import PinLock from './components/PinLock';
import BubbleDashboard from './components/BubbleDashboard';
import Settings from './components/Settings';
import { Home, Calendar, PlusCircle, BarChart2, Droplet, Activity, Settings as SettingsIcon, Heart, Pill, Dumbbell, Wine, Cigarette, Lock, Smile, Check, ArrowLeft, Plus, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns';
import { getDayStatus } from './utils/calculations';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: 'BOOT',
    user: null,
    cycle: null,
    logs: {},
    profiles: {},
    activeProfileId: null,
    darkMode: false
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [loginError, setLoginError] = useState(false);
  
  // Custom Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  // PWA Hardware Back Button Handling
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If user presses back button on Android/Browser
      if (state.view !== 'HOME' && state.view !== 'PIN' && state.view !== 'ONBOARDING' && state.view !== 'BOOT') {
        // Prevent default browser back (which might exit app) and go to Home
        event.preventDefault();
        setState(s => ({ ...s, view: 'HOME' }));
      }
    };

    // If we navigate to a non-root view, push a state so back button works
    if (state.view !== 'HOME' && state.view !== 'PIN' && state.view !== 'ONBOARDING' && state.view !== 'BOOT') {
        window.history.pushState({ view: state.view }, '');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [state.view]);

  const toggleDarkMode = () => {
      setState(s => ({ ...s, darkMode: !s.darkMode }));
  };

  const handleLogin = (pin: string) => {
    const encryptedData = localStorage.getItem(STORAGE_KEY);
    if (encryptedData) {
      const data = decryptData(encryptedData, pin);
      
      if (data) {
        // Migration: Check if old format (single user) or new format (profiles object)
        let profiles: Record<string, ProfileData> = {};
        let activeId: string | null = null;

        if (data.profiles) {
             // New Format
             profiles = data.profiles;
             activeId = data.activeProfileId || Object.keys(profiles)[0];
        } else if (data.user) {
             // Old Format: Migrate to Profile Structure
             // Generate an ID for the existing user if missing
             const userId = data.user.id || 'primary_user';
             // Migration for PMS Data defaults if moving from very old version
             const pmsData = data.user.pmsData || {
                stress: 5, sleep: 5, anxiety: 5, depression: 5, height: 165, weight: 65, bmi: 5, diet: 5
             };

             const userProfile = { ...data.user, id: userId, relationship: 'Self', pmsData }; // Ensure new fields
             
             profiles = {
                 [userId]: {
                     user: userProfile,
                     cycle: data.cycle,
                     logs: data.logs || {}
                 }
             };
             activeId = userId;
        }

        if (activeId && profiles[activeId]) {
            setLoginError(false);
            const activeData = profiles[activeId];
            setState(s => ({
              ...s,
              view: 'HOME',
              profiles,
              activeProfileId: activeId,
              user: activeData.user,
              cycle: activeData.cycle,
              logs: activeData.logs
            }));
        } else {
             setLoginError(true);
        }
      } else {
        setLoginError(true);
      }
    } else {
       setLoginError(true);
    }
  };

  const handleLogout = () => {
    setState(s => ({
      ...s,
      view: 'PIN',
      user: null,
      cycle: null,
      logs: {},
      profiles: {},
      activeProfileId: null
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
      profiles: {},
      activeProfileId: null,
      darkMode: state.darkMode
    });
  };

  // Called when Onboarding finishes
  const handleCreateProfile = (user: UserProfile, cycle: CycleData, initialLogs: Record<string, DailyLog> = {}) => {
    // Determine if this is the FIRST profile (Setup) or an ADDITIONAL profile
    const isInitialSetup = Object.keys(state.profiles).length === 0;

    let userToSave = { ...user };
    let encryptionPin = user.pin;

    if (!isInitialSetup) {
        // We are adding a profile while logged in.
        // Rule: All profiles share the same PIN (usually the Mother/Primary User's PIN).
        const primaryUser = (Object.values(state.profiles) as ProfileData[]).find((p: ProfileData) => p.user.relationship === 'Self')?.user;
        const existingPin = primaryUser?.pin || state.user?.pin;

        if (existingPin) {
            userToSave.pin = existingPin; // Inherit the PIN
            encryptionPin = existingPin;  // Use existing PIN for storage encryption
        } else {
             console.warn("Could not find existing PIN for new profile. Using provided PIN.");
        }
    }

    // Merge logs if needed, though usually new profile has empty logs
    const newProfileData: ProfileData = { user: userToSave, cycle, logs: initialLogs };
    const newProfiles = { ...state.profiles, [user.id]: newProfileData };

    const storageData = {
        profiles: newProfiles,
        activeProfileId: user.id
    };
    
    const encrypted = encryptData(storageData, encryptionPin);
    localStorage.setItem(STORAGE_KEY, encrypted);
    localStorage.setItem(HAS_ACCOUNT_KEY, 'true');

    setState(s => ({
      ...s,
      view: 'HOME',
      profiles: newProfiles,
      activeProfileId: user.id,
      user: userToSave,
      cycle: cycle,
      logs: initialLogs
    }));
  };

  const switchProfile = (profileId: string) => {
      const target = state.profiles[profileId];
      if (target) {
          setState(s => ({
              ...s,
              activeProfileId: profileId,
              user: target.user,
              cycle: target.cycle,
              logs: target.logs,
              view: 'HOME' // Go to home on switch
          }));
      }
  };

  const saveLog = (log: DailyLog) => {
    if (!state.activeProfileId) return;

    const currentProfile = state.profiles[state.activeProfileId];
    const newLogs = { ...currentProfile.logs, [log.date]: log };
    const updatedProfile = { ...currentProfile, logs: newLogs };
    
    const newProfiles = { ...state.profiles, [state.activeProfileId]: updatedProfile };
    
    // Find encryption PIN (Primary User or Current User)
    const pinToUse = state.user?.pin || '';

    const storageData = {
        profiles: newProfiles,
        activeProfileId: state.activeProfileId
    };

    const encrypted = encryptData(storageData, pinToUse);
    localStorage.setItem(STORAGE_KEY, encrypted);
    
    setState(s => ({
        ...s,
        profiles: newProfiles,
        logs: newLogs
    }));
  };

  const handleAddProfileRequest = () => {
      // Go to onboarding in "Add Mode"
      setState(s => ({ ...s, view: 'ONBOARDING' }));
  };

  // --- Data Management ---

  const handleExportData = () => {
    const dataToExport = {
        profiles: state.profiles,
        activeProfileId: state.activeProfileId
    };
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
        const result = e.target?.result as string;
        if (!result) return;
        
        // Define interface for migration support
        interface ImportFormat {
           profiles?: Record<string, ProfileData>;
           activeProfileId?: string;
           user?: any; // Loose type for migration
           cycle?: CycleData;
           logs?: Record<string, DailyLog>;
        }

        const json = JSON.parse(result) as ImportFormat;
        
        // Handle Import for Multi-profile structure
        let importedProfiles: Record<string, ProfileData> = {};
        let activeId = '';

        if (json.profiles) {
            importedProfiles = json.profiles;
            activeId = json.activeProfileId || '';
        } else if (json.user && json.cycle) {
             // Migrate old export format
             const uid = json.user.id || 'imported_user';
             
             // Migration for PMS Data defaults
             const pmsData = json.user.pmsData || {
                stress: 5, sleep: 5, anxiety: 5, depression: 5, height: 165, weight: 65, bmi: 5, diet: 5
             };

             const profile: ProfileData = {
                user: { ...json.user, id: uid, pmsData },
                cycle: json.cycle,
                logs: json.logs || {}
             };
             importedProfiles = { [uid]: profile };
             activeId = uid;
        }

        if (Object.keys(importedProfiles).length > 0) {
            // We need a PIN to encrypt this into storage. Ask user to confirm with current PIN?
            // Or just use the pin from the imported 'Self' user.
            const profilesArray: ProfileData[] = Object.values(importedProfiles) as ProfileData[];
            const primary = profilesArray.find((p: ProfileData) => p.user?.relationship === 'Self');
            const pin = primary?.user?.pin || '0000'; // Fallback if messed up

            const storageData = { profiles: importedProfiles, activeProfileId: activeId };
            const encrypted = encryptData(storageData, pin);
            
            localStorage.setItem(STORAGE_KEY, encrypted);
            localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
            
            const activeData: ProfileData | undefined = importedProfiles[activeId];
            
            setState(s => ({
                ...s,
                view: 'HOME',
                profiles: importedProfiles,
                activeProfileId: activeId,
                user: activeData?.user || null,
                cycle: activeData?.cycle || null,
                logs: activeData?.logs || {}
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
  
  if (state.view === 'ONBOARDING') {
      // Check if we are adding a profile to an existing logged-in session
      const isAdding = Object.keys(state.profiles).length > 0;
      return <Onboarding onComplete={handleCreateProfile} isAddingProfile={isAdding} />;
  }
  
  if (state.view === 'PIN') {
    return (
      <PinLock 
        onSuccess={handleLogin} 
        expectedPin={state.user?.pin} // This will be undefined on cold boot/logout
        onReset={handleReset} 
        loginError={loginError}
        onClearLoginError={() => setLoginError(false)}
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

        <div className="flex flex-wrap gap-4 justify-center mb-6 px-2">
            <div className="flex items-center gap-2 group relative cursor-help">
                <div className="w-3 h-3 rounded-full bg-[#E84C7C]"></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Period</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                   Days of menstruation
                   <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
            </div>
            <div className="flex items-center gap-2 group relative cursor-help">
                <div className="w-3 h-3 rounded-full bg-[#7B86CB]"></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Ovulation</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                   Predicted peak fertility
                   <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
            </div>
            <div className="flex items-center gap-2 group relative cursor-help">
                <div className="w-3 h-3 rounded-full bg-pink-100 dark:bg-pink-900/40 border border-pink-200 dark:border-pink-800/50"></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Fertile</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                   High chance of conception
                   <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(d => <div key={d} className="text-center text-gray-400 dark:text-gray-500 text-sm font-medium">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-y-4 gap-x-2">
           {days.map(day => {
             let status = state.cycle ? getDayStatus(day, state.cycle, state.user || undefined) : 'none';
             
             // Check manual logs for period confirmation
             const dateKey = format(day, 'yyyy-MM-dd');
             const log = state.logs[dateKey];
             if (log?.flow) {
                 status = 'period_past';
             }

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

  const renderHome = () => {
    const profilesList = Object.values(state.profiles);
    
    return (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar bg-[#FFF0F3] dark:bg-gray-900 transition-colors">
        {/* Profile Switcher Header */}
        <header className="p-6 pb-2 pt-12 flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-[#2D2D2D] dark:text-white">
                    Hello, {state.user?.name}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {state.user?.relationship === 'Self' ? 'Tracking for You' : `Tracking for ${state.user?.name}`}
                </p>
            </div>
            
            {/* Profile Avatars */}
            <div className="flex -space-x-3 items-center">
                {profilesList.map(p => (
                    <button 
                        key={p.user.id}
                        onClick={() => switchProfile(p.user.id)}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 shadow-sm ${
                            state.activeProfileId === p.user.id 
                            ? 'border-[#E84C7C] bg-pink-100 text-[#E84C7C] z-10 scale-110' 
                            : 'border-white bg-gray-200 text-gray-500 opacity-70'
                        }`}
                    >
                        {p.user.name.charAt(0).toUpperCase()}
                    </button>
                ))}
                
                {/* Add Profile Button */}
                <button 
                    onClick={handleAddProfileRequest}
                    className="w-10 h-10 rounded-full border-2 border-white bg-white dark:bg-gray-800 text-gray-400 flex items-center justify-center shadow-sm hover:text-[#E84C7C] transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>
        </header>

        {state.cycle && <BubbleDashboard cycleData={state.cycle} user={state.user} />}

        <div className="px-6 text-center text-gray-400 dark:text-gray-500 text-sm mt-10">
            <p>Your cycle is being tracked privately.</p>
            <p>Use the + button to log daily activity.</p>
        </div>
        </div>
    );
  };

  const renderInsights = () => {
    const logs = Object.values(state.logs) as DailyLog[];
    const totalDays = logs.length;
    
    // 1. Water Stats
    const totalWater = logs.reduce((sum, log) => sum + log.waterIntake, 0);
    const avgWater = totalDays ? Math.round((totalWater / totalDays) * 10) / 10 : 0;

    // 2. Symptom Frequency
    const symptomMap: Record<string, number> = {};
    logs.forEach(log => {
        log.symptoms.forEach(s => {
            symptomMap[s] = (symptomMap[s] || 0) + 1;
        });
    });
    const topSymptoms = Object.entries(symptomMap)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 4);

    // 3. Mood Frequency
    const moodMap: Record<string, number> = {};
    logs.forEach(log => {
        if (Array.isArray(log.mood)) {
             log.mood.forEach(m => moodMap[m] = (moodMap[m] || 0) + 1);
        }
    });
    const topMoods = Object.entries(moodMap)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6);

    // 4. Habits
    let exerciseCount = 0;
    let medCount = 0;
    let alcoholCount = 0;
    let smokeCount = 0;

    logs.forEach(log => {
        if (log.didExercise) exerciseCount++;
        if (log.medication) medCount++;
        if (log.habits?.drank) alcoholCount++;
        if (log.habits?.smoked) smokeCount++;
    });

    return (
        <div className="p-6 h-full overflow-y-auto pb-32 bg-[#FFF0F3] dark:bg-gray-900 transition-colors">
            <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white mb-6">
                Insights for {state.user?.name}
            </h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2 text-blue-400">
                        <Droplet size={18} />
                        <span className="font-bold text-xs uppercase">Avg Water</span>
                    </div>
                    <span className="text-3xl font-bold text-gray-800 dark:text-white">{avgWater}</span>
                    <span className="text-xs text-gray-400 ml-1">glasses/day</span>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2 text-green-500">
                        <Dumbbell size={18} />
                        <span className="font-bold text-xs uppercase">Active Days</span>
                    </div>
                    <span className="text-3xl font-bold text-gray-800 dark:text-white">{exerciseCount}</span>
                    <span className="text-xs text-gray-400 ml-1">sessions</span>
                </div>
            </div>

            {/* Mood Cloud */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700">
                <h3 className="font-semibold text-lg mb-4 dark:text-gray-200 flex items-center gap-2">
                    <Smile className="text-orange-400" size={20} /> Mood Patterns
                </h3>
                {topMoods.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {topMoods.map(([mood, count], i) => (
                            <div key={mood} className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
                                i === 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                                <span>{mood}</span>
                                <span className="bg-white/50 px-1.5 rounded-full text-xs font-bold opacity-70">{count}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                     <p className="text-gray-400 text-sm italic">Log moods to see patterns here.</p>
                )}
            </div>

             {/* Symptom List */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700">
                <h3 className="font-semibold text-lg mb-4 dark:text-gray-200 flex items-center gap-2">
                    <Activity className="text-purple-500" size={20} /> Top Symptoms
                </h3>
                 {topSymptoms.length > 0 ? (
                    <div className="space-y-3">
                        {topSymptoms.map(([sym, count]) => (
                            <div key={sym} className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{sym}</span>
                                <div className="flex items-center gap-2 flex-1 ml-4 justify-end">
                                     <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-purple-400 rounded-full" 
                                            style={{ width: `${(count / totalDays) * 100}%` }} 
                                        />
                                     </div>
                                     <span className="text-xs text-gray-400 font-medium w-4 text-right">{count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <p className="text-gray-400 text-sm italic">Log symptoms to track them here.</p>
                 )}
            </div>

            {/* Habits Breakdown */}
            {(medCount > 0 || alcoholCount > 0 || smokeCount > 0) && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700">
                    <h3 className="font-semibold text-lg mb-4 dark:text-gray-200 flex items-center gap-2">
                        <Activity className="text-gray-500" size={20} /> Habit Tracker
                    </h3>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                            <Pill size={16} className="mx-auto text-purple-500 mb-1" />
                            <span className="block text-lg font-bold text-gray-800 dark:text-white">{medCount}</span>
                            <span className="text-[10px] text-gray-400">Meds</span>
                        </div>
                         <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                            <Wine size={16} className="mx-auto text-orange-500 mb-1" />
                            <span className="block text-lg font-bold text-gray-800 dark:text-white">{alcoholCount}</span>
                            <span className="text-[10px] text-gray-400">Alcohol</span>
                        </div>
                         <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl">
                            <Cigarette size={16} className="mx-auto text-red-500 mb-1" />
                            <span className="block text-lg font-bold text-gray-800 dark:text-white">{smokeCount}</span>
                            <span className="text-[10px] text-gray-400">Smoke</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const renderDailyLog = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const log = state.logs[today] || { 
        date: today, 
        waterIntake: 0, 
        flow: null, 
        symptoms: [], 
        mood: [], 
        medication: false, 
        didExercise: false, 
        habits: { smoked: false, drank: false } 
    };

    const toggleSymptom = (sym: string) => {
       const exists = log.symptoms.includes(sym);
       const newSym = exists ? log.symptoms.filter(s => s !== sym) : [...log.symptoms, sym];
       saveLog({ ...log, symptoms: newSym });
    };

    const toggleMood = (m: string) => {
        const exists = log.mood.includes(m);
        const newMood = exists ? log.mood.filter(mo => mo !== m) : [...log.mood, m];
        saveLog({ ...log, mood: newMood });
    };

    const flowOptions: Array<'Spotting' | 'Light' | 'Medium' | 'Heavy'> = ['Spotting', 'Light', 'Medium', 'Heavy'];
    const moodOptions = ['Happy', 'Anxious', 'Irritable', 'Sad', 'Energetic', 'Calm', 'Tired'];
    const symptomOptions = ['Cramps', 'Headache', 'Bloating', 'Acne', 'Backache', 'Tender Breasts', 'Nausea'];

    // Determine if user is eligible for intimacy tracking (18+)
    const isAdult = !state.user?.age || state.user.age >= 18;

    return (
      <div className="p-6 pb-32 overflow-y-auto h-full bg-[#FFF0F3] dark:bg-gray-900 transition-colors">
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                 <button 
                    onClick={() => setState(s => ({...s, view: 'HOME'}))}
                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                 >
                    <ArrowLeft size={20} className="text-[#2D2D2D] dark:text-white" />
                 </button>
                 <div>
                    <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white leading-none">Log Today</h2>
                    <span className="text-gray-400 text-sm font-medium">{format(new Date(), 'MMM d, yyyy')}</span>
                 </div>
            </div>
            
            <button 
                onClick={() => setState(s => ({...s, view: 'HOME'}))}
                className="bg-[#E84C7C] text-white px-4 py-2 rounded-full text-sm font-bold shadow-md shadow-pink-200 dark:shadow-none flex items-center gap-2 hover:bg-[#D63E6D] transition-colors"
            >
                <Check size={16} />
                Done
            </button>
         </div>

         {/* Flow Section */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700">
             <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 dark:text-gray-200">
                 <Droplet size={20} className="text-[#E84C7C]" fill="#E84C7C" /> Flow
             </h3>
             <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar">
                 {flowOptions.map(option => (
                     <button
                        key={option}
                        onClick={() => saveLog({...log, flow: option === log.flow ? null : option})}
                        className={`flex-1 py-3 px-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                            log.flow === option 
                            ? 'bg-[#E84C7C] text-white border-[#E84C7C] shadow-md shadow-pink-200' 
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-600'
                        }`}
                     >
                         {option}
                     </button>
                 ))}
             </div>
         </div>

         {/* Mood Section */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700">
             <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 dark:text-gray-200">
                 <Smile size={20} className="text-orange-400" /> Mood
             </h3>
             <div className="flex flex-wrap gap-2">
                 {moodOptions.map(option => (
                     <button
                        key={option}
                        onClick={() => toggleMood(option)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                            log.mood.includes(option)
                            ? 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-600'
                        }`}
                     >
                         {option}
                     </button>
                 ))}
             </div>
         </div>

         {/* Symptoms Section */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700 transition-colors">
           <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 dark:text-gray-200">
               <Activity size={20} className="text-purple-500" /> Symptoms
           </h3>
           <div className="flex flex-wrap gap-2">
             {symptomOptions.map(s => (
               <button
                 key={s}
                 onClick={() => toggleSymptom(s)}
                 className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                   log.symptoms.includes(s) 
                    ? 'bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800' 
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-600'
                 }`}
               >
                 {s}
               </button>
             ))}
           </div>
         </div>

         {/* Quick Toggles: Meds & Exercise */}
         <div className="grid grid-cols-2 gap-4 mb-6">
            <button 
                onClick={() => saveLog({...log, medication: !log.medication})}
                className={`p-4 rounded-2xl border flex items-center justify-center gap-2 transition-all shadow-sm ${log.medication ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'}`}
            >
                <Pill size={20} />
                <span className="font-bold text-sm">Medication</span>
            </button>
            <button 
                onClick={() => saveLog({...log, didExercise: !log.didExercise})}
                className={`p-4 rounded-2xl border flex items-center justify-center gap-2 transition-all shadow-sm ${log.didExercise ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'}`}
            >
                <Dumbbell size={20} />
                <span className="font-bold text-sm">Exercise</span>
            </button>
         </div>

         {/* Intimacy (Shy Mode) - Only if 18+ */}
         {isAdult && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 dark:text-gray-200">
                    <Heart size={18} className="text-[#E84C7C]" /> Intimacy
                </h3>
                <div className="flex bg-gray-50 dark:bg-gray-700 rounded-xl p-1">
                    <button 
                        onClick={() => saveLog({...log, intimacy: 'none'})}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${(!log.intimacy || log.intimacy === 'none') ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-white' : 'text-gray-400'}`}
                    >
                        None
                    </button>
                    <button 
                        onClick={() => saveLog({...log, intimacy: 'protected'})}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${log.intimacy === 'protected' ? 'bg-white dark:bg-gray-600 shadow-sm text-[#E84C7C]' : 'text-gray-400'}`}
                    >
                        Protected
                    </button>
                    <button 
                        onClick={() => saveLog({...log, intimacy: 'unprotected'})}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${log.intimacy === 'unprotected' ? 'bg-white dark:bg-gray-600 shadow-sm text-red-400' : 'text-gray-400'}`}
                    >
                        Unprotected
                    </button>
                </div>
            </div>
         )}

         {/* Water */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-semibold text-lg flex items-center gap-2 dark:text-gray-200">
                 <Droplet className="text-blue-400" /> Water Intake
               </h3>
               <span className="text-2xl font-bold text-blue-400">{log.waterIntake}/8</span>
            </div>
            <div className="flex gap-1 justify-between">
              {[1,2,3,4,5,6,7,8].map(n => (
                <button 
                  key={n}
                  onClick={() => saveLog({ ...log, waterIntake: n === log.waterIntake ? n - 1 : n })}
                  className={`h-8 flex-1 rounded-md transition-all ${n <= log.waterIntake ? 'bg-blue-400' : 'bg-blue-100 dark:bg-gray-700'}`}
                />
              ))}
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className={`max-w-md mx-auto bg-[#FFF0F3] dark:bg-gray-900 min-h-screen relative shadow-2xl overflow-hidden flex flex-col transition-colors duration-300`}>
      
      {/* View Content */}
      <main className="flex-1 overflow-hidden relative">
        {state.view === 'HOME' && renderHome()}
        {state.view === 'CALENDAR' && renderCalendar()}
        {state.view === 'DAILY_LOG' && renderDailyLog()}
        {state.view === 'INSIGHTS' && renderInsights()}
        {state.view === 'SETTINGS' && (
            <Settings 
                onExport={handleExportData}
                onImport={handleImportData}
                onDeleteData={() => setShowDeleteModal(true)}
                isDarkMode={state.darkMode}
                onToggleDarkMode={toggleDarkMode}
                onLogout={handleLogout}
                onAddProfile={handleAddProfileRequest}
            />
        )}
      </main>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-sm border border-red-100 dark:border-red-900/30">
             <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 text-red-500">
                <Activity size={24} className="rotate-45" />
             </div>
             <h3 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">Delete All Data?</h3>
             <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
                 This action cannot be undone. Please export your data first so you can restore it later.
             </p>
             <div className="flex flex-col gap-3">
                 <button onClick={handleExportData} className="w-full py-3 border-2 border-[#E84C7C] text-[#E84C7C] rounded-xl font-bold hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors">
                    Export Backup
                 </button>
                 <button onClick={confirmDelete} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-md shadow-red-200 dark:shadow-none transition-colors">
                    Yes, Delete Everything
                 </button>
                 <button onClick={() => setShowDeleteModal(false)} className="w-full py-3 text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-200">
                    Cancel
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="absolute bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-pink-100 dark:border-gray-700 flex justify-between px-2 py-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 rounded-t-3xl shadow-[0_-5px_20px_rgba(232,76,124,0.1)] transition-colors">
        <button 
          onClick={() => setState(s => ({...s, view: 'HOME'}))}
          className={`flex-1 flex flex-col items-center gap-1 transition-colors ${state.view === 'HOME' ? 'text-[#E84C7C]' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <Home size={22} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button 
          onClick={() => setState(s => ({...s, view: 'CALENDAR'}))}
          className={`flex-1 flex flex-col items-center gap-1 transition-colors ${state.view === 'CALENDAR' ? 'text-[#E84C7C]' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <Calendar size={22} />
          <span className="text-[10px] font-medium">Calendar</span>
        </button>
        
        {/* Spacer for FAB */}
        <div className="w-16" /> 

        <button 
          onClick={() => setState(s => ({...s, view: 'INSIGHTS'}))}
          className={`flex-1 flex flex-col items-center gap-1 transition-colors ${state.view === 'INSIGHTS' ? 'text-[#E84C7C]' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <BarChart2 size={22} />
          <span className="text-[10px] font-medium">Insights</span>
        </button>
        <button 
          onClick={() => setState(s => ({...s, view: 'SETTINGS'}))}
          className={`flex-1 flex flex-col items-center gap-1 transition-colors ${state.view === 'SETTINGS' ? 'text-[#E84C7C]' : 'text-gray-400 dark:text-gray-500'}`}
        >
          <SettingsIcon size={22} />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </nav>

      {/* FAB */}
      <div className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50">
        <button 
          onClick={() => setState(s => ({...s, view: 'DAILY_LOG'}))}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform border-4 border-[#FFF0F3] dark:border-gray-900 ${state.view === 'DAILY_LOG' ? 'bg-[#2D2D2D] dark:bg-gray-600' : 'bg-[#E84C7C] shadow-pink-300 dark:shadow-none'}`}
        >
          <PlusCircle size={28} />
        </button>
      </div>

    </div>
  );
};

export default App;