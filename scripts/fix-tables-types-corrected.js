/**
 * Fix Tables Type Usage Script
 * This script will update all Tables<"table_name"> to Tables<"table_name", never>
 * to match the correct TypeScript signature
 */

const fs = require('fs');
const path = require('path');

function findTypeScriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findTypeScriptFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function fixTablesTypes() {
  const files = findTypeScriptFiles('/workspaces/chatbot-ui');
  let totalChanges = 0;
  
  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace Tables<"table_name"> with Tables<"table_name", never>
    // This regex matches Tables<"anything"> but not Tables<"anything", "anything">
    const updatedContent = content.replace(/Tables<"([^"]+)">/g, 'Tables<"$1", never>');
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      const changes = (content.match(/Tables<"[^"]+">(?![^<]*,)/g) || []).length;
      console.log(`Updated ${filePath}: ${changes} changes`);
      totalChanges += changes;
    }
  });
  
  console.log(`\nTotal files processed: ${files.length}`);
  console.log(`Total changes made: ${totalChanges}`);
}

fixTablesTypes();
