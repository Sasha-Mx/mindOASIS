require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testDB() {
  try {
    console.log('Connecting to:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');
    
    const count = await User.countDocuments();
    console.log('User count:', count);
    
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

testDB();
