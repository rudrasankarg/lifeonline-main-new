// Finance Guard Screen - Premium Overhaul & SMS Threat Scanner
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
  Animated,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

// Simulated database of predatory lenders for the demo
const THREAT_DB = ['cashbean', 'kreditbee', 'moneyview', 'loanbaba', 'rupeemax'];

export default function FinanceScreen() {
  const [appName, setAppName] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  // SMS Scan State
  const [smsScanActive, setSmsScanActive] = useState(false);
  const [smsScanProgress, setSmsScanProgress] = useState(0);
  const [smsThreats, setSmsThreats] = useState(null);
  
  // EMI Calculator State
  const [loanAmt, setLoanAmt] = useState('');
  const [loanTenure, setLoanTenure] = useState('');
  const [emiResult, setEmiResult] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleManualScan = () => {
    if (!appName.trim() && !interestRate.trim()) return;
    setScanning(true);
    setScanResult(null);
    
    // Simulate API call
    setTimeout(() => {
      const name = appName.toLowerCase();
      if (THREAT_DB.includes(name) || parseFloat(interestRate) > 36) {
        setScanResult({ safe: false, msg: 'Predatory lending practices detected. Do not borrow.', apr: '120% - 300%' });
      } else if (name === 'sbi' || name === 'hdfc') {
        setScanResult({ safe: true, msg: 'Verified RBI-registered entity.', apr: '10.5% - 15%' });
      } else {
        setScanResult({ safe: false, msg: 'Unknown entity. High risk of fraud.', apr: 'Unknown' });
      }
      setScanning(false);
    }, 1500);
  };

  const calculateEMI = () => {
    const p = parseFloat(loanAmt);
    const r = parseFloat(interestRate);
    const n = parseFloat(loanTenure);
    if (!p || !r || !n) {
      Alert.alert('Missing Fields', 'Please enter Loan Amount, Interest Rate, and Tenure.');
      return;
    }
    
    const monthlyRate = r / 12 / 100;
    const emi = p * monthlyRate * (Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    
    setEmiResult({
      emi: Math.round(emi),
      totalInterest: Math.round((emi * n) - p),
      totalAmount: Math.round(emi * n)
    });
  };

  const startDeepDeviceScan = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          {
            title: 'SMS Access Required',
            message: 'Finance Guard needs to read your SMS messages to detect predatory loan traps.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Cannot perform device scan without SMS access.');
          return;
        }
      } catch (err) {
        console.warn(err);
      }
    }

    setSmsScanActive(true);
    setSmsThreats(null);
    setSmsScanProgress(0);

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
      ])
    ).start();

    // Fake progress simulation
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        pulseAnim.stopAnimation();
        setSmsScanActive(false);
        // Simulate finding a threat
        setSmsThreats([
          { sender: 'BW-CASHBN', text: 'Urgent: Your loan of Rs 50,000 is approved. Click bit.ly/cashbean to claim.', threat: 'CashBean' },
          { sender: 'AD-KRDIT', text: 'Get instant cash! 0 docs required. Download KreditBee now.', threat: 'KreditBee' }
        ]);
      }
      setSmsScanProgress(progress);
    }, 400);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.headerTitle}>Finance Guard</Text>
            <Text style={styles.headerSub}>Advanced Threat Protection</Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* SMS Threat Scanner */}
          <View style={[styles.card, styles.premiumCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Device Threat Scan</Text>
              <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
            </View>
            <Text style={styles.cardDesc}>
              Scan your inbox for predatory medical loan apps and emergency payday loans trying to trap you in high-interest debt cycles during a health crisis.
            </Text>

            {smsScanActive ? (
              <View style={styles.scanningBox}>
                <Animated.View style={[styles.radarCircle, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.scanningText}>Analyzing SMS Inbox...</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${smsScanProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>{smsScanProgress}%</Text>
              </View>
            ) : smsThreats ? (
              <View style={styles.threatsBox}>
                <View style={styles.threatHeader}>
                  <Text style={styles.threatCount}>⚠️ {smsThreats.length} Threats Detected</Text>
                </View>
                {smsThreats.map((t, i) => (
                  <View key={i} style={styles.threatItem}>
                    <Text style={styles.threatSender}>{t.sender}</Text>
                    <Text style={styles.threatMsg}>"{t.text}"</Text>
                    <View style={styles.actionRow}>
                      <Text style={styles.threatTag}>Identified: {t.threat}</Text>
                      <TouchableOpacity style={styles.blockBtn}>
                        <Text style={styles.blockBtnText}>Block & Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.reScanBtn} onPress={() => setSmsThreats(null)}>
                  <Text style={styles.reScanText}>Clear Scan</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.scanBtn} onPress={startDeepDeviceScan} activeOpacity={0.8}>
                <Text style={styles.scanBtnText}>Start Deep Scan</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Manual Safety Scanner */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Manual App Check</Text>
            <Text style={styles.cardDesc}>Enter details of a lender to verify their RBI registration status.</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lender / App Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. CashBean"
                placeholderTextColor="#94A3B8"
                value={appName}
                onChangeText={setAppName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Promised Interest Rate (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 12"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={interestRate}
                onChangeText={setInterestRate}
              />
            </View>

            <TouchableOpacity style={styles.checkBtn} onPress={handleManualScan} disabled={scanning} activeOpacity={0.8}>
              {scanning ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkBtnText}>Verify Lender</Text>}
            </TouchableOpacity>

            {scanResult && (
              <View style={[styles.resultBox, scanResult.safe ? styles.resultSafe : styles.resultDanger]}>
                <Text style={[styles.resultTitle, scanResult.safe ? {color: '#10B981'} : {color: '#EF4444'}]}>
                  {scanResult.safe ? '✅ Verified Safe' : '⚠️ Danger Detected'}
                </Text>
                <Text style={styles.resultMsg}>{scanResult.msg}</Text>
                <View style={styles.resultMeta}>
                  <Text style={styles.resultMetaText}>Estimated APR: {scanResult.apr}</Text>
                </View>
              </View>
            )}
          </View>

          {/* EMI Calculator */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>EMI & Interest Calculator</Text>
            <Text style={styles.cardDesc}>Calculate your monthly payments to avoid debt traps.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Loan Amount (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={loanAmt}
                onChangeText={setLoanAmt}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Interest Rate (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 12"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={interestRate}
                  onChangeText={setInterestRate}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Tenure (Months)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 24"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={loanTenure}
                  onChangeText={setLoanTenure}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.calcBtn} onPress={calculateEMI} activeOpacity={0.8}>
              <Text style={styles.calcBtnText}>Calculate EMI</Text>
            </TouchableOpacity>

            {emiResult && (
              <View style={styles.emiResultBox}>
                <View style={styles.emiMainBox}>
                  <Text style={styles.emiMainLabel}>Monthly EMI</Text>
                  <Text style={styles.emiMainVal}>₹{emiResult.emi.toLocaleString()}</Text>
                </View>
                <View style={styles.emiStatsRow}>
                  <View style={styles.emiStatItem}>
                    <Text style={styles.emiStatLabel}>Total Interest</Text>
                    <Text style={styles.emiStatVal}>₹{emiResult.totalInterest.toLocaleString()}</Text>
                  </View>
                  <View style={styles.emiStatItem}>
                    <Text style={styles.emiStatLabel}>Total Amount</Text>
                    <Text style={styles.emiStatVal}>₹{emiResult.totalAmount.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Safe Borrowing Directory */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Safe Medical Loan Directory</Text>
            <Text style={styles.cardDesc}>Verified, RBI-approved lenders for emergency medical expenses with low interest rates.</Text>
            
            <View style={{ marginBottom: 16 }}>
              <View style={styles.lenderItem}>
                <Text style={styles.lenderName}>Arogya Finance</Text>
                <Text style={styles.lenderMeta}>Interest: 0% - 12% | Instant Approval</Text>
              </View>
              <View style={styles.lenderItem}>
                <Text style={styles.lenderName}>SBI Sanjeevani</Text>
                <Text style={styles.lenderMeta}>Interest: 10.5% | Govt. Backed</Text>
              </View>
              <View style={styles.lenderItem}>
                <Text style={styles.lenderName}>CareCredit India</Text>
                <Text style={styles.lenderMeta}>Interest: 12% - 15% | Partner Hospitals Only</Text>
              </View>
            </View>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' }, // Light gray/blue background
  scroll: { padding: 20, paddingBottom: 100, paddingTop: 40 },
  
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  headerIconBox: {
    width: 50, height: 50, borderRadius: 16, backgroundColor: '#ECFDF5', // Light emerald
    borderWidth: 1, borderColor: '#A7F3D0',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  headerIcon: { fontSize: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: 0.5 },
  headerSub: { fontSize: 13, color: '#059669', fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  premiumCard: {
    backgroundColor: '#F8FAFF',
    borderColor: '#C7D2FE',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  proBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#C7D2FE' },
  proBadgeText: { color: '#4F46E5', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cardDesc: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 20 },

  scanBtn: { backgroundColor: '#4F46E5', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  scanBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  scanningBox: { alignItems: 'center', paddingVertical: 20 },
  radarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EEF2FF', borderWidth: 2, borderColor: '#818CF8', marginBottom: 16 },
  scanningText: { color: '#4F46E5', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  progressBarBg: { width: '100%', height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 3 },
  progressText: { color: '#475569', fontSize: 12, fontWeight: '700' },

  threatsBox: { marginTop: 10 },
  threatHeader: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' },
  threatCount: { color: '#DC2626', fontWeight: '700', fontSize: 14 },
  threatItem: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#94A3B8', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  threatSender: { color: '#0F172A', fontSize: 12, fontWeight: '800', marginBottom: 4, letterSpacing: 0.5 },
  threatMsg: { color: '#475569', fontSize: 13, lineHeight: 20, fontStyle: 'italic', marginBottom: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  threatTag: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
  blockBtn: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  blockBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  reScanBtn: { alignSelf: 'center', marginTop: 10, padding: 10 },
  reScanText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },

  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#475569', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, color: '#0F172A', fontSize: 15 },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between' },
  checkBtn: { backgroundColor: '#10B981', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 8 },
  checkBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  calcBtn: { backgroundColor: '#3B82F6', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 8 },
  calcBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  emiResultBox: { marginTop: 20, padding: 16, borderRadius: 16, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  emiMainBox: { alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#DBEAFE' },
  emiMainLabel: { color: '#1E3A8A', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  emiMainVal: { color: '#1D4ED8', fontSize: 28, fontWeight: '800' },
  emiStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  emiStatItem: { alignItems: 'center', flex: 1 },
  emiStatLabel: { color: '#60A5FA', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  emiStatVal: { color: '#1E3A8A', fontSize: 15, fontWeight: '700' },

  resultBox: { marginTop: 20, padding: 16, borderRadius: 16, borderWidth: 1 },
  resultSafe: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  resultDanger: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  resultTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  resultMsg: { color: '#334155', fontSize: 14, lineHeight: 22, marginBottom: 12 },
  resultMeta: { backgroundColor: 'rgba(0,0,0,0.04)', padding: 10, borderRadius: 8 },
  resultMetaText: { color: '#475569', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  lenderItem: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  lenderName: { color: '#0F172A', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  lenderMeta: { color: '#64748B', fontSize: 13, fontWeight: '500' }
});
