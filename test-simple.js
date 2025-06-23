const request = require('supertest');
const app = require('./app');

// Simple test without database
async function testBasicApp() {
  try {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    console.log('✅ Health check endpoint works');
    console.log('Response:', response.body);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testBasicApp(); 