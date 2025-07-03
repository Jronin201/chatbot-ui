#!/usr/bin/env bash

# Test script for TTRPG-optimized retrieval system

echo "🎲 Testing TTRPG-Optimized Retrieval System"
echo "=========================================="

# Test queries that are common for TTRPG AI assistants

echo "1️⃣ Testing Character Creation Query..."
curl -s -X POST http://localhost:3000/api/retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "How do I create a noble character?",
    "fileIds": [],
    "embeddingsProvider": "openai",
    "sourceCount": 3
  }' | jq -r '.results[]?.content[0:150]' | head -n 3

echo ""
echo "2️⃣ Testing Combat Mechanics Query..."
curl -s -X POST http://localhost:3000/api/retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "How does combat work in Dune?",
    "fileIds": [],
    "embeddingsProvider": "openai",
    "sourceCount": 3
  }' | jq -r '.results[]?.content[0:150]' | head -n 3

echo ""
echo "3️⃣ Testing Lore/Worldbuilding Query..."
curl -s -X POST http://localhost:3000/api/retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "What are the Great Houses of the Imperium?",
    "fileIds": [],
    "embeddingsProvider": "openai",
    "sourceCount": 3
  }' | jq -r '.results[]?.content[0:150]' | head -n 3

echo ""
echo "4️⃣ Testing Spice/Setting Query..."
curl -s -X POST http://localhost:3000/api/retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "How does spice work in the game?",
    "fileIds": [],
    "embeddingsProvider": "openai",
    "sourceCount": 3
  }' | jq -r '.results[]?.content[0:150]' | head -n 3

echo ""
echo "5️⃣ Testing Bene Gesserit Query..."
curl -s -X POST http://localhost:3000/api/retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "What abilities do Bene Gesserit have?",
    "fileIds": [],
    "embeddingsProvider": "openai",
    "sourceCount": 3
  }' | jq -r '.results[]?.content[0:150]' | head -n 3

echo ""
echo "6️⃣ Testing Skills/Mechanics Query..."
curl -s -X POST http://localhost:3000/api/retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "How do skill tests work?",
    "fileIds": [],
    "embeddingsProvider": "openai",
    "sourceCount": 3
  }' | jq -r '.results[]?.content[0:150]' | head -n 3

echo ""
echo "7️⃣ Testing GM Guidance Query..."
curl -s -X POST http://localhost:3000/api/retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "How should I run a Dune campaign?",
    "fileIds": [],
    "embeddingsProvider": "openai",
    "sourceCount": 3
  }' | jq -r '.results[]?.content[0:150]' | head -n 3

echo ""
echo "8️⃣ Testing Equipment Query..."
curl -s -X POST http://localhost:3000/api/retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "What weapons are available in Dune?",
    "fileIds": [],
    "embeddingsProvider": "openai",
    "sourceCount": 3
  }' | jq -r '.results[]?.content[0:150]' | head -n 3

echo ""
echo "🎯 Testing Similarity Scores..."
curl -s -X POST http://localhost:3000/api/retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "How do I create a Mentat character?",
    "fileIds": [],
    "embeddingsProvider": "openai",
    "sourceCount": 3
  }' | jq '.results[]? | {similarity: .similarity, preview: .content[0:100]}'

echo ""
echo "✅ TTRPG Retrieval Test Complete!"
echo ""
echo "📋 Expected Improvements:"
echo "- Character creation queries should return [CHARACTER CREATION] chunks"
echo "- Combat queries should return [COMBAT MECHANICS] chunks"
echo "- Lore queries should return [LORE & WORLDBUILDING] chunks"
echo "- Rules queries should return [RULES & MECHANICS] chunks"
echo "- Similarity scores should be > 0.7 for relevant content"
