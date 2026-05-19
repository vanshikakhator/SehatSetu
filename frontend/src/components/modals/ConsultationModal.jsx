import React, { useState } from 'react';
import { COLORS } from '../../constants';
import Btn from '../common/Btn';
import NetworkBadge from '../common/NetworkBadge';

export default function ConsultationModal({ appointment, onClose }) {
  const [network, setNetwork] = useState("high");
  const [prescriptionSent, setPrescriptionSent] = useState(false);
  const [prescription, setPrescription] = useState("");
  
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000066", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: 500, maxWidth: "90vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>Consultation — {appointment.patient}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ background: COLORS.surfaceAlt, borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: 12, color: COLORS.textMuted }}>Patient</p><p style={{ margin: "2px 0 0", fontWeight: 600 }}>{appointment.patient}, {appointment.age}y/{appointment.gender}</p></div>
            <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: 12, color: COLORS.textMuted }}>Complaint</p><p style={{ margin: "2px 0 0", fontWeight: 600 }}>{appointment.disease}</p></div>
          </div>
          <div><p style={{ margin: 0, fontSize: 12, color: COLORS.textMuted }}>Contact</p><p style={{ margin: "2px 0 0", fontWeight: 600 }}>{appointment.phone}</p></div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>Simulate network condition</p>
          <div style={{ display: "flex", gap: 8 }}>
            {["high", "medium", "low", "offline"].map(n => (
              <button key={n} onClick={() => setNetwork(n)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: `2px solid ${network === n ? COLORS.primary : COLORS.border}`, background: network === n ? COLORS.primaryLight : "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", color: network === n ? COLORS.primary : COLORS.textMuted }}>
                {n.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div style={{ background: "#000", borderRadius: 12, height: 160, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, position: "relative" }}>
          {network === "high" && <div style={{ textAlign: "center" }}><div style={{ fontSize: 40 }}>📹</div><p style={{ color: "#fff", margin: "4px 0 0", fontSize: 13 }}>Video Call Active</p></div>}
          {network === "medium" && <div style={{ textAlign: "center" }}><div style={{ fontSize: 40 }}>🎙️</div><p style={{ color: "#fff", margin: "4px 0 0", fontSize: 13 }}>Voice Call (low bandwidth detected)</p></div>}
          {network === "low" && <div style={{ textAlign: "center" }}><div style={{ fontSize: 40 }}>💬</div><p style={{ color: "#fff", margin: "4px 0 0", fontSize: 13 }}>Chat mode (very low bandwidth)</p></div>}
          {network === "offline" && <div style={{ textAlign: "center" }}><div style={{ fontSize: 40 }}>📱</div><p style={{ color: "#fff", margin: "4px 0 0", fontSize: 13 }}>SMS fallback — no internet</p></div>}
          <div style={{ position: "absolute", top: 10, right: 10 }}><NetworkBadge level={network} /></div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600 }}>Send Prescription via message</p>
          <textarea value={prescription} onChange={e => setPrescription(e.target.value)} placeholder="Type prescription (medicines, dosage, instructions)..." style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 13, minHeight: 70, boxSizing: "border-box", resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => { if (prescription) setPrescriptionSent(true); }} style={{ flex: 1 }}>Send Prescription</Btn>
          <Btn variant="danger" onClick={onClose} style={{ flex: 1 }}>End Call</Btn>
        </div>
        {prescriptionSent && <p style={{ color: COLORS.primary, fontWeight: 600, textAlign: "center", marginTop: 10, fontSize: 13 }}>✓ Prescription sent via {network === "offline" ? "SMS" : "platform message"}</p>}
      </div>
    </div>
  );
}
