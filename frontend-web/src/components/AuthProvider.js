// AuthProvider shim – now delegates to Firebase AuthContext
'use client';

import { AuthProvider as FirebaseAuthProvider } from '@/contexts/AuthContext';

export function AuthProvider({ children }) {
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
}
