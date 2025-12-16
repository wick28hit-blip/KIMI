import React, { useRef, useState, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface CircularSliderProps {
  value: number; // 0 to 10
  onChange: (val: number) => void;
  label: string;
  size?: number;
  color?: string;
  minLabel?: string;
  maxLabel?: string;
}

const CircularSlider: React.FC<CircularSliderProps> = ({ 
  value, 
  onChange, 
  label, 
  size = 280, 
  color = '#E84C7C',
  minLabel = 'Low',
  maxLabel = 'High'
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const startAngle = 135;
  const endAngle = 405;
  const angleRange = endAngle - startAngle;

  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  const angleToCoord = (angleInDegrees: number, r: number = radius) => {
    const angleInRadians = angleInDegrees * (Math.PI / 180);
    const x = center + r * Math.cos(angleInRadians);
    const y = center + r * Math.sin(angleInRadians);
    return { x, y };
  };

  const handleInteraction = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left - center;
    const y = clientY - rect.top - center;

    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    let relativeAngle = angle - startAngle;
    if (relativeAngle < 0) relativeAngle += 360;

    let newValue = 0;

    if (relativeAngle <= angleRange) {
        newValue = (relativeAngle / angleRange) * 10;
    } else {
        const distToStart = 360 - relativeAngle;
        const distToEnd = relativeAngle - angleRange;
        if (distToStart < distToEnd) {
            newValue = 0;
        } else {
            newValue = 10;
        }
    }

    const rounded = Math.round(newValue);
    if (rounded !== value) {
        onChange(rounded);
        triggerHaptic('light');
    }
  };

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    handleInteraction(clientX, clientY);
    triggerHaptic('light');
  };

  const handleMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); 
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleInteraction(e.clientX, e.clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const currentAngle = startAngle + (value / 10) * angleRange;
  const knobPos = angleToCoord(currentAngle);
  
  const startCoord = angleToCoord(startAngle);
  const endCoord = angleToCoord(endAngle);
  const largeArcFlag = angleRange > 180 ? 1 : 0;
  const activeEndCoord = knobPos;
  const activeLargeArc = (currentAngle - startAngle) > 180 ? 1 : 0;

  const labelRadius = radius + 35; 
  const minLabelPos = angleToCoord(startAngle, labelRadius);
  const maxLabelPos = angleToCoord(endAngle, labelRadius);

  return (
    <div className="flex flex-col items-center select-none touch-none">
        <h3 className="text-xl font-bold text-[#2D2D2D] dark:text-white mb-2">{label}</h3>
        <span className="text-5xl font-bold text-[#E84C7C] mb-8">{value}</span>
        
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg 
                ref={svgRef}
                width={size} 
                height={size} 
                className="cursor-pointer outline-none"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    {/* Updated for 'Dense 3D' look: Deeper offset, higher opacity */}
                    <filter id="trackInset">
                        <feOffset dx="6" dy="8" />
                        <feGaussianBlur stdDeviation="7" result="offset-blur" />
                        <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                        <feFlood floodColor="black" floodOpacity="0.4" result="color" />
                        <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                        <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                    </filter>
                </defs>

                {/* Background Track - Neumorphic Inset */}
                <path
                    d={`M ${startCoord.x} ${startCoord.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endCoord.x} ${endCoord.y}`}
                    fill="none"
                    stroke="#F3F4F6"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    filter="url(#trackInset)"
                    className="dark:stroke-gray-800"
                />

                {/* Active Progress Track */}
                {value > 0 && (
                     <path
                        d={`M ${startCoord.x} ${startCoord.y} A ${radius} ${radius} 0 ${activeLargeArc} 1 ${activeEndCoord.x} ${activeEndCoord.y}`}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        filter="url(#glow)"
                    />
                )}

                {/* Knob - Protruding (High Elevation Shadow) */}
                <circle
                    cx={knobPos.x}
                    cy={knobPos.y}
                    r={strokeWidth / 1.5}
                    fill="white"
                    stroke={color}
                    strokeWidth={4}
                    className="shadow-lg transition-transform active:scale-95"
                    style={{ filter: 'drop-shadow(8px 8px 16px rgba(0,0,0,0.4))' }}
                />
            </svg>
            
            <div 
                className="absolute text-xs font-bold text-gray-400 pointer-events-none"
                style={{ 
                    left: minLabelPos.x, 
                    top: minLabelPos.y,
                    transform: 'translate(-50%, -50%)'
                }}
            >
                {minLabel}
            </div>
             <div 
                className="absolute text-xs font-bold text-gray-400 pointer-events-none"
                style={{ 
                    left: maxLabelPos.x, 
                    top: maxLabelPos.y,
                    transform: 'translate(-50%, -50%)'
                }}
            >
                {maxLabel}
            </div>
        </div>
        <p className="text-sm text-gray-400 mt-6">Touch and drag the ring</p>
    </div>
  );
};

export default CircularSlider;