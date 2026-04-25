'use client';

import { useAuth } from '@/contexts/AuthContext';
import VideoCallRoom from '@/components/VideoCallRoom';
import { use } from 'react';

export default function CallPage({ params }) {
  const { user } = useAuth();
  const { sessionId } = use(params);

  // Map Firebase user fields → shape VideoCallRoom expects
  const doctor = user ? {
    name:    user.displayName,
    email:   user.email,
    image:   user.photoURL,
    id:      user.uid,
  } : null;

  return <VideoCallRoom sessionId={sessionId} doctor={doctor} />;
}
