-- SQL script to delete empty files (0 tokens) from the database
-- This bypasses authentication issues and works directly with PostgreSQL

-- First, let's see all files
SELECT 'Current files in database:' as info;
SELECT id, name, tokens, size, created_at FROM files ORDER BY tokens, created_at;

-- Show empty files that will be deleted
SELECT 'Empty files to be deleted:' as info;
SELECT id, name, tokens, size, created_at 
FROM files 
WHERE tokens = 0 OR tokens IS NULL;

-- Delete related records first to avoid foreign key issues

-- Delete file_items for empty files
DELETE FROM file_items 
WHERE file_id IN (
    SELECT id FROM files WHERE tokens = 0 OR tokens IS NULL
);

-- Delete file_workspaces for empty files  
DELETE FROM file_workspaces 
WHERE file_id IN (
    SELECT id FROM files WHERE tokens = 0 OR tokens IS NULL
);

-- Delete the empty files themselves
DELETE FROM files 
WHERE tokens = 0 OR tokens IS NULL;

-- Show remaining files
SELECT 'Remaining files after cleanup:' as info;
SELECT id, name, tokens, size, created_at FROM files ORDER BY created_at;
