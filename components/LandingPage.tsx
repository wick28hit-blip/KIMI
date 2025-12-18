import React from 'react';
import { Heart, Sparkles, Shield, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onStartTracking: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartTracking }) => {
  return (
    <div className="h-full flex flex-col relative overflow-y-auto overflow-x-hidden no-scrollbar w-full">
      {/* Background Decor */}
      <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-pink-200/50 rounded-full blur-3xl pointer-events-none opacity-60"></div>
      <div className="absolute top-[20%] left-[-50px] w-48 h-48 bg-purple-200/50 rounded-full blur-3xl pointer-events-none opacity-60"></div>

      <div className="flex-1 flex flex-col px-6 pt-16 pb-10 z-10 w-full">
        
        {/* Badge */}
        <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-2 px-4 py-1.5 neu-pressed rounded-full">
            <Sparkles size={12} className="text-[#E84C7C]" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#E84C7C]">Intelligent Cycle Tracking</span>
          </div>
        </div>

        {/* Hero Text */}
        <div className="text-center mb-8 animate-in fade-in zoom-in duration-700 delay-100">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-2 tracking-tight text-[#2D2D2D] dark:text-white">
            <span className="block text-[#E84C7C]">Know your body.</span>
            <span className="block bg-gradient-to-r from-[#E84C7C] to-purple-500 bg-clip-text text-transparent">Own your cycle.</span>
          </h1>
          <p className="mt-6 text-gray-500 dark:text-gray-400 leading-relaxed text-lg max-w-xs mx-auto">
            KIMI is your personal health companion. Track your period, ovulation, and symptoms with privacy-first design.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <button 
            onClick={onStartTracking}
            className="neu-btn w-full py-4 text-lg transition-all active:scale-95 flex items-center justify-center gap-3 group"
          >
            <span className="font-bold bg-gradient-to-r from-[#E84C7C] to-purple-500 bg-clip-text text-transparent">
              Start Tracking Free
            </span>
            <ArrowRight size={24} className="text-purple-500 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="neu-flat w-full py-4 text-gray-500 dark:text-gray-400 font-bold text-lg transition-all active:scale-95 hover:text-[#E84C7C]">
            Learn More
          </button>
        </div>

        {/* Feature Cards */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          
          {/* Card 1 */}
          <div className="neu-flat p-6 flex items-start gap-4">
            <div className="w-12 h-12 neu-pressed rounded-full flex items-center justify-center shrink-0">
              <Heart className="text-red-400" size={20} fill="currentColor" fillOpacity={0.2} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Accurate Predictions</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Smart algorithms that learn from your unique cycle patterns over time.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="neu-flat p-6 flex items-start gap-4">
             <div className="w-12 h-12 neu-pressed rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="text-purple-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Daily Insights</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Personalized health tips and symptom tracking to help you feel your best.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="neu-flat p-6 flex items-start gap-4">
             <div className="w-12 h-12 neu-pressed rounded-full flex items-center justify-center shrink-0">
              <Shield className="text-blue-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Private & Secure</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Your health data is sensitive. We treat it with the highest level of security.
              </p>
            </div>
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