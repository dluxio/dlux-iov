// Playlist Processor Service
// Updates M3U8 playlists with IPFS URLs after segments are uploaded

import debugLogger from '../utils/debug-logger.js';

class PlaylistProcessor {
    constructor() {
        this.ipfsGateway = 'https://ipfs.dlux.io/ipfs/';
    }
    
    /**
     * Process a set of files to update any M3U8 playlists with IPFS URLs
     * @param {Array} files - Array of file objects with name and enc_hash properties
     * @returns {Promise<Object>} Updated files object
     */
    async processFiles(files) {
        // Create a map of filenames to IPFS hashes for quick lookup
        const fileHashMap = new Map();
        const m3u8Files = [];
        
        // First pass: build hash map and identify playlists
        files.forEach(file => {
            if (file.name && file.enc_hash) {
                fileHashMap.set(file.name, file.enc_hash);
                
                if (file.name.endsWith('.m3u8')) {
                    m3u8Files.push(file);
                }
            }
        });
        
        // If no playlists found, return original files
        if (m3u8Files.length === 0) {
            debugLogger.debug('PlaylistProcessor: No M3U8 files found to process');
            return files;
        }
        
        debugLogger.info(`PlaylistProcessor: Found ${m3u8Files.length} playlist(s) to process`);
        
        // Process each playlist
        for (const playlistFile of m3u8Files) {
            try {
                await this.updatePlaylist(playlistFile, fileHashMap);
            } catch (error) {
                debugLogger.error(`PlaylistProcessor: Error processing ${playlistFile.name}:`, error);
            }
        }
        
        return files;
    }
    
    /**
     * Update a single M3U8 playlist with IPFS URLs
     * @param {Object} playlistFile - The playlist file object
     * @param {Map} fileHashMap - Map of filenames to IPFS hashes
     */
    async updatePlaylist(playlistFile, fileHashMap) {
        debugLogger.debug(`PlaylistProcessor: Processing playlist ${playlistFile.name}`);
        
        // Check if we have the playlist content
        if (!playlistFile.content && !playlistFile.buffer && !playlistFile.data) {
            debugLogger.error(`PlaylistProcessor: No content found for ${playlistFile.name}`);
            return;
        }
        
        // Get the playlist content as text
        let playlistContent = '';
        
        if (playlistFile.content) {
            playlistContent = playlistFile.content;
        } else if (playlistFile.buffer) {
            playlistContent = new TextDecoder().decode(playlistFile.buffer);
        } else if (playlistFile.data) {
            if (typeof playlistFile.data === 'string') {
                playlistContent = playlistFile.data;
            } else {
                playlistContent = new TextDecoder().decode(playlistFile.data);
            }
        }
        
        if (!playlistContent) {
            debugLogger.error(`PlaylistProcessor: Could not extract content from ${playlistFile.name}`);
            return;
        }
        
        // Count replacements for logging
        let replacementCount = 0;
        
        // Process each line of the playlist
        const lines = playlistContent.split('\n');
        const updatedLines = lines.map(line => {
            // Skip empty lines and M3U8 directives
            if (!line.trim() || line.startsWith('#')) {
                return line;
            }
            
            // This line should be a segment reference
            const segmentName = line.trim();
            
            // Check if we have this segment in our hash map
            if (fileHashMap.has(segmentName)) {
                const hash = fileHashMap.get(segmentName);
                const ipfsUrl = `${this.ipfsGateway}${hash}`;
                replacementCount++;
                debugLogger.debug(`PlaylistProcessor: Replaced ${segmentName} with ${ipfsUrl}`);
                return ipfsUrl;
            }
            
            // If not found, check for common variations
            // Handle both segments (.ts) and variant playlists (.m3u8)
            for (const [fileName, hash] of fileHashMap) {
                if ((fileName.endsWith('.ts') || fileName.endsWith('.m3u8')) && 
                    (segmentName === fileName || 
                     segmentName.endsWith(fileName) ||
                     fileName.endsWith(segmentName))) {
                    const ipfsUrl = `${this.ipfsGateway}${hash}`;
                    replacementCount++;
                    const fileType = fileName.endsWith('.m3u8') ? 'playlist' : 'segment';
                    debugLogger.debug(`PlaylistProcessor: Replaced ${segmentName} with ${ipfsUrl} (fuzzy match - ${fileType}`);
                    return ipfsUrl;
                }
            }
            
            debugLogger.debug(`PlaylistProcessor: No hash found for reference ${segmentName}`);
            return line;
        });
        
        // Join the lines back together
        const updatedContent = updatedLines.join('\n');
        
        // Update the playlist file with new content
        const encoder = new TextEncoder();
        const updatedData = encoder.encode(updatedContent);
        
        // Update the file object
        if (playlistFile.content !== undefined) {
            playlistFile.content = updatedContent;
        }
        if (playlistFile.buffer !== undefined) {
            playlistFile.buffer = updatedData.buffer;
        }
        if (playlistFile.data !== undefined) {
            playlistFile.data = updatedData;
        }
        
        // Update size if present
        if (playlistFile.size !== undefined) {
            playlistFile.size = updatedData.length;
        }
        
        debugLogger.info(`PlaylistProcessor: Updated ${replacementCount} segment references in ${playlistFile.name}`);
    }
    
    /**
     * Process files array specifically for video transcoder output
     * This handles the File objects that come from the video transcoder
     * @param {Array<File>} files - Array of File objects from transcoder
     * @param {Object} fileInfoMap - Map of file names to FileInfo objects with enc_hash
     * @returns {Promise<Array<File>>} Updated File objects
     */
    async processTranscodedFiles(files, fileInfoMap) {
        const fileHashMap = new Map();
        const m3u8Files = [];
        
        // Build hash map from FileInfo
        Object.entries(fileInfoMap).forEach(([name, info]) => {
            if (info.enc_hash) {
                fileHashMap.set(name, info.enc_hash);
            }
        });
        
        // Identify M3U8 files
        files.forEach(file => {
            if (file.name.endsWith('.m3u8')) {
                m3u8Files.push(file);
            }
        });
        
        if (m3u8Files.length === 0) {
            return files;
        }
        
        debugLogger.info(`PlaylistProcessor: Processing ${m3u8Files.length} transcoded playlist(s)`);
        
        // Process each playlist File object
        for (const playlistFile of m3u8Files) {
            try {
                // Read the File content
                const content = await this.readFileAsText(playlistFile);
                
                // Process the content
                const updatedContent = this.updatePlaylistContent(content, fileHashMap);
                
                // Create a new File with updated content
                const updatedFile = new File([updatedContent], playlistFile.name, {
                    type: playlistFile.type || 'application/x-mpegURL'
                });
                
                // Replace the original file in the array
                const index = files.indexOf(playlistFile);
                if (index !== -1) {
                    files[index] = updatedFile;
                }
                
            } catch (error) {
                debugLogger.error(`PlaylistProcessor: Error processing transcoded ${playlistFile.name}:`, error);
            }
        }
        
        return files;
    }
    
    /**
     * Read a File object as text
     * @param {File} file - File object to read
     * @returns {Promise<string>} File content as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    /**
     * Update playlist content with IPFS URLs
     * @param {string} content - Playlist content
     * @param {Map} fileHashMap - Map of filenames to IPFS hashes
     * @returns {string} Updated playlist content
     */
    updatePlaylistContent(content, fileHashMap) {
        const lines = content.split('\n');
        let replacementCount = 0;
        
        const updatedLines = lines.map(line => {
            // Skip empty lines and M3U8 directives
            if (!line.trim() || line.startsWith('#')) {
                return line;
            }
            
            // This line should be a segment reference
            const segmentName = line.trim();
            
            // Check if we have this segment in our hash map
            if (fileHashMap.has(segmentName)) {
                const hash = fileHashMap.get(segmentName);
                const ipfsUrl = `${this.ipfsGateway}${hash}`;
                replacementCount++;
                return ipfsUrl;
            }
            
            // Fuzzy matching for segments and playlists
            for (const [fileName, hash] of fileHashMap) {
                if ((fileName.endsWith('.ts') || fileName.endsWith('.m3u8')) && 
                    (segmentName === fileName || 
                     segmentName.endsWith(fileName) ||
                     fileName.endsWith(segmentName))) {
                    const ipfsUrl = `${this.ipfsGateway}${hash}`;
                    replacementCount++;
                    return ipfsUrl;
                }
            }
            
            return line;
        });
        
        debugLogger.info(`PlaylistProcessor: Replaced ${replacementCount} segment references`);
        return updatedLines.join('\n');
    }
}

// Create and export singleton instance
const playlistProcessor = new PlaylistProcessor();

export { playlistProcessor, PlaylistProcessor };