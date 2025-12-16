import React, { useRef, useEffect, UIEvent } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface ScrollPickerProps<T> {
  items: T[];
  value: T;
  onChange: (value: T) => void;
  formatLabel?: (item: T) => string | number;
  height?: number;
  itemHeight?: number;
  className?: string;
  // Custom Style Props
  highlightClass?: string;
  selectedItemClass?: string;
  itemClass?: string;
}

const ScrollPicker = <T,>({
  items,
  value,
  onChange,
  formatLabel = (i) => String(i),
  height = 120, // Reduced default height (3 items visible at 40px)
  itemHeight = 40, 
  className = '',
  // Default to the original Pink styling if not provided
  highlightClass = 'border-t border-b border-[#E84C7C]/20 bg-white/20 backdrop-blur-sm',
  selectedItemClass = 'text-[#E84C7C] font-bold text-xl scale-110 opacity-100',
  itemClass = 'text-gray-400 text-lg scale-95 opacity-40 blur-[0.5px]'
}: ScrollPickerProps<T>) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<any>(null);

  // Scroll to selected value on mount or when value changes externally (and user isn't scrolling)
  useEffect(() => {
    if (scrollRef.current && !isScrolling.current) {
      const index = items.indexOf(value);
      if (index !== -1) {
        scrollRef.current.scrollTop = index * itemHeight;
      }
    }
  }, [value, items, itemHeight]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    isScrolling.current = true;
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    
    // Calculate index based on scroll position
    // Adding 0.5 helps trigger the change closer to the center line
    const index = Math.round(scrollTop / itemHeight);
    
    if (index >= 0 && index < items.length) {
      const newItem = items[index];
      if (newItem !== value) {
        onChange(newItem);
        triggerHaptic('light');
      }
    }

    // Reset scrolling flag after a delay to allow external updates again
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false;
      // Force alignment if it drifted slightly (optional, but good for polish)
      if (Math.abs(scrollTop - index * itemHeight) > 1) {
          target.scrollTo({ top: index * itemHeight, behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <div 
      className={`relative overflow-hidden touch-none select-none ${className}`}
      style={{ 
        height: height,
        // CSS Mask for smooth fade out at top and bottom
        maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)'
      }}
    >
      {/* Selection Highlight */}
      <div 
        className={`absolute w-full pointer-events-none z-0 ${highlightClass}`}
        style={{ 
          top: (height - itemHeight) / 2, 
          height: itemHeight 
        }}
      />

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll no-scrollbar scroll-smooth wheel-snap relative z-10 overscroll-contain"
        style={{ 
          scrollSnapType: 'y mandatory',
          paddingTop: (height - itemHeight) / 2,
          paddingBottom: (height - itemHeight) / 2
        }}
      >
        {items.map((item, index) => {
          const isSelected = item === value;
          return (
            <div
              key={index}
              className={`flex items-center justify-center transition-all duration-200 wheel-item ${
                isSelected 
                  ? selectedItemClass
                  : itemClass
              }`}
              style={{ 
                height: itemHeight,
                scrollSnapAlign: 'center'
              }}
            >
              {formatLabel(item)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScrollPicker;