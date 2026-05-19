const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
  const { name, phone, password, role, lang, specialization, consultationFee, location, communityName } = req.body;

  try {
    const userExists = await User.findOne({ phone });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      phone,
      password,
      role,
      language: lang || 'English',
      specialization,
      consultationFee,
      location,
      communityName
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await User.findOne({ phone }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid phone or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', async (req, res) => {
  const { name, phone, specialization, consultationFee } = req.body;
  const userId = req.headers['user-id']; // For simplicity, in real app use JWT decode

  try {
    const user = await User.findById(userId);

    if (user) {
      user.name = name || user.name;
      user.phone = phone || user.phone;
      if (user.role === 'doctor') {
        user.specialization = specialization || user.specialization;
        user.consultationFee = consultationFee || user.consultationFee;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        specialization: updatedUser.specialization,
        consultationFee: updatedUser.consultationFee,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/profile/:userId
// @desc    Get a user's profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/auth/doctors
// @desc    Get all doctors
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/auth/inventory/:userId
// @desc    Get pharmacy inventory
router.get('/inventory/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Pharmacy not found' });
    res.json(user.inventory || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/auth/inventory/:userId
// @desc    Update pharmacy inventory
router.put('/inventory/:userId', async (req, res) => {
  try {
    const { inventory } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Pharmacy not found' });
    
    user.inventory = inventory;
    await user.save();
    res.json(user.inventory);
  } catch (err) {
    console.error("INVENTORY PUT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/auth/pharmacies/search
// @desc    Search pharmacies by meds string (comma separated)
router.get('/pharmacies/search', async (req, res) => {
  try {
    const medsQuery = req.query.meds;
    if (!medsQuery) return res.json([]);
    
    const medNames = medsQuery.split(',').map(m => m.trim().toLowerCase());
    
    // Find pharmacies that have AT LEAST one of these medicines
    const pharmacies = await User.find({ role: 'pharmacy' }).select('name location communityName inventory');
    
    const results = [];
    
    for (const p of pharmacies) {
      if (!p.inventory || p.inventory.length === 0) continue;
      
      const matchedMeds = p.inventory.filter(inv => {
        return inv.stock > 0 && medNames.some(med => inv.name.toLowerCase().includes(med));
      });
      
      if (matchedMeds.length > 0) {
        results.push({
          _id: p._id,
          name: p.name,
          communityName: p.communityName,
          matchedMeds: matchedMeds
        });
      }
    }
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
