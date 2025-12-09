import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { calculateCycle, getDayStatus } from '../utils/calculations';
import { CycleData, UserProfile } from '../types';
import { Activity, AlertCircle } from 'lucide-react';

interface DashboardProps {
  cycleData: CycleData;
  user: UserProfile | null;
}

const BubbleDashboard: React.FC<DashboardProps> = ({ cycleData, user }) => {
  const calc = calculateCycle(cycleData, user || undefined);
  if (!calc) return null;

  const today = new Date();
  
  // Calculate Cycle Day based on the CURRENT theoretical cycle start
  // This prevents showing "Day 385" if the user hasn't logged in a year.
  const daysSinceCurrentStart = differenceInDays(today, calc.currentCycleStart);
  const currentCycleDay = daysSinceCurrentStart >= 0 ? daysSinceCurrentStart + 1 : 1;
  
  // Progress for circle
  const progressPercent = Math.min(100, Math.max(0, (currentCycleDay / cycleData.cycleLength) * 100));
  
  // Phase Detection & Color Logic
  const status = getDayStatus(today, cycleData, user || undefined);
  let phaseLabel = "Follicular Phase";
  let phaseColor = "text-[#E84C7C]";
  let phaseBg = "bg-pink-100/50";
  let ringColor = "#E84C7C";
  
  if (status === 'period' || status === 'period_past') {
      phaseLabel = "Menstruation";
      ringColor = "#E84C7C"; // Pink
  } else if (status === 'ovulation' || status === 'fertile') {
      phaseLabel = "Fertile Window";
      ringColor = "#A855F7"; // Purple
      phaseColor = "text-purple-500";
      phaseBg = "bg-purple-100/50";
  } else if (currentCycleDay > 14 && status === 'none') {
      phaseLabel = "Luteal Phase";
      ringColor = "#F472B6"; // Soft Pink
      phaseColor = "text-pink-400";
  }

  // Next Period Text
  const daysUntilPeriod = differenceInDays(calc.nextPeriodDate, today);
  
  // SVG Config
  const size = 260;
  const strokeWidth = 12; // Slimmer ring
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center w-full mt-6">
        
        {/* Phase Pill */}
        <div className={`mb-6 px-4 py-1.5 rounded-full ${phaseBg} backdrop-blur-sm font-bold text-[10px] uppercase tracking-[0.2em] shadow-sm ${phaseColor}`}>
            {phaseLabel}
        </div>

        {/* Main Circle Indicator */}
        <div className="relative flex items-center justify-center mb-8">
            
            {/* SVG Progress Ring */}
            <div className="relative">
                <svg
                    height={size}
                    width={size}
                    className="rotate-[-90deg]"
                >
                    {/* Track */}
                    <circle
                      stroke="currentColor" 
                      className="text-gray-100 dark:text-gray-800"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                      r={radius}
                      cx={size / 2}
                      cy={size / 2}
                    />
                    
                    {/* Progress with Glow */}
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
                      style={{ 
                          filter: `drop-shadow(0 0 8px ${ringColor}80)` 
                      }}
                    />
                </svg>

                {/* Inner Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-2">Cycle Day</span>
                    <span className="text-[5.5rem] leading-none font-bold text-[#2D2D2D] dark:text-white mb-2" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
                        {currentCycleDay}
                    </span>
                    <div className="flex items-center gap-1.5 bg-white/50 dark:bg-gray-800/50 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700 backdrop-blur-sm">
                        <Activity size={12} className={phaseColor} />
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                          {calc.isImpacted ? `${calc.pmsAnalysis?.severity} PMS Risk` : 'Optimum Health'}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Impact Warning / Period Shift Calculation */}
        {calc.isImpacted && calc.pmsAnalysis && (
          <div className="mb-6 px-4 py-3 bg-white dark:bg-gray-800 shadow-md border border-pink-100 dark:border-gray-700 rounded-xl flex items-center gap-3 max-w-sm text-center">
             <div className={`p-2 rounded-full ${calc.pmsAnalysis.severity === 'High' ? 'bg-red-100 text-red-500' : 'bg-orange-100 text-orange-500'}`}>
                <AlertCircle size={18} />
             </div>
             <div className="flex-1 text-left">
                 <span className="block text-xs font-bold text-gray-800 dark:text-white">
                     {calc.pmsAnalysis.severity} PMS Risk Detected
                 </span>
                 <span className="block text-[10px] text-gray-500 dark:text-gray-400">
                     Predicted date delayed by <span className="font-bold text-[#E84C7C]">+{calc.impactDelay} days</span>
                 </span>
             </div>
          </div>
        )}

        {/* 4 Stats Cards Grid */}
        <div className="grid grid-cols-2 gap-3 w-full px-4 mb-6">
            
            {/* 1. Next Period Start */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Next Period</span>
                <span className="text-lg font-bold text-[#E84C7C]">
                    {format(calc.nextPeriodDate, 'd MMM')}
                </span>
                <span className="text-[10px] text-gray-400">
                   {daysUntilPeriod} Days left
                </span>
            </div>

            {/* 2. Next Period End */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Period Ends</span>
                <span className="text-lg font-bold text-[#E84C7C]">
                    {format(calc.nextPeriodEnd, 'd MMM')}
                </span>
                <span className="text-[10px] text-gray-400">
                   Duration: {cycleData.periodDuration}d
                </span>
            </div>

             {/* 3. Ovulation */}
             <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ovulation</span>
                <span className="text-lg font-bold text-[#7B86CB]">
                    {format(calc.ovulationDate, 'd MMM')}
                </span>
                <span className="text-[10px] text-gray-400">
                   Peak Fertility
                </span>
            </div>

            {/* 4. Fertile Window */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-pink-50 dark:border-gray-700 flex flex-col items-center text-center">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Fertile Window</span>
                <span className="text-lg font-bold text-green-500">
                    {format(calc.fertileWindow.start, 'd')}-{format(calc.fertileWindow.end, 'd MMM')}
                </span>
                <span className="text-[10px] text-gray-400">
                   High Chance
                </span>
            </div>
        </div>
    </div>
  );
};

export default BubbleDashboard;