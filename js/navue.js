import ToastVue from "/js/toastvue.js";
export default {
  data() {
    return {
      HAS: false,
      HKC: true,
      HSR: false,
      user: "",
      userField: "",
      accountMenu: false,
      recentUsers: [],
      filterUsers: "",
      filterRecents: [],
      ops: [],
    };
  },
  components: {
    "toast-vue": ToastVue,
  },
  emits: ["login", "logout", "refresh", "ack"],
  props: ["op", "lapi"],
  watch: {
    op(op, oldOp) {
      console.log(op, "...", oldOp);
      if (op.txid) {
        op.time = new Date().getTime();
        op.status = "Pending your approval";
        op.delay = 5000;
        op.title = op.id ? op.id : op.cj.memo;
        op.api = this.lapi;
        this.ops.push(op);
        this.$emit("ack", op.txid);
        if (op.type == "cja") {
          this.broadcastCJA(op);
        } else if (this.op.type == "xfr") {
          this.broadcastTransfer(op);
        }
        localStorage.setItem("pending", JSON.stringify(this.ops));
      }
    },
  },
  methods: {
    useHAS() {
      this.HAS = true;
      this.HKC = false;
      this.HSR = false;
    },
    useHS() {
      this.HAS = false;
      this.HKC = false;
      this.HSR = true;
    },
    useKC() {
      this.HAS = false;
      this.HKC = true;
      this.HSR = false;
    },
    broadcastCJA(obj) {
      var op = [
        this.user,
        [
          [
            "custom_json",
            {
              required_auths: [this.user],
              required_posting_auths: [],
              id: obj.id,
              json: JSON.stringify(obj.cj),
            },
          ],
        ],
        "active",
      ];
      console.log("CJA");
      this.sign(op)
        .then((r) => {
          this.statusFinder(r, obj);
        })
        .catch((e) => {
          console.log(e);
        });
    },
    broadcastTransfer(obj) {
      var op = [
        this.user,
        [
          [
            "transfer",
            {
              to: obj.cj.to,
              from: this.user,
              amount: `${parseFloat(
                (obj.cj.hive ? obj.cj.hive : obj.cj.hbd) / 1000
              ).toFixed(3)} ${obj.cj.hive ? "HIVE" : "HBD"}`,
              memo: `${obj.cj.memo ? obj.cj.memo : ""}`,
            },
          ],
        ],
        "active",
      ];
      this.sign(op)
        .then((r) => {
          this.statusFinder(r, obj);
        })
        .catch((e) => {
          console.log(e);
        });
    },
    sign(op) {
      return new Promise((resolve, reject) => {
        if (this.HKC) {
          console.log("HKC");
          this.HKCsign(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        } else if (this.HAS) {
          console.log("HAS");
          this.HASsign(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        } else {
          console.log("HSR");
          this.HSRsign(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        }
      });
    },
    HKCsign(op) {
      return new Promise((resolve, reject) => {
        if (window.hive_keychain) {
          try {
            window.hive_keychain.requestBroadcast(
              op[0],
              op[1],
              op[2],
              function (response) {
                resolve(response);
              }
            );
          } catch (e) {
            reject(e);
          }
        } else {
          reject({ error: "Hive Keychain is not installed." }); //fallthrough?
        }
      });
    },
    statusFinder(response, obj) {
      console.log(response, obj);
      if (response.success == false) {
        this.cleanOps();
        return;
      }
      if (response.success == true) {
        obj.status = "Hive TX Success:\nAwaiting Layer 2 confirmation...";
        obj.delay = 100000;
        obj.link = "https://hiveblocks.com/tx/" + response.result.id;
        obj.txid = response.result.id;
        this.ops.push(obj);
        this.cleanOps(); //also stores it in localStorage
        this.statusPinger(response.result.id, obj.api, 0);
      }
    },
    statusPinger(txid, api, r) {
      if (r > 30) return;
      fetch(api + "/api/status/" + txid)
        .then((r) => r.json())
        .then((json) => {
          console.log(json, json.status.slice(0, 20));
          if (json.status.slice(0, 20) != "This TransactionID e") {
            if (json.status.indexOf(" minted ") > -1) {
              //changeDiv(id, json.status, "mint"); // worry about this later
              setTimeout(
                function () {
                  this.cleanOps(txid);
                }.bind(this),
                30000
              );
            } else {
              for (var i = 0; i < this.ops.length; i++) {
                if (this.ops[i].txid == txid) {
                  console.log("Found Op");
                  var op = this.ops[i];
                  op.status = "Confirmed.";
                  op.msg = json.status;
                  //this.cleanOps();
                  for (var j = 0; j < op.ops.length; j++) {
                    console.log(op.ops[j]);
                    this.$emit("refresh", op.ops[j]);
                  }
                  break;
                }
              }
              setTimeout(
                function () {
                  this.cleanOps(txid);
                }.bind(this),
                30000
              );
            }
          } else {
            setTimeout(
              function () {
                this.statusPinger(txid, api, r + 1);
              }.bind(this),
              3000
            );
          }
        })
        .catch((e) => {
          console.log(e);
          this.statusPinger(txid, api, r + 1);
        });
    },
    searchRecents() {
      this.filterRecents = this.recentUsers.reduce((a, b) => {
        console.log(b);
        if (b.toLowerCase().includes(this.filterUsers.toLowerCase())) {
          a.push(b);
        }
        return a;
      }, []);
    },
    setValue(key, value) {
      if (key.split(".").length > 1) {
        let keys = key.split(".");
        let obj = this[keys[0]];
        for (let i = 1; i < keys.length; i++) {
          if (i == keys.length - 1) {
            obj[keys[i]] = value;
          } else {
            obj = obj[keys[i]];
          }
        }
      } else {
        this[key] = value;
      }
    },
    getUser() {
      this.user = localStorage.getItem("user");
      this.$emit("login", this.user);
    },
    logout() {
      localStorage.removeItem("user");
      this.user = "";
      this.$emit("logout", "");
    },
    setUser(id) {
      this.user = id ? id : this.userField;
      this.userField = "";
      localStorage.setItem("user", this.user);
      this.$emit("login", this.user);
      this.addRecentUser(this.user);
    },
    addRecentUser(user) {
      if (user && this.recentUsers.indexOf(user) == -1)
        this.recentUsers.push(user);
      localStorage.setItem("recentUsers", JSON.stringify(this.recentUsers));
    },
    getRecentUsers() {
      const r = localStorage.getItem("recentUsers");
      if (r) this.recentUsers = JSON.parse(r);
      for (var i = 0; i < this.recentUsers.length; i++) {
        if (this.recentUsers[i].length < 3) {
          this.recentUsers.splice(i, 1);
          break;
        }
      }
    },
    deleteRecentUser(user) {
      this.recentUsers.splice(this.recentUsers.indexOf(user), 1);
      localStorage.setItem("recentUsers", JSON.stringify(this.recentUsers));
    },
    toggleAccountMenu() {
      this.accountMenu = !this.accountMenu;
    },
    isEnter(e) {
      if (e.key === "Enter" || e.keyCode === 13) {
        this.setUser();
      }
    },
    cleanOps(txid) {
      const ops = this.ops;
      for (var i = 0; i < ops.length; i++) {
        if (ops[i].status == "Pending your approval") {
          ops.splice(i, 1);
          i--;
        } else if (ops[i].time < new Date().getTime() - 300000) {
          ops.splice(i, 1);
          i--;
        } else if (ops[i].txid == txid) {
          ops.splice(i, 1);
          break;
        }
      }
      this.ops = ops;
      localStorage.setItem("pending", JSON.stringify(this.ops));
    },
  },
  mounted() {
    this.getUser();
    this.getRecentUsers();
    const ops = localStorage.getItem("pending");
    this.ops = ops ? JSON.parse(ops) : [];
    this.cleanOps();
    for (var i = 0; i < this.ops.length; i++) {
      this.statusPinger(this.ops[i].txid, this.ops[i].api, 0);
    }
  },
  computed: {
    avatar: {
      get() {
        return this.user
          ? "https://images.hive.blog/u/" + this.user + "/avatar"
          : "";
      },
    },
    HKCa: {
      //Hive Keychain Available
      get() {
        return !!window.hive_keychain;
      },
    },
  },
  template: `
<div>
<header class="navbar navbar-expand-lg navbar-dark fixed-top" style="background-color:rgba(42, 48, 54, 0.8); -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);">
  <div class="container-fluid">
	  <a class="navbar-brand" href="/"><img src="/img/dlux-hive-logo-alpha.svg" alt="dlux-logo" width="40" height="40"></a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span></button>
    <div class="collapse navbar-collapse " id="navbarSupportedContent">

      <ul class="navbar-nav me-auto">
        <li class="nav-item"><a class="nav-link" href="/hub/"><i class="fa-solid fa-mountain-sun me-2"></i>HUB</a></li>
        <li class="nav-item"><a class="nav-link" href="/nfts/"><i class="fa-solid fa-store me-2"></i>NFTS</a></li>
        <li class="nav-item"><a class="nav-link" href="/dex#dlux"><i class="fa-solid fa-building-columns me-2"></i>DEX</a></li>
        <li class="nav-item"><a class="nav-link" href="/apps/"><i class="fa-solid fa-globe me-2"></i>APPS</a></li>
        <li class="nav-item"><a class="nav-link" href="/docs/"><i class="fa-solid fa-book me-2"></i>DOCS</a></li>
      </ul>


	      <ul class="navbar-nav me-5" id="loginMenu" v-show="!user">
	        <li class="nav-item"><a class="nav-link" href="/about/">About</a></li>
          <li class="nav-item"><a class="nav-link" href="/docs/">Docs</a></li>
	        <li class="nav-item"><a class="nav-link" href="https://signup.hive.io/">Get Account</a></li>
	        <li class="nav-item">
            <div class="input-group input-group-sm">
              <button class="btn btn-primary ms-3" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasUsers" aria-controls="offcanvasUsers">Login</button>
            </div>
          </li>
      	</ul>


	      <ul class="nav navbar-nav me-5" v-show="user" id="userMenu">
          <li class="nav-item"><a class="nav-link" href="/new/"><i class="fa-solid fa-plus me-2"></i>MAKE</a></li>
		      <li class="nav-item dropdown">
		        <a class="nav-link dropdown-bs-toggle text-white-50" id="userDropdown" role="button" aria-expanded="false" data-bs-toggle="dropdown" href="#">
			      <img :src="avatar" id="userImage" alt="" width="30" height="30" class="img-fluid rounded-circle bg-light me-1 cover">
			      <span id="userName">{{user}}</span></a>
            <ul class="dropdown-menu dropdown-menu-dark pt-0" aria-labelledby="userDropdown">
			        <li><a class="dropdown-item" href="/me#blog/" onClick="showTab('blog')"><i class="fas fa-user fa-fw me-2"></i>Profile</a></li>
			        <li><a class="dropdown-item" href="/me#wallet/" onClick="showTab('wallet')"><i class="fas fa-wallet fa-fw me-2"></i>Wallet</a></li>
			        <li><a class="dropdown-item" href="/me#inventory/" onClick="showTab('inventory')"><i class="fas fa-boxes fa-fw me-2"></i>Inventory</a></li>
			        <li><a class="dropdown-item" href="/me#node/" onClick="showTab('node')"><i class="fas fa-robot fa-fw me-2"></i>Node</a></li>
			        <li><a class="dropdown-item" href="/me#settings/" onClick="showTab('settings')"><i class="fas fa-cog fa-fw me-2"></i>Settings</a></li>
              <li><hr class="dropdown-divider"></li>
			        <li><a class="dropdown-item" href="/about/"><i class="fas fa-info-circle fa-fw me-2"></i>About</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="#" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasUsers" aria-controls="offcanvasUsers"><i class="fas fa-user-friends me-2"></i>Switch User</a></li>
			        <li><a class="dropdown-item" href="#" @click="logout()"><i class="fas fa-power-off fa-fw me-2"></i>Logout</a></li>
		        </ul>
          </li>
        </ul>

    </div>
  </div>
</header>
<div class="position-fixed bottom-0 end-0 p-3 toast-container" style="z-index: 11">
  <div v-for="op in ops">  
    <toast-vue :alert="op"/>
  </div>
</div>

<div class="offcanvas offcanvas-end bg-dark text-white-50" tabindex="-1" id="offcanvasUsers" aria-labelledby="offcanvasRightLabel">
  <div class="offcanvas-header d-flex align-items-center justify-content-between">
    <h5 id="offcanvasRightLabel" class="m-0 p-0">User Management</h5>
    <button type="button" class="btn-close btn-close-white text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
  </div>
  <div class="offcanvas-body">
    <div class="d-flex flex-column">
      <div class="row mb-3">
        <label class="form-label d-none">Authentication service:</label>
        <div class="dropdown">
          <button class="btn btn-secondary w-100 p-0" role="button" id="authDropdown" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false" >
            <button v-if="HKC" class="btn btn-hivekeychain h-100 w-100 dropdown-toggle"><img src="/img/keychain.png" height="50px" class="img-responsive p-2 mx-3"></button>
            <button v-if="HAS" class="btn btn-hiveauth h-100 w-100 dropdown-toggle"><img src="/img/hiveauth.svg" height="50px" class="img-responsive p-2 mx-3"></button>
            <button v-if="HSR" class="btn btn-hivesigner h-100 w-100 dropdown-toggle"><img src="/img/hivesigner.svg" height="50px" class="img-responsive p-2 mx-3"></button>
          </button>
          <ul class="dropdown-menu dropdown-menu-dark text-center bg-black p-2" aria-labelledby="authDropdown">
            <li class="p-2"><button class="btn btn-hivekeychain h-100 w-100" @click="useKC()"><img src="/img/keychain.png" class="img-responsive" height="50px"></button></li>
            <li class="p-2"><button class="btn btn-hiveauth h-100 w-100" @click="useHAS()"><img src="/img/hiveauth.svg" class="img-responsive" height="50px"></button></li>
            <li class="p-2"><button class="btn btn-hivesigner h-100 w-100" @click="useHS()"><img src="/img/hivesigner.svg" class="img-responsive" height="50px"></button></li>
          </ul>
        </div>
        <div class="small text-muted text-center mt-2 d-none">
        <span v-if="HKC">Hive Keychain requires a Firefox or Chrome extension.</span>
        <span v-if="HAS">Hive Auth requires an iOS or Android app.</span>
        <span v-if="HSR">Hive Signer requires a password.</span>
        </div>
      </div>
      <div class="row mb-3">
        <label class="form-label d-none">Set and store username:</label>
        <div class="input-group">
          <span class="input-group-text bg-darkg border-dark text-white-50">@</span>
          <input v-model="userField" placeholder="username" @keyup.enter="setUser()" class="text-center form-control bg-darkg border-dark text-info">
          <span class="input-group-text bg-darkg border-dark"><a href="#" @click="setUser()" v-if="userField" class="link-info"><i class="fa-solid fa-circle-plus"></i></a></span>
        </div>
        <div class="small text-muted text-center mt-2">
         Usernames are stored locally and can be cleared.
        </div>
      </div>
      <div class="row mb-3">
        <label class="form-label">Current user:</label>
        <div v-if="!user" class="bg-darkest px-4 py-2 mx-2">
          <img src="#" alt="" width="50" height="50" class="img-fluid rounded-circle bg-light me-1 cover">
          <span>NONE SELECTED</span>
        </div>
        <div v-if="user" class="bg-darkest px-4 py-2 mx-2">
          <img :src="avatar" id="userImage" alt="" width="50" height="50" class="img-fluid rounded-circle bg-light me-1 cover">
          <span id="userName">{{user}}</span>
        </div>
      </div>

      <div class="row mb-3" v-if="recentUsers.length">
        <label class="form-label">Recent usernames:</label>
        <div class="input-group">
          <span class="input-group-text bg-darkg border-dark text-white-50">@</span>
          <input v-model="filterUsers" placeholder="search" @keyup="searchRecents()" class="text-center form-control bg-darkg border-dark text-info">
          <span class="input-group-text bg-darkg border-dark"><a href="#/" @click="setValue('filterUsers', '')" v-if="filterUsers"><i class="fa-solid fa-xmark"></i></a></span>
        </div>
      </div>
      <div class="d-flex justify-content-between align-items-center m-3 pb-3 border-dark border-bottom" v-if="!filterUsers" v-for="name in recentUsers">
        <div class="flex-fill text-center"><a class="link-info" href="#" @click="setUser(name);toggleAccountMenu()">@{{name}}</a></div>
        <div class="flex-shrink"><a href="#" @click="deleteRecentUser(name)" alt="Remove username" class="ms-auto link-secondary"><i class="fa-solid fa-trash-can"></i></a></div>
      </div>
      <div class="d-flex justify-content-between align-items-center m-3 pb-3 border-dark border-bottom" v-if="filterUsers" v-for="name in filterRecents">
        <div class="flex-fill text-center"><a class="link-info" href="#" @click="setUser(name);toggleAccountMenu()">@{{name}}</a></div>
        <div class="flex-shrink"><a href="#" @click="deleteRecentUser(name);searchRecents()" alt="Remove username" class="ms-auto link-secondary"><i class="fa-solid fa-trash-can"></i></a></div>
      </div>
    </div>
  </div>
  </div>
</div>`,
};
