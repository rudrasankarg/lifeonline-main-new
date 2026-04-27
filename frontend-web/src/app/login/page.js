'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const { user, loading, error, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Helper: decide where to send an authenticated user
  const routeAuthenticatedUser = async (uid) => {
    try {
      const snap = await getDoc(doc(db, 'doctorPresence', uid));
      if (snap.exists() && snap.data().hasProfile) {
        router.replace('/dashboard');
      } else {
        router.replace('/profile-setup');
      }
    } catch {
      router.replace('/profile-setup');
    }
  };

  // If already logged-in when the page loads, route appropriately
  useEffect(() => {
    if (!loading && user) {
      routeAuthenticatedUser(user.uid);
    }
  }, [user, loading]);

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result) await routeAuthenticatedUser(result.uid);
  };



  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'var(--foreground)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo + Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: 'var(--primary)',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(13, 148, 136, 0.25)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="white" fillOpacity="0.9"/>
              <path d="M12 8v4M10 10h4" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.5px' }}>
            lifeOnLine
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.375rem', fontSize: '0.875rem' }}>Doctor Portal</p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '2rem',
          boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 0.25rem' }}>
            Doctor Sign In
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 2rem' }}>
            Access your patient queue, consultations, and video calls.
          </p>

          {/* Error banner */}
          {error && (
            <div style={{
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              borderRadius: 12,
              padding: '1rem',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" stroke="var(--danger)" strokeWidth="1.5"/>
                <path d="M12 8v4M12 16h.01" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <div>
                <p style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>
                  {error === 'ACCESS_DENIED' ? 'Access Denied' : 'Sign-in Failed'}
                </p>
                <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>
                  {error === 'ACCESS_DENIED'
                    ? 'Your Google account is not authorised as a lifeOnLine doctor. Contact your administrator.'
                    : error}
                </p>
              </div>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              backgroundColor: 'var(--surface)',
              border: '1.5px solid var(--border)',
              color: 'var(--foreground)',
              fontWeight: 600,
              padding: '0.875rem 1.5rem',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: '0.9375rem',
              transition: 'all 0.15s',
              boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,148,136,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.06)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.6', margin: 0 }}>
              Only authorised lifeOnLine physicians can access this portal.
              <br />Patient-facing app available on iOS &amp; Android.
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          &copy; 2025 lifeOnLine &middot; Secure &middot; Encrypted &middot; HIPAA-aware
        </p>
      </div>
    </div>
  );
}
