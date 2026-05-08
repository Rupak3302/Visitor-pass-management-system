const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Import all your models
const User = require('./models/userModels');
const Visitor = require('./models/visitorModels');
const Appointment = require('./models/appointmentModels');
const Pass = require('./models/passModels');
const CheckLog = require('./models/checkLogsModels');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected for Seeding...'))
  .catch((err) => console.log(err));

const seedDatabase = async () => {
  try {
    // 1. Wipe the database clean
    await User.deleteMany();
    await Visitor.deleteMany();
    await Appointment.deleteMany();
    await Pass.deleteMany();
    await CheckLog.deleteMany();
    console.log('🗑️  Old Data Cleared!');

    // 2. Hash a standard password for all test users ('123456')
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // 3. Create the 3 Required Roles
    const users = await User.insertMany([
      { name: 'Admin User', email: 'admin@test.com', password: hashedPassword, role: 'admin' },
      { name: 'Security Guard', email: 'security@test.com', password: hashedPassword, role: 'security' },
      { name: 'Host User', email: 'host@test.com', password: hashedPassword, role: 'host' }
    ]);
    console.log('👥 Users Created! (Password for all: 123456)');

    // 4. Create a Sample Visitor
    const visitor = await Visitor.create({
      name: 'Demo Visitor',
      email: 'demovisitor@example.com',
      phone: '9998887777',
      company: 'Tech Corp'
    });
    console.log('👤 Sample Visitor Created!');

    // 5. Create a Sample Appointment (Already Approved)
    const appointment = await Appointment.create({
      visitorId: visitor._id,
      hostId: users[2]._id, // Assign to the Host User
      date: new Date(),
      time: '10:00 AM',
      purpose: 'System Demo',
      status: 'approved'
    });
    console.log('📅 Sample Appointment Created!');

    // 6. Create the Pass for the appointment
    const pass = await Pass.create({
      appointmentId: appointment._id,
      qrCodeData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', // Tiny placeholder image
      validUntil: new Date(new Date().setHours(23, 59, 59, 999)),
      status: 'active'
    });
    console.log('🎟️  Sample Pass Generated!');

    // Create the checklogs (CheckIn/Out)
    const checkInDate = new Date();
    checkInDate.setHours(checkInDate.getHours() - 2); // in 2 hours ago

    const checkOutDate = new Date();
    checkOutDate.setHours(checkOutDate.getHours() - 1); // out 1 hours ago

    await CheckLog.create({
        passId: pass._id,
        scannedBy: users[1]._id, // Assign to the Security Guard
        checkInTime: checkInDate,
        checkOutTime: checkOutDate
    });
    console.log('📋 Sample CheckLog Created (Checked In & Out)!')

    console.log('✅ DATABASE SEEDING COMPLETE!');
    process.exit();
  } catch (error) {
    console.error('❌ Seeder Error:', error);
    process.exit(1);
  }
};

// Run the function
seedDatabase();