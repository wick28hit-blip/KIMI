import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { CycleHistory } from '../types';
import { format, parseISO } from 'date-fns';
import { CheckCircle } from 'lucide-react-native';

interface CalibrationPopupProps {
  history: CycleHistory[];
  onConfirm: () => void;
  onSave: (updatedHistory: CycleHistory[]) => void;
}

const CalibrationPopup: React.FC<CalibrationPopupProps> = ({ history, onConfirm }) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Calibration</Text>
        </View>
        <ScrollView style={{ padding: 16 }}>
            {history.map((h, i) => (
                <View key={i} style={styles.row}>
                    <Text style={{ fontSize: 16, color: '#2D2D2D' }}>{format(parseISO(h.startDate), 'MMM d')}</Text>
                    <CheckCircle color="#E84C7C" size={20} />
                </View>
            ))}
            <TouchableOpacity onPress={onConfirm} style={styles.btn}>
                <Text style={styles.btnText}>Yes, Accurate</Text>
            </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modal: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', maxHeight: 400 },
    header: { backgroundColor: '#E84C7C', padding: 16, alignItems: 'center' },
    headerTitle: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    row: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderColor: '#eee', alignItems: 'center' },
    btn: { backgroundColor: '#E84C7C', padding: 16, borderRadius: 12, marginTop: 20, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default CalibrationPopup;
