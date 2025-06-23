const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const User = require('../../models/User');
const Task = require('../../models/Task');
const Category = require('../../models/Category');

describe('Analytics API Tests', () => {
  let testUser, authToken, testCategory;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      name: 'Test User',
      email: 'test@analytics.com',
      password: 'password123'
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'fallback-secret');

    // Create test category
    testCategory = new Category({
      name: 'Analytics Test Category',
      createdBy: testUser._id
    });
    await testCategory.save();

    // Create various test tasks with different statuses and dates
    const tasksData = [
      {
        title: 'Completed Task 1',
        description: 'Test completed task',
        status: 'completed',
        priority: 'high',
        category: testCategory._id,
        createdBy: testUser._id,
        completedAt: new Date(),
        createdAt: new Date('2024-01-15')
      },
      {
        title: 'Completed Task 2',
        description: 'Another completed task',
        status: 'completed',
        priority: 'medium',
        category: testCategory._id,
        createdBy: testUser._id,
        completedAt: new Date(),
        createdAt: new Date('2024-01-16')
      },
      {
        title: 'In Progress Task',
        description: 'Task in progress',
        status: 'in-progress',
        priority: 'high',
        category: testCategory._id,
        createdBy: testUser._id,
        createdAt: new Date('2024-01-17')
      },
      {
        title: 'Pending Task',
        description: 'Pending task',
        status: 'pending',
        priority: 'low',
        category: testCategory._id,
        createdBy: testUser._id,
        createdAt: new Date('2024-01-18')
      },
      {
        title: 'Overdue Task',
        description: 'Overdue task',
        status: 'pending',
        priority: 'high',
        category: testCategory._id,
        createdBy: testUser._id,
        dueDate: new Date('2024-01-10'), // Past date
        createdAt: new Date('2024-01-05')
      }
    ];

    await Task.create(tasksData);
  });

  describe('GET /api/v1/analytics/overview', () => {
    test('should get analytics overview successfully', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalTasks).toBe(5);
      expect(response.body.data.completedTasks).toBe(2);
      expect(response.body.data.pendingTasks).toBe(2);
      expect(response.body.data.inProgressTasks).toBe(1);
      expect(response.body.data.overdueTasks).toBe(1);
      expect(response.body.data.completionRate).toBeCloseTo(40); // 2/5 * 100
    });

    test('should calculate completion rate correctly', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const { totalTasks, completedTasks, completionRate } = response.body.data;
      const expectedRate = (completedTasks / totalTasks) * 100;
      expect(completionRate).toBeCloseTo(expectedRate);
    });

    test('should handle user with no tasks', async () => {
      // Create a new user with no tasks
      const newUser = new User({
        name: 'Empty User',
        email: 'empty@test.com',
        password: 'password123'
      });
      await newUser.save();

      const emptyUserToken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET || 'fallback-secret');

      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${emptyUserToken}`)
        .expect(200);

      expect(response.body.data.totalTasks).toBe(0);
      expect(response.body.data.completedTasks).toBe(0);
      expect(response.body.data.pendingTasks).toBe(0);
      expect(response.body.data.inProgressTasks).toBe(0);
      expect(response.body.data.overdueTasks).toBe(0);
      expect(response.body.data.completionRate).toBe(0);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/analytics/status-distribution', () => {
    test('should get status distribution successfully', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/status-distribution')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      // Check if all statuses are represented
      const statusCounts = {};
      response.body.data.forEach(item => {
        statusCounts[item._id] = item.count;
      });

      expect(statusCounts.completed).toBe(2);
      expect(statusCounts.pending).toBe(2);
      expect(statusCounts['in-progress']).toBe(1);
    });

    test('should return proper data structure', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/status-distribution')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.forEach(item => {
        expect(item).toHaveProperty('_id');
        expect(item).toHaveProperty('count');
        expect(typeof item.count).toBe('number');
        expect(['completed', 'pending', 'in-progress']).toContain(item._id);
      });
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/status-distribution')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Analytics API Performance Tests', () => {
    test('should handle large dataset efficiently', async () => {
      // Create many tasks for performance testing
      const largeBatch = [];
      for (let i = 0; i < 100; i++) {
        largeBatch.push({
          title: `Performance Test Task ${i}`,
          description: `Task ${i} for performance testing`,
          status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'in-progress' : 'pending',
          priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
          category: testCategory._id,
          createdBy: testUser._id,
          createdAt: new Date()
        });
      }
      await Task.create(largeBatch);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const endTime = Date.now();

      // Response should be fast (under 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalTasks).toBe(105); // 5 original + 100 new
    });

    test('should handle concurrent requests', async () => {
      const requests = Array(10).fill().map(() =>
        request(app)
          .get('/api/v1/analytics/overview')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
}); 