import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, mockInventory } from '../constants';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Btn from '../components/common/Btn';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function PharmacyDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("inventory");
  const [inventory, setInventory] = useState([]);
  const [newMed, setNewMed] = useState({ name: "", stock: "", price: "", threshold: 20 });

  useEffect(() => {
    if (user?._id) {
      axios.get(`http://localhost:5000/api/auth/inventory/${user._id}`)
        .then(res => setInventory(res.data))
        .catch(err => console.error(err));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const saveInventory = async (inv) => {
    try {
      await axios.put(`http://localhost:5000/api/auth/inventory/${user._id}`, { inventory: inv });
      setInventory(inv);
    } catch (err) {
      console.error(err);
      alert("Failed to update inventory: " + (err.response?.data?.message || err.message));
    }
  };

  const updateStock = (i, qty) => {
    const inv = [...inventory];
    inv[i].stock = Math.max(0, Number(inv[i].stock) + qty);
    inv[i].status = inv[i].stock === 0 ? "out" : inv[i].stock < inv[i].threshold ? "low" : "ok";
    saveInventory(inv);
  };

  const handleAddMed = () => {
    if (!newMed.name) return;
    const inv = [...inventory, {
      name: newMed.name,
      stock: Number(newMed.stock),
      price: Number(newMed.price),
      threshold: Number(newMed.threshold) || 20,
      status: Number(newMed.stock) === 0 ? "out" : Number(newMed.stock) < (Number(newMed.threshold) || 20) ? "low" : "ok"
    }];
    saveInventory(inv);
    setNewMed({ name: "", stock: "", price: "", threshold: 20 });
  };

  const tabs = [{ id: "inventory", label: "Inventory", icon: "📦" }, { id: "requests", label: "Patient Requests", icon: "👥" }, { id: "reserve", label: "Reservations", icon: "📋" }];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: "#f0faf5" }}>
      {/* Top Navbar */}
      <nav style={{ background: "#7c3aed", color: "#fff", padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 70, position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div style={{ fontSize: 32 }}>💊</div>
          <span style={{ fontWeight: 800, fontSize: 24 }}>{user?.name || "Sharma Medical"} — Pharmacy</span>
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
            <p style={{ margin: 0, fontWeight: 800, color: "#7c3aed", fontSize: 24 }}>SehatSetu Pharmacy</p>
          </div>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`sidebar-item ${tab === t.id ? 'active' : ''}`}
              style={{
                fontSize: 20,
                padding: "18px 30px",
                background: tab === t.id ? "#f5f3ff" : "transparent",
                color: tab === t.id ? "#7c3aed" : COLORS.textMuted,
                borderRightColor: "#7c3aed"
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
          {tab === "inventory" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0, color: COLORS.text, fontSize: 32 }}>Medicine Inventory</h2>
                <div style={{ display: "flex", gap: 12 }}>
                  <Badge color="red" dot style={{ fontSize: 14 }}>● {inventory.filter(m => m.status === "out").length} Out</Badge>
                  <Badge color="amber" dot style={{ fontSize: 14 }}>● {inventory.filter(m => m.status === "low").length} Low</Badge>
                </div>
              </div>
              <Card style={{ marginBottom: 30, padding: 30 }}>
                <h4 style={{ margin: "0 0 20px", fontSize: 22 }}>Add New Medicine</h4>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 15, alignItems: "end" }}>
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: 16, color: COLORS.textMuted }}>Name</p>
                    <input value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} style={{ width: "100%", padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 18 }} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: 16, color: COLORS.textMuted }}>Stock</p>
                    <input type="number" value={newMed.stock} onChange={e => setNewMed({ ...newMed, stock: e.target.value })} style={{ width: "100%", padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 18 }} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: 16, color: COLORS.textMuted }}>Price</p>
                    <input type="number" value={newMed.price} onChange={e => setNewMed({ ...newMed, price: e.target.value })} style={{ width: "100%", padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 18 }} />
                  </div>
                  <Btn onClick={handleAddMed} style={{ padding: "14px 0", fontSize: 18 }}>Add</Btn>
                </div>
              </Card>
              {inventory.map((m, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "20px 24px", marginBottom: 15, display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 20 }}>💊 {m.name}</p>
                    <p style={{ margin: "6px 0 0", fontSize: 16, color: COLORS.textMuted }}>₹{m.price}/unit · Min stock: {m.threshold}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                    <button onClick={() => updateStock(i, -10)} style={{ background: COLORS.dangerLight, border: "none", borderRadius: 8, width: 40, height: 40, cursor: "pointer", fontWeight: 800, color: COLORS.danger, fontSize: 24 }}>-</button>
                    <span style={{ fontWeight: 900, fontSize: 24, minWidth: 50, textAlign: "center" }}>{m.stock}</span>
                    <button onClick={() => updateStock(i, 10)} style={{ background: COLORS.primaryLight, border: "none", borderRadius: 8, width: 40, height: 40, cursor: "pointer", fontWeight: 800, color: COLORS.primary, fontSize: 24 }}>+</button>
                  </div>
                  <Badge color={m.status === "out" ? "red" : m.status === "low" ? "amber" : "green"} style={{ fontSize: 14 }}>{m.status.toUpperCase()}</Badge>
                </div>
              ))}
            </div>
          )}

          {tab === "requests" && (
            <div>
              <h2 style={{ color: COLORS.text, marginBottom: 24, fontSize: 32 }}>Patient Requests</h2>
              <Card style={{ padding: 30 }}>
                <p style={{ color: COLORS.textMuted, fontSize: 18 }}>Recent requests for medicines from village health workers...</p>
                <div style={{ marginTop: 20 }}>
                  {[["Ramesh Das", "Paracetamol", "Pending"], ["Puja Ghosh", "Amoxicillin", "Fulfilled"]].map(([p, m, s]) => (
                    <div key={p} style={{ display: "flex", justifyContent: "space-between", padding: "15px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                      <span style={{ fontSize: 18 }}>{p} — {m}</span>
                      <Badge color={s === "Pending" ? "amber" : "green"}>{s}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
