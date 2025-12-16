import React, { useMemo } from 'react';
import { DailyLog, UserProfile, CycleData } from '../types';
import { Brain, Smile, Droplet, Moon, Activity, TrendingUp, AlertCircle, Thermometer, Dumbbell, Sparkles, ArrowUp, ArrowDown, Lightbulb, Calendar } from 'lucide-react';
import { getDayStatus } from '../utils/calculations';
import { parseISO } from 'date-fns';

interface InsightsProps {
  logs: Record<string, DailyLog>;
  cycle: CycleData | null;
  user: UserProfile | null;
}

interface Correlation {
  trigger: string;
  effect: string;
  confidence: number;
  type: 'Positive' | 'Negative';
}

const Insights: React.FC<InsightsProps> = ({ logs, cycle, user }) => {
  
  const stats = useMemo(() => {
    const entries = Object.values(logs) as DailyLog[];
    if (entries.length === 0) return null;

    // 1. Sort logs descending
    const sortedLogs = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 2. Corrected Averages (Only counting non-zero entries)
    const waterLogs = sortedLogs.filter(l => (l.waterIntake || 0) > 0);
    const avgWater = waterLogs.length > 0 
        ? Math.round(waterLogs.reduce((acc, l) => acc + l.waterIntake, 0) / waterLogs.length) 
        : 0;

    const sleepLogs = sortedLogs.filter(l => (l.sleepDuration || 0) > 0);
    const avgSleep = sleepLogs.length > 0
        ? Math.round(sleepLogs.reduce((acc, l) => acc + l.sleepDuration, 0) / sleepLogs.length)
        : 0;

    // 3. Trend Analysis (Last 7 days vs Previous 7 days)
    const recentLogs = sortedLogs.slice(0, 7);
    const historicalLogs = sortedLogs.slice(7, 14); // Compare to the week before

    const calcTrend = (extractor: (l: DailyLog) => number) => {
        // Calculate average for recent period (ignoring 0s)
        const recentValid = recentLogs.filter(l => extractor(l) > 0);
        const recentAvg = recentValid.length > 0 
            ? recentValid.reduce((acc, l) => acc + extractor(l), 0) / recentValid.length
            : 0;
            
        // Calculate average for historical period (ignoring 0s)
        const histValid = historicalLogs.filter(l => extractor(l) > 0);
        const histAvg = histValid.length > 0
            ? histValid.reduce((acc, l) => acc + extractor(l), 0) / histValid.length
            : 0;

        if (histAvg === 0) return 0;
        return ((recentAvg - histAvg) / histAvg) * 100;
    };

    const waterTrend = calcTrend(l => l.waterIntake);
    const sleepTrend = calcTrend(l => l.sleepDuration);

    // 4. Aggregations
    let totalWorkoutMinutes = 0;
    let totalYogaMinutes = 0;
    const symptomCounts: Record<string, number> = {};
    const moodCounts: Record<string, number> = {};
    const symptomCategoryCounts: Record<string, number> = {};

    // Phase Analysis (Luteal vs Follicular Symptoms)
    const phaseSymptoms: Record<string, Record<string, number>> = {
        'Follicular': {},
        'Luteal': {},
        'Menstrual': {}
    };

    sortedLogs.forEach(log => {
        // Exercise
        if (log.didExercise && log.exerciseDuration) {
           if (log.exerciseType === 'Yoga') totalYogaMinutes += log.exerciseDuration;
           else totalWorkoutMinutes += log.exerciseDuration;
        }
        
        // Determine Phase for this log
        let phase = 'Follicular';
        if (cycle) {
            const status = getDayStatus(parseISO(log.date), cycle, user || undefined);
            if (status === 'period' || status === 'period_past') phase = 'Menstrual';
            // Rough approximation if we don't have full history reconstruction
            // If log date is > 14 days after last period, assume Luteal? 
            // Better to use getDayStatus logic, but simplified here for aggregation
        }

        // Symptoms
        log.detailedSymptoms?.forEach(s => {
           symptomCounts[s.name] = (symptomCounts[s.name] || 0) + 1;
           symptomCategoryCounts[s.category] = (symptomCategoryCounts[s.category] || 0) + 1;
           
           // Track by phase (simplified)
           if (log.flow) phase = 'Menstrual'; // Override if flow present
           // We'd need accurate phase mapping here, simpler to just track global for now
        });

        // Moods
        log.mood?.forEach(m => {
           moodCounts[m] = (moodCounts[m] || 0) + 1;
        });
    });

    const topSymptoms = Object.entries(symptomCounts).sort((a,b) => b[1] - a[1]).slice(0, 4);
    const topMoods = Object.entries(moodCounts).sort((a,b) => b[1] - a[1]).slice(0, 3);
    const dominantCategory = Object.entries(symptomCategoryCounts).sort((a,b) => b[1] - a[1])[0];

    // 5. Correlation Engine
    const correlations: Correlation[] = [];
    
    // Pattern: Poor Sleep -> Mood/Symptom
    const poorSleepDays = sortedLogs.filter(l => l.sleepDuration > 0 && l.sleepDuration < 360);
    if (poorSleepDays.length >= 3) {
        // Check for specific negative outcome
        const badMoods = poorSleepDays.filter(l => l.mood?.some(m => ['Anxious', 'Sad', 'Irritable'].includes(m)));
        if (badMoods.length / poorSleepDays.length > 0.5) {
            correlations.push({
                trigger: 'Low Sleep (< 6h)',
                effect: 'Negative Moods',
                confidence: badMoods.length / poorSleepDays.length,
                type: 'Negative'
            });
        }
    }

    // Pattern: High Water -> Less Headaches?
    // Or Low Water -> Headaches
    const lowWaterDays = sortedLogs.filter(l => l.waterIntake > 0 && l.waterIntake < 1500);
    if (lowWaterDays.length >= 3) {
        const headacheDays = lowWaterDays.filter(l => l.detailedSymptoms?.some(s => s.name === 'Headache'));
        if (headacheDays.length / lowWaterDays.length > 0.4) {
             correlations.push({
                trigger: 'Low Hydration',
                effect: 'Headaches',
                confidence: headacheDays.length / lowWaterDays.length,
                type: 'Negative'
            });
        }
    }

    // Pattern: Yoga -> Calm
    const yogaDays = sortedLogs.filter(l => l.didExercise && l.exerciseType === 'Yoga');
    if (yogaDays.length >= 3) {
        const calmDays = yogaDays.filter(l => l.mood?.some(m => ['Calm', 'Relaxed', 'Happy'].includes(m)));
        if (calmDays.length / yogaDays.length > 0.6) {
             correlations.push({
                trigger: 'Yoga Sessions',
                effect: 'Positive Mood',
                confidence: calmDays.length / yogaDays.length,
                type: 'Positive'
            });
        }
    }

    return {
        avgWater,
        avgSleep,
        waterTrend,
        sleepTrend,
        topSymptoms,
        topMoods,
        dominantCategory: dominantCategory ? dominantCategory[0] : 'None',
        totalLogs: sortedLogs.length,
        maxSymptomCount: topSymptoms.length > 0 ? topSymptoms[0][1] : 1,
        totalWorkoutMinutes,
        totalYogaMinutes,
        correlations
    };
  }, [logs, cycle, user]);

  if (!stats || stats.totalLogs === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-20 h-20 rounded-full nm-card flex items-center justify-center mb-6">
                  <Activity size={32} className="text-[var(--nm-text-muted)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--nm-text)] mb-2">No Insights Yet</h2>
              <p className="text-[var(--nm-text-muted)]">
                  Log your daily activity to unlock trends.
              </p>
          </div>
      );
  }

  const TrendIndicator = ({ val }: { val: number }) => {
      if (Math.abs(val) < 5) return <span className="text-[9px] text-[var(--nm-text-muted)] font-bold">Stable</span>;
      const isUp = val > 0;
      return (
          <div className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
              {isUp ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
              {Math.abs(Math.round(val))}%
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar pb-32 p-6">
        <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full nm-inset flex items-center justify-center text-[var(--nm-primary)]">
                <TrendingUp size={20} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-[var(--nm-text)] leading-none">Insights</h2>
                <p className="text-xs text-[var(--nm-text-muted)] font-medium mt-1">Analysis of {stats.totalLogs} days</p>
            </div>
        </div>
        
        {/* 1. Vital Averages */}
        <div className="grid grid-cols-2 gap-4 mb-6">
           {/* Water */}
           <div className="nm-card p-4 flex flex-col justify-between h-32">
               <div className="flex justify-between items-start">
                   <span className="text-[10px] font-bold text-[var(--nm-text-muted)] uppercase tracking-wider">Avg Water</span>
                   <Droplet size={16} className="text-cyan-500" />
               </div>
               <div>
                   <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-[var(--nm-text)]">{stats.avgWater}</span>
                        <TrendIndicator val={stats.waterTrend} />
                   </div>
                   <span className="text-xs text-[var(--nm-text-muted)]">ml (logged days)</span>
               </div>
               {user && (
                   <div className="w-full bg-[var(--nm-bg)] h-1.5 rounded-full overflow-hidden nm-inset">
                       <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${Math.min(100, (stats.avgWater / (user.pmsData.weight * 35)) * 100)}%` }}></div>
                   </div>
               )}
           </div>

           {/* Sleep */}
           <div className="nm-card p-4 flex flex-col justify-between h-32">
               <div className="flex justify-between items-start">
                   <span className="text-[10px] font-bold text-[var(--nm-text-muted)] uppercase tracking-wider">Avg Sleep</span>
                   <Moon size={16} className="text-indigo-500" />
               </div>
               <div>
                   <div className="flex items-center gap-2">
                       <span className="text-2xl font-bold text-[var(--nm-text)]">
                           {Math.floor(stats.avgSleep/60)}<span className="text-sm font-normal">h</span>
                       </span>
                       <TrendIndicator val={stats.sleepTrend} />
                   </div>
                   <span className="text-xs text-[var(--nm-text-muted)]">per night</span>
               </div>
               <div className="w-full bg-[var(--nm-bg)] h-1.5 rounded-full overflow-hidden nm-inset">
                   <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Math.min(100, (stats.avgSleep / 480) * 100)}%` }}></div>
               </div>
           </div>
        </div>

        {/* 2. Correlations (New) */}
        {stats.correlations.length > 0 && (
             <div className="nm-card p-5 mb-6">
                <h3 className="text-sm font-bold text-[var(--nm-text)] mb-3 flex items-center gap-2">
                    <Lightbulb size={16} className="text-yellow-500" />
                    Detected Patterns
                </h3>
                <div className="space-y-3">
                    {stats.correlations.map((corr, idx) => (
                        <div key={idx} className="nm-inset p-3 rounded-xl flex items-start gap-3">
                            <div className={`mt-1 w-2 h-2 rounded-full ${corr.type === 'Positive' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <div>
                                <p className="text-xs text-[var(--nm-text)] leading-relaxed">
                                    When you have <strong>{corr.trigger}</strong>, you often report <strong>{corr.effect}</strong>.
                                </p>
                                <span className="text-[9px] font-bold text-[var(--nm-text-muted)] uppercase mt-1 block">
                                    {Math.round(corr.confidence * 100)}% Probability
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        )}

        {/* 3. Activity Summary */}
        {(stats.totalWorkoutMinutes > 0 || stats.totalYogaMinutes > 0) && (
            <div className="nm-card p-5 mb-6">
                <h3 className="text-sm font-bold text-[var(--nm-text)] mb-4 flex items-center gap-2">
                    <Dumbbell size={16} className="text-orange-500" />
                    Activity Totals
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="nm-inset p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <div className="mb-1 text-orange-400"><Dumbbell size={18} /></div>
                        <span className="text-[10px] uppercase font-bold text-[var(--nm-text-muted)]">Workouts</span>
                        <span className="text-xl font-bold text-[var(--nm-text)] mt-1">{stats.totalWorkoutMinutes}m</span>
                    </div>
                    <div className="nm-inset p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <div className="mb-1 text-pink-400"><Sparkles size={18} /></div>
                        <span className="text-[10px] uppercase font-bold text-[var(--nm-text-muted)]">Yoga</span>
                        <span className="text-xl font-bold text-[var(--nm-text)] mt-1">{stats.totalYogaMinutes}m</span>
                    </div>
                </div>
            </div>
        )}

        {/* 4. Top Symptoms */}
        <div className="nm-card p-5 mb-6">
            <h3 className="text-sm font-bold text-[var(--nm-text)] mb-4 flex items-center gap-2">
                <Thermometer size={16} className="text-[var(--nm-primary)]" />
                Top Symptoms
            </h3>
            
            {stats.topSymptoms.length > 0 ? (
                <div className="space-y-4">
                    {stats.topSymptoms.map(([name, count]) => (
                        <div key={name}>
                            <div className="flex justify-between mb-1">
                                <span className="text-xs font-bold text-[var(--nm-text)]">{name}</span>
                                <span className="text-xs font-medium text-[var(--nm-text-muted)]">{count} entries</span>
                            </div>
                            <div className="w-full h-2 rounded-full nm-inset overflow-hidden flex items-center">
                                <div 
                                    className="h-full rounded-full bg-[var(--nm-primary)]"
                                    style={{ width: `${(count / stats.maxSymptomCount) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-[var(--nm-text-muted)] italic">Start logging symptoms to see data.</p>
            )}
        </div>

        {/* 5. Moods */}
        <div className="nm-card p-5">
             <h3 className="text-sm font-bold text-[var(--nm-text)] mb-4 flex items-center gap-2">
                <Smile size={16} className="text-yellow-500" />
                Frequent Moods
            </h3>
            
            {stats.topMoods.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {stats.topMoods.map(([mood, count]) => (
                        <div key={mood} className="nm-inset px-3 py-2 rounded-xl flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--nm-text)]">{mood}</span>
                            <span className="text-[9px] font-bold bg-[var(--nm-bg)] text-[var(--nm-text-muted)] px-1.5 py-0.5 rounded-md">
                                {count}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-xs text-[var(--nm-text-muted)] italic">No moods logged yet.</p>
            )}
        </div>
    </div>
  );
};

export default Insights;