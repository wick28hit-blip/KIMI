
import React, { useState, useEffect } from 'react';
import { UserProfile, CycleData, AppState, DailyLog, ProfileData, ReminderConfig } from './types';
import { STORAGE_KEY, HAS_ACCOUNT_KEY, encryptData, decryptData } from './utils/crypto';
import Onboarding from './components/Onboarding';
import LandingPage from './components/LandingPage';
import PinLock from './components/PinLock';
import BubbleDashboard from './components/BubbleDashboard';
import Settings from './components/Settings';
import MinePage from './components/MinePage';
import SplashScreen from './components/SplashScreen';
import DailyLogView from './components/DailyLog';
import { Home, Calendar, PlusCircle, BarChart2, Activity, Settings as SettingsIcon, Smile, Plus, User, Droplet, Moon, Flame, Dumbbell, Sparkles } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, subDays, parseISO } from 'date-fns';
import { getDayStatus, calculateWaterTarget } from './utils/calculations';

import { syncProfileToIDB, getLastNotification, logNotificationSent } from './utils/db';
import { triggerLocalNotification, checkPeriodicNotifications, checkMoodTrigger } from './utils/scheduler';
import { triggerHaptic, setHapticsEnabled, isHapticsEnabled } from './utils/haptics';

const USER_KEY_PREFIX = 'KIMI_USER_';
const LOGS_KEY_PREFIX = 'KIMI_LOGS_';
const LEGACY_PROFILE_KEY_PREFIX = 'KIMI_PROFILE_';

export default function App() {
  const [state, setState] = useState<AppState>({
    view: 'SPLASH',
    user: null,
    cycle: null,
    logs: {},
    profiles: {},
    activeProfileId: null,
    darkMode: false,
    hapticsEnabled: isHapticsEnabled()
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [loginError, setLoginError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Legend Popup State
  const [legendPopup, setLegendPopup] = useState<{label: string, desc: string} | null>(null);
  // Active Legend Highlight State
  const [activeLegend, setActiveLegend] = useState<'period' | 'ovulation' | 'fertile' | null>(null);

  useEffect(() => {
    // Note: Permission request logic handled in Settings for iOS compliance
    
    const registerPeriodicSync = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            if ('periodicSync' in registration) {
                try {
                    // @ts-ignore
                    await registration.periodicSync.register('kimi-pms-notification-sync', {
                        minInterval: 10 * 60 * 1000,
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

  useEffect(() => {
    if (state.user && state.cycle && state.activeProfileId) {
        // Fetch reminders from localStorage to sync with IDB for the scheduler
        const remindersStr = localStorage.getItem('KIMI_REMINDERS');
        const reminders = remindersStr ? JSON.parse(remindersStr) : [];
        
        const profileData: ProfileData = {
            user: state.user,
            cycle: state.cycle,
            logs: state.logs,
            reminders
        };
        syncProfileToIDB(profileData).catch(console.error);
    }
  }, [state.user, state.cycle, state.logs, state.activeProfileId]);

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

  const toggleDarkMode = () => {
      setState(s => ({ ...s, darkMode: !s.darkMode }));
      triggerHaptic('medium');
  };
  
  const toggleHaptics = () => {
      const newValue = !state.hapticsEnabled;
      setState(s => ({ ...s, hapticsEnabled: newValue }));
      setHapticsEnabled(newValue);
      if (newValue) triggerHaptic('medium');
  };

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

  const saveProfileDataToStorage = (id: string, data: ProfileData, pin: string) => {
    const userPayload = {
      user: data.user,
      cycle: data.cycle,
      reminders: data.reminders
    };
    localStorage.setItem(`${USER_KEY_PREFIX}${id}`, encryptData(userPayload, pin));
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
        version: 3
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

        ids.forEach(id => {
            const userKey = `${USER_KEY_PREFIX}${id}`;
            const logsKey = `${LOGS_KEY_PREFIX}${id}`;
            
            const userEnc = localStorage.getItem(userKey);
            const logsEnc = localStorage.getItem(logsKey);

            if (userEnc && logsEnc) {
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
                const legacyKey = `${LEGACY_PROFILE_KEY_PREFIX}${id}`;
                const legacyEnc = localStorage.getItem(legacyKey);
                if (legacyEnc) {
                    const pData = decryptData(legacyEnc, pin);
                    if (pData) {
                        profiles[id] = pData;
                        saveProfileDataToStorage(id, pData, pin);
                        localStorage.removeItem(legacyKey);
                    }
                }
            }
        });

        if (indexData.activeProfileId && profiles[indexData.activeProfileId]) {
            activeId = indexData.activeProfileId;
        } else if (ids.length > 0 && profiles[ids[0]]) {
            activeId = ids[0];
        } else if (indexData.user) {
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
            triggerHaptic('success');
            checkLoginNotification();
        } else {
             setLoginError(true);
             triggerHaptic('error');
        }
      } else {
        setLoginError(true);
        triggerHaptic('error');
      }
    } else {
       setLoginError(true);
       triggerHaptic('error');
    }
  };

  const handleLogout = () => {
    setState(s => ({ ...s, view: 'PIN', user: null, cycle: null, logs: {}, profiles: {}, activeProfileId: null }));
    triggerHaptic('medium');
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HAS_ACCOUNT_KEY);
    localStorage.removeItem('KIMI_REMINDERS');
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(USER_KEY_PREFIX) || key.startsWith(LOGS_KEY_PREFIX) || key.startsWith(LEGACY_PROFILE_KEY_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
    setState({ view: 'LANDING', user: null, cycle: null, logs: {}, profiles: {}, activeProfileId: null, darkMode: state.darkMode, hapticsEnabled: state.hapticsEnabled });
    triggerHaptic('warning');
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
    triggerHaptic('success');
  };

  const switchProfile = (profileId: string) => {
      const target = state.profiles[profileId];
      if (target) {
          const pin = state.user?.pin || ''; 
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
          triggerHaptic('medium');
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

    localStorage.removeItem(`${USER_KEY_PREFIX}${profileId}`);
    localStorage.removeItem(`${LOGS_KEY_PREFIX}${profileId}`);
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
    triggerHaptic('warning');
  };

  const saveLog = (log: DailyLog) => {
    if (!state.activeProfileId) return;
    checkMoodTrigger(log.mood, log.symptoms);

    const currentProfile = state.profiles[state.activeProfileId];
    const newLogs = { ...currentProfile.logs, [log.date]: log };
    const updatedProfile = { ...currentProfile, logs: newLogs };
    const newProfiles = { ...state.profiles, [state.activeProfileId]: updatedProfile };
    const pinToUse = state.user?.pin || '';

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
    triggerHaptic('medium');
  };

  // --- FIX: Explicitly type and cast handleImportData to resolve 'unknown' property access errors ---
  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') return;
        
        interface ImportData {
            profiles?: Record<string, ProfileData>;
            activeProfileId?: string;
            user?: UserProfile;
            cycle?: CycleData;
            logs?: Record<string, DailyLog>;
        }

        const data = JSON.parse(result) as ImportData;
        
        if (!data) return;

        let importedProfiles: Record<string, ProfileData> = {};
        let activeId = '';

        if (data.profiles) {
            importedProfiles = data.profiles;
            activeId = data.activeProfileId || '';
        } else if (data.user && data.cycle) {
             const userData = data.user;
             const uid = userData.id || 'imported_user';
             const profile: ProfileData = { 
               user: { ...userData, id: uid }, 
               cycle: data.cycle, 
               logs: data.logs || {} 
             };
             importedProfiles = { [uid]: profile };
             activeId = uid;
        }

        const profileIds = Object.keys(importedProfiles);
        if (profileIds.length > 0) {
            // FIX: Explicitly get values as ProfileData[]
            const profilesArray: ProfileData[] = Object.values(importedProfiles);
            const primary = profilesArray.find((p: ProfileData) => p.user?.relationship === 'Self');
            persistAllProfiles(importedProfiles, activeId, primary?.user?.pin || '0000');
            
            // FIX: Access current active profile and its properties with type safety
            const activeData: ProfileData | undefined = importedProfiles[activeId];
            setState(s => ({
                ...s,
                view: 'HOME',
                profiles: importedProfiles,
                activeProfileId: activeId,
                user: activeData ? activeData.user : null,
                cycle: activeData ? activeData.cycle : null,
                logs: activeData ? activeData.logs : {}
            }));
            alert('Data imported successfully!');
            triggerHaptic('success');
        } else {
            alert('Invalid file format.');
            triggerHaptic('error');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to import data.');
        triggerHaptic('error');
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
      triggerHaptic('medium');
  };

  const showLegendInfo = (type: 'period' | 'ovulation' | 'fertile') => {
      let info = { label: '', desc: '' };
      if (type === 'period') info = { label: 'Period', desc: 'Days of menstruation.' };
      if (type === 'ovulation') info = { label: 'Ovulation', desc: 'The day the egg is released. Peak fertility.' };
      if (type === 'fertile') info = { label: 'Fertile Window', desc: 'Days with high chance of pregnancy.' };
      setLegendPopup(info);
      triggerHaptic('light');
      setTimeout(() => setLegendPopup(null), 3000);
  };

  const toggleLegend = (type: 'period' | 'ovulation' | 'fertile') => {
      if (activeLegend === type) {
          setActiveLegend(null);
          setLegendPopup(null);
      } else {
          setActiveLegend(type);
          showLegendInfo(type);
      }
      triggerHaptic('light');
  };

  // --- RENDERERS ---

  if (state.view === 'SPLASH') return <SplashScreen onComplete={handleSplashComplete} />;
  if (state.view === 'BOOT') return <div className="min-h-screen" />;
  
  const renderCalendar = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    const weekDays = ['S','M','T','W','T','F','S'];

    return (
      <div className="p-4 pt-10 h-full overflow-y-auto pb-32 relative">
        <div className="flex justify-between items-center mb-6">
           <button onClick={() => { setCurrentDate(subMonths(currentDate, 1)); triggerHaptic('light'); }} className="neu-btn-round w-10 h-10">&lt;</button>
           <h2 className="text-xl font-bold text-[#2D2D2D] dark:text-white">{format(currentDate, 'MMMM yyyy')}</h2>
           <button onClick={() => { setCurrentDate(addMonths(currentDate, 1)); triggerHaptic('light'); }} className="neu-btn-round w-10 h-10">&gt;</button>
        </div>

        <div className="neu-flat p-4 mb-4 transition-all duration-300">
            <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(d => <div key={d} className="text-center text-gray-400 text-sm font-bold">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-y-4 gap-x-2">
            {days.map(day => {
                let status = state.cycle ? getDayStatus(day, state.cycle, state.user || undefined) : 'none';
                if (state.logs[format(day, 'yyyy-MM-dd')]?.flow) status = 'period_past';

                let bgClass = '';
                let textClass = 'text-gray-600 dark:text-gray-300';
                
                if (status === 'period') { bgClass = 'bg-[#E84C7C] text-white shadow-md'; textClass = 'text-white'; }
                else if (status === 'ovulation') { bgClass = 'bg-[#7B86CB] text-white shadow-md'; textClass = 'text-white'; }
                else if (status === 'fertile') { bgClass = 'neu-pressed text-[#E84C7C]'; textClass = 'text-[#E84C7C]'; }
                else if (status === 'period_past') { bgClass = 'bg-[#E84C7C] opacity-60 text-white'; textClass = 'text-white'; }
                else if (isToday(day)) { bgClass = 'border-2 border-[#E84C7C]'; }

                // Highlighting Logic
                const isHighlighted = activeLegend === null || 
                                      (activeLegend === 'period' && (status === 'period' || status === 'period_past')) ||
                                      (activeLegend === 'ovulation' && status === 'ovulation') ||
                                      (activeLegend === 'fertile' && status === 'fertile');

                const opacityClass = isHighlighted ? 'opacity-100 scale-100' : 'opacity-20 scale-90 grayscale';

                return (
                <div key={day.toString()} className={`flex flex-col items-center transition-all duration-500 ${opacityClass}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${bgClass} ${textClass}`}>
                    {format(day, 'd')}
                    </div>
                </div>
                );
            })}
            </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3 mt-8 px-4">
           <button 
             onClick={() => toggleLegend('period')} 
             className={`flex items-center gap-2 px-3 py-2 rounded-xl active:scale-95 transition-all ${activeLegend === 'period' ? 'bg-white dark:bg-white/10 shadow-md ring-2 ring-[#E84C7C] ring-offset-2 dark:ring-offset-gray-900' : 'hover:bg-white/50 dark:hover:bg-white/5'}`}
           >
              <div className="w-3 h-3 rounded-full bg-[#E84C7C] shadow-sm"></div>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Period</span>
           </button>
           
           <button 
             onClick={() => toggleLegend('ovulation')} 
             className={`flex items-center gap-2 px-3 py-2 rounded-xl active:scale-95 transition-all ${activeLegend === 'ovulation' ? 'bg-white dark:bg-white/10 shadow-md ring-2 ring-[#7B86CB] ring-offset-2 dark:ring-offset-gray-900' : 'hover:bg-white/50 dark:hover:bg-white/5'}`}
           >
              <div className="w-3 h-3 rounded-full bg-[#7B86CB] shadow-sm"></div>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Ovulation</span>
           </button>
           
           <button 
             onClick={() => toggleLegend('fertile')} 
             className={`flex items-center gap-2 px-3 py-2 rounded-xl active:scale-95 transition-all ${activeLegend === 'fertile' ? 'bg-white dark:bg-white/10 shadow-md ring-2 ring-pink-300 ring-offset-2 dark:ring-offset-gray-900' : 'hover:bg-white/50 dark:hover:bg-white/5'}`}
           >
              <div className="w-3 h-3 rounded-full bg-pink-100 border border-[#E84C7C] shadow-sm"></div>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Fertile</span>
           </button>
        </div>

        {legendPopup && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 text-center min-w-[200px]">
                <p className="text-sm font-bold mb-0.5">{legendPopup.label}</p>
                <p className="text-xs opacity-90 leading-relaxed">{legendPopup.desc}</p>
            </div>
        )}
      </div>
    );
  };

  const renderHome = () => {
    // Pass today's log to the dashboard for context-aware tips
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const todayLog = state.logs[todayKey];

    return (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar pb-32">
        <header className="p-6 pb-2 pt-12 flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-[#2D2D2D] dark:text-white">Hello, {state.user?.name}</h1>
                <p className="text-gray-500 text-sm">{state.user?.relationship === 'Self' ? 'Tracking for You' : `Tracking for ${state.user?.name}`}</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex -space-x-3 items-center">
                    {(Object.values(state.profiles) as ProfileData[]).map(p => (
                        <button 
                            key={p.user.id}
                            onClick={() => switchProfile(p.user.id)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 ${state.activeProfileId === p.user.id ? 'neu-active z-10 scale-110' : 'neu-flat text-gray-400'}`}
                        >
                            {p.user.name.charAt(0).toUpperCase()}
                        </button>
                    ))}
                    <button onClick={() => { setState(s => ({...s, view: 'ONBOARDING'})); triggerHaptic('medium'); }} className="neu-btn-round w-10 h-10">
                        <Plus size={16} />
                    </button>
                </div>
                <button onClick={() => { setState(s => ({...s, view: 'SETTINGS'})); triggerHaptic('medium'); }} className="neu-btn-round w-10 h-10">
                    <SettingsIcon size={20} />
                </button>
            </div>
        </header>
        {state.cycle && <BubbleDashboard cycleData={state.cycle} user={state.user} dailyLog={todayLog} />}
        </div>
    );
  };

  const renderInsights = () => {
    const logs = Object.values(state.logs) as DailyLog[];
    const totalDays = logs.length;
    
    // Data Accumulators
    const symptomsByCategory: Record<string, Record<string, number>> = {
        Head: {}, Body: {}, Cervix: {}, Fluid: {}, Abdomen: {}, Mental: {}
    };
    const moodMap: Record<string, number> = {};
    
    let totalWater = 0;
    let waterLogCount = 0;
    let totalSleep = 0;
    let sleepLogCount = 0;
    
    let gymMinutes = 0;
    let yogaMinutes = 0;

    logs.forEach(log => {
        if (log.detailedSymptoms && log.detailedSymptoms.length > 0) {
             log.detailedSymptoms.forEach(s => {
                 const cat = s.category || 'Body';
                 if (!symptomsByCategory[cat]) symptomsByCategory[cat] = {};
                 symptomsByCategory[cat][s.name] = (symptomsByCategory[cat][s.name] || 0) + 1;
             });
        }

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
             const duration = log.exerciseDuration || 30;
             if (log.exerciseType === 'Yoga') {
                 yogaMinutes += duration;
             } else {
                 gymMinutes += duration;
             }
        }
    });

    const topMoods = Object.entries(moodMap).sort(([,a], [,b]) => b - a).slice(0, 6);
    
    const avgWater = waterLogCount > 0 ? Math.round(totalWater / waterLogCount) : 0;
    const avgSleep = sleepLogCount > 0 ? Math.round(totalSleep / sleepLogCount) : 0;
    const avgSleepH = Math.floor(avgSleep / 60);
    const avgSleepM = avgSleep % 60;
    
    const gymH = Math.floor(gymMinutes / 60);
    const gymM = gymMinutes % 60;
    const yogaH = Math.floor(yogaMinutes / 60);
    const yogaM = yogaMinutes % 60;

    const last7Days = Array.from({length: 7}, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        return format(d, 'yyyy-MM-dd');
    });

    const chartData = last7Days.map(date => {
        const entry = state.logs[date];
        return {
            label: format(parseISO(date), 'EEE'),
            water: entry?.waterIntake || 0,
            sleep: entry?.sleepDuration ? entry.sleepDuration / 60 : 0
        };
    });

    return (
        <div className="p-6 h-full overflow-y-auto pb-32">
            <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white mb-6">Insights</h2>
            
            <div className="neu-flat p-5 mb-6">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <BarChart2 size={18} className="text-[#E84C7C]" /> 
                    Weekly Trends
                </h3>
                
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
                        <Droplet size={12} className="text-blue-400" /> Hydration
                    </div>
                    <div className="flex items-end justify-between gap-2 h-24">
                        {chartData.map((d, i) => (
                            <div key={i} className="flex flex-col items-center flex-1 group">
                                <div className="w-full neu-pressed rounded-md relative h-20 flex items-end overflow-hidden">
                                    <div 
                                        className="w-full bg-blue-400 transition-all duration-500"
                                        style={{ height: `${Math.min(100, (d.water / 3000) * 100)}%` }} 
                                    />
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1">{d.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8">
                    <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 font-bold uppercase tracking-wider">
                        <Moon size={12} className="text-indigo-400" /> Sleep Cycle (Weekly)
                    </div>
                    
                    <div className="grid grid-cols-7 gap-2 px-1">
                        {chartData.map((d, i) => (
                            <div key={i} className="flex flex-col items-center group cursor-pointer w-full" onClick={() => triggerHaptic('light')}>
                                {/* Glass Pattern Bar */}
                                <div className="w-full neu-pressed rounded-full relative h-24 flex items-end overflow-hidden">
                                    <div 
                                        className="w-full bg-gradient-to-t from-[#7E57C2] to-[#bcaaa4] opacity-80 transition-all duration-500"
                                        style={{ height: `${Math.min(100, (d.sleep / 10) * 100)}%` }} 
                                    />
                                </div>
                                <span className="text-[10px] text-gray-400 mt-2 font-bold">{d.label.charAt(0)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="neu-flat p-4 flex flex-col items-center justify-center text-center">
                    <Droplet className="text-blue-400 mb-2" size={24} />
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Avg Hydration</span>
                    <span className="text-xl font-bold text-gray-800 dark:text-white">{avgWater} ml</span>
                </div>
                <div className="neu-flat p-4 flex flex-col items-center justify-center text-center">
                    <Moon className="text-indigo-400 mb-2" size={24} />
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Avg Sleep</span>
                    <span className="text-xl font-bold text-gray-800 dark:text-white">{avgSleepH}h {avgSleepM}m</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="neu-flat p-4 flex flex-col items-center justify-center text-center">
                    <Dumbbell className="text-orange-400 mb-2" size={24} />
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Gym</span>
                    <span className="text-xl font-bold text-gray-800 dark:text-white">{gymH}h {gymM}m</span>
                </div>
                <div className="neu-flat p-4 flex flex-col items-center justify-center text-center">
                    <Sparkles className="text-pink-400 mb-2" size={24} />
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Yoga</span>
                    <span className="text-xl font-bold text-gray-800 dark:text-white">{yogaH}h {yogaM}m</span>
                </div>
            </div>

            <div className="neu-flat p-6 mb-6">
                <h3 className="font-semibold text-lg mb-4 dark:text-gray-200 flex items-center gap-2"><Smile className="text-orange-400" size={20} /> Mood Patterns</h3>
                <div className="flex flex-wrap gap-2">
                    {topMoods.length > 0 ? topMoods.map(([mood, count], i) => (
                        <div key={mood} className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${i === 0 ? 'neu-active' : 'neu-pressed text-gray-500'}`}>
                            <span>{mood}</span>
                            <span className="text-xs font-bold opacity-70">{count}</span>
                        </div>
                    )) : <p className="text-gray-400 text-sm italic">No mood data yet.</p>}
                </div>
            </div>

            <div className="neu-flat p-6 mb-6">
                <h3 className="font-semibold text-lg mb-4 dark:text-gray-200 flex items-center gap-2">
                    <Activity className="text-purple-500" size={20} /> Symptoms
                </h3>
                
                <div className="space-y-6">
                    {Object.entries(symptomsByCategory).map(([category, items]) => {
                        const entries = Object.entries(items).sort(([,a], [,b]) => b - a);
                        if (entries.length === 0) return null;

                        return (
                            <div key={category}>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-2 border-l-2 border-purple-200">{category}</h4>
                                <div className="space-y-3 pl-2">
                                    {entries.map(([sym, count]) => (
                                        <div key={sym} className="flex items-center justify-between">
                                            <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">{sym}</span>
                                            <div className="flex items-center gap-2 flex-1 ml-4 justify-end">
                                                <div className="w-24 h-2 neu-pressed rounded-full overflow-hidden">
                                                    <div className="h-full bg-purple-400 rounded-full" style={{ width: `${(count / totalDays) * 100}%` }} />
                                                </div>
                                                <span className="text-xs text-gray-400 font-medium w-4 text-right">{count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {Object.values(symptomsByCategory).every(cat => Object.keys(cat).length === 0) && (
                        <p className="text-gray-400 text-sm italic text-center py-2">No symptoms logged yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
  };

  const renderDailyLog = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const waterTarget = state.user ? calculateWaterTarget(state.user.age || 25, state.user.pmsData.weight || 60) : 2000;
    const log = state.logs[today] || { 
        date: today, waterIntake: 0, waterTarget: waterTarget, sleepDuration: 0, sleepTarget: 480,
        flow: null, symptoms: [], detailedSymptoms: [], mood: [], medication: false, didExercise: false, habits: { smoked: false, drank: false } 
    };
    return <DailyLogView log={log} onSaveLog={saveLog} onClose={() => { setState(s => ({...s, view: 'HOME'})); triggerHaptic('light'); }} />;
  };

  const renderMine = () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const waterTarget = state.user ? calculateWaterTarget(state.user.age || 25, state.user.pmsData.weight || 60) : 2000;
      const log = state.logs[today] || { 
          date: today, waterIntake: 0, waterTarget: waterTarget, sleepDuration: 0, sleepTarget: 480,
          flow: null, symptoms: [], detailedSymptoms: [], mood: [], medication: false, didExercise: false, habits: { smoked: false, drank: false } 
      };
      return <MinePage log={log} onSaveLog={saveLog} user={state.user} />;
  };

  return (
    // Updated container to use w-full md:max-w-md for better responsiveness on small screens
    // Added overflow-hidden to root to prevent body scroll
    <div className={`w-full md:max-w-md mx-auto h-[100dvh] relative shadow-2xl overflow-hidden flex flex-col transition-colors duration-300 bg-transparent`}>
      <main className="flex-1 overflow-hidden relative">
        {state.view === 'HOME' && renderHome()}
        {state.view === 'CALENDAR' && renderCalendar()}
        {state.view === 'DAILY_LOG' && renderDailyLog()}
        {state.view === 'INSIGHTS' && renderInsights()}
        {state.view === 'MINE' && renderMine()}
        {state.view === 'LANDING' && <LandingPage onStartTracking={() => { setState(s => ({...s, view: 'ONBOARDING'})); triggerHaptic('medium'); }} />}
        {state.view === 'ONBOARDING' && <Onboarding onComplete={handleCreateProfile} isAddingProfile={Object.keys(state.profiles).length > 0} onCancel={() => { setState(s => ({...s, view: 'HOME'})); triggerHaptic('light'); }} />}
        {state.view === 'PIN' && <PinLock onSuccess={handleLogin} expectedPin={state.user?.pin} onReset={handleReset} loginError={loginError} onClearLoginError={() => setLoginError(false)} />}
        {state.view === 'SETTINGS' && (
            <Settings 
                profiles={(Object.values(state.profiles) as ProfileData[]).map(p => p.user)}
                onDeleteProfile={handleDeleteProfile}
                onExport={handleExportData}
                onImport={handleImportData}
                onDeleteData={() => { setShowDeleteModal(true); triggerHaptic('warning'); }}
                isDarkMode={state.darkMode}
                onToggleDarkMode={toggleDarkMode}
                onLogout={handleLogout}
                onAddProfile={() => { setState(s => ({ ...s, view: 'ONBOARDING' })); triggerHaptic('medium'); }}
                onTestNotification={handleTestNotification}
                onClose={() => { setState(s => ({...s, view: 'HOME'})); triggerHaptic('light'); }}
                isHapticsEnabled={state.hapticsEnabled}
                onToggleHaptics={toggleHaptics}
            />
        )}
      </main>

      {showDeleteModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 p-6 animate-in fade-in duration-200">
          <div className="neu-flat p-6 w-full max-w-sm">
             <div className="w-12 h-12 rounded-full neu-pressed flex items-center justify-center mx-auto mb-4 text-red-500"><Activity size={24} className="rotate-45" /></div>
             <h3 className="text-xl font-bold text-center text-gray-800 dark:text-white mb-2">Delete All Data?</h3>
             <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">This action cannot be undone.</p>
             <div className="flex flex-col gap-3">
                 <button onClick={handleExportData} className="neu-btn w-full py-3">Export Backup</button>
                 <button onClick={confirmDelete} className="neu-btn w-full py-3 text-red-500 border-red-200">Yes, Delete</button>
                 <button onClick={() => { setShowDeleteModal(false); triggerHaptic('light'); }} className="w-full py-3 text-gray-500 font-medium">Cancel</button>
             </div>
          </div>
        </div>
      )}

      {(state.view !== 'LANDING' && state.view !== 'ONBOARDING' && state.view !== 'PIN') && (
        <>
          <nav className="absolute bottom-0 left-0 w-full neu-flat rounded-none rounded-t-3xl flex justify-between px-2 py-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 border-t-0">
            {[{view: 'HOME', icon: Home, label: 'Home'}, {view: 'CALENDAR', icon: Calendar, label: 'Calendar'}, {view: 'INSIGHTS', icon: BarChart2, label: 'Insights'}, {view: 'MINE', icon: User, label: 'Self Care'}].map(item => (
                <React.Fragment key={item.view}>
                    {item.view === 'INSIGHTS' && <div className="w-16" />}
                    <button onClick={() => { setState(s => ({...s, view: item.view as any})); triggerHaptic('light'); }} className={`flex-1 flex flex-col items-center gap-1 ${state.view === item.view ? 'text-[#E84C7C]' : 'text-gray-400'}`}>
                        {state.view === item.view ? 
                            <div className="neu-active p-2 rounded-xl"><item.icon size={20} /></div> : 
                            <item.icon size={20} />
                        }
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                </React.Fragment>
            ))}
          </nav>
          <div className="absolute bottom-[calc(2.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50">
            <button onClick={() => { setState(s => ({...s, view: 'DAILY_LOG'})); triggerHaptic('medium'); }} className={`neu-btn-round w-16 h-16 bg-[#E84C7C] text-[#E84C7C] border-4 border-[#FFF0F3]`}>
              <PlusCircle size={32} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
