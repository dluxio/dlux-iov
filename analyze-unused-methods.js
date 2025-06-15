#!/usr/bin/env node

/**
 * Unused Methods Analyzer for TipTap Editor
 * 
 * This tool analyzes js/tiptap-editor-with-file-menu.js to find:
 * 1. Methods defined in the Vue component
 * 2. Methods called in the template
 * 3. Methods called in other methods
 * 4. Unused methods that can be safely removed
 */

const fs = require('fs');
const path = require('path');

class UnusedMethodsAnalyzer {
    constructor(filePath) {
        this.filePath = filePath;
        this.fileContent = '';
        this.definedMethods = new Set();
        this.calledMethods = new Set();
        this.templateMethods = new Set();
        this.internalCalls = new Set();
        this.computedProperties = new Set();
        this.watchers = new Set();
        this.lifecycleHooks = new Set(['mounted', 'beforeUnmount', 'created', 'beforeCreate', 'updated', 'beforeUpdate']);
    }

    async analyze() {
        console.log('🔍 Analyzing unused methods in TipTap editor...\n');
        
        try {
            this.fileContent = fs.readFileSync(this.filePath, 'utf8');
            
            this.extractDefinedMethods();
            this.extractTemplateMethodCalls();
            this.extractInternalMethodCalls();
            this.extractComputedProperties();
            this.extractWatchers();
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Error analyzing file:', error.message);
        }
    }

    extractDefinedMethods() {
        console.log('📋 Extracting defined methods...');
        
        // Match method definitions: methodName() { or async methodName() {
        const methodRegex = /^\s*(async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/gm;
        let match;
        
        while ((match = methodRegex.exec(this.fileContent)) !== null) {
            const methodName = match[2];
            
            // Skip constructor and lifecycle hooks
            if (methodName !== 'constructor' && !this.lifecycleHooks.has(methodName)) {
                this.definedMethods.add(methodName);
            }
        }
        
        console.log(`   Found ${this.definedMethods.size} defined methods`);
    }

    extractTemplateMethodCalls() {
        console.log('🎨 Extracting template method calls...');
        
        // Find the template section
        const templateMatch = this.fileContent.match(/template:\s*`([^`]*(?:`[^`]*`[^`]*)*)`/s);
        if (!templateMatch) {
            console.log('   ⚠️ No template found');
            return;
        }
        
        const template = templateMatch[1];
        
        // Match various Vue template method call patterns
        const patterns = [
            /@click(?:\.prevent)?="([a-zA-Z_$][a-zA-Z0-9_$]*)/g,           // @click="methodName"
            /@[a-z]+="([a-zA-Z_$][a-zA-Z0-9_$]*)\(/g,                      // @event="methodName("
            /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g,                   // {{ methodName }}
            /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\(/g,                        // {{ methodName(
            /:disabled="!([a-zA-Z_$][a-zA-Z0-9_$]*)/g,                     // :disabled="!methodName"
            /:class="\{[^}]*([a-zA-Z_$][a-zA-Z0-9_$]*)[^}]*\}"/g,          // :class="{ methodName }"
            /v-if="([a-zA-Z_$][a-zA-Z0-9_$]*)/g,                           // v-if="methodName"
            /v-show="([a-zA-Z_$][a-zA-Z0-9_$]*)/g,                         // v-show="methodName"
            /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\?\./g,                      // {{ methodName?.
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(template)) !== null) {
                const methodName = match[1];
                if (this.definedMethods.has(methodName)) {
                    this.templateMethods.add(methodName);
                }
            }
        });
        
        console.log(`   Found ${this.templateMethods.size} methods called in template`);
    }

    extractInternalMethodCalls() {
        console.log('🔗 Extracting internal method calls...');
        
        // Match this.methodName( calls
        const internalCallRegex = /this\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
        let match;
        
        while ((match = internalCallRegex.exec(this.fileContent)) !== null) {
            const methodName = match[1];
            if (this.definedMethods.has(methodName)) {
                this.internalCalls.add(methodName);
            }
        }
        
        // Also check for await this.methodName( calls
        const awaitCallRegex = /await\s+this\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
        while ((match = awaitCallRegex.exec(this.fileContent)) !== null) {
            const methodName = match[1];
            if (this.definedMethods.has(methodName)) {
                this.internalCalls.add(methodName);
            }
        }
        
        console.log(`   Found ${this.internalCalls.size} methods called internally`);
    }

    extractComputedProperties() {
        console.log('⚙️ Extracting computed properties...');
        
        // Find computed properties section
        const computedMatch = this.fileContent.match(/computed:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s);
        if (computedMatch) {
            const computedSection = computedMatch[1];
            const computedRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(\)/g;
            let match;
            
            while ((match = computedRegex.exec(computedSection)) !== null) {
                this.computedProperties.add(match[1]);
            }
        }
        
        console.log(`   Found ${this.computedProperties.size} computed properties`);
    }

    extractWatchers() {
        console.log('👀 Extracting watchers...');
        
        // Find watch section
        const watchMatch = this.fileContent.match(/watch:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s);
        if (watchMatch) {
            const watchSection = watchMatch[1];
            const watcherRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g;
            let match;
            
            while ((match = watcherRegex.exec(watchSection)) !== null) {
                this.watchers.add(match[1]);
            }
        }
        
        console.log(`   Found ${this.watchers.size} watchers`);
    }

    generateReport() {
        console.log('\n📊 ANALYSIS REPORT\n');
        console.log('='.repeat(80));
        
        // Combine all used methods
        const allUsedMethods = new Set([
            ...this.templateMethods,
            ...this.internalCalls,
            ...this.computedProperties,
            ...this.watchers,
            ...this.lifecycleHooks
        ]);
        
        // Find unused methods
        const unusedMethods = [...this.definedMethods].filter(method => !allUsedMethods.has(method));
        
        // Categorize methods
        const templateOnlyMethods = [...this.templateMethods].filter(method => !this.internalCalls.has(method));
        const internalOnlyMethods = [...this.internalCalls].filter(method => !this.templateMethods.has(method));
        const bothUsedMethods = [...this.templateMethods].filter(method => this.internalCalls.has(method));
        
        // Display summary
        console.log(`📈 SUMMARY:`);
        console.log(`   Total defined methods: ${this.definedMethods.size}`);
        console.log(`   Used in template: ${this.templateMethods.size}`);
        console.log(`   Called internally: ${this.internalCalls.size}`);
        console.log(`   Computed properties: ${this.computedProperties.size}`);
        console.log(`   Watchers: ${this.watchers.size}`);
        console.log(`   Total used methods: ${allUsedMethods.size}`);
        console.log(`   🚨 UNUSED METHODS: ${unusedMethods.length}`);
        
        // Show unused methods
        if (unusedMethods.length > 0) {
            console.log('\n❌ UNUSED METHODS (can be safely removed):');
            console.log('-'.repeat(50));
            unusedMethods.sort().forEach((method, index) => {
                console.log(`   ${index + 1}. ${method}()`);
            });
        }
        
        // Show method usage categories
        console.log('\n📋 METHOD USAGE CATEGORIES:');
        console.log('-'.repeat(50));
        
        if (templateOnlyMethods.length > 0) {
            console.log(`\n🎨 Template Only (${templateOnlyMethods.length}):`);
            templateOnlyMethods.sort().forEach(method => console.log(`   • ${method}()`));
        }
        
        if (internalOnlyMethods.length > 0) {
            console.log(`\n🔗 Internal Only (${internalOnlyMethods.length}):`);
            internalOnlyMethods.sort().forEach(method => console.log(`   • ${method}()`));
        }
        
        if (bothUsedMethods.length > 0) {
            console.log(`\n🔄 Both Template & Internal (${bothUsedMethods.length}):`);
            bothUsedMethods.sort().forEach(method => console.log(`   • ${method}()`));
        }
        
        if (this.computedProperties.size > 0) {
            console.log(`\n⚙️ Computed Properties (${this.computedProperties.size}):`);
            [...this.computedProperties].sort().forEach(prop => console.log(`   • ${prop}`));
        }
        
        if (this.watchers.size > 0) {
            console.log(`\n👀 Watchers (${this.watchers.size}):`);
            [...this.watchers].sort().forEach(watcher => console.log(`   • ${watcher}`));
        }
        
        // Generate cleanup recommendations
        this.generateCleanupRecommendations(unusedMethods);
    }

    generateCleanupRecommendations(unusedMethods) {
        if (unusedMethods.length === 0) {
            console.log('\n✅ No unused methods found! Code is clean.');
            return;
        }
        
        console.log('\n🧹 CLEANUP RECOMMENDATIONS:');
        console.log('-'.repeat(50));
        
        // Categorize unused methods by type
        const editorCreationMethods = unusedMethods.filter(method => 
            method.includes('create') && method.includes('Editor')
        );
        
        const cleanupMethods = unusedMethods.filter(method => 
            method.includes('cleanup') || method.includes('destroy')
        );
        
        const utilityMethods = unusedMethods.filter(method => 
            !editorCreationMethods.includes(method) && !cleanupMethods.includes(method)
        );
        
        if (editorCreationMethods.length > 0) {
            console.log(`\n🏗️ Legacy Editor Creation Methods (${editorCreationMethods.length}):`);
            console.log('   These are likely legacy methods from before the unified 2-tier system:');
            editorCreationMethods.forEach(method => console.log(`   • ${method}() - SAFE TO REMOVE`));
        }
        
        if (cleanupMethods.length > 0) {
            console.log(`\n🧹 Cleanup Methods (${cleanupMethods.length}):`);
            console.log('   These might be legacy cleanup methods:');
            cleanupMethods.forEach(method => console.log(`   • ${method}() - REVIEW BEFORE REMOVING`));
        }
        
        if (utilityMethods.length > 0) {
            console.log(`\n🔧 Utility Methods (${utilityMethods.length}):`);
            console.log('   These are general utility methods:');
            utilityMethods.forEach(method => console.log(`   • ${method}() - REVIEW BEFORE REMOVING`));
        }
        
        console.log('\n💡 NEXT STEPS:');
        console.log('   1. Review each unused method to confirm it\'s not needed');
        console.log('   2. Check if methods are called from external files');
        console.log('   3. Remove confirmed unused methods to clean up the codebase');
        console.log('   4. Test thoroughly after removal');
    }
}

// Main execution
async function main() {
    const filePath = process.argv[2] || 'js/tiptap-editor-with-file-menu.js';
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        console.log('Usage: node analyze-unused-methods.js [file-path]');
        process.exit(1);
    }
    
    const analyzer = new UnusedMethodsAnalyzer(filePath);
    await analyzer.analyze();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = UnusedMethodsAnalyzer; 