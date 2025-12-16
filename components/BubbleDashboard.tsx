import React, { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { calculateCycle, getDayStatus } from '../utils/calculations';
import { CycleData, UserProfile } from '../types';
import { Activity, AlertCircle, X, Info } from 'lucide-react';

interface DashboardProps {
  cycleData: CycleData;
  user: UserProfile | null;
}

const RiskMetric = ({ label, value }: { label: string, value: number }) => (
    <div className="nm-inset p-3 rounded-lg">
        <span className="block text-[9px] text-[var(--nm-text-muted)] uppercase font-bold tracking-wider truncate">{label}</span>
        <div className="flex items-end gap-1 my-1">
            <span className={`text-lg font-bold leading-none ${value >= 7 ? 'text-[#ef4444]' : value >= 4 ? 'text-orange-400' : 'text-green-500'}`}>{value}</span>
            <span className="text-[9px] text-[var(--nm-text-muted)] mb-0.5">/ 10</span>
        </div>
        <div className="w-full h-1.5 bg-[var(--nm-bg)] rounded-full overflow-hidden shadow-[inset_1px_1px_2px_rgba(201,160,174,0.3)]">
            <div 
                className={`h-full rounded-full ${value >= 7 ? 'bg-[#ef4444]' : value >= 4 ? 'bg-orange-400' : 'bg-green-500'}`} 
                style={{ width: `${Math.min(100, value * 10)}%` }}
            ></div>
        </div>
    </div>
);

const BubbleDashboard: React.FC<DashboardProps> = ({ cycleData, user }) => {
  const [showRiskDetails, setShowRiskDetails] = useState(false);
  
  const calc = calculateCycle(cycleData, user || undefined);
  if (!calc) return null;

  const today = new Date();
  
  // Calculate Cycle Day based on the CURRENT theoretical cycle start
  const daysSinceCurrentStart = differenceInDays(today, calc.currentCycleStart);
  const currentCycleDay = daysSinceCurrentStart >= 0 ? daysSinceCurrentStart + 1 : 1;
  
  // Progress for circle
  const progressPercent = Math.min(100, Math.max(0, (currentCycleDay / cycleData.cycleLength) * 100));
  
  // Phase Detection & Color Logic
  const status = getDayStatus(today, cycleData, user || undefined);
  let phaseLabel = "Follicular Phase";
  let phaseColor = "text-[var(--nm-primary)]";
  // Neumorphic pill style for pill
  let phaseBg = "nm-card";
  let ringColor = "#D9467A"; // Accent
  
  if (status === 'period' || status === 'period_past') {
      phaseLabel = "Menstruation";
      ringColor = "#D9467A"; 
  } else if (status === 'ovulation' || status === 'fertile') {
      phaseLabel = "Fertile Window";
      ringColor = "#A855F7"; 
      phaseColor = "text-purple-500";
  } else if (currentCycleDay > 14 && status === 'none') {
      phaseLabel = "Luteal Phase";
      ringColor = "#F472B6"; 
      phaseColor = "text-pink-400";
  }

  // Next Period Text
  const daysUntilPeriod = differenceInDays(calc.nextPeriodDate, today);
  
  // SVG Config
  const size = 260;
  const strokeWidth = 14; 
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center w-full mt-6 relative">
        
        {/* Phase Pill */}
        <div className={`mb-6 px-4 py-1.5 rounded-full ${phaseBg} font-bold text-[10px] uppercase tracking-[0.2em] ${phaseColor}`}>
            {phaseLabel}
        </div>

        {/* Main Circle Indicator - Soft 3D Container */}
        <div className="relative flex items-center justify-center mb-8 p-4 rounded-full nm-card" style={{ width: size + 40, height: size + 40 }}>
            {/* SVG Progress Ring */}
            <div className="relative">
                <svg height={size} width={size} className="rotate-[-90deg]">
                    <circle
                      stroke="var(--nm-bg)"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                      r={radius}
                      cx={size / 2}
                      cy={size / 2}
                      className="drop-shadow-[inset_2px_2px_4px_rgba(201,160,174,0.3)]"
                    />
                    <circle
                      stroke={ringColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      r={radius}
                      cx={size / 2}
                      cy={size / 2}
                      className="transition-all duration-1000 ease-out"
                      style={{ filter: `drop-shadow(2px 2px 4px rgba(0,0,0,0.1))` }}
                    />
                </svg>

                {/* Inner Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[var(--nm-text-muted)] uppercase mb-2">Cycle Day</span>
                    <span className="text-[5.5rem] leading-none font-bold text-[var(--nm-text)] mb-2" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', textShadow: '2px 2px 4px rgba(255,255,255,0.8), -1px -1px 2px rgba(0,0,0,0.1)' }}>
                        {currentCycleDay}
                    </span>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full nm-inset">
                        <Activity size={12} className={phaseColor} />
                        <span className="text-[10px] font-bold text-[var(--nm-text-muted)]">
                          {calc.isImpacted ? `${calc.pmsAnalysis?.severity} PMS Risk` : 'Optimum Health'}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Impact Warning / Period Shift Calculation - CLICKABLE */}
        {calc.isImpacted && calc.pmsAnalysis && (
          <div 
            onClick={() => setShowRiskDetails(true)}
            className="mb-6 px-4 py-3 nm-card flex items-center gap-3 max-w-sm text-center cursor-pointer active:scale-95 transition-transform group"
          >
             <div className={`p-2 rounded-full ${calc.pmsAnalysis.severity === 'High' ? 'bg-red-100 text-[#ef4444]' : 'bg-orange-100 text-orange-500'}`}>
                <AlertCircle size={18} />
             </div>
             <div className="flex-1 text-left">
                 <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-[var(--nm-text)]">
                        {calc.pmsAnalysis.severity} PMS Risk Detected
                    </span>
                    <Info size={12} className="text-[var(--nm-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
                 <span className="block text-[10px] text-[var(--nm-text-muted)]">
                     Predicted date delayed by <span className="font-bold text-[var(--nm-primary)]">+{calc.impactDelay} days</span>
                 </span>
             </div>
          </div>
        )}

        {/* 4 Stats Cards Grid - Neumorphic Cards */}
        <div className="grid grid-cols-2 gap-4 w-full px-4 mb-6">
            <div className="nm-card p-4 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-[var(--nm-text-muted)] uppercase tracking-wider mb-1">Next Period</span>
                <span className="text-lg font-bold text-[var(--nm-primary)]">
                    {format(calc.nextPeriodDate, 'd MMM')}
                </span>
                <span className="text-[10px] text-[var(--nm-text-muted)]">{daysUntilPeriod} Days left</span>
            </div>
            <div className="nm-card p-4 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-[var(--nm-text-muted)] uppercase tracking-wider mb-1">Period Ends</span>
                <span className="text-lg font-bold text-[var(--nm-primary)]">
                    {format(calc.nextPeriodEnd, 'd MMM')}
                </span>
                <span className="text-[10px] text-[var(--nm-text-muted)]">Duration: {cycleData.periodDuration}d</span>
            </div>
             <div className="nm-card p-4 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-[var(--nm-text-muted)] uppercase tracking-wider mb-1">Ovulation</span>
                <span className="text-lg font-bold text-[#7B86CB]">
                    {format(calc.ovulationDate, 'd MMM')}
                </span>
                <span className="text-[10px] text-[var(--nm-text-muted)]">Peak Fertility</span>
            </div>
            <div className="nm-card p-4 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-[var(--nm-text-muted)] uppercase tracking-wider mb-1">Fertile Window</span>
                <span className="text-lg font-bold text-green-500">
                    {format(calc.fertileWindow.start, 'd')}-{format(calc.fertileWindow.end, 'd MMM')}
                </span>
                <span className="text-[10px] text-[var(--nm-text-muted)]">High Chance</span>
            </div>
        </div>

        {/* Risk Details Modal */}
        {showRiskDetails && user && user.pmsData && (
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--nm-text)]/20 backdrop-blur-sm animate-in fade-in duration-200" 
                onClick={() => setShowRiskDetails(false)}
            >
                <div 
                    className="nm-card p-6 w-full max-w-sm animate-in zoom-in-95 duration-200" 
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-[var(--nm-text)] flex items-center gap-2">
                                Analysis
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${calc.pmsAnalysis?.severity === 'High' ? 'bg-red-100 text-[#ef4444]' : 'bg-orange-100 text-orange-500'}`}>
                                    {calc.pmsAnalysis?.severity} Risk
                                </span>
                            </h3>
                            <p className="text-xs text-[var(--nm-text-muted)]">Factors contributing to cycle delay</p>
                        </div>
                        <button onClick={() => setShowRiskDetails(false)} className="nm-icon-btn w-8 h-8">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="text-sm text-[var(--nm-text)] mb-5 leading-relaxed bg-[var(--nm-bg)] p-3 rounded-lg border border-pink-100">
                        Based on your inputs, we calculated a weighted risk score. Elevated stress, anxiety, or sleep issues can disrupt hormonal balance, potentially delaying your period by <strong>{calc.impactDelay} days</strong>.
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <RiskMetric label="Stress" value={user.pmsData.stress} />
                        <RiskMetric label="Sleep Quality" value={user.pmsData.sleep} />
                        <RiskMetric label="Anxiety" value={user.pmsData.anxiety} />
                        <RiskMetric label="Depression" value={user.pmsData.depression} />
                        <RiskMetric label="Diet" value={user.pmsData.diet} />
                        <RiskMetric label="BMI Score" value={Math.round(user.pmsData.bmi)} />
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-[var(--nm-text-muted)] justify-center">
                        <Info size={12} />
                        <span>Scores more than 4 contribute significantly to delay</span>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default BubbleDashboard;