/**
 * Embeddings Verification Script
 * Run this to verify that embeddings are properly configured and accessible
 */

import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"
import type { Database } from "@/supabase/types"

// Test embeddings access and configuration
export async function verifyEmbeddingsConfiguration() {
  console.log("🔍 Starting Embeddings Configuration Verification...")
  
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const results = {
    databaseSchema: false,
    rpcFunctions: {
      match_file_items: false,
      match_file_items_openai: false,
      match_file_items_local: false
    },
    sampleData: false,
    embeddingGeneration: false
  }

  try {
    // 1. Test database schema
    console.log("1️⃣ Testing database schema...")
    const { data: schemaTest, error: schemaError } = await supabase
      .from("file_items")
      .select("id, openai_embedding, local_embedding")
      .limit(1)
    
    if (!schemaError) {
      results.databaseSchema = true
      console.log("✅ Database schema: file_items table accessible")
    } else {
      console.log("❌ Database schema error:", schemaError.message)
    }

    // 2. Test RPC functions
    console.log("2️⃣ Testing RPC functions...")
    
    // Test general match_file_items
    try {
      const { error: generalError } = await supabase.rpc("match_file_items", {
        query_embedding: Array(1536).fill(0.1),
        match_threshold: 0.1,
        match_count: 1
      })
      
      if (!generalError) {
        results.rpcFunctions.match_file_items = true
        console.log("✅ RPC Function: match_file_items working")
      } else {
        console.log("❌ RPC Function match_file_items error:", generalError.message)
      }
    } catch (e: any) {
      console.log("❌ RPC Function match_file_items error:", e.message)
    }

    // Test OpenAI specific function
    try {
      const { error: openaiError } = await supabase.rpc("match_file_items_openai", {
        query_embedding: Array(1536).fill(0.1) as any,
        match_count: 1,
        file_ids: []
      })
      
      if (!openaiError) {
        results.rpcFunctions.match_file_items_openai = true
        console.log("✅ RPC Function: match_file_items_openai working")
      } else {
        console.log("❌ RPC Function match_file_items_openai error:", openaiError.message)
      }
    } catch (e: any) {
      console.log("❌ RPC Function match_file_items_openai error:", e.message)
    }

    // Test local specific function
    try {
      const { error: localError } = await supabase.rpc("match_file_items_local", {
        query_embedding: Array(384).fill(0.1) as any,
        match_count: 1,
        file_ids: []
      })
      
      if (!localError) {
        results.rpcFunctions.match_file_items_local = true
        console.log("✅ RPC Function: match_file_items_local working")
      } else {
        console.log("❌ RPC Function match_file_items_local error:", localError.message)
      }
    } catch (e: any) {
      console.log("❌ RPC Function match_file_items_local error:", e.message)
    }

    // 3. Check for sample data
    console.log("3️⃣ Checking for sample embedding data...")
    const { data: sampleData, error: sampleError } = await supabase
      .from("file_items")
      .select("id, openai_embedding, local_embedding")
      .not("openai_embedding", "is", null)
      .limit(1)
    
    if (!sampleError && sampleData && sampleData.length > 0) {
      results.sampleData = true
      console.log("✅ Sample data: Found file_items with embeddings")
      console.log(`   - Item ID: ${sampleData[0].id}`)
      console.log(`   - Has OpenAI embedding: ${!!sampleData[0].openai_embedding}`)
      console.log(`   - Has Local embedding: ${!!sampleData[0].local_embedding}`)
    } else {
      console.log("⚠️ Sample data: No file_items with embeddings found")
    }

    // 4. Test embedding generation
    console.log("4️⃣ Testing embedding generation...")
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const response = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: "test embedding generation"
        })
        
        if (response.data && response.data[0]?.embedding) {
          results.embeddingGeneration = true
          console.log("✅ Embedding generation: OpenAI API working")
          console.log(`   - Embedding dimensions: ${response.data[0].embedding.length}`)
        }
      } catch (e: any) {
        console.log("❌ Embedding generation error:", e.message)
      }
    } else {
      console.log("⚠️ Embedding generation: OPENAI_API_KEY not found")
    }

    // 5. Summary
    console.log("\n📊 VERIFICATION SUMMARY:")
    console.log("========================")
    console.log(`Database Schema: ${results.databaseSchema ? '✅' : '❌'}`)
    console.log(`RPC match_file_items: ${results.rpcFunctions.match_file_items ? '✅' : '❌'}`)
    console.log(`RPC match_file_items_openai: ${results.rpcFunctions.match_file_items_openai ? '✅' : '❌'}`)
    console.log(`RPC match_file_items_local: ${results.rpcFunctions.match_file_items_local ? '✅' : '❌'}`)
    console.log(`Sample Data: ${results.sampleData ? '✅' : '⚠️'}`)
    console.log(`Embedding Generation: ${results.embeddingGeneration ? '✅' : '⚠️'}`)

    const allCriticalPassing = results.databaseSchema && 
                              (results.rpcFunctions.match_file_items || 
                               results.rpcFunctions.match_file_items_openai ||
                               results.rpcFunctions.match_file_items_local)

    console.log(`\n🎯 Overall Status: ${allCriticalPassing ? '✅ READY' : '❌ NEEDS ATTENTION'}`)

    return results

  } catch (error: any) {
    console.error("💥 Verification failed:", error.message)
    return results
  }
}

// Usage example:
// await verifyEmbeddingsConfiguration()
