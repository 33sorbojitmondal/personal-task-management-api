const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

// Setup function to run before all tests
const setupDB = async () => {
  try {
    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Start in-memory MongoDB instance
    mongod = await MongoMemoryServer.create({
      instance: {
        port: 27018, // Use a different port for testing
        dbName: 'test-task-management'
      }
    });
    const uri = mongod.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false,
      bufferMaxEntries: 0,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('Test database connected successfully');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

// Cleanup function to run after all tests
const teardownDB = async () => {
  try {
    // Clear all collections first
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
      
      // Close database connection
      await mongoose.connection.close();
    }
    
    // Stop the in-memory MongoDB instance
    if (mongod) {
      await mongod.stop();
    }
    
    console.log('Test database disconnected successfully');
  } catch (error) {
    console.error('Error tearing down test database:', error);
  }
};

// Clear database between tests
const clearDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    }
  } catch (error) {
    console.error('Error clearing test database:', error);
  }
};

// Setup test environment variables
const setupTestEnv = () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-very-long-secret-key';
  process.env.MONGODB_URI = 'memory'; // Will be overridden by in-memory DB
  process.env.PORT = '3001'; // Different port for testing
  process.env.BCRYPT_ROUNDS = '1'; // Faster hashing for tests
};

module.exports = {
  setupDB,
  teardownDB,
  clearDB,
  setupTestEnv
}; 