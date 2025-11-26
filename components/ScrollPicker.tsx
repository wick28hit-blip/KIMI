import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface ScrollPickerProps<T> {
  items: T[];
  value: T;
  onChange: (value: T) => void;
  formatLabel?: (item: T) => string | number;
  height?: number;
  itemHeight?: number;
}

function ScrollPicker<T>({
  items,
  value,
  onChange,
  formatLabel = (i) => String(i),
  height = 150,
  itemHeight = 50,
}: ScrollPickerProps<T>) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isMomentumScrolling, setIsMomentumScrolling] = useState(false);

  useEffect(() => {
    // Initial scroll to selected index
    const index = items.indexOf(value);
    if (index !== -1 && scrollViewRef.current) {
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: index * itemHeight, animated: false });
        }, 100);
    }
  }, []); 

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    if (index >= 0 && index < items.length) {
      const newItem = items[index];
      if (newItem !== value) {
        onChange(newItem);
      }
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <View 
        style={[
          styles.selectionOverlay, 
          { 
            top: (height - itemHeight) / 2, 
            height: itemHeight 
          }
        ]} 
        pointerEvents="none"
      />

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollBegin={() => setIsMomentumScrolling(true)}
        onMomentumScrollEnd={(e) => {
            setIsMomentumScrolling(false);
            handleScrollEnd(e);
        }}
        onScrollEndDrag={(e) => {
            if (!isMomentumScrolling) {
                handleScrollEnd(e);
            }
        }}
        contentContainerStyle={{
          paddingVertical: (height - itemHeight) / 2
        }}
      >
        {items.map((item, index) => {
          const isSelected = item === value;
          return (
            <View 
              key={index} 
              style={[
                styles.itemContainer, 
                { height: itemHeight }
              ]}
            >
              <Text 
                style={[
                  styles.itemText, 
                  isSelected ? styles.selectedText : styles.unselectedText
                ]}
              >
                {formatLabel(item)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  selectionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(232, 76, 124, 0.3)',
    zIndex: 10,
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 18,
  },
  selectedText: {
    color: '#E84C7C',
    fontWeight: 'bold',
    fontSize: 20,
  },
  unselectedText: {
    color: '#9CA3AF',
    opacity: 0.6,
  }
});

export default ScrollPicker;
