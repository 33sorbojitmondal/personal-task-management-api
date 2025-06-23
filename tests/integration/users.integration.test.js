const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const app = require('../../app'); // Import the app directly

describe('Users Integration Tests', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create a test user for authentication
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'fallback-secret');
  });

  describe('POST /api/v1/users/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        department: 'Engineering'
      };

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.token).toBeDefined();

      // Verify user was saved to database
      const savedUser = await User.findOne({ email: userData.email });
      expect(savedUser).toBeTruthy();
      expect(savedUser.name).toBe(userData.name);
    });

    test('should fail to register user with existing email', async () => {
      const userData = {
        name: 'Another User',
        email: testUser.email, // Use existing email
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('User already exists');
    });

    test('should fail validation with invalid data', async () => {
      const invalidData = {
        name: '', // Empty name
        email: 'invalid-email', // Invalid email
        password: '123' // Short password
      };

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/users/register')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/users/login', () => {
    test('should login successfully with valid credentials', async () => {
      const loginData = {
        email: testUser.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.token).toBeDefined();

      // Verify lastLogin was updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLogin).toBeDefined();
    });

    test('should fail login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should fail login with invalid password', async () => {
      const loginData = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should fail login with validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/v1/users', () => {
    beforeEach(async () => {
      // Create additional test users
      await User.create([
        {
          name: 'User 1',
          email: 'user1@example.com',
          password: 'password123',
          role: 'admin',
          department: 'Engineering'
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          password: 'password123',
          role: 'user',
          department: 'Marketing'
        }
      ]);
    });

    test('should get all users with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalUsers).toBeGreaterThan(0);
    });

    test('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/v1/users?role=admin')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.users.forEach(user => {
        expect(user.role).toBe('admin');
      });
    });

    test('should filter users by department', async () => {
      const response = await request(app)
        .get('/api/v1/users?department=Engineering')
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.users.forEach(user => {
        expect(user.department).toBe('Engineering');
      });
    });

    test('should search users by name', async () => {
      const response = await request(app)
        .get('/api/v1/users?search=User 1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });

    test('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/v1/users?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    test('should get user by valid ID', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUser._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testUser._id.toString());
      expect(response.body.data.name).toBe(testUser.name);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.password).toBeUndefined();
    });

    test('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/users/${nonExistentId}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/v1/users/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('Invalid user ID format');
    });
  });

  describe('Database Integration', () => {
    test('should properly hash passwords on user creation', async () => {
      const userData = {
        name: 'Password Test User',
        email: 'password@example.com',
        password: 'plainpassword123'
      };

      await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(201);

      const savedUser = await User.findOne({ email: userData.email }).select('+password');
      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash pattern
    });

    test('should enforce unique email constraint at database level', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      // Create first user directly in database
      await User.create(userData);

      // Try to register user with same email via API
      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('User already exists');
    });

    test('should properly update lastLogin on successful login', async () => {
      const originalLastLogin = testUser.lastLogin;

      await request(app)
        .post('/api/v1/users/login')
        .send({
          email: testUser.email,
          password: 'password123'
        })
        .expect(200);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLogin).toBeDefined();
      expect(updatedUser.lastLogin).not.toEqual(originalLastLogin);
    });
  });
}); 