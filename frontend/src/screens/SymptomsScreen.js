// Symptoms Screen – text input + AI triage analysis
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { analyzeSymptoms } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

// Severity → visual config mapping
const SEVERITY_CONFIG = {
  low: {
    color: COLORS.severityLow,
    label: 'Low Severity',
    bg: '#F0FDF4',
    indicator: 'LOW',
  },
  medium: {
    color: COLORS.severityMedium,
    label: 'Moderate Severity',
    bg: '#FFFBEB',
    indicator: 'MODERATE',
  },
  high: {
    color: COLORS.severityHigh,
    label: 'High Severity',
    bg: '#FFF5F5',
    indicator: 'HIGH',
  },
};

const ACTION_CONFIG = {
  chat: { label: 'Continue with AI Chat', screen: 'Chat' },
  consult: { label: 'See a Doctor', screen: 'Doctor' },
  video_call: { label: 'Start Video Call Now', screen: 'Doctor' },
};

const SYMPTOM_CHIPS = [
  'Fever', 'Headache', 'Chest pain', 'Shortness of breath',
  'Dizziness', 'Nausea', 'Back pain', 'Fatigue',
];

export default function SymptomsScreen({ navigation }) {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!symptoms.trim() || symptoms.trim().length < 3) {
      setError('Please describe your symptoms in a few words.');
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const res = await analyzeSymptoms(symptoms.trim());
      setResult(res.data);
    } catch (err) {
      setError('Failed to analyse symptoms. Please try again or contact a doctor directly.');
    } finally {
      setLoading(false);
    }
  };

  const addChip = (chip) => {
    setSymptoms((prev) => (prev ? `${prev}, ${chip}` : chip));
  };

  const sevConfig = result ? SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.medium : null;
  const actConfig = result ? ACTION_CONFIG[result.action] || ACTION_CONFIG.consult : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.title}>Symptom Checker</Text>
        <Text style={styles.subtitle}>Describe what you're experiencing and our AI will assess severity.</Text>

        <Text style={styles.chipTitle}>Common symptoms</Text>
        <View style={styles.chipRow}>
          {SYMPTOM_CHIPS.map((chip) => (
            <TouchableOpacity key={chip} style={styles.chip} onPress={() => addChip(chip)}>
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            value={symptoms}
            onChangeText={(t) => { setSymptoms(t); setError(null); }}
            placeholder="e.g. severe chest pain and shortness of breath for 2 hours..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{symptoms.length}/500</Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
          onPress={handleAnalyze}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.analyzeBtnText}>Analyse Symptoms</Text>
          )}
        </TouchableOpacity>

        {result && sevConfig && actConfig && (
          <View style={[styles.resultCard, { borderColor: sevConfig.color + '40', backgroundColor: sevConfig.bg }]}>
            <View style={styles.resultHeader}>
              <View style={[styles.severityDot, { backgroundColor: sevConfig.color }]}>
                <Text style={styles.severityDotText}>{sevConfig.indicator}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.resultSeverity, { color: sevConfig.color }]}>{sevConfig.label}</Text>
                <Text style={styles.resultDept}>
                  Recommended:{' '}
                  <Text style={{ color: COLORS.textPrimary, fontWeight: '600' }}>
                    {result.recommended_specialty || result.department || 'General'}
                  </Text>
                </Text>
              </View>
            </View>

            {result.explanation && (
              <Text style={styles.explanation}>{result.explanation}</Text>
            )}

            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: result.severity === 'low' ? '33%' : result.severity === 'medium' ? '66%' : '100%',
                    backgroundColor: sevConfig.color,
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              style={[styles.ctaBtn, { backgroundColor: sevConfig.color }]}
              onPress={() => navigation.navigate(actConfig.screen, { department: result.recommended_specialty || result.department || 'General', severity: result.severity, severity_score: result.severity_score })}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaBtnText}>{actConfig.label}</Text>
            </TouchableOpacity>

            {result.severity === 'high' && (
              <Text style={styles.urgentNote}>
                If this is a life-threatening emergency, press the{' '}
                <Text style={{ color: COLORS.danger, fontWeight: '700' }}>SOS</Text> button immediately.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },

  title: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.sm },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.lg, lineHeight: 20 },

  chipTitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, fontWeight: '600', marginBottom: SPACING.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  chip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },

  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  input: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    minHeight: 110,
    lineHeight: 22,
  },
  charCount: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, textAlign: 'right', marginTop: 4 },

  errorText: { color: COLORS.danger, fontSize: FONTS.sizes.sm, marginBottom: SPACING.sm },

  analyzeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnText: { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: '700' },

  // Result
  resultCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  severityDot: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityDotText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  resultSeverity: { fontSize: FONTS.sizes.lg, fontWeight: '700' },
  resultDept: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2 },

  explanation: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, lineHeight: 20 },

  progressBg: { height: 6, backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: RADIUS.full },

  ctaBtn: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  ctaBtnText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700' },

  urgentNote: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});
