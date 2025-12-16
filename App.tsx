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
import Insights from './components/Insights'; // NEW IMPORT
import { Home, Calendar, PlusCircle, BarChart2, Settings as SettingsIcon, Plus, User } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns';
import { getDayStatus, calculateWaterTarget } from './utils/calculations';

// Notification Logic
import { syncProfileToIDB, getLastNotification, logNotificationSent } from './utils/db';
import { triggerLocalNotification, checkPeriodicNotifications, checkMoodTrigger } from './utils/scheduler';

// --- STORAGE CONSTANTS ---
const USER_KEY_PREFIX = 'KIMI_USER_';
const LOGS_KEY_PREFIX = 'KIMI_LOGS_';
const LEGACY_PROFILE_KEY_PREFIX = 'KIMI_PROFILE_';

// Interface for imported backup data
interface BackupData {
    profiles?: Record<string, ProfileData>;
    activeProfileId?: string;
    user?: UserProfile;
    cycle?: CycleData;
    logs?: Record<string, DailyLog>;
}

export default function App() {
  const [state, setState] = useState<AppState>({
    view: 'SPLASH',
    user: null,
    cycle: null,
    logs: {},
    profiles: {},
    activeProfileId: null,
    darkMode: false // Disabled for new single-theme system
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

  // Removed toggleDarkMode function as we are enforcing single theme

  const handleSplashComplete = () => {
    const hasAccount = localStorage.getItem(HAS_ACCOUNT_KEY);
    
    if (!hasAccount) {
      setState(s => ({ ...s, view: 'LANDING' }));
    } else {
      setState(s => ({ ...s, view: 'PIN' }));
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
    const userPayload = { user: data.user, cycle: data.cycle, reminders: data.reminders };
    localStorage.setItem(`${USER_KEY_PREFIX}${id}`, encryptData(userPayload, pin));
    localStorage.setItem(`${LOGS_KEY_PREFIX}${id}`, encryptData(data.logs, pin));
  };

  const persistAllProfiles = (profiles: Record<string, ProfileData>, activeId: string | null, pin: string) => {
    try {
      Object.keys(profiles).forEach(id => {
        saveProfileDataToStorage(id, profiles[id], pin);
      });
      const indexData = { activeProfileId: activeId, profileIds: Object.keys(profiles), version: 3 };
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
      const indexData = decryptData(encryptedIndex, pin) as any;
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
                    profiles[id] = { user: userData.user, cycle: userData.cycle, reminders: userData.reminders, logs: logsData };
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
        } else if (ids.length > 0 && profiles[ids[0]]) activeId = ids[0];
        else if (indexData.user) {
             const userId = indexData.user.id || 'primary_user';
             const pmsData = indexData.user.pmsData || { stress: 5, sleep: 5, anxiety: 5, depression: 5, height: 165, weight: 65, bmi: 5, diet: 5 };
             profiles = { [userId]: { user: { ...indexData.user, id: userId, relationship: 'Self', pmsData }, cycle: indexData.cycle!, logs: indexData.logs || {} } };
             activeId = userId;
        }

        if (activeId && profiles[activeId]) {
            setLoginError(false);
            const activeData = profiles[activeId];
            setState(s => ({ ...s, view: 'HOME', profiles, activeProfileId: activeId, user: activeData.user, cycle: activeData.cycle, logs: activeData.logs }));
            checkLoginNotification();
        } else setLoginError(true);
      } else setLoginError(true);
    } else setLoginError(true);
  };

  const handleLogout = () => setState(s => ({ ...s, view: 'PIN', user: null, cycle: null, logs: {}, profiles: {}, activeProfileId: null }));
  
  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HAS_ACCOUNT_KEY);
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(USER_KEY_PREFIX) || key.startsWith(LOGS_KEY_PREFIX) || key.startsWith(LEGACY_PROFILE_KEY_PREFIX)) localStorage.removeItem(key);
    });
    setState({ view: 'LANDING', user: null, cycle: null, logs: {}, profiles: {}, activeProfileId: null, darkMode: false });
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
    setState(s => ({ ...s, view: 'HOME', profiles: newProfiles, activeProfileId: user.id, user: userToSave, cycle: cycle, logs: initialLogs }));
  };

  const switchProfile = (profileId: string) => {
      const target = state.profiles[profileId];
      if (target) {
          const pin = state.user?.pin || ''; 
          const indexData = { activeProfileId: profileId, profileIds: Object.keys(state.profiles), version: 3 };
          localStorage.setItem(STORAGE_KEY, encryptData(indexData, pin));
          setState(s => ({ ...s, activeProfileId: profileId, user: target.user, cycle: target.cycle, logs: target.logs, view: 'HOME' }));
      }
  };

  const handleDeleteProfile = (profileId: string) => {
    const currentProfiles = { ...state.profiles };
    const targetUser = currentProfiles[profileId].user;
    if (targetUser.relationship === 'Self') { alert("You cannot delete the main profile. Use 'Delete All Data' in the Danger Zone."); return; }
    if (!window.confirm(`Delete ${targetUser.name}'s profile?`)) return;

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
    setState(prev => ({ ...prev, profiles: currentProfiles, activeProfileId: nextActiveId, user: nextActiveData.user, cycle: nextActiveData.cycle, logs: nextActiveData.logs }));
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
    const dataStr = JSON.stringify({ profiles: state.profiles, activeProfileId: state.activeProfileId, version: 3 }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `kimi_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);
        // Cast to any first, then to BackupData to avoid 'unknown' errors
        const data = raw as any as BackupData;

        if (!data) return;
        let importedProfiles: Record<string, ProfileData> = {};
        let activeId = '';
        
        if (data.profiles) { 
            importedProfiles = data.profiles; 
            activeId = data.activeProfileId || ''; 
        } else if (data.user && data.cycle) {
             const uid = data.user.id || 'imported_user';
             importedProfiles = { [uid]: { user: { ...data.user, id: uid }, cycle: data.cycle, logs: data.logs || {} } };
             activeId = uid;
        }

        if (Object.keys(importedProfiles).length > 0) {
            // Explicitly cast to array of ProfileData to fix 'unknown' type errors
            const profilesArray = Object.values(importedProfiles) as any as ProfileData[];
            const primary = profilesArray.find((p) => p.user?.relationship === 'Self');
            
            persistAllProfiles(importedProfiles, activeId, primary?.user?.pin || '0000');
            
            const activeData = importedProfiles[activeId] as ProfileData | undefined;
            if (activeData) {
                setState(s => ({ 
                    ...s, 
                    view: 'HOME', 
                    profiles: importedProfiles, 
                    activeProfileId: activeId, 
                    user: activeData.user, 
                    cycle: activeData.cycle, 
                    logs: activeData.logs || {} 
                }));
                alert('Data imported successfully!');
            } else {
                 // Fallback if activeId is invalid
                 const firstId = Object.keys(importedProfiles)[0];
                 const firstData = importedProfiles[firstId] as ProfileData;
                 setState(s => ({ 
                    ...s, 
                    view: 'HOME', 
                    profiles: importedProfiles, 
                    activeProfileId: firstId, 
                    user: firstData.user, 
                    cycle: firstData.cycle, 
                    logs: firstData.logs || {} 
                }));
                alert('Data imported successfully!');
            }
        } else alert('Invalid file format.');
      } catch (err) { console.error(err); alert('Failed to import data.'); }
    };
    reader.readAsText(file);
  };

  const confirmDelete = () => { handleReset(); window.location.reload(); };
  const handleTestNotification = () => { triggerLocalNotification("KIMI Test", "Notifications working!", "test"); };

  // --- RENDERERS ---
  if (state.view === 'SPLASH') return <SplashScreen onComplete={handleSplashComplete} />;
  if (state.view === 'BOOT') return <div className="min-h-screen bg-[var(--nm-bg)]" />;
  
  const renderCalendar = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    const weekDays = ['S','M','T','W','T','F','S'];

    return (
      <div className="p-4 pt-10 h-full overflow-y-auto pb-32">
        <div className="flex justify-between items-center mb-6 px-2">
           <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="nm-icon-btn w-10 h-10 font-bold text-[var(--nm-text)]">&lt;</button>
           <h2 className="text-xl font-bold text-[var(--nm-text)]">{format(currentDate, 'MMMM yyyy')}</h2>
           <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="nm-icon-btn w-10 h-10 font-bold text-[var(--nm-text)]">&gt;</button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(d => <div key={d} className="text-center text-[var(--nm-text-muted)] text-sm font-medium">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-y-4 gap-x-2">
           {days.map(day => {
             let status = state.cycle ? getDayStatus(day, state.cycle, state.user || undefined) : 'none';
             if (state.logs[format(day, 'yyyy-MM-dd')]?.flow) status = 'period_past';

             // Custom neumorphic states for calendar days
             let dayClass = 'nm-btn bg-transparent shadow-none border-none'; // Default flat
             let textClass = 'text-[var(--nm-text)]';
             
             if (status === 'period') { dayClass = 'nm-inset !shadow-[var(--nm-shadow-in-sm)] text-[#E84C7C] font-bold'; }
             else if (status === 'ovulation') { dayClass = 'nm-inset !shadow-[var(--nm-shadow-in-sm)] text-[#7B86CB] font-bold'; }
             else if (status === 'fertile') { textClass = 'text-[#E84C7C]'; }
             else if (status === 'period_past') { dayClass = 'nm-inset opacity-50 text-[#E84C7C]'; }

             if (isToday(day)) {
                 dayClass += ' border border-[#E84C7C]';
             }

             return (
               <div key={day.toString()} className="flex flex-col items-center">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${dayClass} ${textClass}`}>
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
    return (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar pb-32">
        <header className="p-6 pb-2 pt-12 flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-[var(--nm-text)]">Hello, {state.user?.name}</h1>
                <p className="text-[var(--nm-text-muted)] text-sm">{state.user?.relationship === 'Self' ? 'Tracking for You' : `Tracking for ${state.user?.name}`}</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex -space-x-3 items-center">
                    {(Object.values(state.profiles) as ProfileData[]).map(p => (
                        <button 
                            key={p.user.id}
                            onClick={() => switchProfile(p.user.id)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 z-10 ${state.activeProfileId === p.user.id ? 'nm-inset text-[var(--nm-primary)] border border-[var(--nm-primary)]' : 'nm-btn opacity-70'}`}
                        >
                            {p.user.name.charAt(0).toUpperCase()}
                        </button>
                    ))}
                    <button onClick={() => setState(s => ({...s, view: 'ONBOARDING'}))} className="nm-icon-btn w-10 h-10 z-0">
                        <Plus size={16} />
                    </button>
                </div>
                <button onClick={() => setState(s => ({...s, view: 'SETTINGS'}))} className="nm-icon-btn w-10 h-10">
                    <SettingsIcon size={20} />
                </button>
            </div>
        </header>
        {state.cycle && <BubbleDashboard cycleData={state.cycle} user={state.user} />}
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
    return <DailyLogView log={log} onSave={saveLog} onClose={() => setState(s => ({...s, view: 'HOME'}))} />;
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
    <div className={`max-w-md mx-auto bg-[var(--nm-bg)] h-[100dvh] relative shadow-2xl overflow-hidden flex flex-col`}>
      <main className="flex-1 overflow-hidden relative">
        {state.view === 'HOME' && renderHome()}
        {state.view === 'CALENDAR' && renderCalendar()}
        {state.view === 'DAILY_LOG' && renderDailyLog()}
        {/* Updated Insights Renderer */}
        {state.view === 'INSIGHTS' && <Insights logs={state.logs} cycle={state.cycle} user={state.user} />}
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
                isDarkMode={false}
                onToggleDarkMode={() => {}}
                onLogout={handleLogout}
                onAddProfile={() => setState(s => ({ ...s, view: 'ONBOARDING' }))}
                onTestNotification={handleTestNotification}
                onClose={() => setState(s => ({...s, view: 'HOME'}))}
            />
        )}
      </main>

      {/* Navigation Bar - Neumorphic */}
      {(state.view !== 'LANDING' && state.view !== 'ONBOARDING' && state.view !== 'PIN') && (
        <>
          <nav className="absolute bottom-0 left-0 w-full bg-[var(--nm-surface)] rounded-t-[2rem] shadow-[var(--nm-shadow-out)] flex justify-between px-2 py-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-50">
            {[{view: 'HOME', icon: Home, label: 'Home'}, {view: 'CALENDAR', icon: Calendar, label: 'Calendar'}, {view: 'INSIGHTS', icon: BarChart2, label: 'Insights'}, {view: 'MINE', icon: User, label: 'Mine'}].map(item => (
                <React.Fragment key={item.view}>
                    {item.view === 'INSIGHTS' && <div className="w-16" />}
                    <button onClick={() => setState(s => ({...s, view: item.view as any}))} className={`flex-1 flex flex-col items-center gap-1 transition-colors ${state.view === item.view ? 'text-[var(--nm-primary)]' : 'text-[var(--nm-text-muted)]'}`}>
                        <item.icon size={22} className={state.view === item.view ? 'drop-shadow-sm' : ''} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                </React.Fragment>
            ))}
          </nav>
          {/* FAB - Neumorphic */}
          <div className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50">
            <button onClick={() => setState(s => ({...s, view: 'DAILY_LOG'}))} className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-95 nm-fab`}>
              <PlusCircle size={28} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}