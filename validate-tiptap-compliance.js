/**
 * TipTap Compliance Validation Script
 * 
 * This script validates that changes to tiptap-editor-with-file-menu.js
 * comply with the best practices defined in TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md
 * 
 * Usage: node validate-tiptap-compliance.js
 */

import fs from 'fs';
import path from 'path';

const TIPTAP_FILE = 'js/tiptap-editor-with-file-menu.js';
const BEST_PRACTICES_FILE = 'TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md';

class TipTapComplianceValidator {
    constructor() {
        this.violations = [];
        this.warnings = [];
    }

    async validate() {
        console.log('🔍 Validating TipTap Editor Compliance...\n');

        // Check if files exist
        if (!fs.existsSync(TIPTAP_FILE)) {
            this.violations.push(`❌ TipTap editor file not found: ${TIPTAP_FILE}`);
            return this.report();
        }

        if (!fs.existsSync(BEST_PRACTICES_FILE)) {
            this.violations.push(`❌ Best practices file not found: ${BEST_PRACTICES_FILE}`);
            return this.report();
        }

        const tiptapContent = fs.readFileSync(TIPTAP_FILE, 'utf8');
        
        // Validation checks
        this.checkEditorLifecycleRules(tiptapContent);
        this.checkYjsDocumentRules(tiptapContent);
        this.checkArchitectureCompliance(tiptapContent);
        this.checkPerformanceRules(tiptapContent);
        this.checkBestPracticesHeader(tiptapContent);

        return this.report();
    }

    checkEditorLifecycleRules(content) {
        console.log('📋 Checking Editor Lifecycle Rules...');

        // Check for proper editor creation patterns
        if (content.includes('new Editor(') && !content.includes('extensions:')) {
            this.violations.push('❌ Editor created without static extension configuration');
        }

        // Check for dynamic extension changes (should not exist)
        if (content.includes('addExtension') || content.includes('removeExtension')) {
            this.violations.push('❌ Dynamic extension addition/removal detected (not supported by TipTap)');
        }

        // Check for proper editor destruction
        if (content.includes('.destroy()')) {
            console.log('✅ Editor destruction methods found');
        } else {
            this.warnings.push('⚠️  No editor destruction methods found - ensure proper cleanup');
        }

        // Check for offline-first pattern
        if (content.includes('createBasicEditors')) {
            console.log('✅ Offline-first editor creation pattern found');
        } else {
            this.violations.push('❌ Missing offline-first editor creation pattern');
        }
    }

    checkYjsDocumentRules(content) {
        console.log('📋 Checking Y.js Document Rules...');

        // Check for Y.js document creation before editors
        if (content.includes('new Y.Doc()')) {
            console.log('✅ Y.js document creation found');
        }

        // Check for consistent Y.js types (only flag Y.js document getText calls, not editor getText calls)
        const yjsGetTextPattern = /this\.ydoc\.getText\(/g;
        if (content.includes('XmlFragment') && yjsGetTextPattern.test(content)) {
            this.violations.push('❌ Mixed Y.js types detected (XmlFragment and Text) - causes type conflicts');
        }

        // Check for lazy Y.js creation
        if (content.includes('lazyYjsComponents')) {
            console.log('✅ Lazy Y.js creation pattern found');
        } else {
            this.warnings.push('⚠️  Lazy Y.js creation pattern not found');
        }

        // Check for IndexedDB persistence
        if (content.includes('IndexeddbPersistence')) {
            console.log('✅ IndexedDB persistence found');
        }
    }

    checkArchitectureCompliance(content) {
        console.log('📋 Checking Architecture Compliance...');

        // Check for three-phase architecture methods
        const requiredMethods = [
            'createBasicEditors',
            'createLazyYjsDocument', 
            'upgradeToCollaborativeMode'
        ];

        requiredMethods.forEach(method => {
            if (content.includes(method)) {
                console.log(`✅ Found ${method} method`);
            } else {
                this.violations.push(`❌ Missing required method: ${method}`);
            }
        });

        // Check for proper content preservation
        if (content.includes('preservedContent')) {
            console.log('✅ Content preservation pattern found');
        } else {
            this.warnings.push('⚠️  Content preservation pattern not found');
        }
    }

    checkPerformanceRules(content) {
        console.log('📋 Checking Performance Rules...');

        // Check for proper cleanup
        if (content.includes('beforeUnmount') || content.includes('destroy')) {
            console.log('✅ Cleanup methods found');
        } else {
            this.warnings.push('⚠️  No cleanup methods found');
        }

        // Check for lightweight sync
        if (content.includes('setupOfflinePersistenceSync')) {
            console.log('✅ Lightweight sync method found');
        }

        // Check for unnecessary editor recreation
        if (content.includes('setContent') && content.includes('destroy')) {
            console.log('✅ Proper content update vs editor recreation balance');
        }
    }

    checkBestPracticesHeader(content) {
        console.log('📋 Checking Best Practices Header...');

        if (content.includes('CRITICAL: TipTap Editor Best Practices Validation')) {
            console.log('✅ Best practices validation header found');
        } else {
            this.violations.push('❌ Missing best practices validation header');
        }

        if (content.includes('@see TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md')) {
            console.log('✅ Best practices file reference found');
        } else {
            this.violations.push('❌ Missing reference to best practices file');
        }
    }

    report() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TipTap Compliance Validation Report');
        console.log('='.repeat(60));

        if (this.violations.length === 0 && this.warnings.length === 0) {
            console.log('🎉 All checks passed! TipTap implementation is compliant.');
            return true;
        }

        if (this.violations.length > 0) {
            console.log('\n❌ VIOLATIONS (Must Fix):');
            this.violations.forEach(violation => console.log(`  ${violation}`));
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS (Recommended):');
            this.warnings.forEach(warning => console.log(`  ${warning}`));
        }

        console.log('\n📖 Next Steps:');
        console.log('1. Read TIPTAP_OFFLINE_FIRST_BEST_PRACTICES.md');
        console.log('2. Review .cursorrules for validation checklist');
        console.log('3. Fix violations before proceeding');
        console.log('4. Address warnings for optimal implementation');

        return this.violations.length === 0;
    }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const validator = new TipTapComplianceValidator();
    const isCompliant = await validator.validate();
    process.exit(isCompliant ? 0 : 1);
}

export default TipTapComplianceValidator; 