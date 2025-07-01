#!/bin/bash

# Batch delete empty files using curl
BASE_URL="https://sphkxfwbqamtelejepwo.supabase.co/rest/v1/files"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwaGt4ZndicWFtdGVsZWplcHdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTE2NjA0OSwiZXhwIjoyMDY2NzQyMDQ5fQ.vnxbGpnBwOahaCV5KXMuksp91pLVBkPzqeQLLsyPZLA"

# Empty file IDs
FILES=(
  "35f124d8-f27b-43a3-8851-002dc0bf0db6"
  "a6ac5bfa-ccef-44f6-a7e3-787edbd2c006" 
  "e5648740-7a28-4c56-a3c8-a4d81f45b7b9"
  "a80cffad-5b25-454c-af14-e4b4a9b5bc1d"
  "48091cad-1f06-4668-8650-1012729949c6"
  "84c01f09-676b-41e6-8464-87bd91b9a2a6"
  "79a9e563-d590-4737-9d07-9c4ae0305fa0"
)

echo "🗑️  Deleting empty files via HTTP..."

for file_id in "${FILES[@]}"; do
  echo "Deleting file: $file_id"
  
  curl -X DELETE "${BASE_URL}?id=eq.${file_id}" \
    -H "apikey: ${AUTH_TOKEN}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -H "Content-Type: application/json" \
    -w "Status: %{http_code}\n"
  
  echo ""
done

echo "🎉 Batch deletion completed!"
