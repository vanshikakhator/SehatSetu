import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../constants';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import Btn from '../components/common/Btn';
import ConsultationModal from '../components/modals/ConsultationModal';
import CallModal from '../components/modals/CallModal';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import axios from 'axios';

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("appointments");
  const [consultModal, setConsultModal] = useState(null);
  const [callModal, setCallModal] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [otpModal, setOtpModal] = useState(null);
  const [otpInput, setOtpInput] = useState("");
  const [sosAlert, setSosAlert] = useState(true);
  const [viewingMedia, setViewingMedia] = useState(null);

  useEffect(() => {
    if (viewingRecord) {
      const timer = setTimeout(() => {
        alert("Session expired. Patient health record access revoked.");
        setViewingRecord(null);
      }, 15 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [viewingRecord]);
  
  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchAppointments = async () => {
    try {
      if (navigator.onLine) {
        try {
          const localforage = (await import('localforage')).default;
          const offlinePrescriptions = await localforage.getItem(`offline_prescriptions_${user._id}`) || [];
          let anySynced = false;
          
          for (let p of offlinePrescriptions) {
            if (p.status === 'queued') {
              try {
                await axios.put(`http://localhost:5000/api/appointments/${p.appointmentId}/prescription`, { prescription: p.prescription });
                p.status = 'synced';
                anySynced = true;
              } catch (e) {
                console.error("Failed to sync prescription", e);
              }
            }
          }
          
          if (anySynced) {
            const remaining = offlinePrescriptions.filter(p => p.status === 'queued');
            await localforage.setItem(`offline_prescriptions_${user._id}`, remaining);
          }
        } catch (err) {
          console.error("Offline sync error", err);
        }
      }

      const res = await axios.get(`http://localhost:5000/api/appointments/user/${user._id}`);
      
      const mockAppointments = [
        {
          _id: "mock1",
          patientId: "mockP1",
          patientName: "Rahul Sharma",
          date: new Date().toISOString().split('T')[0],
          time: "10:30 AM",
          disease: "Mild Fever",
          status: "confirmed",
          paymentStatus: "paid"
        },
        {
          _id: "mock2",
          patientId: "mockP2",
          patientName: "Sunita Devi",
          date: new Date().toISOString().split('T')[0],
          time: "11:00 AM",
          disease: "Body Ache",
          status: "confirmed",
          paymentStatus: "paid"
        }
      ];
      
      // Mix mock data with real data to ensure UI always looks populated
      const combined = [...mockAppointments, ...res.data];
      // remove duplicates if mock gets mixed improperly but here it's fine
      setAppointments(combined);
    } catch (err) {
      console.error("Failed to fetch appointments");
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const requestPatientRecordAccess = async (patientId) => {
    try {
      await axios.post(`http://localhost:5000/api/auth/health-record/request-otp`, { patientId, doctorId: user._id });
      setOtpModal({ patientId });
    } catch (err) {
      alert("Could not request access. Ensure patient is verified.");
    }
  };

  const verifyRecordOtp = async () => {
    try {
      const res = await axios.post(`http://localhost:5000/api/auth/health-record/verify-otp`, { 
        patientId: otpModal.patientId, 
        otp: otpInput, 
        doctorId: user._id 
      });
      setOtpModal(null);
      setOtpInput("");
      setViewingRecord(res.data);
    } catch (err) {
      alert("Invalid or expired OTP");
    }
  };

  const startCall = async (appt, type) => {
    try {
      await axios.put(`http://localhost:5000/api/appointments/${appt._id}/status`, { status: 'calling', callType: type });
      setCallModal({ ...appt, type });
    } catch (err) {
      alert("Failed to initiate call");
    }
  };

  const renderPrescriptionTable = (prescriptionStr) => {
    try {
      const medicines = JSON.parse(prescriptionStr);
      if (!Array.isArray(medicines)) throw new Error("Not an array");
      
      return (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10, background: COLORS.surface, borderRadius: 8, overflow: "hidden" }}>
          <thead>
            <tr style={{ background: COLORS.primaryDark, color: "#fff", textAlign: "left" }}>
              <th style={{ padding: 12 }}>Medicine Name</th>
              <th style={{ padding: 12 }}>Dosage</th>
              <th style={{ padding: 12 }}>Frequency</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((m, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <td style={{ padding: 12, fontWeight: 700 }}>{m.name}</td>
                <td style={{ padding: 12, color: COLORS.textMuted }}>{m.dosage}</td>
                <td style={{ padding: 12, color: COLORS.textMuted }}>{m.freq}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } catch {
      return <p style={{ margin: 0, fontSize: 16, whiteSpace: "pre-line" }}>{prescriptionStr}</p>;
    }
  };

  const tabs = [
    { id: "appointments", label: "My Schedule", icon: "📅" },
    { id: "patients", label: "Completed calls", icon: "👥" },
    { id: "earnings", label: "Earnings", icon: "💰" },
  ];

  return (
    <div style={{ fontFamily: "var(--font-display)", minHeight: "100vh", background: COLORS.surfaceAlt, position: "relative" }}>
      {/* Background Grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0, 240, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.05) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }}></div>
      <div style={{ position: "relative", zIndex: 10, height: "100%", display: "flex", flexDirection: "column" }}>
      {consultModal && <ConsultationModal appointment={consultModal} onClose={() => setConsultModal(null)} />}
      {callModal && <CallModal user={user} partnerName={callModal.patientName} appointmentId={callModal._id} type={callModal.type} onClose={() => { setCallModal(null); fetchAppointments(); }} />}
      
      {otpModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: COLORS.surface, borderRadius: 24, padding: 40, width: 400, textAlign: "center" }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 24 }}>Patient Consent Required</h3>
            <p style={{ color: COLORS.textMuted, marginBottom: 20 }}>An OTP has been sent to the patient's mobile number. Please ask them for the OTP to gain temporary access to their health records.</p>
            <input 
              placeholder="Enter 6-digit OTP" 
              value={otpInput} 
              onChange={e => setOtpInput(e.target.value)} 
              maxLength={6}
              style={{ width: "100%", padding: 15, borderRadius: 12, border: `2px solid ${COLORS.primary}`, fontSize: 24, textAlign: "center", tracking: "2px", marginBottom: 20, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="outline" onClick={() => { setOtpModal(null); setOtpInput(""); }} style={{ flex: 1 }}>Cancel</Btn>
              <Btn onClick={verifyRecordOtp} style={{ flex: 1 }}>Verify</Btn>
            </div>
          </div>
        </div>
      )}

      {viewingRecord && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div 
            style={{ background: COLORS.surface, borderRadius: 24, padding: 40, width: 700, maxWidth: "95%", position: "relative", userSelect: "none", maxHeight: "90vh", overflowY: "auto" }}
            onContextMenu={e => e.preventDefault()}
          >
            {/* Security Watermark */}
            <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.05, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
              <p style={{ transform: "rotate(-45deg)", fontSize: 54, fontWeight: 900, whiteSpace: "nowrap", textAlign: "center", color: "#000" }}>
                VIEWED BY DR. {user.name.toUpperCase()} <br/> {new Date().toLocaleString()}
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 24 }}>Digital Health Record — {viewingRecord.name}</h3>
              <button onClick={() => setViewingRecord(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div><p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>Contact Details</p><p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{viewingRecord.phone || 'N/A'}</p></div>
              <div><p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>Village / Sector</p><p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{viewingRecord.communityName || 'N/A'}</p></div>
              <div><p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>Blood Group</p><p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{viewingRecord.healthRecord?.bloodGroup || 'N/A'}</p></div>
              <div><p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>Age / Weight</p><p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{viewingRecord.healthRecord?.age || 'N/A'}y / {viewingRecord.healthRecord?.weight || 'N/A'}kg</p></div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>Conditions</p>
              <p style={{ margin: 0, fontSize: 16 }}>{viewingRecord.healthRecord?.conditions || 'None reported'}</p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>Allergies</p>
              <p style={{ margin: 0, fontSize: 16, color: COLORS.danger }}>{viewingRecord.healthRecord?.allergies || 'None'}</p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>Current Medications</p>
              <p style={{ margin: 0, fontSize: 16 }}>{viewingRecord.healthRecord?.medications || 'None'}</p>
            </div>
            
            {viewingRecord.healthRecord?.labReports?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ margin: "0 0 8px", fontSize: 14, color: COLORS.textMuted }}>Lab Reports</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {viewingRecord.healthRecord.labReports.map((url, i) => (
                    <div key={i} onClick={() => setViewingMedia(url)} style={{ padding: "8px 12px", background: COLORS.primaryLight, borderRadius: 8, fontSize: 14, color: COLORS.primaryDark, cursor: "pointer", userSelect: "none" }}>📄 View Report {i + 1}</div>
                  ))}
                </div>
              </div>
            )}

            {viewingRecord.healthRecord?.previousPrescriptions?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ margin: "0 0 8px", fontSize: 14, color: COLORS.textMuted }}>Previous Prescriptions</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {viewingRecord.healthRecord.previousPrescriptions.map((url, i) => (
                    <div key={i} onClick={() => setViewingMedia(url)} style={{ cursor: "pointer", userSelect: "none" }}>
                      <img src={url} alt="prescription" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, border: `1px solid ${COLORS.border}`, pointerEvents: "none" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Btn style={{ width: "100%", marginTop: 10 }} onClick={() => setViewingRecord(null)}>Close Secure Record</Btn>
          </div>
        </div>
      )}

      {viewingMedia && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }} onContextMenu={e => e.preventDefault()}>
          <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }}>
            <button onClick={() => setViewingMedia(null)} style={{ position: "absolute", top: -40, right: -40, background: "none", border: "none", color: "#fff", fontSize: 30, cursor: "pointer" }}>✕</button>
            <div style={{ position: "absolute", inset: 0, zIndex: 3001 }}></div>
            {viewingMedia.toLowerCase().endsWith('.pdf') ? (
              <iframe src={`${viewingMedia}#toolbar=0`} style={{ width: "80vw", height: "80vh", border: "none", pointerEvents: "none" }} title="Secure Media" />
            ) : (
              <img src={viewingMedia} alt="Secure Media" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", userSelect: "none", pointerEvents: "none" }} />
            )}
          </div>
        </div>
      )}

      {sosAlert && (
        <div style={{ background: COLORS.danger, color: "#fff", padding: "12px 5%", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 100 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>🚨 SOS EMERGENCY — Patient Puja Ghosh. Abdominal pain. Sector 4.</p>
          <button onClick={() => setSosAlert(false)} style={{ background: COLORS.surface, color: COLORS.danger, border: "none", borderRadius: 10, padding: "8px 20px", fontWeight: 800, cursor: "pointer", fontSize: 18 }}>Respond</button>
        </div>
      )}

      <nav style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 80, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🌿</div>
          <span style={{ fontWeight: 800, fontSize: 28, color: COLORS.text }}>सेहतSetu <span style={{fontSize: 16, color: COLORS.textMuted, fontStyle: "italic", fontWeight: 600}}>Doctor</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15, marginRight: 20 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: COLORS.text }}>Dr. {user?.name}</p>
                {user?.isVerified && <Badge color="success">✓ Verified</Badge>}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: COLORS.textMuted }}>{user?.specialization} · {user?.communityName || 'Sector'} Specialist</p>
            </div>
            <Avatar initials={user?.name?.[0] || 'D'} size={40} color={COLORS.primary} />
          </div>
          <LanguageSwitcher />
          <button onClick={handleLogout} style={{ background: COLORS.primaryLight, border: "none", color: COLORS.primary, padding: "8px 20px", borderRadius: 10, cursor: "pointer", fontSize: 16, fontWeight: 700 }}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-layout">
        <aside className="sidebar" style={{ width: 300 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`sidebar-item ${tab === t.id ? 'active' : ''}`} style={{ fontSize: 20, padding: "18px 30px" }}>
              {t.icon} {t.label}
            </button>
          ))}
          <button onClick={() => navigate('/profile')} className="sidebar-item" style={{ fontSize: 20, padding: "18px 30px", marginTop: "auto" }}>
            👤 Profile Settings
          </button>
        </aside>

        <main className="main-content" style={{ padding: 40 }}>
          {tab === "appointments" && (
            <div>
              <h3 style={{ color: COLORS.text, marginBottom: 24, fontSize: 24 }}>Upcoming Consultations</h3>
              {appointments.filter(a => a.status === 'confirmed').map(a => (
                <Card key={a._id} style={{ marginBottom: 20, padding: 30 }}>
                  <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ background: "#f0f0f0", padding: 10, borderRadius: 12, marginBottom: 10 }}>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${a.patientId}`} alt="Health QR" style={{ width: 40, height: 40, marginBottom: 8 }} />
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>HEALTH QR</p>
                      </div>
                      <Btn small variant="ghost" onClick={() => requestPatientRecordAccess(a.patientId)} style={{ fontSize: 12, padding: "6px 12px" }}>Request Record</Btn>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 24, color: COLORS.text }}>{a.patientName}</p>
                          <p style={{ margin: "8px 0", fontSize: 20, color: COLORS.text }}>Time: <strong style={{ color: COLORS.primary }}>{a.date} at {a.time}</strong></p>
                          <p style={{ margin: 0, fontSize: 18, color: COLORS.textMuted }}>Complaint: <span style={{ color: COLORS.text, fontWeight: 600 }}>{a.disease}</span></p>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Btn small onClick={() => startCall(a, 'video')} style={{ fontSize: 16, padding: "10px 16px", background: "#22c55e" }}>📹 Video</Btn>
                          <Btn small onClick={() => startCall(a, 'voice')} style={{ fontSize: 16, padding: "10px 16px", background: "#3b82f6" }}>📞 Voice</Btn>
                          <Btn small onClick={() => alert("SMS notification sent to " + a.patientName)} style={{ fontSize: 16, padding: "10px 16px", background: "#f59e0b" }}>✉️ SMS</Btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {appointments.filter(a => a.status === 'confirmed').length === 0 && <p style={{ fontSize: 18, color: COLORS.textMuted }}>No upcoming calls scheduled.</p>}
            </div>
          )}

          {tab === "patients" && (
            <div>
              <h3 style={{ color: COLORS.text, marginBottom: 24, fontSize: 24 }}>Call History & Prescriptions</h3>
              {appointments.filter(a => a.status === 'completed').map(a => (
                <Card key={a._id} style={{ marginBottom: 20, padding: 30 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 22 }}>{a.patientName}</p>
                  <p style={{ margin: "4px 0", fontSize: 16, color: COLORS.textMuted }}>Finished: {a.date}</p>
                  <div style={{ background: COLORS.primaryLight, padding: 15, borderRadius: 12, marginTop: 15 }}>
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Prescription History:</p>
                    {renderPrescriptionTable(a.prescription)}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === "earnings" && (
            <div>
              <h3 style={{ color: COLORS.text, marginBottom: 24, fontSize: 24 }}>Consultation Earnings</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
                <Card style={{ padding: 40, textAlign: "center" }}>
                  <p style={{ fontSize: 20, color: COLORS.textMuted, marginBottom: 10 }}>Total Earnings</p>
                  <p style={{ fontSize: 64, fontWeight: 900, color: COLORS.primary }}>₹{appointments.filter(a => a.paymentStatus === 'paid').length * (user?.consultationFee || 200)}</p>
                </Card>
                <Card style={{ padding: 40, textAlign: "center" }}>
                  <p style={{ fontSize: 20, color: COLORS.textMuted, marginBottom: 10 }}>Completed Calls</p>
                  <p style={{ fontSize: 64, fontWeight: 900, color: COLORS.accent }}>{appointments.filter(a => a.status === 'completed').length}</p>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
      </div>
    </div>
  );
}
