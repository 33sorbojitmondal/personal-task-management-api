const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const User = require('../../models/User');
const Category = require('../../models/Category');
const Task = require('../../models/Task');

describe('Tasks API Tests', () => {
  let testUser, testCategory, authToken;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();

    // Create test category
    testCategory = new Category({
      name: 'Test Category',
      description: 'Test category for API tests',
      createdBy: testUser._id
    });
    await testCategory.save();

    // Generate auth token
    authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'fallback-secret');
  });

  describe('POST /api/v1/tasks', () => {
    test('should create a new task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        category: testCategory._id,
        assignedTo: testUser._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        priority: 'high',
        estimatedHours: 5
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task created successfully');
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.description).toBe(taskData.description);
      expect(response.body.data.priority).toBe(taskData.priority);
      expect(response.body.data.status).toBe('pending'); // default value

      // Verify task was saved to database
      const savedTask = await Task.findOne({ title: taskData.title });
      expect(savedTask).toBeTruthy();
      expect(savedTask.estimatedHours).toBe(taskData.estimatedHours);
    });

    test('should fail without authentication', async () => {
      const taskData = {
        title: 'Test Task',
        category: testCategory._id,
        assignedTo: testUser._id,
        dueDate: new Date()
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .send(taskData)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    test('should fail validation with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should fail with invalid priority value', async () => {
      const taskData = {
        title: 'Test Task',
        category: testCategory._id,
        assignedTo: testUser._id,
        dueDate: new Date(),
        priority: 'invalid-priority'
      };

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/v1/tasks', () => {
    beforeEach(async () => {
      // Create test tasks
      await Task.create([
        {
          title: 'Task 1',
          category: testCategory._id,
          assignedTo: testUser._id,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          priority: 'high',
          status: 'pending'
        },
        {
          title: 'Task 2',
          category: testCategory._id,
          assignedTo: testUser._id,
          dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
          priority: 'medium',
          status: 'in-progress'
        },
        {
          title: 'Task 3',
          category: testCategory._id,
          assignedTo: testUser._id,
          dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000),
          priority: 'low',
          status: 'completed'
        }
      ]);
    });

    test('should get all tasks with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toBeDefined();
      expect(Array.isArray(response.body.data.tasks)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.totalTasks).toBe(3);
    });

    test('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.tasks.forEach(task => {
        expect(task.status).toBe('completed');
      });
    });

    test('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?priority=high')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.tasks.forEach(task => {
        expect(task.priority).toBe('high');
      });
    });

    test('should search tasks by title', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?search=Task 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks.length).toBe(1);
      expect(response.body.data.tasks[0].title).toBe('Task 1');
    });

    test('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks.length).toBe(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
      testTask = new Task({
        title: 'Single Task Test',
        category: testCategory._id,
        assignedTo: testUser._id,
        dueDate: new Date(),
        description: 'Test task for single retrieval'
      });
      await testTask.save();
    });

    test('should get task by valid ID', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testTask._id.toString());
      expect(response.body.data.title).toBe(testTask.title);
      expect(response.body.data.description).toBe(testTask.description);
    });

    test('should return 404 for non-existent task', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toBe('Invalid task ID format');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${testTask._id}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
      testTask = new Task({
        title: 'Task to Update',
        category: testCategory._id,
        assignedTo: testUser._id,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        priority: 'medium',
        status: 'pending'
      });
      await testTask.save();
    });

    test('should update task successfully', async () => {
      const updateData = {
        title: 'Updated Task Title',
        priority: 'high',
        status: 'in-progress',
        actualHours: 3
      };

      const response = await request(app)
        .put(`/api/v1/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task updated successfully');
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.priority).toBe(updateData.priority);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.actualHours).toBe(updateData.actualHours);

      // Verify update in database
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask.title).toBe(updateData.title);
      expect(updatedTask.priority).toBe(updateData.priority);
    });

    test('should set completedAt when status changes to completed', async () => {
      const updateData = {
        status: 'completed'
      };

      const response = await request(app)
        .put(`/api/v1/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.completedAt).toBeDefined();

      // Verify in database
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask.completedAt).toBeDefined();
    });

    test('should fail with invalid data', async () => {
      const invalidData = {
        priority: 'invalid-priority',
        estimatedHours: -5
      };

      const response = await request(app)
        .put(`/api/v1/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should return 404 for non-existent task', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/v1/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' })
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/tasks/${testTask._id}`)
        .send({ title: 'Updated Title' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
      testTask = new Task({
        title: 'Task to Delete',
        category: testCategory._id,
        assignedTo: testUser._id,
        dueDate: new Date()
      });
      await testTask.save();
    });

    test('should delete task successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Task deleted successfully');

      // Verify deletion in database
      const deletedTask = await Task.findById(testTask._id);
      expect(deletedTask).toBeNull();
    });

    test('should return 404 for non-existent task', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${testTask._id}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Task API Performance Tests', () => {
    test('should handle bulk task creation efficiently', async () => {
      const startTime = Date.now();
      
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        title: `Bulk Task ${i + 1}`,
        category: testCategory._id,
        assignedTo: testUser._id,
        dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000)
      }));

      for (const taskData of tasks) {
        await request(app)
          .post('/api/v1/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(201);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (5 seconds for 10 tasks)
      expect(duration).toBeLessThan(5000);

      // Verify all tasks were created
      const createdTasks = await Task.find({ title: /^Bulk Task/ });
      expect(createdTasks).toHaveLength(10);
    });

    test('should handle large result sets with pagination', async () => {
      // Create many tasks
      const bulkTasks = Array.from({ length: 50 }, (_, i) => ({
        title: `Performance Task ${i + 1}`,
        category: testCategory._id,
        assignedTo: testUser._id,
        dueDate: new Date(Date.now() + (i + 1) * 60 * 60 * 1000)
      }));

      await Task.insertMany(bulkTasks);

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/v1/tasks?limit=20')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should respond quickly even with large dataset
      expect(duration).toBeLessThan(1000);
      expect(response.body.data.tasks).toHaveLength(20);
      expect(response.body.data.pagination.totalTasks).toBeGreaterThanOrEqual(50);
    });
  });
}); 