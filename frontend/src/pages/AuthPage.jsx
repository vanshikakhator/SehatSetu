import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../constants';
import Btn from '../components/common/Btn';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

export default function AuthPage({ mode }) {
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    specialization: "",
    consultationFee: "",
    location: "",
    communityName: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { id: "patient", icon: "🧑‍🦱", label: "Patient", desc: "Book appointments & consult doctors" },
    { id: "doctor", icon: "👨‍⚕️", label: "Doctor", desc: "Manage patients & consultations" },
    { id: "pharmacy", icon: "💊", label: "Pharmacy", desc: "Manage medicine inventory" },
    { id: "worker", icon: "🏃", label: "Health Worker", desc: "Village community health support" },
  ];

  const fetchLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setForm(f => ({ ...f, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
      }, (err) => {
        setError("Could not fetch location. Please enter manually.");
      });
    } else {
      setError("Geolocation not supported by your browser.");
    }
  };

  const handleSubmit = async () => {
    if (!navigator.onLine) {
      setError("You are currently offline. You need an internet connection to log in or sign up.");
      return;
    }
    
    if (!role) {
      setError("Please select a role");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (mode === 'signup') {
        const signupData = { ...form, role };
        // Clean up fields based on role
        if (role !== 'doctor') {
          delete signupData.specialization;
          delete signupData.consultationFee;
        }
        if (role !== 'pharmacy') {
          delete signupData.location;
        }
        if (role !== 'worker') {
          delete signupData.communityName;
        }
        await signup(signupData);
      } else {
        await login(form.phone, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0faf5", display: "flex", flexDirection: "column" }}>
      {/* Navbar for Bhashini/Brand */}
      <nav style={{ background: "#fff", borderBottom: `1px solid ${COLORS.border}`, padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 70, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate('/')}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌿</div>
          <span style={{ fontWeight: 800, fontSize: 24, color: COLORS.text }}>सेहतSetu</span>
        </div>
        <div id="bhashini-translation-widget"><LanguageSwitcher /></div>
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: 40, width: 520, maxWidth: "100%", border: `1px solid ${COLORS.border}` }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 12px" }}>🌿</div>
            <h2 style={{ margin: 0, color: COLORS.text, fontWeight: 800 }}>{mode === "signup" ? "Join SehatSetu" : "Welcome Back"}</h2>
            <p style={{ color: COLORS.textMuted, fontSize: 16, margin: "6px 0 0" }}>{mode === "signup" ? "Create your account" : "Sign in to continue"}</p>
          </div>

          {error && (
            <div style={{ background: COLORS.dangerLight, color: COLORS.danger, padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <p style={{ fontWeight: 700, fontSize: 16, color: COLORS.text, marginBottom: 12 }}>I am a...</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {roles.map(r => (
              <button key={r.id} onClick={() => setRole(r.id)} style={{ padding: "16px 14px", borderRadius: 14, border: `2px solid ${role === r.id ? COLORS.primary : COLORS.border}`, background: role === r.id ? COLORS.primaryLight : "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{r.icon}</div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: role === r.id ? COLORS.primary : COLORS.text }}>{r.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: COLORS.textMuted }}>{r.desc}</p>
              </button>
            ))}
          </div>

          {role && (
            <div style={{ display: "grid", gap: 12 }}>
              {(mode === "signup" || role === "worker") && (
                <input
                  placeholder={role === "worker" ? "Worker Name (e.g. Ramesh)" : "Full Name"}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: "100%", padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 16, boxSizing: "border-box" }}
                />
              )}
              <input
                placeholder="Phone / Email"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                style={{ width: "100%", padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 16, boxSizing: "border-box" }}
              />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ width: "100%", padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 16, boxSizing: "border-box" }}
              />

              {mode === 'signup' && (
                <>
                  {role === 'doctor' && (
                    <>
                      <input
                        placeholder="Specialization (e.g. Cardiologist)"
                        value={form.specialization}
                        onChange={e => setForm({ ...form, specialization: e.target.value })}
                        style={{ width: "100%", padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 16, boxSizing: "border-box" }}
                      />
                      <input
                        type="number"
                        placeholder="Consultation Fee (₹)"
                        value={form.consultationFee}
                        onChange={e => setForm({ ...form, consultationFee: e.target.value })}
                        style={{ width: "100%", padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 16, boxSizing: "border-box" }}
                      />
                    </>
                  )}

                  {role === 'pharmacy' && (
                    <div style={{ display: "flex", gap: 10 }}>
                      <input
                        placeholder="Pharmacy Location (Address or Coords)"
                        value={form.location}
                        onChange={e => setForm({ ...form, location: e.target.value })}
                        style={{ flex: 1, padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 16, boxSizing: "border-box" }}
                      />
                      <button onClick={fetchLocation} style={{ background: COLORS.primaryLight, border: "none", borderRadius: 12, padding: "0 15px", color: COLORS.primary, cursor: "pointer", fontSize: 20 }}>📍</button>
                    </div>
                  )}

                  {role === 'worker' && (
                    <input
                      placeholder="Community Name (e.g. ASHA Workers)"
                      value={form.communityName}
                      onChange={e => setForm({ ...form, communityName: e.target.value })}
                      style={{ width: "100%", padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 16, boxSizing: "border-box" }}
                    />
                  )}
                </>
              )}

              <Btn
                onClick={handleSubmit}
                style={{ width: "100%", fontSize: 18, padding: "16px 0", marginTop: 12 }}
                disabled={loading}
              >
                {loading ? "Processing..." : (mode === "signup" ? "Create Account" : "Sign In")} →
              </Btn>
            </div>
          )}
          <p style={{ textAlign: "center", fontSize: 15, color: COLORS.textMuted, marginTop: 24 }}>
            {mode === "signup" ? "Already have an account? " : "New to SehatSetu? "}
            <button
              onClick={() => navigate(mode === "signup" ? "/signin" : "/signup")}
              style={{ background: "none", border: "none", color: COLORS.primary, fontWeight: 700, cursor: "pointer", fontSize: 15 }}
            >
              {mode === "signup" ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
