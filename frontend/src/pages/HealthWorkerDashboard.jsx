import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, mockVillagePatients } from '../constants';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Btn from '../components/common/Btn';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

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
    <div style={{ fontFamily: "var(--font-display)", minHeight: "100vh", background: COLORS.surfaceAlt, position: "relative" }}>
      {/* Background Grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }}></div>
      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Top Navbar */}
        <nav style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 80, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏃</div>
            <span style={{ fontWeight: 800, fontSize: 28, color: COLORS.text }}>सेहतSetu <span style={{ fontSize: 16, color: COLORS.textMuted, fontStyle: "italic", fontWeight: 600 }}>Health Worker</span></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 15, marginRight: 20 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: COLORS.text }}>{user?.name || "Health Worker"}</p>
                  {user?.isVerified && <Badge color="success">✓ Verified</Badge>}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: COLORS.textMuted }}>{user?.communityName || "Village Community Support"}</p>
              </div>
            </div>
            <LanguageSwitcher />
            <button onClick={handleLogout} style={{ background: COLORS.primaryLight, border: "none", color: COLORS.primary, padding: "8px 20px", borderRadius: 10, cursor: "pointer", fontSize: 16, fontWeight: 700 }}>Logout</button>
          </div>
        </nav>

        <div className="dashboard-layout">
          {/* Sidebar */}
          <aside className="sidebar" style={{ width: 300 }}>
            {/* <div style={{ padding: "24px", borderBottom: `1px solid ${COLORS.border}`, marginBottom: 15 }}>
              <p style={{ margin: 0, fontWeight: 800, color: "#b45309", fontSize: 24 }}>SehatSetu Worker</p>
            </div> */}
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, marginBottom: 32, color: "black" }}>
                  {[["Total Patients", "47", "👥"], ["Follow-ups Due", "8", "📅"], ["Urgent Cases", "2", "🚨"], ["Appointments Aided", "23", "✅"]].map(([l, v, ic]) => (
                    <div key={l} style={{ background: "#fff5eb", borderRadius: 18, padding: 24 }}>
                      <p style={{ margin: 0, fontSize: 32 }}>{ic}</p>
                      <p style={{ margin: "12px 0 4px", fontWeight: 800, fontSize: 32, color: "#3b3d56" }}>{v}</p>
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

            {tab === "campaigns" && (
              <div>
                <h3 style={{ color: COLORS.text, marginBottom: 24, fontSize: 24 }}>📢 Active Health Campaigns</h3>
                <Card style={{ marginBottom: 20, padding: 30, borderLeft: `6px solid ${COLORS.primary}` }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 22 }}>Polio Vaccination Drive</p>
                  <p style={{ fontSize: 16, color: COLORS.textMuted, margin: "8px 0" }}>Target: Children under 5 years in Sector 4 and 5.</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Status: <span style={{ color: COLORS.primary }}>Ongoing (Ends in 2 days)</span></p>
                </Card>
                <Card style={{ marginBottom: 20, padding: 30, borderLeft: `6px solid ${COLORS.accent}` }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 22 }}>Maternal Health Awareness</p>
                  <p style={{ fontSize: 16, color: COLORS.textMuted, margin: "8px 0" }}>Target: Pregnant women and new mothers.</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Status: <span style={{ color: COLORS.accent }}>Scheduled (Starts next week)</span></p>
                </Card>
              </div>
            )}

            {tab === "records" && (
              <div>
                <h3 style={{ color: COLORS.text, marginBottom: 24, fontSize: 24 }}>📴 Offline Data Sync</h3>
                <p style={{ fontSize: 18, color: COLORS.textMuted, marginBottom: 30 }}>Records stored on this device waiting for internet connection.</p>
                <Card style={{ marginBottom: 20, padding: 30 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>Patient Assessment: Ramesh Kumar</p>
                      <p style={{ fontSize: 16, color: COLORS.textMuted, margin: "4px 0 0" }}>Recorded 2 hours ago</p>
                    </div>
                    <Badge color="amber">Pending Sync</Badge>
                  </div>
                </Card>
                <Card style={{ marginBottom: 20, padding: 30 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>New Patient Registration: Sita Devi</p>
                      <p style={{ fontSize: 16, color: COLORS.textMuted, margin: "4px 0 0" }}>Recorded 5 hours ago</p>
                    </div>
                    <Badge color="amber">Pending Sync</Badge>
                  </div>
                </Card>
                <Btn style={{ marginTop: 10, width: '100%', background: COLORS.primary }}>Sync All Now</Btn>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
