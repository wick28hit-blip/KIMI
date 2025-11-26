import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { User, Briefcase, ChevronLeft } from 'lucide-react-native';
import { UserProfile, CycleData } from '../types';
import PinLock from './PinLock';
import ScrollPicker from './ScrollPicker';

interface OnboardingProps {
  onComplete: (user: UserProfile, cycle: CycleData) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  
  const currentYear = new Date().getFullYear();
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); 
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [cycleLength, setCycleLength] = useState(28);
  const [periodDuration, setPeriodDuration] = useState(5);
  const [isPro, setIsPro] = useState(false);

  const defaultHabits = {
      smoking: { value: false },
      alcohol: { value: false },
      sleep: { value: true },
      stress: { value: false },
      exercise: { value: true }
  };

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(0, s - 1));

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
      { val: 1, label: 'Jan' }, { val: 2, label: 'Feb' }, { val: 3, label: 'Mar' },
      { val: 4, label: 'Apr' }, { val: 5, label: 'May' }, { val: 6, label: 'Jun' },
      { val: 7, label: 'Jul' }, { val: 8, label: 'Aug' }, { val: 9, label: 'Sep' },
      { val: 10, label: 'Oct' }, { val: 11, label: 'Nov' }, { val: 12, label: 'Dec' }
  ];
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const cycleLengths = Array.from({ length: 31 }, (_, i) => i + 20);
  const periodDurations = Array.from({ length: 14 }, (_, i) => i + 2);

  const getLastPeriodDate = () => {
     const d = String(selectedDay).padStart(2, '0');
     const m = String(selectedMonth).padStart(2, '0');
     return `${selectedYear}-${m}-${d}`;
  };

  if (step === 0) {
      return (
          <View style={styles.container}>
              <Text style={styles.title}>Welcome to KIMI</Text>
              <View style={styles.inputContainer}>
                  <User color="gray" size={20} />
                  <TextInput 
                    placeholder="What's your name?" 
                    value={name} 
                    onChangeText={setName} 
                    style={styles.input} 
                    placeholderTextColor="gray"
                  />
              </View>
              <TouchableOpacity onPress={next} style={styles.btn}>
                  <Text style={styles.btnText}>Continue</Text>
              </TouchableOpacity>
          </View>
      )
  }

  if (step === 1) {
      return (
          <View style={styles.container}>
              <TouchableOpacity onPress={back} style={styles.backBtn}><ChevronLeft color="#E84C7C" size={24} /></TouchableOpacity>
              <Text style={[styles.title, { marginTop: 40 }]}>Cycle Details</Text>
              
              <Text style={styles.label}>Last Period Start Date</Text>
              <View style={styles.rowPicker}>
                  <View style={{ flex: 1 }}>
                     <ScrollPicker items={days} value={selectedDay} onChange={setSelectedDay} height={120} />
                  </View>
                  <View style={{ flex: 1 }}>
                     <ScrollPicker items={months} value={months.find(m => m.val === selectedMonth)!} onChange={(m) => setSelectedMonth(m.val)} formatLabel={(m) => m.label} height={120} />
                  </View>
                  <View style={{ flex: 1 }}>
                     <ScrollPicker items={years} value={selectedYear} onChange={setSelectedYear} height={120} />
                  </View>
              </View>

              <Text style={styles.label}>Cycle Length (Days)</Text>
              <View style={{ height: 100 }}>
                  <ScrollPicker items={cycleLengths} value={cycleLength} onChange={setCycleLength} height={100} />
              </View>

              <Text style={styles.label}>Period Duration (Days)</Text>
              <View style={{ height: 100 }}>
                   <ScrollPicker items={periodDurations} value={periodDuration} onChange={setPeriodDuration} height={100} />
              </View>
              
              <TouchableOpacity onPress={next} style={[styles.btn, { marginTop: 20 }]}>
                  <Text style={styles.btnText}>Next</Text>
              </TouchableOpacity>
          </View>
      )
  }

  if (step === 2) {
       return (
          <View style={styles.container}>
               <TouchableOpacity onPress={back} style={styles.backBtn}><ChevronLeft color="#E84C7C" size={24} /></TouchableOpacity>
               <Text style={styles.title}>Lifestyle</Text>
               <TouchableOpacity onPress={() => setIsPro(!isPro)} style={[styles.card, isPro && { borderColor: '#E84C7C', borderWidth: 2 }]}>
                   <Briefcase color="#E84C7C" size={32} />
                   <Text style={{ fontWeight: 'bold', fontSize: 18, marginLeft: 16, color: '#2D2D2D' }}>Working Professional</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={next} style={styles.btn}>
                  <Text style={styles.btnText}>Continue</Text>
              </TouchableOpacity>
          </View>
       )
  }

  if (step === 3) {
      return (
          <PinLock 
            isSetup 
            onSuccess={(pin) => {
                onComplete(
                    { name, isProfessional: isPro, pin, habits: defaultHabits }, 
                    { lastPeriodDate: getLastPeriodDate(), cycleLength, periodDuration, history: [], lifestyleOffset: 0 }
                );
            }} 
          />
      )
  }

  return <View />;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F3', padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#E84C7C', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  input: { flex: 1, marginLeft: 10, fontSize: 18, color: '#2D2D2D' },
  btn: { backgroundColor: '#E84C7C', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  label: { color: 'gray', marginBottom: 8, marginTop: 10, fontWeight: '600' },
  card: { backgroundColor: 'white', padding: 24, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  rowPicker: { flexDirection: 'row', gap: 5, height: 120, marginBottom: 10 }
});

export default Onboarding;
