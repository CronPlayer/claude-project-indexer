# Claude Project Indexer 🚀

**The Advanced Pro-Move for Claude Code**

Give Claude complete codebase awareness with zero context switching. This tool creates a comprehensive project index that acts as a "map" of your entire codebase, allowing Claude to see the "forest" instead of just individual "trees."

## 🎯 The Problem It Solves

When working with large projects, Claude can only see the specific files you show it. This leads to:
- ❌ Refactoring functions without updating their usage elsewhere
- ❌ Suggesting non-existent utilities or patterns  
- ❌ Missing architectural context when making changes
- ❌ Requiring manual file discovery and context building

## ✨ The Solution

Claude Project Indexer creates a single `PROJECT_INDEX.json` file containing:
- 📁 **Complete file tree structure**
- 🔧 **Function signatures and names**  
- 🏗️ **Class and interface definitions**
- 🔗 **Import/export relationships**
- 📊 **Project architecture overview**

This gives Claude instant, complete codebase awareness from the start of every session.

## 🚀 Quick Start

### Installation

```bash
# Install globally for use across all projects
npm install -g claude-project-indexer

# Or install locally in your project
npm install claude-project-indexer
```

### Basic Usage

```bash
# Generate project index once
claude-index

# Watch for changes and auto-update index
claude-watch

# Generate index for specific directory
claude-index --root /path/to/project

# Generate index once without watching
claude-watch --once
```

### Integration with Claude Code

1. **Generate your project index:**
   ```bash
   claude-index
   ```

2. **Set up the `/fresh` slash command** (copy `fresh.md` to your Claude Code slash commands directory)

3. **Start Claude Code and load context:**
   ```bash
   c      # Start Claude Code
   /fresh # Load complete project context
   ```

4. **Enjoy enhanced development!** Claude now knows your entire codebase structure.

## 📋 Features

### 🔍 **Intelligent Code Analysis**
- Extracts function signatures, class definitions, and interfaces
- Identifies import/export relationships  
- Supports 15+ programming languages
- Respects `.gitignore` patterns automatically

### ⚡ **Real-time Updates**
- File watcher with intelligent debouncing
- Automatic index regeneration on code changes
- Minimal performance impact

### 🎛️ **Highly Configurable**
- Custom file extensions and ignore patterns
- Configurable output location and format
- Flexible CLI options

### 🌍 **Multi-Language Support**
- JavaScript/TypeScript (including React, Vue, Svelte)
- Python, Java, C/C++, C#, Go, Rust
- PHP, Ruby, Kotlin, Swift
- Extensible architecture for additional languages

## 📖 Detailed Usage

### Command Line Options

#### `claude-index` (Indexer)
```bash
claude-index [options]

Options:
  --root <path>         Project root directory (default: current directory)
  --output <file>       Output file name (default: PROJECT_INDEX.json)  
  --extensions <list>   Comma-separated file extensions to include
```

#### `claude-watch` (File Watcher)
```bash
claude-watch [options]

Options:
  --once, -o           Generate index once and exit (don't watch)
  --root <path>        Project root directory (default: current directory)
  --output <file>      Output file name (default: PROJECT_INDEX.json)
  --debounce <ms>      Debounce time in milliseconds (default: 1000)
```

### Programmatic Usage

```javascript
const ProjectIndexer = require('claude-project-indexer');

// Create indexer instance
const indexer = new ProjectIndexer({
  rootDir: '/path/to/project',
  outputFile: 'MY_INDEX.json',
  supportedExtensions: ['.js', '.ts', '.py']
});

// Generate index
const index = indexer.generateIndex();

// Start file watcher
const ProjectWatcher = require('claude-project-indexer/watcher');
const watcher = new ProjectWatcher({ rootDir: '/path/to/project' });
watcher.start();
```

## 🏗️ Architecture

### Generated Index Structure

```json
{
  "generatedAt": "2024-01-01T12:00:00.000Z",
  "projectRoot": "/path/to/project", 
  "totalFiles": 150,
  "fileTree": {
    "src": {
      "components": {
        "Button.tsx": "file",
        "Modal.tsx": "file"
      },
      "utils": {
        "helpers.js": "file"
      }
    }
  },
  "files": {
    "src/components/Button.tsx": {
      "path": "src/components/Button.tsx",
      "extension": ".tsx",
      "size": 1250,
      "imports": ["react", "./Button.styles"],
      "exports": ["Button", "ButtonProps"],
      "functions": ["Button", "handleClick"],
      "interfaces": ["ButtonProps"],
      "constants": ["DEFAULT_VARIANT"]
    }
  },
  "summary": {
    "totalFunctions": 45,
    "totalClasses": 12,
    "totalInterfaces": 8,
    "filesByExtension": {
      ".tsx": 15,
      ".ts": 25,
      ".js": 10
    }
  }
}
```

### File Metadata Extraction

For each supported file, the indexer extracts:

- **Functions**: Names, signatures, and export status
- **Classes**: Class names and inheritance  
- **Interfaces/Types**: TypeScript interfaces and type definitions
- **Imports**: Module dependencies and import statements
- **Constants**: Top-level constants and configuration
- **Exports**: What the module makes available to others

## 🎮 Workflow Integration

### The `/fresh` Slash Command

The included `/fresh` slash command provides the ultimate Claude Code experience:

1. **Clears current session** - Fresh start
2. **Loads project index** - Instant complete context  
3. **Ready for instructions** - Claude knows your entire codebase

Example workflow:
```bash
c               # Start Claude Code
/fresh          # Load complete project context
# Claude: "Project index loaded. Ready for your instructions."

# Now ask for complex changes with confidence:
"Add user authentication to the API, update the frontend components, and add proper error handling"

# Claude already knows:
# - Your API route structure
# - Available frontend components  
# - Existing error handling patterns
# - Database models and utilities
```

## 🔧 Configuration

### Supported File Extensions (Default)
- `.js`, `.jsx`, `.ts`, `.tsx` - JavaScript/TypeScript
- `.py` - Python
- `.java` - Java  
- `.cpp`, `.c`, `.h` - C/C++
- `.cs` - C#
- `.php` - PHP
- `.rb` - Ruby
- `.go` - Go
- `.rs` - Rust
- `.kt` - Kotlin
- `.swift` - Swift
- `.vue` - Vue.js
- `.svelte` - Svelte

### Default Ignore Patterns
- `node_modules/**`
- `.git/**` 
- `dist/**`, `build/**`
- `.next/**`, `.vercel/**`
- Coverage and cache directories
- Minified files and source maps
- Files specified in `.gitignore`

## 🚀 Advanced Usage

### Custom Configuration

Create a `.claude-indexer.json` config file in your project root:

```json
{
  "outputFile": "MY_PROJECT_INDEX.json",
  "supportedExtensions": [".js", ".ts", ".py", ".go"],
  "ignorePatterns": [
    "node_modules/**",
    "vendor/**", 
    "*.test.js"
  ],
  "debounceMs": 500
}
```

### CI/CD Integration

Add to your build process to ensure the index is always up-to-date:

```bash
# In your CI/CD pipeline
npm install -g claude-project-indexer
claude-index --root . --output docs/PROJECT_INDEX.json
```

### Multiple Projects

Manage multiple project indices:

```bash
# Generate indices for multiple projects
claude-index --root ./frontend --output frontend-index.json
claude-index --root ./backend --output backend-index.json  
claude-index --root ./shared --output shared-index.json
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/your-username/claude-project-indexer.git
cd claude-project-indexer
npm install
npm test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Inspired by Eric's advanced Claude Code workflows and the need for better AI-developer collaboration tools.

## 📊 Why This Matters

### Before Claude Project Indexer:
- 🐌 Slow context building (manually showing files)
- 🔍 Limited architectural awareness  
- ❌ Frequent mistakes due to missing context
- 🔄 Repetitive file discovery and explanation

### After Claude Project Indexer:
- ⚡ Instant complete codebase awareness
- 🏗️ Full architectural understanding
- ✅ Accurate suggestions that fit your patterns
- 🚀 Start complex tasks immediately

**Transform your Claude Code experience from tactical file editing to strategic codebase development.**

---

*Made with ❤️ for the Claude Code community*