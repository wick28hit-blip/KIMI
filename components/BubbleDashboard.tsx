
import React, { useRef, useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { calculateCycle } from '../utils/calculations';
import { CycleData } from '../types';
import { motion, useAnimation, PanInfo } from 'framer-motion';

interface BubbleProps {
  cycleData: CycleData;
}

// --- Water Animation Components ---

const WaterFill = ({ isDragging, color }: { isDragging: boolean; color: string }) => {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-full z-0 pointer-events-none">
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-0 opacity-90"
        initial={{ bottom: "-10%" }}
        animate={{ 
          bottom: isDragging ? "90%" : "45%",
        }}
        transition={{ 
          type: "spring", 
          stiffness: 40, 
          damping: 10 
        }}
      >
        {/* Layer 1: Deep Water (Darker) */}
        <motion.div
            className={`w-[200%] h-[200%] absolute left-[-50%] ${color} brightness-75 opacity-90`}
            style={{ borderRadius: "40%" }}
            animate={{ 
                rotate: 360,
                borderRadius: ["40%", "45%", "40%"]
            }}
            transition={{ 
                rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                borderRadius: { duration: 5, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
            }}
        />
        
        {/* Layer 2: Mid Water (Base Color) */}
        <motion.div
            className={`w-[200%] h-[200%] absolute left-[-50%] top-[5%] ${color} opacity-90`}
            style={{ borderRadius: "38%" }}
            animate={{ 
                rotate: -360,
                borderRadius: ["38%", "43%", "38%"]
            }}
            transition={{ 
                rotate: { duration: 13, repeat: Infinity, ease: "linear" },
                borderRadius: { duration: 6, repeat: Infinity, ease: "easeInOut", repeatType: "mirror", delay: 1 }
            }}
        />

        {/* Layer 3: Surface Highlights (Lighter/Gradient) */}
        <motion.div
            className={`w-[200%] h-[200%] absolute left-[-50%] top-[8%] bg-gradient-to-t from-transparent via-${color.replace('bg-', '')}/50 to-white/20`}
            style={{ borderRadius: "42%" }}
            animate={{ 
                rotate: 360,
                borderRadius: ["42%", "35%", "42%"]
            }}
            transition={{ 
                rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                borderRadius: { duration: 4, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }
            }}
        />
      </motion.div>
    </div>
  );
};

// --- Draggable Bubble Wrapper ---

interface BubbleNodeProps {
  children?: React.ReactNode;
  className?: string;
  style?: any;
  dragTransition?: any;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const BubbleNode = ({ 
  children, 
  className = "", 
  style = {},
  dragTransition = { bounceStiffness: 600, bounceDamping: 20 },
  onDragStart,
  onDragEnd
}: BubbleNodeProps) => {
  return (
    <motion.div 
      drag
      dragSnapToOrigin={true}
      dragElastic={0.1}
      dragTransition={dragTransition}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={style}
      className={`${className} cursor-grab active:cursor-grabbing relative`}
      whileTap={{ scale: 0.95 }}
    >
        {children}
    </motion.div>
  );
};

// --- Main Dashboard ---

const BubbleDashboard: React.FC<BubbleProps> = ({ cycleData }) => {
  const calc = calculateCycle(cycleData);
  const constraintsRef = useRef(null);

  // Interaction States for Water Effect
  const [dragState, setDragState] = useState({
    nextPeriod: false,
    ends: false,
    ovulation: false
  });

  if (!calc) return null;

  const daysUntilPeriod = differenceInDays(calc.nextPeriodDate, new Date());
  const isPeriodNow = daysUntilPeriod <= 0 && differenceInDays(calc.nextPeriodEnd, new Date()) >= 0;
  
  // Use new Prediction Window
  const accuracyText = calc.predictionWindow 
    ? `± ${calc.predictionWindow.accuracyDays} day${calc.predictionWindow.accuracyDays > 1 ? 's' : ''}` 
    : '';

  const setDragging = (key: keyof typeof dragState, isDragging: boolean) => {
    setDragState(prev => ({ ...prev, [key]: isDragging }));
  };

  return (
    <div ref={constraintsRef} className="relative h-96 w-full flex items-center justify-center overflow-visible my-6">
      
      {/* Top Center-Left - Next Period (Primary Bubble) */}
      <div className="absolute top-[-10px] left-[57%] -translate-x-1/2 z-20 w-64 h-64">
        <BubbleNode 
            className="w-full h-full"
            onDragStart={() => setDragging('nextPeriod', true)}
            onDragEnd={() => setDragging('nextPeriod', false)}
        >
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 3.3, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full rounded-full relative overflow-hidden flex flex-col items-center justify-center text-white border-4 border-white/20 dark:border-gray-700/30"
            style={{
                background: 'radial-gradient(100% 100% at 30% 30%, rgba(255, 105, 150, 0.8) 0%, rgba(232, 76, 124, 0.9) 100%)',
                boxShadow: `
                  inset -10px -10px 20px rgba(180, 50, 90, 0.8),
                  inset 10px 10px 20px rgba(255, 255, 255, 0.4),
                  inset 0 0 0 2px rgba(255, 255, 255, 0.2),
                  0 20px 40px rgba(232, 76, 124, 0.4)
                `,
                backdropFilter: 'blur(8px)'
            }}
          >
            <WaterFill isDragging={dragState.nextPeriod} color="bg-[#E84C7C]" />
            
            {/* Glare */}
            <div className="absolute top-6 left-6 w-16 h-8 bg-gradient-to-br from-white/90 to-transparent rounded-full blur-[2px] opacity-80 z-10 rotate-[-15deg]" />

            <div className="relative z-20 flex flex-col items-center drop-shadow-lg">
                <span className="text-sm font-medium uppercase tracking-wider opacity-90 mb-1 pointer-events-none">
                    {isPeriodNow ? 'Period Day' : 'Next Period'}
                </span>
                <span className="text-4xl font-bold pointer-events-none">
                    {format(calc.nextPeriodDate, 'MMM d')}
                </span>
                <span className="text-lg opacity-90 font-medium mt-1 pointer-events-none">
                    {isPeriodNow 
                    ? `Day ${Math.abs(daysUntilPeriod) + 1}` 
                    : `${daysUntilPeriod} days left`}
                </span>
                
                {/* Accuracy Badge */}
                {!isPeriodNow && (
                    <div className="mt-2 bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm pointer-events-none">
                        {accuracyText}
                    </div>
                )}
            </div>
          </motion.div>
        </BubbleNode>
      </div>

      {/* Bottom Left - Period End / Length */}
      <div className="absolute bottom-4 left-4 z-10 w-32 h-32">
        <BubbleNode 
            className="w-full h-full"
            onDragStart={() => setDragging('ends', true)}
            onDragEnd={() => setDragging('ends', false)}
        >
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 3.9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="w-full h-full rounded-full relative overflow-hidden flex flex-col items-center justify-center text-[#2D2D2D] dark:text-gray-900 border-2 border-white/40 dark:border-gray-600/40"
            style={{
                background: 'radial-gradient(100% 100% at 30% 30%, rgba(255, 255, 255, 0.95) 0%, rgba(240, 240, 240, 0.9) 100%)',
                boxShadow: `
                  inset -5px -5px 15px rgba(0, 0, 0, 0.1),
                  inset 5px 5px 15px rgba(255, 255, 255, 1),
                  0 15px 30px rgba(0, 0, 0, 0.1),
                  0 0 0 1px rgba(255,255,255,0.5)
                `,
                backdropFilter: 'blur(10px)'
            }}
          >
            <WaterFill isDragging={dragState.ends} color="bg-gray-200 dark:bg-gray-300" />
            
             {/* Glare */}
             <div className="absolute top-4 left-4 w-8 h-4 bg-gradient-to-br from-white to-transparent rounded-full blur-[1px] opacity-90 z-10 rotate-[-15deg]" />

            <div className="relative z-20 flex flex-col items-center">
                <span className="text-xs text-gray-600 font-bold pointer-events-none">Ends</span>
                <span className="text-xl font-bold text-[#E84C7C] pointer-events-none drop-shadow-sm">
                    {format(calc.nextPeriodEnd, 'MMM d')}
                </span>
                <span className="text-[10px] text-gray-600 mt-1 pointer-events-none font-medium">
                    {cycleData.periodDuration} Days long
                </span>
            </div>
          </motion.div>
        </BubbleNode>
      </div>

      {/* Bottom Right - Ovulation (Adjusted Position) */}
      <div className="absolute bottom-12 left-[85%] -translate-x-1/2 z-10 w-36 h-36">
        <BubbleNode 
            className="w-full h-full"
            onDragStart={() => setDragging('ovulation', true)}
            onDragEnd={() => setDragging('ovulation', false)}
        >
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="w-full h-full rounded-full relative overflow-hidden flex flex-col items-center justify-center text-white border-2 border-white/30 dark:border-indigo-400/30"
            style={{
                background: 'radial-gradient(100% 100% at 30% 30%, rgba(140, 150, 220, 0.9) 0%, rgba(123, 134, 203, 0.95) 100%)',
                boxShadow: `
                  inset -5px -5px 20px rgba(80, 90, 160, 0.8),
                  inset 5px 5px 20px rgba(255, 255, 255, 0.4),
                  0 15px 35px rgba(123, 134, 203, 0.3),
                  0 0 0 1px rgba(255,255,255,0.3)
                `,
                backdropFilter: 'blur(8px)'
            }}
          >
             <WaterFill isDragging={dragState.ovulation} color="bg-[#7B86CB]" />

             {/* Glare */}
             <div className="absolute top-5 left-5 w-10 h-5 bg-gradient-to-br from-white/90 to-transparent rounded-full blur-[1px] opacity-80 z-10 rotate-[-15deg]" />

            <div className="relative z-20 flex flex-col items-center drop-shadow-md">
                <span className="text-xs font-medium opacity-90 pointer-events-none">Ovulation</span>
                <span className="text-xl font-bold mt-1 pointer-events-none">
                    {format(calc.ovulationDate, 'MMM d')}
                </span>
                <span className="text-[10px] mt-1 bg-white/20 px-2 py-0.5 rounded text-center pointer-events-none backdrop-blur-md shadow-sm">
                    High Fertility
                </span>
            </div>
          </motion.div>
        </BubbleNode>
      </div>
    </div>
  );
};

export default BubbleDashboard;
