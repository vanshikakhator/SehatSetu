const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Razorpay = require('razorpay');

// Mock Razorpay instance
const razorpay = new Razorpay({
  key_id: 'rzp_test_your_id', // Should be in .env
  key_secret: 'your_secret'
});

// @route   POST /api/appointments/book
// @desc    Create a new appointment and mock order
router.post('/book', async (req, res) => {
  const { patientId, doctorId, patientName, doctorName, fee, disease, date, time } = req.body;

  try {
    const existingAppointment = await Appointment.findOne({ doctorId, date, time, status: { $in: ['confirmed', 'pending', 'active', 'calling'] } });
    if (existingAppointment) {
      return res.status(400).json({ message: "He is seeing another patient at that time pls change the timing" });
    }

    const orderId = `mock_order_${Date.now()}`;

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      patientName,
      doctorName,
      disease,
      date,
      time,
      razorpayOrderId: orderId,
      status: 'pending',
      paymentStatus: 'pending'
    });

    res.json({ appointment, order: { id: orderId } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/appointments/verify
// @desc    Verify payment and confirm appointment
router.post('/verify', async (req, res) => {
  const { appointmentId, razorpayPaymentId } = req.body;

  try {
    const appointment = await Appointment.findByIdAndUpdate(appointmentId, {
      paymentStatus: 'paid',
      status: 'confirmed'
    }, { new: true });

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/appointments/user/:userId
// @desc    Get all appointments for a specific user (patient or doctor)
router.get('/user/:userId', async (req, res) => {
  try {
    const appointments = await Appointment.find({
      $or: [{ patientId: req.params.userId }, { doctorId: req.params.userId }]
    }).sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/appointments/:id/prescription
// @desc    Update prescription for an appointment
router.put('/:id/prescription', async (req, res) => {
  const { prescription } = req.body;
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, {
      prescription,
      status: 'completed'
    }, { new: true });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/appointments/:id/status
// @desc    Update status (and optionally callType) of an appointment
router.put('/:id/status', async (req, res) => {
  const { status, callType } = req.body;
  try {
    const updateData = { status };
    if (callType) updateData.callType = callType;
    
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
