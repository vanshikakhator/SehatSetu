import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../constants';
import Btn from '../components/common/Btn';
import Card from '../components/common/Card';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    specialization: user?.specialization || '',
    consultationFee: user?.consultationFee || '',
    location: user?.location || '',
    communityName: user?.communityName || '',
    healthRecord: user?.healthRecord || {
      bloodGroup: '',
      age: '',
      weight: '',
      conditions: '',
      allergies: '',
      pastSurgeries: '',
      medications: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Build payload — only send fields relevant to the user's role
      const payload = {
        userId: user._id,
        name: formData.name,
        phone: formData.phone,
      };

      if (user?.role === 'patient') {
        const cleanedHealthRecord = { ...formData.healthRecord };
        if (cleanedHealthRecord.age === '') delete cleanedHealthRecord.age;
        if (cleanedHealthRecord.weight === '') delete cleanedHealthRecord.weight;
        payload.healthRecord = cleanedHealthRecord;
        // Don't send location for patients — schema expects string, form has text input
      }
      if (user?.role === 'doctor') {
        payload.specialization = formData.specialization;
        payload.consultationFee = formData.consultationFee;
      }
      if (user?.role === 'pharmacy') {
        // location for pharmacy is a plain string (lat,lng)
        payload.location = typeof formData.location === 'string' ? formData.location : '';
      }
      if (user?.role === 'worker') {
        payload.communityName = formData.communityName;
      }

      const res = await axios.put('http://localhost:5000/api/auth/profile', payload, {
        headers: { 'user-id': user._id }
      });
      updateUser({ ...user, ...res.data });
      setMessage('Profile updated successfully! ✅');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0faf5", padding: "40px 5%" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, color: COLORS.text }}>My Profile</h1>
          <Btn variant="outline" onClick={() => navigate(-1)}>← Back</Btn>
        </div>

        {message && (
          <div style={{ padding: 15, borderRadius: 12, background: message.includes('success') ? COLORS.primaryLight : COLORS.dangerLight, color: message.includes('success') ? COLORS.primary : COLORS.danger, marginBottom: 20, fontWeight: 700 }}>
            {message}
          </div>
        )}

        <Card style={{ padding: 40 }}>
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: 24, fontSize: 24, color: COLORS.primary }}>Basic Information</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 40 }}>
              <div>
                <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Full Name</p>
                <input name="name" value={formData.name} onChange={handleChange} style={{ width: "100%", padding: 15, borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 18 }} />
              </div>
              <div>
                <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Phone Number</p>
                <input name="phone" value={formData.phone} onChange={handleChange} style={{ width: "100%", padding: 15, borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 18 }} />
              </div>
            </div>

            {user?.role === 'doctor' && (
              <>
                <h3 style={{ marginBottom: 24, fontSize: 24, color: COLORS.primary }}>Professional Details</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 40 }}>
                  <div>
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Specialization</p>
                    <input name="specialization" value={formData.specialization} onChange={handleChange} style={{ width: "100%", padding: 15, borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 18 }} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Consultation Fee (₹)</p>
                    <input name="consultationFee" type="number" value={formData.consultationFee} onChange={handleChange} style={{ width: "100%", padding: 15, borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 18 }} />
                  </div>
                </div>
              </>
            )}

            {user?.role === 'pharmacy' && (
              <div style={{ marginBottom: 40 }}>
                <h3 style={{ marginBottom: 24, fontSize: 24, color: COLORS.primary }}>Pharmacy Location</h3>
                <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Coordinates (lat,lng)</p>
                <input
                  name="location"
                  value={typeof formData.location === 'string' ? formData.location : ''}
                  onChange={handleChange}
                  placeholder="e.g. 28.6139,77.2090"
                  style={{ width: "100%", padding: 15, borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 18, boxSizing: 'border-box' }}
                />
                <p style={{ margin: "8px 0 0", fontSize: 13, color: COLORS.textMuted }}>This is shown to patients in the "Get Directions" map.</p>
              </div>
            )}

            {user?.role === 'patient' && (
              <>
                <h3 style={{ marginBottom: 24, fontSize: 24, color: COLORS.primary }}>Digital Health Record</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
                  <div>
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Blood Group</p>
                    <input name="healthRecord.bloodGroup" value={formData.healthRecord.bloodGroup} onChange={handleChange} style={{ width: "100%", padding: 15, borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 18 }} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Age</p>
                    <input name="healthRecord.age" type="number" value={formData.healthRecord.age} onChange={handleChange} style={{ width: "100%", padding: 15, borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 18 }} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Weight (kg)</p>
                    <input name="healthRecord.weight" type="number" value={formData.healthRecord.weight} onChange={handleChange} style={{ width: "100%", padding: 15, borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 18 }} />
                  </div>
                </div>
                <div style={{ display: "grid", gap: 20, marginBottom: 40 }}>
                  <div>
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Existing Conditions</p>
                    <textarea name="healthRecord.conditions" value={formData.healthRecord.conditions} onChange={handleChange} placeholder="E.g. Diabetes, Hypertension..." style={{ width: "100%", padding: 15, borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 18, minHeight: 80 }} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Allergies</p>
                    <textarea name="healthRecord.allergies" value={formData.healthRecord.allergies} onChange={handleChange} placeholder="E.g. Penicillin, Pollen..." style={{ width: "100%", padding: 15, borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 18, minHeight: 80 }} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Current Medications</p>
                    <textarea name="healthRecord.medications" value={formData.healthRecord.medications} onChange={handleChange} style={{ width: "100%", padding: 15, borderRadius: 12, border: `1.5px solid ${COLORS.border}`, fontSize: 18, minHeight: 80 }} />
                  </div>
                </div>
              </>
            )}

            <Btn type="submit" disabled={loading} style={{ width: "100%", padding: "20px 0", fontSize: 20 }}>
              {loading ? "Updating..." : "Save Profile Changes"}
            </Btn>
          </form>
        </Card>
      </div>
    </div>
  );
}
