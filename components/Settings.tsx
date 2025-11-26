
import React, { useRef, useState } from 'react';
import { Bell, Moon, Shield, Download, Upload, Trash2, ChevronRight, Lock, Sun, LogOut, FileText, X, Info } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsProps {
  onExport: () => void;
  onImport: (file: File) => void;
  onDeleteData: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onOpenSecretVault: () => void;
  user?: UserProfile | null;
  onUpdateUser?: (user: UserProfile) => void;
  isVaultView?: boolean;
}

const Settings: React.FC<SettingsProps> = ({ 
  onExport, 
  onImport, 
  onDeleteData, 
  isDarkMode, 
  onToggleDarkMode,
  onLogout,
  onOpenSecretVault,
  user,
  onUpdateUser,
  isVaultView = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Vault Editing States
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  const handleSaveHabit = (key: string) => {
    if (user && onUpdateUser) {
        const updatedHabits = { ...user.habits };
        // @ts-ignore
        if (updatedHabits[key]) {
             // @ts-ignore
            updatedHabits[key] = { ...updatedHabits[key], frequency: tempValue };
        }
        onUpdateUser({ ...user, habits: updatedHabits });
        setEditingHabit(null);
    }
  };

  // --- SECRET VAULT VIEW ---
  if (isVaultView && user) {
    return (
        <div className="flex flex-col h-full bg-[#111827] text-white p-6 overflow-y-auto pb-32">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={onOpenSecretVault} className="p-2 bg-gray-800 rounded-full">
                    <ChevronRight className="rotate-180" />
                </button>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="text-[#E84C7C]" /> Secret Vault
                </h1>
            </header>

            <p className="text-gray-400 mb-6 text-sm">
                Your sensitive habit data is encrypted here. You can update details below.
            </p>

            <div className="space-y-4">
                {Object.entries(user.habits).map(([key, data]: [string, any]) => (
                    <div key={key} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="capitalize font-bold text-lg text-pink-400">{key}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${data.value ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                {data.value ? 'YES' : 'NO'}
                            </span>
                        </div>
                        
                        {data.value && (
                            <div className="mt-2">
                                {editingHabit === key ? (
                                    <div className="flex gap-2">
                                        <input 
                                            autoFocus
                                            type="text" 
                                            className="flex-1 bg-gray-900 border border-gray-600 rounded p-2 text-sm"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            placeholder="Frequency/Details..."
                                        />
                                        <button onClick={() => handleSaveHabit(key)} className="bg-green-600 p-2 rounded"><CheckIcon /></button>
                                        <button onClick={() => setEditingHabit(null)} className="bg-gray-700 p-2 rounded"><X size={16}/></button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center text-sm text-gray-300 bg-gray-900/50 p-2 rounded">
                                        <span>{data.frequency || data.amount || 'Not specified'}</span>
                                        <button 
                                            onClick={() => {
                                                setEditingHabit(key);
                                                setTempValue(data.frequency || data.amount || '');
                                            }}
                                            className="text-[#E84C7C] font-medium text-xs underline"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-900/50 rounded-xl">
                 <p className="text-yellow-500 text-xs">
                    🔒 This area is secured. Navigating away will lock it again.
                 </p>
            </div>
        </div>
    );
  }

  // --- STANDARD SETTINGS VIEW ---

  return (
    <div className="flex flex-col h-full bg-[#FFF0F3] dark:bg-gray-900 p-6 overflow-y-auto no-scrollbar pb-32 transition-colors duration-300">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#2D2D2D] dark:text-white">Settings</h1>
        <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-500 dark:text-gray-300">
          <Bell size={20} />
        </button>
      </header>

      {/* Secret Vault Entry */}
      <button 
        onClick={onOpenSecretVault}
        className="w-full bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-lg p-5 mb-6 flex items-center justify-between group active:scale-95 transition-all"
      >
         <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-700 rounded-full text-[#E84C7C] border border-gray-600">
                <Shield size={24} />
            </div>
            <div className="text-left">
                <h3 className="font-bold text-white text-lg group-hover:text-[#E84C7C] transition-colors">Secret Vault</h3>
                <p className="text-gray-400 text-xs">Encrypted Habits & Logs</p>
            </div>
         </div>
         <Lock className="text-gray-500 group-hover:text-white transition-colors" />
      </button>

      {/* Privacy & Security */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-2 mb-6 border border-pink-50 dark:border-gray-700 transition-colors">
        <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
          <FileText className="text-[#E84C7C]" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Data Management</h3>
          </div>
        </div>
        
        <button 
          onClick={onExport}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
        >
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <Download size={18} />
            <span className="text-sm font-medium">Export Data</span>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </button>

        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 mb-6 border border-pink-50 dark:border-gray-700 transition-colors">
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
          <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-[#E84C7C]' : 'bg-gray-200'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${isDarkMode ? 'left-6' : 'left-1'}`} />
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <Bell size={18} />
            <span className="text-sm font-medium">Notifications</span>
          </div>
          <div className="w-11 h-6 bg-[#E84C7C] rounded-full relative cursor-pointer">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
          </div>
        </div>
      </div>

      {/* Log Out Button */}
      <button 
        onClick={onLogout}
        className="w-full p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-6 border border-pink-50 dark:border-gray-700 flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <LogOut size={18} />
        <span className="font-medium">Log Out</span>
      </button>

      {/* Legal & Disclaimer */}
      <div className="mb-8 px-1">
         <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-wider ml-1">Legal & Privacy</h4>
         <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 border border-pink-50 dark:border-gray-700/50 text-xs text-gray-500 dark:text-gray-400 space-y-4">
            <div>
               <p className="font-bold text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1"><Info size={12}/> Medical Disclaimer</p>
               <p>KIMI is for tracking purposes only. Not a substitute for medical advice. Consult healthcare provider for concerns.</p>
            </div>
            <div>
               <p className="font-bold text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1"><Shield size={12}/> Privacy Policy</p>
               <p>All data stays on your device. KIMI never collects, transmits, or shares your personal information. You own your data completely.</p>
            </div>
         </div>
      </div>

      {/* Danger Zone */}
      <div className="border-2 border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 rounded-2xl p-4 mt-auto">
        <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">Danger Zone</h3>
        <p className="text-xs text-red-600 dark:text-red-400/80 mb-4">
          Deleting your data is permanent. Please export your data before proceeding so you can restore it later.
        </p>
        <button 
          onClick={onDeleteData}
          className="w-full py-3 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-medium shadow-sm active:bg-red-50 dark:active:bg-red-900/20 flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 size={18} />
          Delete All Data
        </button>
      </div>
    </div>
  );
};

// Helper Icon
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
)

export default Settings;
