#!/usr/bin/env bash

# Test script to validate the retrieval system improvements

echo "🔍 Testing Improved Retrieval System..."
echo "====================================="

# Test 1: Basic functionality
echo "1️⃣ Testing basic retrieval functionality..."
curl -s -X POST http://localhost:3000/api/retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "What is the single biggest impact this bill will have on the U.S. economy?",
    "fileIds": [],
    "embeddingsProvider": "openai", 
    "sourceCount": 5
  }' | jq -r '.results[]?.content' | head -n 3

echo ""

# Test 2: Check for similarity scores
echo "2️⃣ Testing similarity scoring..."
curl -s -X POST http://localhost:3000/api/retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "economic impact financial implications",
    "fileIds": [],
    "embeddingsProvider": "openai",
    "sourceCount": 3
  }' | jq '.results[]?.similarity // "No similarity score"'

echo ""

# Test 3: Test with lower relevance query
echo "3️⃣ Testing low-relevance query filtering..."
curl -s -X POST http://localhost:3000/api/retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "zebra unicorn rainbow",
    "fileIds": [],
    "embeddingsProvider": "openai",
    "sourceCount": 3
  }' | jq '.warning // "No warning"'

echo ""
echo "✅ Test completed! Check the output above for improvements."
