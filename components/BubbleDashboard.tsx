import React, { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { calculateCycle, getDayStatus } from '../utils/calculations';
import { CycleData, UserProfile } from '../types';
import { Activity, AlertCircle, X, Info } from 'lucide-react';

interface DashboardProps {
  cycleData: CycleData;
  user: UserProfile | null;
}

const BubbleDashboard: React.FC<DashboardProps> = ({ cycleData, user }) => {
  const [showRiskDetails, setShowRiskDetails] = useState(false);
  
  const calc = calculateCycle(cycleData, user || undefined);
  if (!calc) return null;

  const today = new Date();
  
  const daysSinceCurrentStart = differenceInDays(today, calc.currentCycleStart);
  const currentCycleDay = daysSinceCurrentStart >= 0 ? daysSinceCurrentStart + 1 : 1;
  const progressPercent = Math.min(100, Math.max(0, (currentCycleDay / cycleData.cycleLength) * 100));
  
  const status = getDayStatus(today, cycleData, user || undefined);
  let phaseLabel = "Follicular Phase";
  let phaseColor = "text-[#E84C7C]";
  let ringColor = "#E84C7C";
  
  if (status === 'period' || status === 'period_past') {
      phaseLabel = "Menstruation";
      ringColor = "#E84C7C";
  } else if (status === 'ovulation' || status === 'fertile') {
      phaseLabel = "Fertile Window";
      ringColor = "#A855F7";
      phaseColor = "text-purple-500";
  } else if (currentCycleDay > 14 && status === 'none') {
      phaseLabel = "Luteal Phase";
      ringColor = "#F472B6";
      phaseColor = "text-pink-400";
  }

  const daysUntilPeriod = differenceInDays(calc.nextPeriodDate, today);
  
  const size = 260;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center w-full mt-2 relative">
        
        <div className={`mb-6 px-6 py-2 rounded-full neu-flat font-bold text-[10px] uppercase tracking-[0.2em] ${phaseColor}`}>
            {phaseLabel}
        </div>

        <div className="relative flex items-center justify-center mb-8">
            {/* Neumorphic Container for the Circle */}
            <div className="neu-flat rounded-full p-4 flex items-center justify-center relative">
                <svg height={size} width={size} className="rotate-[-90deg]">
                    <circle
                      stroke="currentColor" 
                      className="text-transparent"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                      r={radius}
                      cx={size / 2}
                      cy={size / 2}
                    />
                     {/* Background Track - Neumorphic Inset approximation via stroke color matching bg but we use a faint line here */}
                    <circle
                      stroke="#f3e6e9"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                      r={radius}
                      cx={size / 2}
                      cy={size / 2}
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
                    />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-2">Cycle Day</span>
                    <span className="text-[5.5rem] leading-none font-bold text-[#2D2D2D] dark:text-white mb-2" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                        {currentCycleDay}
                    </span>
                    <div className="flex items-center gap-1.5 neu-pressed px-3 py-1 rounded-full">
                        <Activity size={12} className={phaseColor} />
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                          {calc.isImpacted ? `${calc.pmsAnalysis?.severity} PMS Risk` : 'Optimum Health'}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {calc.isImpacted && calc.pmsAnalysis && (
          <div 
            onClick={() => setShowRiskDetails(true)}
            className="mb-6 px-4 py-3 neu-flat flex items-center gap-3 max-w-sm text-center cursor-pointer hover:bg-gray-50 transition-colors group"
          >
             <div className={`p-2 rounded-full neu-pressed ${calc.pmsAnalysis.severity === 'High' ? 'text-red-500' : 'text-orange-500'}`}>
                <AlertCircle size={18} />
             </div>
             <div className="flex-1 text-left">
                 <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-gray-800 dark:text-white">
                        {calc.pmsAnalysis.severity} PMS Risk Detected
                    </span>
                    <Info size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
                 <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                     Predicted date delayed by <span className="font-bold text-[#E84C7C]">+{calc.impactDelay} days</span>
                 </span>
             </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 w-full px-6 mb-6">
            <div className="neu-flat p-4 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Next Period</span>
                <span className="text-lg font-bold text-[#E84C7C]">
                    {format(calc.nextPeriodDate, 'd MMM')}
                </span>
                <span className="text-[10px] text-gray-400">{daysUntilPeriod} Days left</span>
            </div>
            <div className="neu-flat p-4 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Period Ends</span>
                <span className="text-lg font-bold text-[#E84C7C]">
                    {format(calc.nextPeriodEnd, 'd MMM')}
                </span>
                <span className="text-[10px] text-gray-400">Duration: {cycleData.periodDuration}d</span>
            </div>
             <div className="neu-flat p-4 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ovulation</span>
                <span className="text-lg font-bold text-[#7B86CB]">
                    {format(calc.ovulationDate, 'd MMM')}
                </span>
                <span className="text-[10px] text-gray-400">Peak Fertility</span>
            </div>
            <div className="neu-flat p-4 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fertile Window</span>
                <span className="text-lg font-bold text-green-500">
                    {format(calc.fertileWindow.start, 'd')}-{format(calc.fertileWindow.end, 'd MMM')}
                </span>
                <span className="text-[10px] text-gray-400">High Chance</span>
            </div>
        </div>

        {showRiskDetails && user && user.pmsData && (
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-200" 
                onClick={() => setShowRiskDetails(false)}
            >
                <div 
                    className="neu-flat p-6 w-full max-w-sm animate-in zoom-in-95 duration-200" 
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                Analysis
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${calc.pmsAnalysis?.severity === 'High' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
                                    {calc.pmsAnalysis?.severity} Risk
                                </span>
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Factors contributing to cycle delay</p>
                        </div>
                        <button onClick={() => setShowRiskDetails(false)} className="neu-btn-round w-8 h-8">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed neu-pressed p-3">
                        Based on your inputs, we calculated a weighted risk score. Elevated stress, anxiety, or sleep issues can disrupt hormonal balance, potentially delaying your period by <strong>{calc.impactDelay} days</strong>.
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default BubbleDashboard;