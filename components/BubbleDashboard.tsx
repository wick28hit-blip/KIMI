import React, { useRef } from 'react';
import { format, differenceInDays } from 'date-fns';
import { calculateCycle } from '../utils/calculations';
import { CycleData } from '../types';
import { motion } from 'framer-motion';

interface BubbleProps {
  cycleData: CycleData;
}

const BubbleDashboard: React.FC<BubbleProps> = ({ cycleData }) => {
  const calc = calculateCycle(cycleData);
  const constraintsRef = useRef(null);

  if (!calc) return null;

  const daysUntilPeriod = differenceInDays(calc.nextPeriodDate, new Date());
  const isPeriodNow = daysUntilPeriod <= 0 && differenceInDays(calc.nextPeriodEnd, new Date()) >= 0;

  return (
    <div ref={constraintsRef} className="relative h-96 w-full flex items-center justify-center overflow-visible my-6">
      
      {/* Top Center-Left - Next Period (Primary Bubble) */}
      <motion.div 
        drag
        dragConstraints={constraintsRef}
        dragSnapToOrigin={true}
        dragElastic={0.05}
        dragTransition={{ bounceStiffness: 200, bounceDamping: 20 }}
        style={{ x: '-50%' }}
        className="absolute top-[-10px] left-[30%] w-64 h-64 z-20 cursor-grab active:cursor-grabbing"
      >
        <motion.div
          animate={{ 
            y: [0, -20, 0],
          }}
          transition={{ 
            duration: 3.3,
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full h-full rounded-full bg-gradient-to-br from-[#E84C7C] to-[#F47B9C] shadow-xl shadow-pink-200/50 dark:shadow-pink-900/20 flex flex-col items-center justify-center text-white backdrop-blur-sm border-4 border-white/20 dark:border-gray-800/30"
        >
          <span className="text-sm font-medium uppercase tracking-wider opacity-90 mb-1 pointer-events-none">
            {isPeriodNow ? 'Period Day' : 'Next Period'}
          </span>
          
          {/* Date Display (Large) */}
          <span className="text-4xl font-bold pointer-events-none">
            {format(calc.nextPeriodDate, 'MMM d')}
          </span>
          
          {/* Countdown Display (Small) */}
          <span className="text-lg opacity-90 font-medium mt-1 pointer-events-none">
            {isPeriodNow 
              ? `Day ${Math.abs(daysUntilPeriod) + 1}` 
              : `${daysUntilPeriod} days left`}
          </span>
        </motion.div>
      </motion.div>

      {/* Bottom Left - Period End / Length */}
      <motion.div 
        drag
        dragConstraints={constraintsRef}
        dragSnapToOrigin={true}
        dragElastic={0.05}
        dragTransition={{ bounceStiffness: 200, bounceDamping: 20 }}
        className="absolute bottom-4 left-4 w-32 h-32 z-10 cursor-grab active:cursor-grabbing"
      >
        <motion.div
          animate={{ 
            y: [0, -20, 0],
          }}
          transition={{ 
            duration: 3.9,
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 0.5
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full h-full rounded-full bg-white dark:bg-gray-800 shadow-lg flex flex-col items-center justify-center text-[#2D2D2D] dark:text-gray-200 border border-pink-100 dark:border-gray-700"
        >
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium pointer-events-none">Ends</span>
          <span className="text-xl font-bold text-[#E84C7C] pointer-events-none">
            {format(calc.nextPeriodEnd, 'MMM d')}
          </span>
          <span className="text-[10px] text-gray-400 mt-1 pointer-events-none">
            {cycleData.periodDuration} Days long
          </span>
        </motion.div>
      </motion.div>

      {/* Bottom Right - Ovulation (Adjusted Position & Speed) */}
      <motion.div 
        drag
        dragConstraints={constraintsRef}
        dragSnapToOrigin={true}
        dragElastic={0.05}
        dragTransition={{ bounceStiffness: 200, bounceDamping: 20 }}
        style={{ x: '-50%' }}
        className="absolute bottom-12 left-[60%] w-36 h-36 z-10 cursor-grab active:cursor-grabbing"
      >
        <motion.div
          animate={{ 
            y: [0, -20, 0],
          }}
          transition={{ 
            duration: 4.4,
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full h-full rounded-full bg-[#7B86CB] dark:bg-[#5C6BC0] shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/20 flex flex-col items-center justify-center text-white opacity-90"
        >
          <span className="text-xs font-medium opacity-80 pointer-events-none">Ovulation</span>
          <span className="text-xl font-bold mt-1 pointer-events-none">
            {format(calc.ovulationDate, 'MMM d')}
          </span>
          <span className="text-[10px] mt-1 bg-white/20 px-2 py-0.5 rounded text-center pointer-events-none">
            High Fertility
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default BubbleDashboard;