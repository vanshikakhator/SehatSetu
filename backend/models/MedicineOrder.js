const mongoose = require('mongoose');

const medicineOrderSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pharmacyName: {
    type: String,
    required: true
  },
  medicines: [
    {
      name: String,
      qty: Number,
      price: Number
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  advanceAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['requested', 'advance_pending', 'advance_paid', 'ready_for_pickup', 'completed', 'cancelled'],
    default: 'requested'
  },
  razorpayOrderId: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MedicineOrder', medicineOrderSchema);
