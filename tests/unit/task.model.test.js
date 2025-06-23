const mongoose = require('mongoose');
const Task = require('../../models/Task');
const User = require('../../models/User');
const Category = require('../../models/Category');

describe('Task Model Unit Tests', () => {
  let user, category;

  beforeEach(async () => {
    // Create test user and category for task references
    user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });
    await user.save();

    category = new Category({
      name: 'Work',
      description: 'Work related tasks',
      color: '#FF5733'
    });
    await category.save();
  });

  describe('Task Model Validation', () => {
    test('should create a valid task with required fields', async () => {
      const taskData = {
        title: 'Complete project',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      };

      const task = new Task(taskData);
      const savedTask = await task.save();

      expect(savedTask._id).toBeDefined();
      expect(savedTask.title).toBe(taskData.title);
      expect(savedTask.assignedTo).toEqual(taskData.assignedTo);
      expect(savedTask.category).toEqual(taskData.category);
      expect(savedTask.priority).toBe('medium'); // default value
      expect(savedTask.status).toBe('pending'); // default value
    });

    test('should fail validation without required fields', async () => {
      const task = new Task({});
      let error;

      try {
        await task.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.title).toBeDefined();
      expect(error.errors.assignedTo).toBeDefined();
      expect(error.errors.category).toBeDefined();
      expect(error.errors.dueDate).toBeDefined();
    });

    test('should validate title length constraints', async () => {
      const longTitle = 'a'.repeat(101);
      const taskData = {
        title: longTitle,
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date()
      };

      const task = new Task(taskData);
      let error;

      try {
        await task.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.title).toBeDefined();
    });

    test('should validate priority enum values', async () => {
      const taskData = {
        title: 'Test task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date(),
        priority: 'invalid-priority'
      };

      const task = new Task(taskData);
      let error;

      try {
        await task.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.priority).toBeDefined();
    });

    test('should validate status enum values', async () => {
      const taskData = {
        title: 'Test task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date(),
        status: 'invalid-status'
      };

      const task = new Task(taskData);
      let error;

      try {
        await task.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.status).toBeDefined();
    });

    test('should validate estimated hours constraints', async () => {
      const taskData = {
        title: 'Test task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date(),
        estimatedHours: 50 // exceeds max
      };

      const task = new Task(taskData);
      let error;

      try {
        await task.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.estimatedHours).toBeDefined();
    });
  });

  describe('Task Model Virtuals', () => {
    test('should calculate isOverdue virtual correctly', async () => {
      // Task due in the past (overdue)
      const overdueTask = new Task({
        title: 'Overdue task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        status: 'pending'
      });
      await overdueTask.save();

      expect(overdueTask.isOverdue).toBe(true);

      // Task due in the future (not overdue)
      const futureTask = new Task({
        title: 'Future task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        status: 'pending'
      });
      await futureTask.save();

      expect(futureTask.isOverdue).toBe(false);

      // Completed task (not overdue even if past due date)
      const completedTask = new Task({
        title: 'Completed task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        status: 'completed'
      });
      await completedTask.save();

      expect(completedTask.isOverdue).toBe(false);
    });

    test('should calculate progressPercentage virtual correctly', async () => {
      const pendingTask = new Task({
        title: 'Pending task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date(),
        status: 'pending'
      });
      await pendingTask.save();
      expect(pendingTask.progressPercentage).toBe(0);

      const inProgressTask = new Task({
        title: 'In progress task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date(),
        status: 'in-progress'
      });
      await inProgressTask.save();
      expect(inProgressTask.progressPercentage).toBe(50);

      const completedTask = new Task({
        title: 'Completed task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date(),
        status: 'completed'
      });
      await completedTask.save();
      expect(completedTask.progressPercentage).toBe(100);
    });
  });

  describe('Task Model Middleware', () => {
    test('should set completedAt when status changes to completed', async () => {
      const task = new Task({
        title: 'Test task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date()
      });
      await task.save();

      expect(task.completedAt).toBeUndefined();

      // Update status to completed
      task.status = 'completed';
      await task.save();

      expect(task.completedAt).toBeDefined();
      expect(task.completedAt).toBeInstanceOf(Date);
    });

    test('should clear completedAt when status changes from completed', async () => {
      const task = new Task({
        title: 'Test task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date(),
        status: 'completed'
      });
      await task.save();

      expect(task.completedAt).toBeDefined();

      // Change status from completed
      task.status = 'in-progress';
      await task.save();

      expect(task.completedAt).toBeUndefined();
    });

    test('should not modify completedAt if already set when marking completed', async () => {
      const specificDate = new Date('2023-01-01');
      const task = new Task({
        title: 'Test task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date(),
        status: 'completed',
        completedAt: specificDate
      });
      await task.save();

      expect(task.completedAt).toEqual(specificDate);

      // Save again without changing status
      await task.save();

      expect(task.completedAt).toEqual(specificDate);
    });
  });

  describe('Task Model Defaults', () => {
    test('should set default values correctly', async () => {
      const task = new Task({
        title: 'Test task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date()
      });
      await task.save();

      expect(task.priority).toBe('medium');
      expect(task.status).toBe('pending');
      expect(task.actualHours).toBe(0);
      expect(task.isArchived).toBe(false);
    });
  });

  describe('Task Model Arrays and Objects', () => {
    test('should handle tags array correctly', async () => {
      const task = new Task({
        title: 'Test task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date(),
        tags: ['urgent', 'frontend', 'bug']
      });
      await task.save();

      expect(task.tags).toHaveLength(3);
      expect(task.tags).toContain('urgent');
      expect(task.tags).toContain('frontend');
      expect(task.tags).toContain('bug');
    });

    test('should handle attachments array correctly', async () => {
      const attachment = {
        filename: 'document.pdf',
        url: 'https://example.com/document.pdf'
      };

      const task = new Task({
        title: 'Test task',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date(),
        attachments: [attachment]
      });
      await task.save();

      expect(task.attachments).toHaveLength(1);
      expect(task.attachments[0].filename).toBe(attachment.filename);
      expect(task.attachments[0].url).toBe(attachment.url);
      expect(task.attachments[0].uploadDate).toBeDefined();
    });
  });
}); 