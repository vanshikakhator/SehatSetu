const express = require('express');
const router = express.Router();
const MedicineOrder = require('../models/MedicineOrder');

// @route   POST /api/medicine-orders
// @desc    Create new medicine order(s)
router.post('/', async (req, res) => {
  try {
    const orders = req.body; // Expecting an array of order objects grouped by pharmacy
    const createdOrders = await MedicineOrder.insertMany(orders);
    res.status(201).json(createdOrders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/medicine-orders/pharmacy/:pharmacyId
// @desc    Get orders for a pharmacy
router.get('/pharmacy/:pharmacyId', async (req, res) => {
  try {
    const orders = await MedicineOrder.find({ pharmacyId: req.params.pharmacyId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/medicine-orders/patient/:patientId
// @desc    Get orders for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const orders = await MedicineOrder.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/medicine-orders/:id/advance
// @desc    Set advance amount (by pharmacy)
router.put('/:id/advance', async (req, res) => {
  const { advanceAmount } = req.body;
  try {
    const order = await MedicineOrder.findByIdAndUpdate(
      req.params.id,
      { advanceAmount, status: 'advance_pending' },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/medicine-orders/:id/status
// @desc    Update order status
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const order = await MedicineOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/medicine-orders/:id/pay
// @desc    Simulate payment for an order advance
router.post('/:id/pay', async (req, res) => {
  try {
    const order = await MedicineOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'advance_paid', razorpayOrderId: 'simulated_' + Date.now() },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
