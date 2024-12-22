const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminUser) {
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('Admin user created:', admin);
    } else {
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('Existing user updated to admin');
    }
    
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin(); 