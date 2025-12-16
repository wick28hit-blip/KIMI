
import React, { useRef, useState, useEffect } from 'react';
import { Bell, Moon, Shield, Download, Upload, Trash2, ChevronRight, Lock, Sun, LogOut, UserPlus, Clock, ArrowLeft, X, Check, Calendar, Plus } from 'lucide-react';
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

// Default reminders structure updated with new categories
const DEFAULT_REMINDERS: ReminderConfig[] = [
    { id: '1', label: 'Period starts', time: '12:00', isEnabled: true, category: 'Period & fertility', selectedDays: [0,1,2,3,4,5,6] },
    { id: '2', label: 'Period ends', time: '20:00', isEnabled: true, category: 'Period & fertility', selectedDays: [0,1,2,3,4,5,6] },
    { id: '3', label: 'Fertility is coming', time: '12:00', isEnabled: true, category: 'Period & fertility', selectedDays: [0,1,2,3,4,5,6] },
    { id: '4', label: 'Ovulation day', time: '12:00', isEnabled: true, category: 'Period & fertility', selectedDays: [0,1,2,3,4,5,6] },
    { id: '5', label: 'Input period', time: '12:00', isEnabled: true, category: 'Period & fertility', selectedDays: [0,1,2,3,4,5,6] },
    
    { id: '6', label: 'Pill', time: '11:58', isEnabled: true, category: 'Medicine', selectedDays: [0,1,2,3,4,5,6] },
    
    { id: '7', label: 'Wake up reminder', time: '11:47', isEnabled: true, category: 'Lifestyle', selectedDays: [0,1,2,3,4,5,6] },
    { id: '8', label: 'Daily log', time: '11:56', isEnabled: true, category: 'Lifestyle', selectedDays: [0,1,2,3,4,5,6] },
    { id: '9', label: 'Breast self-exam', time: '09:00', isEnabled: false, category: 'Lifestyle', selectedDays: [0] }, // Sunday
    { id: '10', label: 'Drink water reminder', time: '10:00', isEnabled: false, category: 'Lifestyle', selectedDays: [0,1,2,3,4,5,6] },
    { id: '11', label: 'Meditation', time: '20:00', isEnabled: false, category: 'Lifestyle', selectedDays: [0,1,2,3,4,5,6] },

    { id: '12', label: 'PMS relief flow', time: '19:00', isEnabled: false, category: 'Yoga', selectedDays: [0,1,2,3,4,5,6] },
    { id: '13', label: 'Kegel exercise', time: '18:00', isEnabled: false, category: 'Workout', selectedDays: [1,3,5] }
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// --- Helper Component: Unified Reminder Modal (Edit & Create) ---
interface ReminderModalProps {
    config?: ReminderConfig; // If present, editing mode
    newCategory?: string;    // If present, creating mode
    onSave: (label: string, time: string, days: number[]) => void;
    onCancel: () => void;
}

const ReminderModal = ({ config, newCategory, onSave, onCancel }: ReminderModalProps) => {
    const isEditing = !!config;
    
    // Initial State
    const [label, setLabel] = useState(config?.label || '');
    const initialTime = config?.time ? config.time.split(':').map(Number) : [8, 0];
    const [selectedH, setSelectedH] = useState(initialTime[0]);
    const [selectedM, setSelectedM] = useState(initialTime[1]);
    const [selectedDays, setSelectedDays] = useState<number[]>(config?.selectedDays || [0,1,2,3,4,5,6]);

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
        if (!label.trim()) return;
        const hStr = selectedH.toString().padStart(2, '0');
        const mStr = selectedM.toString().padStart(2, '0');
        onSave(label, `${hStr}:${mStr}`, selectedDays);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[var(--nm-text)]/20 backdrop-blur-sm animate-in fade-in" onClick={onCancel}>
            <div 
                className="bg-[var(--nm-bg)] w-full max-w-md rounded-t-[2.5rem] p-6 pb-8 animate-in slide-in-from-bottom duration-300 relative shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Handle */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[var(--nm-text-muted)]/20 rounded-full"></div>
                
                <div className="flex justify-between items-center mb-6 mt-2">
                    <h3 className="text-xl font-bold text-[var(--nm-text)]">
                        {isEditing ? 'Edit Reminder' : 'New Reminder'}
                    </h3>
                    <button onClick={onCancel} className="nm-icon-btn w-8 h-8">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-6">
                     <p className="text-xs font-bold text-[var(--nm-primary)] uppercase tracking-wider mb-2">
                        {isEditing ? config.category : newCategory}
                     </p>
                     
                     {isEditing ? (
                         <h2 className="text-2xl font-bold text-[var(--nm-text)]">{label}</h2>
                     ) : (
                         <div className="nm-inset p-3 transition-colors">
                             <input 
                                type="text" 
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="Enter reminder name..."
                                className="w-full bg-transparent text-xl font-bold text-[var(--nm-text)] outline-none placeholder-[var(--nm-text-muted)]/50"
                                autoFocus
                             />
                         </div>
                     )}
                </div>

                {/* Time Picker */}
                <div className="flex items-center justify-center gap-4 mb-8 nm-inset p-4">
                    <div className="flex flex-col items-center">
                        <div className="h-[120px] w-[60px] relative">
                            <ScrollPicker 
                                items={hoursRange}
                                value={selectedH}
                                onChange={setSelectedH}
                                formatLabel={(h) => h.toString().padStart(2, '0')}
                                height={120}
                                itemHeight={40}
                                highlightClass="bg-[var(--nm-primary)]/10 rounded-lg"
                                selectedItemClass="text-[var(--nm-primary)] font-bold text-2xl scale-110"
                                itemClass="text-[var(--nm-text-muted)] text-lg opacity-40 scale-90"
                            />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-[var(--nm-text-muted)] mt-2">Hour</span>
                    </div>
                    <span className="text-2xl font-bold text-[var(--nm-text-muted)] pb-6">:</span>
                    <div className="flex flex-col items-center">
                        <div className="h-[120px] w-[60px] relative">
                            <ScrollPicker 
                                items={minutesRange}
                                value={selectedM}
                                onChange={setSelectedM}
                                formatLabel={(m) => m.toString().padStart(2, '0')}
                                height={120}
                                itemHeight={40}
                                highlightClass="bg-[var(--nm-primary)]/10 rounded-lg"
                                selectedItemClass="text-[var(--nm-primary)] font-bold text-2xl scale-110"
                                itemClass="text-[var(--nm-text-muted)] text-lg opacity-40 scale-90"
                            />
                        </div>
                         <span className="text-[10px] uppercase font-bold text-[var(--nm-text-muted)] mt-2">Min</span>
                    </div>
                </div>

                {/* Day Picker */}
                <div className="mb-8">
                    <label className="flex items-center gap-2 text-sm font-bold text-[var(--nm-text)] mb-4">
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
                                        ? 'nm-inset text-[var(--nm-primary)] scale-105 border border-[var(--nm-primary)]' 
                                        : 'nm-btn text-[var(--nm-text-muted)]'
                                    }`}
                                >
                                    {day.charAt(0)}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-center text-xs text-[var(--nm-text-muted)] mt-3">
                        {selectedDays.length === 7 ? 'Repeats Every Day' : selectedDays.length === 0 ? 'Never' : 'Custom Schedule'}
                    </p>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={!label.trim()}
                    className="nm-btn-primary w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Check size={20} /> {isEditing ? 'Save Changes' : 'Create Reminder'}
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
  
  // Modal State
  const [modalConfig, setModalConfig] = useState<{
      type: 'EDIT' | 'CREATE';
      config?: ReminderConfig;
      newCategory?: string;
  } | null>(null);
  
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

  const handleSaveReminder = (label: string, time: string, days: number[]) => {
      if (modalConfig?.type === 'EDIT' && modalConfig.config) {
          // Edit Mode
          setReminders(prev => prev.map(r => r.id === modalConfig.config!.id ? { 
              ...r, 
              // Note: We don't update label in edit mode to preserve consistency with default IDs, 
              // but for user-created ones we could. For simplicity, editing time/days is prioritized.
              time, 
              selectedDays: days 
          } : r));
      } else if (modalConfig?.type === 'CREATE' && modalConfig.newCategory) {
          // Create Mode
          const newReminder: ReminderConfig = {
              id: Date.now().toString(),
              label,
              time,
              isEnabled: true,
              category: modalConfig.newCategory as any,
              selectedDays: days
          };
          setReminders(prev => [...prev, newReminder]);
      }
      setModalConfig(null);
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
              <button onClick={() => setView('MAIN')} className="nm-icon-btn w-10 h-10">
                  <ArrowLeft size={24} className="text-[var(--nm-text)]" />
              </button>
              <h2 className="text-2xl font-bold text-[var(--nm-text)]">Reminders</h2>
          </div>

          {['Period & fertility', 'Medicine', 'Lifestyle', 'Yoga', 'Workout'].map(category => (
              <div key={category} className="mb-8">
                  <h3 className="text-lg font-medium text-[var(--nm-text-muted)] mb-3 px-1">{category}</h3>
                  <div className="nm-card overflow-hidden">
                      {reminders.filter(r => r.category === category).map((reminder, idx, arr) => (
                          <div 
                            key={reminder.id} 
                            onClick={() => setModalConfig({ type: 'EDIT', config: reminder })}
                            className={`p-4 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform ${idx !== arr.length - 1 ? 'border-b border-white/40' : ''}`}
                          >
                              <div className="flex-1 mr-4">
                                  <div className="text-[var(--nm-text)] font-medium mb-1">{reminder.label}</div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[var(--nm-primary)] font-bold text-sm bg-[var(--nm-primary)]/10 px-2 py-0.5 rounded">{reminder.time}</span>
                                      <span className="text-[var(--nm-text-muted)] text-xs truncate max-w-[150px]">{formatDaysSummary(reminder.selectedDays)}</span>
                                  </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleReminder(reminder.id); }}
                                    className={`w-12 h-7 rounded-full relative transition-colors duration-300 shadow-inner ${reminder.isEnabled ? 'bg-[var(--nm-primary)]' : 'bg-[var(--nm-text-muted)]/30'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${reminder.isEnabled ? 'left-6' : 'left-1'}`} />
                                </button>
                                <ChevronRight size={16} className="text-[var(--nm-text-muted)]" />
                              </div>
                          </div>
                      ))}
                      {/* Add Button */}
                      <div 
                        onClick={() => setModalConfig({ type: 'CREATE', newCategory: category })}
                        className="p-4 flex items-center justify-between border-t border-white/40 bg-[var(--nm-text-muted)]/5 hover:bg-[var(--nm-text-muted)]/10 transition-colors cursor-pointer"
                      >
                          <span className="text-[var(--nm-text-muted)] font-medium text-sm">Add new {category.toLowerCase()} reminder</span>
                          <div className="w-6 h-6 rounded-full nm-inset text-[var(--nm-text-muted)] flex items-center justify-center">
                              <Plus size={14} />
                          </div>
                      </div>
                  </div>
              </div>
          ))}
      </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar pb-32">
      
      {/* Modal Overlay for Editing/Creating */}
      {modalConfig && (
          <ReminderModal 
            config={modalConfig.config}
            newCategory={modalConfig.newCategory}
            onSave={handleSaveReminder} 
            onCancel={() => setModalConfig(null)} 
          />
      )}

      {view === 'REMINDERS' ? (
        <ReminderView />
      ) : (
        <div className="p-6">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-[var(--nm-text)]">Settings</h1>
                {onClose ? (
                    <button onClick={onClose} className="nm-icon-btn w-10 h-10">
                        <X size={20} />
                    </button>
                ) : (
                    <button className="nm-icon-btn w-10 h-10">
                        <Bell size={20} />
                    </button>
                )}
            </header>

            {/* Profile Management */}
            <div className="nm-card p-2 mb-6">
                <div className="p-4 border-b border-white/40">
                    <h3 className="font-semibold text-[var(--nm-text)]">Profile Management</h3>
                </div>
                
                <div className="divide-y divide-white/40">
                    {profiles.map(user => (
                        <div key={user.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold nm-inset ${user.relationship === 'Self' ? 'text-[var(--nm-primary)]' : 'text-[var(--nm-text-muted)]'}`}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-[var(--nm-text)]">{user.name}</div>
                                    <div className="text-xs text-[var(--nm-text-muted)]">{user.relationship}</div>
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
                                    className="p-2 text-[var(--nm-text-muted)] hover:text-red-500 rounded-lg transition-colors z-10 relative"
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
                    className="w-full p-4 flex items-center justify-between hover:bg-white/20 transition-colors text-left border-t border-white/40 rounded-b-xl"
                >
                    <div className="flex items-center gap-3 text-[var(--nm-text)]">
                    <UserPlus size={18} />
                    <span className="text-sm font-medium">Add Another Profile</span>
                    </div>
                    <ChevronRight size={16} className="text-[var(--nm-text-muted)]" />
                </button>
            </div>

            {/* Reminders Entry Point */}
            <div className="nm-card p-2 mb-6">
                <button 
                    onClick={() => setView('REMINDERS')}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/20 transition-colors text-left rounded-xl"
                >
                    <div className="flex items-center gap-3 text-[var(--nm-text)]">
                        <Clock size={18} />
                        <div>
                            <span className="text-sm font-medium block">Reminders</span>
                            <span className="text-xs text-[var(--nm-text-muted)]">Pill, water, period start</span>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-[var(--nm-text-muted)]" />
                </button>
            </div>

            {/* Privacy & Security */}
            <div className="nm-card p-2 mb-6">
                <div className="p-4 border-b border-white/40 flex items-center gap-3">
                <Shield className="text-[var(--nm-primary)]" size={20} />
                <div className="flex-1">
                    <h3 className="font-semibold text-[var(--nm-text)]">Privacy & Security</h3>
                    <p className="text-xs text-[var(--nm-text-muted)]">Your data is stored locally and encrypted</p>
                </div>
                </div>
                
                <div className="p-4 flex items-center justify-between border-b border-white/40">
                <div className="flex items-center gap-3 text-[var(--nm-text)]">
                    <Lock size={18} />
                    <span className="text-sm font-medium">PIN Lock</span>
                </div>
                <div className="w-11 h-6 bg-[var(--nm-primary)] rounded-full relative shadow-inner">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
                </div>

                <button 
                onClick={onExport}
                className="w-full p-4 flex items-center justify-between hover:bg-white/20 transition-colors text-left border-b border-white/40"
                >
                <div className="flex items-center gap-3 text-[var(--nm-text)]">
                    <Download size={18} />
                    <span className="text-sm font-medium">Export Data</span>
                </div>
                <ChevronRight size={16} className="text-[var(--nm-text-muted)]" />
                </button>

                <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 flex items-center justify-between hover:bg-white/20 transition-colors text-left rounded-b-xl"
                >
                <div className="flex items-center gap-3 text-[var(--nm-text)]">
                    <Upload size={18} />
                    <span className="text-sm font-medium">Import Data</span>
                </div>
                <ChevronRight size={16} className="text-[var(--nm-text-muted)]" />
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
                <h3 className="font-semibold text-[var(--nm-text)] mb-4 ml-1">Preferences</h3>
                
                <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 text-[var(--nm-text)]">
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
                className="nm-card w-full p-4 mb-6 flex items-center gap-3 text-[var(--nm-text)] hover:bg-white/20 transition-colors"
            >
                <LogOut size={18} />
                <span className="font-medium">Log Out</span>
            </button>

            {/* Danger Zone */}
            <div className="border border-[var(--nm-danger)]/30 bg-[var(--nm-danger)]/5 rounded-2xl p-4 mt-auto">
                <h3 className="font-semibold text-[var(--nm-danger)] mb-2">Danger Zone</h3>
                <p className="text-xs text-[var(--nm-danger)]/80 mb-4">
                Deleting your data is permanent. Please export your data before proceeding.
                </p>
                <button 
                onClick={onDeleteData}
                className="w-full py-3 bg-[var(--nm-bg)] border border-[var(--nm-danger)]/50 text-[var(--nm-danger)] rounded-xl font-medium shadow-sm active:scale-95 flex items-center justify-center gap-2 transition-all"
                >
                <Trash2 size={18} />
                Delete All Data
                </button>
            </div>
            
            <p className="text-center text-xs text-[var(--nm-text-muted)] mt-6 mb-2">v1.4</p>
        </div>
      )}
    </div>
  );
};

export default Settings;
