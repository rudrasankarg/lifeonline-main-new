// Home Screen – SOS button + navigation hub
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { triggerSOS } from '../services/api';
import { useTheme } from '../theme/ThemeContext';

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [lastSOS, setLastSOS] = useState(null);

  // Pulse animations for SOS button
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse1, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulse1, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulse2, { toValue: 1.3, duration: 1500, delay: 200, useNativeDriver: true }),
          Animated.timing(pulse2, { toValue: 1, duration: 1500, delay: 200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pulse3, { toValue: 1.5, duration: 1500, delay: 400, useNativeDriver: true }),
          Animated.timing(pulse3, { toValue: 1, duration: 1500, delay: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
        ])
      ])
    ).start();
  }, []);

  // ── SOS Handler ──────────────────────────────────────────────────────────
  const handleSOS = async () => {
    Alert.alert(
      '🚨 SOS Emergency',
      'This will call an ambulance (108) and share your live location. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'YES, SEND SOS',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              let location = { latitude: 0, longitude: 0 };

              if (status === 'granted') {
                const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                location = {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                };
              }

              const res = await triggerSOS({
                userId: 'demo-user',
                location,
                emergencyContacts: [{ name: 'Emergency Contact', phone: '+91-9999999999' }],
              });

              setLastSOS(res.data);
              await Linking.openURL('tel:108');
            } catch (err) {
              console.error('[SOS ERROR]', err.message);
              Alert.alert('Note', 'Could not reach server, but calling ambulance now.');
              Linking.openURL('tel:108');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // ── Quick action cards ────────────────────────────────────────────────────
  const cards = [
    {
      id: 'chat',
      icon: '■',
      label: 'Talk to AI',
      sub: 'Instant health guidance',
      color: '#8B5CF6',
      bg: '#F5F3FF',
      screen: 'Chat',
    },
    {
      id: 'symptoms',
      icon: '▲',
      label: 'Check Symptoms',
      sub: 'AI-powered triage',
      color: '#F59E0B',
      bg: '#FFFBEB',
      screen: 'Symptoms',
    },
    {
      id: 'doctor',
      icon: '◆',
      label: 'Find Doctor',
      sub: 'Match by specialty',
      color: '#10B981',
      bg: '#ECFDF5',
      screen: 'Doctor',
    },
    {
      id: 'video',
      icon: '●',
      label: 'Video Call',
      sub: 'Connect instantly',
      color: '#F43F5E',
      bg: '#FFF1F2',
      screen: 'Doctor',
    },
    {
      id: 'finance',
      icon: '⬟',
      label: 'Finance Guard',
      sub: 'Safe borrowing guide',
      color: '#0EA5E9',
      bg: '#F0F9FF',
      screen: 'Finance',
    },
    {
      id: 'schedule',
      icon: '◫',
      label: 'Book Appointment',
      sub: 'Schedule a visit',
      color: '#6366F1',
      bg: '#EEF2FF',
      screen: 'Doctor',
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.primary }]}>lifeOnLine<Text style={styles.greetingDot}>.</Text></Text>
            <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>Your health companion, 24/7</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.badge, { backgroundColor: isDark ? colors.surface : '#ECFDF5', borderColor: isDark ? colors.border : '#A7F3D0' }]}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={[styles.badgeText, { color: colors.success }]}>System Live</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ padding: 8, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SOS Button Area */}
        <View style={styles.sosContainer}>
          <Animated.View style={[styles.sosRing3, { opacity: glow, transform: [{ scale: pulse3 }] }]} />
          <Animated.View style={[styles.sosRing2, { opacity: glow, transform: [{ scale: pulse2 }] }]} />
          <Animated.View style={[styles.sosRing1, { opacity: glow, transform: [{ scale: pulse1 }] }]} />
          
          <TouchableOpacity
            style={styles.sosButton}
            onPress={handleSOS}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <View style={styles.sosInnerBox}>
                <Text style={styles.sosText}>SOS</Text>
                <Text style={styles.sosSub}>TAP FOR EMERGENCY</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {lastSOS && (
          <View style={[styles.sosConfirm, { backgroundColor: colors.surface, borderColor: colors.success }]}>
            <Text style={[styles.sosConfirmText, { color: colors.success }]}>
              ✅ Alert sent successfully. Ambulance (108) is being called.
            </Text>
          </View>
        )}

        {/* Action Cards */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Essential Services</Text>
        </View>

        <View style={styles.cardGrid}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate(card.screen)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cardLabel, { color: colors.primary }]}>{card.label}</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{card.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency tip */}
        <View style={[styles.tipBox, { backgroundColor: isDark ? colors.surface : '#FEF2F2', borderColor: isDark ? colors.border : '#FECACA' }]}>
          <View style={styles.tipTextContainer}>
            <Text style={[styles.tipTitle, { color: isDark ? colors.danger : '#991B1B' }]}>Medical Emergency?</Text>
            <Text style={[styles.tipText, { color: isDark ? colors.textSecondary : '#B91C1C' }]}>
              In case of severe chest pain, difficulty breathing, or stroke symptoms, press SOS immediately.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 60, paddingTop: 60 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  greeting: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  greetingDot: { color: '#0D9488' },
  subGreeting: { fontSize: 14, marginTop: 4, fontWeight: '500' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },

  // SOS Redesign
  sosContainer: { alignItems: 'center', marginVertical: 30, height: 260, justifyContent: 'center' },
  sosRing3: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  sosRing2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  sosRing1: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  sosButton: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#EF4444', // Red-500
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 4,
    borderColor: '#FCA5A5' // Soft red border
  },
  sosInnerBox: { alignItems: 'center', justifyContent: 'center' },
  sosText: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: 2, marginBottom: 2 },
  sosSub: { fontSize: 9, color: '#FEE2E2', fontWeight: '800', letterSpacing: 1 },

  sosConfirm: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  sosConfirmText: { fontSize: 14, textAlign: 'center', fontWeight: '700' },

  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },

  // Polished Cards
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 32 },
  card: {
    width: '48%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardLabel: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  cardSub: { fontSize: 12, fontWeight: '500', lineHeight: 16 },

  // Emergency Tip Box
  tipBox: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  tipTextContainer: { flex: 1 },
  tipTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  tipText: { fontSize: 13, lineHeight: 20, fontWeight: '500' },
});
