// Minimal test to isolate infinite recursion
const fs = require('fs');

// Read the clean file
const content = fs.readFileSync('js/tiptap-editor-with-file-menu-clean.js', 'utf8');

// Check for potential circular dependencies
console.log('🔍 Checking for potential circular dependencies...\n');

// 1. Check for computed properties calling themselves
const computedMatches = content.match(/(\w+)\(\)\s*{[\s\S]*?this\.\1/g);
if (computedMatches) {
    console.log('🔴 POTENTIAL CIRCULAR COMPUTED PROPERTIES:');
    computedMatches.forEach(match => console.log(`  - ${match.split('(')[0]}`));
    console.log();
}

// 2. Check for methods calling themselves recursively without base case
const methodMatches = content.match(/(\w+)\([^)]*\)\s*{[\s\S]*?this\.\1\(/g);
if (methodMatches) {
    console.log('🔴 POTENTIAL RECURSIVE METHOD CALLS:');
    methodMatches.forEach(match => {
        const methodName = match.split('(')[0];
        console.log(`  - ${methodName}`);
    });
    console.log();
}

// 3. Check for template expressions that might cause infinite re-renders
const templateSection = content.match(/template:\s*`([\s\S]*?)`,?\s*(?:watch:|computed:|methods:|data\(\)|$)/);
if (templateSection) {
    const template = templateSection[1];
    
    // Find method calls in template
    const templateMethodCalls = template.match(/\{\{[^}]*(\w+)\([^}]*\}\}/g);
    if (templateMethodCalls) {
        console.log('⚠️  METHODS CALLED IN TEMPLATE EXPRESSIONS:');
        templateMethodCalls.forEach(call => console.log(`  - ${call}`));
        console.log();
    }
    
    // Find repeated method calls
    const allMethodCalls = template.match(/(\w+)\(/g);
    if (allMethodCalls) {
        const methodCounts = {};
        allMethodCalls.forEach(call => {
            const method = call.replace('(', '');
            methodCounts[method] = (methodCounts[method] || 0) + 1;
        });
        
        const repeatedMethods = Object.entries(methodCounts).filter(([method, count]) => count > 3);
        if (repeatedMethods.length > 0) {
            console.log('⚠️  METHODS CALLED MULTIPLE TIMES IN TEMPLATE:');
            repeatedMethods.forEach(([method, count]) => {
                console.log(`  - ${method}: ${count} times`);
            });
            console.log();
        }
    }
}

// 4. Check for watchers that might cause infinite loops
const watchSection = content.match(/watch:\s*{([\s\S]*?)}\s*};?\s*$/);
if (watchSection) {
    const watchers = watchSection[1];
    
    // Look for watchers that modify the same property they're watching
    const watcherMatches = watchers.match(/(\w+):\s*{[\s\S]*?handler[\s\S]*?this\.\1\s*=/g);
    if (watcherMatches) {
        console.log('🔴 POTENTIAL CIRCULAR WATCHERS:');
        watcherMatches.forEach(match => {
            const property = match.split(':')[0].trim();
            console.log(`  - ${property} watcher modifies itself`);
        });
        console.log();
    }
}

console.log('✅ Analysis complete'); 