export default {
  name: "JsonEditor",
  template: `
    <div class="json-editor">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <label class="form-label mb-0">{{ label }}</label>
        <div class="d-flex gap-2">
          <button type="button" 
                  class="btn btn-sm"
                  :class="isLocked ? 'btn-outline-warning' : 'btn-outline-success'"
                  @click="toggleLock"
                  :title="isLocked ? 'Unlock to edit' : 'Lock to prevent accidental changes'">
            <i :class="isLocked ? 'fas fa-lock' : 'fas fa-lock-open'"></i> 
            {{ isLocked ? 'Locked' : 'Unlocked' }}
          </button>
          <button type="button" 
                  class="btn btn-sm btn-outline-secondary"
                  @click="formatJson"
                  :disabled="!isValidJson || isLocked">
            <i class="fas fa-code"></i> Format
          </button>
          <button type="button" 
                  class="btn btn-sm btn-outline-secondary"
                  @click="minifyJson"
                  :disabled="!isValidJson || isLocked">
            <i class="fas fa-compress"></i> Minify
          </button>
          <button type="button" 
                  class="btn btn-sm btn-outline-danger"
                  @click="showKeyManager = !showKeyManager"
                  :disabled="isLocked"
                  :title="showKeyManager ? 'Hide key manager' : 'Show key manager to delete properties'">
            <i class="fas fa-cog"></i> Manage
          </button>
        </div>
      </div>
      
      <textarea 
        ref="editor"
        v-model="jsonString"
        class="form-control bg-dark border-dark text-white font-monospace"
        :class="{ 
          'border-danger': !isValidJson && jsonString,
          'bg-secondary': isLocked
        }"
        :placeholder="isLocked ? 'JSON is locked - click unlock to edit' : placeholder"
        :style="editorStyle"
        :readonly="isLocked"
        @input="onInput"
        @keydown="onKeyDown"
        spellcheck="false">
      </textarea>
      
      <div v-if="!isValidJson && jsonString" class="text-danger small mt-1">
        <i class="fas fa-exclamation-triangle"></i> Invalid JSON: {{ jsonError }}
      </div>
      
      <div v-if="isValidJson && jsonString" class="text-success small mt-1">
        <i class="fas fa-check-circle"></i> Valid JSON
      </div>
      
      <!-- Key Manager Panel -->
      <div v-if="showKeyManager && !isLocked" class="mt-3 p-3 border border-secondary rounded">
        <h6 class="mb-2">JSON Property Manager</h6>
        <div v-if="parsedKeys.length === 0" class="text-muted small">
          No properties found in JSON
        </div>
        <div v-else>
          <div v-for="key in parsedKeys" :key="key.path" class="d-flex align-items-center justify-content-between py-1 border-bottom">
            <div class="d-flex align-items-center">
              <span class="font-monospace" :style="{ paddingLeft: (key.depth * 20) + 'px' }">
                <i v-if="key.depth > 0" class="fas fa-long-arrow-alt-right me-1 text-muted"></i>
                {{ key.name }}
                <span class="badge badge-sm ms-1" :class="getTypeClass(key.type)">{{ key.type }}</span>
              </span>
            </div>
            <div class="btn-group">
              <button v-if="key.type === 'object'" 
                      type="button" 
                      class="btn btn-sm btn-outline-info"
                      @click="addNestedProperty(key.path)"
                      :title="'Add property to ' + key.name">
                <i class="fas fa-plus"></i>
              </button>
              <button type="button" 
                      class="btn btn-sm btn-outline-danger"
                      @click="deleteKey(key.path)"
                      :title="'Delete property: ' + key.name">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="mt-2">
            <div class="input-group input-group-sm">
              <input type="text" 
                     class="form-control bg-dark text-white border-secondary"
                     placeholder="Add new property name"
                     v-model="newKeyName"
                     @keydown.enter="addNewKey">
              <select v-model="newKeyType" class="form-select bg-dark text-white border-secondary">
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
              </select>
              <button type="button" 
                      class="btn btn-outline-success"
                      @click="addNewKey"
                      :disabled="!newKeyName.trim()">
                <i class="fas fa-plus"></i> Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  emits: ["data"],
  data() {
    return {
      jsonString: "",
      isValidJson: true,
      jsonError: "",
      isLocked: true,
      showKeyManager: false,
      newKeyName: "",
      newKeyType: "string",
      nestedKeyPath: null,
      nestedKeyName: ""
    }
  },
  props: {
    insert: {
      type: [String, Object],
      required: false,
      default: () => ({})
    },
    placeholder: {
      type: String,
      required: false,
      default: "Enter JSON..."
    },
    label: {
      type: String,
      required: false,
      default: "JSON Data"
    },
    minHeight: {
      type: String,
      required: false,
      default: "150px"
    }
  },
  computed: {
    editorStyle() {
      return {
        minHeight: this.minHeight,
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        fontSize: '13px',
        lineHeight: '1.4',
        tabSize: '2'
      };
    },
    
    parsedKeys() {
      if (!this.isValidJson || !this.jsonString.trim()) {
        return [];
      }
      
      try {
        const parsed = JSON.parse(this.jsonString);
        return this.flattenObjectKeys(parsed);
      } catch (error) {
        // Invalid JSON
      }
      
      return [];
    }
  },
  methods: {
    onInput() {
      if (!this.isLocked) {
        this.validateJson();
        this.emitData();
      }
    },
    
    toggleLock() {
      this.isLocked = !this.isLocked;
      if (this.isLocked) {
        this.showKeyManager = false;
      }
    },
    
    deleteKey(keyPath) {
      if (!this.isValidJson || this.isLocked) return;
      
      try {
        const parsed = JSON.parse(this.jsonString);
        this.deleteNestedKey(parsed, keyPath);
        this.jsonString = JSON.stringify(parsed, null, 2);
        this.onInput();
      } catch (error) {
        console.error('Failed to delete key:', error);
      }
    },
    
    addNewKey() {
      if (!this.newKeyName.trim() || this.isLocked) return;
      
      try {
        const parsed = JSON.parse(this.jsonString || '{}');
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          const value = this.getDefaultValueForType(this.newKeyType);
          parsed[this.newKeyName.trim()] = value;
          this.jsonString = JSON.stringify(parsed, null, 2);
          this.newKeyName = "";
          this.newKeyType = "string";
          this.onInput();
        }
      } catch (error) {
        console.error('Failed to add key:', error);
      }
    },
    
    validateJson() {
      if (!this.jsonString.trim()) {
        this.isValidJson = true;
        this.jsonError = "";
        return;
      }
      
      try {
        JSON.parse(this.jsonString);
        this.isValidJson = true;
        this.jsonError = "";
      } catch (error) {
        this.isValidJson = false;
        this.jsonError = error.message;
      }
    },
    
    emitData() {
      if (this.isValidJson && this.jsonString.trim()) {
        try {
          const parsed = JSON.parse(this.jsonString);
          this.$emit("data", parsed);
        } catch (error) {
          this.$emit("data", {});
        }
      } else {
        this.$emit("data", {});
      }
    },
    
    formatJson() {
      if (!this.isValidJson) return;
      
      try {
        const parsed = JSON.parse(this.jsonString);
        this.jsonString = JSON.stringify(parsed, null, 2);
      } catch (error) {
        console.error("Failed to format JSON:", error);
      }
    },
    
    minifyJson() {
      if (!this.isValidJson) return;
      
      try {
        const parsed = JSON.parse(this.jsonString);
        this.jsonString = JSON.stringify(parsed);
      } catch (error) {
        console.error("Failed to minify JSON:", error);
      }
    },
    
    onKeyDown(event) {
      if (this.isLocked) {
        event.preventDefault();
        return;
      }
      
      // Handle Tab key for proper indentation
      if (event.key === 'Tab') {
        event.preventDefault();
        const textarea = this.$refs.editor;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        
        if (event.shiftKey) {
          // Shift+Tab: Remove indentation
          const lineStart = value.lastIndexOf('\n', start - 1) + 1;
          const lineContent = value.substring(lineStart, start);
          if (lineContent.startsWith('  ')) {
            textarea.value = value.substring(0, lineStart) + 
                           lineContent.substring(2) + 
                           value.substring(start);
            textarea.selectionStart = textarea.selectionEnd = start - 2;
          }
        } else {
          // Tab: Add indentation
          textarea.value = value.substring(0, start) + '  ' + value.substring(end);
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }
        
        this.jsonString = textarea.value;
        this.onInput();
      }
      
      // Auto-complete brackets and quotes
      if (event.key === '{') {
        this.insertAutoComplete('{', '}');
      } else if (event.key === '[') {
        this.insertAutoComplete('[', ']');
      } else if (event.key === '"') {
        this.insertAutoComplete('"', '"');
      }
    },
    
    insertAutoComplete(open, close) {
      setTimeout(() => {
        const textarea = this.$refs.editor;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        
        if (start === end) {
          textarea.value = value.substring(0, start) + close + value.substring(start);
          textarea.selectionStart = textarea.selectionEnd = start;
          this.jsonString = textarea.value;
        }
      }, 0);
    },
    
    setValue(value) {
      if (typeof value === 'object' && value !== null) {
        this.jsonString = JSON.stringify(value, null, 2);
      } else if (typeof value === 'string') {
        this.jsonString = value;
      } else {
        this.jsonString = "";
      }
      this.validateJson();
    },
    
    addNestedProperty(parentPath) {
      const propertyName = prompt('Enter property name:');
      if (!propertyName || !propertyName.trim()) return;
      
      const propertyType = prompt('Enter property type (string, number, boolean, object, array):', 'string');
      if (!propertyType) return;
      
      try {
        const parsed = JSON.parse(this.jsonString);
        const parentObject = this.getObjectByPath(parsed, parentPath);
        
        if (parentObject && typeof parentObject === 'object' && !Array.isArray(parentObject)) {
          const value = this.getDefaultValueForType(propertyType);
          parentObject[propertyName.trim()] = value;
          this.jsonString = JSON.stringify(parsed, null, 2);
          this.onInput();
        }
      } catch (error) {
        console.error('Failed to add nested property:', error);
      }
    },
    
    flattenObjectKeys(obj, parentPath = '', depth = 0) {
      const keys = [];
      
      if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = parentPath ? `${parentPath}.${key}` : key;
          const type = this.getValueType(value);
          
          keys.push({
            name: key,
            path: currentPath,
            type: type,
            depth: depth
          });
          
          // If it's an object, recursively add its keys
          if (type === 'object') {
            keys.push(...this.flattenObjectKeys(value, currentPath, depth + 1));
          }
        }
      }
      
      return keys;
    },
    
    getValueType(value) {
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'array';
      if (typeof value === 'object') return 'object';
      return typeof value;
    },
    
    getTypeClass(type) {
      switch (type) {
        case 'string': return 'bg-success';
        case 'number': return 'bg-primary';
        case 'boolean': return 'bg-warning text-dark';
        case 'object': return 'bg-info text-dark';
        case 'array': return 'bg-secondary';
        case 'null': return 'bg-dark';
        default: return 'bg-light text-dark';
      }
    },
    
    getDefaultValueForType(type) {
      switch (type) {
        case 'string': return '';
        case 'number': return 0;
        case 'boolean': return false;
        case 'object': return {};
        case 'array': return [];
        default: return '';
      }
    },
    
    getObjectByPath(obj, path) {
      const keys = path.split('.');
      let current = obj;
      
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return null;
        }
      }
      
      return current;
    },
    
    deleteNestedKey(obj, path) {
      const keys = path.split('.');
      const lastKey = keys.pop();
      let current = obj;
      
      // Navigate to the parent object
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return false;
        }
      }
      
      // Delete the property
      if (current && typeof current === 'object' && lastKey in current) {
        delete current[lastKey];
        return true;
      }
      
      return false;
    }
  },
  watch: {
    insert: {
      handler: function (newValue) {
        if (newValue !== undefined) {
          this.setValue(newValue);
        }
      },
      immediate: true
    }
  },
  mounted() {
    if (this.insert !== undefined) {
      this.setValue(this.insert);
    }
  }
}; 