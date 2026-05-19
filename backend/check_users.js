require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gramcare');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    const users = await User.find({}, '_id name phone role inventory');
    console.log("Users:", JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();
