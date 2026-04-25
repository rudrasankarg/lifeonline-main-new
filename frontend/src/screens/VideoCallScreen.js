// Video Call Screen – patient-side real WebRTC implementation
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {
  mediaDevices,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
} from 'react-native-webrtc';
import { addDoc, collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

// const ICE_SERVERS = [
//   { urls: 'stun:stun.l.google.com:19302' },
//   { urls: 'stun:stun1.l.google.com:19302' },
//   // OpenRelay TURN servers - free tier, replace with paid credentials for production
//   {
//     urls: 'turn:a.relay.metered.ca:80',
//     username: '6AtDm66GBEPcl7TdCi9K',
//     credential: 'openrelay',
//   },
//   {
//     urls: 'turn:a.relay.metered.ca:80?transport=tcp',
//     username: '6AtDm66GBEPcl7TdCi9K',
//     credential: 'openrelay',
//   },
//   {
//     urls: 'turn:a.relay.metered.ca:443',
//     username: '6AtDm66GBEPcl7TdCi9K',
//     credential: 'openrelay',
//   },
//   {
//     urls: 'turns:a.relay.metered.ca:443?transport=tcp',
//     username: '6AtDm66GBEPcl7TdCi9K',
//     credential: 'openrelay',
//   },
// ];

// as given by chatgpt

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },

  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export default function VideoCallScreen({ route, navigation }) {
  const session = route?.params?.session || {};
  const doctor = route?.params?.doctor || { name: 'Doctor', specialty: 'general' };
  const sessionId = session?.sessionId || session?.id || null;

  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState('connecting'); // connecting | waiting | connected | ended
  const [error, setError] = useState(null);
  const [localURL, setLocalURL] = useState(null);
  const [remoteURL, setRemoteURL] = useState(null);
  const [doctorVideoOff, setDoctorVideoOff] = useState(false);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const unsubscribersRef = useRef([]);
  const answeredRef = useRef(false);
  const pendingCandidatesRef = useRef([]);

  useEffect(() => {
    if (status !== 'connected') return undefined;
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return;

    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);

    const denied = Object.values(result).some((v) => v !== PermissionsAndroid.RESULTS.GRANTED);
    if (denied) {
      throw new Error('Camera and microphone permissions are required to start consultation.');
    }
  };

  const cleanupCall = useCallback(async (markCompleted = false) => {
    unsubscribersRef.current.forEach((unsub) => {
      try { unsub?.(); } catch {}
    });
    unsubscribersRef.current = [];

    localStreamRef.current?.getTracks()?.forEach((track) => track.stop());
    remoteStreamRef.current?.getTracks?.()?.forEach((track) => track.stop());

    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalURL(null);
    setRemoteURL(null);

    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }

    if (markCompleted && sessionId) {
      await updateDoc(doc(db, 'sessions', sessionId), {
        status: 'completed',
        endedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;

    const initCall = async () => {
      if (!sessionId) {
        setError('No session found. Start consultation from Doctor Match.');
        setStatus('ended');
        return;
      }

      try {
        await requestPermissions();

        const localStream = await mediaDevices.getUserMedia({
          audio: true,
          video: {
            facingMode: 'user',
            width: 640,
            height: 480,
          },
        });

        if (cancelled) {
          localStream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = localStream;
        setLocalURL(localStream.toURL());

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, iceCandidatePoolSize: 10 });
        pcRef.current = pc;

        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });

        pc.onicecandidate = async (event) => {
          if (!event.candidate) return;
          await addDoc(collection(db, 'sessions', sessionId, 'patientCandidates'), {
            candidate: event.candidate.toJSON(),
            timestamp: serverTimestamp(),
          }).catch(() => {});
        };

        pc.ontrack = (event) => {
          const [stream] = event.streams || [];
          if (!stream) return;

          remoteStreamRef.current = stream;
          setRemoteURL(stream.toURL());
          setStatus('connected');

          updateDoc(doc(db, 'sessions', sessionId), {
            status: 'connected',
            patientJoinedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        };

        pc.onconnectionstatechange = () => {
          // Only treat hard failures as ended; 'disconnected' is transient during ICE
          if (pc.connectionState === 'failed') {
            setStatus('ended');
          }
        };

        const sessionRef = doc(db, 'sessions', sessionId);
        const unsubSession = onSnapshot(sessionRef, async (snap) => {
          if (!snap.exists()) {
            setError('Session expired or not found.');
            setStatus('ended');
            return;
          }

          const data = snap.data() || {};

          if (data.status === 'completed') {
            setStatus('ended');
            cleanupCall(false).catch(() => {});
            Alert.alert(
              'Call Ended',
              'The doctor has ended the consultation.',
              [{ text: 'OK', onPress: () => navigation.goBack() }],
              { cancelable: false }
            );
            return;
          }

          if (data.doctorVideoOff !== undefined) {
            setDoctorVideoOff(data.doctorVideoOff);
          }

          if (!data.offer) {
            setStatus((prev) => (prev === 'connected' ? prev : 'waiting'));
            return;
          }

          // Guard: only answer once
          if (answeredRef.current) return;
          answeredRef.current = true;

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

            // Flush any ICE candidates that arrived before remote description was set
            for (const c of pendingCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
            }
            pendingCandidatesRef.current = [];

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await updateDoc(sessionRef, {
              answer: { type: answer.type, sdp: answer.sdp },
              status: 'connecting',
              patientJoinedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });

            setStatus('connecting');
          } catch (e) {
            // answeredRef already true – another snapshot fired during async gap, ignore
          }
        });

        const unsubDoctorCandidates = onSnapshot(
          collection(db, 'sessions', sessionId, 'doctorCandidates'),
          (snap) => {
            snap.docChanges().forEach(async (change) => {
              if (change.type !== 'added') return;
              const candidate = change.doc.data()?.candidate;
              if (!candidate) return;
              // Queue candidates until remote description is set
              if (!pc.remoteDescription) {
                pendingCandidatesRef.current.push(candidate);
                return;
              }
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch {}
            });
          }
        );

        unsubscribersRef.current = [unsubSession, unsubDoctorCandidates];
        setStatus('waiting');
      } catch (err) {
        setError(err?.message || 'Unable to start video consultation.');
        setStatus('ended');
      }
    };

    initCall();

    return () => {
      cancelled = true;
      cleanupCall(false).catch(() => {});
    };
  }, [cleanupCall, sessionId]);

  const toggleMute = () => {
    const tracks = localStreamRef.current?.getAudioTracks?.() || [];
    tracks.forEach((track) => { track.enabled = !track.enabled; });
    setMuted((v) => !v);
  };

  const toggleVideo = () => {
    const nextVideoOff = !videoOff;
    const tracks = localStreamRef.current?.getVideoTracks?.() || [];
    tracks.forEach((track) => { track.enabled = !nextVideoOff; });
    setVideoOff(nextVideoOff);

    if (sessionId) {
      updateDoc(doc(db, 'sessions', sessionId), { patientVideoOff: nextVideoOff }).catch(() => {});
    }
  };

  const handleEndCall = () => {
    Alert.alert('End Call', 'Are you sure you want to end this consultation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Call',
        style: 'destructive',
        onPress: async () => {
          await cleanupCall(true);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.remoteVideo}>
        {remoteURL && !doctorVideoOff ? (
          <RTCView streamURL={remoteURL} style={styles.remoteVideoSurface} objectFit="cover" />
        ) : remoteURL && doctorVideoOff ? (
          <View style={styles.placeholderBox}>
            <View style={styles.doctorAvatarBox}>
              <Text style={styles.doctorAvatarText}>Dr.</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 16, marginTop: 10, fontWeight: '700' }}>DOCTOR CAM OFF</Text>
          </View>
        ) : (
          <View style={styles.placeholderBox}>
            <View style={styles.doctorAvatarBox}>
              <Text style={styles.doctorAvatarText}>Dr.</Text>
            </View>
            <Text style={styles.doctorName}>{doctor?.name || 'Doctor'}</Text>
            <Text style={styles.doctorSpec}>
              {(doctor?.specialty || 'General').charAt(0).toUpperCase() + (doctor?.specialty || '').slice(1)} Specialist
            </Text>
            <Text style={styles.statusText}>
              {status === 'waiting' && 'Waiting for doctor to join...'}
              {status === 'connecting' && 'Connecting secure call...'}
              {status === 'ended' && (error || 'Call ended')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.sessionChip}>
        <Text style={styles.sessionText}>
          {session.channelName || sessionId || 'lifeline-session'} · Encrypted
        </Text>
      </View>

      <View style={styles.timeChip}>
        <Text style={styles.timeText}>{status === 'connected' ? formatDuration(duration) : status.toUpperCase()}</Text>
      </View>

      <View style={styles.localVideo}>
        {!videoOff && localURL ? (
          <RTCView streamURL={localURL} style={styles.localVideoSurface} objectFit="cover" mirror />
        ) : (
          <View style={styles.videoOffBox}>
              <Text style={{ fontSize: 13, color: '#fff', fontWeight: '600' }}>CAM OFF</Text>
            </View>
        )}
      </View>

      <View style={styles.controlsBar}>
        <ControlBtn icon={muted ? 'MIC\nOFF' : 'MIC\nON'} label={muted ? 'Unmute' : 'Mute'} onPress={toggleMute} active={muted} />
        <ControlBtn icon={videoOff ? 'CAM\nOFF' : 'CAM\nON'} label={videoOff ? 'Camera On' : 'Camera Off'} onPress={toggleVideo} active={videoOff} />
        <TouchableOpacity style={styles.endBtn} onPress={handleEndCall} activeOpacity={0.85}>
          <Text style={styles.endIcon}>END</Text>
          <Text style={styles.endLabel}>Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ControlBtn({ icon, label, onPress, active }) {
  return (
    <TouchableOpacity style={[styles.ctrlBtn, active && styles.ctrlBtnActive]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.ctrlIcon}>{icon}</Text>
      <Text style={styles.ctrlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A14' },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#0D0D1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remoteVideoSurface: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
  },
  doctorAvatarBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(13,148,136,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(13,148,136,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  doctorAvatarText: { fontSize: 20, fontWeight: '800', color: '#2DD4BF', letterSpacing: 1 },
  doctorName: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: '#fff', marginTop: SPACING.sm },
  doctorSpec: { fontSize: FONTS.sizes.sm, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  statusText: {
    color: '#2DD4BF',
    marginTop: SPACING.md,
    textAlign: 'center',
    fontSize: FONTS.sizes.sm,
  },

  sessionChip: {
    position: 'absolute',
    top: SPACING.lg,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  sessionText: { color: 'rgba(255,255,255,0.6)', fontSize: FONTS.sizes.xs },

  timeChip: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
  },
  timeText: {
    color: COLORS.success,
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  localVideo: {
    position: 'absolute',
    top: 60,
    right: SPACING.md,
    width: 100,
    height: 140,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  localVideoSurface: {
    width: '100%',
    height: '100%',
  },
  videoOffBox: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e' },

  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  ctrlBtn: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.full,
    padding: SPACING.md,
    minWidth: 74,
  },
  ctrlBtnActive: { backgroundColor: COLORS.danger + '40' },
  ctrlIcon: { fontSize: 11, color: '#fff', fontWeight: '700', textAlign: 'center', letterSpacing: 0.5 },
  ctrlLabel: { color: '#fff', fontSize: FONTS.sizes.xs },

  endBtn: {
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.full,
    padding: SPACING.md,
    minWidth: 74,
    ...SHADOWS.danger,
  },
  endIcon: { fontSize: 11, color: '#fff', fontWeight: '800', letterSpacing: 0.5 },
  endLabel: { color: '#fff', fontSize: FONTS.sizes.xs, fontWeight: '700' },
});
