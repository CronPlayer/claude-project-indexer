#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { exec } = require('child_process');
const ProjectIndexer = require('./indexer');

class ProjectWatcher {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.debounceMs = options.debounceMs || 1000;
    this.indexer = new ProjectIndexer(options);
    this.rebuildTimer = null;
    this.isRebuilding = false;
    
    // Files to watch (same as indexer supported extensions plus config files)
    this.watchPatterns = [
      '**/*.js',
      '**/*.jsx', 
      '**/*.ts',
      '**/*.tsx',
      '**/*.py',
      '**/*.java',
      '**/*.cpp',
      '**/*.c',
      '**/*.h',
      '**/*.cs',
      '**/*.php',
      '**/*.rb',
      '**/*.go',
      '**/*.rs',
      '**/*.kt',
      '**/*.swift',
      '**/*.vue',
      '**/*.svelte',
      'package.json',
      'tsconfig.json',
      'jsconfig.json',
      '.gitignore'
    ];
    
    // Files/directories to ignore (based on common patterns)
    this.ignorePatterns = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '.next/**',
      '.vercel/**',
      'coverage/**',
      '__pycache__/**',
      '*.min.js',
      '*.map',
      'PROJECT_INDEX.json' // Don't watch our own output file
    ];
  }

  start() {
    console.log('🔍 Starting project watcher...');
    console.log(`📂 Watching: ${this.rootDir}`);
    
    // Initial index generation
    this.generateIndex();
    
    // Set up file watcher
    const watcher = chokidar.watch(this.watchPatterns, {
      cwd: this.rootDir,
      ignored: this.ignorePatterns,
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });
    
    // Watch for file changes
    watcher.on('add', (filePath) => {
      console.log(`➕ File added: ${filePath}`);
      this.scheduleRebuild();
    });
    
    watcher.on('change', (filePath) => {
      console.log(`✏️  File changed: ${filePath}`);
      this.scheduleRebuild();
    });
    
    watcher.on('unlink', (filePath) => {
      console.log(`➖ File removed: ${filePath}`);
      this.scheduleRebuild();
    });
    
    watcher.on('addDir', (dirPath) => {
      console.log(`📁 Directory added: ${dirPath}`);
      this.scheduleRebuild();
    });
    
    watcher.on('unlinkDir', (dirPath) => {
      console.log(`📁 Directory removed: ${dirPath}`);
      this.scheduleRebuild();
    });
    
    watcher.on('error', (error) => {
      console.error('❌ Watcher error:', error);
    });
    
    watcher.on('ready', () => {
      console.log('✅ Project watcher is ready and monitoring for changes');
      console.log('⏱️  Changes will trigger index rebuilds with a 1 second debounce');
      console.log('🛑 Press Ctrl+C to stop watching');
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping project watcher...');
      watcher.close().then(() => {
        console.log('✅ Watcher stopped gracefully');
        process.exit(0);
      });
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Stopping project watcher...');
      watcher.close().then(() => {
        console.log('✅ Watcher stopped gracefully');
        process.exit(0);
      });
    });
  }

  scheduleRebuild() {
    if (this.isRebuilding) {
      return;
    }
    
    // Clear existing timer
    if (this.rebuildTimer) {
      clearTimeout(this.rebuildTimer);
    }
    
    // Schedule new rebuild
    this.rebuildTimer = setTimeout(() => {
      this.generateIndex();
    }, this.debounceMs);
  }

  generateIndex() {
    if (this.isRebuilding) {
      return;
    }
    
    this.isRebuilding = true;
    console.log('🔄 Rebuilding project index...');
    
    try {
      const startTime = Date.now();
      this.indexer.generateIndex();
      const duration = Date.now() - startTime;
      console.log(`✅ Index rebuilt in ${duration}ms`);
    } catch (error) {
      console.error('❌ Error rebuilding index:', error.message);
    } finally {
      this.isRebuilding = false;
    }
  }

  // Method to run indexer once without watching
  static runOnce(options = {}) {
    const indexer = new ProjectIndexer(options);
    return indexer.generateIndex();
  }
}

// CLI functionality
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  let watchMode = true;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--once' || arg === '-o') {
      watchMode = false;
    } else if (arg === '--root' && i + 1 < args.length) {
      options.rootDir = args[i + 1];
      i++;
    } else if (arg === '--output' && i + 1 < args.length) {
      options.outputFile = args[i + 1];
      i++;
    } else if (arg === '--debounce' && i + 1 < args.length) {
      options.debounceMs = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Project Index Watcher

Usage: node watcher.js [options]

Options:
  --once, -o          Generate index once and exit (don't watch)
  --root <path>       Project root directory (default: current directory)
  --output <file>     Output file name (default: PROJECT_INDEX.json)
  --debounce <ms>     Debounce time in milliseconds (default: 1000)
  --help, -h          Show this help message

Examples:
  node watcher.js                    # Start watching current directory
  node watcher.js --once             # Generate index once and exit
  node watcher.js --root /path/to/project --debounce 500
      `);
      process.exit(0);
    }
  }
  
  if (watchMode) {
    const watcher = new ProjectWatcher(options);
    watcher.start();
  } else {
    ProjectWatcher.runOnce(options);
  }
}

module.exports = ProjectWatcher;