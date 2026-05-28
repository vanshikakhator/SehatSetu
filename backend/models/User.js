const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number or email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'pharmacy', 'worker'],
    default: 'patient',
  },
  specialization: {
    type: String,
  },
  consultationFee: {
    type: Number,
  },
  location: {
    type: String,
    default: null
  },
  communityName: String,
  inventory: [{
    name: String,
    stock: Number,
    price: Number,
    threshold: Number,
    status: String
  }],
  healthRecord: {
    bloodGroup: String,
    age: Number,
    weight: Number,
    conditions: String,
    allergies: String,
    pastSurgeries: String,
    medications: String
  },
  isVerified: { type: Boolean, default: false },
  hospitalName: String,
  medicalRegistrationNumber: String,
  degree: String,
  ownerName: String,
  drugLicenseNumber: String,
  organisationName: String,
  workerId: String,
  area: String,
  roleType: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
