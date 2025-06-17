/**
 * Secure NFT Script Executor
 * 
 * This module provides a safe way to execute user-defined generative NFT scripts
 * using a sandboxed iframe to prevent security vulnerabilities.
 * 
 * SECURITY-FIRST DESIGN:
 * - ALL NFT scripts execute ONLY in sandboxed iframes
 * - NO fallback to direct eval() execution 
 * - NO access to parent window, cookies, localStorage, or sensitive APIs
 * - Generative NFTs generate HTML content safely returned via window messaging
 * 
 * If secure execution fails, NFT scripts will NOT execute rather than fall back
 * to dangerous direct execution methods.
 */

class NFTScriptExecutor {
    constructor() {
        this.scriptCache = new Map();
        this.executionPromises = new Map();
        this.iframe = null;
        this.iframeReady = false;
        this.initSandbox();
    }

    /**
     * Initialize the sandboxed iframe for script execution
     */
    initSandbox() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createIframe());
        } else {
            this.createIframe();
        }

        // Listen for results from the sandbox
        window.addEventListener('message', (e) => {
            if (this.iframe && e.source === this.iframe.contentWindow) {
                const { success, result, html, error, executionId } = e.data;
                const promise = this.executionPromises.get(executionId);
                
                if (promise) {
                    this.executionPromises.delete(executionId);
                    if (success) {
                        console.log('🎨 Secure NFT execution result:', { result, html, executionId });
                        
                        // Extract HTML from result if not captured separately
                        let finalHtml = html;
                        if (!finalHtml && result && typeof result === 'object') {
                            finalHtml = result.HTML || result.html || result.content || result.body || result.output || '';
                        }
                        
                        // Include HTML content in the result
                        const enhancedResult = {
                            ...result,
                            html: finalHtml || result.html || result
                        };
                        promise.resolve(enhancedResult);
                    } else {
                        promise.reject(new Error(error));
                    }
                }
            }
        });
    }

    createIframe() {
        // Create a sandboxed iframe
        this.iframe = document.createElement('iframe');
        this.iframe.style.display = 'none';
        this.iframe.setAttribute('sandbox', 'allow-scripts'); // Very restrictive sandbox
        
        // Create the iframe content for generative NFT execution
        this.iframe.src = 'data:text/html,<!DOCTYPE html><html><head></head><body><script>' +
            'window.addEventListener("message", function(e) {' +
                'try {' +
                    'const script = e.data.script;' +
                    'const uid = e.data.uid || "0";' +
                    '/* Execute generative NFT script */' +
                    'const code = "(//" + script + "\\n)(\\"" + uid + "\\")";' +
                    'const result = eval(code);' +
                    '' +
                    '/* Check if result contains HTML or is HTML itself */' +
                    'let htmlContent = "";' +
                    'if (typeof result === "string") {' +
                        'htmlContent = result;' +
                    '} else if (result && typeof result === "object") {' +
                        '/* Try to extract HTML from various property names */' +
                        'htmlContent = result.HTML || result.html || result.content || result.body || result.output || "";' +
                    '}' +
                    '' +
                    '/* Also capture any DOM changes made by the script */' +
                    'const bodyHTML = document.body.innerHTML;' +
                    'if (bodyHTML && bodyHTML.trim() !== "" && !bodyHTML.includes("window.addEventListener")) {' +
                        'htmlContent = bodyHTML;' +
                    '}' +
                    '' +
                    'e.source.postMessage({' +
                        'success: true,' +
                        'result: result,' +
                        'html: htmlContent,' +
                        'executionId: e.data.executionId' +
                    '}, "*");' +
                '} catch (error) {' +
                    'e.source.postMessage({' +
                        'success: false,' +
                        'error: error.message,' +
                        'executionId: e.data.executionId' +
                    '}, "*");' +
                '}' +
            '});' +
            '</script></body></html>';
        
        document.body.appendChild(this.iframe);
        this.iframeReady = true;
    }

    /**
     * Fetch and cache a script from IPFS
     * @param {string} scriptId - The IPFS hash of the script
     * @returns {Promise<string>} The script content
     */
    async pullScript(scriptId) {
        if (this.scriptCache.has(scriptId)) {
            return this.scriptCache.get(scriptId);
        }

        try {
            const response = await fetch(`https://ipfs.dlux.io/ipfs/${scriptId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch script: ${response.status}`);
            }
            
            const scriptContent = await response.text();
            
            // Basic validation - ensure it's not obviously malicious
            if (this.isScriptSafe(scriptContent)) {
                this.scriptCache.set(scriptId, scriptContent);
                return scriptContent;
            } else {
                throw new Error('Script failed safety validation');
            }
        } catch (error) {
            console.error('Failed to fetch script:', scriptId, error);
            throw error;
        }
    }

    /**
     * Basic safety validation for scripts
     * @param {string} script - The script content to validate
     * @returns {boolean} Whether the script passes basic safety checks
     */
    isScriptSafe(script) {
        // Allow script tags and most content for generative NFTs
        // Only block the most dangerous patterns
        
        const criticalPatterns = [
            /javascript:\s*eval\(/i,
            /data:text\/html.*javascript:/i,
            /document\.cookie/i,
            /localStorage\.clear/i,
            /sessionStorage\.clear/i,
            /window\.location\s*=/i,
            /location\.href\s*=/i
        ];

        for (const pattern of criticalPatterns) {
            if (pattern.test(script)) {
                console.warn('Script contains dangerous pattern:', pattern);
                return false;
            }
        }

        return true;
    }

    /**
     * Execute an NFT script safely in the sandbox
     * @param {Object} nftData - NFT data containing script, uid, owner, etc.
     * @returns {Promise<Object>} The computed NFT data
     */
    async callScript(nftData) {
        const { script: scriptId, uid, owner, set, token } = nftData;
        
        if (!scriptId) {
            throw new Error('No script ID provided');
        }

        try {
            // Wait for iframe to be ready
            if (!this.iframeReady || !this.iframe) {
                await this.waitForIframe();
            }

            // Get the script content
            const scriptContent = await this.pullScript(scriptId);
            
            // Execute in secure sandbox only
            console.log('✅ NFT Script Executor: Using secure sandbox execution');
            return await this.executeInSandbox(scriptContent, nftData);

        } catch (error) {
            console.error('NFT script execution failed:', error);
            throw error;
        }
    }

    async waitForIframe() {
        return new Promise((resolve) => {
            const checkIframe = () => {
                if (this.iframeReady && this.iframe) {
                    resolve();
                } else {
                    setTimeout(checkIframe, 100);
                }
            };
            checkIframe();
        });
    }

    async executeInSandbox(scriptContent, nftData) {
        const { script: scriptId, uid, owner, set, token } = nftData;
        
        console.log('🔒 Executing NFT script in secure sandbox:', scriptId);
        
        // Generate unique execution ID
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create promise for this execution
        const executionPromise = new Promise((resolve, reject) => {
            this.executionPromises.set(executionId, { resolve, reject });
            
            // Set timeout to prevent hanging
            setTimeout(() => {
                if (this.executionPromises.has(executionId)) {
                    this.executionPromises.delete(executionId);
                    reject(new Error('Script execution timeout'));
                }
            }, 5000); // 5 second timeout
        });

        // Send script to sandbox for execution
        this.iframe.contentWindow.postMessage({
            script: scriptContent,
            uid: uid || '0',
            executionId: executionId
        }, '*');

        // Wait for result
        const result = await executionPromise;

        // Enhance result with NFT metadata
        const computed = {
            ...result,
            uid: uid || '',
            owner: owner || '',
            script: scriptId,
            setname: set,
            token: token
        };

        return computed;
    }

    

    /**
     * Clean up resources
     */
    destroy() {
        if (this.iframe) {
            document.body.removeChild(this.iframe);
            this.iframe = null;
        }
        this.scriptCache.clear();
        this.executionPromises.clear();
    }
}

// Initialize global instance - secure execution only
if (typeof window !== 'undefined') {
    try {
        const nftScriptExecutor = new NFTScriptExecutor();
        window.NFTScriptExecutor = nftScriptExecutor;
        console.log('✅ NFT Script Executor initialized successfully - secure execution only');
    } catch (error) {
        console.error('❌ Failed to initialize NFT Script Executor:', error);
        console.error('🚫 NFT scripts will not be available - no fallback execution allowed');
        // Do not provide any fallback - fail securely
        window.NFTScriptExecutor = null;
    }
} else {
    console.warn('Window object not available, NFT Script Executor not initialized');
} 