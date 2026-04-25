'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/patients',
    label: 'Patients',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.75"/>
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
        <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/schedule',
    label: 'Schedule',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.75"/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function DashboardSidebar({ user }) {
  const { signOut } = useAuth();
  const pathname    = usePathname();
  const router      = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const name  = user?.displayName || 'Doctor';
  const email = user?.email       || '';
  const photo = user?.photoURL    || null;

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* Brand */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: '#0D9488',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(13,148,136,0.20)',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="white" fillOpacity="0.9"/>
              <path d="M12 8v4M10 10h4" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.9375rem', margin: 0, letterSpacing: '-0.3px' }}>
              lifeOnLine
            </p>
            <p style={{ color: '#94A3B8', fontSize: '0.6875rem', margin: 0 }}>Doctor Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.875rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5625rem 0.75rem',
                borderRadius: 10,
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 500,
                color: active ? '#0D9488' : '#64748B',
                backgroundColor: active ? '#F0FDFA' : 'transparent',
                border: active ? '1px solid #CCFBF1' : '1px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748B'; } }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Online indicator */}
      <div style={{ padding: '0 0.75rem 0.75rem' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          backgroundColor: '#F0FDF4', borderRadius: 8,
          padding: '0.5rem 0.75rem',
          border: '1px solid #DCFCE7',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#16A34A', animation: 'pulse 2s infinite' }} />
          <span style={{ color: '#16A34A', fontSize: '0.75rem', fontWeight: 600 }}>Online</span>
        </div>
      </div>

      {/* User profile + sign-out */}
      <div style={{ padding: '0.875rem 0.75rem', borderTop: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
          {photo ? (
            <Image
              src={photo}
              alt={name}
              width={34}
              height={34}
              style={{ borderRadius: '50%', border: '2px solid #CCFBF1' }}
            />
          ) : (
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              backgroundColor: '#0D9488',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ color: '#fff', fontSize: '0.8125rem', fontWeight: 700 }}>{name[0]}</span>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#0F172A', fontSize: '0.875rem', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
            <p style={{ color: '#94A3B8', fontSize: '0.6875rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem',
            color: '#94A3B8',
            background: 'transparent',
            border: '1px solid #E2E8F0',
            padding: '0.5rem',
            borderRadius: 8,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FECACA'; e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
