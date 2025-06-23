const mongoose = require('mongoose');
const Category = require('../../models/Category');
const User = require('../../models/User');
const Task = require('../../models/Task');

describe('Category Model Unit Tests', () => {
  let user;

  beforeEach(async () => {
    // Create test user for category references
    user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });
    await user.save();
  });

  describe('Category Model Validation', () => {
    test('should create a valid category with required fields', async () => {
      const categoryData = {
        name: 'Work',
        description: 'Work related tasks',
        createdBy: user._id
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory._id).toBeDefined();
      expect(savedCategory.name).toBe(categoryData.name);
      expect(savedCategory.description).toBe(categoryData.description);
      expect(savedCategory.createdBy).toEqual(categoryData.createdBy);
      expect(savedCategory.color).toBe('#3498db'); // default value
      expect(savedCategory.icon).toBe('folder'); // default value
      expect(savedCategory.isActive).toBe(true); // default value
    });

    test('should fail validation without required fields', async () => {
      const category = new Category({});
      let error;

      try {
        await category.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.name).toBeDefined();
      expect(error.errors.createdBy).toBeDefined();
    });

    test('should fail validation with invalid name length', async () => {
      const longName = 'a'.repeat(51);
      const categoryData = {
        name: longName,
        createdBy: user._id
      };

      const category = new Category(categoryData);
      let error;

      try {
        await category.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.name).toBeDefined();
    });

    test('should fail validation with invalid description length', async () => {
      const longDescription = 'a'.repeat(201);
      const categoryData = {
        name: 'Test Category',
        description: longDescription,
        createdBy: user._id
      };

      const category = new Category(categoryData);
      let error;

      try {
        await category.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.description).toBeDefined();
    });

    test('should enforce unique name constraint', async () => {
      const categoryData = {
        name: 'Unique Category',
        createdBy: user._id
      };

      await new Category(categoryData).save();

      const duplicateCategory = new Category(categoryData);
      let error;

      try {
        await duplicateCategory.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    });

    test('should validate hex color format', async () => {
      const categoryData = {
        name: 'Test Category',
        createdBy: user._id,
        color: 'invalid-color'
      };

      const category = new Category(categoryData);
      let error;

      try {
        await category.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.color).toBeDefined();
    });

    test('should accept valid hex color formats', async () => {
      const validColors = ['#FF5733', '#f57', '#123456', '#abc'];

      for (const color of validColors) {
        const categoryData = {
          name: `Test Category ${color}`,
          createdBy: user._id,
          color: color
        };

        const category = new Category(categoryData);
        const savedCategory = await category.save();

        expect(savedCategory.color).toBe(color);
      }
    });
  });

  describe('Category Model Defaults', () => {
    test('should set default values correctly', async () => {
      const categoryData = {
        name: 'Test Category',
        createdBy: user._id
      };

      const category = new Category(categoryData);
      await category.save();

      expect(category.color).toBe('#3498db');
      expect(category.icon).toBe('folder');
      expect(category.isActive).toBe(true);
    });

    test('should allow custom values to override defaults', async () => {
      const categoryData = {
        name: 'Custom Category',
        createdBy: user._id,
        color: '#FF0000',
        icon: 'star',
        isActive: false
      };

      const category = new Category(categoryData);
      await category.save();

      expect(category.color).toBe('#FF0000');
      expect(category.icon).toBe('star');
      expect(category.isActive).toBe(false);
    });
  });

  describe('Category Model Virtuals', () => {
    test('should calculate taskCount virtual correctly', async () => {
      const category = new Category({
        name: 'Test Category',
        createdBy: user._id
      });
      await category.save();

      // Create tasks in this category
      const task1 = new Task({
        title: 'Task 1',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date()
      });
      await task1.save();

      const task2 = new Task({
        title: 'Task 2',
        assignedTo: user._id,
        category: category._id,
        dueDate: new Date()
      });
      await task2.save();

      // Populate the virtual field
      const populatedCategory = await Category.findById(category._id)
        .populate('taskCount');

      expect(populatedCategory.taskCount).toBe(2);
    });

    test('should return zero taskCount for category with no tasks', async () => {
      const category = new Category({
        name: 'Empty Category',
        createdBy: user._id
      });
      await category.save();

      const populatedCategory = await Category.findById(category._id)
        .populate('taskCount');

      expect(populatedCategory.taskCount).toBe(0);
    });
  });

  describe('Category Model Field Trimming', () => {
    test('should trim whitespace from name', async () => {
      const categoryData = {
        name: '  Work Tasks  ',
        createdBy: user._id
      };

      const category = new Category(categoryData);
      await category.save();

      expect(category.name).toBe('Work Tasks');
    });

    test('should trim whitespace from description', async () => {
      const categoryData = {
        name: 'Test Category',
        description: '  This is a description  ',
        createdBy: user._id
      };

      const category = new Category(categoryData);
      await category.save();

      expect(category.description).toBe('This is a description');
    });

    test('should trim whitespace from color', async () => {
      const categoryData = {
        name: 'Test Category',
        color: '  #FF5733  ',
        createdBy: user._id
      };

      const category = new Category(categoryData);
      await category.save();

      expect(category.color).toBe('#FF5733');
    });

    test('should trim whitespace from icon', async () => {
      const categoryData = {
        name: 'Test Category',
        icon: '  star  ',
        createdBy: user._id
      };

      const category = new Category(categoryData);
      await category.save();

      expect(category.icon).toBe('star');
    });
  });

  describe('Category Model Edge Cases', () => {
    test('should handle empty description', async () => {
      const categoryData = {
        name: 'Test Category',
        description: '',
        createdBy: user._id
      };

      const category = new Category(categoryData);
      await category.save();

      expect(category.description).toBe('');
    });

    test('should handle undefined optional fields', async () => {
      const categoryData = {
        name: 'Minimal Category',
        createdBy: user._id
      };

      const category = new Category(categoryData);
      await category.save();

      expect(category.description).toBeUndefined();
    });
  });
}); 