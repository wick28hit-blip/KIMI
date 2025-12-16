import React from 'react';
import { Heart, Sparkles, Shield, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onStartTracking: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartTracking }) => {
  return (
    <div className="h-full bg-gradient-to-b from-[#FFF0F3] to-white dark:from-gray-900 dark:to-gray-800 flex flex-col relative overflow-y-auto no-scrollbar">
      {/* Background Decor */}
      <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-pink-200/50 rounded-full blur-3xl pointer-events-none opacity-60"></div>
      <div className="absolute top-[20%] left-[-50px] w-48 h-48 bg-purple-200/50 rounded-full blur-3xl pointer-events-none opacity-60"></div>

      <div className="flex-1 flex flex-col px-6 pt-16 pb-10 z-10">
        
        {/* Badge */}
        <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-100 dark:border-pink-900/30 rounded-full shadow-sm">
            <Sparkles size={12} className="text-[#E84C7C]" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#E84C7C]">Intelligent Cycle Tracking</span>
          </div>
        </div>

        {/* Hero Text */}
        <div className="text-center mb-8 animate-in fade-in zoom-in duration-700 delay-100">
          <h1 className="text-5xl font-bold leading-tight mb-2 tracking-tight">
            <span className="block text-[#E84C7C]">Know your body.</span>
            <span className="block bg-gradient-to-r from-[#E84C7C] to-purple-500 bg-clip-text text-transparent">Own your cycle.</span>
          </h1>
          <p className="mt-6 text-gray-500 dark:text-gray-400 leading-relaxed text-lg max-w-xs mx-auto">
            KIMI is your personal health companion. Track your period, ovulation, and symptoms with privacy-first design.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <button 
            onClick={onStartTracking}
            className="w-full py-4 bg-[#E84C7C] hover:bg-[#D63E6D] text-white rounded-2xl font-bold text-lg shadow-lg shadow-pink-300/50 dark:shadow-pink-900/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            Start Tracking Free
            <ArrowRight size={20} />
          </button>
          <button className="w-full py-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-200 rounded-2xl font-bold text-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95">
            Learn More
          </button>
        </div>

        {/* Feature Cards */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          
          {/* Card 1 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3">
              <Heart className="text-red-400" size={20} fill="currentColor" fillOpacity={0.2} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Accurate Predictions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Smart algorithms that learn from your unique cycle patterns over time.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700">
             <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-3">
              <Sparkles className="text-purple-400" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Daily Insights</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Personalized health tips and symptom tracking to help you feel your best.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700">
             <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-3">
              <Shield className="text-blue-400" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Private & Secure</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Your health data is sensitive. We treat it with the highest level of security.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center pb-6">
           <p className="text-[10px] text-gray-400 font-medium tracking-wide">
             © 2024 KIMI. All rights reserved.
           </p>
        </div>

      </div>
    </div>
  );
};

export default LandingPage;