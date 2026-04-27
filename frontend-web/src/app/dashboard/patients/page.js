'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, 'sessions'), where('doctorId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const history = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const patientMap = new Map();
      history.forEach(session => {
        if (!session.userId) return;
        const existing = patientMap.get(session.userId);
        const sessionTime = session.createdAt?.toMillis ? session.createdAt.toMillis() : Date.now();
        if (!existing || sessionTime > existing.lastVisit) {
          patientMap.set(session.userId, {
            id: session.userId,
            name: session.patientName || `Patient #${session.userId.slice(-6)}`,
            lastVisit: sessionTime,
            department: session.department,
            status: session.status,
            doctorName: user.displayName || 'You',
          });
        }
      });

      setPatients(Array.from(patientMap.values()).sort((a, b) => b.lastVisit - a.lastVisit));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const formatDate = (ms) => {
    if (!ms) return '—';
    return new Date(ms).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--foreground)' }}>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 0.25rem', letterSpacing: '-0.5px' }}>
          Patient Directory
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
          View your complete patient history and treatment records.
        </p>
      </div>

      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.125rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface-light)',
        }}>
          <h2 style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '0.9375rem', margin: 0 }}>Historical Records</h2>
          <div style={{ backgroundColor: 'var(--surface)', padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600 }}>{patients.length} Total Patients</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No patient records found.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-light)' }}>
                {['Patient Name', 'Last Treatment Date', 'Treated By', 'Department', 'Status'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p, idx) => (
                <tr
                  key={p.id}
                  style={{ borderBottom: idx < patients.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-light)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)' }}>{p.name}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{formatDate(p.lastVisit)}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 500 }}>Dr. {p.doctorName}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{p.department || 'General'}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      fontSize: '0.75rem', padding: '3px 10px', borderRadius: 12, fontWeight: 600,
                      border: '1px solid',
                      backgroundColor: p.status === 'completed' ? 'transparent' : 'transparent',
                      borderColor: p.status === 'completed' ? 'var(--success)' : 'var(--warning)',
                      color: p.status === 'completed' ? 'var(--success)' : 'var(--warning)',
                    }}>
                      {p.status === 'completed' ? 'Treated' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
