const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const User = require('../../models/User');
const Category = require('../../models/Category');

describe('Categories API Tests', () => {
  let testUser, authToken;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'fallback-secret');
  });

  describe('POST /api/v1/categories', () => {
    test('should create a new category successfully', async () => {
      const categoryData = {
        name: 'Work Tasks',
        description: 'Tasks related to work',
        color: '#FF5733',
        icon: 'briefcase'
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category created successfully');
      expect(response.body.data.name).toBe(categoryData.name);
      expect(response.body.data.description).toBe(categoryData.description);
      expect(response.body.data.color).toBe(categoryData.color);
      expect(response.body.data.icon).toBe(categoryData.icon);
      expect(response.body.data.createdBy).toBe(testUser._id.toString());

      // Verify category was saved to database
      const savedCategory = await Category.findOne({ name: categoryData.name });
      expect(savedCategory).toBeTruthy();
      expect(savedCategory.createdBy.toString()).toBe(testUser._id.toString());
    });

    test('should create category with default values', async () => {
      const categoryData = {
        name: 'Simple Category'
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(categoryData.name);
      expect(response.body.data.color).toBe('#3498db'); // default color
      expect(response.body.data.icon).toBe('folder'); // default icon
      expect(response.body.data.isActive).toBe(true); // default value
    });

    test('should fail to create duplicate category', async () => {
      const categoryData = {
        name: 'Unique Category'
      };

      // Create first category
      await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(409);

      expect(response.body.error).toBe('Category already exists');
    });

    test('should fail validation with invalid color format', async () => {
      const categoryData = {
        name: 'Invalid Color Category',
        color: 'invalid-color'
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should fail without authentication', async () => {
      const categoryData = {
        name: 'Test Category'
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .send(categoryData)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/categories', () => {
    beforeEach(async () => {
      // Create test categories
      await Category.create([
        {
          name: 'Work',
          description: 'Work related tasks',
          color: '#FF5733',
          createdBy: testUser._id,
          isActive: true
        },
        {
          name: 'Personal',
          description: 'Personal tasks',
          color: '#33FF57',
          createdBy: testUser._id,
          isActive: true
        },
        {
          name: 'Archived',
          description: 'Archived category',
          color: '#5733FF',
          createdBy: testUser._id,
          isActive: false
        }
      ]);
    });

    test('should get all categories with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toBeDefined();
      expect(Array.isArray(response.body.data.categories)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.totalCategories).toBeGreaterThanOrEqual(3);
    });

    test('should filter categories by active status', async () => {
      const response = await request(app)
        .get('/api/v1/categories?isActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.categories.forEach(category => {
        expect(category.isActive).toBe(true);
      });
    });

    test('should search categories by name', async () => {
      const response = await request(app)
        .get('/api/v1/categories?search=Work')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories.length).toBeGreaterThan(0);
      expect(response.body.data.categories[0].name).toMatch(/Work/i);
    });

    test('should handle pagination correctly', async () => {
      const response = await request(app)
        .get('/api/v1/categories?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/categories')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    let testCategory;

    beforeEach(async () => {
      testCategory = new Category({
        name: 'Single Category Test',
        description: 'Test category for single retrieval',
        color: '#123456',
        createdBy: testUser._id
      });
      await testCategory.save();
    });

    test('should get category by valid ID', async () => {
      const response = await request(app)
        .get(`/api/v1/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testCategory._id.toString());
      expect(response.body.data.name).toBe(testCategory.name);
      expect(response.body.data.description).toBe(testCategory.description);
      expect(response.body.data.color).toBe(testCategory.color);
    });

    test('should return 404 for non-existent category', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/categories/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Category not found');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/v1/categories/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error).toBe('Invalid category ID format');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/v1/categories/${testCategory._id}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/v1/categories/:id', () => {
    let testCategory;

    beforeEach(async () => {
      testCategory = new Category({
        name: 'Category to Update',
        description: 'Original description',
        color: '#FF0000',
        icon: 'folder',
        createdBy: testUser._id
      });
      await testCategory.save();
    });

    test('should update category successfully', async () => {
      const updateData = {
        name: 'Updated Category Name',
        description: 'Updated description',
        color: '#00FF00',
        icon: 'star'
      };

      const response = await request(app)
        .put(`/api/v1/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category updated successfully');
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.color).toBe(updateData.color);
      expect(response.body.data.icon).toBe(updateData.icon);

      // Verify update in database
      const updatedCategory = await Category.findById(testCategory._id);
      expect(updatedCategory.name).toBe(updateData.name);
      expect(updatedCategory.description).toBe(updateData.description);
    });

    test('should fail with invalid color format', async () => {
      const updateData = {
        color: 'invalid-color-format'
      };

      const response = await request(app)
        .put(`/api/v1/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should return 404 for non-existent category', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/v1/categories/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.error).toBe('Category not found');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/v1/categories/${testCategory._id}`)
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    let testCategory;

    beforeEach(async () => {
      testCategory = new Category({
        name: 'Category to Delete',
        description: 'This category will be deleted',
        createdBy: testUser._id
      });
      await testCategory.save();
    });

    test('should delete category successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category deleted successfully');

      // Verify deletion in database
      const deletedCategory = await Category.findById(testCategory._id);
      expect(deletedCategory).toBeNull();
    });

    test('should return 404 for non-existent category', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/categories/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Category not found');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/v1/categories/${testCategory._id}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Category API Edge Cases', () => {
    test('should handle very long category names', async () => {
      const longName = 'a'.repeat(50); // Max allowed length
      const categoryData = {
        name: longName
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(longName);
    });

    test('should reject category names that are too long', async () => {
      const tooLongName = 'a'.repeat(51); // Exceeds max length
      const categoryData = {
        name: tooLongName
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should handle different valid hex color formats', async () => {
      const validColors = ['#FF5733', '#f57', '#123ABC', '#abc'];

      for (let i = 0; i < validColors.length; i++) {
        const categoryData = {
          name: `Color Test ${i + 1}`,
          color: validColors[i]
        };

        const response = await request(app)
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send(categoryData)
          .expect(201);

        expect(response.body.data.color).toBe(validColors[i]);
      }
    });

    test('should trim whitespace from input fields', async () => {
      const categoryData = {
        name: '  Trimmed Category  ',
        description: '  This description has extra spaces  ',
        icon: '  star  '
      };

      const response = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.data.name).toBe('Trimmed Category');
      expect(response.body.data.description).toBe('This description has extra spaces');
      expect(response.body.data.icon).toBe('star');
    });
  });
}); 