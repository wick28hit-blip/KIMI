import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CycleData } from '../types';
import { format, differenceInDays } from 'date-fns';
import { calculateCycle } from '../utils/calculations';
import { LinearGradient } from 'expo-linear-gradient';

interface BubbleProps {
  cycleData: CycleData;
  isDarkMode?: boolean;
}

const BubbleDashboard: React.FC<BubbleProps> = ({ cycleData, isDarkMode }) => {
  const calc = calculateCycle(cycleData);
  if (!calc) return null;

  const daysUntilPeriod = differenceInDays(calc.nextPeriodDate, new Date());
  const isPeriodNow = daysUntilPeriod <= 0 && differenceInDays(calc.nextPeriodEnd, new Date()) >= 0;
  const accuracyText = calc.predictionWindow ? `± ${calc.predictionWindow.accuracyDays} days` : '';

  return (
    <View style={styles.container}>
      {/* Next Period Bubble */}
      <View style={[styles.bubble, { top: 20, left: '50%', transform: [{ translateX: -70 }], width: 240, height: 240 }]}>
         <LinearGradient
            colors={['rgba(255, 105, 150, 0.9)', 'rgba(232, 76, 124, 1)']}
            style={styles.gradient}
         >
            <Text style={[styles.label, { color: 'white' }]}>{isPeriodNow ? 'Period Day' : 'Next Period'}</Text>
            <Text style={[styles.date, { color: 'white', fontSize: 36 }]}>{format(calc.nextPeriodDate, 'MMM d')}</Text>
            <Text style={[styles.sub, { color: 'white' }]}>{isPeriodNow ? 'Today' : `${daysUntilPeriod} days left`}</Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 4, borderRadius: 4, marginTop: 4 }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{accuracyText}</Text>
            </View>
         </LinearGradient>
      </View>

      {/* Ends Bubble */}
      <View style={[styles.bubble, { bottom: 20, left: 20, width: 120, height: 120 }]}>
         <LinearGradient
            colors={isDarkMode ? ['#374151', '#1F2937'] : ['#FFFFFF', '#F3F4F6']}
            style={styles.gradient}
         >
            <Text style={[styles.label, { color: isDarkMode ? '#D1D5DB' : '#6B7280' }]}>Ends</Text>
            <Text style={[styles.date, { color: '#E84C7C', fontSize: 20 }]}>{format(calc.nextPeriodEnd, 'MMM d')}</Text>
         </LinearGradient>
      </View>

      {/* Ovulation Bubble */}
      <View style={[styles.bubble, { bottom: 40, right: 20, width: 140, height: 140 }]}>
         <LinearGradient
            colors={['#818CF8', '#6366F1']}
            style={styles.gradient}
         >
             <Text style={[styles.label, { color: 'white' }]}>Ovulation</Text>
             <Text style={[styles.date, { color: 'white', fontSize: 24 }]}>{format(calc.ovulationDate, 'MMM d')}</Text>
             <Text style={{ color: 'white', fontSize: 10, marginTop: 4 }}>High Fertility</Text>
         </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { height: 350, width: '100%', position: 'relative' },
  bubble: { position: 'absolute', borderRadius: 999, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  date: { fontWeight: 'bold', marginVertical: 4 },
  sub: { fontSize: 16, fontWeight: '500' }
});

export default BubbleDashboard;
