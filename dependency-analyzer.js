#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class VueDependencyAnalyzer {
    constructor(filePath) {
        this.filePath = filePath;
        this.fileContent = fs.readFileSync(filePath, 'utf8');
        this.dependencies = {
            methods: new Set(),
            computed: new Set(),
            data: new Set(),
            props: new Set(),
            refs: new Set(),
            events: new Set()
        };
        this.defined = {
            methods: new Set(),
            computed: new Set(),
            data: new Set(),
            props: new Set()
        };
        this.missing = {
            methods: new Set(),
            computed: new Set(),
            data: new Set(),
            props: new Set(),
            refs: new Set()
        };
    }

    extractTemplate() {
        const templateMatch = this.fileContent.match(/template:\s*`([\s\S]*?)`,?\s*(?:watch:|computed:|methods:|data\(\)|$)/);
        if (!templateMatch) {
            throw new Error('Could not find template section');
        }
        return templateMatch[1];
    }

    extractDefinedMethods() {
        // Extract methods from methods: { ... }
        const methodsMatch = this.fileContent.match(/methods:\s*{([\s\S]*?)},?\s*(?:computed:|watch:|template:|$)/);
        if (methodsMatch) {
            const methodsContent = methodsMatch[1];
            const methodMatches = methodsContent.matchAll(/(?:async\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g);
            for (const match of methodMatches) {
                this.defined.methods.add(match[1]);
            }
        }
    }

    extractDefinedComputed() {
        // Extract computed properties
        const computedMatch = this.fileContent.match(/computed:\s*{([\s\S]*?)},?\s*(?:methods:|watch:|template:|$)/);
        if (computedMatch) {
            const computedContent = computedMatch[1];
            const computedMatches = computedContent.matchAll(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(\s*\)\s*{/g);
            for (const match of computedMatches) {
                this.defined.computed.add(match[1]);
            }
        }
    }

    extractDefinedData() {
        // Extract data properties from data() { return { ... } }
        const dataMatch = this.fileContent.match(/data\(\)\s*{[\s\S]*?return\s*{([\s\S]*?)}\s*[,}]/);
        if (dataMatch) {
            const dataContent = dataMatch[1];
            const dataMatches = dataContent.matchAll(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g);
            for (const match of dataMatches) {
                this.defined.data.add(match[1]);
            }
        }
    }

    extractDefinedProps() {
        // Extract props
        const propsMatch = this.fileContent.match(/props:\s*(?:\[([^\]]*)\]|{([^}]*)})/);
        if (propsMatch) {
            const propsContent = propsMatch[1] || propsMatch[2];
            if (propsContent) {
                const propMatches = propsContent.matchAll(/['"]?([a-zA-Z_$][a-zA-Z0-9_$]*)['"]?/g);
                for (const match of propMatches) {
                    this.defined.props.add(match[1]);
                }
            }
        }
    }

    extractTemplateDependencies() {
        const template = this.extractTemplate();
        
        // Extract method calls from event handlers
        this.extractEventHandlers(template);
        
        // Extract v-model bindings
        this.extractVModelBindings(template);
        
        // Extract template expressions {{ }}
        this.extractTemplateExpressions(template);
        
        // Extract v-if/v-show conditions
        this.extractConditionalExpressions(template);
        
        // Extract :prop bindings
        this.extractPropBindings(template);
        
        // Extract $refs usage
        this.extractRefsUsage(template);
    }

    extractEventHandlers(template) {
        // @click="method()" or @click="method"
        const eventHandlers = template.matchAll(/@[a-z]+(?:\.[a-z]+)*="([^"]+)"/g);
        for (const match of eventHandlers) {
            const handler = match[1];
            this.parseEventHandler(handler);
        }
    }

    extractVModelBindings(template) {
        // v-model="property"
        const vModelBindings = template.matchAll(/v-model="([^"]+)"/g);
        for (const match of vModelBindings) {
            const binding = match[1];
            this.parsePropertyAccess(binding);
        }
    }

    extractTemplateExpressions(template) {
        // {{ expression }}
        const expressions = template.matchAll(/\{\{\s*([^}]+)\s*\}\}/g);
        for (const match of expressions) {
            const expression = match[1];
            this.parseExpression(expression);
        }
    }

    extractConditionalExpressions(template) {
        // v-if="condition" v-show="condition"
        const conditions = template.matchAll(/v-(?:if|show|else-if)="([^"]+)"/g);
        for (const match of conditions) {
            const condition = match[1];
            this.parseExpression(condition);
        }
    }

    extractPropBindings(template) {
        // :prop="value" or :class="expression"
        const propBindings = template.matchAll(/:[\w-]+="([^"]+)"/g);
        for (const match of propBindings) {
            const binding = match[1];
            this.parseExpression(binding);
        }
    }

    extractRefsUsage(template) {
        // ref="refName"
        const refs = template.matchAll(/ref="([^"]+)"/g);
        for (const match of refs) {
            this.dependencies.refs.add(match[1]);
        }
    }

    parseEventHandler(handler) {
        const cleanHandler = handler.trim();
        
        // Handle complex event handlers like "!isAuthenticated ? requestAuthentication() : convertToCollaborative()"
        if (cleanHandler.includes('?') && cleanHandler.includes(':')) {
            const parts = cleanHandler.split(/[?:]/);
            parts.forEach(part => {
                const trimmedPart = part.trim();
                if (trimmedPart.includes('(')) {
                    // Method call
                    const methodMatch = trimmedPart.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
                    if (methodMatch) {
                        this.dependencies.methods.add(methodMatch[1]);
                    }
                } else {
                    // Could be method without parentheses or property
                    this.parsePropertyOrMethod(trimmedPart);
                }
            });
        } else if (cleanHandler.includes('(')) {
            // Direct method call: method() or method(args)
            const methodMatch = cleanHandler.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
            if (methodMatch) {
                this.dependencies.methods.add(methodMatch[1]);
            }
        } else {
            // Method without parentheses or property access
            this.parsePropertyOrMethod(cleanHandler);
        }
    }

    parsePropertyOrMethod(expression) {
        const cleanExpr = expression
            .replace(/^this\./, '')
            .replace(/^\$/, '')
            .replace(/\s*[+\-*/=<>!&|]+.*$/, '') // Remove operators and everything after
            .replace(/\s*\?.*$/, '') // Remove ternary operators
            .trim();
        
        if (!cleanExpr || /^[0-9"'`]/.test(cleanExpr)) {
            return; // Skip literals
        }
        
        // Handle nested property access: object.property
        const parts = cleanExpr.split('.');
        const rootProperty = parts[0];
        
        if (rootProperty && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(rootProperty)) {
            // In event handlers, assume it's a method if it's a simple identifier
            // Otherwise treat as property access
            if (parts.length === 1 && !cleanExpr.includes('=')) {
                this.dependencies.methods.add(rootProperty);
            } else {
                this.dependencies.data.add(rootProperty);
            }
        }
    }

    parseExpression(expression) {
        // Remove whitespace and split by common operators
        const cleanExpr = expression.trim();
        
        // Handle method calls: method() or method(args)
        const methodCalls = cleanExpr.matchAll(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g);
        for (const match of methodCalls) {
            this.dependencies.methods.add(match[1]);
        }
        
        // Handle property access: this.property or just property
        this.parsePropertyAccess(cleanExpr);
        
        // Handle ternary operators: condition ? value1 : value2
        if (cleanExpr.includes('?') && cleanExpr.includes(':')) {
            const parts = cleanExpr.split(/[?:]/);
            parts.forEach(part => this.parsePropertyAccess(part.trim()));
        }
        
        // Handle logical operators: && || !
        const logicalParts = cleanExpr.split(/[&|!]+/);
        logicalParts.forEach(part => this.parsePropertyAccess(part.trim()));
    }

    parsePropertyAccess(expression) {
        // Remove common prefixes and suffixes
        let cleanExpr = expression
            .replace(/^this\./, '')
            .replace(/^\$/, '')
            .replace(/\s*[+\-*/=<>!&|]+.*$/, '') // Remove operators and everything after
            .replace(/\s*\?.*$/, '') // Remove ternary operators
            .replace(/\s*\(.*$/, '') // Remove function calls
            .trim();
        
        if (!cleanExpr || /^[0-9"'`]/.test(cleanExpr)) {
            return; // Skip literals
        }
        
        // Skip common JavaScript/Vue built-ins
        const builtins = ['true', 'false', 'null', 'undefined', 'Date', 'JSON', 'Math', 'console', 'window', 'document'];
        if (builtins.includes(cleanExpr)) {
            return;
        }
        
        // Handle nested property access: object.property
        const parts = cleanExpr.split('.');
        const rootProperty = parts[0];
        
        if (rootProperty && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(rootProperty)) {
            // Could be data, computed, or method
            this.dependencies.data.add(rootProperty);
        }
    }

    findMissingDependencies() {
        // Check methods
        for (const method of this.dependencies.methods) {
            if (!this.defined.methods.has(method)) {
                this.missing.methods.add(method);
            }
        }
        
        // Check data/computed properties
        for (const prop of this.dependencies.data) {
            if (!this.defined.data.has(prop) && !this.defined.computed.has(prop) && !this.defined.props.has(prop)) {
                this.missing.data.add(prop);
            }
        }
    }

    generateReport() {
        console.log('🔍 Vue.js Dependency Analysis Report');
        console.log('=====================================\n');
        
        console.log('📊 DEFINED COMPONENTS:');
        console.log(`Methods: ${this.defined.methods.size}`);
        console.log(`Computed: ${this.defined.computed.size}`);
        console.log(`Data: ${this.defined.data.size}`);
        console.log(`Props: ${this.defined.props.size}\n`);
        
        console.log('🎯 TEMPLATE DEPENDENCIES:');
        console.log(`Methods called: ${this.dependencies.methods.size}`);
        console.log(`Properties accessed: ${this.dependencies.data.size}`);
        console.log(`Refs used: ${this.dependencies.refs.size}\n`);
        
        console.log('❌ MISSING DEPENDENCIES:');
        
        if (this.missing.methods.size > 0) {
            console.log('\n🔴 MISSING METHODS:');
            for (const method of this.missing.methods) {
                console.log(`  - ${method}()`);
            }
        }
        
        if (this.missing.data.size > 0) {
            console.log('\n🔴 MISSING DATA/COMPUTED PROPERTIES:');
            for (const prop of this.missing.data) {
                console.log(`  - ${prop}`);
            }
        }
        
        if (this.missing.refs.size > 0) {
            console.log('\n🔴 TEMPLATE REFS:');
            for (const ref of this.dependencies.refs) {
                console.log(`  - $refs.${ref}`);
            }
        }
        
        const totalMissing = this.missing.methods.size + this.missing.data.size;
        
        if (totalMissing === 0) {
            console.log('\n✅ ALL DEPENDENCIES SATISFIED!');
        } else {
            console.log(`\n⚠️  TOTAL MISSING: ${totalMissing} dependencies`);
            
            // Show some examples of what's defined vs what's missing
            console.log('\n📋 SAMPLE DEFINED METHODS:');
            const definedArray = Array.from(this.defined.methods).slice(0, 10);
            definedArray.forEach(method => console.log(`  ✅ ${method}()`));
            
            if (this.missing.methods.size > 0) {
                console.log('\n📋 SAMPLE MISSING METHODS:');
                const missingArray = Array.from(this.missing.methods).slice(0, 10);
                missingArray.forEach(method => console.log(`  ❌ ${method}()`));
            }
        }
        
        return {
            missing: this.missing,
            defined: this.defined,
            dependencies: this.dependencies,
            totalMissing
        };
    }

    analyze() {
        console.log(`🔍 Analyzing: ${this.filePath}\n`);
        
        // Extract what's defined
        this.extractDefinedMethods();
        this.extractDefinedComputed();
        this.extractDefinedData();
        this.extractDefinedProps();
        
        // Extract what's needed
        this.extractTemplateDependencies();
        
        // Find missing
        this.findMissingDependencies();
        
        // Generate report
        return this.generateReport();
    }
}

// Run the analyzer
if (require.main === module) {
    const filePath = process.argv[2] || 'js/tiptap-editor-with-file-menu-clean.js';
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
    }
    
    try {
        const analyzer = new VueDependencyAnalyzer(filePath);
        const result = analyzer.analyze();
        
        if (result.totalMissing > 0) {
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        process.exit(1);
    }
}

module.exports = VueDependencyAnalyzer; 