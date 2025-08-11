/**
 * Editor Reference Service
 *
 * Provides a centralized way to access the editor component
 * without violating Rule #10 (Immutable External State).
 *
 * This replaces direct window.dluxEditor manipulation.
 *
 * @follows Rule #3: Single Source of Truth - One place for editor reference
 * @follows Rule #10: Immutable External State - No window object modification
 */

class EditorReferenceService {
    constructor() {
        this.editorComponent = null;
        this.dragHandleHoveredNode = null;
    }

    /**
     * Set the editor component reference
     * @param {Object} component - The editor Vue component instance
     */
    setComponent(component) {
        this.editorComponent = component;
    }

    /**
     * Get the editor component
     * @returns {Object|null}
     */
    getComponent() {
        return this.editorComponent;
    }

    /**
     * Set the drag handle hovered node
     * @param {Object} node - The hovered node
     */
    setDragHandleHoveredNode(node) {
        this.dragHandleHoveredNode = node;
        // Also update component if available
        if (this.editorComponent) {
            this.editorComponent.dragHandleHoveredNode = node;
        }
    }

    /**
     * Get the drag handle hovered node
     * @returns {Object|null}
     */
    getDragHandleHoveredNode() {
        return this.dragHandleHoveredNode;
    }

    /**
     * Clear all references
     */
    clear() {
        this.editorComponent = null;
        this.dragHandleHoveredNode = null;
    }
}

// Create singleton instance
export const editorReferenceService = new EditorReferenceService();

// For backward compatibility with components that expect window.dluxEditor
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'dluxEditor', {
        get() {
            // Return an object that mimics the old structure
            return {
                component: editorReferenceService.getComponent(),
                dragHandleHoveredNode: editorReferenceService.getDragHandleHoveredNode()
            };
        },
        set(value) {
            console.warn('⚠️ Direct assignment to window.dluxEditor is deprecated. Use editorReferenceService instead.');
            if (typeof value === 'object' && value !== null) {
                // Check if it's a structured object with component/dragHandleHoveredNode properties
                if (value.component !== undefined || value.dragHandleHoveredNode !== undefined) {
                    // Handle structured assignment
                    if (value.component !== undefined) {
                        editorReferenceService.setComponent(value.component);
                    }
                    if (value.dragHandleHoveredNode !== undefined) {
                        editorReferenceService.setDragHandleHoveredNode(value.dragHandleHoveredNode);
                    }
                } else {
                    // Handle direct component assignment (window.dluxEditor = this)
                    editorReferenceService.setComponent(value);
                }
            }
        },
        configurable: true
    });
}

export default EditorReferenceService;
