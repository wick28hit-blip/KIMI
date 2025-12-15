import React, { useState, useEffect } from 'react';
import { UserProfile, CycleData, AppState, DailyLog, ProfileData } from './types';
import { STORAGE_KEY, HAS_ACCOUNT_KEY, encryptData, decryptData } from './utils/crypto';
import Onboarding from './components/Onboarding';
import LandingPage from './components/LandingPage';
import PinLock from './components/PinLock';
import BubbleDashboard from './components/BubbleDashboard';
import Settings from './components/Settings';
import MinePage from './components/MinePage';
import SplashScreen from './components/SplashScreen';
import DailyLogView from './components/DailyLog';
import { Home, Calendar, PlusCircle, BarChart2, Activity, Settings as SettingsIcon, Smile, Plus, User, Droplet, Moon, Flame, Dumbbell } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns';
import { getDayStatus } from './utils/calculations';

// Notification Logic (Imports from root utils)
import { syncProfileToIDB, getLastNotification, logNotificationSent } from './utils/db';
import { triggerLocalNotification, checkPeriodicNotifications, checkMoodTrigger } from './utils/scheduler';

// --- STORAGE CONSTANTS ---
// Separating data into distinct "tables" (keys) prevents large object merging issues
const USER_KEY_PREFIX = 'KIMI_USER_'; // Stores UserProfile, CycleData, Reminders
const LOGS_KEY_PREFIX = 'KIMI_LOGS_'; // Stores DailyLogs map
const LEGACY_PROFILE_KEY_PREFIX = 'KIMI_PROFILE_'; // For backward compatibility migration

export default function App() {
  const [state, setState] = useState<AppState>({
    view: 'SPLASH',
    user: null,
    cycle: null,
    logs: {},
    profiles: {},
    activeProfileId: null,
    darkMode: false
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [loginError, setLoginError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // --- NOTIFICATION SETUP ---
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    const registerPeriodicSync = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            if ('periodicSync' in registration) {
                try {
                    // @ts-ignore
                    await registration.periodicSync.register('kimi-pms-notification-sync', {
                        minInterval: 10 * 60 * 1000, // 10 minutes
                    });
                } catch (e) {
                    console.log("Periodic Sync not supported/allowed", e);
                }
            }
        }
    };
    registerPeriodicSync();

    const intervalId = setInterval(() => {
        checkPeriodicNotifications();
    }, 10 * 60 * 1000); 

    return () => clearInterval(intervalId);
  }, []);

  // --- SYNC STATE TO INDEXEDDB ---
  useEffect(() => {
    if (state.user && state.cycle && state.activeProfileId) {
        const profileData: ProfileData = {
            user: state.user,
            cycle: state.cycle,
            logs: state.logs
        };
        syncProfileToIDB(profileData).catch(console.error);
    }
  }, [state.user, state.cycle, state.logs, state.activeProfileId]);

  // Theme Handling
  useEffect(() => {
    const storedTheme = localStorage.getItem('KIMI_THEME');
    const isDark = storedTheme === 'dark';
    if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
    }
  }, []);

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

  // Navigation Handling
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (state.view !== 'HOME' && state.view !== 'PIN' && state.view !== 'ONBOARDING' && state.view !== 'BOOT' && state.view !== 'LANDING' && state.view !== 'SPLASH') {
        event.preventDefault();
        setState(s => ({ ...s, view: 'HOME' }));
      }
    };

    if (state.view !== 'HOME' && state.view !== 'PIN' && state.view !== 'ONBOARDING' && state.view !== 'BOOT' && state.view !== 'LANDING' && state.view !== 'SPLASH') {
        window.history.pushState({ view: state.view }, '');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [state.view]);

  const toggleDarkMode = () => setState(s => ({ ...s, darkMode: !s.darkMode }));

  const handleSplashComplete = () => {
    const storedTheme = localStorage.getItem('KIMI_THEME');
    const isDark = storedTheme === 'dark';
    const hasAccount = localStorage.getItem(HAS_ACCOUNT_KEY);
    
    if (!hasAccount) {
      setState(s => ({ ...s, view: 'LANDING', darkMode: isDark }));
    } else {
      setState(s => ({ ...s, view: 'PIN', darkMode: isDark }));
    }
  };

  const checkLoginNotification = async () => {
      const lastLoginNotif = await getLastNotification('LOGIN');
      const isNewDay = !lastLoginNotif || (new Date(lastLoginNotif).getDate() !== new Date().getDate());
      
      if (isNewDay) {
          triggerLocalNotification(
              "Log Today's Update",
              "Please complete your Flow, Mood, and Symptoms for today in the Log Today tab.",
              "daily-log-reminder"
          );
          await logNotificationSent('LOGIN');
      }
  };

  // --- STORAGE HELPERS ---

  const saveProfileDataToStorage = (id: string, data: ProfileData, pin: string) => {
    // 1. Save User Metadata (User info, Cycle settings)
    const userPayload = {
      user: data.user,
      cycle: data.cycle,
      reminders: data.reminders
    };
    localStorage.setItem(`${USER_KEY_PREFIX}${id}`, encryptData(userPayload, pin));

    // 2. Save Logs separately
    localStorage.setItem(`${LOGS_KEY_PREFIX}${id}`, encryptData(data.logs, pin));
  };

  const persistAllProfiles = (profiles: Record<string, ProfileData>, activeId: string | null, pin: string) => {
    try {
      Object.keys(profiles).forEach(id => {
        saveProfileDataToStorage(id, profiles[id], pin);
      });

      const indexData = {
        activeProfileId: activeId,
        profileIds: Object.keys(profiles),
        version: 3 // Version 3 uses split storage
      };
      localStorage.setItem(STORAGE_KEY, encryptData(indexData, pin));
      localStorage.setItem(HAS_ACCOUNT_KEY, 'true');
    } catch (e) {
      console.error("Persistence Error", e);
      alert("Failed to save data. Storage might be full.");
    }
  };

  const handleLogin = (pin: string) => {
    const encryptedIndex = localStorage.getItem(STORAGE_KEY);
    if (encryptedIndex) {
      const indexData: any = decryptData(encryptedIndex, pin);
      
      if (indexData) {
        let profiles: Record<string, ProfileData> = {};
        let activeId: string | null = null;
        const ids: string[] = indexData.profileIds || [];

        // LOAD PROFILES
        ids.forEach(id => {
            // Strategy: Try loading from new separate tables first. 
            // If not found, fall back to legacy single-key format and migrate.
            const userKey = `${USER_KEY_PREFIX}${id}`;
            const logsKey = `${LOGS_KEY_PREFIX}${id}`;
            
            const userEnc = localStorage.getItem(userKey);
            const logsEnc = localStorage.getItem(logsKey);

            if (userEnc && logsEnc) {
                // Version 3: Separated Tables
                const userData = decryptData(userEnc, pin);
                const logsData = decryptData(logsEnc, pin);
                if (userData && logsData) {
                    profiles[id] = {
                        user: userData.user,
                        cycle: userData.cycle,
                        reminders: userData.reminders,
                        logs: logsData
                    };
                }
            } else {
                // Fallback / Migration for Version 1 & 2
                const legacyKey = `${LEGACY_PROFILE_KEY_PREFIX}${id}`;
                const legacyEnc = localStorage.getItem(legacyKey);
                if (legacyEnc) {
                    const pData = decryptData(legacyEnc, pin);
                    if (pData) {
                        profiles[id] = pData;
                        // MIGRATION: Save in new format immediately
                        saveProfileDataToStorage(id, pData, pin);
                        // Optional: Clean up legacy key
                        localStorage.removeItem(legacyKey);
                    }
                }
            }
        });

        // Determine Active ID
        if (indexData.activeProfileId && profiles[indexData.activeProfileId]) {
            activeId = indexData.activeProfileId;
        } else if (ids.length > 0 && profiles[ids[0]]) {
            activeId = ids[0];
        } else if (indexData.user) {
             // Ancient version fallback
             const userId = indexData.user.id || 'primary_user';
             const pmsData = indexData.user.pmsData || { stress: 5, sleep: 5, anxiety: 5, depression: 5, height: 165, weight: 65, bmi: 5, diet: 5 };
             const userProfile = { ...indexData.user, id: userId, relationship: 'Self', pmsData };
             profiles = { [userId]: { user: userProfile, cycle: indexData.cycle, logs: indexData.logs || {} } };
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
            checkLoginNotification();
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
    setState(s => ({ ...s, view: 'PIN', user: null, cycle: null, logs: {}, profiles: {}, activeProfileId: null }));
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HAS_ACCOUNT_KEY);
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(USER_KEY_PREFIX) || key.startsWith(LOGS_KEY_PREFIX) || key.startsWith(LEGACY_PROFILE_KEY_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
    setState({ view: 'LANDING', user: null, cycle: null, logs: {}, profiles: {}, activeProfileId: null, darkMode: state.darkMode });
  };

  const handleCreateProfile = (user: UserProfile, cycle: CycleData, initialLogs: Record<string, DailyLog> = {}) => {
    const isInitialSetup = Object.keys(state.profiles).length === 0;
    let userToSave = { ...user };
    let encryptionPin = user.pin;

    if (!isInitialSetup) {
        const profilesList = Object.values(state.profiles) as ProfileData[];
        const primaryUser = profilesList.find(p => p.user.relationship === 'Self')?.user;
        const existingPin = primaryUser?.pin || state.user?.pin;
        if (existingPin) {
            userToSave.pin = existingPin;
            encryptionPin = existingPin;
        }
    }

    const newProfileData: ProfileData = { user: userToSave, cycle, logs: initialLogs };
    const newProfiles = { ...state.profiles, [user.id]: newProfileData };
    
    // Save all state
    persistAllProfiles(newProfiles, user.id, encryptionPin);

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
          const pin = state.user?.pin || ''; 
          // Update Index only
          const indexData = {
            activeProfileId: profileId,
            profileIds: Object.keys(state.profiles),
            version: 3
          };
          localStorage.setItem(STORAGE_KEY, encryptData(indexData, pin));

          setState(s => ({
              ...s,
              activeProfileId: profileId,
              user: target.user,
              cycle: target.cycle,
              logs: target.logs,
              view: 'HOME'
          }));
      }
  };

  const handleDeleteProfile = (profileId: string) => {
    const currentProfiles = { ...state.profiles };
    const targetUser = currentProfiles[profileId].user;

    if (targetUser.relationship === 'Self') {
        alert("You cannot delete the main profile. Use 'Delete All Data' in the Danger Zone to reset the app.");
        return;
    }

    if (!window.confirm(`Are you sure you want to delete ${targetUser.name}'s profile?`)) return;

    delete currentProfiles[profileId];
    let nextActiveId = state.activeProfileId;
    
    if (state.activeProfileId === profileId || !currentProfiles[state.activeProfileId!]) {
        const selfProfile = Object.values(currentProfiles).find(p => p.user.relationship === 'Self');
        nextActiveId = selfProfile ? selfProfile.user.id : (Object.keys(currentProfiles)[0] || null);
        if (!nextActiveId) { handleReset(); return; }
    }

    const primaryUser = Object.values(currentProfiles).find(p => p.user.relationship === 'Self')?.user;
    const pinToUse = primaryUser?.pin || state.user?.pin || '';

    // Remove separate tables
    localStorage.removeItem(`${USER_KEY_PREFIX}${profileId}`);
    localStorage.removeItem(`${LOGS_KEY_PREFIX}${profileId}`);
    // Cleanup legacy if exists
    localStorage.removeItem(`${LEGACY_PROFILE_KEY_PREFIX}${profileId}`);

    persistAllProfiles(currentProfiles, nextActiveId!, pinToUse);

    const nextActiveData = currentProfiles[nextActiveId!];
    setState(prev => ({
        ...prev,
        profiles: currentProfiles,
        activeProfileId: nextActiveId,
        user: nextActiveData.user,
        cycle: nextActiveData.cycle,
        logs: nextActiveData.logs
    }));
  };

  const saveLog = (log: DailyLog) => {
    if (!state.activeProfileId) return;
    checkMoodTrigger(log.mood, log.symptoms);

    const currentProfile = state.profiles[state.activeProfileId];
    const newLogs = { ...currentProfile.logs, [log.date]: log };
    const updatedProfile = { ...currentProfile, logs: newLogs };
    const newProfiles = { ...state.profiles, [state.activeProfileId]: updatedProfile };
    const pinToUse = state.user?.pin || '';

    // Only update the Logs "Table" for this profile to allow high-frequency updates without rewriting User data
    localStorage.setItem(`${LOGS_KEY_PREFIX}${state.activeProfileId}`, encryptData(newLogs, pinToUse));
    
    setState(s => ({ ...s, profiles: newProfiles, logs: newLogs }));
  };

  const handleExportData = () => {
    const dataToExport = {
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        version: 3
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
        const result = e.target?.result;
        if (typeof result !== 'string') return;
        const data: any = JSON.parse(result);
        
        let importedProfiles: Record<string, ProfileData> = {};
        let activeId = '';

        if (data && data.profiles) {
            importedProfiles = data.profiles;
            activeId = data.activeProfileId || '';
        } else if (data && data.user && data.cycle) {
             const uid = data.user.id || 'imported_user';
             importedProfiles = { [uid]: { user: { ...data.user, id: uid }, cycle: data.cycle, logs: data.logs || {} } };
             activeId = uid;
        }

        if (Object.keys(importedProfiles).length > 0) {
            const primary = Object.values(importedProfiles).find((p: ProfileData) => p.user?.relationship === 'Self');
            // Save using new persistence logic
            persistAllProfiles(importedProfiles, activeId, primary?.user?.pin || '0000');
            const activeData = importedProfiles[activeId];
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
        alert('Failed to import data.');
      }
    };
    reader.readAsText(file);
  };

  const confirmDelete = () => {
    handleReset();
    window.location.reload();
  };

  const handleTestNotification = () => {
      if (Notification.permission !== 'granted') {
          Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                  triggerLocalNotification("KIMI Test", "Notifications working!", "test");
              }
          });
      } else {
          triggerLocalNotification("KIMI Test", "Notifications working!", "test");
      }
  };

  // --- RENDERERS ---

  if (state.view === 'SPLASH') return <SplashScreen onComplete={handleSplashComplete} />;
  if (state.view === 'BOOT') return <div className="min-h-screen bg-[#FFF0F3] dark:bg-gray-900" />;
  
  const renderCalendar = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    const weekDays = ['S','M','T','W','T','F','S'];

    return (
      <div className="p-4 pt-10 h-full overflow-y-auto bg-[#FFF0F3] dark:bg-gray-900 transition-colors pb-32">
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
             let status = state.cycle ? getDayStatus(day, state.cycle, state.user || undefined) : 'none';
             if (state.logs[format(day, 'yyyy-MM-dd')]?.flow) status = 'period_past';

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
        
        {/* Legends */}
        <div className="flex flex-wrap justify-center gap-4 mt-8 px-4 border-t border-pink-100 dark:border-gray-800 pt-6">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#E84C7C]"></div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Period</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#7B86CB]"></div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Ovulation</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-100 dark:bg-pink-900/40 border border-[#E84C7C]/30"></div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Fertile</span>
           </div>
        </div>
      </div>
    );
  };

  const renderHome = () => {
    return (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar bg-[#FFF0F3] dark:bg-gray-900 transition-colors pb-32">
        <header className="p-6 pb-2 pt-12 flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-[#2D2D2D] dark:text-white">Hello, {state.user?.name}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{state.user?.relationship === 'Self' ? 'Tracking for You' : `Tracking for ${state.user?.name}`}</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex -space-x-3 items-center">
                    {(Object.values(state.profiles) as ProfileData[]).map(p => (
                        <button 
                            key={p.user.id}
                            onClick={() => switchProfile(p.user.id)}
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 shadow-sm ${state.activeProfileId === p.user.id ? 'border-[#E84C7C] bg-pink-100 text-[#E84C7C] z-10 scale-110' : 'border-white bg-gray-200 text-gray-500 opacity-70'}`}
                        >
                            {p.user.name.charAt(0).toUpperCase()}
                        </button>
                    ))}
                    <button onClick={() => setState(s => ({...s, view: 'ONBOARDING'}))} className="w-10 h-10 rounded-full border-2 border-white bg-white dark:bg-gray-800 text-gray-400 flex items-center justify-center shadow-sm hover:text-[#E84C7C]">
                        <Plus size={16} />
                    </button>
                </div>
                <button onClick={() => setState(s => ({...s, view: 'SETTINGS'}))} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-500 dark:text-gray-300 hover:text-[#E84C7C]">
                    <SettingsIcon size={20} />
                </button>
            </div>
        </header>
        {state.cycle && <BubbleDashboard cycleData={state.cycle} user={state.user} />}
        </div>
    );
  };

  const renderInsights = () => {
    const logs = Object.values(state.logs) as DailyLog[];
    const totalDays = logs.length;
    const symptomMap: Record<string, number> = {};
    const moodMap: Record<string, number> = {};
    let totalWater = 0;
    let waterLogCount = 0;
    let totalSleep = 0;
    let sleepLogCount = 0;
    let totalExerciseMinutes = 0;

    logs.forEach(log => {
        log.symptoms.forEach(s => symptomMap[s] = (symptomMap[s] || 0) + 1);
        (log.mood || []).forEach(m => moodMap[m] = (moodMap[m] || 0) + 1);
        
        if (log.waterIntake > 0) {
            totalWater += log.waterIntake;
            waterLogCount++;
        }
        if (log.sleepDuration > 0) {
            totalSleep += log.sleepDuration;
            sleepLogCount++;
        }
        if (log.didExercise) {
             totalExerciseMinutes += log.exerciseDuration || 30; // Fallback to 30 if undefined
        }
    });

    const topSymptoms = Object.entries(symptomMap).sort(([,a], [,b]) => b - a).slice(0, 4);
    const topMoods = Object.entries(moodMap).sort(([,a], [,b]) => b - a).slice(0, 6);
    
    const avgWater = waterLogCount > 0 ? Math.round(totalWater / waterLogCount) : 0;
    const avgSleep = sleepLogCount > 0 ? Math.round(totalSleep / sleepLogCount) : 0;
    const avgSleepH = Math.floor(avgSleep / 60);
    const avgSleepM = avgSleep % 60;
    const totalExerciseHours = Math.floor(totalExerciseMinutes / 60);
    const totalExerciseMins = totalExerciseMinutes % 60;

    return (
        <div className="p-6 h-full overflow-y-auto pb-32 bg-[#FFF0F3] dark:bg-gray-900 transition-colors">
            <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white mb-6">Insights for {state.user?.name}</h2>
            
            {/* Vitals Overview */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <Droplet className="text-blue-400 mb-2" size={24} />
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Avg Hydration</span>
                    <span className="text-xl font-bold text-gray-800 dark:text-white">{avgWater} ml</span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <Moon className="text-indigo-400 mb-2" size={24} />
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Avg Sleep</span>
                    <span className="text-xl font-bold text-gray-800 dark:text-white">{avgSleepH}h {avgSleepM}m</span>
                </div>
                {/* Exercise Stat */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700 flex flex-col items-center justify-center text-center col-span-2">
                    <Dumbbell className="text-orange-400 mb-2" size={24} />
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Active Time</span>
                    <span className="text-xl font-bold text-gray-800 dark:text-white">{totalExerciseHours}h {totalExerciseMins}m</span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700">
                <h3 className="font-semibold text-lg mb-4 dark:text-gray-200 flex items-center gap-2"><Smile className="text-orange-400" size={20} /> Mood Patterns</h3>
                <div className="flex flex-wrap gap-2">
                    {topMoods.length > 0 ? topMoods.map(([mood, count], i) => (
                        <div key={mood} className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${i === 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                            <span>{mood}</span>
                            <span className="bg-white/50 px-1.5 rounded-full text-xs font-bold opacity-70">{count}</span>
                        </div>
                    )) : <p className="text-gray-400 text-sm italic">No mood data yet.</p>}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700">
                <h3 className="font-semibold text-lg mb-4 dark:text-gray-200 flex items-center gap-2"><Activity className="text-purple-500" size={20} /> Top Symptoms</h3>
                 <div className="space-y-3">
                    {topSymptoms.length > 0 ? topSymptoms.map(([sym, count]) => (
                        <div key={sym} className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{sym}</span>
                            <div className="flex items-center gap-2 flex-1 ml-4 justify-end">
                                 <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-purple-400 rounded-full" style={{ width: `${(count / totalDays) * 100}%` }} />
                                 </div>
                                 <span className="text-xs text-gray-400 font-medium w-4 text-right">{count}</span>
                            </div>
                        </div>
                    )) : <p className="text-gray-400 text-sm italic">No symptoms logged.</p>}
                </div>
            </div>
        </div>
    );
  };

  const renderDailyLog = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const log = state.logs[today] || { 
        date: today, waterIntake: 0, waterTarget: 2000, sleepDuration: 0, sleepTarget: 480,
        flow: null, symptoms: [], detailedSymptoms: [], mood: [], medication: false, didExercise: false, habits: { smoked: false, drank: false } 
    };
    return <DailyLogView log={log} onSave={saveLog} onClose={() => setState(s => ({...s, view: 'HOME'}))} />;
  };

  const renderMine = () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const log = state.logs[today] || { 
          date: today, waterIntake: 0, waterTarget: 2000, sleepDuration: 0, sleepTarget: 480,
          flow: null, symptoms: [], detailedSymptoms: [], mood: [], medication: false, didExercise: false, habits: { smoked: false, drank: false } 
      };
      return <MinePage log={log} onSaveLog={saveLog} user={state.user} />;
  };

  return (
    <div className={`max-w-md mx-auto bg-[#FFF0F3] dark:bg-gray-900 h-[100dvh] relative shadow-2xl overflow-hidden flex flex-col transition-colors duration-300`}>
      <main className="flex-1 overflow-hidden relative">
        {state.view === 'HOME' && renderHome()}
        {state.view === 'CALENDAR' && renderCalendar()}
        {state.view === 'DAILY_LOG' && renderDailyLog()}
        {state.view === 'INSIGHTS' && renderInsights()}
        {state.view === 'MINE' && renderMine()}
        {state.view === 'LANDING' && <LandingPage onStartTracking={() => setState(s => ({...s, view: 'ONBOARDING'}))} />}
        {state.view === 'ONBOARDING' && <Onboarding onComplete={handleCreateProfile} isAddingProfile={Object.keys(state.profiles).length > 0} onCancel={() => setState(s => ({...s, view: 'HOME'}))} />}
        {state.view === 'PIN' && <PinLock onSuccess={handleLogin} expectedPin={state.user?.pin} onReset={handleReset} loginError={loginError} onClearLoginError={() => setLoginError(false)} />}
        {state.view === 'SETTINGS' && (
            <Settings 
                profiles={(Object.values(state.profiles) as ProfileData[]).map(p => p.user)}
                onDeleteProfile={handleDeleteProfile}
                onExport={handleExportData}
                onImport={handleImportData}
                onDeleteData={() => setShowDeleteModal(true)}
                isDarkMode={state.darkMode}
                onToggleDarkMode={toggleDarkMode}
                onLogout={handleLogout}
                onAddProfile={() => setState(s => ({ ...s, view: 'ONBOARDING' }))}
                onTestNotification={handleTestNotification}
                onClose={() => setState(s => ({...s, view: 'HOME'}))}
            />
        )}
      </main>

      {showDeleteModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-sm border border-red-100 dark:border-red-900/30">
             <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4 text-red-500"><Activity size={24} className="rotate-45" /></div>
             <h3 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">Delete All Data?</h3>
             <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">This action cannot be undone.</p>
             <div className="flex flex-col gap-3">
                 <button onClick={handleExportData} className="w-full py-3 border-2 border-[#E84C7C] text-[#E84C7C] rounded-xl font-bold hover:bg-pink-50">Export Backup</button>
                 <button onClick={confirmDelete} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold">Yes, Delete</button>
                 <button onClick={() => setShowDeleteModal(false)} className="w-full py-3 text-gray-500 font-medium">Cancel</button>
             </div>
          </div>
        </div>
      )}

      {(state.view !== 'LANDING' && state.view !== 'ONBOARDING' && state.view !== 'PIN') && (
        <>
          <nav className="absolute bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-pink-100 dark:border-gray-700 flex justify-between px-2 py-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 rounded-t-3xl shadow-[0_-5px_20px_rgba(232,76,124,0.1)] transition-colors">
            {[{view: 'HOME', icon: Home, label: 'Home'}, {view: 'CALENDAR', icon: Calendar, label: 'Calendar'}, {view: 'INSIGHTS', icon: BarChart2, label: 'Insights'}, {view: 'MINE', icon: User, label: 'Mine'}].map(item => (
                <React.Fragment key={item.view}>
                    {item.view === 'INSIGHTS' && <div className="w-16" />}
                    <button onClick={() => setState(s => ({...s, view: item.view as any}))} className={`flex-1 flex flex-col items-center gap-1 ${state.view === item.view ? 'text-[#E84C7C]' : 'text-gray-400 dark:text-gray-500'}`}>
                        <item.icon size={22} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                </React.Fragment>
            ))}
          </nav>
          <div className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50">
            <button onClick={() => setState(s => ({...s, view: 'DAILY_LOG'}))} className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform border-4 border-[#FFF0F3] dark:border-gray-900 ${state.view === 'DAILY_LOG' ? 'bg-[#2D2D2D] dark:bg-gray-600' : 'bg-[#E84C7C] shadow-pink-300 dark:shadow-none'}`}>
              <PlusCircle size={28} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};