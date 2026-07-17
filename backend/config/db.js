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
    console.log('Admin user seeded successfully');
  } catch (err) {
    console.log('Admin seed skipped:', err.message);
  }
};

const connectDB = async (retries = 5) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      await seedAdmin();
      return;
    } catch (error) {
      console.error(`MongoDB Connection Attempt ${i}/${retries} failed: ${error.message}`);
      if (i === retries) {
        console.error('All MongoDB connection attempts failed');
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  }
};

module.exports = connectDB;
