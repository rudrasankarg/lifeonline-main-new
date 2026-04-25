'use client';

import { useAuth } from '@/contexts/AuthContext';
import DashboardHome from '@/components/DashboardHome';

export default function DashboardPage() {
  const { user } = useAuth();
  return <DashboardHome user={user} />;
}
