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
        if (!window.DluxVideoPlayer) {
          console.warn('🚨 Vue Video Mixin: DluxVideoPlayer not available - video enhancement skipped');
          return;
        }
        
        // Universal approach: Search entire document for unenhanced videos
        // This handles component content, teleported modals, and any future video contexts
        
        // Helper function to detect TipTap videos to prevent conflicts
        const isTipTapVideo = (video) => {
          return video.hasAttribute('data-tiptap-video') ||
                 video.closest('.dlux-video-container') ||
                 (video.classList.contains('video-js') && 
                  (video.classList.contains('vjs-default-skin') || 
                   video.classList.contains('vjs-big-play-centered'))) ||
                 (video.id && video.id.startsWith('dlux-video-')) ||
                 video._dluxVideoPlayer ||
                 video.player;
        };
        
        // Global search for all unenhanced videos (like MutationObserver but Vue-triggered)
        const videos = document.querySelectorAll('video:not([data-dlux-enhanced])');
        
        videos.forEach((video) => {
          // Skip TipTap videos to prevent double processing (but only if already enhanced)
          if (isTipTapVideo(video) && video.hasAttribute('data-dlux-enhanced')) {
            return;
          }
          
          // Skip videos that are not in the DOM
          if (!document.contains(video)) {
            return;
          }
          
          try {
            // Enhance the video with DLUX Video Player
            window.DluxVideoPlayer.enhanceVideoElement(video).catch(error => {
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
      if (!window.DluxVideoPlayer) {
        return;
      }
      
      // Note: Global cleanup could be aggressive, but components are responsible for their own videos
      // For now, only clean up videos that were enhanced by this component instance
      // This is a conservative approach to avoid interfering with other components
      
      const componentVideos = document.querySelectorAll('video[data-dlux-enhanced="true"]');
      componentVideos.forEach(video => {
        // Only cleanup if this video doesn't have an active component managing it
        if (!video.closest('[data-vue-app]')) {
          try {
            window.DluxVideoPlayer.destroyPlayer(video);
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