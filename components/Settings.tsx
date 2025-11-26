import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet } from 'react-native';
import { Bell, Moon, Shield, Download, Upload, Trash2, ChevronRight, Lock, LogOut, FileText } from 'lucide-react-native';
import { UserProfile } from '../types';

interface SettingsProps {
  onExport: () => void;
  onImport: (file: any) => void;
  onDeleteData: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onOpenSecretVault: () => void;
  isVaultView?: boolean;
  user?: UserProfile | null;
  onUpdateUser?: (user: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  onExport, 
  onDeleteData, 
  isDarkMode, 
  onToggleDarkMode,
  onLogout,
  onOpenSecretVault,
  isVaultView
}) => {
  const containerStyle = { backgroundColor: isDarkMode ? '#111827' : '#FFF0F3' };
  const textStyle = { color: isDarkMode ? 'white' : '#2D2D2D' };
  const cardStyle = { backgroundColor: isDarkMode ? '#1F2937' : 'white', borderRadius: 16, padding: 16, marginBottom: 16 };

  if (isVaultView) {
      return (
          <View style={[styles.container, { backgroundColor: '#111827' }]}>
              <View style={{ padding: 24, paddingTop: 60, flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={onOpenSecretVault} style={{ padding: 8, backgroundColor: '#374151', borderRadius: 20, marginRight: 16 }}>
                      <ChevronRight color="white" style={{ transform: [{ rotate: '180deg' }] }} size={24} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Secret Vault</Text>
              </View>
              <Text style={{ color: '#9CA3AF', paddingHorizontal: 24 }}>Encrypted Area. Secure habits editing coming soon.</Text>
          </View>
      )
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={{ padding: 24, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between' }}>
         <Text style={[styles.header, textStyle]}>Settings</Text>
         <Bell color={isDarkMode ? 'white' : 'gray'} size={24} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 0 }}>
        
        <TouchableOpacity onPress={onOpenSecretVault} style={[cardStyle, { flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#374151' : '#1F2937' }]}>
            <View style={{ padding: 10, backgroundColor: '#374151', borderRadius: 25, marginRight: 16 }}>
                <Shield color="#E84C7C" size={24} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Secret Vault</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Encrypted Habits</Text>
            </View>
            <Lock color="#6B7280" size={20} />
        </TouchableOpacity>

        <View style={cardStyle}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <FileText color="#E84C7C" size={20} style={{ marginRight: 10 }} />
                <Text style={[{ fontWeight: '600', fontSize: 16 }, textStyle]}>Data Management</Text>
            </View>
            <TouchableOpacity onPress={onExport} style={styles.rowBtn}>
                <Download size={18} color="gray" />
                <Text style={[styles.rowText, textStyle]}>Export Data</Text>
            </TouchableOpacity>
        </View>

        <View style={cardStyle}>
            <Text style={[{ fontWeight: '600', fontSize: 16, marginBottom: 16 }, textStyle]}>Preferences</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Moon size={18} color="gray" />
                    <Text style={textStyle}>Dark Mode</Text>
                </View>
                <Switch value={isDarkMode} onValueChange={onToggleDarkMode} trackColor={{ false: '#767577', true: '#E84C7C' }} />
            </View>
        </View>

        <TouchableOpacity onPress={onLogout} style={[cardStyle, { flexDirection: 'row', gap: 12, justifyContent: 'center' }]}>
            <LogOut color="gray" size={20} />
            <Text style={{ fontWeight: '600', color: 'gray' }}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDeleteData} style={{ marginTop: 20, padding: 16, borderWidth: 1, borderColor: '#FECACA', borderRadius: 16, backgroundColor: '#FEF2F2', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
            <Trash2 color="#EF4444" size={20} />
            <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Delete All Data</Text>
        </TouchableOpacity>

        <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>KIMI is for tracking purposes only. Not medical advice.</Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>Privacy: Data stays on your device.</Text>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 32, fontWeight: 'bold' },
  rowBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  rowText: { fontSize: 14, fontWeight: '500' }
});

export default Settings;
