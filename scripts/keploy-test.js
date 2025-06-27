const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:5000';
const DELAY_BETWEEN_REQUESTS = 1000; // 1 second

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPassword123!'
};

const testTask = {
  title: 'Complete Keploy Testing',
  description: 'Implement Keploy AI-powered testing for the API',
  priority: 'high',
  status: 'todo'
};

const testCategory = {
  name: 'Development',
  description: 'Tasks related to software development',
  color: '#007bff'
};

class KeployTestScenarios {
  constructor() {
    this.authToken = null;
    this.userId = null;
    this.taskId = null;
    this.categoryId = null;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${API_BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      console.log(`🔄 ${method} ${endpoint}`);
      const response = await axios(config);
      console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
      return response;
    } catch (error) {
      console.log(`❌ ${method} ${endpoint} - Error: ${error.response?.status || error.message}`);
      return error.response || { status: 500, data: { error: error.message } };
    }
  }

  async runHealthCheck() {
    console.log('\n🏥 Running Health Check...');
    await this.makeRequest('GET', '/health');
    await this.delay(DELAY_BETWEEN_REQUESTS);
  }

  async runUserScenarios() {
    console.log('\n👤 Running User Scenarios...');
    
    // 1. Register new user
    const registerResponse = await this.makeRequest('POST', '/api/v1/auth/register', testUser);
    if (registerResponse.status === 201) {
      this.authToken = registerResponse.data.token;
      this.userId = registerResponse.data.user.id;
    }
    await this.delay(DELAY_BETWEEN_REQUESTS);

    // 2. Login user
    const loginResponse = await this.makeRequest('POST', '/api/v1/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    if (loginResponse.status === 200 && loginResponse.data.token) {
      this.authToken = loginResponse.data.token;
      this.userId = loginResponse.data.user.id;
    }
    await this.delay(DELAY_BETWEEN_REQUESTS);

    // 3. Get user profile
    if (this.authToken) {
      await this.makeRequest('GET', '/api/v1/users/profile', null, {
        'Authorization': `Bearer ${this.authToken}`
      });
      await this.delay(DELAY_BETWEEN_REQUESTS);

      // 4. Update user profile
      await this.makeRequest('PUT', '/api/v1/users/profile', {
        name: 'Updated Test User',
        preferences: {
          theme: 'dark',
          notifications: true
        }
      }, {
        'Authorization': `Bearer ${this.authToken}`
      });
      await this.delay(DELAY_BETWEEN_REQUESTS);
    }

    // 5. Test invalid login
    await this.makeRequest('POST', '/api/v1/auth/login', {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });
    await this.delay(DELAY_BETWEEN_REQUESTS);
  }

  async runCategoryScenarios() {
    console.log('\n📁 Running Category Scenarios...');
    
    if (!this.authToken) return;

    // 1. Create category
    const createResponse = await this.makeRequest('POST', '/api/v1/categories', testCategory, {
      'Authorization': `Bearer ${this.authToken}`
    });
    if (createResponse.status === 201) {
      this.categoryId = createResponse.data._id;
    }
    await this.delay(DELAY_BETWEEN_REQUESTS);

    // 2. Get all categories
    await this.makeRequest('GET', '/api/v1/categories', null, {
      'Authorization': `Bearer ${this.authToken}`
    });
    await this.delay(DELAY_BETWEEN_REQUESTS);

    // 3. Get category by ID
    if (this.categoryId) {
      await this.makeRequest('GET', `/api/v1/categories/${this.categoryId}`, null, {
        'Authorization': `Bearer ${this.authToken}`
      });
      await this.delay(DELAY_BETWEEN_REQUESTS);

      // 4. Update category
      await this.makeRequest('PUT', `/api/v1/categories/${this.categoryId}`, {
        name: 'Updated Development',
        color: '#28a745'
      }, {
        'Authorization': `Bearer ${this.authToken}`
      });
      await this.delay(DELAY_BETWEEN_REQUESTS);
    }
  }

  async runTaskScenarios() {
    console.log('\n📋 Running Task Scenarios...');
    
    if (!this.authToken) return;

    // Add category to task if available
    const taskData = { ...testTask };
    if (this.categoryId) {
      taskData.category = this.categoryId;
    }

    // 1. Create task
    const createResponse = await this.makeRequest('POST', '/api/v1/tasks', taskData, {
      'Authorization': `Bearer ${this.authToken}`
    });
    if (createResponse.status === 201) {
      this.taskId = createResponse.data._id;
    }
    await this.delay(DELAY_BETWEEN_REQUESTS);

    // 2. Get all tasks
    await this.makeRequest('GET', '/api/v1/tasks', null, {
      'Authorization': `Bearer ${this.authToken}`
    });
    await this.delay(DELAY_BETWEEN_REQUESTS);

    // 3. Get tasks with filters
    await this.makeRequest('GET', '/api/v1/tasks?status=todo&priority=high&page=1&limit=10', null, {
      'Authorization': `Bearer ${this.authToken}`
    });
    await this.delay(DELAY_BETWEEN_REQUESTS);

    // 4. Get task by ID
    if (this.taskId) {
      await this.makeRequest('GET', `/api/v1/tasks/${this.taskId}`, null, {
        'Authorization': `Bearer ${this.authToken}`
      });
      await this.delay(DELAY_BETWEEN_REQUESTS);

      // 5. Update task
      await this.makeRequest('PUT', `/api/v1/tasks/${this.taskId}`, {
        title: 'Updated Task Title',
        status: 'in_progress',
        priority: 'medium'
      }, {
        'Authorization': `Bearer ${this.authToken}`
      });
      await this.delay(DELAY_BETWEEN_REQUESTS);

      // 6. Assign task to user
      await this.makeRequest('PATCH', `/api/v1/tasks/${this.taskId}/assign`, {
        assignedTo: this.userId
      }, {
        'Authorization': `Bearer ${this.authToken}`
      });
      await this.delay(DELAY_BETWEEN_REQUESTS);

      // 7. Add comment to task
      await this.makeRequest('POST', `/api/v1/tasks/${this.taskId}/comments`, {
        content: 'This is a test comment for the task'
      }, {
        'Authorization': `Bearer ${this.authToken}`
      });
      await this.delay(DELAY_BETWEEN_REQUESTS);
    }

    // 8. Search tasks
    await this.makeRequest('GET', '/api/v1/tasks/search?q=Keploy', null, {
      'Authorization': `Bearer ${this.authToken}`
    });
    await this.delay(DELAY_BETWEEN_REQUESTS);
  }

  async runAnalyticsScenarios() {
    console.log('\n📊 Running Analytics Scenarios...');
    
    if (!this.authToken) return;

    // 1. Get dashboard data
    await this.makeRequest('GET', '/api/v1/analytics/dashboard', null, {
      'Authorization': `Bearer ${this.authToken}`
    });
    await this.delay(DELAY_BETWEEN_REQUESTS);

    // 2. Get task statistics
    await this.makeRequest('GET', '/api/v1/analytics/tasks', null, {
      'Authorization': `Bearer ${this.authToken}`
    });
    await this.delay(DELAY_BETWEEN_REQUESTS);

    // 3. Get productivity metrics
    await this.makeRequest('GET', '/api/v1/analytics/productivity', null, {
      'Authorization': `Bearer ${this.authToken}`
    });
    await this.delay(DELAY_BETWEEN_REQUESTS);
  }

  async runErrorScenarios() {
    console.log('\n❌ Running Error Scenarios...');
    
    // 1. Access protected route without token
    await this.makeRequest('GET', '/api/v1/tasks');
    await this.delay(DELAY_BETWEEN_REQUESTS);

    // 2. Invalid task creation
    await this.makeRequest('POST', '/api/v1/tasks', {
      // Missing required fields
    }, {
      'Authorization': `Bearer ${this.authToken}`
    });
    await this.delay(DELAY_BETWEEN_REQUESTS);

    // 3. Non-existent resource
    await this.makeRequest('GET', '/api/v1/tasks/507f1f77bcf86cd799439999', null, {
      'Authorization': `Bearer ${this.authToken}`
    });
    await this.delay(DELAY_BETWEEN_REQUESTS);

    // 4. Invalid token
    await this.makeRequest('GET', '/api/v1/tasks', null, {
      'Authorization': 'Bearer invalid_token'
    });
    await this.delay(DELAY_BETWEEN_REQUESTS);
  }

  async runCompleteTestSuite() {
    console.log('🚀 Starting Keploy Test Scenarios Generation...\n');
    
    try {
      await this.runHealthCheck();
      await this.runUserScenarios();
      await this.runCategoryScenarios();
      await this.runTaskScenarios();
      await this.runAnalyticsScenarios();
      await this.runErrorScenarios();
      
      console.log('\n✅ All test scenarios completed successfully!');
      console.log('🎯 Keploy should have recorded all API interactions.');
      console.log('📁 Check the ./tests/keploy directory for generated test files.');
      
    } catch (error) {
      console.error('\n❌ Error running test scenarios:', error.message);
    }
  }
}

// Run the test scenarios
if (require.main === module) {
  const scenarios = new KeployTestScenarios();
  scenarios.runCompleteTestSuite();
}

module.exports = KeployTestScenarios; 