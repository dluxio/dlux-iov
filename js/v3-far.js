import { createApp, toRaw } from '/js/vue.esm-browser.js'
import LoginModal from "/js/v3-login-modal.js";
import FootVue from "/js/footvue.js";
import Cycler from "/js/cycler.js";
import Popper from "/js/pop.js";
import Marker from "/js/marker.js";
import Ratings from "/js/ratings.js";
import MDE from "/js/mde.js";
import Replies from "/js/replies.js";
import CardVue from "/js/cardvue.js";
import ContractsVue from "/js/spkdrive.js";
import FilesVue from "/js/filesvue.js";
import ExtensionVue from "/js/extensionvue.js";
import UploadVue from "/js/uploadvue.js";
import PostVue from "/js/postvue.js";
import DetailVue from "/js/detailvue.js";
import MCommon from '/js/methods-common.js';

const HIVE_API = localStorage.getItem("hapi") || "https://api.hive.blog";
const LARYNX_API = "https://spkinstant.hivehoneycomb.com";
const DUAT_API = "https://duat.hivehoneycomb.com";
const DLUX_TOKEN_API = "https://token.dlux.io";
const SPK_TEST_API = "https://spktest.dlux.io";
const DLUX_DATA_API = "https://data.dlux.io";
const COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price";

let url = location.href.replace(/\/$/, "");
let lapi = DLUX_TOKEN_API;
let user = localStorage.getItem("user") || "GUEST";

createApp({
  data() {
    return {
      // Navigation
      currentView: 'home',
      feedType: 'following',
      unreadNotifications: 0,
      activeNotificationTab: 'activity',
      
      // Cast composition
      newCast: '',
      
      // Auth & Account
      account: user,
      userReputation: 0,
      
      // Invites
      accountinfo: {},
      hivestats: {},
      qrCodeGenerated: false,
      claimActHpNeeded: 6714, // Approximate HP needed to claim ACT
      
      // Mini Apps
      userDapps: [],
      topDapps: [],
      dappsLoading: false,
      dappSearchQuery: '',
      appTypeIcons: {
        'VR': '🥽',
        'AR': '📱',
        '3D': '📦',
        'Audio': '🎵',
        'Video': '🎬',
        '360°': '🌐',
        'App': '🚀',
        'Blog': '📝'
      },
      
      // Warps/Honeycomb
      activeToken: 'dlux',
      tokens: {
        dlux: {
          name: 'DLUX',
          api: 'https://token.dlux.io',
          icon: 'fa-solid fa-bolt',
          description: 'DLUX can be used to perform a variety of onchain and DLUX-specific actions.',
          priceEndpoint: '/dex',
          symbol: 'DLUX'
        },
        spk: {
          name: 'SPK',
          api: 'https://spkinstant.hivehoneycomb.com',
          icon: 'fa-solid fa-fire',
          description: 'SPK powers the decentralized media network on Hive.',
          priceEndpoint: '/dex',
          symbol: 'SPK'
        }
      },
      tokenBalances: {
        dlux: 0,
        spk: 0
      },
      tokenPrices: {
        dlux: { hive: 0, usd: 0 },
        spk: { hive: 0, usd: 0 }
      },
      warpsBalance: 0, // For backward compatibility
      selectedWarpAmount: 500,
      warpsToDluxRate: 0.001, // 1 warp = 0.001 DLUX
      dluxPriceHive: 0,
      hivePriceUSD: 0,
      warpsActivity: [],
      tokenBalance: 0,
      tokenApi: "https://token.dlux.io",
      
      // Profile
      profileAccount: '',
      profileView: 'casts',
      profileInfo: {
        name: '',
        about: '',
        location: '',
        website: '',
        cover_image: ''
      },
      profileStats: {
        following: 0,
        followers: 0
      },
      profilePosts: [],
      profileLoading: false,
      isOwnProfile: false,
      isFollowing: false,
      spkapi: {
        broca: 0,
        spk_power: 0,
        storage: []
      },
      pfp: {
        set: "",
        uid: "",
      },
      sstats: {
        head_block: 0,
        broca_refill: 0
      },
      slider: null,
      
      // Posts/Casts
      displayPosts: [],
      loading: false,
      hasMore: true,
      
      // Post selection state
      postSelect: {
        entry: 'following',
        following: {
          a: 20,
          o: 0,
          e: false,
          p: false,
          start_author: '',
          start_permlink: ''
        },
        trending: {
          a: 20,
          o: 0,
          e: false,
          p: false,
          start_author: '',
          start_permlink: ''
        },
        new: {
          a: 20,
          o: 0,
          e: false,
          p: false,
          start_author: '',
          start_permlink: ''
        },
        communities: {
          a: 20,
          o: 0,
          e: false,
          p: false,
          start_author: '',
          start_permlink: ''
        },
        searchTerm: "",
        bitMask: 0,
        types: {
          VR: {
            checked: true,
            bitFlag: 1,
            icon: "fa-solid fa-vr-cardboard fa-fw me-2",
            launch: "VR Experience"
          },
          AR: {
            checked: true,
            bitFlag: 2,
            icon: "fa-solid fa-globe fa-fw me-2",
            launch: "AR Experience"
          },
          XR: {
            checked: true,
            bitFlag: 4,
            icon: "fa-solid fa-globe-americas fa-fw me-2",
            launch: "XR Experience"
          },
          '3D': {
            checked: true,
            bitFlag: 8,
            icon: "fa-solid fa-cube fa-fw me-2",
            launch: "3D Model"
          },
          Audio: {
            checked: true,
            bitFlag: 16,
            icon: "fa-solid fa-headphones fa-fw me-2",
            launch: "Audio Experience"
          },
          Video: {
            checked: true,
            bitFlag: 32,
            icon: "fa-solid fa-video fa-fw me-2",
            launch: "Video Player"
          },
          '360°': {
            checked: true,
            bitFlag: 64,
            icon: "fa-solid fa-globe fa-fw me-2",
            launch: "360° Photo"
          },
          App: {
            checked: true,
            bitFlag: 128,
            icon: "fa-solid fa-mobile-screen fa-fw me-2",
            launch: "dApp"
          },
          Blog: {
            checked: true,
            bitFlag: 256,
            icon: "fa-solid fa-book fa-fw me-2",
            launch: "Blog Post"
          }
        }
      },
      
      // Post URLs mapping
      posturls: {},
      following: [],
      trending: [],
      new: [],
      communities: [],
      
      // Right sidebar data
      searchQuery: '',
      trending: [
        { tag: 'DLUX', count: '1.2K', category: 'Blockchain' },
        { tag: 'VR', count: '856', category: 'Technology' },
        { tag: 'Hive', count: '3.4K', category: 'Crypto' },
        { tag: 'Web3', count: '2.1K', category: 'Technology' }
      ],
      suggestedUsers: [],
      
      // Notifications
      notifications: [],
      notificationsLoading: false,
      notificationsError: null,
      notificationsCount: 0,
      
      // Detail modal
      displayPost: {
        item: {
          author: '',
          permlink: '',
          title: '',
          body: '',
          type: 'Blog',
          pics: [],
          votes: 0,
          children: 0,
          replies: []
        },
        index: 0,
        items: []
      },
      
      // Token & API data
      lapi: lapi,
      hapi: HIVE_API,
      accountapi: {},
      hiveprice: {
        hive: {
          usd: 1,
        },
      },
      hbdprice: {
        hive_dollar: {
          usd: 1,
        },
      },
      stats: {},
      smarkets: {},
      TOKEN: "DLUX",
      rewardFund: {},
      feedPrice: {},
      recenthive: {},
      recenthbd: {},
      contracts: {},
      extendcost: {},
      toSign: {},
      toasts: []
    }
  },
  
  computed: {
    voteVal() {
      if (this.slider) {
        return parseInt(this.slider);
      } else {
        return parseInt(this.accountapi.voting_weight) || 10000;
      }
    },
    
    filteredNotifications() {
      if (this.activeNotificationTab === 'mentions') {
        return this.notifications.filter(n => 
          n.subtype === 'mention' || n.message?.includes('mentioned')
        );
      } else if (this.activeNotificationTab === 'channels') {
        return this.notifications.filter(n => 
          n.data?.community || n.data?.community_title
        );
      }
      // Default to 'activity' - show all
      return this.notifications;
    }
  },
  
  methods: {
    ...MCommon.methods,
    
    // Navigation methods
    switchView(view) {
      this.currentView = view;
      if (view === 'home') {
        this.loadFeed();
      } else if (view === 'notifications') {
        this.getNotifications();
      } else if (view === 'invites') {
        this.initializeInvites();
      } else if (view === 'apps') {
        this.initializeMiniApps();
      } else if (view === 'warps') {
        this.initializeWarps();
      } else if (view === 'profile') {
        this.initializeProfile();
      }
    },
    
    switchFeed(type) {
      this.feedType = type;
      this.displayPosts = [];
      this.postSelect.entry = type;
      this.resetPagination(type);
      this.loadFeed();
    },
    
    resetPagination(type) {
      if (this.postSelect[type]) {
        this.postSelect[type].o = 0;
        this.postSelect[type].e = false;
        this.postSelect[type].p = false;
        this.postSelect[type].start_author = '';
        this.postSelect[type].start_permlink = '';
      }
      this[type] = [];
    },
    
    // Feed title
    getFeedTitle() {
      const titles = {
        home: 'Home',
        notifications: 'Notifications',
        direct: 'Direct Casts',
        invites: 'Invites',
        bookmarks: 'Bookmarks',
        packs: 'Starter Packs',
        apps: 'Mini Apps',
        warps: 'Honeycomb',
        profile: 'Profile'
      };
      return titles[this.currentView] || 'Home';
    },
    
    // Cast composition
    autoResize(event) {
      const textarea = event.target;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    },
    
    submitCast() {
      if (!this.newCast.trim()) return;
      
      // TODO: Implement post creation
      console.log('Submitting cast:', this.newCast);
      
      // Clear the textarea
      this.newCast = '';
      
      // Reset textarea height
      const textarea = document.querySelector('.fc-compose-textarea');
      if (textarea) {
        textarea.style.height = 'auto';
      }
    },
    
    // Media actions
    addImage() {
      console.log('Add image');
    },
    
    add3D() {
      console.log('Add 3D content');
    },
    
    addVideo() {
      console.log('Add video');
    },
    
    addLink() {
      console.log('Add link');
    },
    
    // Post actions
    reply(post) {
      console.log('Reply to:', post);
    },
    
    recast(post) {
      console.log('Recast:', post);
      post.reblogged = !post.reblogged;
      if (post.reblogged) {
        post.reblogs = (post.reblogs || 0) + 1;
      } else {
        post.reblogs = Math.max(0, (post.reblogs || 0) - 1);
      }
    },
    
    like(post) {
      if (!this.account || this.account === 'GUEST') {
        this.showLoginModal();
        return;
      }
      
      post.voted = !post.voted;
      if (post.voted) {
        post.votes = (post.votes || 0) + 1;
        // TODO: Implement actual voting
        this.vote({
          author: post.author,
          permlink: post.permlink,
          weight: this.voteVal
        });
      } else {
        post.votes = Math.max(0, (post.votes || 0) - 1);
        // TODO: Implement vote removal
      }
    },
    
    showLoginModal() {
      // Trigger the login modal using Bootstrap's Modal API
      const modalElement = document.getElementById('loginModal');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    },
    
    share(post) {
      const url = `https://dlux.io/@${post.author}/${post.permlink}`;
      if (navigator.share) {
        navigator.share({
          title: post.title,
          text: post.description || post.title,
          url: url
        });
      } else {
        // Copy to clipboard
        navigator.clipboard.writeText(url);
        console.log('Link copied:', url);
      }
    },
    
    openPost(post) {
      // Ensure post has all required properties
      const safePost = {
        ...post,
        type: post.type || 'Blog',
        pics: post.pics || [],
        replies: post.replies || [],
        votes: post.votes || 0,
        children: post.children || 0
      };
      
      this.displayPost.item = safePost;
      this.displayPost.index = this.displayPosts.indexOf(post);
      this.displayPost.items = this.displayPosts;
      
      // Show modal
      this.$nextTick(() => {
        const modalElement = document.getElementById('detailModal');
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }
      });
    },
    
    // Feed loading
    loadFeed() {
      console.log('loadFeed called, feedType:', this.feedType, 'account:', this.account);
      if (this.feedType === 'following' && (!this.account || this.account === 'GUEST')) {
        this.feedType = 'trending';
        this.postSelect.entry = 'trending';
      }
      
      this.getHivePosts();
    },
    
    loadMore() {
      this.getHivePosts();
    },
    
    // Search
    search() {
      console.log('Searching for:', this.searchQuery);
      // TODO: Implement search
    },
    
    // Logout method
    logout() {
      this.removeUser();
      // Reload to reset state
      window.location.reload();
    },
    
    // Time formatting
    formatTime(timestamp) {
      const date = new Date(timestamp + 'Z');
      const now = new Date();
      const diff = now - date;
      
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return `${days}d`;
      if (hours > 0) return `${hours}h`;
      if (minutes > 0) return `${minutes}m`;
      return `${seconds}s`;
    },
    
    // Process post metadata
    processPost(post) {
      // Parse JSON metadata
      try {
        const json = typeof post.json_metadata === 'string' 
          ? JSON.parse(post.json_metadata) 
          : post.json_metadata;
        post.pics = json.image || [];
        post.tags = json.tags || [];
        post.description = json.description || '';
        post.type = json.type || 'Blog';
      } catch (e) {
        post.pics = [];
        post.tags = [];
        post.description = '';
        post.type = 'Blog';
      }

      // Extract title from body if not present
      if (!post.title && post.body) {
        const lines = post.body.split('\n');
        post.title = lines[0].substring(0, 100) + (lines[0].length > 100 ? '...' : '');
      }

      // Parse reputation (handle both bridge and condenser API formats)
      if (typeof post.author_reputation === 'number' && post.author_reputation < 100) {
        // Bridge API already provides formatted reputation
        post.reputation = Math.floor(post.author_reputation);
      } else {
        // Condenser API needs conversion
        post.reputation = this.repLog10(post.author_reputation);
      }

      // Community info
      if (post.category && post.category.startsWith('hive-')) {
        post.community = post.category;
        try {
          const json = typeof post.json_metadata === 'string' 
            ? JSON.parse(post.json_metadata) 
            : post.json_metadata;
          post.community_title = json?.community_title || post.category;
        } catch (e) {
          post.community_title = post.category;
        }
      }
      
      return post;
    },
    
    // Get Hive posts
    getHivePosts() {
      console.log('getHivePosts called, entry:', this.postSelect.entry);
      if (!this.postSelect[this.postSelect.entry].e && !this.postSelect[this.postSelect.entry].p) {
        this.postSelect[this.postSelect.entry].p = true;
        this.loading = true;

        let method, params;
        
        switch (this.postSelect.entry) {
          case 'trending':
            method = 'condenser_api.get_discussions_by_trending';
            params = [{
              tag: '',
              observer: this.account || '',
              limit: this.postSelect[this.postSelect.entry].a,
              start_author: this.postSelect[this.postSelect.entry].start_author || '',
              start_permlink: this.postSelect[this.postSelect.entry].start_permlink || ''
            }];
            break;
            
          case 'new':
            method = 'condenser_api.get_discussions_by_created';
            params = [{
              tag: '',
              observer: this.account || '',
              limit: this.postSelect[this.postSelect.entry].a,
              start_author: this.postSelect[this.postSelect.entry].start_author || '',
              start_permlink: this.postSelect[this.postSelect.entry].start_permlink || ''
            }];
            break;
            
          case 'following':
            if (!this.account || this.account === 'GUEST') {
              this.postSelect[this.postSelect.entry].p = false;
              this.loading = false;
              return;
            }
            method = 'bridge.get_account_posts';
            params = [{
              sort: 'feed',
              account: this.account,
              limit: this.postSelect[this.postSelect.entry].a,
              start_author: this.postSelect[this.postSelect.entry].start_author || undefined,
              start_permlink: this.postSelect[this.postSelect.entry].start_permlink || undefined
            }];
            break;
            
          default:
            this.postSelect[this.postSelect.entry].p = false;
            this.loading = false;
            return;
        }

        console.log('Fetching posts with method:', method, 'params:', params);
        
        fetch(HIVE_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: method,
            params: params,
            id: 1,
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            console.log('API response:', res);
            this.postSelect[this.postSelect.entry].p = false;
            this.loading = false;

            if (!res.result || res.result.length === 0) {
              this.postSelect[this.postSelect.entry].e = true;
              this.hasMore = false;
              return;
            }

            if (res.result.length < this.postSelect[this.postSelect.entry].a) {
              this.postSelect[this.postSelect.entry].e = true;
              this.hasMore = false;
            }

            // Update pagination for next request
            if (res.result.length > 0) {
              const lastPost = res.result[res.result.length - 1];
              this.postSelect[this.postSelect.entry].start_author = lastPost.author;
              this.postSelect[this.postSelect.entry].start_permlink = lastPost.permlink;
            }

            // Process posts
            for (let post of res.result) {
              const key = `/@${post.author}/${post.permlink}`;
              
              // Process post metadata
              this.processPost(post);

              this.posturls[key] = post;
              this[this.postSelect.entry].push(key);
              this.displayPosts.push(post);
            }
          })
          .catch(error => {
            console.error('Error fetching Hive posts:', error);
            this.postSelect[this.postSelect.entry].p = false;
            this.loading = false;
          });
      }
    },
    
    // Get suggested users
    getSuggestedUsers() {
      // Get some popular users
      const popularUsers = ['theycallmedan', 'acidyo', 'taskmaster4450', 'edicted', 'blocktrades', 'dlux-io', 'disregardfiat'];
      
      // Use bridge API to get profiles with formatted reputation
      Promise.all(
        popularUsers.slice(0, 5).map(username =>
          fetch(HIVE_API, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "bridge.get_profile",
              params: [{
                account: username
              }],
              id: 1,
            }),
          })
            .then(r => r.json())
            .then(res => {
              if (res.result) {
                return {
                  account: username,
                  reputation: Math.floor(res.result.reputation)
                };
              }
            })
        )
      ).then(users => {
        this.suggestedUsers = users.filter(u => u);
      });
    },
    
    // Reputation calculation
    repLog10(rep) {
      rep = parseInt(rep);
      if (rep == null) return rep;
      if (rep == 0) return 25;
      let score = 0;
      if (rep < 0) {
        score = -Math.floor(9 * Math.log10(-rep));
      } else {
        score = Math.floor(9 * Math.log10(rep));
      }
      score = Math.max(score - 25, 0);
      return score;
    },
    
    // Vote method
    vote(payload) {
      console.log('Vote:', payload);
      // TODO: Implement actual voting with toSign
    },
    
    // Remove user data
    removeUser() {
      this.account = '';
      localStorage.removeItem('user');
      this.feedType = 'trending';
      this.postSelect.entry = 'trending';
      this.loadFeed();
    },
    
    // Handle login
    handleLogin(username) {
      this.account = username;
      this.getHiveUser(username);
      if (this.feedType === 'following') {
        this.loadFeed();
      }
      // Re-initialize Sting Chat if on direct view
      if (this.currentView === 'direct' && this.stingWidget) {
        this.stingWidget.setUser(username, 'keychain');
      }
      // Refresh invites data if on invites view
      if (this.currentView === 'invites') {
        this.qrCodeGenerated = false; // Reset QR code
        this.initializeInvites();
      }
    },
    
    // Remove operation from queue
    removeOp(id) {
      if (this.toSign && this.toSign.id === id) {
        this.toSign = {};
      }
    },
    
    // Run operation
    run(op) {
      // TODO: Implement operation execution
      console.log('Run operation:', op);
    },
    
    // Send operation for signing
    sendIt(op) {
      this.toSign = op;
    },
    
    // Modal selection handler
    modalSelect(key) {
      if (key.indexOf('/@') > 0)
        key = '/@' + key.split('/@')[1];
      this.displayPost.index = key;
      this.displayPost.item = this.posturls[key];
      
      // Update URL
      window.history.pushState("Cast Modal", this.displayPost.item.title, "/far/@" + key.split('/@')[1]);
      
      // Load replies if needed
      if (this.displayPost.item.children && !this.displayPost.item.replies) {
        this.displayPost.item.replies = [];
        // TODO: Load replies
      }
    },
    
    // API calls from common methods
    getSapi() {
      fetch(LARYNX_API + "/markets")
        .then((response) => response.json())
        .then((data) => {
          this.stats = data.stats || {};
          this.smarkets = data.markets || {};
          // Only update sstats if spk data exists
          if (data.stats && data.stats.spk) {
            this.sstats = {
              ...this.sstats,
              ...data.stats.spk
            };
          }
        })
        .catch(error => {
          console.error('Error fetching SPK markets:', error);
        });
    },
    
    getProtocol() {
      if (user != "GUEST") {
        fetch(LARYNX_API + "/@" + user)
          .then((response) => response.json())
          .then((data) => {
            this.spkapi = data;
          });
      }
    },
    
    getHiveUser(user) {
      if (!user) user = this.account;
      
      if (user && user != "GUEST") {
        this.accountapi = { 
          name: user,
          posting_json_metadata: '{}',
          voting_weight: 10000
        };
        
        // First get profile from bridge API for reputation
        fetch(HIVE_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "bridge.get_profile",
            params: [{
              account: user
            }],
            id: 1,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.result) {
              this.userReputation = Math.floor(data.result.reputation);
            }
          });
        
        // Still get account details from condenser for other data
        fetch(HIVE_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "condenser_api.get_accounts",
            params: [[user]],
            id: 1,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.result[0]) {
              this.accountapi = data.result[0];
              
              try {
                const metadata = JSON.parse(this.accountapi.posting_json_metadata);
                this.accountapi.posting_metadata = metadata;
                this.accountapi.profile = metadata.profile || {};
              } catch (e) {
                this.accountapi.posting_metadata = {};
                this.accountapi.profile = {};
              }
            }
          });
      }
    },
    
    getRewardFund() {
      fetch(HIVE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "condenser_api.get_reward_fund",
          params: ["post"],
          id: 1,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          this.rewardFund = data.result;
        });
    },
    
    getFeedPrice() {
      fetch(HIVE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "condenser_api.get_current_median_history_price",
          params: [],
          id: 1,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          this.feedPrice = data.result;
        });
    },
    
    // Notification methods
    async getNotifications() {
      if (!this.account || this.account === 'GUEST') return;

      this.notificationsLoading = true;
      this.notificationsError = null;

      try {
        // Try DLUX API first
        const response = await fetch(`${DLUX_DATA_API}/api/onboarding/notifications/${this.account}/merged`);

        if (response.ok) {
          const data = await response.json();
          this.notifications = data.notifications || [];
          this.notificationsCount = data.summary?.unreadNotifications || 0;
          this.unreadNotifications = this.notificationsCount; // Update badge
          return;
        }

        // Fallback to HIVE Bridge API
        const hiveNotifications = await this.hiveApiCall('bridge.account_notifications', {
          account: this.account,
          limit: 50
        });

        this.notifications = hiveNotifications.map(notification => ({
          id: `hive_${notification.id}`,
          type: 'hive_notification',
          subtype: notification.type,
          title: this.getHiveNotificationTitle(notification),
          message: this.getHiveNotificationMessage(notification),
          data: {
            hive_notification: notification,
            url: notification.url,
            score: notification.score,
            community: notification.community,
            community_title: notification.community_title
          },
          status: 'read',
          priority: this.getHiveNotificationPriority(notification),
          createdAt: new Date(notification.date),
          source: 'hive_bridge'
        }));

        this.notificationsCount = 0; // HIVE notifications are considered read
        this.unreadNotifications = 0;

      } catch (error) {
        console.error('Error loading notifications:', error);
        this.notificationsError = error.message;
        this.notifications = [];
        this.notificationsCount = 0;
        this.unreadNotifications = 0;
      } finally {
        this.notificationsLoading = false;
      }
    },
    
    async hiveApiCall(method, params) {
      const response = await fetch(HIVE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: method,
          params: [params],
          id: 1,
        }),
      });
      const data = await response.json();
      return data.result;
    },
    
    // Helper methods for HIVE notifications
    getHiveNotificationTitle(notification) {
      const titles = {
        vote: '👍 Vote Received',
        mention: '@️ Mentioned',
        follow: '👥 New Follower',
        reblog: '🔄 Content Reblogged',
        reply: '💬 Reply to Your Post',
        transfer: '💰 Transfer Received',
        delegate: '⚡ Delegation Received',
        undelegate: '⚡ Delegation Removed',
        receive_reward: '🎁 Reward Received'
      };
      return titles[notification.type] || '🔔 Notification';
    },

    getHiveNotificationMessage(notification) {
      const { type, msg, score } = notification;

      switch (type) {
        case 'vote':
          return `@${notification.msg.split(' voted on')[0]} voted on your ${notification.url.includes('/comments/') ? 'comment' : 'post'}${score ? ` (+${score})` : ''}`;
        case 'mention':
          return `@${notification.msg.split(' mentioned you')[0]} mentioned you in a ${notification.url.includes('/comments/') ? 'comment' : 'post'}`;
        case 'follow':
          return `@${notification.msg.split(' ')[0]} started following you`;
        case 'reblog':
          return `@${notification.msg.split(' reblogged')[0]} reblogged your post`;
        case 'reply':
          return `@${notification.msg.split(' replied')[0]} replied to your ${notification.url.includes('/comments/') ? 'comment' : 'post'}`;
        case 'transfer':
          return notification.msg;
        case 'delegate':
          return notification.msg;
        case 'undelegate':
          return notification.msg;
        case 'receive_reward':
          return notification.msg;
        default:
          return notification.msg || 'HIVE blockchain activity';
      }
    },

    getHiveNotificationPriority(notification) {
      const highPriorityTypes = ['transfer', 'delegate', 'mention'];
      const normalPriorityTypes = ['vote', 'follow', 'reblog', 'reply'];
      
      if (highPriorityTypes.includes(notification.type)) {
        return 'high';
      } else if (normalPriorityTypes.includes(notification.type)) {
        return 'normal';
      }
      return 'low';
    },
    
    markAllNotificationsRead() {
      let date = new Date().toISOString().replace(/\.\d{3}(Z|[+-]\d{2}:\d{2})$/, '');
      
      // Update local state immediately
      this.notifications = this.notifications.map(n => ({ ...n, status: 'read' }));
      this.notificationsCount = 0;
      this.unreadNotifications = 0;
      
      // TODO: Implement the actual API call when toSign/broadcast is set up
      console.log('Mark all notifications as read:', date);
    },
    
    async dismissNotification(notificationId) {
      try {
        const response = await fetch(`${DLUX_DATA_API}/api/onboarding/notifications/dismiss/${notificationId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          // Remove from local notifications
          this.notifications = this.notifications.filter(n => n.id !== notificationId);
          this.notificationsCount = Math.max(0, this.notificationsCount - 1);
          this.unreadNotifications = this.notificationsCount;
        }
      } catch (error) {
        console.error('Error dismissing notification:', error);
      }
    },
    
    // Get notification avatar(s) - returns array for multiple users
    getNotificationAvatars(notification) {
      if (notification.type === 'hive_notification' && notification.data.hive_notification) {
        // Extract username from HIVE notification message
        const msg = notification.data.hive_notification.msg || '';
        const usernameMatch = msg.match(/@([a-z0-9\-\.]+)/);
        if (usernameMatch) {
          return [`https://images.hive.blog/u/${usernameMatch[1]}/avatar/small`];
        }
      }
      
      // Default avatar
      return ['/img/no-user.png'];
    },
    
    // Format notification message for Farcaster style
    formatNotificationMessage(notification) {
      if (notification.type === 'hive_notification') {
        const msg = notification.message;
        // Convert to Farcaster style: "X casted for the first time in a while"
        if (msg.includes('voted on')) {
          return msg.replace('voted on your', 'liked your');
        }
        if (msg.includes('reblogged')) {
          return msg.replace('reblogged your post', 'recasted your post');
        }
        if (msg.includes('replied')) {
          return msg.replace('replied to', 'commented on');
        }
      }
      return notification.message;
    },
    
    // Invite methods
    initializeInvites() {
      console.log('[Invites] Initializing invites view');
      
      // Get account info if logged in
      if (this.account && this.account !== 'GUEST') {
        this.getAccountInfo();
        this.getHiveStats();
        
        // Generate QR code after DOM updates
        this.$nextTick(() => {
          this.generateInviteQR();
        });
      }
    },
    
    generateInviteQR() {
      if (this.qrCodeGenerated || !this.$refs.inviteQrCode) return;
      
      const inviteUrl = `https://dlux.io/qr?follow=${this.account}`;
      console.log('[Invites] Generating QR code for:', inviteUrl);
      
      try {
        // Clear any existing QR code
        this.$refs.inviteQrCode.innerHTML = '';
        
        // Generate new QR code
        new QRCode(this.$refs.inviteQrCode, {
          text: inviteUrl,
          width: 200,
          height: 200,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
        
        this.qrCodeGenerated = true;
      } catch (error) {
        console.error('[Invites] Error generating QR code:', error);
      }
    },
    
    getAccountInfo() {
      if (!this.account || this.account === 'GUEST') return;
      
      fetch(HIVE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "condenser_api.get_accounts",
          params: [[this.account]],
          id: 1,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.result && data.result[0]) {
            this.accountinfo = data.result[0];
            console.log('[Invites] Account info loaded:', this.accountinfo);
          }
        })
        .catch(error => {
          console.error('[Invites] Error fetching account info:', error);
        });
    },
    
    getHiveStats() {
      // Get chain properties to know account creation fee
      fetch(HIVE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "condenser_api.get_chain_properties",
          params: [],
          id: 1,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.result) {
            this.hivestats = data.result;
            console.log('[Invites] Hive stats loaded:', this.hivestats);
          }
        })
        .catch(error => {
          console.error('[Invites] Error fetching Hive stats:', error);
        });
    },
    
    claimACT() {
      if (!this.account || this.account === 'GUEST') {
        this.showLoginModal();
        return;
      }
      
      console.log('[Invites] Claiming ACT');
      this.toSign = {
        type: "raw",
        key: "active",
        op: [[
          "claim_account",
          {
            creator: this.account,
            fee: "0.000 HIVE",
            extensions: [],
          },
        ]],
        txid: "claimACT",
        msg: "Claiming Account Creation Token",
        ops: ["getAccountInfo"],
      };
      
      this.sendIt(this.toSign);
    },
    
    startAccountCreation() {
      console.log('[Invites] Starting account creation');
      // For now, redirect to the QR page
      window.open('/qr/', '_blank');
    },
    
    startKeyRecovery() {
      console.log('[Invites] Starting key recovery');
      // For now, redirect to the QR page
      window.open('/qr/', '_blank');
    },
    
    formatNumber(num, decimals, dec, sep) {
      // Simple number formatting
      if (!num) return '0';
      const n = parseFloat(num);
      if (isNaN(n)) return '0';
      
      const fixed = n.toFixed(decimals || 0);
      if (!sep) return fixed;
      
      const parts = fixed.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);
      return parts.join(dec || '.');
    },
    
    // Mini Apps methods
    initializeMiniApps() {
      console.log('[Mini Apps] Initializing mini apps view');
      this.dappsLoading = true;
      
      // Load user's dApps if logged in
      if (this.account && this.account !== 'GUEST') {
        this.getUserDapps();
      }
      
      // Load top dApps
      this.getTopDapps();
    },
    
    getUserDapps() {
      // Fetch user's posts and filter for dApp content
      if (!this.account || this.account === 'GUEST') return;
      
      fetch(HIVE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "bridge.get_account_posts",
          params: [{
            sort: "posts",
            account: this.account,
            limit: 50  // Fetch more to ensure we find dApps
          }],
          id: 1,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.result) {
            this.userDapps = data.result
              .filter(post => {
                try {
                  const json = typeof post.json_metadata === 'string' 
                    ? JSON.parse(post.json_metadata) 
                    : post.json_metadata;
                  // Check for any dApp hash types
                  return json.vrHash || json.arHash || json.appHash || 
                         json.audHash || json.vidHash;
                } catch (e) {
                  return false;
                }
              })
              .map(post => {
                const json = typeof post.json_metadata === 'string' 
                  ? JSON.parse(post.json_metadata) 
                  : post.json_metadata;
                
                // Determine type based on hash properties
                let type = 'App';
                if (json.vrHash) {
                  // Check for special 360° hashes
                  const hash360 = [
                    "QmcAkxXzczkzUJWrkWNhkJP9FF1L9Lu5sVCrUFtAZvem3k",
                    "QmNby3SMAAa9hBVHvdkKvvTqs7ssK4nYa2jBdZkxqmRc16",
                    "QmZF2ZEZK8WBVUT7dnQyzA6eApLGnMXgNaJtWHFc3PCpqV",
                    "Qma4dk3mWP325HrHYBDz3UdL9h1A6q8CSvZdc8JhqfgiMp"
                  ];
                  type = hash360.includes(json.vrHash) ? '360°' : 'VR';
                } else if (json.arHash) {
                  type = 'AR';
                } else if (json.appHash) {
                  type = 'App';
                } else if (json.audHash) {
                  type = 'Audio';
                } else if (json.vidHash) {
                  type = 'Video';
                }
                
                return {
                  author: post.author,
                  permlink: post.permlink,
                  title: post.title || 'Untitled',
                  type: type,
                  created: post.created
                };
              })
              .slice(0, 5); // Show max 5 user dApps
              
            console.log('[Mini Apps] User dApps loaded:', this.userDapps.length);
          }
        })
        .catch(error => {
          console.error('[Mini Apps] Error fetching user dApps:', error);
        });
    },
    
    getTopDapps() {
      // Fetch trending dApps from DLUX Data API
      const bitMask = 127; // All content types
      
      fetch(`${DLUX_DATA_API}/trending?a=50&o=0&b=${bitMask}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.result) {
            // Process dApps - DLUX API returns type directly
            const dapps = data.result
              .filter(post => post.type) // Only include posts with a type
              .map((post, index) => {
                // Map DLUX API types to our display types
                let displayType = post.type;
                if (post.type === '360') {
                  displayType = '360°';
                } else if (post.type === 'APP') {
                  displayType = 'App';
                }
                
                // Format title from permlink if not available
                const title = post.title || post.permlink
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase());
                
                return {
                  author: post.author,
                  permlink: post.permlink,
                  title: title,
                  type: displayType,
                  rank: index + 1
                };
              })
              .slice(0, 12); // Top 12 dApps
              
            this.topDapps = this.filterSearchResults(dapps);
            console.log('[Mini Apps] Top dApps loaded:', this.topDapps.length);
            
            // Optionally fetch full details for titles
            if (this.topDapps.length > 0) {
              this.enrichDappTitles(this.topDapps);
            }
          }
          
          this.dappsLoading = false;
        })
        .catch(error => {
          console.error('[Mini Apps] Error fetching top dApps:', error);
          this.dappsLoading = false;
        });
    },
    
    enrichDappTitles(dapps) {
      // Fetch full post details to get actual titles
      dapps.forEach(dapp => {
        fetch(HIVE_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "condenser_api.get_content",
            params: [dapp.author, dapp.permlink],
            id: 1,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.result && data.result.title) {
              // Update the title with the actual post title
              const index = this.topDapps.findIndex(d => 
                d.author === dapp.author && d.permlink === dapp.permlink
              );
              if (index !== -1) {
                this.topDapps[index].title = data.result.title;
              }
            }
          })
          .catch(error => {
            console.error(`Error fetching title for ${dapp.author}/${dapp.permlink}:`, error);
          });
      });
    },
    
    searchDapps() {
      // Re-filter the top dApps based on search query
      if (this.dappSearchQuery) {
        this.getTopDapps();
      } else {
        this.getTopDapps();
      }
    },
    
    filterSearchResults(dapps) {
      if (!this.dappSearchQuery) return dapps;
      
      const query = this.dappSearchQuery.toLowerCase();
      return dapps.filter(app => 
        app.title.toLowerCase().includes(query) ||
        app.author.toLowerCase().includes(query) ||
        app.type.toLowerCase().includes(query)
      );
    },
    
    // Warps/Honeycomb methods
    initializeWarps() {
      console.log('[Honeycomb] Initializing honeycomb view');
      this.loadAllTokenBalances();
      this.loadAllTokenPrices();
      this.getHivePrice();
    },
    
    // Token helper methods
    getTokenName(token) {
      return this.tokens[token]?.name || 'Unknown';
    },
    
    getTokenIcon(token) {
      return this.tokens[token]?.icon || 'fa-solid fa-coins';
    },
    
    getTokenDescription(token) {
      return this.tokens[token]?.description || '';
    },
    
    getTokenBalance(token) {
      return this.tokenBalances[token] || 0;
    },
    
    switchToken(token) {
      if (this.tokens[token]) {
        this.activeToken = token;
        console.log('[Honeycomb] Switched to token:', token);
      }
    },
    
    // Load balances for all tokens
    loadAllTokenBalances() {
      Object.keys(this.tokens).forEach(token => {
        this.loadTokenBalance(token);
      });
    },
    
    // Load balance for a specific token
    loadTokenBalance(token) {
      if (!this.account || this.account === 'GUEST') {
        this.tokenBalances[token] = 0;
        return;
      }
      
      const tokenConfig = this.tokens[token];
      if (!tokenConfig) return;
      
      fetch(`${tokenConfig.api}/@${this.account}`)
        .then(response => response.json())
        .then(data => {
          if (data.balance !== undefined) {
            this.tokenBalances[token] = data.balance;
            console.log(`[Honeycomb] ${token.toUpperCase()} balance loaded:`, data.balance);
            
            // Update legacy warpsBalance for DLUX
            if (token === 'dlux') {
              this.warpsBalance = Math.floor(data.balance);
            }
          }
        })
        .catch(error => {
          console.error(`[Honeycomb] Error fetching ${token} balance:`, error);
          this.tokenBalances[token] = 0;
        });
    },
    
    // Load prices for all tokens
    loadAllTokenPrices() {
      Object.keys(this.tokens).forEach(token => {
        this.loadTokenPrice(token);
      });
    },
    
    // Load price for a specific token
    loadTokenPrice(token) {
      const tokenConfig = this.tokens[token];
      if (!tokenConfig) return;
      
      fetch(`${tokenConfig.api}${tokenConfig.priceEndpoint}`)
        .then(response => response.json())
        .then(data => {
          if (data.markets && data.markets.hive) {
            const hivePrice = parseFloat(data.markets.hive.tick);
            this.tokenPrices[token].hive = hivePrice;
            console.log(`[Honeycomb] ${token.toUpperCase()}/HIVE price:`, hivePrice);
            
            // Update legacy price for DLUX
            if (token === 'dlux') {
              this.dluxPriceHive = hivePrice;
            }
            
            // Calculate USD price if we have HIVE price
            if (this.hivePriceUSD > 0) {
              this.tokenPrices[token].usd = hivePrice * this.hivePriceUSD;
            }
          }
        })
        .catch(error => {
          console.error(`[Honeycomb] Error fetching ${token} price:`, error);
        });
    },
    
    getWarpsBalance() {
      if (!this.account || this.account === 'GUEST') {
        this.warpsBalance = 0;
        return;
      }
      
      // Fetch DLUX balance from token API
      fetch(`${this.tokenApi}/@${this.account}`)
        .then(response => response.json())
        .then(data => {
          if (data.balance !== undefined) {
            this.tokenBalance = data.balance;
            // Convert DLUX to warps (1 DLUX = 1000 warps)
            this.warpsBalance = Math.floor(data.balance);
            console.log('[Warps] Balance loaded:', this.warpsBalance);
          }
        })
        .catch(error => {
          console.error('[Warps] Error fetching balance:', error);
          this.warpsBalance = 0;
        });
    },
    
    getDluxPrice() {
      // Fetch DLUX/HIVE price from DEX API
      fetch(`${this.tokenApi}/dex`)
        .then(response => response.json())
        .then(data => {
          if (data.markets && data.markets.hive) {
            this.dluxPriceHive = parseFloat(data.markets.hive.tick);
            console.log('[Warps] DLUX price in HIVE:', this.dluxPriceHive);
          }
        })
        .catch(error => {
          console.error('[Warps] Error fetching DLUX price:', error);
          this.dluxPriceHive = 0.01; // Default fallback
        });
    },
    
    getHivePrice() {
      // Fetch HIVE price in USD from CoinGecko or price feed
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd')
        .then(response => response.json())
        .then(data => {
          if (data.hive && data.hive.usd) {
            this.hivePriceUSD = data.hive.usd;
            console.log('[Warps] HIVE price in USD:', this.hivePriceUSD);
          }
        })
        .catch(error => {
          console.error('[Warps] Error fetching HIVE price:', error);
          this.hivePriceUSD = 0.30; // Default fallback
        });
    },
    
    calculateWarpPriceUSD() {
      // For tokens, the amount is already in token units (not "warps")
      const tokenAmount = this.selectedWarpAmount;
      const tokenPrice = this.tokenPrices[this.activeToken];
      
      if (!tokenPrice || !tokenPrice.hive || !this.hivePriceUSD) {
        return '0.00';
      }
      
      const usdPrice = tokenAmount * tokenPrice.hive * this.hivePriceUSD;
      return usdPrice.toFixed(2);
    },
    
    calculateWarpPriceHive() {
      // For tokens, the amount is already in token units
      const tokenAmount = this.selectedWarpAmount;
      const tokenPrice = this.tokenPrices[this.activeToken];
      
      if (!tokenPrice || !tokenPrice.hive) {
        return '0.000';
      }
      
      const hivePrice = tokenAmount * tokenPrice.hive;
      return hivePrice.toFixed(4);
    },
    
    purchaseWarps() {
      if (!this.account || this.account === 'GUEST') {
        this.showLoginModal();
        return;
      }
      
      // Calculate DLUX amount to purchase
      const dluxAmount = this.selectedWarpAmount * this.warpsToDluxRate;
      const hiveAmount = dluxAmount * this.dluxPriceHive;
      
      // Create DEX purchase transaction
      const buyOp = {
        type: 'dex_buy',
        d: {
          dlux: Math.floor(dluxAmount * 1000), // Convert to integer (DLUX uses 3 decimals)
          hive: Math.floor(hiveAmount * 1000)  // Convert to integer (HIVE uses 3 decimals)
        },
        id: 'dlux_buy_warps',
        msg: `Purchase ${this.selectedWarpAmount} warps`,
        ops: ['custom_json'],
        callbacks: ['dexBuyCallback'],
        api: this.tokenApi,
        txid: 'dlux_buy_' + new Date().getTime()
      };
      
      console.log('[Warps] Initiating purchase:', buyOp);
      
      // Emit to parent to handle transaction signing
      this.$emit('purchase-warps', buyOp);
      
      // For now, we'll just show an alert
      alert(`Purchase ${this.selectedWarpAmount} warps for ${this.calculateWarpPriceHive()} HIVE (~$${this.calculateWarpPriceUSD()})`);
    },
    
    // Profile methods
    initializeProfile(account = null) {
      this.profileAccount = account || this.account;
      this.isOwnProfile = this.profileAccount === this.account;
      this.profileView = 'casts';
      this.loadProfileInfo();
      this.loadProfileStats();
      this.loadProfilePosts();
    },
    
    loadProfileInfo() {
      this.profileLoading = true;
      
      // Fetch user profile from Hive API
      fetch(HIVE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "condenser_api.get_accounts",
          params: [[this.profileAccount]],
          id: 1,
        }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.result && data.result[0]) {
            const user = data.result[0];
            const metadata = JSON.parse(user.posting_json_metadata || '{}');
            const profile = metadata.profile || {};
            
            // Debug: Log available metadata fields
            console.log('[Profile] Metadata:', metadata);
            console.log('[Profile] Profile object:', profile);
            
            this.profileInfo = {
              name: profile.name || user.name,
              about: profile.about || '',
              location: profile.location || '',
              website: profile.website || '',
              // Check multiple possible field names for banner/cover image
              cover_image: profile.cover_image || profile.banner_image || profile.cover || profile.banner || metadata.cover_image || ''
            };
            
            console.log('[Profile] Info loaded:', this.profileInfo);
          }
        })
        .catch(error => {
          console.error('[Profile] Error loading info:', error);
        })
        .finally(() => {
          this.profileLoading = false;
        });
    },
    
    loadProfileStats() {
      // Load follower/following counts
      Promise.all([
        // Get followers count
        fetch(HIVE_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "condenser_api.get_follow_count",
            params: [this.profileAccount],
            id: 1,
          }),
        }),
        // Check if current user follows this profile
        this.account && this.account !== 'GUEST' ? fetch(HIVE_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "bridge.get_relationship_between_accounts",
            params: [this.account, this.profileAccount],
            id: 1,
          }),
        }) : Promise.resolve({ result: null })
      ])
        .then(async ([followResponse, relationshipResponse]) => {
          const followData = await followResponse.json();
          const relationshipData = await relationshipResponse.json();
          
          if (followData.result) {
            this.profileStats = {
              following: followData.result.following_count,
              followers: followData.result.follower_count
            };
          }
          
          if (relationshipData.result) {
            this.isFollowing = relationshipData.result.follows;
          }
          
          console.log('[Profile] Stats loaded:', this.profileStats);
        })
        .catch(error => {
          console.error('[Profile] Error loading stats:', error);
        });
    },
    
    loadProfilePosts() {
      this.profileLoading = true;
      
      let method, params;
      
      switch (this.profileView) {
        case 'replies':
          method = 'bridge.get_account_posts';
          params = [{
            sort: 'comments',
            account: this.profileAccount,
            limit: 20
          }];
          break;
        case 'likes':
          // This would need a different approach - Hive doesn't have a direct API for liked posts
          // For now, we'll just show empty
          this.profilePosts = [];
          this.profileLoading = false;
          return;
        case 'starter-packs':
          // Not implemented yet
          this.profilePosts = [];
          this.profileLoading = false;
          return;
        default: // 'casts'
          method = 'bridge.get_account_posts';
          params = [{
            sort: 'posts',
            account: this.profileAccount,
            limit: 20
          }];
      }
      
      fetch(HIVE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: method,
          params: params,
          id: 1,
        }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.result) {
            // Process each post to extract metadata
            this.profilePosts = data.result.map(post => {
              this.processPost(post);
              return post;
            });
            console.log('[Profile] Posts loaded:', this.profilePosts.length);
          }
        })
        .catch(error => {
          console.error('[Profile] Error loading posts:', error);
        })
        .finally(() => {
          this.profileLoading = false;
        });
    },
    
    switchProfileTab(tab) {
      this.profileView = tab;
      this.profilePosts = [];
      this.loadProfilePosts();
    },
    
    toggleFollow() {
      if (!this.account || this.account === 'GUEST') {
        this.showLoginModal();
        return;
      }
      
      const followOp = {
        type: this.isFollowing ? 'unfollow' : 'follow',
        data: {
          follower: this.account,
          following: this.profileAccount
        }
      };
      
      console.log('[Profile] Follow operation:', followOp);
      
      // For now, just toggle the state
      this.isFollowing = !this.isFollowing;
      
      // Update follower count
      if (this.isFollowing) {
        this.profileStats.followers++;
      } else {
        this.profileStats.followers--;
      }
    },
    
    proxyBannerImage(url) {
      if (!url) return '';
      
      // If already an Ecency URL, return as-is
      if (url.includes('images.ecency.com')) {
        return url;
      }
      
      // Proxy through Ecency with banner dimensions
      // Ecency format: https://images.ecency.com/[width]x[height]/[url]
      const proxiedUrl = `https://images.ecency.com/1920x480/${url}`;
      console.log('[Profile] Proxying banner through Ecency:', proxiedUrl);
      return proxiedUrl;
    },
    
    editProfile() {
      // Redirect to DLUX user profile edit page
      window.location.href = '/user/';
    },
    
    createNewCast() {
      // Show new cast modal or navigate to new post
      this.newCast = '';
      this.currentView = 'home';
    },
    
    viewProfile(account) {
      this.currentView = 'profile';
      this.initializeProfile(account);
    }
  },
  
  mounted() {
    // Load initial data
    this.getRewardFund();
    this.getFeedPrice();
    this.getSapi();
    this.getProtocol();
    
    if (this.account && this.account !== 'GUEST') {
      this.getHiveUser(this.account);
      // Load notifications for logged in users
      this.getNotifications();
    }
    
    // Load suggested users
    this.getSuggestedUsers();
    
    // Load initial feed
    this.loadFeed();
    
    // Infinite scroll
    window.addEventListener('scroll', () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
        if (!this.postSelect[this.postSelect.entry].e && !this.postSelect[this.postSelect.entry].p) {
          this.loadMore();
        }
      }
    });
    
    // Setup modal event handler after Vue renders
    this.$nextTick(() => {
      const detailMod = document.getElementById('detailModal');
      if (detailMod) {
        detailMod.addEventListener('hide.bs.modal', event => {
          window.history.back();
        });
      }
    });
  },
  
  beforeUnmount() {
    // Cleanup can go here if needed in the future
  },
  
  components: {
    "login-modal": LoginModal,
    "foot-vue": FootVue,
    "detail-vue": DetailVue,
    Cycler,
    Marker,
    Ratings,
    MDE,
    Replies,
    CardVue,
    ContractsVue,
    FilesVue,
    ExtensionVue,
    UploadVue,
    PostVue,
    Popper
  }
}).mount("#app");