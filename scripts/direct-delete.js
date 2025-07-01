#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Direct remote connection
const supabaseUrl = 'https://sphkxfwbqamtelejepwo.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwaGt4ZndicWFtdGVsZWplcHdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTE2NjA0OSwiZXhwIjoyMDY2NzQyMDQ5fQ.vnxbGpnBwOahaCV5KXMuksp91pLVBkPzqeQLLsyPZLA'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// IDs of empty files to delete
const emptyFileIds = [
  '35f124d8-f27b-43a3-8851-002dc0bf0db6', // dune_manual_text.txt (0 tokens)
  'a6ac5bfa-ccef-44f6-a7e3-787edbd2c006', // dune_manual_text.txt (0 tokens)
  'e5648740-7a28-4c56-a3c8-a4d81f45b7b9', // dune_manual_text.txt (0 tokens)
  'a80cffad-5b25-454c-af14-e4b4a9b5bc1d', // broken 3 (0 tokens)
  '48091cad-1f06-4668-8650-1012729949c6', // broken file 2 (0 tokens)
  '84c01f09-676b-41e6-8464-87bd91b9a2a6', // broken file (0 tokens)
  '79a9e563-d590-4737-9d07-9c4ae0305fa0'  // broken manual (0 tokens)
]

async function deleteEmptyFiles() {
  console.log('🗑️  Deleting empty files directly...')
  
  for (const fileId of emptyFileIds) {
    console.log(`\nDeleting file ID: ${fileId}`)
    
    try {
      // Delete file record from database
      const { error: fileError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)
      
      if (fileError) {
        console.log(`  ❌ Failed: ${fileError.message}`)
      } else {
        console.log(`  ✅ Successfully deleted`)
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
    }
  }
  
  console.log('\n🎉 Direct deletion completed!')
}

deleteEmptyFiles()
