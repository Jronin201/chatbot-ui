#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

// Remote Supabase instance
const supabaseUrl = 'https://sphkxfwbqamtelejepwo.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwaGt4ZndicWFtdGVsZWplcHdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTE2NjA0OSwiZXhwIjoyMDY2NzQyMDQ5fQ.vnxbGpnBwOahaCV5KXMuksp91pLVBkPzqeQLLsyPZLA'

console.log('🔧 Environment check:')
console.log('URL:', supabaseUrl)
console.log('Service key exists:', !!supabaseServiceKey)
console.log('Service key length:', supabaseServiceKey?.length || 0)

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanupEmptyFiles() {
  console.log('🧹 Starting cleanup of empty/zero-token files...')
  
  try {
    // Get all files with 0 tokens or very small size
    const { data: emptyFiles, error: fetchError } = await supabase
      .from('files')
      .select('id, name, file_path, size, tokens, user_id')
      .or('tokens.eq.0,size.lt.100')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Error fetching files:', fetchError.message)
      return
    }

    if (!emptyFiles || emptyFiles.length === 0) {
      console.log('✅ No empty files found to clean up')
      return
    }

    console.log(`📝 Found ${emptyFiles.length} empty/small files to delete:`)
    emptyFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name} (${file.tokens} tokens, ${file.size} bytes)`)
    })

    console.log('\n🗑️  Starting deletion process...')

    let deletedCount = 0
    for (const file of emptyFiles) {
      console.log(`\nDeleting: ${file.name} (ID: ${file.id})`)
      
      try {
        // Try storage deletion (may fail in local environment)
        if (file.file_path) {
          try {
            const { error: storageError } = await supabase.storage
              .from('files')
              .remove([file.file_path])
            
            if (storageError) {
              console.log(`  ⚠️  Storage deletion failed: ${storageError.message}`)
            } else {
              console.log(`  ✅ Storage file deleted: ${file.file_path}`)
            }
          } catch (storageErr) {
            console.log(`  ⚠️  Storage deletion error: ${storageErr.message}`)
          }
        }

        // Delete file_items
        const { error: itemsError } = await supabase
          .from('file_items')
          .delete()
          .eq('file_id', file.id)
        
        if (itemsError) {
          console.log(`  ⚠️  File items deletion warning: ${itemsError.message}`)
        } else {
          console.log(`  ✅ File items deleted`)
        }

        // Delete file_workspaces
        const { error: workspaceError } = await supabase
          .from('file_workspaces')
          .delete()
          .eq('file_id', file.id)
        
        if (workspaceError) {
          console.log(`  ⚠️  File workspaces deletion warning: ${workspaceError.message}`)
        } else {
          console.log(`  ✅ File workspace relations deleted`)
        }

        // Delete main file record
        const { error: fileError } = await supabase
          .from('files')
          .delete()
          .eq('id', file.id)
        
        if (fileError) {
          console.error(`  ❌ File deletion failed: ${fileError.message}`)
          continue
        }

        console.log(`  ✅ Main file record deleted`)
        deletedCount++

      } catch (error) {
        console.error(`  ❌ Error deleting file ${file.name}:`, error.message)
      }
    }

    console.log(`\n🎉 Cleanup completed! ${deletedCount}/${emptyFiles.length} files deleted successfully.`)

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
  }
}

async function listAllFiles() {
  console.log('📋 Listing all files in database...')
  
  try {
    const { data: files, error } = await supabase
      .from('files')
      .select('id, name, file_path, size, tokens, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching files:', error.message)
      return
    }

    if (!files || files.length === 0) {
      console.log('✅ No files found in database')
      return
    }

    console.log(`\n📁 Found ${files.length} files:`)
    files.forEach((file, index) => {
      const sizeKB = (file.size / 1024).toFixed(1)
      const date = new Date(file.created_at).toLocaleDateString()
      console.log(`${index + 1}. ${file.name}`)
      console.log(`   📊 ${file.tokens} tokens, ${sizeKB} KB, created: ${date}`)
      console.log(`   🆔 ID: ${file.id}`)
      if (file.file_path) {
        console.log(`   📂 Path: ${file.file_path}`)
      }
      console.log()
    })

  } catch (error) {
    console.error('❌ Error listing files:', error.message)
  }
}

async function deleteSpecificFile(fileId) {
  console.log(`🗑️  Deleting specific file: ${fileId}`)
  
  try {
    // Get file details first
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching file:', fetchError.message)
      return
    }

    if (!file) {
      console.error('❌ File not found')
      return
    }

    console.log(`📝 File found: ${file.name}`)

    // Same deletion process as above
    if (file.file_path) {
      try {
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove([file.file_path])
        
        if (storageError) {
          console.log(`⚠️  Storage deletion failed: ${storageError.message}`)
        } else {
          console.log(`✅ Storage file deleted`)
        }
      } catch (storageErr) {
        console.log(`⚠️  Storage deletion error: ${storageErr.message}`)
      }
    }

    // Clean up related records
    await supabase.from('file_items').delete().eq('file_id', fileId)
    await supabase.from('file_workspaces').delete().eq('file_id', fileId)

    // Delete main record
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)

    if (deleteError) {
      console.error('❌ Failed to delete file:', deleteError.message)
    } else {
      console.log('✅ File deleted successfully!')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Main execution
async function main() {
  const command = process.argv[2]
  const fileId = process.argv[3]

  switch (command) {
    case 'list':
      await listAllFiles()
      break
    case 'cleanup':
      await cleanupEmptyFiles()
      break
    case 'delete':
      if (!fileId) {
        console.error('❌ Please provide a file ID: node cleanup-files.js delete <file-id>')
        process.exit(1)
      }
      await deleteSpecificFile(fileId)
      break
    default:
      console.log('🛠️  File Cleanup Tool')
      console.log('Usage:')
      console.log('  node cleanup-files.js list        - List all files')
      console.log('  node cleanup-files.js cleanup     - Delete empty/zero-token files')
      console.log('  node cleanup-files.js delete <id> - Delete specific file by ID')
  }
}

main().catch(console.error)
