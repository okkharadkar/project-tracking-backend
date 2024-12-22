const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function createFirstAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminUser = await Admin.create({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: 'admin123',
      isAdmin: true
    });

    console.log('Admin user created:', adminUser);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createFirstAdmin(); 