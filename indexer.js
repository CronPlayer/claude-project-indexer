#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProjectIndexer {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.outputFile = options.outputFile || 'PROJECT_INDEX.json';
    this.ignorePatterns = options.ignorePatterns || this.getDefaultIgnorePatterns();
    this.supportedExtensions = options.supportedExtensions || [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb', '.go', '.rs', '.kt', '.swift', '.vue', '.svelte'
    ];
  }

  getDefaultIgnorePatterns() {
    const patterns = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '*.min.js',
      '*.map',
      '.next/**',
      '.vercel/**',
      'coverage/**',
      '__pycache__/**',
      '*.pyc',
      '.DS_Store',
      'Thumbs.db'
    ];

    // Read .gitignore if it exists
    try {
      const gitignorePath = path.join(this.rootDir, '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        const gitignorePatterns = gitignoreContent
          .split('\n')
          .filter(line => line.trim() && !line.startsWith('#'))
          .map(line => line.trim());
        patterns.push(...gitignorePatterns);
      }
    } catch (error) {
      console.warn('Could not read .gitignore:', error.message);
    }

    return patterns;
  }

  shouldIgnoreFile(filePath) {
    const relativePath = path.relative(this.rootDir, filePath);
    return this.ignorePatterns.some(pattern => {
      if (pattern.includes('**')) {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
        return regex.test(relativePath);
      }
      return relativePath.includes(pattern.replace(/\*/g, ''));
    });
  }

  isSupportedFile(filePath) {
    const ext = path.extname(filePath);
    return this.supportedExtensions.includes(ext);
  }

  extractFileMetadata(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const ext = path.extname(filePath);
      
      let metadata = {
        path: path.relative(this.rootDir, filePath),
        extension: ext,
        size: content.length,
        imports: [],
        exports: [],
        functions: [],
        classes: [],
        interfaces: [],
        constants: [],
        types: []
      };

      switch (ext) {
        case '.js':
        case '.jsx':
        case '.ts':
        case '.tsx':
          metadata = { ...metadata, ...this.extractJavaScriptMetadata(content) };
          break;
        case '.py':
          metadata = { ...metadata, ...this.extractPythonMetadata(content) };
          break;
        case '.java':
          metadata = { ...metadata, ...this.extractJavaMetadata(content) };
          break;
        case '.cpp':
        case '.c':
        case '.h':
          metadata = { ...metadata, ...this.extractCMetadata(content) };
          break;
        case '.cs':
          metadata = { ...metadata, ...this.extractCSharpMetadata(content) };
          break;
        case '.go':
          metadata = { ...metadata, ...this.extractGoMetadata(content) };
          break;
        case '.rs':
          metadata = { ...metadata, ...this.extractRustMetadata(content) };
          break;
        default:
          metadata = { ...metadata, ...this.extractGenericMetadata(content) };
      }

      return metadata;
    } catch (error) {
      console.warn(`Error processing ${filePath}:`, error.message);
      return {
        path: path.relative(this.rootDir, filePath),
        extension: path.extname(filePath),
        error: error.message
      };
    }
  }

  extractJavaScriptMetadata(content) {
    const metadata = {
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      interfaces: [],
      constants: [],
      types: []
    };

    // Import statements
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      metadata.imports.push(match[1]);
    }

    // Require statements
    const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      metadata.imports.push(match[1]);
    }

    // Export statements
    const exportRegex = /export\s+(?:default\s+)?(?:async\s+)?(?:function\s+(\w+)|class\s+(\w+)|const\s+(\w+)|let\s+(\w+)|var\s+(\w+)|interface\s+(\w+)|type\s+(\w+))/g;
    while ((match = exportRegex.exec(content)) !== null) {
      const name = match[1] || match[2] || match[3] || match[4] || match[5] || match[6] || match[7];
      if (name) {
        if (match[1]) metadata.functions.push(name);
        else if (match[2]) metadata.classes.push(name);
        else if (match[6]) metadata.interfaces.push(name);
        else if (match[7]) metadata.types.push(name);
        else metadata.exports.push(name);
      }
    }

    // Function declarations
    const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
    while ((match = funcRegex.exec(content)) !== null) {
      if (!metadata.functions.includes(match[1])) {
        metadata.functions.push(match[1]);
      }
    }

    // Arrow functions
    const arrowFuncRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
    while ((match = arrowFuncRegex.exec(content)) !== null) {
      if (!metadata.functions.includes(match[1])) {
        metadata.functions.push(match[1]);
      }
    }

    // Class declarations
    const classRegex = /(?:export\s+)?class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      if (!metadata.classes.includes(match[1])) {
        metadata.classes.push(match[1]);
      }
    }

    // Interface declarations (TypeScript)
    const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
    while ((match = interfaceRegex.exec(content)) !== null) {
      if (!metadata.interfaces.includes(match[1])) {
        metadata.interfaces.push(match[1]);
      }
    }

    // Type declarations (TypeScript)
    const typeRegex = /(?:export\s+)?type\s+(\w+)/g;
    while ((match = typeRegex.exec(content)) !== null) {
      if (!metadata.types.includes(match[1])) {
        metadata.types.push(match[1]);
      }
    }

    // Constants
    const constRegex = /(?:export\s+)?const\s+([A-Z_][A-Z0-9_]*)\s*=/g;
    while ((match = constRegex.exec(content)) !== null) {
      if (!metadata.constants.includes(match[1])) {
        metadata.constants.push(match[1]);
      }
    }

    return metadata;
  }

  extractPythonMetadata(content) {
    const metadata = {
      imports: [],
      functions: [],
      classes: [],
      constants: []
    };

    // Import statements
    const importRegex = /(?:from\s+(\S+)\s+)?import\s+([^\n]+)/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        metadata.imports.push(match[1]);
      }
      const imports = match[2].split(',').map(i => i.trim());
      metadata.imports.push(...imports);
    }

    // Function definitions
    const funcRegex = /def\s+(\w+)\s*\(/g;
    while ((match = funcRegex.exec(content)) !== null) {
      metadata.functions.push(match[1]);
    }

    // Class definitions
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      metadata.classes.push(match[1]);
    }

    // Constants (uppercase variables)
    const constRegex = /^([A-Z_][A-Z0-9_]*)\s*=/gm;
    while ((match = constRegex.exec(content)) !== null) {
      metadata.constants.push(match[1]);
    }

    return metadata;
  }

  extractJavaMetadata(content) {
    const metadata = {
      imports: [],
      classes: [],
      interfaces: [],
      functions: []
    };

    // Import statements
    const importRegex = /import\s+(?:static\s+)?([^;]+);/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      metadata.imports.push(match[1].trim());
    }

    // Class definitions
    const classRegex = /(?:public|private|protected)?\s*class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      metadata.classes.push(match[1]);
    }

    // Interface definitions
    const interfaceRegex = /(?:public|private|protected)?\s*interface\s+(\w+)/g;
    while ((match = interfaceRegex.exec(content)) !== null) {
      metadata.interfaces.push(match[1]);
    }

    // Method definitions
    const methodRegex = /(?:public|private|protected)?\s*(?:static\s+)?(?:\w+\s+)*(\w+)\s*\([^)]*\)\s*\{/g;
    while ((match = methodRegex.exec(content)) !== null) {
      if (match[1] !== 'class' && match[1] !== 'interface') {
        metadata.functions.push(match[1]);
      }
    }

    return metadata;
  }

  extractCMetadata(content) {
    const metadata = {
      imports: [],
      functions: [],
      constants: []
    };

    // Include statements
    const includeRegex = /#include\s*[<"]([^>"]+)[>"]/g;
    let match;
    while ((match = includeRegex.exec(content)) !== null) {
      metadata.imports.push(match[1]);
    }

    // Function declarations/definitions
    const funcRegex = /(?:static\s+)?(?:\w+\s+\*?\s*)+(\w+)\s*\([^)]*\)\s*(?:\{|;)/g;
    while ((match = funcRegex.exec(content)) !== null) {
      if (match[1] !== 'if' && match[1] !== 'while' && match[1] !== 'for') {
        metadata.functions.push(match[1]);
      }
    }

    // Constants/defines
    const defineRegex = /#define\s+([A-Z_][A-Z0-9_]*)/g;
    while ((match = defineRegex.exec(content)) !== null) {
      metadata.constants.push(match[1]);
    }

    return metadata;
  }

  extractCSharpMetadata(content) {
    const metadata = {
      imports: [],
      classes: [],
      interfaces: [],
      functions: []
    };

    // Using statements
    const usingRegex = /using\s+([^;]+);/g;
    let match;
    while ((match = usingRegex.exec(content)) !== null) {
      metadata.imports.push(match[1].trim());
    }

    // Class definitions
    const classRegex = /(?:public|private|internal)?\s*(?:abstract\s+|static\s+)?class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      metadata.classes.push(match[1]);
    }

    // Interface definitions
    const interfaceRegex = /(?:public|private|internal)?\s*interface\s+(\w+)/g;
    while ((match = interfaceRegex.exec(content)) !== null) {
      metadata.interfaces.push(match[1]);
    }

    // Method definitions
    const methodRegex = /(?:public|private|protected|internal)?\s*(?:static\s+)?(?:virtual\s+)?(?:override\s+)?(?:\w+\s+)*(\w+)\s*\([^)]*\)\s*\{/g;
    while ((match = methodRegex.exec(content)) !== null) {
      if (match[1] !== 'class' && match[1] !== 'interface') {
        metadata.functions.push(match[1]);
      }
    }

    return metadata;
  }

  extractGoMetadata(content) {
    const metadata = {
      imports: [],
      functions: [],
      constants: []
    };

    // Import statements
    const importRegex = /import\s+(?:\(\s*([^)]+)\s*\)|"([^"]+)")/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        const imports = match[1].split('\n').map(i => i.trim().replace(/"/g, '')).filter(i => i);
        metadata.imports.push(...imports);
      } else if (match[2]) {
        metadata.imports.push(match[2]);
      }
    }

    // Function definitions
    const funcRegex = /func\s+(?:\([^)]*\)\s+)?(\w+)\s*\(/g;
    while ((match = funcRegex.exec(content)) !== null) {
      metadata.functions.push(match[1]);
    }

    // Constants
    const constRegex = /const\s+(\w+)/g;
    while ((match = constRegex.exec(content)) !== null) {
      metadata.constants.push(match[1]);
    }

    return metadata;
  }

  extractRustMetadata(content) {
    const metadata = {
      imports: [],
      functions: [],
      constants: []
    };

    // Use statements
    const useRegex = /use\s+([^;]+);/g;
    let match;
    while ((match = useRegex.exec(content)) !== null) {
      metadata.imports.push(match[1].trim());
    }

    // Function definitions
    const funcRegex = /(?:pub\s+)?fn\s+(\w+)\s*\(/g;
    while ((match = funcRegex.exec(content)) !== null) {
      metadata.functions.push(match[1]);
    }

    // Constants
    const constRegex = /(?:pub\s+)?const\s+(\w+)/g;
    while ((match = constRegex.exec(content)) !== null) {
      metadata.constants.push(match[1]);
    }

    return metadata;
  }

  extractGenericMetadata(content) {
    return {
      lineCount: content.split('\n').length,
      hasComments: /\/\*[\s\S]*?\*\/|\/\/.*$/m.test(content) || /#.*$/m.test(content)
    };
  }

  scanDirectory(dir = this.rootDir) {
    const files = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (this.shouldIgnoreFile(fullPath)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          files.push(...this.scanDirectory(fullPath));
        } else if (entry.isFile() && this.isSupportedFile(fullPath)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Error scanning directory ${dir}:`, error.message);
    }
    
    return files;
  }

  buildFileTree(files) {
    const tree = {};
    
    for (const file of files) {
      const relativePath = path.relative(this.rootDir, file);
      const parts = relativePath.split(path.sep);
      let current = tree;
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          // It's a file
          current[part] = 'file';
        } else {
          // It's a directory
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      }
    }
    
    return tree;
  }

  generateIndex() {
    console.log('🔍 Scanning project files...');
    const files = this.scanDirectory();
    
    console.log(`📁 Found ${files.length} files to process`);
    
    const fileTree = this.buildFileTree(files);
    const fileMetadata = {};
    
    let processed = 0;
    for (const file of files) {
      const metadata = this.extractFileMetadata(file);
      fileMetadata[metadata.path] = metadata;
      processed++;
      
      if (processed % 10 === 0) {
        console.log(`⚡ Processed ${processed}/${files.length} files`);
      }
    }
    
    const index = {
      generatedAt: new Date().toISOString(),
      projectRoot: this.rootDir,
      totalFiles: files.length,
      fileTree,
      files: fileMetadata,
      summary: this.generateSummary(fileMetadata)
    };
    
    const outputPath = path.join(this.rootDir, this.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
    
    console.log(`✅ Project index generated: ${outputPath}`);
    console.log(`📊 Summary: ${index.summary.totalFunctions} functions, ${index.summary.totalClasses} classes across ${files.length} files`);
    
    return index;
  }

  generateSummary(fileMetadata) {
    const summary = {
      totalFunctions: 0,
      totalClasses: 0,
      totalInterfaces: 0,
      totalConstants: 0,
      filesByExtension: {},
      largestFiles: []
    };
    
    const fileSizes = [];
    
    for (const [filePath, metadata] of Object.entries(fileMetadata)) {
      if (metadata.functions) summary.totalFunctions += metadata.functions.length;
      if (metadata.classes) summary.totalClasses += metadata.classes.length;
      if (metadata.interfaces) summary.totalInterfaces += metadata.interfaces.length;
      if (metadata.constants) summary.totalConstants += metadata.constants.length;
      
      const ext = metadata.extension || 'unknown';
      summary.filesByExtension[ext] = (summary.filesByExtension[ext] || 0) + 1;
      
      if (metadata.size) {
        fileSizes.push({ path: filePath, size: metadata.size });
      }
    }
    
    summary.largestFiles = fileSizes
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .map(f => ({ path: f.path, size: f.size }));
    
    return summary;
  }
}

// CLI functionality
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
      case '--root':
        options.rootDir = value;
        break;
      case '--output':
        options.outputFile = value;
        break;
      case '--extensions':
        options.supportedExtensions = value.split(',');
        break;
    }
  }
  
  const indexer = new ProjectIndexer(options);
  indexer.generateIndex();
}

module.exports = ProjectIndexer;