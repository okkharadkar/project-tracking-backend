require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email: 'admin@projecttrack.com' });
    if (adminExists) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const admin = await Admin.create({
      name: 'Admin User',
      email: 'admin@projecttrack.com',
      password: 'admin123456',
      role: 'admin',
      isAdmin: true
    });

    console.log('Admin created successfully:', {
      name: admin.name,
      email: admin.email
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin(); 