'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';

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

// AS given by chatgpt
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },

  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp'
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

// ── SVG Icons ────────────────────────────────────────────────────────────────
const MicIcon = ({ off }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {off ? (
      <>
        <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        <path d="M18.89 13.23A7 7 0 005 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        <path d="M12 19v3M8 22h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        <rect x="9" y="3" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.75"/>
      </>
    ) : (
      <>
        <rect x="9" y="2" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.75"/>
        <path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      </>
    )}
  </svg>
);

const CamIcon = ({ off }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {off ? (
      <>
        <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        <path d="M16 16H4a2 2 0 01-2-2V8a2 2 0 012-2h2M20 8l-4 4 4 4V8z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </>
    ) : (
      <>
        <rect x="2" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.75"/>
        <path d="M16 10l6-4v12l-6-4V10z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
      </>
    )}
  </svg>
);

const PhoneOffIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45c1.12.45 2.3.73 3.53.73a2 2 0 012 2v3.5a2 2 0 01-2 2C8.27 22.5 1.5 15.73 1.5 7.5a2 2 0 012-2H7a2 2 0 012 2c0 1.25.26 2.45.73 3.57a2 2 0 01-.45 2.11l-1.6 1.13z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
// Doctor-side WebRTC: creates the offer, writes it to Firestore, waits for
// patient answer, listens to patientCandidates.
export default function VideoCallRoom({ sessionId, doctor }) {
  const router = useRouter();

  const localVideoRef     = useRef(null);
  const remoteVideoRef    = useRef(null);
  const pcRef             = useRef(null);
  const localStream       = useRef(null);
  const pendingCandidates = useRef([]);
  const offerCreated      = useRef(false);

  // Saved at addTrack time so toggle functions always find the right sender
  const mutedRef           = useRef(false);
  const videoOffRef        = useRef(false);
  const videoSenderRef     = useRef(null);
  const audioSenderRef     = useRef(null);
  const originalVideoTrack = useRef(null);
  const originalAudioTrack = useRef(null);
  const blackCanvasRef     = useRef(null);
  const blackRafRef        = useRef(null);
  const blackTrackRef      = useRef(null);
  const audioCtxRef        = useRef(null);
  const silentTrackRef     = useRef(null);

  const [status,      setStatus]      = useState('connecting');
  const [muted,       setMuted]       = useState(false);
  const [videoOff,    setVideoOff]    = useState(false);
  const [patientVideoOff, setPatientVideoOff] = useState(false);
  const [duration,    setDuration]    = useState(0);
  const [error,       setError]       = useState(null);
  const [remoteReady, setRemoteReady] = useState(false);

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'connected') return;
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  // ── WebRTC init (doctor role: creates offer) ─────────────────────────────
  const initCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, iceCandidatePoolSize: 10 });
      pcRef.current = pc;

      // Save senders immediately — never search getSenders() later
      stream.getTracks().forEach((track) => {
        const sender = pc.addTrack(track, stream);
        if (track.kind === 'video') {
          videoSenderRef.current     = sender;
          originalVideoTrack.current = track;
        } else if (track.kind === 'audio') {
          audioSenderRef.current     = sender;
          originalAudioTrack.current = track;
        }
      });

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (remoteVideoRef.current && remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setRemoteReady(true);
        setStatus('connected');
        updateDoc(doc(db, 'sessions', sessionId), {
          status: 'connected', startedAt: serverTimestamp(),
        }).catch(() => {});
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') setStatus('ended');
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await addDoc(
            collection(db, 'sessions', sessionId, 'doctorCandidates'),
            { candidate: event.candidate.toJSON(), timestamp: serverTimestamp() }
          ).catch(() => {});
        }
      };

      if (offerCreated.current) return () => {};
      offerCreated.current = true;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await setDoc(doc(db, 'sessions', sessionId), {
        offer:       { type: offer.type, sdp: offer.sdp },
        status:      'ringing',
        doctorId:    doctor?.id || doctor?.email || 'unknown',
        doctorName:  doctor?.name || 'Doctor',
        doctorEmail: doctor?.email || '',
        doctorPhoto: doctor?.image || null,
        updatedAt:   serverTimestamp(),
      }, { merge: true });

      setStatus('ringing');

      const sessionRef  = doc(db, 'sessions', sessionId);
      const unsubAnswer = onSnapshot(sessionRef, async (snap) => {
        const data = snap.data();
        if (!data) return;

        if (data.patientVideoOff !== undefined) {
          setPatientVideoOff(data.patientVideoOff);
        }

        if (data.status === 'connecting' || data.status === 'connected') {
          setStatus((prev) => (prev === 'connected' ? prev : 'connecting'));
        }
        if (data.status === 'completed') { setStatus('ended'); return; }

        if (data?.answer && !pc.remoteDescription) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            for (const c of pendingCandidates.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
            }
            pendingCandidates.current = [];
          } catch (e) {
            console.warn('[WebRTC Doctor] setRemoteDescription error:', e);
          }
        }
      });

      const unsubCandidates = onSnapshot(
        collection(db, 'sessions', sessionId, 'patientCandidates'),
        (snap) => {
          snap.docChanges().forEach(async (change) => {
            if (change.type !== 'added') return;
            const candidate = change.doc.data()?.candidate;
            if (!candidate) return;
            if (!pc.remoteDescription) { pendingCandidates.current.push(candidate); return; }
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
          });
        }
      );

      return () => { unsubAnswer(); unsubCandidates(); };
    } catch (err) {
      console.error('[WebRTC Doctor] Init failed:', err);
      setError(err.message);
      setStatus('ended');
      return () => {};
    }
  }, [sessionId, doctor]);

  useEffect(() => {
    let unsubscribers = [];
    
    const setup = async () => {
      const cleanup = await initCall();
      if (cleanup) unsubscribers.push(cleanup);
    };
    
    setup();
    
    return () => {
      unsubscribers.forEach(fn => fn());
      localStream.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    };
  }, [initCall]);

  // ── Black video track (30fps canvas) ────────────────────────────────────────
  const getBlackVideoTrack = () => {
    if (!blackCanvasRef.current) {
      const canvas  = document.createElement('canvas');
      canvas.width  = 640;
      canvas.height = 480;
      blackCanvasRef.current = canvas;
    }
    const canvas = blackCanvasRef.current;
    const ctx    = canvas.getContext('2d');
    const draw   = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      blackRafRef.current = requestAnimationFrame(draw);
    };
    if (blackRafRef.current) cancelAnimationFrame(blackRafRef.current);
    draw();

    if (!blackTrackRef.current || blackTrackRef.current.readyState === 'ended') {
      blackTrackRef.current = canvas.captureStream(30).getVideoTracks()[0];
    }
    return blackTrackRef.current;
  };

  const stopBlackTrack = () => {
    if (blackRafRef.current) { cancelAnimationFrame(blackRafRef.current); blackRafRef.current = null; }
    if (blackTrackRef.current) { blackTrackRef.current.stop(); blackTrackRef.current = null; }
  };

  // ── Silent audio track (Web Audio API) ──────────────────────────────────────
  const getSilentAudioTrack = async () => {
    if (silentTrackRef.current && silentTrackRef.current.readyState === 'live') {
      return silentTrackRef.current;
    }
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    const dest   = ctx.createMediaStreamDestination();
    const source = ctx.createConstantSource();
    source.offset.value = 0;
    source.connect(dest);
    source.start();
    silentTrackRef.current = dest.stream.getAudioTracks()[0];
    return silentTrackRef.current;
  };

  // ── Mic toggle (replaceTrack → true silence on the wire) ────────────────────
  const toggleMute = async () => {
    const next    = !mutedRef.current;
    const sender  = audioSenderRef.current;
    const realTrk = originalAudioTrack.current;
    if (!sender || !realTrk) return;

    if (next) {
      const silentTrack = await getSilentAudioTrack();
      await sender.replaceTrack(silentTrack);
    } else {
      await sender.replaceTrack(realTrk);
    }
    mutedRef.current = next;
    setMuted(next);
  };

  // ── Camera toggle (replaceTrack → true black on the wire) ───────────────────
  const toggleVideo = async () => {
    const next    = !videoOffRef.current;
    const realTrk = originalVideoTrack.current;
    if (!realTrk) return;

    if (next) {
      realTrk.enabled = false;
    } else {
      realTrk.enabled = true;
    }
    videoOffRef.current = next;
    setVideoOff(next);

    try {
      await updateDoc(doc(db, 'sessions', sessionId), { doctorVideoOff: next });
    } catch (e) {}
  };

  // ── End call ────────────────────────────────────────────────────────────────
  const endCall = async () => {
    stopBlackTrack();
    silentTrackRef.current?.stop();
    audioCtxRef.current?.close().catch(() => {});
    localStream.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        status: 'completed', endedAt: serverTimestamp(),
      });
    } catch {}
    setStatus('ended');
    router.push('/dashboard');
  };

  // ── Status info ─────────────────────────────────────────────────────────────
  const STATUS_LABEL = {
    connecting: { text: 'Patient connected – establishing media...', color: '#1D4ED8' },
    ringing:    { text: 'Waiting for patient to join...', color: '#D97706' },
    connected:  { text: formatDuration(duration), color: '#16A34A' },
    ended:      { text: 'Call ended', color: '#64748B' },
  };
  const statusInfo = STATUS_LABEL[status] || STATUS_LABEL.connecting;

  // ── Ended screen ─────────────────────────────────────────────────────────────
  if (status === 'ended' && !error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            backgroundColor: '#F0FDF4', border: '2px solid #BBF7D0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#16A34A" strokeWidth="1.75"/>
              <path d="M8 12l3 3 5-5" stroke="#16A34A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ color: '#0F172A', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
            Consultation Complete
          </h2>
          <p style={{ color: '#64748B', margin: '0 0 1.5rem', fontSize: '0.875rem' }}>
            Duration: {formatDuration(duration)}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              backgroundColor: '#0D9488', color: '#fff', border: 'none',
              fontWeight: 600, padding: '0.75rem 1.5rem', borderRadius: 12,
              cursor: 'pointer', fontSize: '0.9375rem',
              boxShadow: '0 4px 12px rgba(13,148,136,0.25)',
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Main call UI ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A14', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.875rem 1.5rem',
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            backgroundColor: '#0D9488',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <ShieldIcon />
          </div>
          <div>
            <p style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>lifeOnLine Consultation</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6875rem', fontFamily: 'monospace', margin: 0 }}>{sessionId}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: status === 'connected' ? '#16A34A' : status === 'ringing' ? '#D97706' : '#475569',
            ...(status !== 'ended' && { animation: 'pulse 2s infinite' }),
          }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'monospace', color: statusInfo.color }}>
            {statusInfo.text}
          </span>
          <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
        </div>
      </div>

      {/* Video area */}
      <div style={{ flex: 1, position: 'relative', backgroundColor: '#0D0D1F', overflow: 'hidden', display: 'flex' }}>

        {/* Patient (remote) video */}
        {remoteReady && !patientVideoOff && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
              backgroundColor: '#0D0D1F',
              transition: 'opacity 0.4s',
            }}
          />
        )}

        {/* Patient CAM OFF overlay */}
        {remoteReady && patientVideoOff && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem',
            backgroundColor: '#0D0D1F', zIndex: 5,
          }}>
            <div style={{
              width: 112, height: 112, borderRadius: '50%',
              backgroundColor: 'rgba(13,148,136,0.15)',
              border: '2px solid rgba(13,148,136,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#2DD4BF', fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>PT</span>
            </div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>
              PATIENT CAM OFF
            </p>
          </div>
        )}

        {/* Waiting placeholder */}
        {!remoteReady && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem',
          }}>
            <div style={{
              width: 112, height: 112, borderRadius: '50%',
              backgroundColor: 'rgba(13,148,136,0.15)',
              border: '2px solid rgba(13,148,136,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#2DD4BF', fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>PT</span>
            </div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: '1.125rem', margin: 0 }}>
              {status === 'ringing' ? 'Calling patient...' : 'Patient connecting...'}
            </p>
            {status === 'ringing' && (
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: '#D97706',
                    animation: `dotbounce 1s ease-in-out ${i * 0.15}s infinite`,
                  }} />
                ))}
                <style>{`@keyframes dotbounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }`}</style>
              </div>
            )}
            {error && <p style={{ color: '#F87171', fontSize: '0.875rem' }}>{error}</p>}
          </div>
        )}

        {/* Doctor (local) PiP — bottom-right */}
        <div style={{
          position: 'absolute',
          bottom: '1.5rem', right: '1.5rem',
          width: 180, height: 135,
          borderRadius: 14, overflow: 'hidden',
          border: '2px solid rgba(13,148,136,0.55)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
          backgroundColor: '#111827',
          flexShrink: 0,
          zIndex: 10,
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              display: videoOff ? 'none' : 'block',
              transform: 'scaleX(-1)',
            }}
          />
          {videoOff && (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#111827',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', fontWeight: 600 }}>CAM OFF</span>
            </div>
          )}
          <div style={{
            position: 'absolute', bottom: '0.375rem', left: '0.5rem',
            backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 6, padding: '2px 6px',
          }}>
            <p style={{ color: '#fff', fontSize: '0.6875rem', fontWeight: 500, margin: 0 }}>
              Dr. {doctor?.name?.split(' ')[0] || 'You'}
            </p>
          </div>
          {muted && (
            <div style={{
              position: 'absolute', top: '0.375rem', right: '0.375rem',
              backgroundColor: 'rgba(220,38,38,0.85)', borderRadius: 6, padding: '2px 6px',
            }}>
              <span style={{ color: '#fff', fontSize: '0.625rem', fontWeight: 700 }}>MUTED</span>
            </div>
          )}
        </div>

        {doctor?.image && (
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
            <Image
              src={doctor.image} alt="Doctor"
              width={36} height={36}
              style={{ borderRadius: '50%', border: '2px solid rgba(13,148,136,0.5)' }}
            />
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
        padding: '1.125rem 2rem',
        backgroundColor: 'rgba(0,0,0,0.70)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        <CtrlBtn onClick={toggleMute}  active={muted}    icon={<MicIcon off={muted} />}    label={muted ? 'Unmute' : 'Mute'} />
        <CtrlBtn onClick={toggleVideo} active={videoOff} icon={<CamIcon off={videoOff} />} label={videoOff ? 'Show Cam' : 'Hide Cam'} />
        <button
          onClick={endCall}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
            backgroundColor: '#DC2626', color: '#fff',
            padding: '0.8rem 2.25rem', borderRadius: 16,
            border: '1px solid rgba(220,38,38,0.5)',
            boxShadow: '0 4px 16px rgba(220,38,38,0.35)',
            cursor: 'pointer', transition: 'background 0.12s',
            fontSize: '0.6875rem', fontWeight: 700,
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#B91C1C'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#DC2626'; }}
        >
          <PhoneOffIcon />
          End Call
        </button>
      </div>
    </div>
  );
}

// ── CtrlBtn helper ────────────────────────────────────────────────────────────
function CtrlBtn({ onClick, active, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
        padding: '0.8rem 1.4rem', borderRadius: 16, minWidth: 76,
        backgroundColor: active ? 'rgba(220,38,38,0.22)' : 'rgba(255,255,255,0.09)',
        color: active ? '#F87171' : '#fff',
        border: active ? '1px solid rgba(220,38,38,0.45)' : '1px solid rgba(255,255,255,0.09)',
        cursor: 'pointer', transition: 'all 0.12s',
        fontSize: '0.6875rem', fontWeight: 500,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.09)'; }}
    >
      {icon}
      {label}
    </button>
  );
}