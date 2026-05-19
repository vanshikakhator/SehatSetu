import React from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../constants';
import Btn from '../components/common/Btn';
import Card from '../components/common/Card';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: "#f0faf5" }}>
      {/* Navbar */}
      <nav style={{ background: "#fff", borderBottom: `1px solid ${COLORS.border}`, padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 80, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🌿</div>
          <span style={{ fontWeight: 800, fontSize: 28, color: COLORS.text }}>सेहतSetu</span>
          <span style={{ fontSize: 18, color: COLORS.textMuted, fontStyle: "italic", marginLeft: -5 }}>SehatSetu</span>
        </div>
        
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div id="bhashini-translation-widget"></div>
          <Btn variant="outline" small onClick={() => navigate("/signin")} style={{ fontSize: 20, padding: "12px 24px" }}>Sign In</Btn>
          <Btn small onClick={() => navigate("/signup")} style={{ fontSize: 20, padding: "12px 24px" }}>Sign Up</Btn>
        </div>
      </nav>

      <div style={{ padding: "80px 5% 60px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: 60, fontWeight: 900, color: COLORS.text, marginBottom: 24 }}>
          Comprehensive Healthcare for <span style={{ color: COLORS.primary }}>Rural India</span>
        </h1>
        <p style={{ fontSize: 24, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 48, maxWidth: 800, margin: "0 auto 48px" }}>
          SehatSetu connects villagers with specialized doctors, provides real-time medicine tracking, and enables emergency SOS support—all in your local language.
        </p>
        
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 80 }}>
          <Btn onClick={() => navigate("/signup")} style={{ padding: "20px 50px", fontSize: 22 }}>Join the Community →</Btn>
          <Btn variant="ghost" style={{ padding: "20px 30px", fontSize: 22 }}>How it Works</Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 30 }}>
          <Card style={{ padding: 40, textAlign: "left" }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>👨‍⚕️</div>
            <h3 style={{ fontSize: 24, marginBottom: 12 }}>Specialist Doctors</h3>
            <p style={{ fontSize: 18, color: COLORS.textMuted }}>Video call with top doctors from the comfort of your village center.</p>
          </Card>
          <Card style={{ padding: 40, textAlign: "left" }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>💊</div>
            <h3 style={{ fontSize: 24, marginBottom: 12 }}>Medicine Tracking</h3>
            <p style={{ fontSize: 18, color: COLORS.textMuted }}>Know which nearby pharmacy has your medicines in stock before you travel.</p>
          </Card>
          <Card style={{ padding: 40, textAlign: "left" }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>🚨</div>
            <h3 style={{ fontSize: 24, marginBottom: 12 }}>Emergency SOS</h3>
            <p style={{ fontSize: 18, color: COLORS.textMuted }}>One-tap emergency alert to notify village health workers and ambulances.</p>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: "60px 5%", borderTop: `1px solid ${COLORS.border}`, textAlign: "center", background: "#fff" }}>
        <p style={{ color: COLORS.textMuted, fontSize: 18 }}>© 2026 SehatSetu — Empowering Rural Healthcare.</p>
      </footer>
    </div>
  );
}
