'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const toggleDarkMode = (checked) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const savePreferences = () => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '760px', margin: '0 auto', color: 'var(--foreground)' }}>
      <h1 style={{ fontSize: '1.625rem', fontWeight: '700', marginBottom: '0.375rem', color: 'var(--foreground)' }}>Settings</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.875rem' }}>Manage your portal preferences.</p>

      {/* Appearance card */}
      <div style={{
        background: 'var(--surface)',
        padding: '1.5rem',
        borderRadius: '14px',
        border: '1px solid var(--border)',
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--foreground)', letterSpacing: '-0.2px' }}>
          Appearance
        </h2>

        {/* Dark mode row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ fontWeight: '600', margin: '0 0 0.2rem', fontSize: '0.9375rem', color: 'var(--foreground)' }}>Dark Mode</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>Switch between light and dark themes</p>
          </div>

          {/* Toggle switch — no jarring white thumb */}
          <button
            role="switch"
            aria-checked={darkMode}
            onClick={() => toggleDarkMode(!darkMode)}
            style={{
              width: 48, height: 26,
              borderRadius: 13,
              backgroundColor: darkMode ? 'var(--primary)' : 'var(--border)',
              border: 'none',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 20, height: 20,
              borderRadius: '50%',
              // Softer thumb: slightly off-white so it doesn't flash
              backgroundColor: darkMode ? '#E2E8F0' : '#FFFFFF',
              position: 'absolute',
              top: 3,
              left: darkMode ? 25 : 3,
              transition: 'left 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            }} />
          </button>
        </div>

        {/* Save button — muted, not screaming teal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <button
            onClick={savePreferences}
            style={{
              background: 'var(--primary)',
              color: darkMode ? '#0F172A' : '#FFFFFF',
              border: 'none',
              padding: '0.625rem 1.375rem',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              opacity: 0.9,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.9'}
          >
            Save Preferences
          </button>
          {saved && (
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--success)', transition: 'opacity 0.3s' }}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
