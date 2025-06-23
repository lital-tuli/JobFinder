import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files and directories to scan
const projectRoot = path.join(__dirname, '..');
const foldersToScan = [
  'JobFinder/src',
  'users',
  'jobs', 
  'admin',
  'auth',
  'utils'
];

// Extensions to check
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Console patterns to find
const consolePatterns = [
  /console\.log\([^)]*\);?/g,
  /console\.warn\([^)]*\);?/g,
  /console\.error\([^)]*\);?/g,
  /console\.info\([^)]*\);?/g,
  /console\.debug\([^)]*\);?/g
];

// Development-only console patterns (keep these in dev mode)
const devConsolePatterns = [
  /if\s*\(\s*import\.meta\.env\.DEV\s*\)\s*\{[\s\S]*?console\.[^}]*\}/g,
  /if\s*\(\s*process\.env\.NODE_ENV\s*===\s*['"]development['"]\s*\)\s*\{[\s\S]*?console\.[^}]*\}/g
];

let filesScanned = 0;
let consoleLogsFound = 0;
let filesModified = 0;

/**
 * Recursively scan directory for files
 */
function scanDirectory(dir) {
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other unnecessary directories
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(item)) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(fullPath);
        if (extensions.includes(ext)) {
          processFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }
}

/**
 * Process individual file to remove console logs
 */
function processFile(filePath) {
  try {
    filesScanned++;
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let fileModified = false;
    
    // Check for console logs
    for (const pattern of consolePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`Found ${matches.length} console logs in: ${filePath}`);
        consoleLogsFound += matches.length;
        
        // Remove console logs but preserve development-only ones
        newContent = newContent.replace(pattern, (match) => {
          // Check if this console log is within a development-only block
          const isDev = devConsolePatterns.some(devPattern => {
            const devMatches = content.match(devPattern);
            return devMatches && devMatches.some(devMatch => devMatch.includes(match));
          });
          
          if (isDev) {
            return match; // Keep development console logs
          } else {
            fileModified = true;
            return ''; // Remove production console logs
          }
        });
      }
    }
    
    // Write back if modified
    if (fileModified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      filesModified++;
      console.log(`✅ Cleaned console logs from: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🧹 Starting console log cleanup...\n');
  
  // Scan specified folders
  for (const folder of foldersToScan) {
    const folderPath = path.join(projectRoot, folder);
    if (fs.existsSync(folderPath)) {
      console.log(`Scanning folder: ${folder}`);
      scanDirectory(folderPath);
    } else {
      console.log(`⚠️  Folder not found: ${folder}`);
    }
  }
  
  console.log('\n📊 Cleanup Summary:');
  console.log(`Files scanned: ${filesScanned}`);
  console.log(`Console logs found: ${consoleLogsFound}`);
  console.log(`Files modified: ${filesModified}`);
  
  if (filesModified > 0) {
    console.log('\n✅ Console log cleanup completed!');
    console.log('Note: Development-only console logs (within NODE_ENV checks) were preserved.');
  } else {
    console.log('\n✨ No console logs to clean - your code is already production-ready!');
  }
}

// Run the cleanup
main();