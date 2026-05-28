import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, mockInventory } from '../constants';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Btn from '../components/common/Btn';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import axios from 'axios';

export default function PharmacyDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("inventory");
  const [inventory, setInventory] = useState([]);
  const [newMed, setNewMed] = useState({ name: "", stock: "", price: "", threshold: 20 });
  const [locationStr, setLocationStr] = useState(user?.location || '');
  const [locationStatus, setLocationStatus] = useState('');
  const [orders, setOrders] = useState([]);
  const [advanceInput, setAdvanceInput] = useState({});

  // Auto-capture GPS every time pharmacy logs in — ensures map always shows current location
  useEffect(() => {
    if (!user?._id) return;

    // Fetch inventory
    axios.get(`http://localhost:5000/api/auth/inventory/${user._id}`)
      .then(res => setInventory(res.data))
      .catch(err => console.error(err));

    // Fetch medicine orders
    axios.get(`http://localhost:5000/api/medicine-orders/pharmacy/${user._id}`)
      .then(res => setOrders(res.data))
      .catch(err => console.error(err));

    // Auto-save current GPS location silently
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const coords = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
          setLocationStr(coords);
          try {
            await axios.put('http://localhost:5000/api/auth/profile', {
              userId: user._id,
              location: coords
            }, { headers: { 'user-id': user._id } });
            setLocationStatus(`✅ Live location captured: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } catch (e) {
            setLocationStatus('⚠️ Could not auto-save location');
          }
        },
        () => setLocationStatus('⚠️ Location access denied — click "Use My Current Location" manually')
      );
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

  const fetchAndSaveGPSLocation = () => {
    setLocationStatus('Fetching your GPS location...');
    if (!navigator.geolocation) {
      setLocationStatus('❌ Geolocation not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
        setLocationStr(coords);
        try {
          await axios.put('http://localhost:5000/api/auth/profile', {
            userId: user._id,
            location: coords
          }, { headers: { 'user-id': user._id } });
          setLocationStatus(`✅ Location saved: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch (e) {
          setLocationStatus('❌ Failed to save location. Please try again.');
        }
      },
      () => setLocationStatus('❌ Permission denied. Please allow location access and retry.')
    );
  };

  const handleSetAdvance = async (orderId) => {
    const amt = advanceInput[orderId];
    if (!amt || isNaN(amt)) return alert("Please enter a valid amount");
    try {
      const res = await axios.put(`http://localhost:5000/api/medicine-orders/${orderId}/advance`, { advanceAmount: Number(amt) });
      setOrders(orders.map(o => o._id === orderId ? res.data : o));
    } catch (err) {
      alert("Failed to set advance");
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/medicine-orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(o => o._id === orderId ? res.data : o));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const tabs = [{ id: "inventory", label: "Inventory", icon: "📦" }, { id: "requests", label: "Patient Requests", icon: "👥" }];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: "#f0faf5" }}>
      {/* Top Navbar */}
      <nav style={{ background: "#7c3aed", color: "#fff", padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 70, position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div style={{ fontSize: 32 }}>💊</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 24 }}>{user?.name || "Sharma Medical"} — Pharmacy</span>
            {user?.isVerified && <Badge color="success">✓ Verified</Badge>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <LanguageSwitcher />
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
              {/* Location Card — fix location for map visibility */}
              <Card style={{ marginBottom: 24, padding: 24, border: `2px solid ${locationStr ? '#22c55e' : '#f59e0b'}`, background: locationStr ? '#f0fdf4' : '#fffbeb' }}>
                <p style={{ margin: '0 0 12px', fontWeight: 800, fontSize: 18, color: COLORS.text }}>📍 Pharmacy Location (used for "Get Directions" on patient app)</p>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: COLORS.textMuted }}>
                  {locationStr ? `Currently saved: ${locationStr}` : '⚠️ No location saved — patients cannot find you on the map!'}
                </p>
                {locationStatus && <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: locationStatus.startsWith('✅') ? '#16a34a' : locationStatus.startsWith('❌') ? '#dc2626' : '#b45309' }}>{locationStatus}</p>}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Manual lat,lng entry */}
                  <input
                    placeholder="Enter lat,lng manually (e.g. 28.6139,77.2090)"
                    value={locationStr}
                    onChange={e => setLocationStr(e.target.value)}
                    style={{ flex: 1, minWidth: 220, padding: '12px 16px', borderRadius: 10, border: '1.5px solid #d1d5db', fontSize: 15, boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={async () => {
                      const val = locationStr.trim();
                      if (!val) return;
                      try {
                        await axios.put('http://localhost:5000/api/auth/profile', {
                          userId: user._id,
                          location: val
                        }, { headers: { 'user-id': user._id } });
                        setLocationStatus('✅ Location saved successfully!');
                      } catch (e) {
                        setLocationStatus('❌ Failed to save. Try again.');
                      }
                    }}
                    style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                  >
                    💾 Save
                  </button>
                  <button
                    onClick={fetchAndSaveGPSLocation}
                    style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                  >
                    📡 Use GPS
                  </button>
                </div>
              </Card>

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
              <h2 style={{ color: COLORS.text, marginBottom: 24, fontSize: 32 }}>Patient Medicine Requests</h2>
              {orders.length === 0 ? (
                <Card style={{ padding: 30, textAlign: 'center' }}><p style={{ fontSize: 18, color: COLORS.textMuted }}>No requests yet.</p></Card>
              ) : (
                orders.map(order => (
                  <Card key={order._id} style={{ padding: 24, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>Patient: {order.patientName}</p>
                        <p style={{ margin: '4px 0 0', color: COLORS.textMuted, fontSize: 16 }}>Order total: ₹{order.totalAmount}</p>
                      </div>
                      <Badge color={
                        order.status === 'requested' ? 'gray' : 
                        order.status === 'advance_pending' ? 'amber' : 
                        order.status === 'advance_paid' ? 'green' : 'blue'
                      }>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    <div style={{ background: '#f8fafc', padding: 15, borderRadius: 12, marginBottom: 20 }}>
                      <p style={{ margin: '0 0 10px', fontWeight: 700 }}>Requested Medicines:</p>
                      {order.medicines.map((m, i) => (
                        <p key={i} style={{ margin: '4px 0', fontSize: 15 }}>• {m.name} - Qty: {m.qty} (@ ₹{m.price}/unit)</p>
                      ))}
                    </div>

                    {order.status === 'requested' && (
                      <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                        <input 
                          type="number" 
                          placeholder="Advance amount (₹)" 
                          value={advanceInput[order._id] || ''}
                          onChange={(e) => setAdvanceInput({...advanceInput, [order._id]: e.target.value})}
                          style={{ padding: '10px 15px', borderRadius: 8, border: `1px solid ${COLORS.border}` }}
                        />
                        <Btn onClick={() => handleSetAdvance(order._id)}>Request Advance</Btn>
                      </div>
                    )}

                    {order.status === 'advance_paid' && (
                      <div style={{ display: 'flex', gap: 15 }}>
                        <Btn onClick={() => handleUpdateStatus(order._id, 'ready_for_pickup')} style={{ background: '#3b82f6' }}>Mark Ready for Pickup</Btn>
                      </div>
                    )}

                    {order.status === 'ready_for_pickup' && (
                      <div style={{ display: 'flex', gap: 15 }}>
                        <Btn onClick={() => handleUpdateStatus(order._id, 'completed')} style={{ background: '#10b981' }}>Mark Completed</Btn>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
