#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SetupHelper {
  constructor() {
    this.projectRoot = process.cwd();
    this.claudeCodeConfigDir = this.findClaudeCodeConfigDir();
  }

  findClaudeCodeConfigDir() {
    // Common Claude Code configuration directories
    const possiblePaths = [
      path.join(require('os').homedir(), '.claude-code'),
      path.join(require('os').homedir(), '.config', 'claude-code'),
      path.join(require('os').homedir(), 'AppData', 'Roaming', 'claude-code'), // Windows
      path.join(require('os').homedir(), 'Library', 'Application Support', 'claude-code'), // macOS
    ];

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }

    return null;
  }

  async setup() {
    console.log('🚀 Claude Project Indexer Setup');
    console.log('================================\n');

    // Step 1: Verify installation
    console.log('1. Verifying installation...');
    try {
      const packageJson = require('./package.json');
      console.log(`   ✅ Claude Project Indexer v${packageJson.version} installed\n`);
    } catch (error) {
      console.log('   ❌ Installation verification failed');
      return;
    }

    // Step 2: Generate initial project index
    console.log('2. Generating initial project index...');
    try {
      const ProjectIndexer = require('./indexer');
      const indexer = new ProjectIndexer({ rootDir: this.projectRoot });
      indexer.generateIndex();
      console.log('   ✅ PROJECT_INDEX.json generated\n');
    } catch (error) {
      console.log(`   ❌ Failed to generate index: ${error.message}\n`);
    }

    // Step 3: Set up slash command
    console.log('3. Setting up /fresh slash command...');
    if (this.claudeCodeConfigDir) {
      try {
        this.setupSlashCommand();
        console.log('   ✅ /fresh slash command configured\n');
      } catch (error) {
        console.log(`   ⚠️  Manual setup required: ${error.message}\n`);
        this.printManualSlashCommandInstructions();
      }
    } else {
      console.log('   ⚠️  Claude Code config directory not found\n');
      this.printManualSlashCommandInstructions();
    }

    // Step 4: Create npm scripts
    console.log('4. Setting up npm scripts...');
    this.setupNpmScripts();

    // Step 5: Print usage instructions
    console.log('\n🎉 Setup Complete!');
    console.log('==================\n');
    this.printUsageInstructions();
  }

  setupSlashCommand() {
    const slashCommandsDir = path.join(this.claudeCodeConfigDir, 'slash-commands');
    
    // Create slash-commands directory if it doesn't exist
    if (!fs.existsSync(slashCommandsDir)) {
      fs.mkdirSync(slashCommandsDir, { recursive: true });
    }

    // Copy fresh.md to slash commands directory
    const sourcePath = path.join(__dirname, 'fresh.md');
    const targetPath = path.join(slashCommandsDir, 'fresh.md');
    
    fs.copyFileSync(sourcePath, targetPath);
  }

  setupNpmScripts() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        if (!packageJson.scripts) {
          packageJson.scripts = {};
        }

        // Add Claude indexer scripts
        const scriptsToAdd = {
          'claude:index': 'claude-index',
          'claude:watch': 'claude-watch',
          'claude:index-once': 'claude-watch --once'
        };

        let added = false;
        for (const [scriptName, command] of Object.entries(scriptsToAdd)) {
          if (!packageJson.scripts[scriptName]) {
            packageJson.scripts[scriptName] = command;
            added = true;
          }
        }

        if (added) {
          fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
          console.log('   ✅ npm scripts added to package.json');
        } else {
          console.log('   ℹ️  npm scripts already exist');
        }
      } catch (error) {
        console.log(`   ⚠️  Could not update package.json: ${error.message}`);
      }
    } else {
      console.log('   ℹ️  No package.json found (not a Node.js project)');
    }
  }

  printManualSlashCommandInstructions() {
    console.log('   📋 Manual slash command setup:');
    console.log('   1. Copy fresh.md to your Claude Code slash commands directory');
    console.log('   2. Restart Claude Code');
    console.log('   3. Use /fresh to load project context\n');
  }

  printUsageInstructions() {
    console.log('📚 Quick Start:');
    console.log('   1. Start Claude Code: c');
    console.log('   2. Load project context: /fresh');
    console.log('   3. Start developing with full codebase awareness!\n');

    console.log('🔧 Available Commands:');
    console.log('   claude-index              # Generate index once');
    console.log('   claude-watch              # Watch and auto-update');
    console.log('   npm run claude:index      # Via npm (if Node.js project)');
    console.log('   npm run claude:watch      # Via npm (if Node.js project)\n');

    console.log('📖 More Info:');
    console.log('   README.md - Complete documentation');
    console.log('   fresh.md  - Slash command reference');
    console.log('   GitHub: https://github.com/your-username/claude-project-indexer\n');

    console.log('💡 Pro Tip:');
    console.log('   Run "claude-watch" in a separate terminal to keep your');
    console.log('   project index automatically updated as you code!\n');
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new SetupHelper();
  setup.setup().catch(console.error);
}

module.exports = SetupHelper;