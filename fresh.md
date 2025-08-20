# Fresh Start with Project Index

This slash command provides a fresh start with complete project context by loading the PROJECT_INDEX.json file.

## What it does:

1. **Clears current session** - Starts with a clean slate
2. **Loads project index** - Immediately provides Claude with a comprehensive map of your entire codebase
3. **Sets context** - Gives Claude understanding of your project architecture, file structure, and code patterns

## Usage:

Simply type `/fresh` in Claude Code to:
- Clear the current conversation history
- Load your project's complete index
- Start with full architectural context

## Prerequisites:

Make sure you have:
1. Generated a PROJECT_INDEX.json file in your project root using the indexer
2. Set up the file watcher (optional) to keep the index up-to-date

## The INDEX Loading Process:

```bash
# Clear current session
/clear

# Find and load PROJECT_INDEX.json from project root
# This gives Claude instant access to:
# - Complete file tree structure  
# - All function signatures and names
# - Class definitions and interfaces
# - Import/export relationships
# - Project architecture overview
```

## What Claude gains access to:

✅ **Complete file tree** - Understands your project structure  
✅ **Function signatures** - Knows what functions exist and their parameters  
✅ **Class definitions** - Understands your object models  
✅ **Import relationships** - Sees how modules depend on each other  
✅ **Architecture patterns** - Recognizes your coding conventions  
✅ **Project scope** - Knows the full context before making changes  

## Benefits:

- **Faster development** - No need to manually show Claude multiple files
- **Better suggestions** - Claude knows what exists and can suggest appropriate solutions
- **Fewer mistakes** - Claude won't suggest functions that don't exist or miss dependencies
- **Architectural awareness** - Changes consider the entire codebase, not just local files

## Example workflow:

1. Start Claude Code: `c`
2. Load fresh context: `/fresh`  
3. Claude responds: "Project index loaded. Ready for your instructions."
4. Ask for changes: "Add a new user authentication endpoint"
5. Claude already knows your routing structure, database models, and utility functions

This transforms Claude from seeing individual "trees" to understanding the entire "forest" of your codebase.

Project index loaded. Ready for your instructions.