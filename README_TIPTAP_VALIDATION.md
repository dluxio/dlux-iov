# TipTap Editor Validation System

## Overview

This validation system ensures that all changes to `js/tiptap-editor-with-file-menu.js` comply with TipTap's official best practices and our offline-first collaborative architecture.

## Files Created

### 1. `.cursorrules` - Cursor AI Rules
- **Purpose**: Instructs Cursor AI to always validate TipTap changes
- **Contains**: Validation checklist, decision tree, enforcement actions
- **Usage**: Automatically consulted by Cursor AI when making changes

### 2. `TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md` - Best Practices Guide
- **Purpose**: Definitive architecture documentation based on TipTap.dev
- **Contains**: Three-phase architecture, decision tree, code examples
- **Usage**: Reference document for all TipTap development

### 3. `validate-tiptap-compliance.js` - Automated Validation
- **Purpose**: Programmatically validates TipTap implementation
- **Contains**: Automated checks for compliance violations
- **Usage**: Run via `npm run validate-tiptap`

### 4. Validation Header in `tiptap-editor-with-file-menu.js`
- **Purpose**: In-file reminder of validation requirements
- **Contains**: Quick reference to rules and architecture
- **Usage**: Visible to developers when editing the file

## How to Use

### Before Making Changes
1. **Read** `TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md`
2. **Review** the decision tree and architecture phases
3. **Check** `.cursorrules` validation checklist

### During Development
1. **Follow** the three-phase architecture:
   - Phase 1: Basic Editor (offline-first)
   - Phase 2: Lazy Y.js (after user input)
   - Phase 3: Collaborative Mode (cloud connection)

2. **Validate** against the checklist:
   - ✅ Editor Lifecycle Rules
   - ✅ Y.js Document Rules
   - ✅ Architecture Compliance
   - ✅ Performance Rules

### After Making Changes
1. **Run validation**: `npm run validate-tiptap`
2. **Fix violations** before committing
3. **Address warnings** for optimal implementation

## Validation Commands

```bash
# Run TipTap compliance validation
npm run validate-tiptap

# Run before committing (includes validation)
npm run pre-commit
```

## Architecture Decision Tree

```
Document Load Request
├── Is Collaborative Document? ──YES──> Load Collaborative Editor
├── Is Author Link? ──YES──> Load Collaborative Editor  
└── Default Case ──> Load Basic Editor
                     │
                     └── User Types? ──YES──> Create Y.js (IndexedDB only)
                         │                    Keep Basic Editor
                         │
                         └── Connect to Cloud? ──YES──> DESTROY Basic Editor
                                                        CREATE Collaborative Editor
```

## Key Rules

### ✅ DO
- Load basic editors by default (offline-first)
- Create Y.js documents before collaborative editors
- Destroy and recreate editors when switching modes
- Use consistent Y.js types (XmlFragment for TipTap)
- Preserve content during editor transitions
- Follow the three-phase architecture

### ❌ DON'T
- Dynamically add/remove extensions after editor creation
- Mix Y.js types (XmlFragment + Text causes conflicts)
- Destroy editors for simple content updates
- Load collaborative editors for non-collaborative scenarios
- Skip the validation checklist

## Enforcement

The validation system will:
1. **Prevent** non-compliant changes via automated checks
2. **Guide** developers with clear error messages
3. **Reference** official TipTap best practices
4. **Ensure** consistent architecture implementation

## Benefits

- **Compliance**: Guaranteed adherence to TipTap best practices
- **Performance**: Optimal offline-first architecture
- **Reliability**: Proper editor lifecycle management
- **Maintainability**: Clear rules and automated validation
- **Quality**: Consistent implementation patterns

## Support

- **Best Practices**: `TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md`
- **Validation Rules**: `.cursorrules`
- **Automated Checks**: `validate-tiptap-compliance.js`
- **Quick Reference**: Header in `tiptap-editor-with-file-menu.js` 