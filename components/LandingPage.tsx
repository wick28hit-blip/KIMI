import React from 'react';
import { Heart, Sparkles, Shield, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onStartTracking: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartTracking }) => {
  return (
    <div className="h-full bg-[var(--nm-bg)] flex flex-col relative overflow-y-auto no-scrollbar">
      
      <div className="flex-1 flex flex-col px-6 pt-16 pb-10 z-10">
        
        {/* Badge */}
        <div className="flex justify-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-2 px-4 py-1.5 nm-card rounded-full">
            <Sparkles size={12} className="text-[var(--nm-primary)]" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--nm-primary)]">Intelligent Cycle Tracking</span>
          </div>
        </div>

        {/* Hero Text */}
        <div className="text-center mb-8 animate-in fade-in zoom-in duration-700 delay-100">
          <h1 className="text-5xl font-bold leading-tight mb-2 tracking-tight text-[var(--nm-text)]">
            <span className="block text-[var(--nm-primary)]">Know your body.</span>
            <span className="block">Own your cycle.</span>
          </h1>
          <p className="mt-6 text-[var(--nm-text-muted)] leading-relaxed text-lg max-w-xs mx-auto">
            KIMI is your personal health companion. Track your period, ovulation, and symptoms with privacy-first design.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <button 
            onClick={onStartTracking}
            className="nm-btn-primary w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            Start Tracking
            <ArrowRight size={20} />
          </button>
          <button className="nm-btn w-full py-4 text-[var(--nm-text)] rounded-2xl font-bold text-lg active:scale-95 transition-transform">
            Learn More
          </button>
        </div>

        {/* Feature Cards */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          
          {/* Card 1 */}
          <div className="nm-card p-6">
            <div className="w-10 h-10 nm-inset rounded-full flex items-center justify-center mb-3">
              <Heart className="text-[#ef4444]" size={20} fill="currentColor" fillOpacity={0.2} />
            </div>
            <h3 className="text-lg font-bold text-[var(--nm-text)] mb-1">Accurate Predictions</h3>
            <p className="text-sm text-[var(--nm-text-muted)] leading-relaxed">
              Smart algorithms that learn from your unique cycle patterns over time.
            </p>
          </div>

          {/* Card 2 */}
          <div className="nm-card p-6">
             <div className="w-10 h-10 nm-inset rounded-full flex items-center justify-center mb-3">
              <Sparkles className="text-purple-400" size={20} />
            </div>
            <h3 className="text-lg font-bold text-[var(--nm-text)] mb-1">Daily Insights</h3>
            <p className="text-sm text-[var(--nm-text-muted)] leading-relaxed">
              Personalized health tips and symptom tracking to help you feel your best.
            </p>
          </div>

          {/* Card 3 */}
          <div className="nm-card p-6">
             <div className="w-10 h-10 nm-inset rounded-full flex items-center justify-center mb-3">
              <Shield className="text-blue-400" size={20} />
            </div>
            <h3 className="text-lg font-bold text-[var(--nm-text)] mb-1">Private & Secure</h3>
            <p className="text-sm text-[var(--nm-text-muted)] leading-relaxed">
              Your health data is sensitive. We treat it with the highest level of security.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center pb-6">
           <p className="text-[10px] text-[var(--nm-text-muted)] font-medium tracking-wide">
             © 2024 KIMI. All rights reserved.
           </p>
        </div>

      </div>
    </div>
  );
};

export default LandingPage;