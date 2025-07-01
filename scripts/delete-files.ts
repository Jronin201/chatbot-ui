#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { Database } from '../supabase/types'

// Create Supabase client for local development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoYXRib3R1aSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MDMyNTMwMDYsImV4cCI6MjAxODgyOTAwNn0.r8U1QjvxBhLa97x-9mLG4SYt1Y4xJvtjdK1_IpBcnhg'

console.log('Connecting to Supabase...')
console.log('URL:', supabaseUrl)
console.log('Service Key (first 20 chars):', supabaseServiceKey.substring(0, 20) + '...')

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface FileRecord {
  id: string
  name: string
  file_path: string
  size: number
  created_at: string
  user_id: string
}

async function listFiles(): Promise<FileRecord[]> {
  const { data: files, error } = await supabase
    .from('files')
    .select('id, name, file_path, size, created_at, user_id')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching files:', error)
    return []
  }

  return files || []
}

async function deleteFile(fileId: string, filePath?: string): Promise<boolean> {
  try {
    // Delete from storage if file path is provided
    if (filePath) {
      console.log(`Deleting file from storage: ${filePath}`)
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([filePath])
      
      if (storageError) {
        console.warn(`Warning: Could not delete file from storage: ${storageError.message}`)
      } else {
        console.log(`✓ File deleted from storage: ${filePath}`)
      }
    }

    // Delete file record from database
    console.log(`Deleting file record from database: ${fileId}`)
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      console.error(`Error deleting file record: ${dbError.message}`)
      return false
    }

    // Delete file_workspaces entries
    const { error: workspaceError } = await supabase
      .from('file_workspaces')
      .delete()
      .eq('file_id', fileId)

    if (workspaceError) {
      console.warn(`Warning: Could not delete file workspace entries: ${workspaceError.message}`)
    }

    // Delete related file items
    const { error: itemsError } = await supabase
      .from('file_items')
      .delete()
      .eq('file_id', fileId)

    if (itemsError) {
      console.warn(`Warning: Could not delete file items: ${itemsError.message}`)
    }

    console.log(`✓ File record deleted from database: ${fileId}`)
    return true
  } catch (error) {
    console.error(`Error deleting file: ${error}`)
    return false
  }
}

async function deleteAllFiles(): Promise<void> {
  const files = await listFiles()
  
  if (files.length === 0) {
    console.log('No files found to delete.')
    return
  }

  console.log(`Found ${files.length} files. Starting deletion...`)
  
  let deletedCount = 0
  for (const file of files) {
    console.log(`\nDeleting: ${file.name} (ID: ${file.id})`)
    const success = await deleteFile(file.id, file.file_path)
    if (success) {
      deletedCount++
    }
  }

  console.log(`\nDeletion completed. ${deletedCount}/${files.length} files deleted successfully.`)
}

async function deleteOldFiles(daysOld: number = 30): Promise<void> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)
  
  const { data: files, error } = await supabase
    .from('files')
    .select('id, name, file_path, created_at')
    .lt('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching old files:', error)
    return
  }

  if (!files || files.length === 0) {
    console.log(`No files older than ${daysOld} days found.`)
    return
  }

  console.log(`Found ${files.length} files older than ${daysOld} days. Starting deletion...`)
  
  let deletedCount = 0
  for (const file of files) {
    console.log(`\nDeleting old file: ${file.name} (ID: ${file.id}, Created: ${file.created_at})`)
    const success = await deleteFile(file.id, file.file_path)
    if (success) {
      deletedCount++
    }
  }

  console.log(`\nOld file deletion completed. ${deletedCount}/${files.length} files deleted successfully.`)
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  try {
    switch (command) {
      case 'list':
        console.log('Listing all files...')
        const files = await listFiles()
        if (files.length === 0) {
          console.log('No files found.')
        } else {
          console.log(`\nFound ${files.length} files:`)
          files.forEach((file, index) => {
            console.log(`${index + 1}. ${file.name} (ID: ${file.id}, Size: ${(file.size / 1024).toFixed(1)} KB, Created: ${file.created_at})`)
          })
        }
        break

      case 'delete':
        const fileId = args[1]
        if (!fileId) {
          console.error('Please provide a file ID to delete.')
          console.log('Usage: npm run delete-files delete <file_id>')
          process.exit(1)
        }
        
        // Get file details first
        const { data: fileData } = await supabase
          .from('files')
          .select('name, file_path')
          .eq('id', fileId)
          .single()
        
        if (!fileData) {
          console.error(`File with ID ${fileId} not found.`)
          process.exit(1)
        }
        
        console.log(`Deleting file: ${fileData.name}`)
        const success = await deleteFile(fileId, fileData.file_path)
        if (success) {
          console.log('File deleted successfully!')
        } else {
          console.log('Failed to delete file.')
          process.exit(1)
        }
        break

      case 'delete-all':
        console.log('⚠️  WARNING: This will delete ALL files!')
        await deleteAllFiles()
        break

      case 'delete-old':
        const days = parseInt(args[1]) || 30
        console.log(`Deleting files older than ${days} days...`)
        await deleteOldFiles(days)
        break

      default:
        console.log('File Management Script')
        console.log('Commands:')
        console.log('  list                    - List all files')
        console.log('  delete <file_id>        - Delete a specific file')
        console.log('  delete-all              - Delete all files (WARNING!)')
        console.log('  delete-old [days]       - Delete files older than specified days (default: 30)')
        console.log('')
        console.log('Examples:')
        console.log('  npm run delete-files list')
        console.log('  npm run delete-files delete abc-123-def')
        console.log('  npm run delete-files delete-old 7')
        break
    }
  } catch (error) {
    console.error('Script failed:', error)
    process.exit(1)
  }
}

main()
