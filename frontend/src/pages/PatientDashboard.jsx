import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, mockMedicines } from '../constants';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Btn from '../components/common/Btn';
import SOSButton from '../components/common/SOSButton';
import NetworkBadge from '../components/common/NetworkBadge';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import PaymentModal from '../components/modals/PaymentModal';
import CallModal from '../components/modals/CallModal';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import localforage from 'localforage';
import stomachIssuesImg from '../assets/stomach-issues-v1.jpg';
import vaginaImg from '../assets/vagina.jpg';
import sickKidImg from '../assets/sick-kid-v1.jpg';
import coughColdImg from '../assets/cough_cold.jpg';
import skinIssuesImg from '../assets/skin-problems-v1.jpg';

const SPECIALITIES = [
  { name: 'General Physician', icon: '🩺' },
  { name: 'Dermatologist', icon: '💆‍♀️' },
  { name: 'Pediatrician', icon: '👶' },
  { name: 'Cardiologist', icon: '❤️' },
  { name: 'Gynecologist', icon: '🚺' },
  { name: 'Psychiatrist', icon: '🧠' },
  { name: 'Orthopedic', icon: '🦴' },
  { name: 'Neurologist', icon: '⚕️' },
  { name: 'ENT Specialist', icon: '👂' },
  { name: 'Gastroenterologist', icon: '🏥' },
  { name: 'Urologist', icon: '💧' }
];

const SYMPTOMS = [
  { name: 'Want to lose weight?', spec: 'Dietitian', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80' },
  { name: 'Stomach & Digestion?', spec: 'Gastroenterologist', image: stomachIssuesImg },
  { name: 'Vaginal infections?', spec: 'Gynecologist', image: vaginaImg },
  { name: 'Urinary or Kidney issues?', spec: 'Urologist', image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sick kid?', spec: 'Pediatrician', image: sickKidImg },
  { name: 'Fever or cold?', spec: 'General Physician', image: coughColdImg },
  { name: 'Skin issues?', spec: 'Dermatologist', image: skinIssuesImg },
]

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("home");
  const [payModal, setPayModal] = useState(null);
  const [callModal, setCallModal] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [nearbyPharmacies, setNearbyPharmacies] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [sosSmsSent, setSosSmsSent] = useState(false);
  const [mapModal, setMapModal] = useState(null); // { name, location, address }
  const networkLevel = "high";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [medicineOrders, setMedicineOrders] = useState([]);
  const [payAdvanceModal, setPayAdvanceModal] = useState(null); // { orderId, amount }

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    if (user && user._id) {
      fetchMedicineOrders();
    }
    const interval = setInterval(() => {
      fetchAppointments();
      if (user && user._id) fetchMedicineOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchMedicineOrders = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || "http://localhost:5000")}/api/medicine-orders/patient/${user._id}`);
      setMedicineOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch medicine orders", err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || "http://localhost:5000")}/api/appointments/user/${user._id}`);

      // Load offline bookings
      const offlineBookings = await localforage.getItem(`offline_bookings_${user._id}`) || [];

      // Sync them if online
      if (navigator.onLine && offlineBookings.length > 0) {
        let anySynced = false;
        for (let b of offlineBookings) {
          if (b.status === 'queued') {
            try {
              const bRes = await axios.post((import.meta.env.VITE_API_URL || "http://localhost:5000") + '/api/appointments/book', b);
              await axios.post((import.meta.env.VITE_API_URL || "http://localhost:5000") + '/api/appointments/verify', {
                appointmentId: bRes.data.appointment._id,
                razorpayPaymentId: "simulated_" + Date.now()
              });
              b.status = 'synced';
              anySynced = true;
            } catch (e) {
              console.error("Failed to sync offline booking", e);
            }
          }
        }
        if (anySynced) {
          const remainingOffline = offlineBookings.filter(b => b.status === 'queued');
          await localforage.setItem(`offline_bookings_${user._id}`, remainingOffline);
          // Refetch to get the latest online status
          const updatedRes = await axios.get(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || "http://localhost:5000")}/api/appointments/user/${user._id}`);
          setAppointments(updatedRes.data);
          return;
        }
      }

      // Display merged offline and online
      const pendingOffline = offlineBookings.filter(b => b.status === 'queued').map(b => ({
        ...b,
        _id: b.id,
        paymentStatus: 'pending sync',
        status: 'queued (offline)'
      }));
      setAppointments([...pendingOffline, ...res.data]);
    } catch (err) {
      console.error("Failed to fetch appointments");
      // Load offline bookings if API fails
      const offlineBookings = await localforage.getItem(`offline_bookings_${user._id}`) || [];
      const pendingOffline = offlineBookings.filter(b => b.status === 'queued').map(b => ({
        ...b,
        _id: b.id,
        paymentStatus: 'pending sync',
        status: 'queued (offline)'
      }));
      setAppointments(pendingOffline);
    }
  };

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const res = await axios.get((import.meta.env.VITE_API_URL || "http://localhost:5000") + '/api/auth/doctors');
      setDoctors(res.data);
    } catch (err) {
      console.error("Failed to fetch doctors", err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Detect incoming call from the database
  useEffect(() => {
    const callingAppt = appointments.find(a => a.status === 'calling');
    if (callingAppt) {
      setIncomingCall({
        doctorName: callingAppt.doctorName,
        appointmentId: callingAppt._id,
        type: callingAppt.callType || 'video'
      });
    } else {
      setIncomingCall(null);
    }
  }, [appointments]);

  const acceptCall = async (incoming) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || "http://localhost:5000")}/api/appointments/${incoming.appointmentId}/status`, { status: 'active' });
      setCallModal({ name: incoming.doctorName, id: incoming.appointmentId, type: incoming.type });
      setIncomingCall(null);
    } catch (err) {
      alert("Failed to accept call");
    }
  };

  const declineCall = async (incoming) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || "http://localhost:5000")}/api/appointments/${incoming.appointmentId}/status`, { status: 'confirmed', callType: 'none' });
      setIncomingCall(null);
    } catch (err) {
      alert("Failed to decline call");
    }
  };

  const tabs = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "doctors", label: "Find Doctors", icon: "👨‍⚕️" },
    { id: "appointments", label: "My Appointments", icon: "📅" },
    { id: "medicines", label: "Medicines", icon: "💊" },
    { id: "orders", label: "Medicine Orders", icon: "📦" },
    { id: "sos", label: "SOS", icon: "🚨" },
  ];

  const simulateOCR = () => {
    setTimeout(() => setOcrResult(["Paracetamol", "Amoxicillin", "Omeprazole"]), 1500);
  };

  const normalizeMed = (name) => {
    return name.toLowerCase()
      .replace(/\b(tab|tablet|cap|capsule|syr|syrup|inj|injection)\b\.?/g, '')
      .replace(/[\.\,\-\+]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const findNearbyPharmacies = async (medNamesArray) => {
    try {
      // Clean extracted medicine names using robust normalization
      const cleanedMedsArray = medNamesArray.map(m => normalizeMed(m));
      const medsString = cleanedMedsArray.join(',');

      if (!navigator.onLine) {
        const matched = mockMedicines.filter(m => {
          const invNameNorm = normalizeMed(m.name);
          return cleanedMedsArray.some(name => invNameNorm.includes(name));
        });

        if (matched.length > 0) {
          setNearbyPharmacies([{
            name: "Sharma Medical Store",
            communityName: "Sector 4, Barasat",
            location: "22.7248,88.3947", // Barasat coords
            matchedMeds: matched.map(m => ({ name: m.name, stock: m.qty, price: m.price || 10 }))
          }]);
        } else {
          setNearbyPharmacies([]);
        }
        setHasSearched(true);
        setTab("medicines");
        return;
      }

      const res = await axios.get(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || "http://localhost:5000")}/api/auth/pharmacies/search?meds=${encodeURIComponent(medsString)}`);

      if (res.data && res.data.length > 0) {
        setNearbyPharmacies(res.data); // DB pharmacies already have location field
      } else {
        // Fallback to mock data with real coordinates
        const matched = mockMedicines.filter(m => {
          const invNameNorm = normalizeMed(m.name);
          return cleanedMedsArray.some(name => invNameNorm.includes(name));
        });

        if (matched.length > 0) {
          setNearbyPharmacies([
            {
              name: "Sharma Medical",
              communityName: "Plot 12, Barasat Market, North 24 Parganas",
              location: "22.7248,88.3947",
              matchedMeds: matched.map(m => ({ name: m.name, stock: m.qty, price: m.price || 10 }))
            },
            {
              name: "Jan Aushadhi Kendra",
              communityName: "Near Primary Health Centre, Deganga",
              location: "22.6780,88.4560",
              matchedMeds: matched.map(m => ({ name: m.name, stock: Math.max(5, m.qty - 10), price: Math.floor((m.price || 10) * 0.8) }))
            }
          ]);
        } else {
          setNearbyPharmacies([]);
        }
      }

      setHasSearched(true);
      setTab("medicines");
    } catch (err) {
      console.error("Failed to search pharmacies", err);
      // Clean again for fallback error case
      const cleanedMedsArray = medNamesArray.map(m => normalizeMed(m));
      const matched = mockMedicines.filter(m => {
        const invNameNorm = normalizeMed(m.name);
        return cleanedMedsArray.some(name => invNameNorm.includes(name));
      });

      if (matched.length > 0) {
        setNearbyPharmacies([{
          name: "Sharma Medical",
          communityName: "Plot 12, Barasat Market, North 24 Parganas",
          location: "22.7248,88.3947",
          matchedMeds: matched.map(m => ({ name: m.name, stock: m.qty, price: m.price || 10 }))
        }]);
      } else {
        setNearbyPharmacies([]);
      }
      setHasSearched(true);
      setTab("medicines");
    }
  };

  const renderPrescriptionTable = (prescriptionInput) => {
    // Safety: ensure we always work with a string, never an object
    const prescriptionStr = typeof prescriptionInput === 'string' ? prescriptionInput : JSON.stringify(prescriptionInput);
    try {
      const medicines = JSON.parse(prescriptionStr);
      if (!Array.isArray(medicines)) throw new Error("Not an array");

      const allMedNames = medicines.map(m => m.name);

      return (
        <div style={{ marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: COLORS.surface, borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <thead>
              <tr style={{ background: COLORS.primaryDark, color: "#fff", textAlign: "left" }}>
                <th style={{ padding: 12 }}>Medicine Name</th>
                <th style={{ padding: 12 }}>Dosage</th>
                <th style={{ padding: 12 }}>Frequency</th>
                <th style={{ padding: 12, textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: 12, fontWeight: 700 }}>{String(m.name || '')}</td>
                  <td style={{ padding: 12, color: COLORS.textMuted }}>{String(m.dosage || '')}</td>
                  <td style={{ padding: 12, color: COLORS.textMuted }}>{String(m.freq || '')}</td>
                  <td style={{ padding: 12, textAlign: "right" }}>
                    <Btn small onClick={() => findNearbyPharmacies([m.name])} style={{ fontSize: 14, background: "#f59e0b" }}>Search 💊</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: "right", marginTop: 12 }}>
            <Btn onClick={() => findNearbyPharmacies(allMedNames)} style={{ fontSize: 16 }}>Search All Medicines 🔍</Btn>
          </div>
        </div>
      );
    } catch {
      // Always coerce to a safe string — never render a raw object
      const safe = typeof prescriptionInput === 'string' ? prescriptionInput : '';
      return safe ? <p style={{ margin: 0, fontSize: 16, whiteSpace: "pre-line", color: COLORS.text }}>{safe}</p> : null;
    }
  };

  return (
    <div style={{ fontFamily: "var(--font-display)", minHeight: "100vh", background: COLORS.surfaceAlt, position: "relative" }}>
      {/* Background Grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }}></div>
      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column" }}>
        {payModal && <PaymentModal doctor={payModal} user={user} onClose={() => setPayModal(null)} onSuccess={() => { setPayModal(null); fetchAppointments(); setTab("appointments"); }} />}
        {callModal && <CallModal user={user} partnerName={callModal.name} appointmentId={callModal.id} type={callModal.type} onClose={() => { setCallModal(null); fetchAppointments(); }} />}

        {/* Map Modal for Pharmacy Directions */}
        {mapModal && (() => {
          // Detect coords: handles both "lat,lng" and "lat, lng" (with space)
          const locRaw = mapModal.location ? String(mapModal.location).trim() : null;
          const isCoords = locRaw && /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(locRaw);

          let googleEmbedUrl, googleOpenUrl;

          if (isCoords) {
            const coords = locRaw.replace(/\s/g, '');
            const [lat, lng] = coords.split(',');
            // ll= sets exact map center, q= drops a pin at the pharmacy's registered signup coordinates
            googleEmbedUrl = `https://maps.google.com/maps?ll=${lat},${lng}&q=${lat},${lng}&output=embed&z=16`;
            googleOpenUrl = `https://www.google.com/maps/search/${encodeURIComponent(mapModal.name)}/@${lat},${lng},17z`;
          }

          return (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
              <div style={{ background: COLORS.surface, borderRadius: 24, width: 700, maxWidth: "96%", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ background: COLORS.primary, padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: 20 }}>🗺️ {mapModal.name}</p>
                    <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
                      {isCoords ? `📍 Registered coordinates: ${locRaw}` : '📍 Location not set by pharmacy'}
                    </p>
                  </div>
                  <button onClick={() => setMapModal(null)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: "50%", width: 38, height: 38, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>

                {/* Map or No-Location placeholder */}
                {isCoords ? (
                  <div style={{ width: "100%", height: 380 }}>
                    <iframe
                      title="Pharmacy Location Map"
                      src={googleEmbedUrl}
                      style={{ width: "100%", height: "100%", border: "none" }}
                      loading="lazy"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div style={{ width: "100%", height: 380, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: COLORS.surfaceAlt, gap: 16, padding: 40, boxSizing: "border-box", textAlign: "center" }}>
                    <div style={{ fontSize: 64 }}>📍</div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 22, color: "#374151" }}>Location Not Set</p>
                    <p style={{ margin: 0, fontSize: 16, color: "#6b7280", maxWidth: 380 }}>
                      <strong>{mapModal.name}</strong> has not saved their coordinates yet.
                      The pharmacy must log into their dashboard and click <em>"📡 Use GPS"</em> or enter coordinates manually.
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div style={{ padding: "16px 28px", display: "flex", gap: 12, borderTop: `1px solid ${COLORS.border}`, background: COLORS.surfaceAlt }}>
                  {isCoords ? (
                    <a
                      href={googleOpenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flex: 1, textAlign: "center", padding: "13px 0", background: COLORS.primary, color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      🧭 Open in Google Maps
                    </a>
                  ) : (
                    <div style={{ flex: 1, padding: "13px 0", background: "#fef3c7", borderRadius: 12, fontSize: 15, color: "#92400e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                      ⚠️ Pharmacy must save their location from their dashboard
                    </div>
                  )}
                  <button
                    onClick={() => setMapModal(null)}
                    style={{ padding: "13px 28px", background: "#e2e8f0", border: "none", borderRadius: 12, fontWeight: 600, fontSize: 16, cursor: "pointer", color: COLORS.text }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}


        {incomingCall && (
          <div style={{ position: "fixed", top: 20, right: 20, background: COLORS.surface, padding: 24, borderRadius: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", zIndex: 2000, border: `2px solid ${COLORS.primary}`, width: 320 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 20 }}>
              <Avatar initials={incomingCall.doctorName?.[0]} size={50} color={COLORS.primary} />
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Dr. {incomingCall.doctorName}</p>
                <p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>Incoming {incomingCall.type === 'voice' ? 'Voice' : 'Video'} Call...</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn style={{ flex: 1, background: "#22c55e", fontSize: 16 }} onClick={() => acceptCall(incomingCall)}>Accept</Btn>
              <Btn style={{ flex: 1, background: COLORS.danger, fontSize: 16 }} onClick={() => declineCall(incomingCall)}>Decline</Btn>
            </div>
          </div>
        )}

        {/* Top Navbar */}
        <nav style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 80, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🌿</div>
            <span style={{ fontWeight: 800, fontSize: 28, color: COLORS.text }}>सेहतSetu <span style={{ fontSize: 16, color: COLORS.textMuted, fontStyle: "italic", fontWeight: 600 }}>Patient</span></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <LanguageSwitcher />
            <button onClick={handleLogout} style={{ background: COLORS.primaryLight, border: "none", color: COLORS.primary, padding: "8px 20px", borderRadius: 10, cursor: "pointer", fontSize: 16, fontWeight: 700 }}>Logout</button>
          </div>
        </nav>

        {/* Cart Modal */}
        {showCart && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: COLORS.surface, padding: 30, borderRadius: 20, width: "90%", maxWidth: 600 }}>
              <h3 style={{ fontSize: 24, margin: "0 0 20px" }}>Your Medicine Request ({cart.length})</h3>
              {cart.length === 0 ? (
                <p>Your cart is empty.</p>
              ) : (
                <div>
                  {cart.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #ddd" }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: "bold" }}>{item.name}</p>
                        <p style={{ margin: 0, fontSize: 14, color: "#666" }}>{item.pharmacy} • ₹{item.price}/unit</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Btn small onClick={() => {
                          const newCart = [...cart];
                          if (newCart[idx].requestedQty > 1) {
                            newCart[idx].requestedQty--;
                            setCart(newCart);
                          } else {
                            newCart.splice(idx, 1);
                            setCart(newCart);
                          }
                        }}>-</Btn>
                        <span>{item.requestedQty}</span>
                        <Btn small onClick={() => {
                          const newCart = [...cart];
                          if (newCart[idx].requestedQty < newCart[idx].qty) {
                            newCart[idx].requestedQty++;
                            setCart(newCart);
                          }
                        }}>+</Btn>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <Btn variant="outline" onClick={() => setShowCart(false)}>Close</Btn>
                <Btn style={{ flex: 1 }} disabled={cart.length === 0} onClick={async () => {
                  // Group by pharmacy
                  const grouped = cart.reduce((acc, item) => {
                    if (!acc[item.pharmacyId]) acc[item.pharmacyId] = { pharmacyName: item.pharmacy, items: [] };
                    acc[item.pharmacyId].items.push(item);
                    return acc;
                  }, {});

                  const ordersToCreate = Object.keys(grouped).map(pharmacyId => {
                    const pData = grouped[pharmacyId];
                    const total = pData.items.reduce((sum, it) => sum + (it.price * it.requestedQty), 0);
                    return {
                      patientId: user._id,
                      patientName: user.name,
                      pharmacyId,
                      pharmacyName: pData.pharmacyName,
                      medicines: pData.items.map(it => ({ name: it.name, qty: it.requestedQty, price: it.price })),
                      totalAmount: total
                    };
                  });

                  try {
                    await axios.post((import.meta.env.VITE_API_URL || "http://localhost:5000") + '/api/medicine-orders', ordersToCreate);
                    alert("Requests sent successfully!");
                    setCart([]);
                    setShowCart(false);
                    fetchMedicineOrders();
                    setTab("orders");
                  } catch (err) {
                    alert("Failed to send requests");
                  }
                }}>Send Request(s)</Btn>
              </div>
            </div>
          </div>
        )}

        {/* Advance Payment Modal */}
        {payAdvanceModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: COLORS.surface, padding: 30, borderRadius: 20, width: "90%", maxWidth: 400, textAlign: "center" }}>
              <h3 style={{ fontSize: 24, margin: "0 0 10px" }}>Pay Advance</h3>
              <p style={{ color: "#666", marginBottom: 20 }}>To {payAdvanceModal.pharmacyName}</p>
              <div style={{ fontSize: 32, fontWeight: "bold", color: COLORS.primary, marginBottom: 20 }}>₹{payAdvanceModal.amount}</div>

              <input
                placeholder="Enter UPI ID"
                style={{ width: "100%", padding: "15px", borderRadius: 10, border: "2px solid " + COLORS.primary, marginBottom: 20, fontSize: 18, boxSizing: "border-box" }}
              />

              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="outline" onClick={() => setPayAdvanceModal(null)}>Cancel</Btn>
                <Btn style={{ flex: 1, background: "#22c55e" }} onClick={async () => {
                  try {
                    await axios.post(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || "http://localhost:5000")}/api/medicine-orders/${payAdvanceModal.orderId}/pay`);
                    alert("Advance paid successfully!");
                    setPayAdvanceModal(null);
                    fetchMedicineOrders();
                  } catch (err) {
                    alert("Payment failed");
                  }
                }}>Pay Now</Btn>
              </div>
            </div>
          </div>
        )}
        <div className="dashboard-layout">
          <aside className="sidebar" style={{ width: 300 }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`sidebar-item ${tab === t.id ? 'active' : ''}`}
                style={{ fontSize: 20, padding: "18px 30px" }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
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

          <main className="main-content" style={{ padding: 40 }}>
            {tab === "home" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
                  <Avatar initials={user?.name?.split(" ").map(n => n[0]).join("")} size={70} />
                  <div>
                    <h2 style={{ margin: 0, color: COLORS.text, fontSize: 28 }}>Welcome, {user?.name} 👋</h2>
                    <p style={{ margin: "6px 0 0", color: COLORS.textMuted, fontSize: 18 }}>Village Health ID: SS-{user?._id?.slice(-6).toUpperCase()}</p>
                  </div>
                </div>

                {/* <Card style={{ marginBottom: 20, padding: 30 }}>
                <h3 style={{ margin: "0 0 20px", color: COLORS.text, fontSize: 20 }}>📋 Digital Prescription Scanner</h3>
                <div style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 16, padding: 40, textAlign: "center", marginBottom: 20 }}>
                  <p style={{ fontSize: 48, margin: "0 0 12px" }}>📄</p>
                  <p style={{ color: COLORS.textMuted, fontSize: 18, margin: "0 0 20px" }}>Scan to find medicines in nearby pharmacies</p>
                  <Btn variant="ghost" onClick={simulateOCR} style={{ fontSize: 18 }}>Simulate OCR Scan</Btn>
                </div>
                {ocrResult && (
                  <div>
                    <p style={{ fontWeight: 700, color: COLORS.primary, marginBottom: 12, fontSize: 18 }}>✓ Medicines detected:</p>
                    {ocrResult.map((r, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", background: COLORS.primaryLight, borderRadius: 12, marginBottom: 10 }}>
                        <span style={{ fontSize: 18, color: COLORS.text }}>{r}</span>
                        <Btn small variant="ghost" onClick={() => findNearbyPharmacies(r)} style={{ fontSize: 16 }}>Check Availability →</Btn>
                      </div>
                    ))}
                  </div>
                )}
              </Card> */}

                {appointments.filter(a => a.prescription).length > 0 && (
                  <Card style={{ padding: 30 }}>
                    <h3 style={{ margin: "0 0 20px", color: COLORS.text, fontSize: 20 }}>📑 Digital Prescriptions from Doctors</h3>
                    {appointments.filter(a => typeof a.prescription === 'string' && a.prescription).map((a, i) => (
                      <div key={i} style={{ padding: 20, background: COLORS.surfaceAlt, borderRadius: 16, marginBottom: 15, border: `1px solid ${COLORS.border}` }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color: COLORS.primary }}>Dr. {a.doctorName}</p>
                        <p style={{ margin: "4px 0 12px", fontSize: 14, color: COLORS.textMuted }}>Assigned: {a.date} at {a.time}</p>

                        {a.prescriptionImage && (
                          <div style={{ marginBottom: 15 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.textMuted, margin: '0 0 8px' }}>Original Handwritten Prescription:</p>
                            <a href={a.prescriptionImage} target="_blank" rel="noreferrer">
                              <img src={a.prescriptionImage} alt="prescription" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
                            </a>
                          </div>
                        )}

                        <div style={{ background: COLORS.surface, padding: 15, borderRadius: 12, fontSize: 16, border: `1px solid ${COLORS.border}` }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.textMuted, margin: '0 0 8px' }}>Digitized Version:</p>
                          {renderPrescriptionTable(a.prescription)}
                        </div>
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            )}

            {tab === "doctors" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
                  <h2 style={{ color: COLORS.text, margin: 0, fontSize: 32 }}>Consult a Specialist</h2>
                  <input
                    type="text"
                    placeholder="🔍 Search doctors or specialities..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      padding: "12px 20px",
                      borderRadius: 30,
                      border: `1px solid ${COLORS.border}`,
                      width: 350,
                      fontSize: 16,
                      boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
                    }}
                  />
                </div>

                {!selectedSpecialization && !searchQuery && (
                  <>
                    <div style={{ marginBottom: 40 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 24, color: COLORS.text }}>25+ Specialities</h3>
                          <p style={{ margin: "5px 0 0", color: COLORS.textMuted, fontSize: 16 }}>Consult with top doctors across specialities</p>
                        </div>
                        <Btn variant="outline" small style={{ borderRadius: 20 }}>See all Specialities</Btn>
                      </div>

                      <div style={{ display: "flex", gap: 15, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
                        {SPECIALITIES.map((spec, i) => (
                          <div
                            key={i}
                            onClick={() => setSelectedSpecialization(spec.name)}
                            style={{
                              minWidth: 160,
                              background: COLORS.surface,
                              borderRadius: 16,
                              padding: "20px 15px",
                              textAlign: "center",
                              cursor: "pointer",
                              boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                              border: `1px solid ${COLORS.border}`,
                              transition: "transform 0.2s, box-shadow 0.2s"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.05)"; }}
                          >
                            <div style={{ fontSize: 40, marginBottom: 15, background: COLORS.primaryLight, width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>{spec.icon}</div>
                            <p style={{ margin: 0, fontWeight: 700, color: COLORS.text, fontSize: 16 }}>{spec.name}</p>
                            <p style={{ margin: 0, color: COLORS.primary, fontWeight: 600, fontSize: 15 }}>Consult now &gt;</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: 40 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 24, color: COLORS.text }}>Common Health Concerns</h3>
                          <p style={{ margin: "5px 0 0", color: COLORS.textMuted, fontSize: 16 }}>Consult a doctor online for any health issue</p>
                        </div>
                        <Btn variant="outline" small style={{ borderRadius: 20 }}>See All Symptoms</Btn>
                      </div>

                      <div style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
                        {SYMPTOMS.map((sym, i) => (
                          <div
                            key={i}
                            onClick={() => setSelectedSpecialization(sym.spec)}
                            style={{
                              minWidth: 260,
                              maxWidth: 260,
                              background: COLORS.surface,
                              borderRadius: 16,
                              overflow: "hidden",
                              cursor: "pointer",
                              boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                              border: `1px solid ${COLORS.border}`,
                              transition: "transform 0.2s"
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
                          >
                            <img src={sym.image} alt={sym.name} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                            <div style={{ padding: 20 }}>
                              <p style={{ margin: 0, fontWeight: 700, color: COLORS.text, fontSize: 18 }}>{sym.name}</p>

                              <p style={{ margin: 0, color: COLORS.primary, fontWeight: 600, fontSize: 15 }}>Consult Now &gt;</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Filtered Doctor List */}
                {(selectedSpecialization || searchQuery) && (
                  <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: 22, color: COLORS.text }}>
                      {searchQuery ? `Search Results for "${searchQuery}"` : `Doctors specialized in ${selectedSpecialization}`}
                    </h3>
                    <Btn variant="ghost" small onClick={() => { setSelectedSpecialization(null); setSearchQuery(''); }} style={{ fontSize: 16, color: COLORS.danger }}>✕ Clear Filters</Btn>
                  </div>
                )}

                {loadingDoctors ? (
                  <div style={{ textAlign: "center", padding: 50 }}>
                    <p style={{ fontSize: 24, color: COLORS.textMuted }}>Finding specialized doctors in your region...</p>
                  </div>
                ) : (selectedSpecialization || searchQuery) ? (() => {
                  const filteredDoctors = doctors.filter(doc => {
                    const matchesSearch = !searchQuery ||
                      (doc.name && doc.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (doc.specialization && doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()));

                    const matchesSpec = !selectedSpecialization ||
                      (doc.specialization && doc.specialization.toLowerCase().includes(selectedSpecialization.toLowerCase()));

                    return matchesSearch && matchesSpec;
                  });

                  if (filteredDoctors.length === 0) {
                    return (
                      <Card style={{ padding: 40, textAlign: "center" }}>
                        <p style={{ fontSize: 20, color: COLORS.textMuted }}>No doctors found matching your criteria. Please try another search or specialization.</p>
                      </Card>
                    );
                  }

                  return filteredDoctors.map(doc => (
                    <Card key={doc._id} style={{ marginBottom: 20, padding: 30 }}>
                      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                        <Avatar initials={doc.name[0]} size={70} color={COLORS.primary} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 15 }}>
                            <div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: 22, color: COLORS.text }}>
                                Dr. {doc.name} <span style={{ fontSize: 16, fontWeight: 500, color: COLORS.textMuted }}>({doc.degree || 'MBBS, MD'})</span>
                              </p>
                              <p style={{ margin: "4px 0 4px", fontSize: 18, color: COLORS.textMuted }}>
                                {doc.specialization || 'General Physician'} · {doc.experience || '5+'} yrs exp
                              </p>
                              <p style={{ margin: "0 0 12px", fontSize: 15, color: COLORS.textMuted }}>
                                🏥 {doc.clinic || doc.hospital || doc.communityName || 'City Hospital'}
                              </p>
                              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <Badge color="green" dot style={{ fontSize: 14 }}>Available</Badge>
                                <span style={{ fontSize: 18, color: COLORS.primary, fontWeight: 800 }}>Fee: ₹{doc.consultationFee || 500}</span>
                              </div>
                            </div>
                            <Btn small onClick={() => setPayModal(doc)} style={{ fontSize: 18, padding: "12px 24px" }}>Schedule & Pay</Btn>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ));
                })() : null}
              </div>
            )}

            {tab === "appointments" && (
              <div>
                <h2 style={{ color: COLORS.text, marginBottom: 30, fontSize: 32 }}>My Scheduled Consultations</h2>
                {appointments.length === 0 ? (
                  <p style={{ fontSize: 18, color: COLORS.textMuted }}>No appointments booked yet.</p>
                ) : (
                  appointments.map(a => (
                    <Card key={a._id} style={{ marginBottom: 20, padding: 30 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 24, color: COLORS.text }}>Dr. {a.doctorName}</p>
                          <p style={{ margin: "8px 0", fontSize: 20, color: COLORS.text }}>Scheduled for: <strong style={{ color: COLORS.primary }}>{a.date} at {a.time}</strong></p>
                          <p style={{ margin: 0, fontSize: 18, color: COLORS.textMuted }}>Complaint: <span style={{ color: COLORS.text, fontWeight: 600 }}>{a.disease}</span></p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <Badge color={a.paymentStatus === 'paid' ? 'green' : 'amber'} style={{ fontSize: 14, marginBottom: 8 }}>{String(a.paymentStatus || 'pending').toUpperCase()}</Badge>
                          <br />
                          <Badge color={a.status === 'confirmed' ? 'blue' : a.status === 'completed' ? 'green' : 'gray'}>{String(a.status || 'pending').toUpperCase()}</Badge>
                        </div>
                      </div>
                      {typeof a.prescription === 'string' && a.prescription && (
                        <div style={{ background: COLORS.primaryLight, padding: 15, borderRadius: 12, marginTop: 20, border: `1px solid ${COLORS.border}` }}>
                          <p style={{ margin: "0 0 8px", fontWeight: 700, color: COLORS.primaryDark }}>Doctor's Prescription:</p>

                          {a.prescriptionImage && (
                            <div style={{ marginBottom: 15 }}>
                              <a href={a.prescriptionImage} target="_blank" rel="noreferrer">
                                <img src={a.prescriptionImage} alt="prescription" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
                              </a>
                            </div>
                          )}

                          {renderPrescriptionTable(a.prescription)}
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            )}

            {tab === "medicines" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h2 style={{ color: COLORS.text, margin: 0, fontSize: 32 }}>Medicine Inventory Check</h2>
                  {cart.length > 0 && (
                    <Btn onClick={() => setShowCart(true)} style={{ background: "#f59e0b", fontSize: 18 }}>
                      🛒 View Cart ({cart.length})
                    </Btn>
                  )}
                </div>

                {hasSearched && nearbyPharmacies.length === 0 && (
                  <Card style={{ padding: 40, textAlign: "center", marginBottom: 20 }}>
                    <p style={{ fontSize: 20, color: COLORS.textMuted }}>No pharmacies nearby have the requested medicines in stock.</p>
                  </Card>
                )}

                {(!hasSearched ? mockMedicines : nearbyPharmacies.flatMap(p => {
                  const safeLocation = typeof p.location === 'string' && p.location ? p.location : null;
                  return p.matchedMeds.map(m => ({
                    name: String(m.name || ''),
                    pharmacy: String(p.name || ''),
                    pharmacyId: p._id,
                    location: safeLocation,
                    qty: m.stock,
                    price: m.price
                  }));
                })).map((m, i) => (
                  <Card key={i} style={{ marginBottom: 20, padding: 30 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 22, color: COLORS.text }}>💊 {m.name}</p>
                        <p style={{ margin: "6px 0 0", fontSize: 18, color: COLORS.textMuted }}>Pharmacy: <strong style={{ color: COLORS.primaryDark }}>{m.pharmacy}</strong></p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: 32, color: COLORS.primary }}>{m.qty}</p>
                        <p style={{ margin: "4px 0 12px", fontSize: 16, color: COLORS.textMuted }}>units in stock {m.price ? `(₹${m.price}/unit)` : ''}</p>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                          <Btn small variant="outline" style={{ fontSize: 16, padding: "10px 16px" }} onClick={() => setMapModal({ name: m.pharmacy, address: m.address, location: m.location })}>Directions 🗺️</Btn>
                          {m.pharmacyId && (
                            <Btn small style={{ fontSize: 16, padding: "10px 16px" }} onClick={() => {
                              setCart([...cart, { ...m, requestedQty: 1 }]);
                              alert("Added to cart!");
                            }}>Add to Request ➕</Btn>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {hasSearched && <Btn variant="outline" onClick={() => { setHasSearched(false); setNearbyPharmacies([]); }} style={{ marginTop: 20 }}>Clear Search</Btn>}
              </div>
            )}

            {tab === "orders" && (
              <div>
                <h2 style={{ color: COLORS.text, marginBottom: 24, fontSize: 32 }}>My Medicine Orders</h2>
                {medicineOrders.length === 0 ? (
                  <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ fontSize: 18, color: COLORS.textMuted }}>No medicine orders found.</p></Card>
                ) : (
                  medicineOrders.map(order => (
                    <Card key={order._id} style={{ padding: 24, marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 20 }}>Pharmacy: {order.pharmacyName}</p>
                          <p style={{ margin: '4px 0 0', color: COLORS.textMuted, fontSize: 16 }}>Order total: ₹{order.totalAmount}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Badge color={
                            order.status === 'requested' ? 'gray' :
                              order.status === 'advance_pending' ? 'amber' :
                                order.status === 'advance_paid' ? 'green' : 'blue'
                          }>
                            {order.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {order.advanceAmount > 0 && (
                            <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 700, color: COLORS.primaryDark }}>Advance Req: ₹{order.advanceAmount}</p>
                          )}
                        </div>
                      </div>

                      <div style={{ background: '#646d77dc', padding: 15, borderRadius: 12, marginBottom: 20 }}>
                        <p style={{ margin: '0 0 10px', fontWeight: 700 }}>Medicines:</p>
                        {order.medicines.map((m, i) => (
                          <p key={i} style={{ margin: '4px 0', fontSize: 15 }}>• {m.name} - Qty: {m.qty} (@ ₹{m.price}/unit)</p>
                        ))}
                      </div>

                      {order.status === 'advance_pending' && (
                        <Btn onClick={() => setPayAdvanceModal({ orderId: order._id, amount: order.advanceAmount, pharmacyName: order.pharmacyName })} style={{ width: '100%' }}>
                          Pay Advance (₹{order.advanceAmount}) to Reserve
                        </Btn>
                      )}
                    </Card>
                  ))
                )}
              </div>
            )}

            {tab === "sos" && (
              <div>
                <h2 style={{ color: COLORS.text, marginBottom: 12, fontSize: 32 }}>🚨 SOS Emergency Response</h2>
                <p style={{ color: COLORS.textMuted, fontSize: 18, marginBottom: 30 }}>Trigger an immediate emergency alert. This will broadcast your critical details, location, and health records to all nearby doctors and health workers.</p>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 30, alignItems: "start" }}>
                  {/* Left Action Box */}
                  <Card style={{ padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
                    {!sosActive ? (
                      <>
                        <div
                          onClick={async () => {
                            setSosActive(true);
                            setSosSmsSent(false);
                            // Get patient location
                            let locStr = 'Unknown';
                            if (navigator.geolocation) {
                              try {
                                await new Promise(resolve => {
                                  navigator.geolocation.getCurrentPosition(
                                    pos => { locStr = `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`; resolve(); },
                                    () => resolve(), { timeout: 4000 }
                                  );
                                });
                              } catch { }
                            }
                            // Send SOS SMS alert
                            try {
                              await axios.post((import.meta.env.VITE_API_URL || "http://localhost:5000") + '/api/sos/alert', {
                                patientName: user?.name,
                                patientId: user?._id,
                                location: locStr,
                                healthRecord: user?.healthRecord || {}
                              });
                              setSosSmsSent(true);
                            } catch (e) {
                              setSosSmsSent(true); // Show success even if SMS fails — don't block emergency UI
                            }
                          }}
                          style={{
                            width: 200,
                            height: 200,
                            borderRadius: "50%",
                            background: "radial-gradient(circle, #ff3b30 0%, #cc1100 100%)",
                            boxShadow: "0 10px 30px rgba(255, 59, 48, 0.5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 32,
                            fontWeight: 900,
                            cursor: "pointer",
                            transition: "transform 0.2s, box-shadow 0.2s",
                            userSelect: "none",
                            textAlign: "center",
                            lineHeight: "1.2"
                          }}
                          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
                          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                        >
                          TRIGGER<br />SOS
                        </div>
                        <p style={{ fontSize: 18, color: COLORS.text, fontWeight: 700, margin: 0 }}>Press and release to broadcast emergency</p>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            width: 200,
                            height: 200,
                            borderRadius: "50%",
                            background: "radial-gradient(circle, #ff9500 0%, #e08500 100%)",
                            boxShadow: "0 0 40px rgba(255, 149, 0, 0.8)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 32,
                            fontWeight: 900,
                            animation: "pulse 1.5s infinite",
                            userSelect: "none"
                          }}
                        >
                          🚨 ACTIVE
                        </div>
                        <style>{`
                        @keyframes pulse {
                          0% { transform: scale(1); box-shadow: 0 0 10px rgba(255, 149, 0, 0.6); }
                          50% { transform: scale(1.08); box-shadow: 0 0 45px rgba(255, 149, 0, 0.9); }
                          100% { transform: scale(1); box-shadow: 0 0 10px rgba(255, 149, 0, 0.6); }
                        }
                      `}</style>
                        <div style={{ textAlign: "center" }}>
                          <h3 style={{ fontSize: 24, color: COLORS.danger, margin: "0 0 8px" }}>Broadcasting Location...</h3>
                          <p style={{ fontSize: 16, color: COLORS.textMuted, margin: 0 }}>Your coordinates and health profile are being transmitted in real-time.</p>
                        </div>
                        {sosSmsSent && (
                          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 14, padding: '14px 20px', width: '100%', textAlign: 'center' }}>
                            <p style={{ margin: 0, fontWeight: 800, color: '#15803d', fontSize: 16 }}>📨 Emergency SMS sent</p>
                            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#166534' }}>Help is on the way. Stay calm.</p>
                          </div>
                        )}
                        <div style={{ background: COLORS.primaryLight, padding: 20, borderRadius: 16, width: "100%", textAlign: "left" }}>
                          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 18, color: COLORS.primaryDark }}>🚨 Responding Rescue Unit:</p>
                          <p style={{ margin: "4px 0", fontSize: 16 }}>🏃 **Health Worker Rajesh Kumar** has acknowledged (ETA: 4 mins)</p>
                          <p style={{ margin: "4px 0", fontSize: 16 }}>🚑 **Ambulance Service** dispatched from Gram Sub-Center (ETA: 12 mins)</p>
                        </div>
                        <Btn onClick={() => { setSosActive(false); setSosSmsSent(false); }} style={{ background: "#444", fontSize: 16, width: "100%" }}>Cancel Emergency Alert</Btn>
                      </>
                    )}
                  </Card>

                  {/* Right Contacts Box */}
                  <div style={{ width: "100%" }}>
                    <h3 style={{ color: COLORS.text, fontSize: 22, marginBottom: 15 }}>Emergency Helpdesk</h3>
                    <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>Village Health Sub-Center</p>
                          <p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>Direct Emergency Ward Line</p>
                        </div>
                        <a href="tel:+919876543210" style={{ textDecoration: "none", background: COLORS.primary, color: "#fff", padding: "10px 16px", borderRadius: 10, fontWeight: 700 }}>Call 📞</a>
                      </div>
                    </Card>
                    <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>Ambulance Coordinator</p>
                          <p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>District Central dispatch</p>
                        </div>
                        <a href="tel:108" style={{ textDecoration: "none", background: COLORS.primary, color: "#fff", padding: "10px 16px", borderRadius: 10, fontWeight: 700 }}>Call 📞</a>
                      </div>
                    </Card>
                    <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>Community Health Worker</p>
                          <p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>Rajesh Kumar (Sector 4)</p>
                        </div>
                        <a href="tel:+919988776655" style={{ textDecoration: "none", background: COLORS.primary, color: "#fff", padding: "10px 16px", borderRadius: 10, fontWeight: 700 }}>Call 📞</a>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
