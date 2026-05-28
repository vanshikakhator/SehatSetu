const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many OTP requests from this IP, please try again later' }
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Send OTP
// @route   POST /api/auth/send-otp
// @access  Public
router.post('/send-otp', otpLimiter, async (req, res) => {
  const { mode, role, phone, medicalRegistrationNumber, workerId, ...otherData } = req.body;
  
  try {
    let user;
    const identifier = role === 'doctor' ? medicalRegistrationNumber : (role === 'worker' ? workerId : phone);
    
    if (mode === 'login' || mode === 'signin') {
      const query = {};
      if (role === 'doctor') {
        query.medicalRegistrationNumber = identifier;
        query.phone = phone;
      } else if (role === 'worker') {
        query.workerId = identifier;
        query.phone = phone;
      } else {
        query.phone = identifier;
      }
      
      user = await User.findOne(query);
      if (!user || !user.otpVerified) {
        return res.status(404).json({ message: 'User not found or not verified' });
      }
    } else if (mode === 'signup') {
      let existingUser = await User.findOne({ phone });
      
      // If doctor, also check MRN
      if (role === 'doctor' && medicalRegistrationNumber) {
        const docExists = await User.findOne({ medicalRegistrationNumber });
        if (docExists && docExists.otpVerified) return res.status(400).json({ message: 'Medical Registration Number already exists' });
        if (docExists && !existingUser) existingUser = docExists;
      }
      
      // If worker, also check Worker ID
      if (role === 'worker' && workerId) {
        const workerExists = await User.findOne({ workerId });
        if (workerExists && workerExists.otpVerified) return res.status(400).json({ message: 'Worker ID already exists' });
        if (workerExists && !existingUser) existingUser = workerExists;
      }

      if (existingUser && existingUser.otpVerified) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      if (!existingUser) {
        user = new User({
          phone,
          role,
          medicalRegistrationNumber,
          workerId,
          ...otherData,
          otpVerified: false
        });
      } else {
        user = existingUser;
        Object.assign(user, { role, phone, medicalRegistrationNumber, workerId, ...otherData, otpVerified: false });
      }
    } else {
      return res.status(400).json({ message: 'Invalid mode' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save(); // Save without validation errors for optional fields if any

    console.log(`\n\n=== MOCK SMS ===\nTo: ${user.phone || identifier}\nOTP: ${otp}\n================\n\n`);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Verify OTP and authenticate
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', async (req, res) => {
  const { role, phone, medicalRegistrationNumber, workerId, otp, password } = req.body;
  
  try {
    const identifier = role === 'doctor' ? medicalRegistrationNumber : (role === 'worker' ? workerId : phone);
    
    const query = {};
    if (role === 'doctor') {
      query.medicalRegistrationNumber = identifier;
      query.phone = phone;
    } else if (role === 'worker') {
      query.workerId = identifier;
      query.phone = phone;
    } else {
      query.phone = identifier;
    }

    const user = await User.findOne(query).select('+otp +otpExpires +password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.otp || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (role === 'doctor' && password) {
       if (!(await user.matchPassword(password))) {
          return res.status(401).json({ message: 'Invalid password' });
       }
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpVerified = true;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', async (req, res) => {
  const { name, phone, specialization, consultationFee, location, communityName, healthRecord, userId: bodyUserId } = req.body;
  const userId = req.headers['user-id'] || bodyUserId;

  try {
    const user = await User.findById(userId);

    if (user) {
      user.name = name !== undefined ? name : user.name;
      user.phone = phone !== undefined ? phone : user.phone;
      user.communityName = communityName !== undefined ? communityName : user.communityName;
      user.location = location !== undefined ? location : user.location;
      user.healthRecord = healthRecord !== undefined ? healthRecord : user.healthRecord;

      if (user.role === 'doctor') {
        user.specialization = specialization !== undefined ? specialization : user.specialization;
        user.consultationFee = consultationFee !== undefined ? consultationFee : user.consultationFee;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        specialization: updatedUser.specialization,
        consultationFee: updatedUser.consultationFee,
        communityName: updatedUser.communityName,
        location: updatedUser.location,
        healthRecord: updatedUser.healthRecord
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
    
    const normalizeMed = (name) => {
      return name.toLowerCase()
        .replace(/\b(tab|tablet|cap|capsule|syr|syrup|inj|injection)\b\.?/g, '')
        .replace(/[\.\,\-\+]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const medNames = medsQuery.split(',').map(m => normalizeMed(m)).filter(Boolean);
    
    // Find pharmacies that have AT LEAST one of these medicines
    const pharmacies = await User.find({ role: 'pharmacy' }).select('name location communityName inventory');
    
    const results = [];
    
    for (const p of pharmacies) {
      if (!p.inventory || p.inventory.length === 0) continue;
      
      const matchedMeds = p.inventory.filter(inv => {
        if (!inv.name) return false;
        const invNameNorm = normalizeMed(inv.name);
        return inv.stock > 0 && medNames.some(med => invNameNorm.includes(med));
      });
      
      if (matchedMeds.length > 0) {
        results.push({
          _id: p._id,
          name: p.name,
          communityName: p.communityName,
          location: p.location || null,   // ← actual location the pharmacy entered at signup
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
