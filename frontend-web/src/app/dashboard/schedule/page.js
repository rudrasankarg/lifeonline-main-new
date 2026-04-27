'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';

export default function SchedulePage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, 'appointments'), where('doctorId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const apts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      apts.sort((a, b) => a.timestamp - b.timestamp);
      setAppointments(apts);
      setLoading(false);
    });

    const docRef = doc(db, 'doctors', user.uid);
    getDoc(docRef).then(dSnap => {
      if (dSnap.exists()) {
        setIsAvailable(dSnap.data().available !== false);
      } else {
        setDoc(docRef, { available: true, name: user.displayName || 'Doctor' }, { merge: true });
      }
    });

    return () => unsub();
  }, [user]);

  const toggleAvailability = async () => {
    if (!user?.uid) return;
    setSavingStatus(true);
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    try {
      const docRef = doc(db, 'doctors', user.uid);
      await setDoc(docRef, { available: newStatus, name: user.displayName || 'Doctor' }, { merge: true });
    } catch (e) {
      console.error('Failed to update status', e);
      setIsAvailable(!newStatus);
    } finally {
      setSavingStatus(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const grouped = appointments.reduce((acc, apt) => {
    const day = formatDate(apt.timestamp);
    if (!acc[day]) acc[day] = [];
    acc[day].push(apt);
    return acc;
  }, {});

  return (
    <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--foreground)' }}>

      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 0.25rem', letterSpacing: '-0.5px' }}>
            My Schedule
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Manage your daily appointments and availability.
          </p>
        </div>

        {/* Availability toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          backgroundColor: 'var(--surface)',
          padding: '0.625rem 1rem',
          borderRadius: 12,
          border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>Accepting New Patients</span>
          <button
            onClick={toggleAvailability}
            disabled={savingStatus}
            role="switch"
            aria-checked={isAvailable}
            style={{
              width: 44, height: 24, borderRadius: 12,
              backgroundColor: isAvailable ? 'var(--success)' : 'var(--border)',
              border: 'none', position: 'relative',
              cursor: savingStatus ? 'wait' : 'pointer',
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: '#E2E8F0',
              position: 'absolute', top: 3, left: isAvailable ? 23 : 3,
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', backgroundColor: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <span style={{ fontSize: 20 }}>📅</span>
          </div>
          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--foreground)', fontSize: '1.125rem' }}>No Upcoming Appointments</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            You currently have no scheduled patients. When patients book through the app, they will appear here day-wise.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(grouped).map(([day, apts]) => (
            <div key={day}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                {day}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {apts.map(apt => (
                  <div key={apt.id} style={{
                    backgroundColor: 'var(--surface)',
                    padding: '1.25rem',
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    borderLeft: '4px solid var(--primary)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--foreground)' }}>{formatTime(apt.timestamp)}</span>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600,
                        color: 'var(--success)',
                        backgroundColor: 'var(--surface-light)',
                        padding: '2px 10px', borderRadius: 10,
                        border: '1px solid var(--border)',
                      }}>Confirmed</span>
                    </div>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 0.25rem' }}>{apt.patientName}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                      Reason: {apt.reason || 'General Consultation'}
                      {apt.severity && <span style={{ color: 'var(--primary)', marginLeft: 4 }}>(Severity: {apt.severity})</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
