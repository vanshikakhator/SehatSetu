import React, { useState, useEffect, useRef } from 'react';
import { COLORS } from '../../constants';

// Supported Indian languages with their Google Translate codes
const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
];

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(() => localStorage.getItem('gramcare_lang') || 'en');
  const dropdownRef = useRef(null);

  // Inject Google Translate widget script dynamically (free, no API key needed)
  useEffect(() => {
    if (document.getElementById('google-translate-script')) return;

    // Define the init callback
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'hi,bn,ta,te,mr,gu,kn,ml,pa,or,en',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    };

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onerror = () => console.warn('Google Translate unavailable (offline)');
    document.body.appendChild(script);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyLanguage = (lang) => {
    setSelected(lang.code);
    localStorage.setItem('gramcare_lang', lang.code);
    setIsOpen(false);

    if (lang.code === 'en') {
      // Reset to English: reload without translate cookie
      const cookie = document.cookie;
      if (cookie.includes('googtrans')) {
        document.cookie = 'googtrans=/en/en; path=/; domain=' + window.location.hostname;
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.reload();
      }
      return;
    }

    // Set Google Translate cookie and trigger translation
    const langCode = `/en/${lang.code}`;
    document.cookie = `googtrans=${langCode}; path=/`;
    document.cookie = `googtrans=${langCode}; path=/; domain=.${window.location.hostname}`;

    // Trigger the hidden Google Translate combo box
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = lang.code;
      select.dispatchEvent(new Event('change'));
    } else {
      // Fallback: reload page with cookie set (Google Translate will pick it up)
      window.location.reload();
    }
  };

  const current = LANGUAGES.find(l => l.code === selected) || LANGUAGES[0];

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Hidden Google Translate element */}
      <div id="google_translate_element" style={{ display: 'none' }} />

      {/* Language Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: 10,
          padding: '7px 14px',
          cursor: 'pointer',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          backdropFilter: 'blur(4px)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
      >
        <span style={{ fontSize: 18 }}>🌐</span>
        <span>{current.native}</span>
        <span style={{ fontSize: 10, opacity: 0.8 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          right: 0,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          zIndex: 5000,
          minWidth: 200,
          overflow: 'hidden',
          border: `1px solid ${COLORS.border}`,
          animation: 'slideDown 0.15s ease-out',
        }}>
          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div style={{ padding: '10px 14px', background: COLORS.primaryLight, borderBottom: `1px solid ${COLORS.border}` }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: COLORS.primaryDark, textTransform: 'uppercase', letterSpacing: 1 }}>
              🌐 Select Language
            </p>
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => applyLanguage(lang)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: selected === lang.code ? COLORS.primaryLight : 'transparent',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  borderLeft: selected === lang.code ? `3px solid ${COLORS.primary}` : '3px solid transparent',
                }}
                onMouseEnter={e => { if (selected !== lang.code) e.currentTarget.style.background = '#f0faf5'; }}
                onMouseLeave={e => { if (selected !== lang.code) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 14, color: COLORS.text, fontWeight: selected === lang.code ? 700 : 500 }}>
                  {lang.native}
                </span>
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                  {lang.label}
                  {selected === lang.code && ' ✓'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
