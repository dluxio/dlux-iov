import ToastVue from "/js/toastvue.js";
import StWidget from "/js/stwidget.js";

export default {
  data() {
    return {
      chatVisible: false,
      userPinFeedback: "",
      passwordField: "",
      level: "posting",
      decrypted: {
        pin: false,
        accounts: {
        },
      },
      HAS: false,
      HKC: true,
      HSR: false,
      PEN: false,
      PWA: false,
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
      decrypted: {
        pin: false,
        accounts: {
        },
      },
      PIN: "1234",
      PENstatus: "",
    };
  },
  components: {
    "toast-vue": ToastVue,
  },
  emits: ["login", "logout", "refresh", "ack"],
  props: {
    op: {
      type: Object,
      required: true,
      default: function () {
        return {}
      }
    },
    node: {
      type: Boolean,
      required: false,
      default: false
    },
    lapi: {
      type: String,
      required: false,
      default: ""
    },
  },
  watch: {
    op(op, oldOp) {
      if (op.txid) {
        op.time = new Date().getTime();
        op.status = "Pending your approval";
        op.delay = 5000;
        op.title = op.id ? op.id : op.cj ? op.cj.memo : "No Waiter";
        if (!op.api) op.api = this.lapi;
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
    toggleChat() {
      this.chatVisible = !this.chatVisible;
    },
    storeKey(level, key) {
      //get hive user
      fetch("https://api.hive.blog", {
        method: "POST",
        body: JSON.stringify([
          "get_accounts",
          [[this.account]],
        ]),

      }).then(r => {
        var PublicKey = hiveTx.PublicKey.from(
          r[0][level].key_auths[0][0]
        );
        var PrivateKey = hiveTx.PrivateKey.from(key);
        var success = PublicKey.verify(
          "Testing123",
          PrivateKey.sign("Testing123")
        );
        if (success) {
          if (!this.decrypted.accounts[this.account]) this.decrypted[this.account] = {};
          this.decrypted[this.account][level] = key;
          var encrypted = CryptoJS.AES.encrypt(
            JSON.stringify(this.decrypted),
            this.PIN
          );
          localStorage.setItem("PEN", encrypted);
        } else {
          this.PENstatus = "Invalid Key";
        }
      })
    },
    decryptPEN(user = this.account) {
      var PEN = localStorage.getItem("PEN");
      if (PEN) {
        var decrypted = CryptoJS.AES.decrypt(encrypted, this.PIN);
        this.decrypt = JSON.parse(decrypted);
        sessionStorage.setItem('pen', decrypted)
      }
    },
    useHAS() {
      this.HAS = true;
      this.HKC = false;
      this.HSR = false;
      this.PEN = false;
      localStorage.setItem("signer", "HAS");
      if (this.user) this.HASsetup();
    },
    useHS() {
      this.HAS = false;
      this.HKC = false;
      this.HSR = true;
      this.PEN = false;
      localStorage.setItem("signer", "HSR");
    },
    useKC() {
      this.HAS = false;
      this.HKC = true;
      this.HSR = false;
      this.PEN = false;
      localStorage.setItem("signer", "HKC");
    },
    usePEN() {
      this.HAS = false;
      this.HKC = false;
      this.HSR = false;
      this.PEN = true;
      localStorage.setItem("signer", "PEN");
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
          try {
            obj.callbacks[0](`${obj.challenge}:${r}`, console.log("callback?"));
          } catch (e) { }
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
          try {
            obj.callbacks[0](`${obj.challenge}:${r}`, console.log("callback?"));
          } catch (e) { }
        })
        .catch((e) => {
          console.log(e);
        });
    },
    broadcastRaw(obj) {
      var op = [this.user, obj.op, obj.key || "active"];
      this.sign(op)
        .then((r) => {
          if (obj.id) this.statusFinder(r, obj);
          try {
            obj.callbacks[0](`${obj.challenge}:${r}`, console.log("callback?"));
          } catch (e) { }
        })
        .catch((e) => {
          console.log(e);
        });
    },
    signHeaders(obj) {
      var op = [this.user, obj.challenge, obj.key || "posting"];
      this.signOnly(op)
        .then((r) => {
          console.log("signHeaders Return", r);
          if (r) {
            localStorage.setItem(`${this.user}:auth`, `${obj.challenge}:${r}`);
            obj.callbacks[0](`${obj.challenge}:${r}`, console.log("callback?"));
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
          console.log("HKCsign", op);
          this.HKCsign(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        } else if (this.HAS) {
          console.log(op);
          this.HASsign(op);
          reject("No TXID");
        } else if (this.PEN) {
          console.log(op);
          this.PENsign(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
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
          console.log("HKCsignOnly");
          this.HKCsignOnly(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        } else if (this.PEN) {
          console.log({ op });
          this.PENsignOnly(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        } else if (this.HAS) {
          console.log({ op });
          this.HASsignOnly(op)
            .then((r) => resolve(r))
            .catch((e) => reject(e));
        } else {
          alert("This feature is not supported with Hive Signer");
          //this.HSRsignOnly(op);
          reject("Not Supported");
        }
      });
    },
    HASsignOnly(op) {
      return new Promise((res, rej) => {
        const now = new Date().getTime();
        if (now > this.HAS_.expire) {
          alert(`Hive Auth Session expired. Please login again.`);
          return;
        }
        const sign_data = {
          key_type: op[2],
          challenge: `${op[0]}:${op[1]}`,
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
      });
    },
    HKCsignOnly(op) {
      return new Promise((res, rej) => {
        console.log(op);
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
    PENsignOnly(op) {
      return new Promise((res, rej) => {
        if (typeof op[1] == "string") op[1] = JSON.parse(op[1]);
        console.log(op);
        // get private keys from local storage
        var key = localStorage.getItem(this.user + ":" + op[2]);
        if (!key) {
          key = prompt(
            "Please enter your private " +
            op[2] +
            " key for @" +
            this.user +
            ":",
            ""
          );
          localStorage.setItem(this.user + ":" + op[2], key);
        }
        const tx = new hiveTx.Transaction();
        tx.create(op[0]).then(() => console.log(tx.transaction));
        const privateKey = hiveTx.PrivateKey.from(key);
        tx.sign(privateKey);
        if (!tx.signedTransaction) reject('Failed to Sign')
        resolve(tx.signedTransaction)
      });
    },
    HSRsign(op) {
      if (op[1][0][0] == "custom_json") {
        if (window.confirm("Open Hive Signer in a new tab?")) {
          window.open(
            `https://hivesigner.com/sign/custom-json?authority=active&required_auths=%5B%22${this.user
            }%22%5D&required_posting_auths=%5B%5D&id=${op[1][0][1].id
            }&json=${encodeURIComponent(op[1][0][1].json)}`,
            "_blank"
          );
        }
      } else if (op[1][0][0] == "transfer") {
        window.open(
          `https://hivesigner.com/sign/transfer?authority=active&from=${op[1][0][1].from
          }&to=${op[1][0][1].to}&amount=${op[1][0][1].amount
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
          if (typeof op[1] == "string") op[1] = JSON.parse(op[1]);
          else op[1] = JSON.parse(JSON.stringify(op[1]))
          console.log(op);
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
    PENsign(op) {
      return new Promise((resolve, reject) => {
        if (typeof op[1] == "string") op[1] = JSON.parse(op[1]);
        console.log(op);
        // get private keys from local storage
        var key = localStorage.getItem(this.user + ":" + op[2]);
        if (!key) {
          key = prompt(
            "Please enter your private " +
            op[2] +
            " key for @" +
            this.user +
            ":",
            ""
          );
          localStorage.setItem(this.user + ":" + op[2], key);
        }
        const tx = new hiveTx.Transaction();
        tx.create(op[0]).then(() => console.log(tx.transaction));
        const privateKey = hiveTx.PrivateKey.from(key);
        tx.sign(privateKey);
        tx.broadcast()
          .then((res) => resolve(res))
          .catch((e) => reject(e));
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
        obj.link = "https://hivehub.dev/tx/" + response.result.id;
        obj.txid = response.result.id;
        this.ops.push(obj);
        this.cleanOps(); //also stores it in localStorage
        this.statusPinger(response.result.id, obj.api, 0);
      }
    },
    statusPinger(txid, api, r) {
      if (r > 30) return;
      fetch(api + "/api/status/" + txid)
        .then((re) => re.json())
        .then((json) => {
          console.log(json, json.status.slice(0, 20));
          if (json.status.slice(0, 20) != "This TransactionID e") {
            if (json.status.indexOf(" minted ") > -1) {
              //changeDiv(id, json.status, "mint"); // worry about this later
              setTimeout(
                function () {
                  this.cleanOps(txid);
                }.bind(this),
                3000
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
    showTab(link) {
      if (!deepLink) return;
      deepLink(link);
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
    queueUser() {
      fetch("https://api.hive.blog", {
        method: "POST",
        body: JSON.stringify([
          "get_accounts",
          [[this.userField]],
        ]),

      }).then(r => {
        if (r[0].active.key_auths[0][0]) {
          this.userPinFeedback = "Valid User";
          this.pinSetup = {
            account: this.userField,
            activePub: r[0].active.key_auths[0],
            postingPub: r[0].posting.key_auths[0],
            memoPub: r[0].memo_key,
            ownerPub: r[0].owner.key_auths[0],
          }
        } else {
          this.userPinFeedback = "Invalid User";
        }
        var PublicKey = hiveTx.PublicKey.from(
          r[0][level].key_auths[0][0]
        );
        var PrivateKey = hiveTx.PrivateKey.from(key);
        var success = PublicKey.verify(
          "Testing123",
          PrivateKey.sign("Testing123")
        );
        if (success) {
          if (!this.decrypted.accounts[this.account]) this.decrypted[this.account] = {};
          this.decrypted[this.account][level] = key;
          var encrypted = CryptoJS.AES.encrypt(
            JSON.stringify(this.decrypted),
            this.PIN
          );
          localStorage.setItem("PEN", encrypted);
        } else {
          this.PENstatus = "Invalid Key";
        }
      })
      this.decrypted.accounts[this.account] = {
        posting: "",
        active: "",
        memo: "",
        owner: "",
        master: "",
      };
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
    addStingChat() {
      var stwidget = new StWidget("https://chat.peakd.com/t/hive-150900/0");
      stwidget.properties = {
        requireLogin: false,
        showSidebar: true,
        sidebar: 2,
        sidebar2enableSharedView: false,
        sidebarToggleByChannelNameOnDirectGroup: false,
        streambarExpand: true,
        streambarMode: 1,
        sidebarAddButton: 1,
        communityChannelNameFormat: "C/<title>/<name>",
        messageIconFlexClass: "block text-justify lg:text-left sm:flex",
        messageIconClass: "iconFloat",
        "--appCommunityIconFontSize": "18px",
        "--appCommunityIconSize": "42px",
        homeTabCommunities: false,
        homeTabPreferences: true,
        homeTabThemes: true,
        onlyPrependCommunities: false,
        prependCommunities: ["hive-150900"],
        defaultTheme: "Dark",
        "--appFontFamily": "'Lato'",
        "--appFontSize": "16px",
        "--appMessageFontFamily": "'Lato'",
        "--appMessageFontSize": "16px",
      };
      var element = stwidget.createElement('100%', 'calc(100% - 88px)', true/*overlay*/, true /*resizable*/);
      //optionally add style/positioning
      stwidget.setStyle({
        direction: "ltr",

        position: "fixed",
      });
      //Add the element to webpage

      document.getElementById("stingChat").appendChild(element);
    },
  },
  mounted() {
    const signer = localStorage.getItem("signer");
    const decrypted = sessionStorage.getItem('pen')
    if (decrypted) this.decrypted = JSON.parse(decrypted)
    if (signer == "HSR") this.useHS();
    else if (signer == "HAS") this.useHAS();
    else if (signer == "PEN" && this.decrypted) this.usePEN();
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
    // add sting script
    const script = document.createElement("script");
    script.src = "/js/stwidget.js";
    document.head.appendChild(script);
    // add sting chat
    this.addStingChat();

    const navMore = document.querySelector(".nav-more .nav-link");
    const dropdownMenus = document.querySelectorAll(".nav-dropdown");
    const bars = document.querySelectorAll(".nav-bars .bar");

    let isHoverListenerActive = false;

    function toggleNavMore(event) {
      event.preventDefault();
      bars.forEach(bar => bar.classList.toggle("x"));
    }

    function closeNavMore(event) {
      if (
        !navMore.contains(event.target) &&
        !Array.from(dropdownMenus).some(menu => menu.contains(event.target))
      ) {
        bars.forEach(bar => bar.classList.remove("x"));
      }
    }

    function dropdownHoverHandler(event) {
      dropdownMenus.forEach(otherDropdown => {
        const toggleButton = otherDropdown.querySelector(".dropdown-toggle");
        const dropdownInstance = bootstrap.Dropdown.getInstance(toggleButton);

        if (dropdownInstance && otherDropdown !== event.currentTarget) {
          dropdownInstance.hide();

          if (!navMore.matches(":hover")) {
            bars.forEach(bar => bar.classList.remove("x"));
          }
        }
      });
    }

    function addDropdownHoverListeners() {
      if (window.innerWidth > 768 && !isHoverListenerActive) {
        dropdownMenus.forEach(dropdown => {
          dropdown.addEventListener("mouseover", dropdownHoverHandler);
        });
        isHoverListenerActive = true;
      }
    }

    function removeDropdownHoverListeners() {
      if (isHoverListenerActive) {
        dropdownMenus.forEach(dropdown => {
          dropdown.removeEventListener("mouseover", dropdownHoverHandler);
        });
        isHoverListenerActive = false;
      }
    }

    function handleResize() {
      if (window.innerWidth > 768) {
        addDropdownHoverListeners();
      } else {
        removeDropdownHoverListeners();
      }
    }

    // Add event listeners when component is mounted
    if (navMore) {
      navMore.addEventListener("click", toggleNavMore);
    }
    document.addEventListener("click", closeNavMore);
    handleResize();
    window.addEventListener("resize", handleResize);

    // Store references for cleanup
    this._cleanup = () => {
      if (navMore) {
        navMore.removeEventListener("click", toggleNavMore);
      }
      document.removeEventListener("click", closeNavMore);
      window.removeEventListener("resize", handleResize);
      removeDropdownHoverListeners();
    };
  },
  beforeUnmount() {
    if (this._cleanup) {
      this._cleanup();
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
  template: `<div>
  <nav class="navbar navbar-floating navbar-expand-lg p-0 container">
    <ul class="navbar-nav mx-auto">
      <li class="nav-item">
        <a class="nav-link d-flex align-items-center" href="/">
          <svg class="nav-logo" viewBox="0 0 333 333" xmlns="http://www.w3.org/2000/svg">
            <polygon class="cls-1"
              points="184.59 135.97 184.21 135.97 110.55 11.06 219.49 9.03 228.91 24.43 137.69 26.25 146.62 41 165.61 72.39 184.6 103.79 193.82 119.03 211.76 119.03 248.48 119.03 284.59 119.02 302.68 119.02 256.79 39.98 273.78 40.15 329.46 134.96 184.59 135.97" />
            <polygon class="cls-2"
              points="110.55 11.06 184.21 135.97 184.59 135.97 175.83 150.85 175.52 150.85 101.87 27.04 110.55 11.06" />
            <polygon class="cls-3"
              points="184.01 40.5 146.62 41 137.69 26.25 228.91 24.43 184.6 103.79 174.99 87.86 201.39 40.27 184.08 40.5 184.01 40.5" />
            <polygon class="cls-1" points="56.71 41.63 74.44 41.74 148.19 166.21 129.63 166.16 56.71 41.63" />
            <polygon class="cls-2"
              points="85.44 214.65 102.95 182.4 111.45 166.74 102.39 151.26 83.85 119.57 65.61 88.41 56.48 72.79 11.43 152.31 2.99 137.56 56.71 41.63 129.63 166.16 60.3 293.15 3.54 200.14 12.08 184.24 59.71 262.05 67.94 246.89 85.44 214.65" />
            <polygon class="cls-2"
              points="184.08 40.5 201.39 40.27 174.99 87.86 184.6 103.79 165.61 72.39 184.01 40.5 184.08 40.5" />
            <polygon class="cls-2"
              points="211.76 118.76 256.63 39.89 256.79 39.98 302.68 119.02 284.59 119.02 284.59 118.95 266.04 87.37 256.42 71.01 230.02 118.48 211.76 118.76" />
            <polygon class="cls-3"
              points="56.48 72.79 65.61 88.41 65.55 88.45 47.66 120.4 38.4 136.96 92.7 135.78 102.16 151.4 11.43 152.5 11.43 152.31 56.48 72.79" />
            <polygon class="cls-3"
              points="256.42 71.01 266.04 87.37 265.75 87.54 248.48 118.39 248.48 119.03 211.76 119.03 211.76 118.76 230.02 118.48 256.42 71.01" />
            <polygon class="cls-1"
              points="83.85 119.57 102.39 151.26 102.16 151.4 92.7 135.78 38.4 136.96 47.66 120.4 47.95 120.56 83.29 119.89 83.85 119.57" />
            <polygon class="cls-3" points="175.83 150.85 184.59 135.97 329.46 134.96 320.41 150.21 175.83 150.85" />
            <polygon class="cls-3"
              points="129.63 166.16 148.19 166.21 148.38 166.53 78.48 292.56 60.3 293.15 129.63 166.16" />
            <polygon class="cls-1"
              points="48.62 214.87 67.94 246.89 59.71 262.05 12.08 184.24 102.95 182.4 94.06 198.74 39.65 199.99 48.59 214.81 48.62 214.87" />
            <polygon class="cls-3"
              points="102.95 182.4 85.44 214.65 48.62 214.87 48.59 214.81 39.65 199.99 94.06 198.74 102.95 182.4" />
            <polygon class="cls-1"
              points="175.84 182.61 319.13 180.4 330.01 196.91 185.61 198.39 175.84 182.61 175.84 182.61" />
            <polygon class="cls-2"
              points="175.47 182.61 175.84 182.61 175.84 182.61 185.61 198.39 113.76 323.97 104.73 308.18 175.47 182.61" />
            <polygon class="cls-3"
              points="167.45 261.43 149.16 293.24 140.56 308.18 231.79 307.99 222.72 323.59 113.76 323.97 185.61 198.39 330.01 196.91 276.31 291.28 259.33 291.82 303.59 213.44 284.52 213.57 249.4 213.81 230.83 213.93 212.56 214.06 194.63 214.18 185.75 229.62 167.45 261.43" />
            <polygon class="cls-2"
              points="212.56 214.06 230.83 213.93 258.27 260.81 267.49 244.22 284.52 213.57 303.59 213.44 259.33 291.82 259.17 291.92 212.56 214.06" />
            <polygon class="cls-1"
              points="230.83 213.93 249.4 213.81 267.23 244.08 267.49 244.22 258.27 260.81 230.83 213.93" />
            <polygon class="cls-2"
              points="167.45 261.43 185.75 229.62 176.49 245.76 203.93 292.76 186.62 292.91 186.56 292.91 167.45 261.43" />
            <polygon class="cls-1"
              points="186.56 292.91 186.62 292.91 203.93 292.76 176.49 245.76 185.75 229.62 231.79 307.99 140.56 308.18 149.16 293.24 186.56 292.91" />
          </svg>
          <span class="nav-brand ms-1">DLUX</span></a>
      </li>
      <li class="nav-item nav-hide">
        <a class="nav-link nav-highlight nav-title" href="/hub">HUB<span class="nav-subtitle">Social
            dApps</span></a>
      </li>
      <li class="nav-item nav-hide dropdown nav-dropdown">
        <a class="nav-link nav-highlight nav-title dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown"
          aria-expanded="false">NFTs<span class="nav-subtitle">Collectible PFPs &
            TCGs</span></a>
        <div class="hover-gap"></div>
        <ul class="dropdown-menu">
          <li>
            <a class="dropdown-item subnav-title" href="/nfts">Marketplace<span class="subnav-subtitle">Sales and
                Auctions</span></a>
          </li>
          <li>
            <a class="dropdown-item subnav-title" href="/nfts/sets">Browse Sets<span class="subnav-subtitle">Discover
                New Collections
              </span></a>
          </li>
        </ul>
      </li>
      <li class="nav-item nav-hide">
        <a class="nav-link nav-highlight nav-title" href="/dex">DEX<span class="nav-subtitle">Exchange
            Tokens</span></a>
      </li>
      <li v-if="!user" class="nav-item">
        <a class="nav-link nav-highlight nav-title" href="#" role="button" data-bs-toggle="modal"
          data-bs-target="#loginModal" aria-controls="loginModal">Login<span class="nav-subtitle">HIVE
            Username</span></a>
      </li>
      <li v-show="user" class="nav-item dropdown nav-dropdown">
        <a class="nav-link nav-highlight nav-title dropdown-toggle d-flex align-items-center" href="#" role="button"
          data-bs-toggle="dropdown" aria-expanded="false">
          <img :src="avatar" class="pfp rounded-circle img-fluid bg-mint"><span
            class="navbar-username ms-2">{{user}}</span></a>
        <div class="hover-gap"></div>
        <ul class="dropdown-menu container">
          <li>
            <a class="dropdown-item subnav-title" href="/user#blog/" @click="showTab('blog')">Profile<span
                class="subnav-subtitle">HIVE
                Blog</span></a>
          </li>
          <li>
            <a class="dropdown-item subnav-title" href="/user#wallet/" @click="showTab('wallet')">Wallet<span
                class="subnav-subtitle">Honeycomb Tokens</span></a>
          </li>
          <li>
            <a class="dropdown-item subnav-title" href="/user#inventory/" @click="showTab('inventory')">Inventory<span
                class="subnav-subtitle">NFT Collection</span></a>
          </li>
          <li>
            <a class="dropdown-item subnav-title" href="/user#drive/" @click="showTab('drive')">IPFS Drive<span
                class="subnav-subtitle">SPK
                Network</span></a>
          </li>
          <li class="subnav-extra-top">
            <a class="dropdown-extra" role="button" href="#" @click="toggleChat"
              data-bs-toggle="offcanvas" data-bs-target="#offcanvasSting" aria-controls="offcanvasSting">Sting Chat</a>
          </li>
          <li class="subnav-extra-middle d-none">
            <a class="dropdown-extra" role="button" href="#" data-bs-toggle="modal"
              data-bs-target="#qrModal" aria-controls="qrModal">QR Code</a>
          </li>
          <li class="subnav-extra-middle">
            <a class="dropdown-extra" role="button" href="#" data-bs-toggle="modal"
              data-bs-target="#loginModal" aria-controls="loginModal">Switch User</a>
          </li>
          <li class="subnav-extra-bottom">
            <a class="dropdown-extra" role="button" href="#" @click="logout()">Logout</a>
          </li>
        </ul>
      </li>
      <li class="nav-more dropdown nav-dropdown">
        <a class="nav-link nav-highlight nav-title dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown"
          aria-expanded="false">
          <span class="nav-bars">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </span>
        </a>
        <div class="hover-gap"></div>
        <ul class="dropdown-menu container">
          <li class="nav-show"><a class="dropdown-item subnav-title" href="/hub">HUB<span class="subnav-subtitle">Social
                dApps</span></a></li>
          <li class="nav-show"><a class="dropdown-item subnav-title" href="/dex">DEX<span
                class="subnav-subtitle">Exchange Tokens</span></a></li>
          <li class="nav-show"><a class="dropdown-item subnav-title" href="/nfts">NFT Marketplace<span
                class="subnav-subtitle">Sales and Auctions</span></a></li>
          <li class="nav-show"><a class="dropdown-item subnav-title" href="/nfts/sets">Browse NFT Sets<span
                class="subnav-subtitle">Discover New Collections</span></a></li>
          <li><a class="dropdown-item subnav-title" href="/create/">Publishing<span class="subnav-subtitle">Upload
                and Post to DLUX</span></a></li>
          <li><a class="dropdown-item subnav-title" href="/storage/">Storage<span class="subnav-subtitle">Pin IPFS Files with SPK</span></a></li>
          <li><a class="dropdown-item subnav-title position-relative" href="/mint/">Minting<span class="subnav-subtitle">Craft NFT Sets on DLUX</span><span class="position-absolute top-0 end-0 badge text-bg-primary mt-1 me-2">Coming Soon</span></a></li>
          <li><a class="dropdown-item subnav-title" href="/node/">Node Rewards<span class="subnav-subtitle">Earn Tokens for DePIN Services</span></a></li>
          <li><a class="dropdown-item subnav-title" href="/dao/">Honeycomb DAO<span class="subnav-subtitle">Launch Your
                DeFi Project</span></a></li>
          <li><a class="dropdown-item subnav-title position-relative" href="/docs/" target="_blank">Docs<span
                class="subnav-subtitle">Explore
                DLUX Documentation</span><span class="position-absolute top-50 end-0 translate-middle-y"><i class="mx-2 fa-solid fa-arrow-up-right-from-square"></i></span></a></li>
          <li class="subnav-extra-top"><a class="dropdown-extra" href="/@disregardfiat">Blog</a></li>
          <li class="subnav-extra-bottom"><a class="dropdown-extra" href="/about">Press Kit</a></li>
        </ul>
      </li>
    </ul>
  </nav>
  <!-- toast -->
  <div class="position-fixed bottom-0 end-0 p-3 toast-container" style="z-index: 11">
    <div v-for="op in ops">
      <toast-vue :alert="op" />
    </div>
  </div>
  <!-- sting chat -->
  <div class="offcanvas offcanvas-end bg-blur-darkg bg-img-none text-white-50" tabindex="-1" id="offcanvasSting"
    aria-labelledby="offcanvasStingLabel">
    <div class="offcanvas-header d-flex align-items-center justify-content-between">
      <div class="d-flex">
        <h5 id="offcanvasRightLabel" class="m-0 p-0">Sting Chat</h5>
        <div class="d-flex"><span class="small badge border border-warning ms-1 mb-auto"
            style="font-size: 0.5em;">BETA</span></div>
      </div>
      <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body p-0">
      <div id="stingChat" class=""></div>
    </div>
  </div>
  <!-- login modal -->
  <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModal" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">User Management</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <!-- login method selector -->
          <div class="d-flex flex-column">
            <div class="row mb-3">
              <div class="dropdown">
                <button class="btn btn-secondary w-100 p-0" :class="{'disabled': node}" :disabled="node" role="button"
                  id="authDropdown" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false">
                  <button v-if="HKC" class="btn btn-hivekeychain h-100 w-100 dropdown-toggle"><img
                      src="/img/keychain.png" style="height:50px !important;" class="img-responsive p-2 mx-3"></button>
                  <button v-if="HAS" class="btn btn-hiveauth h-100 w-100 dropdown-toggle"><img src="/img/hiveauth.svg"
                      style="height:50px !important;" class="img-responsive p-2 mx-3"></button>
                  <button v-if="HSR" class="btn btn-hivesigner h-100 w-100 dropdown-toggle"><img
                      src="/img/hivesigner.svg" style="height:50px !important;"
                      class="img-responsive p-2 mx-3"></button>
                  <button v-if="PEN" class="btn btn-pen h-100 w-100 dropdown-toggle"><img src="/img/dlux-pen.png"
                      style="height:50px !important;" class="img-responsive p-2 mx-3"></button>
                </button>
                <!-- login method options -->
                <ul class="dropdown-menu dropdown-menu-dark text-center bg-black p-2" aria-labelledby="authDropdown">
                  <li class="p-2"><button class="btn btn-hivekeychain h-100 w-100" @click="useKC()"><img
                        src="/img/keychain.png" class="img-responsive" style="height:50px !important;"></button></li>
                  <li class="p-2" v-if="!node"><button class="btn btn-hiveauth h-100 w-100" @click="useHAS()"><img
                        src="/img/hiveauth.svg" class="img-responsive" style="height:50px !important;"></button></li>
                  <li class="p-2" v-if="!node"><button class="btn btn-hivesigner h-100 w-100" @click="useHS()"><img
                        src="/img/hivesigner.svg" class="img-responsive" style="height:50px !important;"></button></li>
                  <li class="p-2 d-none"><button class="btn btn-pen h-100 w-100" @click="usePEN()"><img
                        src="/img/dlux-pen.png" class="img-responsive" style="height:50px !important;"></button></li>
                </ul>
              </div>
              <!-- login method description -->
              <div class="small text-muted text-center mt-2">
                <span v-if="HKC">Hive Keychain requires a Firefox or Chrome extension</span>
                <span v-if="HAS">Hive Auth requires websockets and a PKSA Application</span>
                <span v-if="HSR">Hive Signer generates a link</span>
                <span v-if="PEN">dlux Pen stores your active key locally</span>
              </div>
            </div>
          </div>
          <!-- current user -->
          <div class="mb-3">
            <div>
              <label class="form-label">Current user</label>
              <div v-if="!user" class="bg-darkest rounded d-flex align-items-center p-2">
                <img src="/img/no-user.png" alt="" width="50" height="50" class="img-fluid rounded-circle me-2 cover">
                <span class="flex-grow-1 text-center">NONE SELECTED</span>
              </div>
              <div v-if="user" class="bg-darkest rounded d-flex align-items-center p-2">
                <img :src="avatar" id="userImage" alt="" width="50" height="50"
                  class="img-fluid rounded-circle bg-light me-2 cover">
                <span id="userName">{{user}}</span>
                <div class="ms-auto">
                  <a class="btn btn-outline-secondary btn-sm me-1"
                    :class="[{'btn-outline-success':HAS_.wsconn && HAS_.token},{'btn-outline-warning':!HAS_.wsconn && HAS_.token},{'btn-outline-secondary':!HAS_.token}]"
                    :href="HAS_.uri" v-if="HAS"><i class="fa-solid fa-satellite-dish"></i></a>
                  <a class="btn btn-outline-danger btn-sm" role="button" @click="logout()"><i
                      class="fas fa-power-off fa-fw"></i></a>
                </div>
              </div>
            </div>
            <div class="mt-2" v-if="HAS && haspich > 100">
              <div>
                <div class="bg-white rounded text-center">
                  <a class="no-decoration" :href="HAS_.uri"><img :src="haspic" :height="haspich + 'px'"
                      class="img-responsive p-2 mx-3">
                    <p v-show="haspich > 100" class="text-dark">Tap or scan with PKSA App for {{user}}</p>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <!-- add user-->
          <div v-if="!decrypted.pin">
            <label class="form-label">Add user</label>
            <div class="position-relative has-validation">
              <span class="position-absolute top-50 translate-middle-y ps-2 text-white">
                <i class="fa-solid fa-at fa-fw"></i>
              </span>
              <input v-model="userField" autocapitalize="off" placeholder="username" @keyup.enter="setUser()"
                class="px-4 form-control bg-dark border-dark text-info">
              <span v-if="userField" class="position-absolute end-0 top-50 translate-middle-y pe-2">
                <button type="button" @click="setUser()" class="btn btn-sm btn-primary"><i
                    class="fa-solid fa-plus fa-fw"></i></button>
              </span>
            </div>
            <p v-if="userPinFeedback"></p>
            <div class="small text-muted text-center mt-1 mb-2">
              Usernames are stored locally. <a class="no-decoration text-info" target="_blank"
                href="https://signup.hive.io/">Get Account</a>
            </div>
          </div>
          <!-- recent users -->
          <div class="mt-1" v-if="recentUsers.length">
            <label class="form-label">Recent users</label>
            <div class="d-none position-relative has-validation">
              <span class="position-absolute top-50 translate-middle-y ps-2 text-white">
                <i class="fa-solid fa-at fa-fw"></i>
              </span>
              <input type="search" v-model="filterUsers" autocapitalize="off" placeholder="search"
                @keyup="searchRecents()" class="ps-4 form-control bg-dark border-dark text-info">
            </div>
          </div>
          <div class="d-flex hover justify-content-between align-items-center py-3 border-light-50 border-top"
            v-if="!filterUsers" v-for="name in recentUsers">
            <div class="flex-fill text-center"><a class="text-info" role="button"
                @click="setUser(name);toggleAccountMenu()">@{{name}}</a></div>
            <div class="flex-shrink me-2 d-none"><i class="fa-solid fa-feather-pointed fa-fw"></i></div>
            <div class="flex-shrink me-2"><a class="text-danger ms-auto" role="button" @click="deleteRecentUser(name)"
                alt="Remove username"><i class="fa-solid fa-trash-can"></i></a></div>
          </div>
          <div class="d-flex hover justify-content-between align-items-center py-3 border-light-50 border-top"
            v-if="filterUsers" v-for="name in filterRecents">
            <div class="flex-fill text-center"><a class="text-info" role="button"
                @click="setUser(name);toggleAccountMenu()">@{{name}}</a></div>
            <div class="flex-shrink me-2 d-none"><i class="fa-solid fa-feather-pointed fa-fw"></i></div>
            <div class="flex-shrink me-2"><a class="text-danger ms-auto" role="button"
                @click="deleteRecentUser(name);searchRecents()" alt="Remove username"><i
                  class="fa-solid fa-trash-can"></i></a></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
};