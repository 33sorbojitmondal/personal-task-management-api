# 📋 cURL Commands Documentation

This directory contains the cURL commands captured during Chrome Extension testing.

## 📁 File Organization

### `github-api-calls.txt`
Contains all API calls captured while testing GitHub:
- Search API interactions
- Repository browsing calls
- User profile API requests
- File content loading calls

### `jsonplaceholder-api-calls.txt` 
Contains all API calls captured while testing JSONPlaceholder:
- Posts API requests
- Users API interactions  
- Comments API calls
- Albums and photos requests

## 📝 Format

Each file should contain:
```bash
# API Call Description
curl -X GET "https://api.example.com/endpoint" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer token"

# Response Status: 200
# Response Time: 150ms
```

## 🎯 Usage

These cURL commands can be used to:
1. Manually test the captured API endpoints
2. Understand the API interaction patterns
3. Compare with AI-generated tests
4. Create additional test scenarios

## 📊 Statistics

After completing your testing, update these metrics:
- **Total GitHub API calls**: [Your count]
- **Total JSONPlaceholder API calls**: [Your count]
- **Unique endpoints discovered**: [Your count]
- **Average response time**: [Your measurement] 