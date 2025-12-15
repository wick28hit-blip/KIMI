import React, { useRef, useEffect, UIEvent } from 'react';

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
  height = 200,
  itemHeight = 50,
  className = '',
  // Default to the original Pink styling if not provided
  highlightClass = 'border-t border-b border-[#E84C7C]/20 bg-white/20 backdrop-blur-sm',
  selectedItemClass = 'text-[#E84C7C] font-bold text-xl scale-110 opacity-100',
  itemClass = 'text-gray-400 text-lg scale-95 opacity-40 blur-[0.5px]'
}: ScrollPickerProps<T>) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  // Scroll to selected value on mount or when value changes externally
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
    
    // Calculate index based on scroll position + half item height for better centering detection
    const index = Math.round(scrollTop / itemHeight);
    
    if (index >= 0 && index < items.length) {
      const newItem = items[index];
      if (newItem !== value) {
        onChange(newItem);
      }
    }

    // Reset scrolling flag after a delay to allow external updates again
    clearTimeout((target as any)._scrollTimeout);
    (target as any)._scrollTimeout = setTimeout(() => {
      isScrolling.current = false;
    }, 150);
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ 
        height: height,
        // CSS Mask for smooth fade out at top and bottom without using solid colors
        maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)'
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
        className="h-full overflow-y-scroll no-scrollbar scroll-smooth wheel-snap py-[calc(50%-25px)] relative z-10"
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
              className={`flex items-center justify-center transition-all duration-300 wheel-item ${
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