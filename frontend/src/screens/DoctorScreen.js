// Doctor Recommendation Screen – show matched doctor and start video call
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, Alert, Modal
} from 'react-native';
import { matchDoctor, createSession } from '../services/api';
import { db } from '../services/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

const SPECIALTY_ABBR = {
  general: 'GP', cardiology: 'CARD', neurology: 'NEURO', orthopedics: 'ORTHO',
  psychiatry: 'PSY', pediatrics: 'PED', dermatology: 'DERM', emergency: 'ER',
};

export default function DoctorScreen({ route, navigation }) {
  const department = route?.params?.department || 'general';
  const severity = route?.params?.severity || 'medium';
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Scheduling state
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [doctorAvailable, setDoctorAvailable] = useState(true);

  useEffect(() => { fetchDoctor(); }, [department]);

  const fetchDoctor = async () => {
    setLoading(true); setError(null);
    try {
      const res = await matchDoctor(department);
      const docData = res.data.doctor;
      setDoctor(docData);
      
      // Check if doctor accepts appointments (web availability toggle)
      if (docData?.id) {
        try {
          const dSnap = await getDoc(doc(db, 'doctors', docData.id));
          if (dSnap.exists() && dSnap.data().available === false) {
            setDoctorAvailable(false);
          } else {
            setDoctorAvailable(true);
          }
        } catch(e) {}
      }
    } catch (err) {
      if (err?.response?.status === 409) {
        setError('No doctor is online on the web portal right now. Ask a doctor to sign in on the website and stay on dashboard.');
      } else {
        setError(err?.userMessage || err?.response?.data?.error || 'Could not reach backend. Please check server/tunnel port and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartVideoCall = async () => {
    if (!doctor) return;
    setSessionLoading(true);
    try {
      const userId = `patient-${Date.now().toString(36)}`;
      const res = await createSession({
        doctorId: doctor.id,
        userId,
        department,
        severity,
        patientName: 'Patient',
      });

      const session = res?.data?.session;
      if (!session?.sessionId) {
        throw new Error('Session could not be created.');
      }

      const assignedDoctor = {
        ...doctor,
        id: session.doctorId || doctor.id,
        name: session.doctorName || doctor.name,
        email: session.doctorEmail || doctor.email,
        image: session.doctorPhoto || doctor.image,
      };

      navigation.navigate('VideoCall', { session, doctor: assignedDoctor });
    } catch (err) {
      Alert.alert(
        'Unable to start call',
        err?.userMessage || err?.response?.data?.error || err?.message || 'No doctor is currently available online. Please try again shortly.'
      );
    } finally { setSessionLoading(false); }
  };

  const handleBookAppointment = async (slotTimeMs) => {
    if (!doctor) return;
    setScheduleLoading(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        doctorId: doctor.id,
        patientName: 'Patient ' + Math.floor(Math.random() * 1000), // Mock patient name
        reason: `${department.charAt(0).toUpperCase() + department.slice(1)} Consultation (Severity: ${severity})`,
        timestamp: slotTimeMs,
        createdAt: Date.now()
      });
      setShowSchedule(false);
      Alert.alert('Success', 'Your appointment has been successfully scheduled. The doctor will see it on their portal.');
    } catch (err) {
      Alert.alert('Error', 'Failed to book appointment. Please try again later.');
    } finally {
      setScheduleLoading(false);
    }
  };

  const generateSlots = () => {
    const slots = [];
    let now = new Date();
    // Add a slot for tomorrow morning
    let tmrw = new Date(now);
    tmrw.setDate(tmrw.getDate() + 1);
    tmrw.setHours(10, 0, 0, 0);
    slots.push(tmrw.getTime());

    // Add a slot for tomorrow afternoon
    let tmrwAft = new Date(tmrw);
    tmrwAft.setHours(14, 30, 0, 0);
    slots.push(tmrwAft.getTime());

    // Add a slot for day after tomorrow
    let nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 2);
    nextDay.setHours(11, 0, 0, 0);
    slots.push(nextDay.getTime());

    return slots;
  };

  const sevColor = severity === 'high' ? COLORS.danger : severity === 'medium' ? COLORS.warning : COLORS.success;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Doctor Match</Text>
        <Text style={styles.subtitle}>
          Recommended:{' '}
          <Text style={{ color: COLORS.primary, fontWeight: '700' }}>
            {department.charAt(0).toUpperCase() + department.slice(1)}
          </Text>{' '}
          specialist
        </Text>

        <View style={[styles.sevBadge, { backgroundColor: sevColor + '15', borderColor: sevColor + '30' }]}>
          <View style={[styles.sevDot, { backgroundColor: sevColor }]} />
          <Text style={[styles.sevText, { color: sevColor }]}>
            {severity.toUpperCase()} SEVERITY
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Finding best available doctor...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchDoctor}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : doctor ? (
          <>
            <View style={styles.card}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarAbbr}>
                  {SPECIALTY_ABBR[doctor.specialty] || 'Dr'}
                </Text>
              </View>
              <Text style={styles.name}>{doctor.name}</Text>
              <Text style={styles.spec}>
                {(doctor.specialty || '').charAt(0).toUpperCase() + (doctor.specialty || '').slice(1)} Specialist
              </Text>
              <View style={styles.metaRow}>
                {[
                  { val: doctor.experience || '10 yrs', lbl: 'Experience' },
                  { val: `${doctor.rating || 4.8} / 5`, lbl: 'Rating' },
                  { val: doctor.availability ? 'Available' : 'Busy', lbl: 'Status',
                    col: doctor.availability ? COLORS.success : COLORS.danger },
                ].map((m, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={styles.divider} />}
                    <View style={styles.metaItem}>
                      <Text style={[styles.metaVal, m.col && { color: m.col }]}>{m.val}</Text>
                      <Text style={styles.metaLbl}>{m.lbl}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
              {doctor.consultFee !== undefined && (
                <View style={styles.feeRow}>
                  <Text style={styles.feeLbl}>Consultation Fee</Text>
                  <Text style={styles.feeVal}>{doctor.consultFee === 0 ? 'FREE' : `\u20B9${doctor.consultFee}`}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.videoBtn} onPress={handleStartVideoCall} disabled={sessionLoading}>
              {sessionLoading ? <ActivityIndicator color="#fff" /> :
                <Text style={styles.videoBtnTxt}>Start Video Consultation</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.scheduleBtn, !doctorAvailable && { opacity: 0.5 }]} 
              onPress={() => setShowSchedule(true)} 
              disabled={!doctorAvailable}
            >
              <Text style={styles.scheduleBtnTxt}>
                {doctorAvailable ? 'Schedule Appointment' : 'Not Accepting Appointments'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat')}>
              <Text style={styles.chatBtnTxt}>Chat with AI First</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.refreshBtn} onPress={fetchDoctor}>
              <Text style={styles.refreshTxt}>Find another doctor</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>

      {/* Appointment Scheduling Modal */}
      <Modal visible={showSchedule} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Appointment Time</Text>
            <Text style={styles.modalSub}>Available slots for Dr. {doctor?.name?.split(' ')[0]}</Text>
            
            {generateSlots().map((slotMs, idx) => {
              const dateStr = new Date(slotMs).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              const timeStr = new Date(slotMs).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              return (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.slotBtn}
                  onPress={() => handleBookAppointment(slotMs)}
                  disabled={scheduleLoading}
                >
                  <Text style={styles.slotDate}>{dateStr}</Text>
                  <Text style={styles.slotTime}>{timeStr}</Text>
                </TouchableOpacity>
              );
            })}

            {scheduleLoading && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 10 }} />}

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSchedule(false)}>
              <Text style={styles.cancelBtnTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.sm },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 4, marginBottom: SPACING.md },
  sevBadge: {
    alignSelf: 'flex-start', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    marginBottom: SPACING.lg, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1,
  },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  sevText: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  center: { alignItems: 'center', padding: SPACING.xxl, gap: SPACING.md },
  loadingText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  errText: { color: COLORS.danger, textAlign: 'center', fontSize: FONTS.sizes.sm, lineHeight: 20 },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, borderRadius: RADIUS.full },
  retryText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.lg, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.lg, ...SHADOWS.card,
  },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md, borderWidth: 2, borderColor: COLORS.primary + '40',
  },
  avatarAbbr: { fontSize: 13, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  name: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  spec: { fontSize: FONTS.sizes.sm, color: COLORS.primary, marginTop: 4, marginBottom: SPACING.lg },
  metaRow: {
    flexDirection: 'row', width: '100%', justifyContent: 'space-around',
    paddingVertical: SPACING.md, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: COLORS.border, marginBottom: SPACING.md,
  },
  metaItem: { alignItems: 'center', gap: 4 },
  metaVal: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.textPrimary },
  metaLbl: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  divider: { width: 1, backgroundColor: COLORS.border },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' },
  feeLbl: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  feeVal: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.primary },
  videoBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.sm, ...SHADOWS.sm,
  },
  videoBtnTxt: { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: '700' },
  scheduleBtn: {
    backgroundColor: '#3B82F6', borderRadius: RADIUS.lg,
    padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  scheduleBtnTxt: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700' },
  chatBtn: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md,
  },
  chatBtnTxt: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  refreshBtn: { alignItems: 'center', padding: SPACING.sm },
  refreshTxt: { color: COLORS.accentLight, fontSize: FONTS.sizes.sm, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  modalSub: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  slotBtn: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  slotDate: { fontSize: 16, fontWeight: '600', color: '#334155' },
  slotTime: { fontSize: 16, fontWeight: '700', color: '#0D9488' },
  cancelBtn: { marginTop: 10, padding: 16, alignItems: 'center' },
  cancelBtnTxt: { color: '#EF4444', fontSize: 16, fontWeight: '600' }
});
