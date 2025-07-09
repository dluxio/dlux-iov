# 🚨 TipTap Troubleshooting Guide

## Common Issues & Solutions

### Transaction Mismatch Errors

**Error**: `RangeError: Applying a mismatched transaction`

**Causes**:
- Programmatic focus during Y.js initialization
- Editor commands during document transitions
- Direct Y.js fragment manipulation during editor lifecycle

**Solutions**:
1. Never use `editor.commands.focus()` during initialization
2. Let users focus editors naturally by clicking
3. Follow proper cleanup sequence: Editors → Providers → Y.js Document

### Permission Errors (403)

**Error**: `403 Forbidden` on GET permissions endpoint

**Workaround**:
```javascript
if (error.status === 403) {
    // Fallback to assuming user has access if they reached the document
    return { permissionType: 'postable', canRead: true, canEdit: true, canPostToHive: true };
}
```

### Content Validation Errors

**Error**: Content validation failures during collaboration

**Solution**:
```javascript
enableContentCheck: true,
onContentError: ({ error, disableCollaboration }) => {
    console.error('Content validation error:', error);
    if (disableCollaboration) {
        disableCollaboration();
        // Prompt user to refresh
    }
}
```

### DOM-Related Errors

**Error**: `Cannot read properties of null (reading 'domFromPos')`

**Causes**:
- Floating UI calculations after editor destruction
- BubbleMenu positioning during unmount

**Solutions**:
1. Check `editor.isDestroyed` before operations
2. Hide UI elements in `beforeUnmount`
3. Add cleanup handlers in tippyOptions

### Memory Management

**Best Practices**:
1. Always cleanup in correct order
2. Remove event listeners explicitly
3. Destroy Y.js documents after providers
4. Use `markRaw()` for editor instances in Vue 3

### State Synchronization Issues

**Common Problems**:
- Permlink not saving
- Title reverting
- Tags not syncing

**Solutions**:
1. Use recursion protection flags
2. Implement proper Y.js observers
3. Avoid circular updates with local state flags

## Quick Reference

### Debug Mode
```javascript
// Enable verbose logging
localStorage.setItem('tiptapDebug', 'true');
```

### Performance Tips
- Debounce Y.js updates
- Batch operations when possible
- Use transaction origins for debugging
- Monitor memory usage in DevTools

### Getting Help
- Check browser console for detailed errors
- Enable debug mode for verbose logging
- Review Y.js document state in DevTools
- Test in incognito mode to rule out extensions