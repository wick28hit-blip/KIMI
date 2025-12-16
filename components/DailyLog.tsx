import React, { useState } from 'react';
import { 
  ArrowLeft, Check, Activity, Brain, Smile, User, 
  ChevronDown, ChevronUp, Star, Droplet, Thermometer
} from 'lucide-react';
import { DailyLog as DailyLogType, SymptomEntry } from '../types';
import { format } from 'date-fns';

interface DailyLogProps {
  log: DailyLogType;
  onSave: (log: DailyLogType) => void;
  onClose: () => void;
}

// --- Data Constants ---
const SYMPTOM_CATEGORIES = {
  Head: ['Headache', 'Migraines', 'Dizziness', 'Acne', 'Hectic fever'],
  Body: ['Neckaches', 'Shoulder aches', 'Tender breasts', 'Breast sensitivity', 'Backaches', 'Lower back pain', 'Body aches', 'Muscle pain', 'Influenza', 'Illness', 'Cramps', 'Chills', 'Itchiness', 'Rashes', 'Night sweats', 'Hot flashes', 'Weight gain', 'PMS'],
  Cervix: ['Flow', 'Pelvic pain', 'Cervical firmness', 'Cervical opening', 'Cervical mucus', 'Spotting', 'Irritation'],
  Fluid: ['Dry', 'Sticky', 'Creamy', 'Watery', 'Egg-white', 'Cottage-cheese', 'Green', 'With blood', 'Foul-Smelling'],
  Abdomen: ['Bloating', 'Constipation', 'Diarrhea', 'Nausea', 'Abdominal cramps', 'Dyspepsia', 'Gas', 'Hunger', 'Cravings', 'Ovulation pain'],
  Mental: ['Anxiety', 'Insomnia', 'Stress', 'Moodiness', 'Tension', 'Irritability', 'Unable to concentrate', 'Fatigue', 'Confusion']
};

const CATEGORY_ICONS: Record<string, any> = {
  Head: Brain,
  Body: User,
  Cervix: Activity,
  Fluid: Droplet,
  Abdomen: Thermometer,
  Mental: Smile
};

const DailyLog: React.FC<DailyLogProps> = ({ log, onSave, onClose }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Head');

  // Helper to update log safely
  const updateLog = (updates: Partial<DailyLogType>) => {
    onSave({ ...log, ...updates });
  };

  const handleSymptomChange = (category: string, name: string, intensity: number) => {
    const currentSymptoms = log.detailedSymptoms || [];
    // Remove existing if any
    const filtered = currentSymptoms.filter(s => s.name !== name);
    
    if (intensity > 0) {
      // Add new
      const newEntry: SymptomEntry = { 
        name, 
        intensity, 
        category: category as any 
      };
      updateLog({ detailedSymptoms: [...filtered, newEntry] });
    } else {
      updateLog({ detailedSymptoms: filtered });
    }
  };

  const getIntensity = (name: string) => {
    return log.detailedSymptoms?.find(s => s.name === name)?.intensity || 0;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Header */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
            <button onClick={onClose} className="nm-icon-btn w-10 h-10 text-[var(--nm-text)]">
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-[var(--nm-text)] leading-none">
                    Daily Log
                </h2>
                <span className="text-[var(--nm-text-muted)] text-sm font-medium">{format(new Date(log.date), 'MMM d')}</span>
            </div>
        </div>
        <button onClick={onClose} className="nm-icon-btn w-10 h-10 text-[var(--nm-primary)] shadow-none active:shadow-inner"><Check size={24} /></button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-32">
        
        {/* Mood Section */}
        <div className="nm-card p-6 mb-6">
            <h3 className="font-bold text-[var(--nm-text)] mb-4 flex items-center gap-2">
                <Smile size={18} className="text-[var(--nm-primary)]" />
                How are you feeling?
            </h3>
            <div className="flex flex-wrap gap-3">
                {['Happy', 'Sad', 'Anxious', 'Calm', 'Tired', 'Energetic', 'Frustrated', 'Relaxed'].map(m => {
                    const isSelected = (log.mood || []).includes(m);
                    return (
                      <button
                          key={m}
                          onClick={() => {
                              const moods = log.mood || [];
                              const newMoods = moods.includes(m) ? moods.filter(x => x !== m) : [...moods, m];
                              updateLog({ mood: newMoods });
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              isSelected
                              ? 'nm-inset text-[var(--nm-primary)]'
                              : 'nm-btn text-[var(--nm-text-muted)]'
                          }`}
                      >
                          {m}
                      </button>
                    );
                })}
            </div>
        </div>

        {/* Symptoms Accordion */}
        <h3 className="font-bold text-[var(--nm-text)] mb-4 px-1">Symptoms</h3>
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {Object.entries(SYMPTOM_CATEGORIES).map(([category, items]) => {
                const isExpanded = expandedCategory === category;
                const Icon = CATEGORY_ICONS[category] || Activity;
                const activeCount = log.detailedSymptoms?.filter(s => s.category === category).length || 0;

                return (
                    <div key={category} className="nm-card overflow-hidden">
                        <button 
                            onClick={() => setExpandedCategory(isExpanded ? null : category)}
                            className="w-full p-4 flex items-center justify-between text-[var(--nm-text)]"
                        >
                            <div className="flex items-center gap-3">
                                <Icon size={18} className="text-[var(--nm-text-muted)]" />
                                <span className="font-medium">{category}</span>
                                {activeCount > 0 && (
                                    <span className="bg-[var(--nm-primary)] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{activeCount}</span>
                                )}
                            </div>
                            {isExpanded ? <ChevronUp size={16} className="text-[var(--nm-text-muted)]" /> : <ChevronDown size={16} className="text-[var(--nm-text-muted)]" />}
                        </button>
                        
                        {isExpanded && (
                            <div className="p-2 space-y-1 bg-[var(--nm-bg)]/50 border-t border-[rgba(255,255,255,0.4)]">
                                {items.map(item => {
                                    const intensity = getIntensity(item);
                                    return (
                                        <div key={item} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--nm-surface)] transition-colors">
                                            <span className="text-sm text-[var(--nm-text)] font-medium">{item}</span>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4].map(star => (
                                                    <button 
                                                        key={star}
                                                        onClick={() => handleSymptomChange(category, item, intensity === star ? 0 : star)}
                                                        className="focus:outline-none transition-transform active:scale-90"
                                                    >
                                                        <Star 
                                                            size={18} 
                                                            className={star <= intensity ? "text-[var(--nm-primary)] fill-[var(--nm-primary)] drop-shadow-sm" : "text-[var(--nm-text-muted)] opacity-30"} 
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default DailyLog;