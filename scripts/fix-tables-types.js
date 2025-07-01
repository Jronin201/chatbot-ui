/**
 * Fix Tables type usage across the project
 * This script will update all Tables<"table_name"> to Tables<"table_name", "public">
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files and directories to search
const searchPaths = [
  'components',
  'context',
  'db',
  'types',
  'app',
  'lib'
];

function fixTablesType(content) {
  // Replace Tables<"table_name"> with Tables<"table_name", "public">
  // This regex matches Tables<"anything"> but not Tables<"anything", "anything">
  return content.replace(
    /Tables<"([^"]+)">(?!\s*,)/g,
    'Tables<"$1", "public">'
  );
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixedContent = fixTablesType(content);
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findAndFixFiles() {
  let filesFixed = 0;
  
  searchPaths.forEach(searchPath => {
    if (!fs.existsSync(searchPath)) {
      console.log(`⚠️ Path not found: ${searchPath}`);
      return;
    }
    
    try {
      // Find all TypeScript files
      const files = execSync(`find ${searchPath} -name "*.ts" -o -name "*.tsx"`, { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(file => file.length > 0);
      
      files.forEach(file => {
        if (processFile(file)) {
          filesFixed++;
        }
      });
    } catch (error) {
      console.error(`❌ Error searching in ${searchPath}:`, error.message);
    }
  });
  
  console.log(`\n🎯 Summary: Fixed ${filesFixed} files`);
}

console.log('🔧 Starting Tables type fix...');
findAndFixFiles();
console.log('✨ Done!');
