import React, { useMemo } from 'react';
import { DailyLog, UserProfile, CycleData } from '../types';
import { Brain, Smile, Droplet, Moon, Activity, TrendingUp, AlertCircle, Thermometer, Dumbbell, Sparkles, ArrowUp, ArrowDown, Lightbulb } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';

interface InsightsProps {
  logs: Record<string, DailyLog>;
  cycle: CycleData | null;
  user: UserProfile | null;
}

interface Correlation {
  trigger: string;
  effect: string;
  confidence: number; // 0 to 1
  type: 'Positive' | 'Negative'; // Positive = Good habit helps, Negative = Bad habit hurts
}

const Insights: React.FC<InsightsProps> = ({ logs, cycle, user }) => {
  
  // --- Advanced Data Aggregation ---
  const stats = useMemo(() => {
    const entries = Object.values(logs) as DailyLog[];
    if (entries.length === 0) return null;

    // 1. Sort logs descending (newest first)
    const sortedLogs = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 2. Averages (Corrected Logic: Only count days where the specific metric was logged > 0)
    const waterLogs = sortedLogs.filter(l => (l.waterIntake || 0) > 0);
    const avgWater = waterLogs.length > 0 
        ? Math.round(waterLogs.reduce((acc, l) => acc + l.waterIntake, 0) / waterLogs.length) 
        : 0;

    const sleepLogs = sortedLogs.filter(l => (l.sleepDuration || 0) > 0);
    const avgSleep = sleepLogs.length > 0
        ? Math.round(sleepLogs.reduce((acc, l) => acc + l.sleepDuration, 0) / sleepLogs.length)
        : 0;

    // 3. Trends (Recent 7 entries vs Historical)
    const recentCount = Math.min(7, sortedLogs.length);
    const recentLogs = sortedLogs.slice(0, recentCount);
    const historicalLogs = sortedLogs.slice(recentCount);

    const calcTrend = (extractor: (l: DailyLog) => number) => {
        if (historicalLogs.length === 0) return 0; // No history to compare
        
        const recentSum = recentLogs.reduce((acc, l) => acc + (extractor(l) || 0), 0);
        const recentAvg = recentSum / (recentLogs.filter(l => extractor(l) > 0).length || 1);
        
        const histSum = historicalLogs.reduce((acc, l) => acc + (extractor(l) || 0), 0);
        const histAvg = histSum / (historicalLogs.filter(l => extractor(l) > 0).length || 1);

        if (histAvg === 0) return 0;
        return ((recentAvg - histAvg) / histAvg) * 100;
    };

    const waterTrend = calcTrend(l => l.waterIntake);
    const sleepTrend = calcTrend(l => l.sleepDuration);

    // 4. Counts & Totals
    let totalWorkoutMinutes = 0;
    let totalYogaMinutes = 0;
    const symptomCounts: Record<string, number> = {};
    const moodCounts: Record<string, number> = {};
    const symptomCategoryCounts: Record<string, number> = {};

    sortedLogs.forEach(log => {
        // Exercise
        if (log.didExercise && log.exerciseDuration) {
           if (log.exerciseType === 'Yoga') totalYogaMinutes += log.exerciseDuration;
           else totalWorkoutMinutes += log.exerciseDuration;
        }
        // Symptoms
        log.detailedSymptoms?.forEach(s => {
           symptomCounts[s.name] = (symptomCounts[s.name] || 0) + 1;
           symptomCategoryCounts[s.category] = (symptomCategoryCounts[s.category] || 0) + 1;
        });
        // Moods
        log.mood?.forEach(m => {
           moodCounts[m] = (moodCounts[m] || 0) + 1;
        });
    });

    const topSymptoms = Object.entries(symptomCounts).sort((a,b) => b[1] - a[1]).slice(0, 4);
    const topMoods = Object.entries(moodCounts).sort((a,b) => b[1] - a[1]).slice(0, 3);
    const dominantCategory = Object.entries(symptomCategoryCounts).sort((a,b) => b[1] - a[1])[0];

    // 5. Correlation Engine (Simple Association Rule Mining)
    const correlations: Correlation[] = [];
    const logCount = sortedLogs.length;

    // Helper to calc frequency of a symptom/mood given a condition
    const checkCorrelation = (
        conditionFn: (l: DailyLog) => boolean, 
        targetFn: (l: DailyLog) => boolean, 
        triggerName: string, 
        effectName: string,
        type: 'Positive' | 'Negative'
    ) => {
        const daysWithCondition = sortedLogs.filter(conditionFn);
        if (daysWithCondition.length < 3) return; // Need minimal sample size

        const hits = daysWithCondition.filter(targetFn).length;
        const probability = hits / daysWithCondition.length;
        
        // Base probability (how often does this happen normally?)
        const baseHits = sortedLogs.filter(targetFn).length;
        const baseProb = baseHits / logCount;

        // Lift = Prob(Target|Condition) / Prob(Target)
        // If Lift > 1.3, there's a correlation
        if (probability > baseProb * 1.3 && probability > 0.4) {
             correlations.push({ trigger: triggerName, effect: effectName, confidence: probability, type });
        }
    };

    // Correlations to check:
    // Low Sleep -> Negative Moods
    checkCorrelation(
        l => l.sleepDuration > 0 && l.sleepDuration < 360, // < 6 hours
        l => (l.mood || []).some(m => ['Anxious', 'Sad', 'Tired', 'Frustrated'].includes(m)),
        "Low Sleep (< 6h)",
        "Negative Moods",
        "Negative"
    );

    // Low Water -> Headaches
    checkCorrelation(
        l => l.waterIntake > 0 && l.waterIntake < 1500,
        l => (l.detailedSymptoms || []).some(s => s.name === 'Headache' || s.name === 'Migraines'),
        "Low Water Intake",
        "Headaches",
        "Negative"
    );

    // Exercise -> Positive Mood
    checkCorrelation(
        l => !!l.didExercise,
        l => (l.mood || []).some(m => ['Happy', 'Energetic', 'Calm', 'Relaxed'].includes(m)),
        "Exercise",
        "Better Moods",
        "Positive"
    );

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
        correlations: correlations.slice(0, 2) // Take top 2 interesting ones
    };
  }, [logs]);

  if (!stats || stats.totalLogs === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-20 h-20 rounded-full nm-card flex items-center justify-center mb-6">
                  <Activity size={32} className="text-[var(--nm-text-muted)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--nm-text)] mb-2">No Insights Yet</h2>
              <p className="text-[var(--nm-text-muted)]">
                  Log your daily activity, moods, and symptoms to see trends here.
              </p>
          </div>
      );
  }

  const TrendPill = ({ val }: { val: number }) => {
      if (Math.abs(val) < 2) return null; // Too small to show
      const isUp = val > 0;
      // For water/sleep, usually UP is good, but let's stick to neutral colors or context specific
      // Let's assume Green = Up, Red = Down for vitals
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
                <p className="text-xs text-[var(--nm-text-muted)] font-medium mt-1">Based on {stats.totalLogs} logged days</p>
            </div>
        </div>
        
        {/* 1. Vital Averages Cards (with Trends) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
           {/* Water Card */}
           <div className="nm-card p-4 flex flex-col justify-between h-36">
               <div className="flex justify-between items-start">
                   <span className="text-[10px] font-bold text-[var(--nm-text-muted)] uppercase tracking-wider">Avg Water</span>
                   <Droplet size={16} className="text-cyan-500" />
               </div>
               <div>
                   <div className="flex items-center gap-2">
                       <span className="text-2xl font-bold text-[var(--nm-text)]">{stats.avgWater}</span>
                       <TrendPill val={stats.waterTrend} />
                   </div>
                   <span className="text-xs text-[var(--nm-text-muted)]">ml / day</span>
               </div>
               {user && (
                   <div className="w-full bg-[var(--nm-bg)] h-1.5 rounded-full overflow-hidden nm-inset">
                       <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${Math.min(100, (stats.avgWater / (user.pmsData.weight * 35)) * 100)}%` }}></div>
                   </div>
               )}
           </div>

           {/* Sleep Card */}
           <div className="nm-card p-4 flex flex-col justify-between h-36">
               <div className="flex justify-between items-start">
                   <span className="text-[10px] font-bold text-[var(--nm-text-muted)] uppercase tracking-wider">Avg Sleep</span>
                   <Moon size={16} className="text-indigo-500" />
               </div>
               <div>
                   <div className="flex items-center gap-2">
                       <span className="text-2xl font-bold text-[var(--nm-text)]">
                           {Math.floor(stats.avgSleep/60)}<span className="text-sm font-normal">h</span> {stats.avgSleep%60}<span className="text-sm font-normal">m</span>
                       </span>
                   </div>
                   <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[var(--nm-text-muted)]">per night</span>
                        <TrendPill val={stats.sleepTrend} />
                   </div>
               </div>
               <div className="w-full bg-[var(--nm-bg)] h-1.5 rounded-full overflow-hidden nm-inset">
                   <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Math.min(100, (stats.avgSleep / 480) * 100)}%` }}></div>
               </div>
           </div>
        </div>

        {/* 2. Intelligent Correlations (New) */}
        {stats.correlations.length > 0 && (
             <div className="nm-card p-5 mb-6 border-l-4 border-l-[var(--nm-primary)]">
                <h3 className="text-sm font-bold text-[var(--nm-text)] mb-3 flex items-center gap-2">
                    <Lightbulb size={16} className="text-yellow-500" />
                    Patterns Detected
                </h3>
                <div className="space-y-3">
                    {stats.correlations.map((corr, idx) => (
                        <div key={idx} className="bg-[var(--nm-bg)]/50 p-3 rounded-xl border border-white/40">
                            <p className="text-xs text-[var(--nm-text)] leading-relaxed">
                                <span className="font-bold">{corr.trigger}</span> seems to be linked with <span className="font-bold">{corr.effect}</span>.
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 h-1 bg-[var(--nm-surface)] rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${corr.type === 'Positive' ? 'bg-green-400' : 'bg-red-400'}`} style={{ width: `${corr.confidence * 100}%` }}></div>
                                </div>
                                <span className="text-[9px] font-bold text-[var(--nm-text-muted)]">{Math.round(corr.confidence * 100)}% Match</span>
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
                    Activity Summary
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

        {/* 4. Frequent Symptoms (Bar Chart Style) */}
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
                                <span className="text-xs font-medium text-[var(--nm-text-muted)]">{count} times</span>
                            </div>
                            <div className="w-full h-3 rounded-full nm-inset overflow-hidden flex items-center px-0.5">
                                <div 
                                    className="h-2 rounded-full bg-[var(--nm-primary)] shadow-sm"
                                    style={{ width: `${(count / stats.maxSymptomCount) * 100}%`, transition: 'width 1s ease-out' }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-[var(--nm-text-muted)] italic">No symptoms logged yet.</p>
            )}
        </div>

        {/* 5. Mood Patterns (Pills) */}
        <div className="nm-card p-5 mb-6">
             <h3 className="text-sm font-bold text-[var(--nm-text)] mb-4 flex items-center gap-2">
                <Smile size={16} className="text-yellow-500" />
                Mood Patterns
            </h3>
            
            {stats.topMoods.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                    {stats.topMoods.map(([mood, count], idx) => (
                        <div key={mood} className={`nm-inset px-4 py-2 rounded-xl flex items-center gap-2 ${idx === 0 ? 'border border-yellow-400/30' : ''}`}>
                            <span className="text-sm font-bold text-[var(--nm-text)]">{mood}</span>
                            <span className="text-[10px] font-bold bg-[var(--nm-bg)] text-[var(--nm-text-muted)] px-1.5 py-0.5 rounded-md shadow-sm">
                                {Math.round((count / stats.totalLogs) * 100)}%
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-xs text-[var(--nm-text-muted)] italic">No moods logged yet.</p>
            )}
        </div>

        {/* 6. Cycle & Health Profile Summary */}
        {user && user.pmsData && (
             <div className="nm-card p-5">
                <h3 className="text-sm font-bold text-[var(--nm-text)] mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-green-500" />
                    Health Profile
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="nm-inset p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] uppercase font-bold text-[var(--nm-text-muted)]">BMI Score</span>
                        <span className="text-xl font-bold text-[var(--nm-text)] mt-1">{user.pmsData.bmi.toFixed(1)}</span>
                    </div>
                    <div className="nm-inset p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] uppercase font-bold text-[var(--nm-text-muted)]">Stress Lvl</span>
                        <span className={`text-xl font-bold mt-1 ${user.pmsData.stress > 7 ? 'text-[var(--nm-danger)]' : 'text-[var(--nm-text)]'}`}>
                            {user.pmsData.stress}/10
                        </span>
                    </div>
                </div>

                {stats.dominantCategory !== 'None' && (
                    <div className="mt-4 p-3 rounded-xl bg-[var(--nm-bg)] border border-white/50 flex items-start gap-3">
                         <AlertCircle size={18} className="text-[var(--nm-primary)] shrink-0 mt-0.5" />
                         <div>
                             <p className="text-xs font-bold text-[var(--nm-text)]">Observation</p>
                             <p className="text-xs text-[var(--nm-text-muted)] leading-relaxed mt-1">
                                 Your logs indicate frequent issues related to <strong>{stats.dominantCategory}</strong>. 
                                 Consider focusing on hydration and rest during your luteal phase.
                             </p>
                         </div>
                    </div>
                )}
             </div>
        )}
    </div>
  );
};

export default Insights;