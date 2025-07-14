import { createApp } from '/js/vue.esm-browser.js'
import Navue from "/js/v3-nav.js";
import FootVue from "/js/footvue.js";
import MCommon from "/js/methods-common.js";
import DataCommon from "/js/dataCommon.js";

// Extract URL parameters for API configuration
let url = location.href.replace(/\/$/, "");
let lapi = "";
if (location.search) {
  const string = location.search.replace("?", "");
  let params = string.split("&");
  for (let i = 0; i < params.length; i++) {
    let param = params[i].split("=");
    if (param[0] == "api") {
      lapi = param[1];
    }
  }
  window.history.replaceState(null, null, "?api=" + lapi);
}

// Auto-detect API from hash
if (location.hash && !lapi) {
  const hash = url.split("#");
  if (hash[1]?.includes("dlux")) {
    lapi = "https://token.dlux.io";
  } else if (hash[1]?.includes("larynx")) {
    lapi = "https://spkinstant.hivehoneycomb.com";
  } else if (hash[1]?.includes("duat")) {
    lapi = "https://duat.hivehoneycomb.com";
  }
}

if (!lapi) {
  lapi = localStorage.getItem("lapi") || "https://spkinstant.hivehoneycomb.com";
}

let user = localStorage.getItem("user") || "GUEST";
let hapi = localStorage.getItem("hapi") || "https://api.hive.blog";

createApp({
  components: {
    'nav-vue': Navue,
    'foot-vue': FootVue
  },
  mixins: [MCommon, DataCommon],
  data() {
    return {
      // API and user configuration
      lapi: lapi,
      hapi: hapi,
      account: user,
      
      // Application state
      loading: true,
      toSign: {},
      
      // SCP data
      proposals: {},
      stats: {},
      
      // UI state
      activeTab: 'all',
      selectedProposal: null,
      
      // New proposal form
      newProposal: {
        type: '',
        path: '',
        func: ''
      },
      
      // Modal references
      createModal: null,
      detailsModal: null,
      
      // Computed data caches
      proposalsList: [],
      
      // API configuration
      prefix: "",
      TOKEN: "LARYNX"
    }
  },
  
  computed: {
    // Convert proposals object to array for easier manipulation
    proposalsArray() {
      return Object.keys(this.proposals).map(id => ({
        id,
        ...this.proposals[id]
      }));
    },
    
    // Filter proposals by status
    activeProposals() {
      return this.proposalsArray.filter(p => this.getApprovalCount(p) < p.threshold);
    },
    
    pendingProposals() {
      return this.proposalsArray.filter(p => {
        const approvals = this.getApprovalCount(p);
        return approvals > 0 && approvals < p.threshold;
      });
    },
    
    approvedProposals() {
      return this.proposalsArray.filter(p => this.getApprovalCount(p) >= p.threshold);
    },
    
    myProposals() {
      return this.proposalsArray.filter(p => p.from === this.account);
    },
    
    // Filter proposals based on active tab
    filteredProposals() {
      switch (this.activeTab) {
        case 'pending':
          return this.pendingProposals;
        case 'approved':
          return this.approvedProposals;
        case 'myproposals':
          return this.myProposals;
        default:
          return this.proposalsArray;
      }
    }
  },
  
  methods: {
    // Data loading methods
    async loadSCPData() {
      try {
        this.loading = true;
        const [scpResponse, statsResponse] = await Promise.all([
          fetch(`${this.lapi}/scp`),
          fetch(`${this.lapi}/stats`)
        ]);
        
        const scpData = await scpResponse.json();
        const statsData = await statsResponse.json();
        
        this.proposals = scpData.result || {};
        this.stats = statsData.result || {};
        
        // Set API configuration based on response
        this.configureAPI(statsData);
        
      } catch (error) {
        console.error('Error loading SCP data:', error);
        this.handleToast({
          title: 'Error',
          body: 'Failed to load proposal data',
          type: 'error'
        });
      } finally {
        this.loading = false;
      }
    },
    
    configureAPI(data) {
      // Configure API prefix and token based on response
      if (this.lapi.includes('dlux')) {
        this.prefix = 'dlux_';
        this.TOKEN = 'DLUX';
      } else if (this.lapi.includes('spk') || this.lapi.includes('larynx')) {
        this.prefix = 'spkcc_';
        this.TOKEN = 'LARYNX';
      } else if (this.lapi.includes('duat')) {
        this.prefix = 'duat_';
        this.TOKEN = 'DUAT';
      }
    },
    
    async refreshData() {
      await this.loadSCPData();
      this.handleToast({
        title: 'Success',
        body: 'Proposal data refreshed',
        type: 'success'
      });
    },
    
    // Proposal creation
    async createProposal() {
      try {
        if (!this.newProposal.type || !this.newProposal.path || !this.newProposal.func) {
          this.handleToast({
            title: 'Error',
            body: 'Please fill in all required fields',
            type: 'error'
          });
          return;
        }
        
        const proposalData = {
          type: parseInt(this.newProposal.type),
          path: this.newProposal.path,
          func: this.newProposal.func
        };
        
        this.toSign = {
          type: 'cja',
          cj: proposalData,
          id: `${this.prefix}scp_add`,
          msg: `Creating smart contract proposal for ${proposalData.path}`,
          ops: ['loadSCPData'],
          txid: 'scp_add_' + Date.now()
        };
        
        // Close modal and reset form
        this.createModal.hide();
        this.resetNewProposal();
        
      } catch (error) {
        console.error('Error creating proposal:', error);
        this.handleToast({
          title: 'Error',
          body: 'Failed to create proposal',
          type: 'error'
        });
      }
    },
    
    resetNewProposal() {
      this.newProposal = {
        type: '',
        path: '',
        func: ''
      };
    },
    
    // Voting functionality
    async voteOnProposal(proposalId, approve) {
      try {
        if (!this.canVote(this.proposals[proposalId])) {
          this.handleToast({
            title: 'Error',
            body: 'You cannot vote on this proposal',
            type: 'error'
          });
          return;
        }
        
        this.toSign = {
          type: 'cja',
          cj: {
            id: proposalId,
            approve: approve
          },
          id: `${this.prefix}scp_vote`,
          msg: `${approve ? 'Approving' : 'Rejecting'} proposal ${proposalId}`,
          ops: ['loadSCPData'],
          txid: 'scp_vote_' + Date.now()
        };
        
      } catch (error) {
        console.error('Error voting on proposal:', error);
        this.handleToast({
          title: 'Error',
          body: 'Failed to vote on proposal',
          type: 'error'
        });
      }
    },
    
    // Proposal deletion
    async deleteProposal(proposalId) {
      try {
        if (!this.canDelete(this.proposals[proposalId])) {
          this.handleToast({
            title: 'Error',
            body: 'You cannot delete this proposal',
            type: 'error'
          });
          return;
        }
        
        if (!confirm('Are you sure you want to delete this proposal?')) {
          return;
        }
        
        this.toSign = {
          type: 'cja',
          cj: {
            id: proposalId
          },
          id: `${this.prefix}scp_del`,
          msg: `Deleting proposal ${proposalId}`,
          ops: ['loadSCPData'],
          txid: 'scp_del_' + Date.now()
        };
        
      } catch (error) {
        console.error('Error deleting proposal:', error);
        this.handleToast({
          title: 'Error',
          body: 'Failed to delete proposal',
          type: 'error'
        });
      }
    },
    
    // UI helper methods
    viewProposalDetails(proposal) {
      this.selectedProposal = proposal;
      this.detailsModal.show();
    },
    
    // Proposal status and classification methods
    getProposalTypeDisplay(type) {
      const types = {
        'onOperation': 'Operation Hook',
        'on': 'Event Handler',
        'api': 'API Endpoint',
        'chron': 'Scheduled Job',
        'CodeShare': 'Code Update',
        'CustomEvery': 'Recurring Job'
      };
      return types[type] || type;
    },
    
    getProposalBadgeClass(proposal) {
      const typeClasses = {
        'onOperation': 'bg-primary',
        'on': 'bg-info',
        'api': 'bg-success',
        'chron': 'bg-warning text-dark',
        'CodeShare': 'bg-danger',
        'CustomEvery': 'bg-secondary'
      };
      return typeClasses[proposal.type] || 'bg-secondary';
    },
    
    getProposalStatus(proposal) {
      const approvals = this.getApprovalCount(proposal);
      if (approvals >= proposal.threshold) {
        return 'Approved';
      } else if (approvals > 0) {
        return 'Pending';
      }
      return 'Open';
    },
    
    getStatusBadgeClass(proposal) {
      const status = this.getProposalStatus(proposal);
      switch (status) {
        case 'Approved': return 'bg-success';
        case 'Pending': return 'bg-warning text-dark';
        default: return 'bg-secondary';
      }
    },
    
    getProgressBarClass(proposal) {
      const percentage = this.getApprovalPercentage(proposal);
      if (percentage >= 100) return 'bg-success';
      if (percentage >= 50) return 'bg-warning';
      return 'bg-info';
    },
    
    getProposalDescription(proposal) {
      const descriptions = {
        'onOperation': `Hook function that will be called when processing ${proposal.path} operations`,
        'on': `Event handler for ${proposal.path} events`,
        'api': `New API endpoint at ${proposal.path}`,
        'chron': `Scheduled job for ${proposal.path}`,
        'CodeShare': `Update to shared code function ${proposal.path}`,
        'CustomEvery': `Update to recurring job ${proposal.path}`
      };
      return descriptions[proposal.type] || `Smart contract update for ${proposal.path}`;
    },
    
    // Voting calculation methods
    getApprovalCount(proposal) {
      if (!proposal.approvals) return 0;
      return Object.values(proposal.approvals).filter(vote => vote === 1).length;
    },
    
    getRejectionCount(proposal) {
      if (!proposal.approvals) return 0;
      return Object.values(proposal.approvals).filter(vote => vote === -1).length;
    },
    
    getApprovalPercentage(proposal) {
      if (!proposal.threshold || proposal.threshold === 0) return 0;
      return Math.round((this.getApprovalCount(proposal) / proposal.threshold) * 100);
    },
    
    // Permission methods
    canVote(proposal) {
      if (!this.account || this.account === 'GUEST') return false;
      if (!this.stats.ms?.active_account_auths) return false;
      return this.stats.ms.active_account_auths.includes(this.account);
    },
    
    canDelete(proposal) {
      return proposal.from === this.account;
    },
    
    hasVoted(proposal, account) {
      if (!proposal.approvals || !account) return false;
      return proposal.approvals[account] !== 0 && proposal.approvals[account] !== undefined;
    },
    
    // Utility methods
    formatTimeAgo(txId) {
      // Simple time formatting - in production you'd want a proper library
      try {
        const timestamp = parseInt(txId.substring(0, 8), 16) * 1000;
        const now = Date.now();
        const diff = now - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return 'Recently';
      } catch (e) {
        return 'Unknown';
      }
    },
    
    getEmptyMessage() {
      switch (this.activeTab) {
        case 'pending':
          return 'No proposals are currently pending approval.';
        case 'approved':
          return 'No proposals have been approved yet.';
        case 'myproposals':
          return 'You haven\'t created any proposals yet.';
        default:
          return 'No smart contract proposals found.';
      }
    },
    
    // User management methods (from DataCommon)
    setValue(key, value) {
      this[key] = value;
      if (key === 'account') {
        localStorage.setItem('user', value);
      }
    },
    
    removeUser() {
      this.account = 'GUEST';
      localStorage.removeItem('user');
    },
    
    async getTokenUser(user) {
      // Implementation for getting token user data
      if (user === 'GUEST') return;
      // Add token user loading logic here
    },
    
    async getHiveUser(user) {
      // Implementation for getting Hive user data
      if (user === 'GUEST') return;
      // Add Hive user loading logic here
    },
    
    removeOp(txid) {
      // Implementation for removing operations
      console.log('Removing operation:', txid);
    },
    
    run(op) {
      // Implementation for running operations
      console.log('Running operation:', op);
      if (op === 'loadSCPData') {
        this.loadSCPData();
      }
    },
    
    // Toast notification system
    handleToast(toastData) {
      // Create a toast notification
      const toastElement = document.createElement('div');
      toastElement.className = `toast align-items-center text-white ${toastData.type === 'error' ? 'bg-danger' : 'bg-success'} border-0`;
      toastElement.setAttribute('role', 'alert');
      toastElement.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            <strong>${toastData.title}</strong><br>
            ${toastData.body}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      `;
      
      document.body.appendChild(toastElement);
      const toast = new bootstrap.Toast(toastElement);
      toast.show();
      
      // Remove element after hide
      toastElement.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toastElement);
      });
    }
  },
  
  async mounted() {
    // Initialize modals
    this.createModal = new bootstrap.Modal(document.getElementById('createProposalModal'));
    this.detailsModal = new bootstrap.Modal(document.getElementById('proposalDetailsModal'));
    
    // Load initial data
    await this.loadSCPData();
  }
}).mount('#app') 