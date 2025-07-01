// Video Transcoder Web Worker
// Handles FFmpeg transcoding operations off the main thread

import { ffmpegManager } from '../services/ffmpeg-manager.js';
import debugLogger from '../utils/debug-logger.js';

class VideoTranscoderWorker {
    constructor() {
        this.isInitialized = false;
        this.currentOperation = null;
    }

    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            await ffmpegManager.load();
            this.isInitialized = true;
            debugLogger.info('🔧 Video Transcoder Worker initialized');
            
            // Send performance info back to main thread
            const performanceInfo = ffmpegManager.getPerformanceInfo();
            self.postMessage({
                type: 'initialized',
                data: { performanceInfo }
            });
            
        } catch (error) {
            debugLogger.error('❌ Worker initialization failed:', error);
            self.postMessage({
                type: 'error',
                data: { message: 'Failed to initialize FFmpeg in worker', error: error.message }
            });
        }
    }

    async transcodeResolution(data) {
        const { 
            inputData, 
            inputName, 
            resolution, 
            sessionId, 
            encodingOptions,
            operationId 
        } = data;

        this.currentOperation = operationId;

        try {
            // Write input file
            await ffmpegManager.writeFile(inputName, inputData);
            
            // Build FFmpeg command
            const commands = this.buildFFmpegCommand(
                inputName,
                resolution.width,
                resolution.height,
                resolution.bitrate,
                sessionId,
                encodingOptions
            );

            debugLogger.debug(`🎬 Worker transcoding ${resolution.height}p:`, commands.join(' '));

            // Set up progress tracking
            const progressUnsubscribe = ffmpegManager.onProgress(({ progress, time }) => {
                if (this.currentOperation === operationId) {
                    self.postMessage({
                        type: 'progress',
                        data: { 
                            operationId,
                            resolution: resolution.height,
                            progress: Math.round(progress * 100),
                            time 
                        }
                    });
                }
            });

            // Execute FFmpeg command
            await ffmpegManager.exec(commands);

            // Clean up progress listener
            progressUnsubscribe();

            // Wait for files to be written
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Read generated files
            const fileList = await ffmpegManager.listDir('/');
            const segmentFiles = fileList.filter(f => 
                f.name.startsWith(`${sessionId}_${resolution.height}p_`) && f.name.endsWith('.ts')
            );
            const playlistFile = fileList.find(f => 
                f.name === `${sessionId}_${resolution.height}p_index.m3u8`
            );

            if (!playlistFile || segmentFiles.length === 0) {
                throw new Error(`No output files generated for ${resolution.height}p`);
            }

            // Extract file data
            const extractedFiles = new Map();
            
            // Extract segments
            for (const segFile of segmentFiles) {
                const segData = await ffmpegManager.readFile(segFile.name);
                const finalSegmentName = segFile.name.replace(`${sessionId}_`, '');
                extractedFiles.set(finalSegmentName, segData.slice());
            }

            // Extract playlist
            const playlistData = await ffmpegManager.readFile(playlistFile.name);
            const playlistText = new TextDecoder().decode(playlistData);
            const updatedPlaylistText = playlistText.replace(
                new RegExp(`${sessionId}_`, 'g'),
                ''
            );
            const updatedPlaylistData = new TextEncoder().encode(updatedPlaylistText);
            const finalPlaylistName = playlistFile.name.replace(`${sessionId}_`, '');
            extractedFiles.set(finalPlaylistName, updatedPlaylistData);

            // Clean up temporary files
            for (const segFile of segmentFiles) {
                await ffmpegManager.deleteFile(segFile.name);
            }
            await ffmpegManager.deleteFile(playlistFile.name);
            await ffmpegManager.deleteFile(inputName);

            // Send results back to main thread
            self.postMessage({
                type: 'resolution-complete',
                data: {
                    operationId,
                    resolution,
                    extractedFiles: Array.from(extractedFiles.entries())
                }
            });

        } catch (error) {
            debugLogger.error(`❌ Worker transcoding failed for ${resolution.height}p:`, error);
            self.postMessage({
                type: 'error',
                data: {
                    operationId,
                    resolution,
                    message: `Transcoding failed for ${resolution.height}p`,
                    error: error.message
                }
            });
        }
    }

    buildFFmpegCommand(inputName, resWidth, resHeight, bitrate, sessionId, options) {
        const commands = ['-i', inputName, '-c:v', 'libx264'];
        
        // Add encoding speed preset
        switch (options.encodingSpeed) {
            case 'fast':
                commands.push('-preset', 'veryfast');
                break;
            case 'ultrafast':
                commands.push('-preset', 'ultrafast');
                break;
            default:
                commands.push('-preset', 'fast');
        }
        
        // Quality mode settings
        if (options.qualityMode === 'crf') {
            const crfValue = this.getCRFForResolution(resHeight);
            commands.push('-crf', crfValue.toString());
            commands.push('-maxrate', `${Math.round(bitrate * 1.2)}k`);
            commands.push('-bufsize', `${Math.round(bitrate * 1.5)}k`);
        } else {
            commands.push('-b:v', `${Math.round(bitrate)}k`);
            commands.push('-maxrate', `${Math.round(bitrate * 1.5)}k`);
            commands.push('-bufsize', `${Math.round(bitrate * 2)}k`);
        }
        
        // Video settings
        commands.push(
            '-vf', `scale=${resWidth}:${resHeight}`,
            '-c:a', 'aac',
            '-b:a', '128k',
            '-profile:v', 'main'
        );
        
        // Performance optimizations
        if (options.encodingSpeed === 'ultrafast') {
            commands.push(
                '-x264-params', 'nal-hrd=cbr:force-cfr=1',
                '-max_muxing_queue_size', '2048'
            );
        } else {
            commands.push('-max_muxing_queue_size', '1024');
        }
        
        // Threading
        if (options.isMultiThreaded) {
            commands.push('-threads', '0');
        } else {
            commands.push('-threads', '1');
        }
        
        // HLS settings
        commands.push(
            '-f', 'segment',
            '-segment_time', '5',
            '-segment_format', 'mpegts',
            '-segment_list_type', 'm3u8',
            '-segment_list', `${sessionId}_${resHeight}p_index.m3u8`,
            '-hls_time', '3',
            '-hls_list_size', '0',
            '-force_key_frames', 'expr:gte(t,n_forced*3)',
            `${sessionId}_${resHeight}p_%03d.ts`
        );
        
        return commands;
    }

    getCRFForResolution(height) {
        switch (height) {
            case 480: return 28;
            case 720: return 25;
            case 1080: return 23;
            default: return 25;
        }
    }
}

// Worker message handler
const worker = new VideoTranscoderWorker();

self.onmessage = async function(e) {
    const { type, data } = e.data;
    
    try {
        switch (type) {
            case 'initialize':
                await worker.initialize();
                break;
                
            case 'transcode-resolution':
                await worker.transcodeResolution(data);
                break;
                
            case 'terminate':
                self.close();
                break;
                
            default:
                debugLogger.warn('Unknown worker message type:', type);
        }
    } catch (error) {
        debugLogger.error('Worker error:', error);
        self.postMessage({
            type: 'error',
            data: { message: error.message, error: error.toString() }
        });
    }
};

// Handle worker errors
self.onerror = function(error) {
    debugLogger.error('Worker runtime error:', error);
    self.postMessage({
        type: 'error',
        data: { message: 'Worker runtime error', error: error.toString() }
    });
};