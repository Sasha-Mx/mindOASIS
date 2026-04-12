const axios = require('axios');

async function testSignup() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      firstName: 'Test',
      lastName: 'User',
      email: `test${Date.now()}@example.com`,
      phone: '1234567890',
      password: 'password123'
    });
    console.log('Signup Success:', res.status, res.data);
  } catch (err) {
    console.error('Signup Failed:', err.response?.status, err.response?.data || err.message);
  }
}

testSignup();
