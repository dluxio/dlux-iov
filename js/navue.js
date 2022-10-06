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
        uri: "",
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
      if (op.txid) {
        op.time = new Date().getTime();
        op.status = "Pending your approval";
        op.delay = 5000;
        op.title = op.id ? op.id : op.cj ? op.cj.memo : "No Waiter";
        if(!op.api)op.api = this.lapi;
        this.ops.push(op);
        this.$emit("ack", op.txid);
        if (op.type == "cja") {
          this.broadcastCJA(op);
        } else if (this.op.type == "xfr") {
          this.broadcastTransfer(op);
        } else if (this.op.type == "comment") {
          this.broadcastComment(op);
        } else if (this.op.type == "vote") {
          this.broadcastVote(op);
        } else if (this.op.type == "raw") {
          this.broadcastRaw(op);
        } else if (this.op.type == "sign_headers") {
          this.signHeaders(op);
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
      localStorage.setItem("signer", "HAS");
      if (this.user) this.HASsetup();
    },
    useHS() {
      this.HAS = false;
      this.HKC = false;
      this.HSR = true;
      localStorage.setItem("signer", "HSR");
    },
    useKC() {
      this.HAS = false;
      this.HKC = true;
      this.HSR = false;
      localStorage.setItem("signer", "HKC");
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
    broadcastRaw(obj) {
      var op = [
        this.user,
        obj.op,
        obj.key || 'active',
      ];
      this.sign(op)
        .then((r) => {
          if(obj.id)this.statusFinder(r, obj);
        })
        .catch((e) => {
          console.log(e);
        });
    },
    signHeaders(obj) {
      var op = [
        this.user,
        obj.challenge,
        obj.key || 'posting',
      ];
      this.signOnly(op)
        .then((r) => {
          console.log('signHeaders Return', r)
          if(r){
            localStorage.setItem(
            `${this.user}:auth`,
            `${obj.challenge}:${r}`
          );
          obj.callbacks[0](`${obj.challenge}:${r}`, console.log('callback?'));
          }
        })
        .catch((e) => {
          console.log(e);
        });
    },
    broadcastVote(obj) {
      var op = [
        this.user,
        [
          [
            "vote",
            {
              voter: this.user,
              author: obj.cj.author,
              permlink: obj.cj.permlink,
              weight: obj.cj.weight,
            },
          ],
        ],
        "posting",
      ];
      this.sign(op)
        .then((r) => {
          this.statusFinder(r, obj);
        })
        .catch((e) => {
          console.log(e);
        });
    },
    broadcastComment(obj) {
      var op = [
        this.user,
        [
          [
            "comment",
            {
              author: this.user,
              title: obj.cj.title,
              body: obj.cj.body,
              parent_author: obj.cj.parent_author,
              parent_permlink: obj.cj.parent_permlink,
              permlink: obj.cj.permlink,
              json_metadata: obj.cj.json_metadata,
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
          console.log({ op });
          this.HASsign(op);
          reject("No TXID");
        } else {
          console.log("HSR");
          this.HSRsign(op);
          reject("No TXID");
        }
      });
    },
    signOnly(op) {
      return new Promise((resolve, reject) => {
        if (this.HKC) {
          console.log("HKC");
          this.HKCsignOnly(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        } else if (this.HAS) {
          console.log({ op });
          this.HASsignOnly(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e))
        } else {
          alert('This feature is not supported with Hive Signer')
          //this.HSRsignOnly(op);
          reject("Not Supported");
        }
      });
    },
    HASsignOnly(op){
      return new Promise ((res, rej) => {
        const now = new Date().getTime();
        if (now > this.HAS_.expire) {
          alert(`Hive Auth Session expired. Please login again.`);
          return;
        }
        const sign_data = {
          key_type: op[2],
          challenge: `${op[0]}:${op[1]}`
        };
        const data = CryptoJS.AES.encrypt(
          JSON.stringify(sign_data),
          this.HAS_.auth_key
        ).toString();
        const payload = {
          cmd: "challenge_req",
          account: this.user,
          token: this.HAS_.token,
          data: data,
        };
        this.HAS_.ws.send(JSON.stringify(payload));
        alert("Review and Sign on your PKSA App");
      })
    },
    HKCsignOnly(op){
      return new Promise((res, rej) => {
        console.log(op)
        window.hive_keychain.requestSignBuffer(
          op[0],
          `${op[0]}:${op[1]}`,
          op[2],
          (sig) => {
            if (sig.error) rej(sig);
            else res(sig.result);
          }
        );
      });
    },
    HSRsign(op) {
      if (op[1][0][0] == "custom_json") {
        if (window.confirm("Open Hive Signer in a new tab?")) {
          window.open(
            `https://hivesigner.com/sign/custom-json?authority=active&required_auths=%5B%22${
              this.user
            }%22%5D&required_posting_auths=%5B%5D&id=${
              op[1][0][1].id
            }&json=${encodeURIComponent(op[1][0][1].json)}`,
            "_blank"
          );
        }
      } else if (op[1][0][0] == "transfer") {
        window.open(
          `https://hivesigner.com/sign/transfer?authority=active&from=${
            op[1][0][1].from
          }&to=${op[1][0][1].to}&amount=${
            op[1][0][1].amount
          }&memo=${encodeURIComponent(op[1][0][1].memo)}`,
          "_blank"
        );
      } else {
        alert("Transaction Type not supported");
      }
    },
    HASsign(op) {
      const now = new Date().getTime();
      if (now > this.HAS_.expire) {
        alert(`Hive Auth Session expired. Please login again.`);
        return;
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
      alert("Review and Sign on your PKSA App");
    },
    HASlogin() {
      const auth_data = {
        app: this.HAS_.APP_DATA,
        token: undefined,
        challenge: undefined,
      };
      console.log("Login: ", this.user);
      if (!this.HAS_.auth_key) this.HAS_.auth_key = uuidv4();
      const data = CryptoJS.AES.encrypt(
        JSON.stringify(auth_data),
        this.HAS_.auth_key
      ).toString();
      const payload = { cmd: "auth_req", account: this.user, data: data };
      if (this.HAS_.ws) this.HAS_.ws.send(JSON.stringify(payload));
      else this.HASsetup();
    },
    HASlogout() {
      this.HAS_.token = "";
      this.HAS_.expire = "";
      this.user = "";
    },
    HASsetup() {
      if ("WebSocket" in window) {
        this.HAS_.ws = new WebSocket(this.HAS_.SERVER);
        this.HAS_.ws.onopen = function () {
          console.log("OnOpen - WS");
          this.HAS_.wsconn = true;
          const session = localStorage.getItem(this.user + "HAS");
          const now = new Date().getTime();
          console.log({ session });
          if (session && now < session.split(",")[1]) {
            this.HAS_.token = session.split(",")[0];
            this.HAS_.expire = session.split(",")[1];
            this.HAS_.auth_key = session.split(",")[2];
          } else if (session) {
            localStorage.removeItem(this.user + "HAS");
            this.HASlogin();
          } else {
            this.HASlogin();
          }
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
                this.HAS_.uri = URI;
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
              case "challenge_wait":
                this.HAS_.ws_status = `challenge ${message.uuid} is waiting for signature`;
                break;
              case "challenge_ack":
                this.HAS_.ws_status = `challenge ${message.uuid} signed`;
                console.log(message);
                console.log(message.data);
                //this.statusFinder(r, obj);
                break;
              case "challenge_nack":
                this.HAS_.ws_status = `challenge ${message.uuid} has been declined`;
                break;
              case "challenge_err":
                this.HAS_.ws_status = `challenge ${message.uuid} failed: ${message.error}`;
                break;
            }
          }
        }.bind(this);
        // websocket is closed.
        this.HAS_.ws.onclose = function () {
          this.HAS_.wsconn = false;
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
      if (this.HAS && HAS) {
        const now = new Date().getTime();
        if (now < HAS.split(",")[1]) {
          this.HAS_.token = HAS.split(",")[0];
          this.HAS_.expire = HAS.split(",")[1];
          this.HAS_.auth_key = HAS.split(",")[2];
          this.useHAS();
        } else {
          localStorage.removeItem(this.user + "HAS");
          this.HASlogin();
        }
      } else if (this.HAS) {
        this.HASlogin();
      }
    },
    logout() {
      localStorage.removeItem("user");
      this.user = "";
      this.$emit("logout", "");
    },
    setUser(id) {
      this.HAS_.token = "";
      this.haspic = "/img/hiveauth.svg";
      this.haspich = 50;
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
      localStorage.removeItem(this.user + "HAS");
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
    const signer = localStorage.getItem("signer");
    if (signer == "HSR") this.useHS();
    else if (signer == "HAS") this.useHAS();
    else this.useKC();
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
<header class="navbar navbar-expand-sm navbar-dark fixed-top dnav">
  <div class="container-fluid">
    <!--pwa nav toggle-->
    <a class="text-white d-sm-none" style="font-size: 1.5em;" data-bs-toggle="offcanvas" href="#offcanvasNav" role="button" aria-controls="offcanvasExample">
      <i class="fa-solid fa-bars"></i>
    </a>
    <!--desktop nav collapse-->
      <div class="collapse navbar-collapse " id="navbarSupportedContent">
        <ul class="navbar-nav me-auto">
          <li><a class="navbar-brand" href="/"><img src="/img/dlux-hive-logo-alpha.svg" alt="dlux-logo" width="40" height="40"></a></li> 
          <li class="nav-item"><a class="nav-link" href="/hub/"><i class="fa-solid fa-mountain-sun me-2"></i>HUB</a></li>
          <li class="nav-item"><a class="nav-link" href="/nfts/sets/"><i class="fa-solid fa-store me-2"></i>NFTS</a></li>
          <li class="nav-item"><a class="nav-link" href="/dex/"><i class="fa-solid fa-building-columns me-2"></i>DEX</a></li>
          <li class="nav-item"><a class="nav-link" href="/docs/"><i class="fa-solid fa-book me-2"></i>DOCS</a></li>
        </ul>
        <!--user dropdown-->
	      <ul class="navbar-nav" v-show="user" id="userMenu">
          <li class="nav-item d-flex align-items-center"><a class="nav-link" href="/new/"><i class="fa-solid fa-plus me-2"></i></a></li>
		      <li class="nav-item dropdown d-flex align-items-center"></li>
          <a href="#" v-show="user" class="p-0 nav-link d-flex align-items-center text-white-50" data-bs-toggle="offcanvas" data-bs-target="#offcanvasUsers" aria-controls="offcanvasUsers">
            <img :src="avatar" id="userImage" alt="" width="30" height="30" class="img-fluid rounded-circle bg-light cover"></a>
		        <a class="nav-link dropdown-toggle dropdown-bs-toggle text-white-50" id="userDropdown" role="button" aria-expanded="false" data-bs-toggle="dropdown" href="#">
			      <span id="userName" class="me-1">{{user}}</span></a>
            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end pt-0" aria-labelledby="userDropdown">
			        <li class=""><a class="dropdown-item" :href="'/me#blog/'" onClick="showTab('blog')"><i class="fas fa-user fa-fw me-2"></i>Profile</a></li>
			        <li class=""><a class="dropdown-item" :href="'/me#wallet/'" onClick="showTab('wallet')"><i class="fas fa-wallet fa-fw me-2"></i>Wallet</a></li>
			        <li class=""><a class="dropdown-item" :href="'/me#inventory/'" onClick="showTab('inventory')"><i class="fas fa-boxes fa-fw me-2"></i>Inventory</a></li>
			        <li class="d-none"><a class="dropdown-item" :href="'/me#node/'" onClick="showTab('node')"><i class="fas fa-robot fa-fw me-2"></i>Node</a></li>
			        <li class="d-none"><a class="dropdown-item" :href="'/me#settings/'" onClick="showTab('settings')"><i class="fas fa-cog fa-fw me-2"></i>Settings</a></li>
              <li class=""><hr class="dropdown-divider"></li>
			        <li class=""><a class="dropdown-item" href="/about/"><i class="fas fa-info-circle fa-fw me-2"></i>About</a></li>
              <li class=""><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="#" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasUsers" aria-controls="offcanvasUsers"><i class="fas fa-user-friends me-2"></i>Users</a></li>
			        <li><a class="dropdown-item" href="#" @click="logout()"><i class="fas fa-power-off fa-fw me-2"></i>Logout</a></li>
		        </ul>
        </ul>
      </div>
      <!--pwa brand-->
      <a class="navbar-brand d-sm-none d-flex align-items-center" href="/"><img src="/img/dlux-hive-logo-alpha.svg" alt="dlux-logo" width="40" height="40" class="me-2"><h1 class="m-0">DLUX</h1></a>
      <div>
        <ul class="navbar-nav" id="loginMenu" v-show="!user">
          <li class="nav-item d-none"><a class="nav-link" href="/about/">About</a></li>
          <li class="nav-item"></li>
          <li class="nav-item"><button class="btn btn-primary ms-3" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasUsers" aria-controls="offcanvasUsers">Login</button></li>
        </ul>
        <ul class="navbar-nav d-sm-none" v-show="user">
          <li>
		        <a class="nav-link dropdown-toggle dropdown-bs-toggle text-white-50 text-end" id="userDropdown" role="button" aria-expanded="false" data-bs-toggle="dropdown" href="#">
			      <span id="userName" class="ms-auto me-1"><img :src="avatar" id="userImage" alt="" width="30" height="30" class="img-fluid rounded-circle bg-light cover"></span></a>
            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end pt-0" aria-labelledby="userDropdown" style="position: absolute;">
			        <li class=""><a class="dropdown-item" :href="'/me#blog/'" onClick="showTab('blog')"><i class="fas fa-user fa-fw me-2"></i>Profile</a></li>
			        <li class=""><a class="dropdown-item" :href="'/me#wallet/'" onClick="showTab('wallet')"><i class="fas fa-wallet fa-fw me-2"></i>Wallet</a></li>
			        <li class=""><a class="dropdown-item" :href="'/me#inventory/'" onClick="showTab('inventory')"><i class="fas fa-boxes fa-fw me-2"></i>Inventory</a></li>
			        <li class="d-none"><a class="dropdown-item" :href="'/me#node/'" onClick="showTab('node')"><i class="fas fa-robot fa-fw me-2"></i>Node</a></li>
			        <li class="d-none"><a class="dropdown-item" :href="'/me#settings/'" onClick="showTab('settings')"><i class="fas fa-cog fa-fw me-2"></i>Settings</a></li>
              <li class=""><hr class="dropdown-divider"></li>
			        <li class=""><a class="dropdown-item" href="/about/"><i class="fas fa-info-circle fa-fw me-2"></i>About</a></li>
              <li class=""><hr class="dropdown-divider"></li>
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





<div class="offcanvas offcanvas-start bg-dark text-white-50" style="max-width:200px" tabindex="-1" id="offcanvasNav" aria-labelledby="offcanvasLeftLabel">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title" id="offcanvasLeftLabel"><a class="navbar-brand d-sm-none text-white d-flex align-items-center" href="/"><img src="/img/dlux-hive-logo-alpha.svg" class="me-2" alt="dlux-logo" width="40" height="40">DLUX</a></h5>
    <button type="button" class="btn-close btn-close-white text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
  </div>
  <div class="offcanvas-body">
    <div class="d-flex justify-content-center">
      <ul class="navbar-nav">      
        <li class="nav-item"><h4><a class="nav-link text-white-50" href="/hub/"><i class="fa-solid fa-mountain-sun me-3"></i>HUB</a></h4></li>
        <li class="nav-item"><h4><a class="nav-link text-white-50" href="/nfts/sets/"><i class="fa-solid fa-store me-3"></i>NFTS</a></h4></li>
        <li class="nav-item"><h4><a class="nav-link text-white-50" href="/dex/"><i class="fa-solid fa-building-columns me-3"></i>DEX</a></h4></li>
        <li class="nav-item"><h4><a class="nav-link text-white-50" href="/docs/"><i class="fa-solid fa-book me-3"></i>DOCS</a></h4></li>
      </ul>
    </div>
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

        <div class="dropdown">
          <button class="btn btn-secondary w-100 p-0" role="button" id="authDropdown" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false" >
            <button v-if="HKC" class="btn btn-hivekeychain h-100 w-100 dropdown-toggle"><img src="/img/keychain.png" height="50px" class="img-responsive p-2 mx-3"></button>
            <button v-if="HAS" class="btn btn-hiveauth h-100 w-100 dropdown-toggle"><img src="/img/hiveauth.svg" class="img-responsive p-2 mx-3" height="50px"></button>
            <button v-if="HSR" class="btn btn-hivesigner h-100 w-100 dropdown-toggle"><img src="/img/hivesigner.svg" height="50px" class="img-responsive p-2 mx-3"></button>
          </button>
          <ul class="dropdown-menu dropdown-menu-dark text-center bg-black p-2" aria-labelledby="authDropdown">
            <li class="p-2"><button class="btn btn-hivekeychain h-100 w-100" @click="useKC()"><img src="/img/keychain.png" class="img-responsive" height="50px"></button></li>
            <li class="p-2"><button class="btn btn-hiveauth h-100 w-100" @click="useHAS()"><img src="/img/hiveauth.svg" class="img-responsive" height="50px"></button></li>
            <li class="p-2"><button class="btn btn-hivesigner h-100 w-100" @click="useHS()"><img src="/img/hivesigner.svg" class="img-responsive" height="50px"></button></li>
          </ul>
        </div>


        <div class="small text-muted text-center mt-2">
          <span v-if="HKC">Hive Keychain requires a Firefox or Chrome extension</span>
          <span v-if="HAS">Hive Auth requires websockets and a PKSA Application</span>
          <span v-if="HSR">Hive Signer generates a link</span>
        </div>
          

      </div>
    </div>

    <div class="row mb-3">
      <label class="form-label d-none">Set and store username:</label>
      <div class="input-group">
        <span class="input-group-text bg-darkg border-dark text-white-50">@</span>
        <input v-model="userField"  autocapitalize="off" placeholder="username" @keyup.enter="setUser()" class="text-center form-control bg-darkg border-dark text-info">
        <span class="input-group-text bg-darkg border-dark"><a href="#" @click="setUser()" v-if="userField" class="link-info"><i class="fa-solid fa-circle-plus"></i></a></span>
      </div>
      <div class="small text-muted text-center mt-2">
        Usernames are only stored locally. <a class="no-decoration" target="_blank" href="https://signup.hive.io/">Get Account</a>
      </div>
    </div>

    <div class="row" v-if="HAS && haspich > 100">
      <div>
        <div class="bg-white rounded text-center">
          <a class="no-decoration" :href="HAS_.uri"><img :src="haspic" :height="haspich + 'px'" class="img-responsive p-2 mx-3"><p v-show="haspich > 100" class="text-dark">Tap or scan with PKSA App for {{user}}</p></a>
        </div>
      </div>
    </div>
      
    <div class="row mb-3">
      <div>
        <label class="form-label">Current user:</label>
        <div v-if="!user" class="bg-darkest px-4 py-2 mx-2">
          <img src="#" alt="" width="50" height="50" class="img-fluid rounded-circle bg-light me-1 cover">
          <span>NONE SELECTED</span>
        </div>
        <div v-if="user" class="bg-darkest d-flex align-items-center p-2">
          <img :src="avatar" id="userImage" alt="" width="50" height="50" class="img-fluid rounded-circle bg-light me-2 cover">
          <span id="userName">{{user}}</span>
          <div class="ms-auto">
            <a class="btn btn-outline-secondary me-2" :class="[{'btn-outline-success':HAS_.wsconn && HAS_.token},{'btn-outline-warning':!HAS_.wsconn && HAS_.token},{'btn-outline-secondary':!HAS_.token}]" :href="HAS_.uri" v-if="HAS"><i class="fa-solid fa-satellite-dish"></i></a>
            <a class="btn btn-outline-danger" href="#/" @click="logout()"><i class="fas fa-power-off fa-fw"></i></a>
          </div>
        </div>
      </div>
    </div>

    <div class="row mb-3" v-if="recentUsers.length">
        <label class="form-label">Recent usernames:</label>
        <div class="input-group">
          <span class="input-group-text bg-darkg border-dark text-white-50">@</span>
          <input v-model="filterUsers" autocapitalize="off" placeholder="search" @keyup="searchRecents()" class="text-center form-control bg-darkg border-dark text-info">
          <span class="input-group-text bg-darkg border-dark"><a href="#/" @click="setValue('filterUsers', '')" v-if="filterUsers"><i class="fa-solid fa-xmark"></i></a></span>
        </div>
      </div>
      <div class="d-flex justify-content-between align-items-center m-3 pb-3 border-dark border-bottom" v-if="!filterUsers" v-for="name in recentUsers">
        <div class="flex-fill text-center"><a class="link-info" href="#/" @click="setUser(name);toggleAccountMenu()">@{{name}}</a></div>
        <div class="flex-shrink"><a href="#" @click="deleteRecentUser(name)" alt="Remove username" class="ms-auto link-secondary"><i class="fa-solid fa-trash-can"></i></a></div>
      </div>
      <div class="d-flex justify-content-between align-items-center m-3 pb-3 border-dark border-bottom" v-if="filterUsers" v-for="name in filterRecents">
        <div class="flex-fill text-center"><a class="link-info" href="#/" @click="setUser(name);toggleAccountMenu()">@{{name}}</a></div>
        <div class="flex-shrink"><a href="#" @click="deleteRecentUser(name);searchRecents()" alt="Remove username" class="ms-auto link-secondary"><i class="fa-solid fa-trash-can"></i></a></div>
      </div>
    </div>
  </div>
  </div>
</div>`,
};
