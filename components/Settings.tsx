import React, { useRef, useState, useEffect } from 'react';
import { Bell, Moon, Shield, Download, Upload, Trash2, ChevronRight, Lock, Sun, LogOut, UserPlus, Clock, ArrowLeft, X, Check, Calendar, Zap, Plus } from 'lucide-react';
import { UserProfile, ReminderConfig } from '../types';
import ScrollPicker from './ScrollPicker';

interface SettingsProps {
  profiles: UserProfile[];
  onDeleteProfile: (id: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onDeleteData: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onAddProfile: () => void;
  onTestNotification: () => void;
  onClose?: () => void;
  isHapticsEnabled?: boolean;
  onToggleHaptics?: () => void;
}

const DEFAULT_REMINDERS: ReminderConfig[] = [
    { id: '1', label: 'Period starts', time: '12:00', isEnabled: true, category: 'Period & fertility', selectedDays: [0,1,2,3,4,5,6] },
    { id: '2', label: 'Period ends', time: '20:00', isEnabled: true, category: 'Period & fertility', selectedDays: [0,1,2,3,4,5,6] },
    { id: '3', label: 'Fertility is coming', time: '12:00', isEnabled: true, category: 'Period & fertility', selectedDays: [0,1,2,3,4,5,6] },
    { id: '4', label: 'Ovulation day', time: '12:00', isEnabled: true, category: 'Period & fertility', selectedDays: [0,1,2,3,4,5,6] },
    { id: '5', label: 'Input period', time: '12:00', isEnabled: true, category: 'Period & fertility', selectedDays: [0,1,2,3,4,5,6] },
    { id: '6', label: 'Pill', time: '11:58', isEnabled: true, category: 'Medicine', selectedDays: [0,1,2,3,4,5,6] },
    { id: '7', label: 'Wake up reminder', time: '11:47', isEnabled: true, category: 'Lifestyle', selectedDays: [0,1,2,3,4,5,6] },
    { id: '8', label: 'Daily log', time: '11:56', isEnabled: true, category: 'Lifestyle', selectedDays: [0,1,2,3,4,5,6] },
    { id: '9', label: 'Breast self-exam', time: '09:00', isEnabled: false, category: 'Lifestyle', selectedDays: [0] },
    { id: '10', label: 'Drink water reminder', time: '10:00', isEnabled: false, category: 'Lifestyle', selectedDays: [0,1,2,3,4,5,6] },
    { id: '11', label: 'Meditation', time: '20:00', isEnabled: false, category: 'Lifestyle', selectedDays: [0,1,2,3,4,5,6] },
    { id: '12', label: 'Gym Workout', time: '18:00', isEnabled: false, category: 'Exercise', selectedDays: [1,3,5] },
    { id: '13', label: 'PMS relief YOGA', time: '19:00', isEnabled: false, category: 'Exercise', selectedDays: [0,1,2,3,4,5,6] }
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ReminderEditor = ({ 
    config, 
    onSave, 
    onCancel 
}: { 
    config: ReminderConfig, 
    onSave: (label: string, time: string, days: number[]) => void, 
    onCancel: () => void 
}) => {
    const [hours, minutes] = config.time.split(':').map(Number);
    const [selectedH, setSelectedH] = useState(hours || 9);
    const [selectedM, setSelectedM] = useState(minutes || 0);
    const [selectedDays, setSelectedDays] = useState<number[]>(config.selectedDays || [0,1,2,3,4,5,6]);
    const [label, setLabel] = useState(config.label);

    const hoursRange = Array.from({length: 24}, (_, i) => i);
    const minutesRange = Array.from({length: 60}, (_, i) => i);

    const toggleDay = (dayIndex: number) => {
        if (selectedDays.includes(dayIndex)) {
            if (selectedDays.length > 1) {
                setSelectedDays(selectedDays.filter(d => d !== dayIndex));
            }
        } else {
            setSelectedDays([...selectedDays, dayIndex].sort());
        }
    };

    const handleSave = () => {
        const hStr = selectedH.toString().padStart(2, '0');
        const mStr = selectedM.toString().padStart(2, '0');
        onSave(label, `${hStr}:${mStr}`, selectedDays);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onCancel}>
            <div 
                className="neu-flat bg-white dark:bg-gray-800 w-full max-w-md p-6 pb-6 animate-in slide-in-from-bottom duration-300 relative"
                onClick={e => e.stopPropagation()}
                style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
            >
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                
                <div className="flex justify-between items-center mb-4 mt-2">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Edit Reminder</h3>
                    <button onClick={onCancel} className="neu-btn-round w-10 h-10">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-4 px-2">
                     <p className="text-sm font-bold text-[#E84C7C] mb-1">{config.category}</p>
                     <input 
                        type="text" 
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="text-2xl font-bold text-gray-800 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 w-full focus:outline-none focus:border-[#E84C7C] pb-1"
                        placeholder="Reminder Name"
                        autoFocus
                     />
                </div>

                <div className="neu-pressed flex items-center justify-center gap-4 mb-6 p-4">
                    <div className="flex flex-col items-center">
                        <div className="h-[100px] w-[60px] relative">
                            <ScrollPicker 
                                items={hoursRange}
                                value={selectedH}
                                onChange={setSelectedH}
                                formatLabel={(h) => h.toString().padStart(2, '0')}
                                height={100}
                                itemHeight={34}
                                highlightClass="neu-active rounded-lg"
                            />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 mt-2">Hour</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-300 pb-6">:</span>
                    <div className="flex flex-col items-center">
                        <div className="h-[100px] w-[60px] relative">
                            <ScrollPicker 
                                items={minutesRange}
                                value={selectedM}
                                onChange={setSelectedM}
                                formatLabel={(m) => m.toString().padStart(2, '0')}
                                height={100}
                                itemHeight={34}
                                highlightClass="neu-active rounded-lg"
                            />
                        </div>
                         <span className="text-[10px] uppercase font-bold text-gray-400 mt-2">Min</span>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 mb-4 px-2">
                        <Calendar size={16} /> Repeat On
                    </label>
                    <div className="flex justify-between">
                        {DAYS_OF_WEEK.map((day, idx) => {
                            const isSelected = selectedDays.includes(idx);
                            return (
                                <button
                                    key={day}
                                    onClick={() => toggleDay(idx)}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                        isSelected 
                                        ? 'neu-active scale-110' 
                                        : 'neu-pressed text-gray-400'
                                    }`}
                                >
                                    {day.charAt(0)}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-3">
                        {selectedDays.length === 7 ? 'Repeats Every Day' : selectedDays.length === 0 ? 'Never' : 'Custom Schedule'}
                    </p>
                </div>

                <button 
                    onClick={handleSave}
                    className="neu-btn w-full py-3 flex items-center justify-center gap-2"
                >
                    <Check size={20} /> Save Changes
                </button>
            </div>
        </div>
    );
};


const Settings: React.FC<SettingsProps> = ({ 
  profiles,
  onDeleteProfile,
  onExport, 
  onImport, 
  onDeleteData, 
  isDarkMode, 
  onToggleDarkMode,
  onLogout,
  onAddProfile,
  onTestNotification,
  onClose,
  isHapticsEnabled,
  onToggleHaptics
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'MAIN' | 'REMINDERS'>('MAIN');
  const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null);
  
  const [reminders, setReminders] = useState<ReminderConfig[]>(() => {
      const saved = localStorage.getItem('KIMI_REMINDERS');
      return saved ? JSON.parse(saved) : DEFAULT_REMINDERS;
  });

  // Migration Effect: Updates old labels in existing localStorage data to new names
  useEffect(() => {
    setReminders(prev => prev.map(r => {
        if (r.id === '12' && r.label === 'Kegel exercise') return { ...r, label: 'Gym Workout' };
        if (r.id === '13' && r.label === 'PMS relief flow') return { ...r, label: 'PMS relief YOGA' };
        return r;
    }));
  }, []);

  useEffect(() => {
      localStorage.setItem('KIMI_REMINDERS', JSON.stringify(reminders));
  }, [reminders]);

  const toggleReminder = (id: string) => {
      setReminders(prev => prev.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
  };

  const deleteReminder = (id: string) => {
      if (window.confirm("Delete this reminder?")) {
        setReminders(prev => prev.filter(r => r.id !== id));
      }
  };

  const saveReminderChanges = (label: string, time: string, days: number[]) => {
      if (editingReminder) {
          setReminders(prev => {
              const exists = prev.some(r => r.id === editingReminder.id);
              if (exists) {
                  return prev.map(r => r.id === editingReminder.id ? { 
                      ...r, 
                      label,
                      time, 
                      selectedDays: days 
                  } : r);
              } else {
                  return [...prev, { ...editingReminder, label, time, selectedDays: days }];
              }
          });
          setEditingReminder(null);
      }
  };

  const handleAddNew = (category: string) => {
    const newReminder: ReminderConfig = {
        id: Date.now().toString(),
        label: 'New Alert',
        time: '09:00',
        isEnabled: true,
        category: category as any,
        selectedDays: [0, 1, 2, 3, 4, 5, 6]
    };
    setEditingReminder(newReminder);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  const formatDaysSummary = (days?: number[]) => {
      if (!days || days.length === 7) return 'Every day';
      if (days.length === 0) return 'Never';
      const sorted = [...days].sort();
      return sorted.map(d => DAYS_OF_WEEK[d]).join(', ');
  };

  const ReminderView = () => (
      <div className="p-6 pb-32 animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('MAIN')} className="neu-btn-round w-10 h-10">
                  <ArrowLeft size={20} />
              </button>
              <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white">Reminders</h2>
          </div>

          {['Period & fertility', 'Medicine', 'Lifestyle', 'Exercise'].map(category => (
              <div key={category} className="mb-8">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">{category}</h3>
                  <div className="neu-flat p-2">
                      {reminders.filter(r => r.category === category).map((reminder, idx) => (
                          <div 
                            key={reminder.id} 
                            onClick={() => setEditingReminder(reminder)}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors mb-2 last:mb-0 group"
                          >
                              <div className="flex-1 mr-4">
                                  <div className="text-gray-800 dark:text-gray-200 font-medium mb-1">{reminder.label}</div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[#E84C7C] font-bold text-sm bg-pink-100 dark:bg-pink-900/30 px-2 py-0.5 rounded">{reminder.time}</span>
                                      <span className="text-gray-400 text-xs truncate max-w-[150px]">{formatDaysSummary(reminder.selectedDays)}</span>
                                  </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleReminder(reminder.id); }}
                                    className={`w-12 h-6 neu-pressed rounded-full relative transition-colors duration-300 ${reminder.isEnabled ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-transparent'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full shadow-sm transition-all duration-300 ${reminder.isEnabled ? 'left-7 neu-flat bg-[#E84C7C]' : 'left-1 bg-gray-400'}`} />
                                </button>
                                {/* Only show delete if it's not a default one, or we assume ID length > 2 for custom ones (since Date.now() is long) */}
                                {reminder.id.length > 5 && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); deleteReminder(reminder.id); }}
                                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                {reminder.id.length <= 5 && <ChevronRight size={16} className="text-gray-400" />}
                              </div>
                          </div>
                      ))}
                      
                      <div className="p-3 mt-2 flex items-center justify-center border-t border-gray-100 dark:border-gray-700/50">
                          <button 
                            onClick={() => handleAddNew(category)}
                            className="flex items-center gap-2 text-xs font-bold text-[#E84C7C] hover:scale-105 transition-transform"
                          >
                             <Plus size={14} /> Add new
                          </button>
                      </div>
                  </div>
              </div>
          ))}
      </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar pb-32 transition-colors duration-300">
      
      {editingReminder && (
          <ReminderEditor 
            config={editingReminder} 
            onSave={saveReminderChanges} 
            onCancel={() => setEditingReminder(null)} 
          />
      )}

      {view === 'REMINDERS' ? (
        <ReminderView />
      ) : (
        <div className="p-6">
            <header className="flex justify-between items-center mb-8 pt-4">
                <h1 className="text-3xl font-bold text-[#2D2D2D] dark:text-white">Settings</h1>
                {onClose ? (
                    <button onClick={onClose} className="neu-btn-round w-10 h-10">
                        <X size={20} />
                    </button>
                ) : (
                    <button className="neu-btn-round w-10 h-10">
                        <Bell size={20} />
                    </button>
                )}
            </header>

            {/* Profile Management */}
            <div className="neu-flat p-2 mb-6">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700/30">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Profiles</h3>
                </div>
                
                <div className="mb-2">
                    {profiles.map(user => (
                        <div key={user.id} className="p-3 mx-2 mt-2 rounded-xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.relationship === 'Self' ? 'neu-active' : 'neu-pressed'}`}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{user.name}</div>
                                    <div className="text-xs text-gray-400">{user.relationship}</div>
                                </div>
                            </div>
                            {user.relationship !== 'Self' && (
                                <button 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onDeleteProfile(user.id);
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button 
                    onClick={onAddProfile}
                    className="w-full p-4 flex items-center justify-between text-left border-t border-gray-100 dark:border-gray-700/30 text-gray-600 dark:text-gray-300 hover:text-[#E84C7C]"
                >
                    <div className="flex items-center gap-3">
                        <UserPlus size={18} />
                        <span className="text-sm font-medium">Add Another Profile</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                </button>
            </div>

            {/* Reminders Entry Point */}
            <div className="neu-flat p-1 mb-6">
                <button 
                    onClick={() => setView('REMINDERS')}
                    className="w-full p-4 flex items-center justify-between text-left rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <Clock size={18} />
                        <div>
                            <span className="text-sm font-medium block">Reminders</span>
                            <span className="text-xs text-gray-400">Pill, water, period start</span>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                </button>
            </div>

            {/* Privacy & Security */}
            <div className="neu-flat p-2 mb-6">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700/30 flex items-center gap-3">
                <Shield className="text-[#E84C7C]" size={20} />
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Privacy & Security</h3>
                </div>
                </div>
                
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <Lock size={18} />
                        <span className="text-sm font-medium">PIN Lock</span>
                    </div>
                    <div className="w-11 h-6 neu-pressed rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 neu-flat bg-[#E84C7C] rounded-full shadow-sm" />
                    </div>
                </div>

                <button 
                    onClick={onExport}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left rounded-xl"
                >
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <Download size={18} />
                        <span className="text-sm font-medium">Export Data</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                </button>

                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left rounded-xl"
                >
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <Upload size={18} />
                        <span className="text-sm font-medium">Import Data</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json" 
                    onChange={handleFileChange}
                />
            </div>

            {/* Preferences */}
            <div className="neu-flat p-4 mb-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 ml-1">Preferences</h3>
                
                <div 
                    className="flex items-center justify-between mb-6 cursor-pointer" 
                    onClick={onToggleDarkMode}
                >
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                    
                    <div className={`w-11 h-6 neu-pressed rounded-full relative transition-colors duration-300`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full shadow-sm transition-all duration-300 ${isDarkMode ? 'left-6 bg-[#E84C7C] neu-flat' : 'left-1 bg-gray-400'}`} />
                    </div>
                </div>

                {onToggleHaptics && (
                     <div 
                        className="flex items-center justify-between mb-6 cursor-pointer" 
                        onClick={onToggleHaptics}
                    >
                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                            <Zap size={18} className={isHapticsEnabled ? 'text-amber-400' : 'text-gray-400'} />
                            <span className="text-sm font-medium">Haptic Feedback</span>
                        </div>
                        
                        <div className={`w-11 h-6 neu-pressed rounded-full relative transition-colors duration-300`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full shadow-sm transition-all duration-300 ${isHapticsEnabled ? 'left-6 bg-[#E84C7C] neu-flat' : 'left-1 bg-gray-400'}`} />
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <Bell size={18} />
                        <span className="text-sm font-medium">Test Notification</span>
                    </div>
                    <button 
                        onClick={onTestNotification}
                        className="neu-btn px-4 py-1.5 text-xs rounded-full"
                    >
                        Send
                    </button>
                </div>
            </div>

            <button 
                onClick={onLogout}
                className="neu-btn w-full p-4 mb-8 flex items-center gap-3 text-gray-600 dark:text-gray-300"
            >
                <LogOut size={18} />
                <span className="font-medium">Log Out</span>
            </button>

            {/* Danger Zone */}
            <div className="neu-flat p-4 border border-red-100 dark:border-red-900/30 mt-auto">
                <h3 className="font-semibold text-red-500 mb-2">Danger Zone</h3>
                <p className="text-xs text-gray-500 mb-4">
                Deleting your data is permanent. Please export your data before proceeding.
                </p>
                <button 
                    onClick={onDeleteData}
                    className="neu-btn w-full py-3 text-red-500 border-red-100 flex items-center justify-center gap-2"
                >
                    <Trash2 size={18} />
                    Delete All Data
                </button>
            </div>
            
            <p className="text-center text-xs text-gray-400 mt-6 mb-2">v1.4</p>
        </div>
      )}
    </div>
  );
};

export default Settings;