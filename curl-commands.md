# 🔧 API Testing with cURL Commands

This document contains comprehensive cURL commands to test all endpoints of the Personal Task Management API.

## 🏃 Quick Setup

1. **Start the API server**:
   ```bash
   npm run dev
   ```

2. **Set environment variables** (replace with actual values):
   ```bash
   export API_BASE_URL="http://localhost:5000"
   export JWT_TOKEN="your-jwt-token-here"
   export USER_ID="user-id-here"
   export TASK_ID="task-id-here"
   export CATEGORY_ID="category-id-here"
   ```

## 📊 General Endpoints

### Health Check
```bash
curl -X GET "${API_BASE_URL}/health" \
  -H "Content-Type: application/json"
```

### Welcome Message
```bash
curl -X GET "${API_BASE_URL}/" \
  -H "Content-Type: application/json"
```

### API Documentation
```bash
curl -X GET "${API_BASE_URL}/api/docs" \
  -H "Content-Type: application/json"
```

## 👥 User Endpoints

### 1. Register New User
```bash
curl -X POST "${API_BASE_URL}/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "securePassword123",
    "role": "user",
    "department": "Engineering",
    "phoneNumber": "+1234567890"
  }'
```

### 2. User Login
```bash
curl -X POST "${API_BASE_URL}/api/v1/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securePassword123"
  }'
```

### 3. Get All Users (with pagination and filtering)
```bash
curl -X GET "${API_BASE_URL}/api/v1/users?page=1&limit=10&role=user&isActive=true&search=john" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### 4. Get User by ID
```bash
curl -X GET "${API_BASE_URL}/api/v1/users/${USER_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### 5. Update User
```bash
curl -X PUT "${API_BASE_URL}/api/v1/users/${USER_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d '{
    "name": "John Smith",
    "department": "DevOps",
    "phoneNumber": "+1234567891"
  }'
```

### 6. Delete User (Soft Delete)
```bash
curl -X DELETE "${API_BASE_URL}/api/v1/users/${USER_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### 7. Get User Profile
```bash
curl -X GET "${API_BASE_URL}/api/v1/users/${USER_ID}/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

## 📋 Task Endpoints

### 1. Get All Tasks (with comprehensive filtering)
```bash
# Basic get all tasks
curl -X GET "${API_BASE_URL}/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# With filtering and pagination
curl -X GET "${API_BASE_URL}/api/v1/tasks?page=1&limit=10&status=pending&priority=high&search=api&sortBy=dueDate&sortOrder=asc" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# Filter by category and assigned user
curl -X GET "${API_BASE_URL}/api/v1/tasks?category=${CATEGORY_ID}&assignedTo=${USER_ID}&overdue=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### 2. Create New Task
```bash
curl -X POST "${API_BASE_URL}/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d '{
    "title": "Complete API Documentation",
    "description": "Write comprehensive API documentation with examples and testing guides",
    "priority": "high",
    "status": "pending",
    "dueDate": "2024-01-15T09:00:00.000Z",
    "estimatedHours": 4,
    "category": "'${CATEGORY_ID}'",
    "assignedTo": "'${USER_ID}'",
    "tags": ["documentation", "api", "testing"]
  }'
```

### 3. Get Task by ID
```bash
curl -X GET "${API_BASE_URL}/api/v1/tasks/${TASK_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### 4. Update Task
```bash
curl -X PUT "${API_BASE_URL}/api/v1/tasks/${TASK_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d '{
    "title": "Complete API Documentation - Updated",
    "description": "Write comprehensive API documentation with examples, testing guides, and deployment instructions",
    "priority": "high",
    "status": "in-progress",
    "dueDate": "2024-01-20T09:00:00.000Z",
    "estimatedHours": 6,
    "tags": ["documentation", "api", "testing", "deployment"]
  }'
```

### 5. Update Task Status Only
```bash
curl -X PATCH "${API_BASE_URL}/api/v1/tasks/${TASK_ID}/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d '{
    "status": "completed"
  }'
```

### 6. Delete Task
```bash
curl -X DELETE "${API_BASE_URL}/api/v1/tasks/${TASK_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

## 🏷️ Category Endpoints

### 1. Get All Categories
```bash
# Basic get all categories
curl -X GET "${API_BASE_URL}/api/v1/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# With filtering and pagination
curl -X GET "${API_BASE_URL}/api/v1/categories?page=1&limit=10&search=work&isActive=true" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### 2. Create New Category
```bash
curl -X POST "${API_BASE_URL}/api/v1/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d '{
    "name": "Work",
    "description": "Work-related tasks and projects",
    "color": "#3498db",
    "icon": "briefcase",
    "createdBy": "'${USER_ID}'"
  }'
```

### 3. Get Category by ID
```bash
curl -X GET "${API_BASE_URL}/api/v1/categories/${CATEGORY_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### 4. Update Category
```bash
curl -X PUT "${API_BASE_URL}/api/v1/categories/${CATEGORY_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d '{
    "name": "Work Projects",
    "description": "Professional work-related tasks and long-term projects",
    "color": "#2980b9",
    "icon": "building"
  }'
```

### 5. Delete Category
```bash
curl -X DELETE "${API_BASE_URL}/api/v1/categories/${CATEGORY_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### 6. Toggle Category Status
```bash
curl -X PATCH "${API_BASE_URL}/api/v1/categories/${CATEGORY_ID}/toggle" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### 7. Get Tasks in Category
```bash
curl -X GET "${API_BASE_URL}/api/v1/categories/${CATEGORY_ID}/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

## 📊 Analytics Endpoints

### 1. Get Dashboard Analytics
```bash
# Basic dashboard
curl -X GET "${API_BASE_URL}/api/v1/analytics/dashboard" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# With timeframe filter
curl -X GET "${API_BASE_URL}/api/v1/analytics/dashboard?timeframe=30d" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# User-specific analytics
curl -X GET "${API_BASE_URL}/api/v1/analytics/dashboard?userId=${USER_ID}&timeframe=7d" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### 2. Get Task Analytics
```bash
curl -X GET "${API_BASE_URL}/api/v1/analytics/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### 3. Get User Performance Analytics
```bash
curl -X GET "${API_BASE_URL}/api/v1/analytics/users/${USER_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### 4. Export Analytics Data
```bash
curl -X GET "${API_BASE_URL}/api/v1/analytics/reports/export?format=json&timeframe=30d" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

## 🧪 Complete Testing Workflow

Here's a complete testing workflow to test the entire API:

```bash
#!/bin/bash
# Complete API Testing Workflow

# Set base URL
API_BASE_URL="http://localhost:5000"

echo "🚀 Starting API Testing Workflow..."

# 1. Health Check
echo "1. Testing Health Check..."
curl -X GET "${API_BASE_URL}/health"

# 2. Register User
echo -e "\n2. Registering new user..."
REGISTER_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testPassword123",
    "role": "user"
  }')

echo $REGISTER_RESPONSE

# 3. Login User
echo -e "\n3. Logging in user..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/v1/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testPassword123"
  }')

# Extract token and user ID (requires jq)
JWT_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user._id')

echo "JWT Token: $JWT_TOKEN"
echo "User ID: $USER_ID"

# 4. Create Category
echo -e "\n4. Creating category..."
CATEGORY_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/v1/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "name": "Test Category",
    "description": "Test category for API testing",
    "color": "#3498db",
    "icon": "test",
    "createdBy": "'$USER_ID'"
  }')

CATEGORY_ID=$(echo $CATEGORY_RESPONSE | jq -r '._id')
echo "Category ID: $CATEGORY_ID"

# 5. Create Task
echo -e "\n5. Creating task..."
TASK_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/v1/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "title": "Test Task",
    "description": "Test task for API testing",
    "priority": "medium",
    "status": "pending",
    "category": "'$CATEGORY_ID'",
    "assignedTo": "'$USER_ID'"
  }')

TASK_ID=$(echo $TASK_RESPONSE | jq -r '._id')
echo "Task ID: $TASK_ID"

# 6. Update Task Status
echo -e "\n6. Updating task status..."
curl -s -X PATCH "${API_BASE_URL}/api/v1/tasks/$TASK_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"status": "completed"}'

# 7. Get Analytics
echo -e "\n7. Getting analytics..."
curl -s -X GET "${API_BASE_URL}/api/v1/analytics/dashboard" \
  -H "Authorization: Bearer $JWT_TOKEN"

echo -e "\n✅ API Testing Workflow Complete!"
```

## 💡 Tips for Testing

1. **Save responses**: Use `-o filename.json` to save responses for inspection
2. **Pretty print JSON**: Pipe responses through `| jq .` for readable JSON
3. **Check status codes**: Use `-w "%{http_code}"` to see HTTP status codes
4. **Debug mode**: Add `-v` flag for verbose output
5. **Headers**: Use `-i` to include response headers

### Example with debugging:
```bash
curl -v -X GET "${API_BASE_URL}/api/v1/tasks" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -w "\nHTTP Status: %{http_code}\n" | jq .
```

This comprehensive collection of cURL commands covers all API endpoints and provides examples for testing various scenarios! 