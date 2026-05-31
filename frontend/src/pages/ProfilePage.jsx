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
      medications: '',
      labReports: user?.healthRecord?.labReports || [],
      previousPrescriptions: user?.healthRecord?.previousPrescriptions || []
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

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const uploadData = new FormData();
    uploadData.append('file', file);
    
    setLoading(true);
    try {
      const res = await axios.post((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || "http://localhost:5000")) + \'/api/upload\', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const filePath = res.data.filePath;
      
      setFormData(prev => ({
        ...prev,
        healthRecord: {
          ...prev.healthRecord,
          [field]: [...(prev.healthRecord[field] || []), filePath]
        }
      }));
      setMessage('File uploaded successfully! ✅');
    } catch (err) {
      setMessage('Failed to upload file.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
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

      const res = await axios.put((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || "http://localhost:5000")) + \'/api/auth/profile\', payload, {
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
    <div style={{ fontFamily: "var(--font-display)", minHeight: "100vh", background: COLORS.surfaceAlt || "#f8f9fa", padding: "40px 5%" }}>
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

                <div style={{ display: "grid", gap: 20, marginBottom: 40 }}>
                  <div style={{ background: COLORS.surface, padding: 20, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Lab Test Reports (JPG, PNG, PDF)</p>
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileUpload(e, 'labReports')} style={{ marginBottom: 10 }} />
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {(formData.healthRecord.labReports || []).map((url, i) => (
                        <div key={i} style={{ padding: "8px 12px", background: COLORS.primaryLight, borderRadius: 8, fontSize: 14 }}>
                          <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: COLORS.primaryDark }}>📄 Report {i + 1}</a>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: COLORS.surface, padding: 20, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Previous Prescriptions (Images)</p>
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileUpload(e, 'previousPrescriptions')} style={{ marginBottom: 10 }} />
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {(formData.healthRecord.previousPrescriptions || []).map((url, i) => (
                        <img key={i} src={url} alt={`Prescription ${i+1}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
                      ))}
                    </div>
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
