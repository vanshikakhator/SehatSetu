export const COLORS = {
  primary: "#00f0ff",
  primaryLight: "rgba(0, 240, 255, 0.1)",
  primaryDark: "#00a3cc",
  accent: "#ff00ff",
  accentLight: "rgba(255, 0, 255, 0.1)",
  danger: "#ff3366",
  dangerLight: "rgba(255, 51, 102, 0.1)",
  info: "#3b82f6",
  infoLight: "rgba(59, 130, 246, 0.1)",
  surface: "#050914",
  surfaceAlt: "#0a0f1c",
  border: "rgba(0, 240, 255, 0.2)",
  text: "#ffffff",
  textMuted: "#94a3b8",
};

export const mockDoctors = [
  { id: 1, name: "Dr. Priya Sharma", specialty: "General Physician", lang: "Hindi, Bengali", fee: 200, available: true, rating: 4.8, exp: "12 yrs", img: "PS" },
  { id: 2, name: "Dr. Arjun Nair", specialty: "Pediatrician", lang: "Malayalam, Tamil", fee: 250, available: true, rating: 4.9, exp: "15 yrs", img: "AN" },
  { id: 3, name: "Dr. Fatima Khan", specialty: "Gynecologist", lang: "Urdu, Hindi", fee: 300, available: false, rating: 4.7, exp: "10 yrs", img: "FK" },
  { id: 4, name: "Dr. Ramu Verma", specialty: "Cardiologist", lang: "Hindi, Bhojpuri", fee: 350, available: true, rating: 4.6, exp: "20 yrs", img: "RV" },
];

export const mockMedicines = [
  { name: "Paracetamol 500mg", qty: 45, pharmacy: "Sharma Medical", dist: "0.8 km", lat: 22.57, lng: 88.37 },
  { name: "Amoxicillin 250mg", qty: 12, pharmacy: "Rai Pharmacy", dist: "1.2 km", lat: 22.58, lng: 88.36 },
  { name: "Metformin 500mg", qty: 30, pharmacy: "Jan Aushadhi", dist: "2.1 km", lat: 22.56, lng: 88.38 },
];

export const mockAppointments = [
  { id: 1, patient: "Ramesh Das", age: 45, gender: "M", disease: "Fever, Cough", time: "10:00 AM", date: "Today", status: "upcoming", phone: "+91 98765 43210" },
  { id: 2, patient: "Sunita Devi", age: 32, gender: "F", disease: "Diabetes follow-up", time: "11:30 AM", date: "Today", status: "upcoming", phone: "+91 87654 32109" },
  { id: 3, patient: "Bikash Roy", age: 67, gender: "M", disease: "Hypertension", time: "02:00 PM", date: "Yesterday", status: "completed", phone: "+91 76543 21098" },
];

export const mockInventory = [
  { name: "Paracetamol 500mg", stock: 45, threshold: 20, price: 2.5, status: "ok" },
  { name: "Amoxicillin 250mg", stock: 8, threshold: 15, price: 12, status: "low" },
  { name: "Metformin 500mg", stock: 30, threshold: 10, price: 5, status: "ok" },
  { name: "Aspirin 75mg", stock: 0, threshold: 20, price: 1.5, status: "out" },
  { name: "Omeprazole 20mg", stock: 25, threshold: 15, price: 8, status: "ok" },
];

export const mockVillagePatients = [
  { name: "Lalita Rani", age: 58, village: "Barasat", condition: "Diabetes", lastVisit: "3 days ago", status: "stable" },
  { name: "Hasan Sheikh", age: 72, village: "Deganga", condition: "Hypertension", lastVisit: "1 week ago", status: "needs-followup" },
  { name: "Puja Ghosh", age: 28, village: "Barrackpore", condition: "Pregnancy", lastVisit: "Today", status: "urgent" },
];

export const languages = ["English", "বাংলা (Bengali)", "हिन्दी (Hindi)", "தமிழ் (Tamil)", "తెలుగు (Telugu)", "मराठी (Marathi)"];
