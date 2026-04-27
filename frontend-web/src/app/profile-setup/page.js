'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const SPECIALTIES = [
  'General',
  'Cardiologist',
  'Neurologist',
  'Orthopedist',
  'Psychiatrist',
  'Pediatrician',
  'Dermatologist',
  'Emergency',
];

export default function ProfileSetupPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [specialty, setSpecialty] = useState('General');
  const [medicalId, setMedicalId] = useState('');
  const [experience, setExperience] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    const checkProfile = async () => {
      try {
        const docRef = doc(db, 'doctorPresence', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().hasProfile) {
          router.replace('/dashboard');
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    checkProfile();
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!medicalId || !experience) return;
    
    setSaving(true);
    try {
      await setDoc(doc(db, 'doctorPresence', user.uid), {
        uid: user.uid,
        name: user.displayName || user.email || 'Doctor',
        email: user.email || '',
        photoURL: user.photoURL || null,
        specialties: [specialty.toLowerCase()],
        medicalId,
        experience,
        hasProfile: true,
        available: true,
        lastSeenAt: serverTimestamp(),
      }, { merge: true });
      
      router.replace('/dashboard');
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 480, backgroundColor: 'var(--surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--foreground)' }}>Complete Your Profile</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.875rem' }}>Please provide your medical credentials to continue.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Specialization</label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--foreground)', fontSize: '0.9375rem' }}
            >
              {SPECIALTIES.map(s => <option key={s} value={s} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Medical ID / License Number</label>
            <input
              type="text"
              required
              value={medicalId}
              onChange={(e) => setMedicalId(e.target.value)}
              placeholder="e.g. MED-123456"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--foreground)', fontSize: '0.9375rem', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Years of Experience</label>
            <input
              type="number"
              required
              min="0"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g. 10"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--foreground)', fontSize: '0.9375rem', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: '1rem',
              backgroundColor: 'var(--primary)',
              color: 'var(--background)',
              padding: '0.875rem',
              borderRadius: 8,
              border: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
