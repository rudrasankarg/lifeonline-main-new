import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { FONTS, SPACING, RADIUS } from '../theme';

export default function SettingsScreen() {
  const { isDark, toggleTheme, colors } = useTheme();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: SPACING.md,
      paddingBottom: SPACING.xxl,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.lg,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    sectionTitle: {
      color: colors.primary,
      fontSize: FONTS.sizes.lg,
      fontWeight: 'bold',
      marginBottom: SPACING.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: SPACING.sm,
    },
    rowText: {
      color: colors.textPrimary,
      fontSize: FONTS.sizes.md,
      fontWeight: '600',
    },
    rowSubText: {
      color: colors.textMuted,
      fontSize: FONTS.sizes.sm,
      marginTop: 2,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      padding: SPACING.md,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      marginTop: SPACING.sm,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    saveBtnText: {
      color: isDark ? '#0F172A' : '#FFFFFF',
      fontWeight: 'bold',
      fontSize: FONTS.sizes.md,
    },
    savedText: {
      color: colors.success,
      fontWeight: 'bold',
      fontSize: FONTS.sizes.sm,
      textAlign: 'center',
      marginTop: 8,
    }
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: SPACING.md }}>
              <Text style={styles.rowText}>Dark Mode</Text>
              <Text style={styles.rowSubText}>Switch between light and dark themes</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor={isDark ? '#E2E8F0' : '#FFFFFF'}
            />
          </View>
        </View>

        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Preferences</Text>
          </TouchableOpacity>
          {saved && <Text style={styles.savedText}>✓ Saved Successfully</Text>}
        </View>

      </ScrollView>
    </View>
  );
}
