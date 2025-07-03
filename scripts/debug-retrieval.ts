import { createClient } from "@supabase/supabase-js"
import { Database } from "../supabase/types"

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function debugRetrieval() {
  console.log("🔍 Debugging File Retrieval System...")
  
  // 1. Check file_items table
  const { data: fileItems, error: fileItemsError } = await supabase
    .from("file_items")
    .select("*")
    .limit(5)
    
  if (fileItemsError) {
    console.error("❌ Error querying file_items:", fileItemsError)
    return
  }
  
  console.log(`✅ Found ${fileItems?.length} file items`)
  fileItems?.forEach((item, index) => {
    console.log(`\n📄 File Item ${index + 1}:`)
    console.log(`  ID: ${item.id}`)
    console.log(`  Content preview: ${item.content.substring(0, 100)}...`)
    console.log(`  Tokens: ${item.tokens}`)
    console.log(`  Has OpenAI embedding: ${item.openai_embedding ? 'Yes' : 'No'}`)
    console.log(`  Has Local embedding: ${item.local_embedding ? 'Yes' : 'No'}`)
  })
  
  // 2. Check files table
  const { data: files, error: filesError } = await supabase
    .from("files")
    .select("*")
    .limit(5)
    
  if (filesError) {
    console.error("❌ Error querying files:", filesError)
    return
  }
  
  console.log(`\n📂 Found ${files?.length} files`)
  files?.forEach((file, index) => {
    console.log(`\n📁 File ${index + 1}:`)
    console.log(`  Name: ${file.name}`)
    console.log(`  Type: ${file.type}`)
    console.log(`  Size: ${file.size} bytes`)
    console.log(`  Tokens: ${file.tokens}`)
  })
  
  // 3. Test a retrieval query
  console.log("\n🔍 Testing retrieval query...")
  try {
    const { data: results, error } = await supabase.rpc("match_file_items_openai", {
      query_embedding: Array(1536).fill(0.1) as any,
      match_count: 3,
      file_ids: files?.map(f => f.id) || []
    })
    
    if (error) {
      console.error("❌ Retrieval test failed:", error)
    } else {
      console.log(`✅ Retrieval test returned ${results?.length} results`)
      results?.forEach((result, index) => {
        console.log(`\n📝 Result ${index + 1}:`)
        console.log(`  Content: ${result.content.substring(0, 150)}...`)
        console.log(`  Similarity: ${result.similarity}`)
        console.log(`  Tokens: ${result.tokens}`)
      })
    }
  } catch (e) {
    console.error("❌ Retrieval test error:", e)
  }
}

debugRetrieval().catch(console.error)
