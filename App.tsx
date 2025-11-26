import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Modal, StatusBar, StyleSheet, ActivityIndicator, Share, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, CycleData, AppState, DailyLog, CycleHistory } from './types';
import { STORAGE_KEY, HAS_ACCOUNT_KEY, encryptData, decryptData } from './utils/crypto';
import Onboarding from './components/Onboarding';
import PinLock from './components/PinLock';
import BubbleDashboard from './components/BubbleDashboard';
import Settings from './components/Settings';
import CalibrationPopup from './components/CalibrationPopup';
import { Home, Calendar as CalendarIcon, PlusCircle, BarChart2, Activity, Settings as SettingsIcon } from 'lucide-react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, parseISO } from 'date-fns';
import { getDayStatus, getLifestyleImpact, generateHistoricalCycles, generateRuleBasedInsights, recalibrateCycle } from './utils/calculations';

// Generic Theme Styles
const theme = {
  light: {
    bg: '#FFF0F3',
    card: '#FFFFFF',
    text: '#2D2D2D',
    subText: '#6B7280',
    nav: '#FFFFFF',
    border: '#E5E7EB'
  },
  dark: {
    bg: '#111827',
    card: '#1F2937',
    text: '#F3F4F6',
    subText: '#9CA3AF',
    nav: '#1F2937',
    border: '#374151'
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: 'BOOT',
    user: null,
    cycle: null,
    logs: {},
    darkMode: false
  });

  const [insight, setInsight] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loginError, setLoginError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);

  const colors = state.darkMode ? theme.dark : theme.light;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('KIMI_THEME');
      const isDark = storedTheme === 'dark';
      const hasAccount = await AsyncStorage.getItem(HAS_ACCOUNT_KEY);
      
      setState(s => ({ 
        ...s, 
        view: hasAccount ? 'PIN' : 'ONBOARDING', 
        darkMode: isDark 
      }));
    } catch (e) {
      console.error(e);
      setState(s => ({ ...s, view: 'ONBOARDING' }));
    }
  };

  const toggleDarkMode = async () => {
      const newMode = !state.darkMode;
      await AsyncStorage.setItem('KIMI_THEME', newMode ? 'dark' : 'light');
      setState(s => ({ ...s, darkMode: newMode }));
  };

  const handleLogin = async (pin: string) => {
    if (state.view === 'VAULT_PIN') {
       if (state.user && state.user.pin === pin) {
         setLoginError(false);
         setState(s => ({ ...s, view: 'SECRET_VAULT' }));
       } else {
         setLoginError(true);
       }
       return;
    }

    try {
        const encryptedData = await AsyncStorage.getItem(STORAGE_KEY);
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
           setLoginError(true);
        }
    } catch (e) {
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

  const handleReset = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(HAS_ACCOUNT_KEY);
    setState({
      view: 'ONBOARDING',
      user: null,
      cycle: null,
      logs: {},
      darkMode: state.darkMode
    });
  };

  const handleSignup = async (user: UserProfile, cycle: CycleData) => {
    const lifestyleOffset = getLifestyleImpact(user);
    const history = generateHistoricalCycles(
      parseISO(cycle.lastPeriodDate), 
      cycle.cycleLength, 
      cycle.periodDuration
    );

    const fullCycleData: CycleData = {
      ...cycle,
      lifestyleOffset,
      history,
      adaptiveWeight: 0,
      confidenceScore: 100,
      varianceOffset: 0
    };

    const newData = { user, cycle: fullCycleData, logs: {} };
    const encrypted = encryptData(newData, user.pin);
    
    await AsyncStorage.setItem(STORAGE_KEY, encrypted);
    await AsyncStorage.setItem(HAS_ACCOUNT_KEY, 'true');
    
    setState(s => ({
      ...s,
      view: 'HOME',
      user,
      cycle: fullCycleData,
      logs: {}
    }));
    
    setShowCalibration(true);
  };

  const saveState = async (newState: AppState) => {
    if (newState.user) {
      const encrypted = encryptData({ user: newState.user, cycle: newState.cycle, logs: newState.logs }, newState.user.pin);
      await AsyncStorage.setItem(STORAGE_KEY, encrypted);
    }
  };

  const handleConfirmCalibration = () => {
    if (!state.user || !state.cycle) return;
    const updatedHistory = state.cycle.history.map(h => ({ ...h, isConfirmed: true }));
    const updatedCycle = { ...state.cycle, history: updatedHistory };
    const newState = { ...state, cycle: updatedCycle };
    saveState(newState);
    setState(newState);
    setShowCalibration(false);
  };

  const handleSaveCalibration = (updatedHistory: CycleHistory[]) => {
    if (!state.user || !state.cycle) return;
    const confirmedHistory = updatedHistory.map(h => ({ ...h, isConfirmed: true }));
    const updatedCycle = { ...state.cycle, history: confirmedHistory };
    const newState = { ...state, cycle: updatedCycle };
    saveState(newState);
    setState(newState);
    setShowCalibration(false);
  };

  const saveLog = (log: DailyLog) => {
    const newLogs = { ...state.logs, [log.date]: log };
    const newState = { ...state, logs: newLogs };
    saveState(newState);
    setState(newState);
  };

  const handlePeriodStart = () => {
    if (!state.cycle) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const updatedCycle = recalibrateCycle(state.cycle, today);
    const newState = { ...state, cycle: updatedCycle };
    saveState(newState);
    setState(newState);
    Alert.alert("Period Logged", "Cycle predictions updated.");
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    const newState = { ...state, user: updatedUser };
    saveState(newState);
    setState(newState);
  };

  const handleExportData = () => {
     if (!state.user) return;
     const dataToExport = { user: state.user, cycle: state.cycle, logs: state.logs };
     const dataStr = JSON.stringify(dataToExport, null, 2);
     Share.share({ message: dataStr, title: 'KIMI Backup' });
  };

  const renderHome = () => (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={{ padding: 24, paddingTop: 60 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>Hello, {state.user?.name}</Text>
        <Text style={{ color: colors.subText }}>Today is {format(new Date(), 'EEEE, MMMM do')}</Text>
      </View>

      {state.cycle && <BubbleDashboard cycleData={state.cycle} isDarkMode={state.darkMode} />}

      <View style={{ padding: 24, alignItems: 'center' }}>
        <Text style={{ textAlign: 'center', color: colors.subText, fontSize: 12 }}>
          Your cycle is being tracked privately.{'\n'}Use the + button to log daily activity.
        </Text>
      </View>
    </ScrollView>
  );

  const renderCalendar = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    const weekDays = ['S','M','T','W','T','F','S'];

    return (
      <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: 60 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }}>
           <TouchableOpacity onPress={() => setCurrentDate(subMonths(currentDate, 1))}><Text style={{ fontSize: 24, color: '#E84C7C' }}>{'<'}</Text></TouchableOpacity>
           <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{format(currentDate, 'MMMM yyyy')}</Text>
           <TouchableOpacity onPress={() => setCurrentDate(addMonths(currentDate, 1))}><Text style={{ fontSize: 24, color: '#E84C7C' }}>{'>'}</Text></TouchableOpacity>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>
          {weekDays.map((d, i) => <Text key={i} style={{ color: '#9CA3AF', fontWeight: 'bold' }}>{d}</Text>)}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
           {days.map(day => {
             const status = state.cycle ? getDayStatus(day, state.cycle) : 'none';
             let bg = 'transparent';
             let text = colors.text;
             
             if (status === 'period') { bg = '#E84C7C'; text = 'white'; }
             else if (status === 'ovulation') { bg = '#7B86CB'; text = 'white'; }
             else if (status === 'fertile') { bg = state.darkMode ? '#831843' : '#FCE7F3'; text = '#E84C7C'; }
             else if (status === 'period_past') { bg = '#E84C7C'; text = 'white'; }

             return (
               <View key={day.toString()} style={{ width: '14.28%', alignItems: 'center', marginBottom: 10 }}>
                 <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: isToday(day) ? 1 : 0, borderColor: colors.text }}>
                   <Text style={{ color: text, fontWeight: '500' }}>{format(day, 'd')}</Text>
                 </View>
               </View>
             );
           })}
        </View>
      </View>
    );
  };

  const renderDailyLog = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const log = state.logs[today] || { date: today, waterIntake: 0, symptoms: [], medication: { taken: false, types: [] }, exercise: { performed: false }, intimacy: 'none' };
    
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
         <View style={{ padding: 24, paddingTop: 60, paddingBottom: 100 }}>
           <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 20 }}>Log Today</Text>
           
           {/* Period Start Button */}
           <TouchableOpacity 
             onPress={handlePeriodStart}
             style={{ backgroundColor: '#E84C7C', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24 }}
           >
             <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Period Started Today</Text>
           </TouchableOpacity>

           {/* Water */}
           <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>Water Intake</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#60A5FA' }}>{log.waterIntake}/8</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                 {[1,2,3,4,5,6,7,8].map(n => (
                    <TouchableOpacity 
                        key={n} 
                        onPress={() => saveLog({ ...log, waterIntake: n === log.waterIntake ? n - 1 : n })}
                        style={{ width: 40, height: 50, backgroundColor: n <= log.waterIntake ? '#60A5FA' : (state.darkMode ? '#1F2937' : '#EFF6FF'), borderRadius: 4, borderWidth: 1, borderColor: '#BFDBFE' }}
                    />
                 ))}
              </View>
           </View>

           {/* Save Button */}
           <TouchableOpacity 
              onPress={() => setState(s => ({ ...s, view: 'HOME' }))}
              style={{ backgroundColor: '#E84C7C', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 }}
           >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Save & Exit</Text>
           </TouchableOpacity>
         </View>
      </ScrollView>
    );
  };

  const renderInsights = () => {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const ruleInsight = state.cycle ? generateRuleBasedInsights(state.cycle, state.logs, today) : null;

      return (
        <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
            <View style={{ padding: 24, paddingTop: 60 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 20 }}>Insights</Text>
                
                {ruleInsight && (
                    <View style={{ backgroundColor: '#FCE7F3', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FBCFE8' }}>
                         <Text style={{ color: '#BE185D', fontWeight: 'bold' }}>Daily Tip</Text>
                         <Text style={{ color: '#831843', marginTop: 4 }}>{ruleInsight}</Text>
                    </View>
                )}

                <View style={{ backgroundColor: '#7B86CB', borderRadius: 16, padding: 20 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 10 }}>KIMI Advisor</Text>
                    <Text style={{ color: 'white', marginBottom: 20 }}>
                        {insight || "Your privacy-first insights appear here based on your logs."}
                    </Text>
                </View>
            </View>
        </ScrollView>
      );
  };

  // Main Render Switch
  if (state.view === 'BOOT') return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color="#E84C7C" /></View>;
  if (state.view === 'ONBOARDING') return <Onboarding onComplete={handleSignup} />;
  
  if (state.view === 'PIN' || state.view === 'VAULT_PIN') {
    return <PinLock onSuccess={handleLogin} expectedPin={state.user?.pin} onReset={state.view === 'PIN' ? handleReset : undefined} loginError={loginError} onClearLoginError={() => setLoginError(false)} isSetup={false} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={state.darkMode ? "light-content" : "dark-content"} />
      
      {state.view === 'HOME' && renderHome()}
      {state.view === 'CALENDAR' && renderCalendar()}
      {state.view === 'DAILY_LOG' && renderDailyLog()}
      {state.view === 'INSIGHTS' && renderInsights()}
      {(state.view === 'SETTINGS' || state.view === 'SECRET_VAULT') && (
        <Settings 
            onExport={handleExportData}
            onImport={() => Alert.alert("Not Implemented", "Requires DocumentPicker")}
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

      {/* Navigation */}
      {state.view !== 'SECRET_VAULT' && (
          <View style={[styles.navBar, { backgroundColor: colors.nav, borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={() => setState(s => ({...s, view: 'HOME'}))} style={{ alignItems: 'center' }}>
                <Home color={state.view === 'HOME' ? '#E84C7C' : '#9CA3AF'} size={24} />
                <Text style={{ fontSize: 10, color: state.view === 'HOME' ? '#E84C7C' : '#9CA3AF' }}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setState(s => ({...s, view: 'CALENDAR'}))} style={{ alignItems: 'center' }}>
                <CalendarIcon color={state.view === 'CALENDAR' ? '#E84C7C' : '#9CA3AF'} size={24} />
                <Text style={{ fontSize: 10, color: state.view === 'CALENDAR' ? '#E84C7C' : '#9CA3AF' }}>Calendar</Text>
            </TouchableOpacity>
            <View style={{ width: 40 }} />
            <TouchableOpacity onPress={() => setState(s => ({...s, view: 'INSIGHTS'}))} style={{ alignItems: 'center' }}>
                <BarChart2 color={state.view === 'INSIGHTS' ? '#E84C7C' : '#9CA3AF'} size={24} />
                <Text style={{ fontSize: 10, color: state.view === 'INSIGHTS' ? '#E84C7C' : '#9CA3AF' }}>Insights</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setState(s => ({...s, view: 'SETTINGS'}))} style={{ alignItems: 'center' }}>
                <SettingsIcon color={state.view === 'SETTINGS' ? '#E84C7C' : '#9CA3AF'} size={24} />
                <Text style={{ fontSize: 10, color: state.view === 'SETTINGS' ? '#E84C7C' : '#9CA3AF' }}>Settings</Text>
            </TouchableOpacity>
          </View>
      )}

      {/* FAB */}
      {state.view !== 'SECRET_VAULT' && (
          <TouchableOpacity onPress={() => setState(s => ({...s, view: 'DAILY_LOG'}))} style={styles.fab}>
            <PlusCircle color="white" size={30} />
          </TouchableOpacity>
      )}

      {/* Calibration Modal */}
      <Modal visible={showCalibration} transparent animationType="slide">
          <CalibrationPopup 
            history={state.cycle?.history || []} 
            onConfirm={handleConfirmCalibration}
            onSave={handleSaveCalibration}
          />
      </Modal>

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
             <View style={{ width: '80%', backgroundColor: colors.card, borderRadius: 16, padding: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>Delete Data?</Text>
                <Text style={{ color: colors.subText, marginBottom: 20 }}>This is permanent.</Text>
                <TouchableOpacity onPress={async () => {
                    await AsyncStorage.clear();
                    handleReset();
                    setShowDeleteModal(false);
                }} style={{ backgroundColor: 'red', padding: 12, borderRadius: 8, alignItems: 'center' }}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={{ padding: 12, alignItems: 'center', marginTop: 10 }}>
                    <Text style={{ color: colors.subText }}>Cancel</Text>
                </TouchableOpacity>
             </View>
          </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingBottom: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 10, borderTopWidth: 1 },
  fab: { position: 'absolute', bottom: 30, left: '50%', marginLeft: -28, width: 56, height: 56, borderRadius: 28, backgroundColor: '#E84C7C', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 },
});

export default App;
