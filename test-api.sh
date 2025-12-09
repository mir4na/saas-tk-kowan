#!/bin/bash

API_URL="https://1z2ivt0s87.execute-api.us-east-1.amazonaws.com/api"

echo "=========================================="
echo "Testing NOTTU API Endpoints"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s "${API_URL}/health" | jq '.' || echo "Failed"
echo ""
echo ""

# Test 2: Register
echo "2. Testing Register..."
curl -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "Password123!"
  }' | jq '.' || echo "Failed"
echo ""
echo ""

# Test 3: Register with missing fields
echo "3. Testing Register (missing fields)..."
curl -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }' | jq '.' || echo "Failed"
echo ""
echo ""

# Test 4: Login
echo "4. Testing Login..."
curl -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Password123!"
  }' | jq '.' || echo "Failed"
echo ""
echo ""

echo "=========================================="
echo "Test Complete"
echo "=========================================="
