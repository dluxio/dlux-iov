/**
 * ProcessedFile - Wrapper class for files generated by processors
 * Carries metadata about file role and relationships through the upload pipeline
 */
export class ProcessedFile {
    constructor(file, metadata = {}) {
        if (!file || !(file instanceof File)) {
            throw new Error('ProcessedFile requires a valid File object');
        }
        
        this.file = file;
        this.isAuxiliary = metadata.isAuxiliary || false;
        this.role = metadata.role || 'file';
        this.parentFile = metadata.parentFile || null;
        this.processorId = metadata.processorId || null;
        this.metadata = metadata; // Store any additional metadata
    }
    
    /**
     * Get the wrapped File object
     */
    getFile() {
        return this.file;
    }
    
    /**
     * Check if this is a main file (shown to users)
     */
    isMainFile() {
        return !this.isAuxiliary;
    }
    
    /**
     * Get all metadata
     */
    getMetadata() {
        return {
            isAuxiliary: this.isAuxiliary,
            role: this.role,
            parentFile: this.parentFile,
            processorId: this.processorId,
            ...this.metadata
        };
    }
    
    /**
     * Get file name
     */
    get name() {
        return this.file.name;
    }
    
    /**
     * Get file size
     */
    get size() {
        return this.file.size;
    }
    
    /**
     * Get file type
     */
    get type() {
        return this.file.type;
    }
}

// File roles for consistency across processors
export const FileRoles = {
    // Main files
    PLAYLIST: 'playlist',
    VIDEO: 'video',
    IMAGE: 'image',
    DOCUMENT: 'document',
    
    // Auxiliary files
    SEGMENT: 'segment',
    POSTER: 'poster',
    THUMBNAIL: 'thumbnail',
    PREVIEW: 'preview',
    OPTIMIZATION: 'optimization',
    SUBTITLE: 'subtitle'
};

export default ProcessedFile;