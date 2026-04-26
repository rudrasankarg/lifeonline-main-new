'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

// ── Allowed doctor email whitelist ──────────────────────────────────────────
// Reads NEXT_PUBLIC_ALLOWED_DOCTOR_EMAILS (comma-separated).
// If empty/unset → any Google account can sign in (dev mode).
function isDoctorAllowed(email) {
  const raw = process.env.NEXT_PUBLIC_ALLOWED_DOCTOR_EMAILS || '';
  if (!raw.trim()) return true;
  return raw.split(',').map((e) => e.trim().toLowerCase()).includes(email.toLowerCase());
}

function mapFirebaseAuthError(err) {
  switch (err?.code) {
    case 'auth/configuration-not-found':
      return 'Google sign-in is not configured in Firebase. Enable Google provider in Firebase Console > Authentication > Sign-in method.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is disabled for this Firebase project. Enable it in Firebase Console > Authentication > Sign-in method.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Firebase sign-in. Add it in Firebase Console > Authentication > Settings > Authorized domains.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Allow popups for this site and try again.';
    case 'auth/popup-closed-by-user':
      return null;
    default:
      return err?.message || 'Unable to sign in right now. Please try again.';
  }
}

async function setDoctorPresence(user, available) {
  if (!user?.uid) return;

  // Only update heartbeat and basic info, do not overwrite specialties/experience
  await setDoc(doc(db, 'doctorPresence', user.uid), {
    uid: user.uid,
    name: user.displayName || user.email || 'Doctor',
    email: user.email || '',
    photoURL: user.photoURL || null,
    available,
    lastSeenAt: serverTimestamp(),
  }, { merge: true });
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Listen to Firebase auth state changes ──────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Publish doctor presence heartbeat while logged in ─────────────────────
  useEffect(() => {
    if (!user) return undefined;

    let mounted = true;
    const beat = async () => {
      if (!mounted) return;
      try {
        await setDoctorPresence(user, true);
      } catch (err) {
        console.error('[Presence] heartbeat failed:', err?.message || err);
      }
    };

    // Mark online immediately and keep heartbeating.
    beat();
    const intervalId = setInterval(beat, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      // Best effort mark-offline when auth session ends/unmounts.
      setDoctorPresence(user, false).catch(() => {});
    };
  }, [user]);

  // ── Google sign-in via popup ───────────────────────────────────────────────
  const signInWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email  = result.user.email;

      // Enforce doctor whitelist
      if (!isDoctorAllowed(email)) {
        // Sign them back out immediately
        await firebaseSignOut(auth);
        setError('ACCESS_DENIED');
        return null;
      }

      return result.user;
    } catch (err) {
      const mappedError = mapFirebaseAuthError(err);
      if (!mappedError) return null;
      setError(mappedError);
      return null;
    }
  };

  // ── Sign out ──────────────────────────────────────────────────────────────
  const signOut = async () => {
    if (auth.currentUser) {
      await setDoctorPresence(auth.currentUser, false).catch(() => {});
    }
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
