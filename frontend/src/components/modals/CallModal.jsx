import React, { useEffect, useRef, useState } from 'react';
import { COLORS } from '../../constants';
import Btn from '../common/Btn';
import axios from 'axios';

export default function CallModal({ user, partnerName, appointmentId, type, onClose }) {
  const localVideoRef = useRef(null);
  const [callStatus, setCallStatus] = useState("connecting"); // connecting, active, ended
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(type === 'voice');
  const [networkQuality, setNetworkQuality] = useState("high"); // high, low
  const [medicines, setMedicines] = useState([{ name: "", dosage: "", freq: "" }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let stream = null;
    async function startCamera() {
      try {
        // Ensure audio is true for "voice nhi ho rha hai" fix
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCallStatus("active");
      } catch (err) {
        console.error("Error accessing camera:", err);
        setCallStatus("failed");
      }
    }
    startCamera();

    // Network Fallback Simulation: if quality drops, turn off video
    if (networkQuality === "low") {
      setVideoOff(true);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [networkQuality]);

  const handleSavePrescription = async () => {
    if (!appointmentId) return;
    setSaving(true);
    try {
      const presStr = JSON.stringify(medicines.filter(m => m.name.trim() !== ""));
      await axios.put(`http://localhost:5000/api/appointments/${appointmentId}/prescription`, { prescription: presStr });
      alert("Prescription saved and sent to patient!");
      onClose();
    } catch (err) {
      alert("Failed to save prescription");
    } finally {
      setSaving(false);
    }
  };

  const handleEndCall = async () => {
    if (appointmentId) {
      try {
        const presStr = JSON.stringify(medicines.filter(m => m.name.trim() !== ""));
        await axios.put(`http://localhost:5000/api/appointments/${appointmentId}/prescription`, { prescription: presStr === "[]" ? "Consultation completed." : presStr });
      } catch (err) {
        console.error(err);
      }
    }
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
      <div style={{ width: "95%", maxWidth: 1200, height: "90vh", position: "relative", background: "#1a1a1a", borderRadius: 24, overflow: "hidden", display: "flex" }}>
        
        {/* Call Area */}
        <div style={{ flex: user?.role === 'doctor' ? 0.7 : 1, position: "relative", display: "flex", flexDirection: "column", background: "#222" }}>
          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {callStatus === "active" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 120, height: 120, borderRadius: "50%", background: COLORS.primary, fontSize: 48, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  {partnerName?.[0] || "P"}
                </div>
                <h2 style={{ fontSize: 32 }}>{partnerName}</h2>
                <p style={{ opacity: 0.6, fontSize: 18 }}>{videoOff ? "Audio Call Active (Low Bandwidth Mode)" : "Live Video Consultation..."}</p>
              </div>
            ) : (
              <p>{callStatus === "connecting" ? "Initializing camera..." : "Call Failed"}</p>
            )}

            {/* Local Video Overlay */}
            {!videoOff && (
              <div style={{ position: "absolute", bottom: 20, right: 20, width: 240, height: 180, background: "#000", borderRadius: 16, overflow: "hidden", border: "2px solid #fff" }}>
                <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ height: 100, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", gap: 30 }}>
            <button onClick={() => setMuted(!muted)} style={{ background: muted ? COLORS.danger : "#333", border: "none", borderRadius: "50%", width: 60, height: 60, color: "#fff", cursor: "pointer", fontSize: 24 }}>
              {muted ? "🔇" : "🎤"}
            </button>
            <button onClick={handleEndCall} style={{ background: COLORS.danger, border: "none", borderRadius: 30, padding: "0 40px", height: 60, color: "#fff", cursor: "pointer", fontSize: 20, fontWeight: 800 }}>
              End Call 📞
            </button>
            <button onClick={() => setVideoOff(!videoOff)} style={{ background: videoOff ? COLORS.danger : "#333", border: "none", borderRadius: "50%", width: 60, height: 60, color: "#fff", cursor: "pointer", fontSize: 24 }}>
              {videoOff ? "❌" : "📷"}
            </button>
            <Btn small variant="ghost" onClick={() => setNetworkQuality(networkQuality === "high" ? "low" : "high")} style={{ fontSize: 14 }}>
              {networkQuality === "high" ? "Signal: Good" : "Signal: Poor (Audio Only)"}
            </Btn>
          </div>
        </div>

        {/* Prescription Sidebar (Doctor Only) */}
        {user?.role === 'doctor' && (
          <div style={{ flex: 0.3, background: "#fff", color: COLORS.text, padding: 30, display: "flex", flexDirection: "column", borderLeft: `1px solid ${COLORS.border}` }}>
            <h3 style={{ fontSize: 22, marginBottom: 20 }}>📝 Live Prescription</h3>
            <p style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 10 }}>Patient: {partnerName}</p>
            <div style={{ flex: 1, overflowY: "auto", marginBottom: 20, paddingRight: 10 }}>
              {medicines.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap", background: "#f8fafc", padding: 10, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
                  <input placeholder="Medicine Name" value={m.name} onChange={(e) => { const newM = [...medicines]; newM[i].name = e.target.value; setMedicines(newM); }} style={{ flex: 2, padding: "10px", borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
                  <input placeholder="Dosage (e.g. 500mg)" value={m.dosage} onChange={(e) => { const newM = [...medicines]; newM[i].dosage = e.target.value; setMedicines(newM); }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
                  <input placeholder="Freq (e.g. 1-0-1)" value={m.freq} onChange={(e) => { const newM = [...medicines]; newM[i].freq = e.target.value; setMedicines(newM); }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
                  {medicines.length > 1 && <button onClick={() => setMedicines(medicines.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: COLORS.danger, cursor: "pointer", fontSize: 18 }}>✕</button>}
                </div>
              ))}
              <Btn variant="outline" small onClick={() => setMedicines([...medicines, { name: "", dosage: "", freq: "" }])} style={{ width: "100%", marginTop: 10 }}>+ Add Medicine</Btn>
            </div>
            <Btn onClick={handleSavePrescription} disabled={saving} style={{ width: "100%", padding: "18px 0", fontSize: 18 }}>
              {saving ? "Saving..." : "Save & Finish Call"}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
