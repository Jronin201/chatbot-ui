/**
 * Simple Embeddings Test Script
 * No CLI required - just run this to test your setup
 * Run with: npx tsx scripts/test-embeddings-simple.ts
 */

import { createClient } from "@supabase/supabase-js"

async function testEmbeddingsSetup() {
  console.log("🚀 Testing Embeddings Setup (No CLI Required)")
  console.log("=" .repeat(50))

  // You might need to set these environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.log("❌ Missing environment variables:")
    console.log("   - NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl)
    console.log("   - NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!supabaseKey)
    console.log("\n💡 Make sure your .env.local file is set up correctly")
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Test 1: Check if file_items table exists
  console.log("\n1️⃣ Testing database connection...")
  try {
    const { data, error } = await supabase
      .from("file_items")
      .select("count(*)")
      .limit(1)
    
    if (error) {
      console.log("❌ Database connection failed:", error.message)
      return
    }
    console.log("✅ Database connection successful")
  } catch (error: any) {
    console.log("❌ Database error:", error.message)
    return
  }

  // Test 2: Check existing RPC functions
  console.log("\n2️⃣ Testing existing RPC functions...")
  
  const testEmbedding = Array(1536).fill(0.001) // Small test embedding
  
  // Test match_file_items_openai (should exist)
  try {
    const { error } = await supabase.rpc("match_file_items_openai", {
      query_embedding: testEmbedding as any,
      match_count: 1,
      file_ids: []
    })
    
    if (!error) {
      console.log("✅ match_file_items_openai function exists")
    } else {
      console.log("❌ match_file_items_openai error:", error.message)
    }
  } catch (e: any) {
    console.log("❌ match_file_items_openai error:", e.message)
  }

  // Test general match_file_items (might not exist yet)
  try {
    const { error } = await supabase.rpc("match_file_items", {
      query_embedding: testEmbedding,
      match_threshold: 0.1,
      match_count: 1
    })
    
    if (!error) {
      console.log("✅ match_file_items function exists")
    } else {
      console.log("⚠️ match_file_items function missing:", error.message)
      console.log("   👉 You need to add this function via Supabase Dashboard")
    }
  } catch (e: any) {
    console.log("⚠️ match_file_items function missing:", e.message)
    console.log("   👉 You need to add this function via Supabase Dashboard")
  }

  // Test 3: Check for existing embeddings data
  console.log("\n3️⃣ Checking for existing embeddings...")
  try {
    const { data, error } = await supabase
      .from("file_items")
      .select("id, openai_embedding, local_embedding")
      .not("openai_embedding", "is", null)
      .limit(3)
    
    if (!error && data && data.length > 0) {
      console.log(`✅ Found ${data.length} file items with OpenAI embeddings`)
      data.forEach((item, index) => {
        console.log(`   ${index + 1}. ID: ${item.id}`)
        console.log(`      OpenAI: ${!!item.openai_embedding}`)
        console.log(`      Local: ${!!item.local_embedding}`)
      })
    } else {
      console.log("⚠️ No embeddings found in database")
      console.log("   👉 Try uploading a document to generate embeddings")
    }
  } catch (e: any) {
    console.log("❌ Error checking embeddings:", e.message)
  }

  // Test 4: Check workspace configuration
  console.log("\n4️⃣ Checking workspace embeddings configuration...")
  try {
    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name, embeddings_provider")
      .limit(5)
    
    if (!error && data) {
      console.log(`✅ Found ${data.length} workspaces`)
      data.forEach((ws, index) => {
        console.log(`   ${index + 1}. ${ws.name}: ${ws.embeddings_provider}`)
      })
    } else {
      console.log("❌ Error checking workspaces:", error?.message)
    }
  } catch (e: any) {
    console.log("❌ Error checking workspaces:", e.message)
  }

  console.log("\n" + "=" .repeat(50))
  console.log("🎯 NEXT STEPS:")
  console.log("1. If match_file_items is missing, add it via Supabase Dashboard")
  console.log("2. If no embeddings found, upload a document in the UI")
  console.log("3. Check workspace settings for embeddings provider")
  console.log("4. Test retrieval in chat interface")
}

// Auto-run if called directly
if (require.main === module) {
  testEmbeddingsSetup().catch(console.error)
}

export { testEmbeddingsSetup }
