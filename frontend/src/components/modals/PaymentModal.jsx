import React, { useState, useEffect } from 'react';
import { COLORS } from '../../constants';
import Btn from '../common/Btn';
import axios from 'axios';

export default function PaymentModal({ doctor, user, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Info, 2: UPI, 3: Success
  const [disease, setDisease] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState("10:00 AM");
  const [upiId, setUpiId] = useState("");

  // Load Razorpay script only when this modal opens (lazy load)
  useEffect(() => {
    if (document.getElementById('razorpay-script')) return; // already loaded
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];


  const handleSimulatedPayment = async () => {
    if (!upiId) {
      alert("Please enter your UPI ID");
      return;
    }
    setLoading(true);

    const bookingPayload = {
      patientId: user._id,
      doctorId: doctor._id,
      patientName: user.name,
      doctorName: doctor.name,
      fee: doctor.consultationFee,
      disease: disease || "General Consultation",
      date: date,
      time: time
    };

    if (!navigator.onLine) {
      try {
        const localforage = (await import('localforage')).default;
        const offlineBookings = await localforage.getItem(`offline_bookings_${user._id}`) || [];
        offlineBookings.push({ ...bookingPayload, id: Date.now(), status: 'queued' });
        await localforage.setItem(`offline_bookings_${user._id}`, offlineBookings);
        setStep(4); // 4 is offline success
      } catch (err) {
        alert("Failed to save offline booking.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      // 1. Book the appointment
      const res = await axios.post('http://localhost:5000/api/appointments/book', bookingPayload);

      const { appointment } = res.data;

      // 2. Verify/Confirm immediately
      await axios.post('http://localhost:5000/api/appointments/verify', {
        appointmentId: appointment._id,
        razorpayPaymentId: "simulated_" + Date.now()
      });

      // 3. Show Success Screen
      setStep(3);
    } catch (err) {
      console.error(err);
      alert("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>
      <div style={{ background: "#fff", borderRadius: 32, padding: 48, width: 550, maxWidth: "90%", boxShadow: "0 30px 60px rgba(0,0,0,0.3)", textAlign: "center" }}>

        {step === 1 && (
          <div style={{ textAlign: "left" }}>
            <h3 style={{ margin: "0 0 24px", fontSize: 32, fontWeight: 800, color: COLORS.primaryDark }}>Consultation Details</h3>

            <div style={{ padding: 24, background: COLORS.primaryLight, borderRadius: 20, marginBottom: 32, border: `1px solid ${COLORS.primary}33` }}>
              <p style={{ margin: 0, fontSize: 18, color: COLORS.primaryDark, fontWeight: 600 }}>Doctor: <span style={{ fontWeight: 800 }}>Dr. {doctor.name}</span></p>
              {doctor.specialization && <p style={{ margin: "4px 0 0", fontSize: 16, color: COLORS.textMuted, fontWeight: 600 }}>Specialization: {doctor.specialization}</p>}
              <p style={{ margin: "8px 0 0", fontSize: 20, color: COLORS.primary, fontWeight: 800 }}>Consultation Fee: ₹{doctor.consultationFee}</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: COLORS.text }}>Describe Symptoms</p>
              <textarea
                placeholder="E.g. Fever, Cough, etc."
                value={disease}
                onChange={(e) => setDisease(e.target.value)}
                style={{
                  width: "100%",
                  padding: 20,
                  borderRadius: 16,
                  border: `2px solid ${COLORS.border}`,
                  fontSize: 18,
                  minHeight: 100,
                  boxSizing: "border-box",
                  outline: "none",
                  color: COLORS.text,
                  backgroundColor: "#f0f8ff" // Change this color
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 40 }}>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: COLORS.text }}>Date</p>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%", padding: "16px", borderRadius: 16, border: `2px solid ${COLORS.border}`, fontSize: 18, color: COLORS.text, background: "#fcfcfc" }} />
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: COLORS.text }}>Time</p>
                <select value={time} onChange={(e) => setTime(e.target.value)} style={{ width: "100%", padding: "16px", borderRadius: 16, border: `2px solid ${COLORS.border}`, fontSize: 18, color: COLORS.text, background: "#fcfcfc" }}>
                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <Btn variant="ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</Btn>
              <Btn style={{ flex: 2, padding: "20px 0", fontSize: 22 }} onClick={() => setStep(2)}>Next: Payment →</Btn>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: "left" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 32, fontWeight: 800, color: COLORS.primaryDark }}>Secure Payment</h3>
            <p style={{ color: COLORS.textMuted, fontSize: 18, marginBottom: 32 }}>Enter UPI ID to confirm your appointment</p>

            <div style={{ background: "#f8fafc", padding: 32, borderRadius: 24, marginBottom: 40, border: `2px solid ${COLORS.primary}22` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ fontSize: 20, color: COLORS.textMuted }}>Fee to Pay</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: COLORS.primary }}>₹{doctor.consultationFee}</span>
              </div>
              <p style={{ margin: "24px 0 12px", fontSize: 18, fontWeight: 700 }}>Enter UPI ID (GPay, PhonePe, Paytm)</p>
              <input
                placeholder="username@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "20px 24px",
                  borderRadius: 18,
                  border: `2px solid ${COLORS.primary}`,
                  fontSize: 22,
                  boxSizing: "border-box",
                  outline: "none",
                  color: COLORS.text,
                  backgroundColor: "#f0f8ff" // Change background color here
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              <Btn variant="ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</Btn>
              <Btn style={{ flex: 2, background: "#22c55e", padding: "20px 0", fontSize: 22 }} onClick={handleSimulatedPayment} disabled={loading}>
                {loading ? "Processing..." : "Pay Now"}
              </Btn>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ padding: "20px 0" }}>
            <div style={{ width: 100, height: 100, background: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, color: "#fff", margin: "0 auto 32px", boxShadow: "0 10px 20px rgba(34, 197, 94, 0.3)" }}>
              ✓
            </div>
            <h3 style={{ fontSize: 36, fontWeight: 900, color: "#1a202c", marginBottom: 16 }}>Payment Successful!</h3>
            <p style={{ fontSize: 20, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 40 }}>
              Your appointment with <span style={{ fontWeight: 700, color: COLORS.primary }}>Dr. {doctor.name}</span> has been confirmed for <span style={{ fontWeight: 700, color: "#1a202c" }}>{date} at {time}</span>.
            </p>
            <Btn style={{ width: "100%", padding: "20px 0", fontSize: 20 }} onClick={onSuccess}>Go to Dashboard</Btn>
          </div>
        )}
        {step === 4 && (
          <div style={{ padding: "20px 0" }}>
            <div style={{ width: 100, height: 100, background: "#f59e0b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, color: "#fff", margin: "0 auto 32px", boxShadow: "0 10px 20px rgba(245, 158, 11, 0.3)" }}>
              ⏳
            </div>
            <h3 style={{ fontSize: 36, fontWeight: 900, color: "#1a202c", marginBottom: 16 }}>Saved Offline!</h3>
            <p style={{ fontSize: 20, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 40 }}>
              You are currently offline. Your appointment with <span style={{ fontWeight: 700, color: COLORS.primary }}>Dr. {doctor.name}</span> has been saved and will be confirmed automatically when you reconnect to the internet.
            </p>
            <Btn style={{ width: "100%", padding: "20px 0", fontSize: 20, background: "#f59e0b" }} onClick={onSuccess}>Got it</Btn>
          </div>
        )}
      </div>
    </div>
  );
}
