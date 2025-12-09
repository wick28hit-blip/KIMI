import React, { useRef, useState, useEffect } from 'react';

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

  // Configuration for a speedometer style arc
  // 0 degrees = Right (3 o'clock)
  // 90 degrees = Bottom (6 o'clock)
  // 135 degrees = Bottom Left (7:30 o'clock) - START
  // 270 degrees = Top (12 o'clock)
  // 405 degrees = Bottom Right (4:30 o'clock) - END (45 degrees)
  const startAngle = 135;
  const endAngle = 405;
  const angleRange = endAngle - startAngle; // 270 degrees

  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Helper: degrees to SVG coordinates
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

    // Calculate angle in degrees (0-360, 0=Right, 90=Down)
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    // Map angle to progress
    // We want 135deg -> 0%
    // 405deg (45deg) -> 100%
    
    // Shift angles so 135 is 0
    let relativeAngle = angle - startAngle;
    if (relativeAngle < 0) relativeAngle += 360;

    // relativeAngle now:
    // 0 = Start (135deg)
    // 270 = End (405deg)
    // > 270 = Dead Zone

    let newValue = 0;

    if (relativeAngle <= angleRange) {
        // Inside active range
        newValue = (relativeAngle / angleRange) * 10;
    } else {
        // In dead zone, snap to nearest end
        const distToStart = 360 - relativeAngle; // distance to 0 (360)
        const distToEnd = relativeAngle - angleRange; // distance to 270
        if (distToStart < distToEnd) {
            newValue = 0;
        } else {
            newValue = 10;
        }
    }

    onChange(Math.round(newValue));
  };

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    handleInteraction(clientX, clientY);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling while interacting
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
      e.preventDefault(); // Critical for smooth drag on mobile
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

  // Current Knob Position
  const currentAngle = startAngle + (value / 10) * angleRange;
  const knobPos = angleToCoord(currentAngle);
  
  // Track Paths
  const startCoord = angleToCoord(startAngle);
  const endCoord = angleToCoord(endAngle);
  // SVG Arc: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
  // sweep-flag 1 = clockwise
  const largeArcFlag = angleRange > 180 ? 1 : 0;

  // Active Arc Path (from start to current)
  const activeEndCoord = knobPos;
  const activeLargeArc = (currentAngle - startAngle) > 180 ? 1 : 0;

  // Calculate Label Positions (slightly outside radius)
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
                {/* Defs for gradients/shadows */}
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Background Track */}
                <path
                    d={`M ${startCoord.x} ${startCoord.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endCoord.x} ${endCoord.y}`}
                    fill="none"
                    stroke="#F3F4F6"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    className="dark:stroke-gray-700"
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

                {/* Knob */}
                <circle
                    cx={knobPos.x}
                    cy={knobPos.y}
                    r={strokeWidth / 1.5}
                    fill="white"
                    stroke={color}
                    strokeWidth={4}
                    className="shadow-lg"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                />
            </svg>
            
            {/* Labels - Absolutely positioned based on calculated coords */}
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