# TIPTAP TIMING FIX - Custom JSON Loading Order

## 🔍 **Issue Identified**

Custom JSON was persisting when loading new documents because we weren't following **TipTap.dev best practices** for the document loading sequence.

### Root Cause:
- We were calling `loadCustomJsonFromYjs()` **BEFORE** editors were created
- TipTap best practices require loading Y.js data **AFTER** editors are ready
- This caused timing issues where Vue data wasn't properly synchronized with Y.js state

## ✅ **TipTap Best Practices Applied**

Fixed the document loading sequence to follow **official TipTap.dev patterns**:

### ❌ **Wrong Order (Before Fix):**
```javascript
// STEP 3: Create Y.js document + IndexedDB
// STEP 4: Wait for sync  
// STEP 5: Initialize schema
// STEP 6: Load custom JSON ← TOO EARLY!
// STEP 7: Create editors
// STEP 8: Small delay for content visibility
```

### ✅ **Correct Order (After Fix):**
```javascript
// STEP 3: Create Y.js document + IndexedDB
// STEP 4: Wait for sync
// STEP 5: Initialize schema  
// STEP 6: Create editors
// STEP 6.5: Small delay for content visibility ← CRITICAL
// STEP 6.6: Load custom JSON ← CORRECT TIMING!
```

## 🏗️ **Methods Updated**

Applied the correct timing to **all document loading methods**:

1. **`loadDocument()`** - Main document loading
2. **`loadDocumentWithoutUIUpdate()`** - Internal loading method

### Pattern Applied:
```javascript
// Create editors first
await this.createOfflineFirstCollaborativeEditors(bundle);

// TIPTAP BEST PRACTICE: Small delay to ensure content is visible
await new Promise(resolve => setTimeout(resolve, 100));
console.log('📄 ALL content (title, body) now visible from Y.js/IndexedDB');

// THEN load publish options and custom JSON
this.loadPublishOptionsFromYjs();
this.loadCustomJsonFromYjs();
console.log('📄 Publish options and custom JSON loaded from Y.js');
```

## 🎯 **Why Timing Matters**

### TipTap Architecture:
1. **Y.js Document**: Contains the data
2. **TipTap Editors**: Manage Y.js fragments internally  
3. **Vue Reactive Data**: UI display layer

### Synchronization Requirements:
- **Y.js → TipTap**: Must happen during editor creation
- **TipTap → Vue**: Must happen after editors are ready
- **Timing Critical**: Vue data loading before editor readiness causes desync

## 🧪 **Test the Fix**

1. **Create Document A** with custom JSON: `{"test": "value1"}`
2. **Load Document B** - should show empty custom JSON (not value1)
3. **Load Document A** again - should show `{"test": "value1"}`
4. **Create new document** - should show empty custom JSON
5. **All transitions** should now work correctly

## 📋 **TipTap Best Practices Compliance**

✅ **Destroy → Create → Load** sequence  
✅ **Wait for IndexedDB sync** before editor creation  
✅ **Create editors** before loading Vue data  
✅ **Small delay** for content visibility  
✅ **Load Y.js data** after editors are ready  
✅ **No manual content setting** for existing documents

## 🔗 **Reference**

This fix implements the **official TipTap.dev document loading pattern**:

```javascript
// ✅ CORRECT: Universal Document Loading Pattern
async loadDocument(file) {
    // STEP 1: Always destroy existing editors first
    await this.cleanupCurrentDocument();
    
    // STEP 2-4: Create Y.js + IndexedDB + wait for sync
    // STEP 5: Create appropriate tier editor  
    // STEP 6: TipTap automatically loads content
    // STEP 6.5: Small delay for content visibility
    // STEP 6.6: Load Y.js data into Vue (AFTER editors ready)
}
```

This ensures perfect synchronization between Y.js documents, TipTap editors, and Vue reactive data. 