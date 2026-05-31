import React from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../constants';
import Btn from '../components/common/Btn';
import Card from '../components/common/Card';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "var(--font-display)", minHeight: "100vh", background: COLORS.surfaceAlt, color: COLORS.text, overflowX: 'hidden', position: 'relative' }}>
      
      {/* Background Grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }}></div>

      {/* Navbar */}
      <nav style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 80, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS.primary, boxShadow: `0 0 10px ${COLORS.primary}` }}></div>
          <span style={{ fontWeight: 900, fontSize: 24, letterSpacing: '2px', color: COLORS.text, textTransform: 'uppercase' }}>सेहतSetu</span>
        </div>
        
        <div style={{ display: "flex", gap: 30, alignItems: "center", fontSize: 12, letterSpacing: '2px', color: COLORS.textMuted, fontWeight: 700 }}>
          <a href="#features" style={{ cursor: "pointer", transition: "color 0.2s", color: COLORS.textMuted, textDecoration: "none" }} onMouseOver={e => e.target.style.color = COLORS.primary} onMouseOut={e => e.target.style.color = COLORS.textMuted}>FEATURES</a>
          <a href="#how-it-works" style={{ cursor: "pointer", transition: "color 0.2s", color: COLORS.textMuted, textDecoration: "none" }} onMouseOver={e => e.target.style.color = COLORS.primary} onMouseOut={e => e.target.style.color = COLORS.textMuted}>HOW IT WORKS</a>
          <a href="#contact" style={{ cursor: "pointer", transition: "color 0.2s", color: COLORS.textMuted, textDecoration: "none" }} onMouseOver={e => e.target.style.color = COLORS.primary} onMouseOut={e => e.target.style.color = COLORS.textMuted}>CONTACT</a>
          <div id="bhashini-translation-widget"></div>
          <Btn variant="outline" small onClick={() => navigate("/signin")} style={{ fontSize: 14, letterSpacing: '1px', padding: "10px 24px", borderRadius: 0 }}>ACCESS PORTAL</Btn>
        </div>
      </nav>

      <div style={{ padding: "60px 5%", position: 'relative', zIndex: 10, maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Top Status Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, borderLeft: `2px solid ${COLORS.primary}`, paddingLeft: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.primary, boxShadow: `0 0 8px ${COLORS.primary}` }}></div>
          <span style={{ fontSize: 12, letterSpacing: '3px', color: COLORS.primary, fontWeight: 700 }}>RURAL-HEALTH-SECURED . AWAITING PATIENT LOGIN</span>
        </div>

        {/* Hero Content */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 60%', position: 'relative' }}>
            <h1 style={{ 
              fontSize: 'clamp(3rem, 8vw, 7rem)', 
              fontWeight: 900, 
              lineHeight: 1, 
              margin: '0 0 10px', 
              letterSpacing: '-2px',
              textTransform: 'uppercase'
            }}>
              HEALTHCARE<br/>
              <span style={{ color: COLORS.primary }}>FOR BHARAT.</span><br/>
              <span style={{ 
                WebkitTextStroke: `2px ${COLORS.textMuted}`, 
                color: 'transparent', 
                opacity: 0.5 
              }}>ACCESSIBLE.</span>
            </h1>

            <p style={{ fontSize: 16, color: COLORS.textMuted, lineHeight: 1.8, maxWidth: 500, margin: "40px 0", fontWeight: 300, letterSpacing: '0.5px' }}>
              A decentralized telemedicine platform where every prescription is cryptographically sealed, instantly verifiable, and permanently recorded. Your health, immutably preserved.
            </p>
            
            <div style={{ display: "flex", gap: 20 }}>
              <Btn onClick={() => navigate("/signup")} style={{ padding: "16px 40px", fontSize: 16, letterSpacing: '2px', borderRadius: 0, fontWeight: 700 }}>START CONSULTING</Btn>
              <Btn variant="outline" style={{ padding: "16px 40px", fontSize: 16, letterSpacing: '2px', borderRadius: 0, fontWeight: 700, borderColor: COLORS.textMuted, color: COLORS.textMuted }}>LEARN MORE</Btn>
            </div>
            
            {/* Glowing Dot near text */}
            <div style={{ position: 'absolute', right: '10%', bottom: '20%', width: 12, height: 12, borderRadius: '50%', border: `2px solid ${COLORS.primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 4, height: 4, background: COLORS.primary, borderRadius: '50%', boxShadow: `0 0 10px ${COLORS.primary}` }}></div>
            </div>
          </div>

          {/* Right Side Nodes */}
          <div style={{ flex: '1 1 30%', display: 'flex', flexDirection: 'column', gap: 40, marginTop: 40, position: 'relative' }}>
            {/* Connecting SVG line */}
            <svg style={{ position: 'absolute', top: 30, left: -60, width: 60, height: '100%', zIndex: -1, overflow: 'visible' }}>
              <path d="M -200 0 L 0 0 L 0 120 L -100 120 L -100 240 L 0 240" fill="none" stroke={COLORS.primary} strokeWidth="1" strokeOpacity="0.3" />
            </svg>

            <div style={{ border: `1px solid ${COLORS.border}`, background: 'rgba(5, 9, 20, 0.8)', padding: 20, width: 300, position: 'relative' }}>
              <p style={{ margin: 0, fontSize: 10, color: COLORS.primary, letterSpacing: '2px', fontWeight: 700, marginBottom: 8 }}>SESSION #48291</p>
              <p style={{ margin: 0, fontSize: 12, color: COLORS.text, fontFamily: 'monospace', marginBottom: 12 }}>Dr. R. Sharma - Gen. Physician</p>
              <p style={{ margin: 0, fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>✓</span> Appointment confirmed
              </p>
            </div>

            <div style={{ border: `1px solid ${COLORS.border}`, background: 'rgba(5, 9, 20, 0.8)', padding: 20, width: 300, marginLeft: -40, position: 'relative' }}>
              <p style={{ margin: 0, fontSize: 10, color: COLORS.primary, letterSpacing: '2px', fontWeight: 700, marginBottom: 8 }}>SESSION #48292</p>
              <p style={{ margin: 0, fontSize: 12, color: COLORS.text, fontFamily: 'monospace', marginBottom: 12 }}>Dr. A. Gupta - Cardiologist</p>
              <p style={{ margin: 0, fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>✓</span> Slot reserved
              </p>
            </div>
            
            <div style={{ border: `1px solid ${COLORS.border}`, background: 'rgba(5, 9, 20, 0.8)', padding: 20, width: 300, position: 'relative' }}>
              <p style={{ margin: 0, fontSize: 10, color: COLORS.primary, letterSpacing: '2px', fontWeight: 700, marginBottom: 8 }}>SESSION #48293</p>
              <p style={{ margin: 0, fontSize: 12, color: COLORS.text, fontFamily: 'monospace', marginBottom: 12 }}>Dr. S. Verma - Pediatrician</p>
              <p style={{ margin: 0, fontSize: 12, color: COLORS.primary, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, background: COLORS.primary, borderRadius: '50%' }}></span> Consulting...
              </p>
            </div>
          </div>
        </div>

        {/* Core Features */}
        <div id="features" style={{ marginTop: 120 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: COLORS.text, marginBottom: 40, letterSpacing: '1px', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 15 }}>// CORE FEATURES</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 30 }}>
            <Card style={{ padding: 40, textAlign: "left", background: "rgba(5, 9, 20, 0.6)", borderRadius: 0 }}>
              <div style={{ fontSize: 40, marginBottom: 20 }}>👨‍⚕️</div>
              <h3 style={{ fontSize: 24, marginBottom: 12, fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>Specialist Doctors</h3>
              <p style={{ fontSize: 16, color: COLORS.textMuted, lineHeight: 1.6 }}>Video call with top doctors from the comfort of your village center.</p>
            </Card>
            <Card style={{ padding: 40, textAlign: "left", background: "rgba(5, 9, 20, 0.6)", borderRadius: 0 }}>
              <div style={{ fontSize: 40, marginBottom: 20 }}>💊</div>
              <h3 style={{ fontSize: 24, marginBottom: 12, fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>Medicine Tracking</h3>
              <p style={{ fontSize: 16, color: COLORS.textMuted, lineHeight: 1.6 }}>Know which nearby pharmacy has your medicines in stock before you travel.</p>
            </Card>
            <Card style={{ padding: 40, textAlign: "left", background: "rgba(5, 9, 20, 0.6)", borderRadius: 0 }}>
              <div style={{ fontSize: 40, marginBottom: 20 }}>🚨</div>
              <h3 style={{ fontSize: 24, marginBottom: 12, fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>Emergency SOS</h3>
              <p style={{ fontSize: 16, color: COLORS.textMuted, lineHeight: 1.6 }}>One-tap emergency alert to notify village health workers and ambulances.</p>
            </Card>
            <Card style={{ padding: 40, textAlign: "left", background: "rgba(5, 9, 20, 0.6)", borderRadius: 0 }}>
              <div style={{ fontSize: 40, marginBottom: 20 }}>🔐</div>
              <h3 style={{ fontSize: 24, marginBottom: 12, fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>Encrypted Records</h3>
              <p style={{ fontSize: 16, color: COLORS.textMuted, lineHeight: 1.6 }}>Your medical history is cryptographically secured. Time-limited OTP access only.</p>
            </Card>
            <Card style={{ padding: 40, textAlign: "left", background: "rgba(5, 9, 20, 0.6)", borderRadius: 0 }}>
              <div style={{ fontSize: 40, marginBottom: 20 }}>🗣️</div>
              <h3 style={{ fontSize: 24, marginBottom: 12, fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>Local Language Support</h3>
              <p style={{ fontSize: 16, color: COLORS.textMuted, lineHeight: 1.6 }}>Full translation and voice-assistant support in Hindi, Bengali, and other regional languages.</p>
            </Card>
            <Card style={{ padding: 40, textAlign: "left", background: "rgba(5, 9, 20, 0.6)", borderRadius: 0 }}>
              <div style={{ fontSize: 40, marginBottom: 20 }}>📄</div>
              <h3 style={{ fontSize: 24, marginBottom: 12, fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>AI Prescription OCR</h3>
              <p style={{ fontSize: 16, color: COLORS.textMuted, lineHeight: 1.6 }}>Handwritten prescriptions are automatically scanned, digitized, and saved to your portal.</p>
            </Card>
          </div>
        </div>

        {/* How It Works */}
        <div id="how-it-works" style={{ marginTop: 120 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: COLORS.text, marginBottom: 40, letterSpacing: '1px', borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 15 }}>// SYSTEM.WORKFLOW</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            <div style={{ display: "flex", gap: 30, alignItems: "center", border: `1px solid ${COLORS.border}`, padding: 30, background: "rgba(5, 9, 20, 0.4)" }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: COLORS.primary, opacity: 0.5, fontFamily: 'monospace' }}>01</div>
              <div>
                <h3 style={{ fontSize: 22, color: COLORS.text, marginBottom: 8 }}>Register Node (Sign Up)</h3>
                <p style={{ fontSize: 16, color: COLORS.textMuted }}>Create your account as a Patient, Doctor, Pharmacy, or Health Worker. Authenticate your identity securely.</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 30, alignItems: "center", border: `1px solid ${COLORS.border}`, padding: 30, background: "rgba(5, 9, 20, 0.4)" }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: COLORS.primary, opacity: 0.5, fontFamily: 'monospace' }}>02</div>
              <div>
                <h3 style={{ fontSize: 22, color: COLORS.text, marginBottom: 8 }}>Book & Consult</h3>
                <p style={{ fontSize: 16, color: COLORS.textMuted }}>Find available specialist doctors and connect via high-quality WebRTC video calls, optimized for low bandwidth.</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: 30, alignItems: "center", border: `1px solid ${COLORS.border}`, padding: 30, background: "rgba(5, 9, 20, 0.4)" }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: COLORS.primary, opacity: 0.5, fontFamily: 'monospace' }}>03</div>
              <div>
                <h3 style={{ fontSize: 22, color: COLORS.text, marginBottom: 8 }}>Track & Recover</h3>
                <p style={{ fontSize: 16, color: COLORS.textMuted }}>Receive digitized prescriptions instantly. Locate available medicines in nearby pharmacies using the live GPS tracking system.</p>
              </div>
            </div>
            
          </div>
        </div>

        {/* Contact Section */}
        <div id="contact" style={{ marginTop: 100, padding: 40, border: `1px solid ${COLORS.border}`, background: "rgba(0, 240, 255, 0.02)" }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary, marginBottom: 20, letterSpacing: '2px' }}>SYSTEM.CONTACT</h2>
          <p style={{ fontSize: 16, color: COLORS.textMuted, marginBottom: 10 }}>For inquiries and technical support:</p>
          <p style={{ fontSize: 18, color: COLORS.text, marginBottom: 10, fontFamily: 'monospace' }}>Email: <a href="mailto:vanshikakhator@gmail.com" style={{ color: COLORS.primary, textDecoration: "none" }}>vanshikakhator@gmail.com</a></p>
          <p style={{ fontSize: 18, color: COLORS.text, fontFamily: 'monospace' }}>GitHub: <a href="https://github.com/vanshikakhator" target="_blank" rel="noreferrer" style={{ color: COLORS.primary, textDecoration: "none" }}>github.com/vanshikakhator</a></p>
        </div>
      </div>
    </div>
  );
}
