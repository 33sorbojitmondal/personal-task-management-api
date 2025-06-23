const { setupDB, teardownDB, clearDB, setupTestEnv } = require('./setup');

// Setup test environment variables first
setupTestEnv();

// Global test setup - runs once before all tests
beforeAll(async () => {
  await setupDB();
}, 60000); // Increase timeout for database setup

// Clean up after each test
afterEach(async () => {
  await clearDB();
}, 30000); // Increase timeout for cleanup

// Global test teardown - runs once after all tests
afterAll(async () => {
  await teardownDB();
}, 60000); // Increase timeout for teardown

// Increase timeout for all tests
jest.setTimeout(60000); 