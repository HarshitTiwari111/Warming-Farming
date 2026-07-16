const mongoose = require('mongoose');

const seedAdmin = async () => {
  try {
    const User = require('../models/User');
    const existing = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
    if (existing) return;
    await User.create({
      name: 'Admin',
      email: 'admin@warmfarm.com',
      password: 'Admin@1234',
      role: 'admin'
    });
    console.log('Admin seeded: admin@warmfarm.com / Admin@1234');
  } catch (err) {
    console.log('Admin seed skipped:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedAdmin();
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
