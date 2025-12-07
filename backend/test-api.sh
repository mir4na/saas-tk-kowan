#!/bin/bash

echo "=== Testing Notepad SaaS API ==="
echo

# Register new user
echo "1. Testing Register..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"demo123","name":"Demo User"}')
echo "$RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$RESPONSE" | jq -r '.data.token')
echo "Token: $TOKEN"
echo

# Create first note
echo "2. Creating first note..."
curl -s -X POST http://localhost:5000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"My First Note","content":"This is my first note content!"}' | jq '.'
echo

# Create second note
echo "3. Creating second note..."
curl -s -X POST http://localhost:5000/api/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Shopping List","content":"- Milk\n- Bread\n- Eggs"}' | jq '.'
echo

# Get all notes
echo "4. Getting all notes..."
curl -s http://localhost:5000/api/notes \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo

# Update note
echo "5. Updating first note..."
curl -s -X PUT http://localhost:5000/api/notes/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Updated Note","content":"This content has been updated!"}' | jq '.'
echo

echo "=== API Test Complete ==="
