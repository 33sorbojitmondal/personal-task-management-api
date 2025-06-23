const mongoose = require('mongoose');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('User Model Unit Tests', () => {
  
  describe('User Model Validation', () => {
    test('should create a valid user with required fields', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      
      const user = new User(userData);
      const savedUser = await user.save();
      
      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe('user'); // default value
      expect(savedUser.isActive).toBe(true); // default value
    });

    test('should fail validation without required fields', async () => {
      const user = new User({});
      let error;
      
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.name).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    test('should fail validation with invalid email format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };
      
      const user = new User(userData);
      let error;
      
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.email).toBeDefined();
    });

    test('should fail validation with short password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      };
      
      const user = new User(userData);
      let error;
      
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.password).toBeDefined();
    });

    test('should enforce unique email constraint', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      
      await new User(userData).save();
      
      const duplicateUser = new User(userData);
      let error;
      
      try {
        await duplicateUser.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    });

    test('should validate role enum values', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'invalid-role'
      };
      
      const user = new User(userData);
      let error;
      
      try {
        await user.save();
      } catch (err) {
        error = err;
      }
      
      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
      expect(error.errors.role).toBeDefined();
    });
  });

  describe('User Model Methods', () => {
    let user;
    
    beforeEach(async () => {
      user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      await user.save();
    });

    test('should hash password before saving', async () => {
      const savedUser = await User.findById(user._id).select('+password');
      expect(savedUser.password).not.toBe('password123');
      expect(savedUser.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt hash pattern
    });

    test('comparePassword method should work correctly', async () => {
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);
      
      const isNotMatch = await user.comparePassword('wrongpassword');
      expect(isNotMatch).toBe(false);
    });

    test('should not rehash password if not modified', async () => {
      const originalPassword = user.password;
      user.name = 'Jane Doe';
      await user.save();
      
      const updatedUser = await User.findById(user._id).select('+password');
      expect(updatedUser.password).toBe(originalPassword);
    });

    test('updateLastLogin method should update lastLogin field', async () => {
      const beforeUpdate = user.lastLogin;
      await user.updateLastLogin();
      
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.lastLogin).toBeDefined();
      expect(updatedUser.lastLogin).not.toBe(beforeUpdate);
    });
  });

  describe('User Model Virtuals', () => {
    test('should return profile virtual correctly', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        bio: 'Software Developer',
        skills: ['JavaScript', 'Node.js'],
        department: 'Engineering'
      };
      
      const user = new User(userData);
      await user.save();
      
      const profile = user.profile;
      expect(profile.id).toBeDefined();
      expect(profile.name).toBe(userData.name);
      expect(profile.email).toBe(userData.email);
      expect(profile.bio).toBe(userData.bio);
      expect(profile.skills).toEqual(userData.skills);
      expect(profile.department).toBe(userData.department);
      expect(profile.password).toBeUndefined(); // Should not include password
    });
  });

  describe('User Model Defaults', () => {
    test('should set default values correctly', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };
      
      const user = new User(userData);
      await user.save();
      
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
      expect(user.preferences.theme).toBe('light');
      expect(user.preferences.notifications.email).toBe(true);
      expect(user.preferences.notifications.push).toBe(true);
      expect(user.preferences.timezone).toBe('UTC');
    });
  });
}); 