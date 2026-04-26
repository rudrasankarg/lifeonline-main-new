'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

// Severity colour config
const SEV = {
  high:   { bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626', text: '#DC2626', label: 'High'   },
  medium: { bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706', text: '#D97706', label: 'Medium' },
  low:    { bg: '#F0FDF4', border: '#BBF7D0', dot: '#16A34A', text: '#16A34A', label: 'Low'    },
};

// Inline SVG icons
const IconBarChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="1.75"/>
    <rect x="10" y="7" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.75"/>
    <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.75"/>
  </svg>
);
const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconVideo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.75"/>
    <path d="M16 10l6-4v12l-6-4v-4z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
  </svg>
);

export default function DashboardHome({ user }) {
  const router = useRouter();
  const doctorId = user?.uid || null;
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(!doctorId);
  const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0 });

  const toMillis = (value) => {
    if (!value) return 0;
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (value?.seconds) return value.seconds * 1000;
    return 0;
  };

  useEffect(() => {
    if (!doctorId) return undefined;

    const q = query(
      collection(db, 'sessions'),
      where('doctorId', '==', doctorId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          // 1. Emergency SOS Bypass
          if (a.isEmergency && !b.isEmergency) return -1;
          if (!a.isEmergency && b.isEmergency) return 1;

          // 2. Smart Queuing by AI Severity Score (higher = prioritized)
          const scoreA = a.severity_score || 0;
          const scoreB = b.severity_score || 0;
          if (scoreA !== scoreB) return scoreB - scoreA;

          // 3. Fallback to FIFO
          return toMillis(a.createdAt) - toMillis(b.createdAt);
        });

      setSessions(docs);

      const active = docs.filter((s) => ['waiting', 'ringing', 'connecting', 'connected'].includes(s.status));
      setStats({
        total:     docs.length,
        waiting:   active.length,
        completed: docs.filter((s) => s.status === 'completed').length,
      });
      setLoading(false);
    }, (err) => {
      console.error('[Dashboard] failed to subscribe sessions:', err?.message || err);
      setLoading(false);
    });

    return () => unsub();
  }, [doctorId]);

  const handleJoinCall = (session) => {
    router.push(`/dashboard/call/${session.id}`);
  };

  const formatTime = (iso) => {
    const ms = toMillis(iso);
    if (!ms) return '—';
    const d = new Date(ms);
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const greetTime = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening';

  const statItems = [
    { label: 'Total Sessions', value: stats.total,     color: '#0D9488', bg: '#F0FDFA', border: '#CCFBF1' },
    { label: 'Active',         value: stats.waiting,   color: '#0D9488', bg: '#F0FDFA', border: '#CCFBF1' },
    { label: 'Completed',      value: stats.completed, color: '#0D9488', bg: '#F0FDFA', border: '#CCFBF1' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.25rem', letterSpacing: '-0.5px' }}>
          Good {greetTime},{' '}
          <span style={{ color: '#0D9488' }}>Dr. {user?.displayName?.split(' ')[0] || 'Doctor'}</span>
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem', margin: 0 }}>
          Here&apos;s your patient queue and today&apos;s activity.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {statItems.map((s) => (
          <div key={s.label} style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '1.25rem',
            boxShadow: '0 1px 6px rgba(15,23,42,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ color: '#64748B', fontSize: '0.8125rem', fontWeight: 500 }}>{s.label}</span>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Patient Queue */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 6px rgba(15,23,42,0.04)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.125rem 1.25rem',
          borderBottom: '1px solid #F1F5F9',
        }}>
          <h2 style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9375rem', margin: 0 }}>Patient Queue</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A' }} />
            <span style={{ color: '#16A34A', fontSize: '0.75rem', fontWeight: 600 }}>Live</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
            <div style={{
              width: 32, height: 32,
              border: '3px solid #0D9488',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <IconCheck />
            </div>
            <p style={{ color: '#64748B', fontSize: '0.875rem', margin: 0 }}>No patients in queue</p>
          </div>
        ) : (
          <div>
            {sessions.map((s, idx) => {
              const sev = SEV[s.severity] || SEV.medium;
              const waiting = ['waiting', 'ringing', 'connecting', 'connected'].includes(s.status);
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderBottom: idx < sessions.length - 1 ? '1px solid #F1F5F9' : 'none',
                    opacity: waiting ? 1 : 0.5,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FAFAFA'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {/* Severity dot */}
                  <div style={{ width: 9, height: 9, borderRadius: 5, flexShrink: 0, backgroundColor: sev.dot }} />

                  {/* Patient info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <p style={{ color: '#0F172A', fontWeight: 600, fontSize: '0.875rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Patient #{s.userId?.slice(-6) || s.id.slice(-6)}
                      </p>
                      <span style={{
                        fontSize: '0.6875rem', padding: '2px 8px', borderRadius: 6,
                        backgroundColor: s.isEmergency ? '#FEF2F2' : sev.bg, 
                        border: `1px solid ${s.isEmergency ? '#DC2626' : sev.border}`,
                        color: s.isEmergency ? '#DC2626' : sev.text, fontWeight: 600, flexShrink: 0,
                      }}>
                        {s.isEmergency ? '🚨 SOS EMERGENCY' : `${sev.label} Severity`}
                      </span>
                    </div>
                    <p style={{ color: s.isEmergency ? '#DC2626' : '#94A3B8', fontSize: '0.75rem', margin: 0, fontWeight: s.isEmergency ? 600 : 400 }}>
                      {s.isEmergency ? 'Immediate Assistance Required' : `${(s.department || 'General').charAt(0).toUpperCase() + (s.department || 'general').slice(1)}`}
                      &middot; {s.channelName} &middot; {formatTime(s.createdAt)}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    fontSize: '0.75rem', padding: '4px 12px', borderRadius: 20, fontWeight: 600, flexShrink: 0,
                    backgroundColor: waiting ? '#FFFBEB' : '#F1F5F9',
                    color: waiting ? '#D97706' : '#94A3B8',
                    border: waiting ? '1px solid #FDE68A' : '1px solid #E2E8F0',
                  }}>
                    {waiting
                      ? (s.status ? `${s.status.charAt(0).toUpperCase()}${s.status.slice(1)}` : 'Waiting')
                      : 'Completed'}
                  </span>

                  {/* Join Call Button */}
                  {waiting && (
                    <button
                      onClick={() => handleJoinCall(s)}
                      style={{
                        flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        backgroundColor: '#0D9488',
                        color: '#fff',
                        fontSize: '0.8125rem', fontWeight: 600,
                        padding: '0.5rem 0.875rem',
                        borderRadius: 10, border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                        boxShadow: '0 2px 8px rgba(13,148,136,0.20)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0F766E'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#0D9488'; }}
                    >
                      <IconVideo />
                      Join Call
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
