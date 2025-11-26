import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';

interface PinLockProps {
  expectedPin?: string;
  onSuccess: (pin: string) => void;
  onReset?: () => void;
  isSetup?: boolean;
  loginError?: boolean;
  onClearLoginError?: () => void;
}

const PinLock: React.FC<PinLockProps> = ({ 
  expectedPin, 
  onSuccess, 
  onReset, 
  isSetup = false,
  loginError = false,
  onClearLoginError
}) => {
  const [pin, setPin] = useState('');
  const [internalError, setInternalError] = useState(false);

  const handleNumClick = (num: number) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setInternalError(false);
      if (onClearLoginError) onClearLoginError();
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setInternalError(false);
    if (onClearLoginError) onClearLoginError();
  };

  useEffect(() => {
    if (loginError) {
      setInternalError(true);
      setTimeout(() => setPin(''), 500);
    }
  }, [loginError]);

  useEffect(() => {
    if (pin.length === 4) {
      if (isSetup) {
        onSuccess(pin);
      } else {
        if (expectedPin) {
          if (pin === expectedPin) {
            onSuccess(pin);
          } else {
            setInternalError(true);
            setTimeout(() => setPin(''), 500);
          }
        } else {
          onSuccess(pin);
        }
      }
    }
  }, [pin, expectedPin, isSetup, onSuccess]);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Lock color="#E84C7C" size={32} />
      </View>
      
      <Text style={styles.title}>{isSetup ? 'Create a PIN' : 'Welcome Back'}</Text>
      <Text style={styles.subtitle}>{isSetup ? 'Secure your data' : 'Enter your PIN'}</Text>

      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i < pin.length ? (internalError || loginError ? 'red' : '#E84C7C') : '#E5E7EB' }
            ]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity key={num} onPress={() => handleNumClick(num)} style={styles.key}>
            <Text style={styles.keyText}>{num}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.emptyKey} />
        <TouchableOpacity onPress={() => handleNumClick(0)} style={styles.key}>
            <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={styles.key}>
            <Text style={styles.deleteText}>Del</Text>
        </TouchableOpacity>
      </View>

      {!isSetup && onReset && (
        <TouchableOpacity onPress={onReset}>
            <Text style={styles.resetText}>Reset App</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F3', justifyContent: 'center', alignItems: 'center' },
  iconContainer: { backgroundColor: 'white', padding: 16, borderRadius: 50, marginBottom: 24, elevation: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2D2D2D', marginBottom: 8 },
  subtitle: { color: '#6B7280', marginBottom: 32 },
  dotsContainer: { flexDirection: 'row', gap: 16, marginBottom: 48 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  keypad: { width: 280, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 24 },
  key: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  emptyKey: { width: 70, height: 70 },
  keyText: { fontSize: 24, fontWeight: '600', color: '#374151' },
  deleteText: { fontSize: 16, color: '#6B7280' },
  resetText: { marginTop: 40, color: '#9CA3AF', textDecorationLine: 'underline' }
});

export default PinLock;
