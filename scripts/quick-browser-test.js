/**
 * Quick browser test for embeddings - paste this into browser console
 * Run this on your chatbot UI page to test embeddings
 */

async function quickEmbeddingsTest() {
  console.log("🔍 Quick Embeddings Test Starting...")
  
  try {
    // Test 1: Basic retrieval endpoint
    console.log("1️⃣ Testing retrieval endpoint...")
    const response = await fetch("/api/retrieval/retrieve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userInput: "test query",
        fileIds: [],
        embeddingsProvider: "openai",
        sourceCount: 1
      })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log("✅ Retrieval endpoint: Working")
      console.log("📊 Results:", result)
    } else {
      console.log("❌ Retrieval endpoint error:", result.message)
    }
    
    // Test 2: Process endpoint (if you have documents)
    console.log("2️⃣ Testing process endpoint...")
    const processResponse = await fetch("/api/retrieval/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "What is test content?",
        fileId: null
      })
    })
    
    const processResult = await processResponse.json()
    
    if (processResponse.ok) {
      console.log("✅ Process endpoint: Working")
      console.log("📊 Matches found:", processResult.matches?.length || 0)
    } else {
      console.log("❌ Process endpoint error:", processResult.message)
    }
    
  } catch (error) {
    console.error("💥 Test failed:", error.message)
  }
}

// Run the test
quickEmbeddingsTest()
