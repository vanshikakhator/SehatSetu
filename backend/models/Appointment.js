const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: String,
  doctorName: String,
  date: String,
  time: String,
  disease: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'calling', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  callType: {
    type: String,
    enum: ['video', 'voice', 'none'],
    default: 'none'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  razorpayOrderId: String,
  prescription: {
    type: String,
    default: ""
  },
  prescriptionImage: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
