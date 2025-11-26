
import React, { useState } from 'react';
import { CycleHistory } from '../types';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { CheckCircle2, Pencil, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface CalibrationPopupProps {
  history: CycleHistory[];
  onConfirm: () => void;
  onSave: (updatedHistory: CycleHistory[]) => void;
  onAdjust?: () => void; // Kept for backward compatibility if needed, but UI now handles toggle
}

const CalibrationPopup: React.FC<CalibrationPopupProps> = ({ history, onConfirm, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localHistory, setLocalHistory] = useState<CycleHistory[]>(history);

  const handleDateChange = (index: number, value: string) => {
    const updated = [...localHistory];
    
    // Calculate original duration to preserve it when shifting start date
    const oldStart = parseISO(updated[index].startDate);
    const oldEnd = parseISO(updated[index].endDate);
    const duration = differenceInDays(oldEnd, oldStart);

    const newStart = parseISO(value);
    
    if (!isNaN(newStart.getTime())) {
        updated[index] = {
            ...updated[index],
            startDate: value,
            endDate: format(addDays(newStart, duration), 'yyyy-MM-dd')
        };
    }
    
    setLocalHistory(updated);
  };

  const handleSaveInternal = () => {
      onSave(localHistory);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-pink-100 dark:border-gray-700"
      >
        <div className="bg-[#E84C7C] p-6 text-white text-center relative">
          <h2 className="text-xl font-bold mb-1">{isEditing ? 'Adjust Cycle Dates' : 'Calibration Check'}</h2>
          <p className="text-pink-100 text-sm">
            {isEditing ? 'Edit start dates to match your history' : 'Based on your info, here is your predicted history'}
          </p>
          {isEditing && (
              <button 
                onClick={() => setIsEditing(false)} 
                className="absolute top-4 right-4 p-1 bg-white/20 rounded-full hover:bg-white/40"
              >
                  <X size={16} />
              </button>
          )}
        </div>

        <div className="p-6">
          <div className="space-y-4 mb-6">
            {localHistory.map((cycle, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-pink-50 dark:bg-gray-700/50 rounded-xl border border-pink-100 dark:border-gray-600">
                <div className="flex flex-col w-full">
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Month {index + 1} ago</span>
                  
                  {isEditing ? (
                      <div className="flex items-center gap-2">
                          <input 
                            type="date" 
                            value={cycle.startDate}
                            onChange={(e) => handleDateChange(index, e.target.value)}
                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-800 dark:text-white focus:outline-none focus:border-[#E84C7C] w-full"
                          />
                          <span className="text-gray-400 text-xs">- {differenceInDays(parseISO(cycle.endDate), parseISO(cycle.startDate))}d</span>
                      </div>
                  ) : (
                    <span className="text-[#2D2D2D] dark:text-white font-medium flex items-center gap-2">
                        {format(parseISO(cycle.startDate), 'MMM d')} - {format(parseISO(cycle.endDate), 'MMM d')}
                    </span>
                  )}
                </div>
                {!isEditing && (
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center text-[#E84C7C] shrink-0 ml-3">
                        <CheckCircle2 size={18} />
                    </div>
                )}
              </div>
            ))}
          </div>

          {!isEditing ? (
            <>
                <p className="text-center text-gray-600 dark:text-gray-300 text-sm mb-6">
                    Does this match your experience?
                </p>

                <div className="flex gap-3">
                    <button 
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                    <Pencil size={16} /> Adjust
                    </button>
                    <button 
                    onClick={onConfirm}
                    className="flex-1 py-3 bg-[#E84C7C] text-white rounded-xl font-bold shadow-lg shadow-pink-200 dark:shadow-none hover:bg-pink-600 transition-colors"
                    >
                    Yes, Accurate
                    </button>
                </div>
            </>
          ) : (
             <button 
                onClick={handleSaveInternal}
                className="w-full py-3 bg-[#E84C7C] text-white rounded-xl font-bold shadow-lg shadow-pink-200 dark:shadow-none hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} /> Save & Confirm
             </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CalibrationPopup;
