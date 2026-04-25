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

    // We query past sessions/appointments to build the patient history
    const q = query(collection(db, 'sessions'), where('doctorId', '==', user.uid));
    
    const unsub = onSnapshot(q, (snap) => {
      const history = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Group by patient ID to show unique patients and their last visit
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
            doctorName: user.displayName || 'You'
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
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.25rem', letterSpacing: '-0.5px' }}>
          Patient Directory
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem', margin: 0 }}>
          View your complete patient history and treatment records.
        </p>
      </div>

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
          backgroundColor: '#F8FAFC'
        }}>
          <h2 style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.9375rem', margin: 0 }}>Historical Records</h2>
          <div style={{ backgroundColor: '#EEF2FF', padding: '4px 12px', borderRadius: 20 }}>
            <span style={{ color: '#4F46E5', fontSize: '0.75rem', fontWeight: 600 }}>{patients.length} Total Patients</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #0D9488', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ color: '#64748B', fontSize: '0.875rem' }}>No patient records found.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Patient Name</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Last Treatment Date</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Treated By</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Department</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p, idx) => (
                <tr key={p.id} style={{ borderBottom: idx < patients.length - 1 ? '1px solid #F1F5F9' : 'none', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{p.name}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#475569' }}>{formatDate(p.lastVisit)}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#0D9488', fontWeight: 500 }}>Dr. {p.doctorName}</td>
                  <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#475569', textTransform: 'capitalize' }}>{p.department || 'General'}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', padding: '4px 10px', borderRadius: 12, fontWeight: 600,
                      backgroundColor: p.status === 'completed' ? '#F0FDF4' : '#FFFBEB',
                      color: p.status === 'completed' ? '#16A34A' : '#D97706'
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
