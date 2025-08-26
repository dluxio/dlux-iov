// Vue Video Enhancement Mixin
// Provides modular video player enhancement for Vue components
// Based on marker.js pattern with best practices

export default {
  mounted() {
    this.enhanceVideos();
  },
  
  updated() {
    // Re-enhance videos when component content changes
    this.enhanceVideos();
  },
  
  beforeUnmount() {
    // Clean up video players when component is destroyed
    this.cleanupVideos();
  },
  
  methods: {
    enhanceVideos() {
      // Wait for DOM to update
      this.$nextTick(() => {
        if (!window.IPFSHLSPlayer) {
          console.warn('🚨 Vue Video Mixin: IPFSHLSPlayer not available - video enhancement skipped');
          return;
        }
        
        // Use the IPFS HLS Player
        const VideoPlayer = window.IPFSHLSPlayer;
        
        // Universal approach: Search entire document for unenhanced videos
        // This handles component content, teleported modals, and any future video contexts
        
        // Helper function to detect TipTap videos to prevent conflicts
        const isTipTapVideo = (video) => {
          return video.hasAttribute('data-tiptap-video') ||
                 video.closest('.ipfs-video-container') ||
                 (video.classList.contains('video-js') && 
                  (video.classList.contains('vjs-default-skin') || 
                   video.classList.contains('vjs-big-play-centered'))) ||
                 (video.id && video.id.startsWith('ipfs-video-')) ||
                 video._ipfsHLSPlayer ||
                 video.player;
        };
        
        // Global search for all unenhanced videos (like MutationObserver but Vue-triggered)
        const videos = document.querySelectorAll('video:not([data-ipfs-enhanced])');
        
        videos.forEach((video) => {
          // Skip TipTap videos - they manage their own enhancement
          if (isTipTapVideo(video)) {
            return;
          }
          
          // Skip videos that are not in the DOM
          if (!document.contains(video)) {
            return;
          }
          
          try {
            // Get type hint from data attribute if available
            const typeHint = video.dataset.videoType || undefined;
            
            // Enhance the video with IPFS HLS Player, passing type if available
            const options = typeHint ? { type: typeHint } : {};
            
            VideoPlayer.enhanceVideoElement(video, options).catch(error => {
              console.error('🚨 Vue Video Mixin: Failed to enhance video:', video.id || 'no-id', error);
            });
          } catch (error) {
            console.error('🚨 Vue Video Mixin: Video enhancement error:', video.id || 'no-id', error);
          }
        });
      });
    },
    
    cleanupVideos() {
      // Clean up video players when component is destroyed
      const VideoPlayer = window.IPFSHLSPlayer;
      if (!VideoPlayer) {
        return;
      }
      
      // Note: Global cleanup could be aggressive, but components are responsible for their own videos
      // For now, only clean up videos that were enhanced by this component instance
      // This is a conservative approach to avoid interfering with other components
      
      const componentVideos = document.querySelectorAll('video[data-ipfs-enhanced="true"]');
      componentVideos.forEach(video => {
        // Only cleanup if this video doesn't have an active component managing it
        if (!video.closest('[data-vue-app]')) {
          try {
            VideoPlayer.destroyPlayer(video);
          } catch (error) {
            console.error('🚨 Vue Video Mixin: Failed to cleanup video:', video.id || 'no-id', error);
          }
        }
      });
    },
    
    // Manual method for dynamic content (modals, etc.)
    enhanceVideosManually() {
      this.enhanceVideos();
    }
  }
};