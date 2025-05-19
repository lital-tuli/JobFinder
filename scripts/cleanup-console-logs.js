// scripts/cleanup-console-logs.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files and directories to scan (relative to project root)
const scanDirectories = ['./JobFinder/src', './jobs', './users', './auth', './utils', './logger', './admin', './middlewares', './DB'];
const excludeDirectories = ['node_modules', '.git', 'dist', 'build'];
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

// Console methods to look for
const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace'];

class ConsoleLogCleaner {
  constructor() {
    this.foundLogs = [];
    this.processedFiles = 0;
  }

  // Check if file should be processed
  shouldProcessFile(filePath) {
    const ext = path.extname(filePath);
    return fileExtensions.includes(ext);
  }

  // Check if directory should be skipped
  shouldSkipDirectory(dirPath) {
    const dirName = path.basename(dirPath);
    return excludeDirectories.some(exclude => dirPath.includes(exclude));
  }

  // Scan file for console.log statements
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        
        // Skip comments
        if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) {
          return;
        }

        // Look for console statements
        consoleMethods.forEach(method => {
          const patterns = [
            new RegExp(`console\\.${method}\\s*\\(`, 'g'),
            new RegExp(`console\\[['"]${method}['"]\\]\\s*\\(`, 'g')
          ];

          patterns.forEach(pattern => {
            if (pattern.test(line)) {
              this.foundLogs.push({
                file: filePath,
                line: index + 1,
                method: method,
                content: line.trim(),
                suggestion: this.getSuggestion(method, line.trim())
              });
            }
          });
        });
      });

      this.processedFiles++;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
    }
  }

  // Get replacement suggestion based on console method
  getSuggestion(method, line) {
    const loggerMethods = {
      'log': 'logger.info',
      'info': 'logger.info',
      'warn': 'logger.warn',
      'error': 'logger.error',
      'debug': 'logger.debug',
      'trace': 'logger.debug'
    };

    const replacement = loggerMethods[method] || 'logger.info';
    return line.replace(/console\.\w+\s*\(/, `${replacement}(`);
  }

  // Recursively scan directory
  scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);

      items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!this.shouldSkipDirectory(fullPath)) {
            this.scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          if (this.shouldProcessFile(fullPath)) {
            this.scanFile(fullPath);
          }
        }
      });
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message);
    }
  }

  // Generate report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('CONSOLE.LOG CLEANUP REPORT');
    console.log('='.repeat(60));
    console.log(`Files processed: ${this.processedFiles}`);
    console.log(`Console statements found: ${this.foundLogs.length}`);
    console.log('='.repeat(60));

    if (this.foundLogs.length === 0) {
      console.log('🎉 No console.log statements found! Your code is clean.');
      return;
    }

    // Group by file
    const groupedByFile = this.foundLogs.reduce((acc, log) => {
      if (!acc[log.file]) {
        acc[log.file] = [];
      }
      acc[log.file].push(log);
      return acc;
    }, {});

    // Print report for each file
    Object.entries(groupedByFile).forEach(([file, logs]) => {
      console.log(`\n📁 ${file}`);
      console.log('-'.repeat(40));
      
      logs.forEach(log => {
        console.log(`  Line ${log.line}: console.${log.method}()`);
        console.log(`    Current: ${log.content}`);
        console.log(`    Suggest: ${log.suggestion}`);
        console.log('');
      });
    });

    // Summary by method
    console.log('\n📊 SUMMARY BY METHOD:');
    console.log('-'.repeat(40));
    const methodCounts = this.foundLogs.reduce((acc, log) => {
      acc[log.method] = (acc[log.method] || 0) + 1;
      return acc;
    }, {});

    Object.entries(methodCounts).forEach(([method, count]) => {
      console.log(`  console.${method}: ${count} occurrences`);
    });

    console.log('\n💡 NEXT STEPS:');
    console.log('-'.repeat(40));
    console.log('1. Replace console statements with logger calls');
    console.log('2. Import logger: import logger from "../utils/logger.js"');
    console.log('3. Update calls as suggested above');
    console.log('4. Remove any remaining debug console.logs');
    console.log('5. Run this script again to verify cleanup');
  }

  // Run the cleanup scan
  run() {
    console.log('🔍 Scanning for console.log statements...');
    
    scanDirectories.forEach(dir => {
      const fullDir = path.resolve(__dirname, dir);
      if (fs.existsSync(fullDir)) {
        console.log(`Scanning: ${dir}`);
        this.scanDirectory(fullDir);
      } else {
        console.log(`Directory not found: ${dir}`);
      }
    });

    this.generateReport();
  }
}

// Run the cleaner
const cleaner = new ConsoleLogCleaner();
cleaner.run();