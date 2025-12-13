import React, { useRef } from 'react';
import { Bell, Moon, Shield, Download, Upload, Trash2, ChevronRight, Lock, Sun, LogOut, UserPlus } from 'lucide-react';
import { UserProfile } from '../types';

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
}

const Settings: React.FC<SettingsProps> = ({ 
  profiles,
  onDeleteProfile,
  onExport, 
  onImport, 
  onDeleteData, 
  isDarkMode, 
  onToggleDarkMode,
  onLogout,
  onAddProfile
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FFF0F3] dark:bg-gray-900 overflow-y-auto no-scrollbar pb-32 transition-colors duration-300">
      <div className="p-6">
        <header className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#2D2D2D] dark:text-white">Settings</h1>
            <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-500 dark:text-gray-300">
            <Bell size={20} />
            </button>
        </header>

        {/* Profile Management */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-2 mb-6 border border-pink-50 dark:border-gray-700 transition-colors">
            <div className="p-4 border-b border-gray-50 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Profile Management</h3>
            </div>
            
            <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {profiles.map(user => (
                    <div key={user.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${user.relationship === 'Self' ? 'bg-pink-100 text-[#E84C7C]' : 'bg-gray-100 text-gray-500'}`}>
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
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left border-t border-gray-50 dark:border-gray-700"
            >
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <UserPlus size={18} />
                <span className="text-sm font-medium">Add Another Profile</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
            </button>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-2 mb-6 border border-pink-50 dark:border-gray-700 transition-colors">
            <div className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
            <Shield className="text-[#E84C7C]" size={20} />
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
            <div className="w-11 h-6 bg-[#E84C7C] rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
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
            {/* Mock Toggle - Active */}
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
        
        <p className="text-center text-xs text-gray-400 mt-6 mb-2">v1.3</p>
      </div>
    </div>
  );
};

export default Settings;