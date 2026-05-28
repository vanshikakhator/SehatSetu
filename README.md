# 🌿 SehatSetu

**SehatSetu** is a comprehensive, rural-focused digital healthcare ecosystem that bridges the gap between remote patients, doctors, local health workers (ASHA/NGO), and pharmacies. Built for low-bandwidth environments, it provides an accessible, secure, and fully integrated telemedicine platform.

---

## ✨ Key Features

### 🧑‍🦱 For Patients

* **Multilingual Interface:** Seamless localization for regional Indian languages (powered by Bhashini API).
* **Smart Doctor Discovery:** Search and book appointments based on symptoms or specialty.
* **Low-Bandwidth Telemedicine:** Seamlessly switch between High-Quality Video, Audio-only, or Offline Chat consultations depending on network strength.
* **Medicine Delivery (E-Pharmacy):** Search nearby pharmacies for prescribed medicines, view stock in real-time, and order directly.
* **Emergency SOS Alert:** A single-tap SOS button that broadcasts patient location and medical history to nearby Health Workers and Doctors.
* **Secure Health Locker:** Upload previous prescriptions (camera/gallery) and lab reports (PDF/JPG) for doctors to review securely.

### 👨‍⚕️ For Doctors

* **AI Prescription OCR:** Upload handwritten prescriptions and have them automatically digitized and structured into a neat table using Google Gemini AI.
* **Secure Patient Record Access:** Strict, consent-based access to patient health records. Requires a 6-digit OTP from the patient, rendering a highly secure, watermarked, non-downloadable viewer that automatically expires in 15 minutes.
* **Appointment Management:** Real-time queue and schedule management.
* **Digital Prescription Generation:** Instantly generate and attach digital prescriptions to patient records after consultations.

### 💊 For Pharmacies

* **Inventory Management:** Easily update and track medicine stock levels.
* **Order Fulfillment:** Receive and process incoming medicine requests from nearby patients.
* **Location Mapping:** Set geo-coordinates so patients can easily navigate to the pharmacy using integrated maps.

### 🏃 For Health Workers (ASHA/NGO)

* **Community Outreach:** Dedicated dashboard to assist multiple patients in rural sectors without personal devices.
* **Emergency Response:** Receive instant SOS broadcast notifications with live patient location to provide immediate ground support.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, Vanilla CSS
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Mongoose)
* **Real-time Communication:** Socket.io (Chat, Signaling for Video/Audio calls)
* **AI & Machine Learning:** Google Gemini API (Handwritten Prescription OCR)
* **File Uploads:** Multer (Local storage)
* **Security & Auth:** Express-Rate-Limit, bcryptjs, JSON Web Tokens (JWT), OTP-based role authentication
* **Payments:** Razorpay (Mock Integration)

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v16+)
* MongoDB (Running locally or MongoDB Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/SehatSetu.git
cd SehatSetu
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `/backend` directory based on the `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/sehatsetu
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend server:

```bash
npm start
# Server runs on http://localhost:5000
```

### 3. Setup Frontend

Open a new terminal window:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
# Server runs on http://localhost:5173
```

---

## 🔒 Security Measures Implemented

* **Consent-Based Data Sharing:** Doctors must enter a patient-provided OTP to view sensitive medical records.
* **Anti-Data Theft:** Medical records viewed by doctors have right-click and text-selection disabled, along with a dynamic watermark of the doctor's name and timestamp to prevent unauthorized screenshots.
* **Expiring Sessions:** Health record access is forcefully revoked exactly 15 minutes after OTP verification.
* **Strict Role Validation:** Doctor and Pharmacy sign-ups cross-validate Medical Registration Numbers (MRN) and Drug Licenses against internal security lists.

---

## 📱 Progressive Web App (PWA)

SehatSetu is designed as a PWA, meaning it can be installed directly onto mobile devices from the browser, offering a native app-like experience and offline capabilities crucial for rural accessibility.

---

*Built with ❤️ for better rural healthcare accessibility.*
