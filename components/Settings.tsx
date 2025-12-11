import React, { useRef } from 'react';
import { Bell, Moon, Shield, Download, Upload, Trash2, ChevronRight, Lock, Sun, LogOut, UserPlus, Share2 } from 'lucide-react';

interface SettingsProps {
  onExport: () => void;
  onImport: (file: File) => void;
  onDeleteData: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onAddProfile: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
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

  const handleShareApp = async () => {
    try {
        const url = window.location.href;
        if (navigator.share) {
            await navigator.share({
                title: 'KIMI',
                text: 'Track your cycle privately with KIMI.',
                url: url
            });
        } else {
            await navigator.clipboard.writeText(url);
            alert('Link copied! Open this URL in Safari to install: ' + url);
        }
    } catch (e) {
        console.log('Share cancelled');
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

        {/* Install / Share Banner */}
        <div className="w-full bg-gradient-to-r from-[#E84C7C] to-[#F47B9C] rounded-2xl p-5 mb-8 shadow-lg shadow-pink-200/50 dark:shadow-none flex items-center justify-between text-white relative overflow-hidden">
             {/* Decorative circles */}
             <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/20 rounded-full blur-xl pointer-events-none"></div>
             <div className="absolute -left-4 -bottom-4 w-12 h-12 bg-white/20 rounded-full blur-lg pointer-events-none"></div>
             
             <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
                    <Share2 size={24} className="text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-lg leading-tight">Install App</h3>
                    <p className="text-xs text-pink-50 font-medium">Get the full experience</p>
                </div>
             </div>
             <button 
                onClick={handleShareApp}
                className="px-5 py-2.5 bg-white text-[#E84C7C] text-sm font-bold rounded-xl shadow-sm active:scale-95 transition-transform hover:bg-pink-50 relative z-10"
             >
                Install
             </button>
        </div>

        {/* Profile Management */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-2 mb-6 border border-pink-50 dark:border-gray-700 transition-colors">
            <div className="p-4 border-b border-gray-50 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Profile Management</h3>
            </div>
            <button 
                onClick={onAddProfile}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
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