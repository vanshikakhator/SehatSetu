import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, mockMedicines } from '../constants';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Btn from '../components/common/Btn';
import SOSButton from '../components/common/SOSButton';
import NetworkBadge from '../components/common/NetworkBadge';
import PaymentModal from '../components/modals/PaymentModal';
import CallModal from '../components/modals/CallModal';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

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
  const networkLevel = "high";

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    const interval = setInterval(fetchAppointments, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/appointments/user/${user._id}`);
      setAppointments(res.data);
    } catch (err) {
      console.error("Failed to fetch appointments");
    }
  };

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const res = await axios.get('http://localhost:5000/api/auth/doctors');
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
      await axios.put(`http://localhost:5000/api/appointments/${incoming.appointmentId}/status`, { status: 'active' });
      setCallModal({ name: incoming.doctorName, id: incoming.appointmentId, type: incoming.type });
      setIncomingCall(null);
    } catch (err) {
      alert("Failed to accept call");
    }
  };

  const declineCall = async (incoming) => {
    try {
      await axios.put(`http://localhost:5000/api/appointments/${incoming.appointmentId}/status`, { status: 'confirmed', callType: 'none' });
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
    { id: "sos", label: "SOS", icon: "🚨" },
  ];

  const simulateOCR = () => {
    setTimeout(() => setOcrResult(["Paracetamol", "Amoxicillin", "Omeprazole"]), 1500);
  };

  const findNearbyPharmacies = async (medNamesArray) => {
    try {
      const medsString = medNamesArray.join(',');
      const res = await axios.get(`http://localhost:5000/api/auth/pharmacies/search?meds=${encodeURIComponent(medsString)}`);
      setNearbyPharmacies(res.data);
      setHasSearched(true);
      setTab("medicines");
    } catch (err) {
      console.error("Failed to search pharmacies", err);
    }
  };

  const renderPrescriptionTable = (prescriptionStr) => {
    try {
      const medicines = JSON.parse(prescriptionStr);
      if (!Array.isArray(medicines)) throw new Error("Not an array");
      
      const allMedNames = medicines.map(m => m.name);

      return (
        <div style={{ marginTop: 10 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
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
                  <td style={{ padding: 12, fontWeight: 700 }}>{m.name}</td>
                  <td style={{ padding: 12, color: COLORS.textMuted }}>{m.dosage}</td>
                  <td style={{ padding: 12, color: COLORS.textMuted }}>{m.freq}</td>
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
      return <p style={{ margin: 0, fontSize: 16, whiteSpace: "pre-line", color: COLORS.text }}>{prescriptionStr}</p>;
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh", background: "#f0faf5" }}>
      {payModal && <PaymentModal doctor={payModal} user={user} onClose={() => setPayModal(null)} onSuccess={() => { setPayModal(null); fetchAppointments(); setTab("appointments"); }} />}
      {callModal && <CallModal user={user} partnerName={callModal.name} appointmentId={callModal.id} type={callModal.type} onClose={() => { setCallModal(null); fetchAppointments(); }} />}

      {incomingCall && (
        <div style={{ position: "fixed", top: 20, right: 20, background: "#fff", padding: 24, borderRadius: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.2)", zIndex: 2000, border: `2px solid ${COLORS.primary}`, width: 320 }}>
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
      <nav style={{ background: COLORS.primary, color: "#fff", padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 70, position: "relative", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div style={{ fontSize: 28 }}>🌿</div>
          <span style={{ fontWeight: 800, fontSize: 24 }}>SehatSetu Patient</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div id="bhashini-translation-widget"></div>
          <NetworkBadge level={networkLevel} />
          <button onClick={handleLogout} style={{ background: "#ffffff22", border: "none", color: "#fff", padding: "8px 20px", borderRadius: 10, cursor: "pointer", fontSize: 18, fontWeight: 700 }}>Logout</button>
        </div>
      </nav>

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

              <Card style={{ marginBottom: 20, padding: 30 }}>
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
              </Card>

              {appointments.filter(a => a.prescription).length > 0 && (
                <Card style={{ padding: 30 }}>
                  <h3 style={{ margin: "0 0 20px", color: COLORS.text, fontSize: 20 }}>📑 Digital Prescriptions from Doctors</h3>
                  {appointments.filter(a => a.prescription).map((a, i) => (
                    <div key={i} style={{ padding: 20, background: "#f8fafc", borderRadius: 16, marginBottom: 15, border: `1px solid ${COLORS.border}` }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color: COLORS.primary }}>Dr. {a.doctorName}</p>
                      <p style={{ margin: "4px 0 12px", fontSize: 14, color: COLORS.textMuted }}>Assigned: {a.date} at {a.time}</p>
                      <div style={{ background: "#fff", padding: 15, borderRadius: 12, fontSize: 16, border: `1px solid ${COLORS.border}` }}>
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
              <h2 style={{ color: COLORS.text, marginBottom: 30, fontSize: 32 }}>Consult a Specialist</h2>
              {loadingDoctors ? (
                <div style={{ textAlign: "center", padding: 50 }}>
                  <p style={{ fontSize: 24, color: COLORS.textMuted }}>Finding specialized doctors in your region...</p>
                </div>
              ) : doctors.length === 0 ? (
                <Card style={{ padding: 40, textAlign: "center" }}>
                  <p style={{ fontSize: 20, color: COLORS.textMuted }}>No doctors are currently registered in your village sector. Please try again later.</p>
                </Card>
              ) : (
                doctors.map(doc => (
                  <Card key={doc._id} style={{ marginBottom: 20, padding: 30 }}>
                    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                      <Avatar initials={doc.name[0]} size={70} color={COLORS.primary} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 15 }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 22, color: COLORS.text }}>Dr. {doc.name}</p>
                            <p style={{ margin: "4px 0 8px", fontSize: 18, color: COLORS.textMuted }}>{doc.specialization} · {doc.experience || '5+'} yrs exp</p>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              <Badge color="green" dot style={{ fontSize: 14 }}>Available</Badge>
                              <span style={{ fontSize: 20, color: COLORS.primary, fontWeight: 800 }}>₹{doc.consultationFee}</span>
                            </div>
                          </div>
                          <Btn small onClick={() => setPayModal(doc)} style={{ fontSize: 18, padding: "12px 24px" }}>Schedule & Pay</Btn>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
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
                        <Badge color={a.paymentStatus === 'paid' ? 'green' : 'amber'} style={{ fontSize: 14, marginBottom: 8 }}>{a.paymentStatus.toUpperCase()}</Badge>
                        <br />
                        <Badge color={a.status === 'confirmed' ? 'blue' : a.status === 'completed' ? 'green' : 'gray'}>{a.status.toUpperCase()}</Badge>
                      </div>
                    </div>
                    {a.prescription && (
                      <div style={{ background: COLORS.primaryLight, padding: 15, borderRadius: 12, marginTop: 20, border: `1px solid ${COLORS.border}` }}>
                        <p style={{ margin: "0 0 8px", fontWeight: 700, color: COLORS.primaryDark }}>Doctor's Prescription:</p>
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
              <h2 style={{ color: COLORS.text, marginBottom: 12, fontSize: 32 }}>Medicine Inventory Check</h2>
              
              {hasSearched && nearbyPharmacies.length === 0 && (
                <Card style={{ padding: 40, textAlign: "center", marginBottom: 20 }}>
                  <p style={{ fontSize: 20, color: COLORS.textMuted }}>No pharmacies nearby have the requested medicines in stock.</p>
                </Card>
              )}

              {(!hasSearched ? mockMedicines : nearbyPharmacies.flatMap(p => 
                p.matchedMeds.map(m => ({
                  name: m.name,
                  pharmacy: p.name,
                  dist: p.communityName || 'Nearby Sector',
                  qty: m.stock,
                  price: m.price
                }))
              )).map((m, i) => (
                <Card key={i} style={{ marginBottom: 20, padding: 30 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 22, color: COLORS.text }}>💊 {m.name}</p>
                      <p style={{ margin: "6px 0 0", fontSize: 18, color: COLORS.textMuted }}>Pharmacy: <strong style={{color: COLORS.primaryDark}}>{m.pharmacy}</strong></p>
                      <p style={{ margin: "4px 0 0", fontSize: 18, color: COLORS.textMuted }}>📍 {m.dist}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontWeight: 900, fontSize: 32, color: COLORS.primary }}>{m.qty}</p>
                      <p style={{ margin: "4px 0 12px", fontSize: 16, color: COLORS.textMuted }}>units in stock {m.price ? `(₹${m.price}/unit)` : ''}</p>
                      <Btn small style={{ fontSize: 18, padding: "12px 24px" }}>Get Directions</Btn>
                    </div>
                  </div>
                </Card>
              ))}
              
              {hasSearched && <Btn variant="outline" onClick={() => {setHasSearched(false); setNearbyPharmacies([]);}} style={{ marginTop: 20 }}>Clear Search</Btn>}
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
                        onClick={() => setSosActive(true)}
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
                      <div style={{ background: COLORS.primaryLight, padding: 20, borderRadius: 16, width: "100%", textAlign: "left" }}>
                        <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 18, color: COLORS.primaryDark }}>🚨 Responding Rescue Unit:</p>
                        <p style={{ margin: "4px 0", fontSize: 16 }}>🏃 **Health Worker Rajesh Kumar** has acknowledged (ETA: 4 mins)</p>
                        <p style={{ margin: "4px 0", fontSize: 16 }}>🚑 **Ambulance Service** dispatched from Gram Sub-Center (ETA: 12 mins)</p>
                      </div>
                      <Btn onClick={() => setSosActive(false)} style={{ background: "#444", fontSize: 16, width: "100%" }}>Cancel Emergency Alert</Btn>
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
  );
}
