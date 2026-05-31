import React, { useEffect, useRef, useState, useCallback } from 'react';
import { COLORS } from '../../constants';
import Btn from '../common/Btn';
import ChatPanel from '../common/ChatPanel';
import axios from 'axios';

/**
 * Network tier detection:
 *  "video"  — good connection (4G / WiFi / downlink ≥ 2 Mbps)
 *  "voice"  — low data (3G / 2G / downlink 0.3–2 Mbps)
 *  "offline" — no connectivity
 */
function detectNetworkTier() {
  if (!navigator.onLine) return 'offline';

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return 'video'; // unknown → assume fine

  const { effectiveType, downlink, rtt } = conn;

  // Weak connection -> Chat Mode
  if (effectiveType === '3g' || effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1.5 || rtt >= 300) {
    return 'chat'; // 3G and below
  }

  // Medium connection -> Audio-Only
  if (downlink >= 1.5 && downlink < 4.0) {
    return 'voice'; // Slow 4G
  }

  // Strong connection -> Full Video
  return 'video';
}

export default function CallModal({ user, partnerName, appointmentId, type, onClose }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const streamRef = useRef(null);

  const [callStatus, setCallStatus] = useState('connecting');
  const [localStream, setLocalStream] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(type === 'voice');
  const [networkTier, setNetworkTier] = useState(() => detectNetworkTier());
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', freq: '' }]);
  const [prescriptionImage, setPrescriptionImage] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState(null);
  const [saving, setSaving] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(user?.role === 'patient');
  const [showChat, setShowChat] = useState(false);

  // ── Network monitoring ──────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      const tier = detectNetworkTier();
      setNetworkTier(tier);
      if (tier === 'chat' || tier === 'offline') {
        setShowChat(true);
        setVideoOff(true);
      } else if (tier === 'voice') {
        setVideoOff(true);
      } else if (type !== 'voice') {
        setVideoOff(false); // Turn video back on if network is good
      }
    };

    update();

    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    // Listen for connection changes if supported
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) conn.addEventListener('change', update);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      if (conn) conn.removeEventListener('change', update);
    };
  }, []);

  // ── Media stream — based on type prop AND network tier ─────────────────────
  useEffect(() => {
    let stream = null;
    // Voice type or poor network → audio only; good network + video type → video+audio
    const needVideo = type !== 'voice' && networkTier === 'video';
    const needAudio = networkTier !== 'chat' && networkTier !== 'offline';

    async function startMedia() {
      if (!needAudio && !needVideo) {
        setVideoOff(true);
        setCallStatus('chat_only');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: needVideo,
          audio: true
        });
        streamRef.current = stream;
        setLocalStream(stream);
        if (needVideo && localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCallStatus('active');
        if (!needVideo) setVideoOff(true);
      } catch (err) {
        console.warn('Video failed, falling back to audio-only:', err.message);
        try {
          // Video failed → retry audio only
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          streamRef.current = stream;
          setLocalStream(stream);
          setVideoOff(true);
          setCallStatus('active');
        } catch (audioErr) {
          console.error('Audio also failed:', audioErr.message);
          setCallStatus('failed');
        }
      }
    }

    startMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [networkTier, type]);

  // Mirror local stream to remote video (simulated)
  useEffect(() => {
    if (localStream && remoteVideoRef.current && !videoOff && partnerConnected) {
      remoteVideoRef.current.srcObject = localStream;
    }
  }, [localStream, videoOff, partnerConnected]);

  // ── Poll appointment status ─────────────────────────────────────────────────
  useEffect(() => {
    if (!appointmentId) return;
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/appointments/user/${user._id}`);
        const appt = res.data.find(a => a._id === appointmentId);
        if (!appt) return;
        if (appt.status === 'completed') return onClose();
        if (user.role === 'doctor') {
          if (appt.status === 'confirmed') { alert('Patient declined the call.'); onClose(); }
          else if (appt.status === 'active') setPartnerConnected(true);
        } else if (user.role === 'patient') {
          if (appt.status === 'confirmed') { alert('Doctor ended the call.'); onClose(); }
        }
      } catch (err) { console.error('Poll error:', err); }
    }, 3000);
    return () => clearInterval(interval);
  }, [appointmentId, user, onClose]);

  const handleSavePrescription = async () => {
    if (!appointmentId) return;
    setSaving(true);
    try {
      const presStr = JSON.stringify(medicines.filter(m => m.name.trim() !== ''));

      if (!navigator.onLine) {
        try {
          const localforage = (await import('localforage')).default;
          const offlinePrescriptions = await localforage.getItem(`offline_prescriptions_${user._id}`) || [];
          offlinePrescriptions.push({ appointmentId, prescription: presStr, prescriptionImage, status: 'queued' });
          await localforage.setItem(`offline_prescriptions_${user._id}`, offlinePrescriptions);
          alert('Prescription saved offline! It will sync automatically when you reconnect.');
          onClose();
        } catch (err) {
          alert('Failed to save offline prescription.');
        } finally {
          setSaving(false);
        }
        return;
      }

      await axios.put(`http://localhost:5000/api/appointments/${appointmentId}/prescription`, { prescription: presStr, prescriptionImage });
      alert('Prescription saved and sent to patient!');
      onClose();
    } catch { alert('Failed to save prescription'); }
    finally { setSaving(false); }
  };

  const handleEndCall = async () => {
    if (appointmentId) {
      try {
        const presStr = JSON.stringify(medicines.filter(m => m.name.trim() !== ''));
        const finalPres = presStr === '[]' ? 'Consultation completed.' : presStr;

        if (!navigator.onLine) {
          const localforage = (await import('localforage')).default;
          const offlinePrescriptions = await localforage.getItem(`offline_prescriptions_${user._id}`) || [];
          offlinePrescriptions.push({ appointmentId, prescription: finalPres, status: 'queued' });
          await localforage.setItem(`offline_prescriptions_${user._id}`, offlinePrescriptions);
        } else {
          await axios.put(`http://localhost:5000/api/appointments/${appointmentId}/prescription`, {
            prescription: finalPres
          });
        }
      } catch (err) { console.error(err); }
    }
    onClose();
  };

  const toggleMute = () => {
    setMuted(prev => {
      const newMuted = !prev;
      streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !newMuted; });
      return newMuted;
    });
  };

  const handleOCRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrConfidence(null);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        try {
          const res = await axios.post('http://localhost:5000/api/ocr/parse', { imageBase64: base64String });
          if (res.data.success) {
            setMedicines(res.data.medicines);
            setPrescriptionImage(res.data.imageUrl);
            setOcrConfidence(res.data.confidence);
          }
        } catch (err) {
          alert('Failed to parse OCR.');
        } finally {
          setOcrLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setOcrLoading(false);
      alert('Error reading file.');
    }
  };

  // ── UI helpers ──────────────────────────────────────────────────────────────
  const isVideo = networkTier === 'video' && type !== 'voice' && !videoOff;
  const isOffline = networkTier === 'offline';

  const networkBadge = {
    video: { icon: '📶', label: 'Good Signal — Video Call', color: '#064e3b', bg: '#d1fae5' },
    voice: { icon: '⚠️', label: 'Low Data — Voice Call Only', color: '#78350f', bg: '#fef3c7' },
    chat: { icon: '💬', label: 'Very Low Data — Chat Mode Only', color: '#1e3a8a', bg: '#dbeafe' },
    offline: { icon: '📴', label: 'OFFLINE — Use Chat Below', color: '#7f1d1d', bg: '#fee2e2' }
  }[networkTier];

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const debugInfo = conn ? ` (${conn.effectiveType}, ↓ ${conn.downlink}Mbps, ${conn.rtt}ms)` : '';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      <div style={{ width: '97%', maxWidth: 1300, height: '92vh', position: 'relative', background: '#0f172a', borderRadius: 24, overflow: 'hidden', display: 'flex' }}>

        {/* ── Left: Call Area ── */}
        <div style={{ flex: showChat ? 0.55 : (user?.role === 'doctor' ? 0.68 : 1), display: 'flex', flexDirection: 'column', transition: 'flex 0.3s' }}>

          {/* Network Banner */}
          <div style={{ padding: '10px 20px', background: networkBadge.bg, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18 }}>{networkBadge.icon}</span>
            <span style={{ color: networkBadge.color, fontWeight: 700, fontSize: 14 }}>{networkBadge.label} {debugInfo}</span>
            {(isOffline || networkTier === 'chat') && (
              <button
                onClick={() => { setShowChat(true); }}
                style={{ marginLeft: 'auto', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
              >
                Open Chat 💬
              </button>
            )}
            {networkTier === 'voice' && (
              <span style={{ marginLeft: 'auto', color: '#92400e', fontSize: 12 }}>
                Video disabled to save bandwidth
              </span>
            )}
            {networkTier === 'chat' && (
              <span style={{ marginLeft: 'auto', color: '#1e3a8a', fontSize: 12 }}>
                Audio/Video disabled to save bandwidth
              </span>
            )}
          </div>

          {/* Video / Avatar Area */}
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000d1a', overflow: 'hidden' }}>
            {(callStatus === 'active' || callStatus === 'chat_only') ? (
              <>
                {/* Remote video — always mounted, toggled via display to preserve stream */}
                <video ref={remoteVideoRef} autoPlay playsInline style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', display: (isVideo && partnerConnected) ? 'block' : 'none' }} />

                {/* Avatar shown when audio-only or partner not yet joined */}
                {(!isVideo || !partnerConnected) && (
                  <div style={{ textAlign: 'center', zIndex: 2, background: 'rgba(0,0,0,0.5)', padding: 50, borderRadius: 28, backdropFilter: 'blur(12px)' }}>
                    <div style={{
                      width: 140, height: 140, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${COLORS.primary} 0%, #7c3aed 100%)`,
                      fontSize: 58, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 24px', boxShadow: '0 0 50px rgba(34,197,94,0.25)'
                    }}>
                      {partnerName?.[0] || 'P'}
                    </div>
                    <h2 style={{ fontSize: 28, margin: 0 }}>{partnerName}</h2>
                    <p style={{ margin: '12px 0 0', opacity: 0.8, fontSize: 16 }}>
                      {!partnerConnected && user?.role === 'doctor'
                        ? '⏳ Waiting for patient to join...'
                        : networkTier === 'chat'
                          ? '💬 Lightweight Chat Mode Active'
                          : networkTier === 'voice'
                            ? '🎙️ Voice Call Active'
                            : isOffline
                              ? '📴 Offline — Use chat to communicate'
                              : 'Connected'}
                    </p>

                    {/* Audio wave animation for voice mode */}
                    {networkTier === 'voice' && !isOffline && (
                      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 5, height: 40 }}>
                        {[0.4, 0.7, 1, 0.7, 0.4, 0.6, 0.9, 0.6, 0.4].map((h, i) => (
                          <div key={i} style={{
                            width: 5, borderRadius: 4,
                            background: COLORS.primary,
                            height: `${h * 36}px`,
                            animation: `audioBar ${0.7 + i * 0.08}s ${i * 0.1}s ease-in-out infinite alternate`,
                            opacity: 0.85
                          }} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Connected label for video mode */}
                {isVideo && partnerConnected && (
                  <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 2, background: 'rgba(0,0,0,0.6)', padding: '8px 18px', borderRadius: 30, backdropFilter: 'blur(8px)' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>🟢 Connected · {partnerName}</span>
                  </div>
                )}

                {/* Local video PiP */}
                <div style={{ position: 'absolute', bottom: 20, right: 20, width: 200, height: 150, background: '#000', borderRadius: 14, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.25)', boxShadow: '0 4px 20px rgba(0,0,0,0.6)', display: isVideo ? 'block' : 'none' }}>
                  <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                </div>
              </>
            ) : callStatus === 'failed' ? (
              <div style={{ textAlign: 'center', padding: 50 }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>
                <p style={{ fontSize: 20, fontWeight: 700 }}>Could not access microphone</p>
                <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>Check browser permissions and try again</p>
                <Btn onClick={() => setShowChat(true)}>Use Chat Instead 💬</Btn>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>🔄</div>
                <p style={{ marginTop: 16 }}>Starting call...</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ height: 86, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 24px', flexShrink: 0 }}>
            {/* Mute */}
            <button onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'} style={{ background: muted ? COLORS.danger : '#334155', border: 'none', borderRadius: '50%', width: 54, height: 54, color: '#fff', cursor: 'pointer', fontSize: 22, transition: 'background 0.2s' }}>
              {muted ? '🔇' : '🎤'}
            </button>

            {/* End Call */}
            <button onClick={handleEndCall} style={{ background: COLORS.danger, border: 'none', borderRadius: 30, padding: '0 32px', height: 54, color: '#fff', cursor: 'pointer', fontSize: 17, fontWeight: 800, boxShadow: '0 4px 16px rgba(239,68,68,0.4)' }}>
              End Call 📞
            </button>

            {/* Video toggle — only shown when network is good */}
            {networkTier === 'video' && type !== 'voice' && (
              <button onClick={() => setVideoOff(v => !v)} title={videoOff ? 'Enable Camera' : 'Disable Camera'} style={{ background: videoOff ? COLORS.danger : '#334155', border: 'none', borderRadius: '50%', width: 54, height: 54, color: '#fff', cursor: 'pointer', fontSize: 22 }}>
                {videoOff ? '📷❌' : '📷'}
              </button>
            )}

            {/* Chat toggle */}
            <button onClick={() => setShowChat(c => !c)} title="Chat" style={{ background: showChat ? COLORS.primary : '#334155', border: 'none', borderRadius: '50%', width: 54, height: 54, color: '#fff', cursor: 'pointer', fontSize: 22 }}>
              💬
            </button>

            {/* Network tier indicator */}
            <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {networkTier === 'video' ? '📶 4G/WiFi' : networkTier === 'voice' ? '⚠️ Low Data' : '📴 Offline'}
            </div>
          </div>
        </div>

        {/* ── Right: Doctor Prescription OR Chat Panel ── */}
        {user?.role === 'doctor' && (
          <div style={{ flex: 0.32, background: '#fff', color: COLORS.text, padding: 28, display: !showChat ? 'flex' : 'none', flexDirection: 'column', borderLeft: '1px solid #e5e7eb', minWidth: 280 }}>
            <h3 style={{ fontSize: 20, marginBottom: 14, color: COLORS.primaryDark }}>📝 Live Prescription</h3>
            <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>Patient: <strong>{partnerName}</strong></p>

            <div style={{ marginBottom: 16, padding: 12, border: `2px dashed ${COLORS.primary}`, borderRadius: 12, textAlign: 'center' }}>
              <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: COLORS.primaryDark }}>Upload Handwritten Prescription</p>
              {prescriptionImage ? (
                <div>
                  <img src={prescriptionImage} alt="prescription" style={{ width: '100%', maxHeight: 80, objectFit: 'contain', borderRadius: 8, marginBottom: 8 }} />
                  <p style={{ fontSize: 12, color: COLORS.success, margin: 0 }}>✓ Image uploaded & parsed</p>
                </div>
              ) : (
                <>
                  <input type="file" accept="image/*" onChange={handleOCRUpload} style={{ display: 'none' }} id="ocr-upload" />
                  <label htmlFor="ocr-upload">
                    <div style={{ cursor: 'pointer', background: COLORS.primaryLight, padding: '8px 12px', borderRadius: 8, color: COLORS.primaryDark, fontSize: 14, fontWeight: 600 }}>
                      {ocrLoading ? 'Extracting Text...' : 'Scan & Extract 📷'}
                    </div>
                  </label>
                </>
              )}
            </div>

            {ocrConfidence === 'Low' && (
              <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: 8, padding: 10, marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>⚠️ Low OCR Confidence. Please verify and correct the extracted medicines manually below to avoid incorrect prescriptions.</p>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 14 }}>
              {medicines.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 10, background: '#f8fafc', padding: 12, borderRadius: 12, border: `1px solid ${ocrConfidence === 'Low' ? '#fca5a5' : COLORS.border}` }}>
                  <input placeholder="Medicine Name" value={m.name} onChange={e => { const n = [...medicines]; n[i].name = e.target.value; setMedicines(n); }} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 14 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input placeholder="Dosage (500mg)" value={m.dosage} onChange={e => { const n = [...medicines]; n[i].dosage = e.target.value; setMedicines(n); }} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 14 }} />
                    <input placeholder="Freq (1-0-1)" value={m.freq} onChange={e => { const n = [...medicines]; n[i].freq = e.target.value; setMedicines(n); }} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 14 }} />
                    {medicines.length > 1 && <button onClick={() => setMedicines(medicines.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', fontSize: 18 }}>✕</button>}
                  </div>
                </div>
              ))}
              <Btn variant="outline" small onClick={() => setMedicines([...medicines, { name: '', dosage: '', freq: '' }])} style={{ width: '100%', marginTop: 6 }}>
                + Add Medicine
              </Btn>
            </div>
            <Btn onClick={handleSavePrescription} disabled={saving || ocrLoading} style={{ width: '100%', padding: '15px 0', fontSize: 17 }}>
              {saving ? 'Saving...' : '💾 Save & Finish Call'}
            </Btn>
          </div>
        )}

        <div style={{ flex: 0.38, display: showChat ? 'flex' : 'none', flexDirection: 'column', minWidth: 300 }}>
          <ChatPanel
            appointmentId={appointmentId}
            userName={user?.name || (user?.role === 'doctor' ? 'Doctor' : 'Patient')}
            role={user?.role}
            partnerName={partnerName}
            isOffline={isOffline}
          />
        </div>
      </div>

      <style>{`
        @keyframes audioBar {
          from { opacity: 0.4; transform: scaleY(0.6); }
          to { opacity: 1; transform: scaleY(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
