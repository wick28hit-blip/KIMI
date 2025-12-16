import React, { useRef, useState, useEffect } from 'react';
import { Bell, Moon, Shield, Download, Upload, Trash2, ChevronRight, Lock, Sun, LogOut, UserPlus, Clock, ArrowLeft, X, Check, Calendar } from 'lucide-react';
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
}

// Default reminders structure (unchanged)
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

    { id: '12', label: 'Kegel exercise', time: '18:00', isEnabled: false, category: 'Exercise', selectedDays: [1,3,5] },
    { id: '13', label: 'PMS relief flow', time: '19:00', isEnabled: false, category: 'Exercise', selectedDays: [0,1,2,3,4,5,6] }
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// --- Helper Component: Reminder Editor Modal ---
const ReminderEditor = ({ 
    config, 
    onSave, 
    onCancel 
}: { 
    config: ReminderConfig, 
    onSave: (time: string, days: number[]) => void, 
    onCancel: () => void 
}) => {
    const [hours, minutes] = config.time.split(':').map(Number);
    const [selectedH, setSelectedH] = useState(hours);
    const [selectedM, setSelectedM] = useState(minutes);
    const [selectedDays, setSelectedDays] = useState<number[]>(config.selectedDays || [0,1,2,3,4,5,6]);

    const hoursRange = Array.from({length: 24}, (_, i) => i);
    const minutesRange = Array.from({length: 60}, (_, i) => i);

    const toggleDay = (dayIndex: number) => {
        if (selectedDays.includes(dayIndex)) {
            // Prevent deselecting all days (at least one day required)
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
        onSave(`${hStr}:${mStr}`, selectedDays);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onCancel}>
            <div 
                className="nm-card w-full max-w-md !rounded-b-none p-6 pb-8 animate-in slide-in-from-bottom duration-300 relative shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Handle */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                
                <div className="flex justify-between items-center mb-6 mt-2">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Edit Reminder</h3>
                    <button onClick={onCancel} className="nm-btn w-8 h-8 flex items-center justify-center text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-6">
                     <p className="text-sm font-bold text-[var(--nm-accent)] mb-1">{config.category}</p>
                     <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{config.label}</h2>
                </div>

                {/* Time Picker */}
                <div className="flex items-center justify-center gap-4 mb-8 nm-inset p-4 rounded-2xl">
                    <div className="flex flex-col items-center">
                        <div className="h-[120px] w-[60px] relative">
                            <ScrollPicker 
                                items={hoursRange}
                                value={selectedH}
                                onChange={setSelectedH}
                                formatLabel={(h) => h.toString().padStart(2, '0')}
                                height={120}
                                itemHeight={40}
                                highlightClass="bg-white/50 rounded-lg"
                                selectedItemClass="text-[var(--nm-accent)] font-bold text-2xl scale-110"
                                itemClass="text-gray-400 text-lg opacity-40 scale-90"
                            />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 mt-2">Hour</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-300 pb-6">:</span>
                    <div className="flex flex-col items-center">
                        <div className="h-[120px] w-[60px] relative">
                            <ScrollPicker 
                                items={minutesRange}
                                value={selectedM}
                                onChange={setSelectedM}
                                formatLabel={(m) => m.toString().padStart(2, '0')}
                                height={120}
                                itemHeight={40}
                                highlightClass="bg-white/50 rounded-lg"
                                selectedItemClass="text-[var(--nm-accent)] font-bold text-2xl scale-110"
                                itemClass="text-gray-400 text-lg opacity-40 scale-90"
                            />
                        </div>
                         <span className="text-[10px] uppercase font-bold text-gray-400 mt-2">Min</span>
                    </div>
                </div>

                {/* Day Picker */}
                <div className="mb-8">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 mb-4">
                        <Calendar size={16} /> Repeat On
                    </label>
                    <div className="flex justify-between">
                        {DAYS_OF_WEEK.map((day, idx) => {
                            const isSelected = selectedDays.includes(idx);
                            return (
                                <button
                                    key={day}
                                    onClick={() => toggleDay(idx)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                        isSelected 
                                        ? 'bg-[var(--nm-accent)] text-white shadow-lg scale-110' 
                                        : 'nm-btn text-gray-400'
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
                    className="w-full py-4 nm-btn-primary font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
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
  onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<'MAIN' | 'REMINDERS'>('MAIN');
  const [editingReminder, setEditingReminder] = useState<ReminderConfig | null>(null);
  
  // Local state for reminders
  const [reminders, setReminders] = useState<ReminderConfig[]>(() => {
      const saved = localStorage.getItem('KIMI_REMINDERS');
      return saved ? JSON.parse(saved) : DEFAULT_REMINDERS;
  });

  useEffect(() => {
      localStorage.setItem('KIMI_REMINDERS', JSON.stringify(reminders));
  }, [reminders]);

  const toggleReminder = (id: string) => {
      setReminders(prev => prev.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
  };

  const saveReminderChanges = (time: string, days: number[]) => {
      if (editingReminder) {
          setReminders(prev => prev.map(r => r.id === editingReminder.id ? { 
              ...r, 
              time, 
              selectedDays: days 
          } : r));
          setEditingReminder(null);
      }
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
      // Sort and map
      const sorted = [...days].sort();
      return sorted.map(d => DAYS_OF_WEEK[d]).join(', ');
  };

  const ReminderView = () => (
      <div className="p-6 pb-32 animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setView('MAIN')} className="nm-btn w-10 h-10 flex items-center justify-center">
                  <ArrowLeft size={24} className="text-[#2D2D2D] dark:text-white" />
              </button>
              <h2 className="text-2xl font-bold text-[#2D2D2D] dark:text-white">Reminders</h2>
          </div>

          {['Period & fertility', 'Medicine', 'Lifestyle', 'Exercise'].map(category => (
              <div key={category} className="mb-8">
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-3 px-1">{category}</h3>
                  <div className="nm-card overflow-hidden">
                      {reminders.filter(r => r.category === category).map((reminder, idx, arr) => (
                          <div 
                            key={reminder.id} 
                            onClick={() => setEditingReminder(reminder)}
                            className={`p-4 flex items-center justify-between cursor-pointer active:bg-white/10 transition-colors ${idx !== arr.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
                          >
                              <div className="flex-1 mr-4">
                                  <div className="text-gray-800 dark:text-white font-medium mb-1">{reminder.label}</div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[var(--nm-accent)] font-bold text-sm bg-pink-100 dark:bg-pink-900/30 px-2 py-0.5 rounded">{reminder.time}</span>
                                      <span className="text-gray-400 text-xs truncate max-w-[150px]">{formatDaysSummary(reminder.selectedDays)}</span>
                                  </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleReminder(reminder.id); }}
                                    className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${reminder.isEnabled ? 'bg-[var(--nm-accent)]' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${reminder.isEnabled ? 'left-6' : 'left-1'}`} />
                                </button>
                                <ChevronRight size={16} className="text-gray-400" />
                              </div>
                          </div>
                      ))}
                      {/* Placeholder Add Button */}
                      <div className="p-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 hover:bg-white/30 transition-colors cursor-pointer">
                          <span className="text-gray-400 font-medium text-sm">Add new {category.toLowerCase()} reminder</span>
                          <div className="w-6 h-6 rounded-full bg-[#7B86CB]/20 text-[#7B86CB] flex items-center justify-center">
                              <PlusIcon />
                          </div>
                      </div>
                  </div>
              </div>
          ))}
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto no-scrollbar pb-32 transition-colors duration-300">
      
      {/* Modal Overlay for Editing */}
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
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[#2D2D2D] dark:text-white">Settings</h1>
                {onClose ? (
                    <button onClick={onClose} className="nm-btn w-10 h-10 flex items-center justify-center text-gray-400">
                        <X size={20} />
                    </button>
                ) : (
                    <button className="nm-btn w-10 h-10 flex items-center justify-center text-gray-500">
                        <Bell size={20} />
                    </button>
                )}
            </header>

            {/* Profile Management */}
            <div className="nm-card p-2 mb-6">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Profile Management</h3>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {profiles.map(user => (
                        <div key={user.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${user.relationship === 'Self' ? 'bg-pink-100 text-[var(--nm-accent)]' : 'bg-gray-100 text-gray-500'}`}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{user.name}</div>
                                    <div className="text-xs text-gray-400">{user.relationship}</div>
                                </div>
                            </div>
                            {user.relationship !== 'Self' && (
                                <button 
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDeleteProfile(user.id);
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors z-10 relative"
                                    title="Delete Profile"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button 
                    onClick={onAddProfile}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/30 transition-colors text-left border-t border-gray-100 dark:border-gray-700"
                >
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <UserPlus size={18} />
                    <span className="text-sm font-medium">Add Another Profile</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                </button>
            </div>

            {/* Reminders Entry Point */}
            <div className="nm-card p-2 mb-6">
                <button 
                    onClick={() => setView('REMINDERS')}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/30 transition-colors text-left"
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
            <div className="nm-card p-2 mb-6">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <Shield className="text-[var(--nm-accent)]" size={20} />
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Privacy & Security</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Your data is stored locally and encrypted</p>
                </div>
                </div>
                
                <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <Lock size={18} />
                    <span className="text-sm font-medium">PIN Lock</span>
                </div>
                <div className="w-11 h-6 bg-[var(--nm-accent)] rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
                </div>

                <button 
                onClick={onExport}
                className="w-full p-4 flex items-center justify-between hover:bg-white/30 transition-colors text-left"
                >
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <Download size={18} />
                    <span className="text-sm font-medium">Export Data</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
                </button>

                <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 flex items-center justify-between hover:bg-white/30 transition-colors text-left"
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
            <div className="nm-card p-4 mb-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 ml-1">Preferences</h3>
                
                <div 
                className="flex items-center justify-between mb-6 cursor-pointer" 
                onClick={onToggleDarkMode}
                >
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
                
                {/* Toggle Switch */}
                <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-[var(--nm-accent)]' : 'bg-gray-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${isDarkMode ? 'left-6' : 'left-1'}`} />
                </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                    <Bell size={18} />
                    <span className="text-sm font-medium">Test Notification</span>
                </div>
                <button 
                    onClick={onTestNotification}
                    className="nm-btn text-xs px-3 py-1"
                >
                    Send
                </button>
                </div>
            </div>

            {/* Log Out Button */}
            <button 
                onClick={onLogout}
                className="w-full p-4 nm-card flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:bg-white/30 transition-colors mb-6"
            >
                <LogOut size={18} />
                <span className="font-medium">Log Out</span>
            </button>

            {/* Danger Zone */}
            <div className="border-2 border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 rounded-2xl p-4 mt-auto">
                <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">Danger Zone</h3>
                <p className="text-xs text-red-600 dark:text-red-400/80 mb-4">
                Deleting your data is permanent. Please export your data before proceeding.
                </p>
                <button 
                onClick={onDeleteData}
                className="w-full py-3 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-medium shadow-sm active:bg-red-50 dark:active:bg-red-900/20 flex items-center justify-center gap-2 transition-colors"
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

const PlusIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default Settings;