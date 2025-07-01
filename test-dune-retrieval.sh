#!/usr/bin/env bash

# Simple test to check if Dune manual data exists in the database
# This will help verify the vectorization worked

echo "🔍 Testing Dune Manual Vectorization..."
echo "=================================="

# Test the retrieval API directly
curl -X POST http://localhost:3000/api/retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "How does spice work in the Dune RPG?",
    "fileIds": [],
    "embeddingsProvider": "openai",
    "sourceCount": 3
  }' | jq '.results[] | {content: .content[0:100], similarity: .similarity}'

echo ""
echo "✅ If you see results above, the Dune manual is vectorized correctly!"
echo "❌ If no results, the manual may not be uploaded or vectorized yet."
