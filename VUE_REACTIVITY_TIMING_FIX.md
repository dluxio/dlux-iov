# Vue Reactivity Timing Issue - Root Cause & Fix

## 🎯 Root Cause Identified

The custom JSON persistence issue was caused by a **Vue reactivity timing conflict** between:

1. **Vue data reset** (our cleanup code)
2. **Y.js data loading** (TipTap's updateCustomJsonDisplay method)

### The Problem Sequence

```javascript
// STEP 1: User switches documents
loadCollaborativeFile() {
    // STEP 2: We reset Vue data
    this.customJsonString = '';  // ✅ Reset successful
    
    // STEP 3: Document loading continues...
    // STEP 4: IndexedDB syncs with OLD document data
    // STEP 5: updateCustomJsonDisplay() gets called
    updateCustomJsonDisplay() {
        const customJsonData = this.getCustomJson(); // ❌ Gets OLD document data
        this.customJsonString = newDisplayJson;      // ❌ Overwrites our reset!
    }
}
```

### Why This Happened

The `updateCustomJsonDisplay()` method was being called **after** our Vue data reset but **before** the Y.js document was properly switched to the new document. This created a race condition where:

- Our cleanup code reset `customJsonString = ''`
- But `updateCustomJsonDisplay()` immediately overwrote it with old document data
- The old data persisted in the Vue template

## 🔧 Fix Applied

### 1. Added Cleanup State Protection

```javascript
updateCustomJsonDisplay() {
    // ✅ CRITICAL FIX: Prevent overriding Vue data reset during document cleanup/switching
    if (this.isCleaningUp || this.isInitializingEditors || this.isUpdatingPermissions) {
        console.log('🔄 Skipping custom JSON display update during document cleanup/switching');
        return;
    }
    
    // ... rest of method
}
```

### 2. Set Cleanup Flag During Document Switching

```javascript
// In loadCollaborativeFile()
this.isCleaningUp = true; // Prevent updateCustomJsonDisplay from overriding our reset
this.customJsonString = '';
this.customJsonError = '';
// ... other Vue data resets

// In loadLocalFile()  
this.isCleaningUp = true; // Prevent updateCustomJsonDisplay from overriding our reset
this.customJsonString = '';
this.customJsonError = '';
// ... other Vue data resets
```

### 3. Clear Cleanup Flag After Loading Complete

```javascript
// After document loading is complete
this.loadPublishOptionsFromYjs();
this.loadCustomJsonFromYjs();

// Clear cleanup flag after document loading is complete
this.isCleaningUp = false;
```

## 🧪 Testing Instructions

### Test Case 1: Custom JSON Isolation
1. Create Document A with custom JSON: `{"test": "document-a"}`
2. Create Document B with custom JSON: `{"test": "document-b"}`
3. Switch from A to B
4. **Expected**: Custom JSON should show `{"test": "document-b"}`
5. **Previous Bug**: Custom JSON showed `{"test": "document-a"}` (persisted)

### Test Case 2: Empty Document Loading
1. Create Document A with custom JSON: `{"data": "should-not-persist"}`
2. Create new empty Document B
3. Switch from A to B
4. **Expected**: Custom JSON should be empty
5. **Previous Bug**: Custom JSON showed `{"data": "should-not-persist"}`

### Test Case 3: Multiple Document Switches
1. Create 3 documents with different custom JSON
2. Switch between them rapidly
3. **Expected**: Each document shows its own custom JSON
4. **Previous Bug**: Custom JSON from previous documents persisted

## 🏗️ Architecture Compliance

This fix maintains **TipTap.dev best practices**:

✅ **No editor destruction** - Editors remain intact during document switching
✅ **Proper Y.js timing** - Respects Y.js document loading sequence  
✅ **Vue reactivity isolation** - Clean state separation between documents
✅ **Offline-first pattern** - Works with temp document architecture

## 🔍 Technical Details

### Vue Reactivity System Issue

The issue was specifically with Vue's **reactive data binding** (`v-model="customJsonString"`). When:

1. Vue data is reset: `this.customJsonString = ''`
2. But Y.js observer triggers: `updateCustomJsonDisplay()`
3. Which overwrites Vue data: `this.customJsonString = oldData`
4. Vue template shows the overwritten data

### The Fix Strategy

Instead of trying to control **when** `updateCustomJsonDisplay()` is called (complex), we control **whether** it should update Vue data during cleanup periods.

This is a **defensive programming** approach that:
- Prevents race conditions
- Maintains clean state isolation
- Doesn't interfere with normal operation
- Is easy to understand and maintain

## 🎉 Expected Outcome

After this fix:
- ✅ Custom JSON is completely isolated between documents
- ✅ No persistence of old document data
- ✅ Clean Vue state on every document switch
- ✅ All document loading paths properly reset Vue data
- ✅ TipTap best practices maintained throughout

The custom JSON implementation is now **100% compliant** with Vue reactivity patterns and TipTap.dev collaborative editing best practices. 