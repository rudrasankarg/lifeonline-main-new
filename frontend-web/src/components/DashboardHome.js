'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const SEV = {
  high:   { dot: 'var(--danger)',  label: 'High',   textColor: 'var(--danger)'  },
  medium: { dot: 'var(--warning)', label: 'Medium', textColor: 'var(--warning)' },
  low:    { dot: 'var(--success)', label: 'Low',    textColor: 'var(--success)' },
};

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
    if (typeof value === 'string') { const p = Date.parse(value); return isNaN(p) ? 0 : p; }
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (value?.seconds) return value.seconds * 1000;
    return 0;
  };

  useEffect(() => {
    if (!doctorId) return undefined;
    const q = query(collection(db, 'sessions'), where('doctorId', '==', doctorId));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          if (a.isEmergency && !b.isEmergency) return -1;
          if (!a.isEmergency && b.isEmergency) return 1;
          const scoreA = a.severity_score || 0;
          const scoreB = b.severity_score || 0;
          if (scoreA !== scoreB) return scoreB - scoreA;
          return toMillis(a.createdAt) - toMillis(b.createdAt);
        });

      setSessions(docs);
      const active = docs.filter(s => ['waiting', 'ringing', 'connecting', 'connected'].includes(s.status));
      setStats({ total: docs.length, waiting: active.length, completed: docs.filter(s => s.status === 'completed').length });
      setLoading(false);
    }, (err) => {
      console.error('[Dashboard]', err?.message || err);
      setLoading(false);
    });
    return () => unsub();
  }, [doctorId]);

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
    { label: 'Total Sessions', value: stats.total     },
    { label: 'Active',         value: stats.waiting   },
    { label: 'Completed',      value: stats.completed },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--foreground)' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 0.25rem', letterSpacing: '-0.5px' }}>
          Good {greetTime},{' '}
          <span style={{ color: 'var(--primary)' }}>Dr. {user?.displayName?.split(' ')[0] || 'Doctor'}</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
          Here&apos;s your patient queue and today&apos;s activity.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {statItems.map(s => (
          <div key={s.label} style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '1.25rem',
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 500 }}>{s.label}</span>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', margin: '0.25rem 0 0' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Patient Queue */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.125rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface-light)',
        }}>
          <h2 style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.9375rem', margin: 0 }}>Patient Queue</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: 'var(--success)' }} />
            <span style={{ color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600 }}>Live</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>No patients in queue</p>
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
                    borderBottom: idx < sessions.length - 1 ? '1px solid var(--border)' : 'none',
                    opacity: waiting ? 1 : 0.55,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--surface-light)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {/* Severity dot */}
                  <div style={{ width: 9, height: 9, borderRadius: 5, flexShrink: 0, backgroundColor: s.isEmergency ? 'var(--danger)' : sev.dot }} />

                  {/* Patient info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <p style={{ color: 'var(--foreground)', fontWeight: 600, fontSize: '0.875rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Patient #{s.userId?.slice(-6) || s.id.slice(-6)}
                      </p>
                      <span style={{
                        fontSize: '0.6875rem', padding: '2px 8px', borderRadius: 6,
                        backgroundColor: 'var(--surface-light)',
                        border: `1px solid ${s.isEmergency ? 'var(--danger)' : 'var(--border)'}`,
                        color: s.isEmergency ? 'var(--danger)' : sev.textColor,
                        fontWeight: 600, flexShrink: 0,
                      }}>
                        {s.isEmergency ? '🚨 SOS' : `${sev.label} Severity`}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
                      {s.isEmergency ? 'Immediate Assistance Required' : (s.department || 'General')}
                      &nbsp;·&nbsp;{s.channelName}&nbsp;·&nbsp;{formatTime(s.createdAt)}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    fontSize: '0.75rem', padding: '4px 12px', borderRadius: 20, fontWeight: 600, flexShrink: 0,
                    backgroundColor: 'var(--surface-light)',
                    color: waiting ? 'var(--warning)' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}>
                    {waiting ? (s.status ? `${s.status[0].toUpperCase()}${s.status.slice(1)}` : 'Waiting') : 'Completed'}
                  </span>

                  {/* Join Call Button */}
                  {waiting && (
                    <button
                      onClick={() => router.push(`/dashboard/call/${s.id}`)}
                      style={{
                        flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        backgroundColor: 'var(--primary)',
                        color: '#0F172A',
                        fontSize: '0.8125rem', fontWeight: 700,
                        padding: '0.5rem 0.875rem',
                        borderRadius: 10, border: 'none',
                        cursor: 'pointer',
                        transition: 'opacity 0.12s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
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
