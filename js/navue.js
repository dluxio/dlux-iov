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
      HAS_: {
        SERVER: "wss://hive-auth.arcange.eu",
        APP_DATA: {
          name: "dlux-io-has",
          description: "DLUX Client",
          // icon:"https://domain.com/logo.png",
        },
        app_key: "",
        token: "",
        expire: "",
        auth_key: "",
        auth_uuid: "",
        ws: null,
        wsa: true,
        ws_status: "",
        wsconn: false,
        qrcode_url: "",
      },
      haspich: 50,
      haspic: "/img/hiveauth.svg",
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
      if (this.user) this.HASsetup();
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
          console.log({op});
          this.HASsign(op)
        } else {
          console.log("HSR");
          this.HSRsign(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        }
      });
    },
    HASsign(op) {
      const now = new Date().getTime();
      if(now > this.HAS_.expire) {
        alert(`Hive Auth Session expired. Please login again.`);
        return
      }
      const sign_data = {
        key_type: op[2],
        ops: op[1],
        broadcast: true,
      };
      const data = CryptoJS.AES.encrypt(
        JSON.stringify(sign_data),
        this.HAS_.auth_key
      ).toString();
      const payload = {
        cmd: "sign_req",
        account: this.user,
        token: this.HAS_.token,
        data: data,
      };
      this.HAS_.ws.send(JSON.stringify(payload));
    },
    HASlogin() {
      const auth_data = {
        app: this.HAS_.APP_DATA,
        token: undefined,
        challenge: undefined,
      };

      if (!this.HAS_.auth_key) this.HAS_.auth_key = uuidv4();
      const data = CryptoJS.AES.encrypt(
        JSON.stringify(auth_data),
        this.HAS_.auth_key
      ).toString();
      const payload = { cmd: "auth_req", account: this.user, data: data };
      this.HAS_.ws.send(JSON.stringify(payload));
    },
    HASlogout() {
      this.HAS_.token = "";
      this.HAS_.expire = "";
      this.user = "";
      localStorage.removeItem(this.user + "HAS");
    },
    HASsetup() {
      if ("WebSocket" in window) {
        this.HAS_.ws = new WebSocket(this.HAS_.SERVER);
        this.HAS_.ws.onopen = function () {
          this.HAS_.wsconn = true;
          if (this.user) this.HASlogin();
        }.bind(this);
        this.HAS_.ws.onmessage = function (event) {
          console.log(event.data);
          const message =
            typeof event.data == "string" ? JSON.parse(event.data) : event.data;
          // Process HAS <-> PKSA protocol
          if (message.cmd) {
            switch (message.cmd) {
              case "auth_wait":
                this.HAS_.ws_status = "waiting";

                // Update QRCode
                const json = JSON.stringify({
                  account: this.user,
                  uuid: message.uuid,
                  key: this.HAS_.auth_key,
                  host: this.HAS_.SERVER,
                });

                const URI = `has://auth_req/${btoa(json)}`;
                var url =
                  "https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=" +
                  URI;
                this.haspic = url;
                this.haspich = 250;
                setTimeout(
                  function () {
                    this.haspic = "/img/hiveauth.svg";
                    this.haspich = 50;
                    this.HAS_.ws_status = "login failed";
                  }.bind(this),
                  60000
                );
                break;
              case "auth_ack":
                this.HAS_.ws_status = "decrypting";

                try {
                  // Try to decrypt and parse payload data
                  message.data = JSON.parse(
                    CryptoJS.AES.decrypt(
                      message.data,
                      this.HAS_.auth_key
                    ).toString(CryptoJS.enc.Utf8)
                  );
                  this.HAS_.ws_status = "";
                  this.HAS_.token = message.data.token;
                  this.HAS_.expire = message.data.expire;
                  localStorage.setItem(
                    this.user + "HAS",
                    `${message.data.token},${message.data.expire},${this.HAS_.auth_key}`
                  );
                  this.haspic = "/img/hiveauth.svg";
                  this.haspich = 50;
                } catch (e) {
                  this.haspic = "/img/hiveauth.svg";
                  this.haspich = 50;
                  this.HAS_.ws_status = "login failed";
                  this.HASlogout();
                }
                break;
              case "auth_nack":
                this.HASlogout();
                break;
              case "sign_wait":
                this.HAS_.ws_status = `transaction ${message.uuid} is waiting for approval`;
                break;
              case "sign_ack":
                this.HAS_.ws_status = `transaction ${message.uuid} approved`;
                console.log(message);
                console.log(message.data);
                //this.statusFinder(r, obj);
                break;
              case "sign_nack":
                this.HAS_.ws_status = `transaction ${message.uuid} has been declined`;
                break;
              case "sign_err":
                this.HAS_.ws_status = `transaction ${message.uuid} failed: ${message.error}`;
                break;
            }
          }
        }.bind(this);
        // websocket is closed.
        this.HAS_.ws.onclose = function () {
          this.HAS_.wsconn = false;
          this.HASlogout();
        }.bind(this);
      } else {
        this.HAS_.wsa = false;
        this.HAS_.ws_status = "This Browser does not support HAS (WebSocket)";
      }
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
      const HAS = localStorage.getItem(this.user + "HAS");
      if (HAS) {
        const now = new Date().getTime();
        if (now < HAS.split(",")[1]) {
          this.HAS_.token = HAS.split(",")[0];
          this.HAS_.expire = HAS.split(",")[1];
          this.HAS_.auth_key = HAS.split(",")[2]
          this.useHAS();
        } else {
          localStorage.removeItem(this.user + "HAS");
        }
      }
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
      if (this.HAS) this.HASsetup();
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
    if ("WebSocket" in window) this.HAS_.wsa = true;
    else this.HAS_.wsa = false;
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
        <li class="nav-item"><a class="nav-link disabled" href="/apps/"><i class="fa-solid fa-mountain-sun me-2"></i>HUB</a></li>
        <li class="nav-item"><a class="nav-link" href="/nfts/sets#dlux"><i class="fa-solid fa-store me-2"></i>NFTS</a></li>
        <li class="nav-item"><a class="nav-link" href="/dex#dlux"><i class="fa-solid fa-building-columns me-2"></i>DEX</a></li>
        <li class="nav-item"><a class="nav-link" href="/docs/"><i class="fa-solid fa-book me-2"></i>DOCS</a></li>
      </ul>


	      <ul class="navbar-nav me-5" id="loginMenu" v-show="!user">
	        <li class="nav-item"><a class="nav-link" href="/about/">About</a></li>
	        <li class="nav-item"><a class="nav-link" href="https://signup.hive.io/">Get Account</a></li>
	        <li class="nav-item">
            
              <button class="btn btn-primary ms-3" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasUsers" aria-controls="offcanvasUsers">Login</button>

          </li>
      	</ul>

        <a href="#" class="nav-link d-flex align-items-center text-white-50 me-4" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasUsers" aria-controls="offcanvasUsers">
          <img :src="avatar" id="userImage" alt="" width="30" height="30" class="img-fluid rounded-circle bg-light me-1 cover">
			    <span id="userName" class="ms-2 d-none d-md-block">{{user}}</span>
        </a>

	      <ul class="navbar-nav d-none me-5" v-show="user" id="userMenu">
          <li class="nav-item d-flex align-items-center d-none"><a class="nav-link" href="/new/"><i class="fa-solid fa-plus me-2"></i>CREATE</a></li>
		      <li class="nav-item dropdown">
		        <a class="nav-link dropdown-toggle dropdown-bs-toggle text-white-50" id="userDropdown" role="button" aria-expanded="false" data-bs-toggle="dropdown" href="#">
			      <img :src="avatar" id="userImage" alt="" width="30" height="30" class="img-fluid rounded-circle bg-light me-1 cover">
			      <span id="userName" class="me-1">{{user}}</span></a>
            <ul class="dropdown-menu dropdown-menu-dark pt-0" aria-labelledby="userDropdown">
			        <li class="d-none"><a class="dropdown-item disabled" href="/me#blog/" onClick="showTab('blog')"><i class="fas fa-user fa-fw me-2"></i>Profile</a></li>
			        <li class="d-none"><a class="dropdown-item disabled" href="/me#wallet/" onClick="showTab('wallet')"><i class="fas fa-wallet fa-fw me-2"></i>Wallet</a></li>
			        <li class="d-none"><a class="dropdown-item disabled" href="/me#inventory/" onClick="showTab('inventory')"><i class="fas fa-boxes fa-fw me-2"></i>Inventory</a></li>
			        <li class="d-none"><a class="dropdown-item disabled" href="/me#node/" onClick="showTab('node')"><i class="fas fa-robot fa-fw me-2"></i>Node</a></li>
			        <li class="d-none"><a class="dropdown-item disabled" href="/me#settings/" onClick="showTab('settings')"><i class="fas fa-cog fa-fw me-2"></i>Settings</a></li>
              <li class="d-none"><hr class="dropdown-divider"></li>
			        <li class="d-none"><a class="dropdown-item disabled" href="/about/"><i class="fas fa-info-circle fa-fw me-2"></i>About</a></li>
              <li class="d-none"><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="#" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasUsers" aria-controls="offcanvasUsers"><i class="fas fa-user-friends me-2"></i>Users</a></li>
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
            <button v-if="HAS" class="btn btn-hiveauth h-100 w-100 dropdown-toggle" :class="{'bg-white':haspich > 100}"><img :src="haspic" :height="haspich + 'px'" class="img-responsive p-2 mx-3"><p v-show="haspich > 100" class="text-dark">Scan with PKSA App for {{user}}</p></button>
            <button v-if="HSR" class="btn btn-hivesigner h-100 w-100 dropdown-toggle"><img src="/img/hivesigner.svg" height="50px" class="img-responsive p-2 mx-3"></button>
          </button>
          <ul class="dropdown-menu dropdown-menu-dark text-center bg-black p-2" aria-labelledby="authDropdown">
            <li class="p-2"><button class="btn btn-hivekeychain h-100 w-100" @click="useKC()"><img src="/img/keychain.png" class="img-responsive" height="50px"></button></li>
            <li class="p-2" v-if="HAS_.wsa"><button class="btn btn-hiveauth h-100 w-100" @click="useHAS()"><img src="/img/hiveauth.svg" class="img-responsive" height="50px"></button></li>
            <li class="p-2"><button class="btn btn-hivesigner h-100 w-100" @click="useHS()"><img src="/img/hivesigner.svg" class="img-responsive" height="50px"></button></li>
          </ul>
        </div>
        <div class="small text-muted text-center mt-2 d-none">
        <span v-if="HKC">Hive Keychain requires a Firefox or Chrome extension.</span>
        <span v-if="HAS">Hive Auth requires websockets and a PKSA Application.</span>
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
        <div class="flex-fill text-center"><a class="link-info" href="#" @click="setUser(name);toggleAccountMenu()" data-bs-dismiss="offcanvas">@{{name}}</a></div>
        <div class="flex-shrink"><a href="#" @click="deleteRecentUser(name)" alt="Remove username" class="ms-auto link-secondary"><i class="fa-solid fa-trash-can"></i></a></div>
      </div>
      <div class="d-flex justify-content-between align-items-center m-3 pb-3 border-dark border-bottom" v-if="filterUsers" v-for="name in filterRecents">
        <div class="flex-fill text-center"><a class="link-info" href="#" @click="setUser(name);toggleAccountMenu()" data-bs-dismiss="offcanvas">@{{name}}</a></div>
        <div class="flex-shrink"><a href="#" @click="deleteRecentUser(name);searchRecents()" alt="Remove username" class="ms-auto link-secondary"><i class="fa-solid fa-trash-can"></i></a></div>
      </div>
    </div>
  </div>
  </div>
</div>`,
};
