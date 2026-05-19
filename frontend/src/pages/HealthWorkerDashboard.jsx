import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, mockVillagePatients } from '../constants';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Btn from '../components/common/Btn';
import { useAuth } from '../context/AuthContext';

export default function HealthWorkerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("patients");

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const tabs = [
    { id: "patients", label: "Village Patients", icon: "👥" },
    { id: "emergency", label: "Emergency", icon: "🚨" },
    { id: "campaigns", label: "Campaigns", icon: "📢" },
    { id: "records", label: "Offline Records", icon: "📴" },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: "#f0faf5" }}>
      {/* Top Navbar */}
      <nav style={{ background: "#b45309", color: "#fff", padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 70, position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div style={{ fontSize: 32 }}>🏃</div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>{user?.name || "Health Worker"}</p>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>{user?.communityName || "Village Community Support"}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div id="bhashini-translation-widget"></div>
          <button onClick={handleLogout} style={{ background: "#ffffff22", border: "none", color: "#fff", padding: "8px 20px", borderRadius: 10, cursor: "pointer", fontSize: 18, fontWeight: 700 }}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar" style={{ width: 300 }}>
          <div style={{ padding: "24px", borderBottom: `1px solid ${COLORS.border}`, marginBottom: 15 }}>
            <p style={{ margin: 0, fontWeight: 800, color: "#b45309", fontSize: 24 }}>SehatSetu Worker</p>
          </div>
          {tabs.map(t => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)} 
              className={`sidebar-item ${tab === t.id ? 'active' : ''}`}
              style={{ 
                fontSize: 20, 
                padding: "18px 30px",
                background: tab === t.id ? "#fffbeb" : "transparent",
                color: tab === t.id ? "#b45309" : COLORS.textMuted,
                borderRightColor: "#b45309"
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
          <button 
            onClick={() => navigate('/profile')} 
            className="sidebar-item"
            style={{ fontSize: 20, padding: "18px 30px", marginTop: "auto" }}
          >
            <span>👤</span>
            <span>My Profile</span>
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="main-content" style={{ padding: 40 }}>
          {tab === "patients" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, marginBottom: 32 }}>
                {[["Total Patients", "47", "👥"], ["Follow-ups Due", "8", "📅"], ["Urgent Cases", "2", "🚨"], ["Appointments Aided", "23", "✅"]].map(([l, v, ic]) => (
                  <div key={l} style={{ background: "#fff5eb", borderRadius: 18, padding: 24 }}>
                    <p style={{ margin: 0, fontSize: 32 }}>{ic}</p>
                    <p style={{ margin: "12px 0 4px", fontWeight: 800, fontSize: 32, color: COLORS.text }}>{v}</p>
                    <p style={{ margin: 0, fontSize: 16, color: COLORS.textMuted }}>{l}</p>
                  </div>
                ))}
              </div>
              <h3 style={{ color: COLORS.text, marginBottom: 20, fontSize: 24 }}>Village Patient List</h3>
              {mockVillagePatients.map((p, i) => (
                <Card key={i} style={{ marginBottom: 15, padding: 30, borderLeft: `6px solid ${p.status === "urgent" ? COLORS.danger : p.status === "needs-followup" ? COLORS.accent : COLORS.primary}` }}>
                  <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
                    <Avatar initials={p.name.split(" ").map(n => n[0]).join("")} size={60} color={p.status === "urgent" ? COLORS.danger : COLORS.primary} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 15 }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 20 }}>{p.name} <span style={{ color: COLORS.textMuted, fontWeight: 400, fontSize: 18 }}>· {p.age}y</span></p>
                          <p style={{ margin: "6px 0 4px", fontSize: 18, color: COLORS.textMuted }}>📍 {p.village} · {p.condition}</p>
                          <p style={{ margin: 0, fontSize: 16, color: COLORS.textMuted }}>Last visit: {p.lastVisit}</p>
                        </div>
                        <Badge color={p.status === "urgent" ? "red" : p.status === "needs-followup" ? "amber" : "green"} style={{ fontSize: 14 }}>{p.status.toUpperCase()}</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === "emergency" && (
            <div style={{ textAlign: "center" }}>
              <h2 style={{ color: COLORS.text, fontSize: 32 }}>🚨 Emergency Response Center</h2>
              <p style={{ color: COLORS.textMuted, fontSize: 18, marginBottom: 40 }}>Recent SOS alerts in your sector...</p>
              <Card style={{ textAlign: "left", padding: 30 }}>
                <p style={{ fontWeight: 800, color: COLORS.danger, fontSize: 20 }}>Patient: Puja Ghosh</p>
                <p style={{ fontSize: 18 }}>Condition: Severe abdominal pain</p>
                <p style={{ fontSize: 18, color: COLORS.textMuted }}>Location: Barasat Plot #45 (2.3 km away)</p>
                <Btn style={{ marginTop: 20, background: COLORS.danger }}>Navigate to Patient</Btn>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
