import { createApp, toRaw } from '/js/vue.esm-browser.js'
import Navue from "/js/v3-nav.js";
import FootVue from "/js/footvue.js";
import MCommon from "/js/methods-common.js";
import DataCommon from "/js/dataCommon.js";
import ModalVue from "/js/modal-manager.js";
import { Chart, registerables } from 'chart.js';
import { Line } from "https://cdn.jsdelivr.net/npm/vue-chartjs@5.3.1/dist/index.min.js";
import {
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement
} from "/js/chrtjscf.js";

Chart.register(...registerables, CandlestickController, CandlestickElement, OhlcController, OhlcElement);

const CandlestickChart = {
  extends: Line,
  props: ['data', 'options'],
  mounted() {
    this.renderChart();
  },
  methods: {
    renderChart() {
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }
      const ctx = this.$refs.canvas.getContext('2d');
      this.chartInstance = new Chart(ctx, {
        type: 'candlestick',
        data: {
          datasets: [{
            label: this.options.label,
            data: this.data.map(item => ({
              t: item[0],
              o: item[1],
              h: item[2],
              l: item[3],
              c: item[4],
              v: item[5]
            }))
          }]
        },
        options: {
          scales: {
            x: {
              type: 'linear',
              ticks: {
                callback: function(value, index, ticks) {
                  const date = new Date(value);
                  if (ticks.length > 10) {
                    return `${date.getMonth()+1}/${date.getDate()}`;
                  } else {
                    return date.toLocaleDateString();
                  }
                }
              }
            },
            y: {
              type: 'linear'
            }
          }
        }
      });
    }
  },
  watch: {
    data() {
      this.renderChart();
    },
    options() {
      this.renderChart();
    }
  },
  template: '<canvas ref="canvas"></canvas>'
};

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
if (location.hash && !lapi) {
  const hash = url.split("#");
  if (hash[1].includes("dlux")) {
    lapi = "https://token.dlux.io";
  } else if (hash[1].includes("larynx")) {
    lapi = "https://spkinstant.hivehoneycomb.com";
  } else if (hash[1].includes("duat")) {
    lapi = "https://duat.hivehoneycomb.com";
  }
}
if (!lapi) {
  lapi = localStorage.getItem("lapi") || "https://token.dlux.io";
}
console.log(lapi);
if (
  lapi == "https://token.dlux.io" ||
  lapi == "https://spkinstant.hivehoneycomb.com" ||
  lapi == "https://duat.hivehoneycomb.com"
) {
  console.log("using defaults");
  window.history.replaceState(null, null, "");
}
let user = localStorage.getItem("user") || "GUEST";
let hapi = localStorage.getItem("hapi") || "https://hive-api.dlux.io";
console.log({
  lapi,
});

createApp({ 
  data() {
    return {
      ...DataCommon,
      hidePrompt: true,
      chart: {
        responsive: true,
        label: 'OHLC',
      },
      chartData: [],
      barcount: 500,
      barwidth: 3600000 * 6,
      nowtime: new Date().getTime(),
      agoTime: new Date().getTime() - 86400000,
      account: user,
      hasDrop: false,
      dropnai: "",
      balance: "0.000",
      bartoken: "",
      barhive: "",
      barhbd: "",
      bargov: "",
      barpow: "",
      toSign: {},
      proven: {},
      buyFormValid: false,
      sellFormValid: false,
      govFormValid: false,
      powFormValid: false,
      sendFormValid: false,
      hiveFormValid: false,
      hbdFormValid: false,
      lapi: lapi,
      hapi: hapi,
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
      nodes: {},
      runners: [],
      runnersSearch: [],
      marketnodes: {},
      hivebuys: [],
      hivesells: [],
      hbdbuys: [],
      hbdsells: [],
      dexapi: {
        markets: {
          hive: {
            tick: 0.001,
          },
          hbd: {
            tick: 0.001,
          },
        },
      },
      prefix: "",
      multisig: "",
      jsontoken: "",
      node: "",
      behind: "",
      stats: {},
      behindTitle: "",
      TOKEN: "LARYNX",
      bform: {
        cl: false,
        tl: false,
        pl: true,
      },
      sform: {
        cl: false,
        tl: false,
        pl: true,
      },
      buyHiveTotal: 0,
      buyPrice: 0,
      sellPrice: 0,
      buyHbdTotal: 0,
      sellHiveTotal: 0,
      sellHbdTotal: 0,
      buyQuantity: 0,
      sellQuantity: 0,
      buyHours: 720,
      sellHours: 720,
      volume: {
        hive: 0,
        hbd: 0,
        token_hive: 0,
        token_hbd: 0,
        hive_usd: 0,
        hbd_usd: 0,
      },
      sendTo: "",
      sendAmount: 0,
      sendMemo: "",
      sendAllowed: false,
      sendHiveTo: "",
      sendHiveAllowed: false,
      sendHiveAmount: 0,
      sendHiveMemo: "",
      sendHBDTo: "",
      sendHBDAllowed: false,
      sendHBDAmount: 0,
      sendHBDMemo: "",
      recenthive: {},
      recenthbd: {},
      dailyhive: [],
      dailyhbd: [],
      openorders: [],
      orders: {
        filleda: false,
        filledd: false,
        blocka: false,
        blockd: true,
        coina: false,
        coind: false,
        tokena: false,
        tokend: false,
        ratea: false,
        rated: false,
        typea: false,
        typed: false,
      },
      accountinfo: {},
      filterusers: {
        checked: true,
        value: "",
      },
      filteraccount: {
        checked: false,
        value: "",
        usera: false,
        userd: false,
        gova: false,
        govd: true,
        apia: false,
        apid: false,
      },
      lockgov: {
        checked: true,
      },
      unlockgov: {
        checked: false,
      },
      buyhive: {
        checked: true,
      },
      buyhbd: {
        checked: false,
      },
      buylimit: {
        checked: true,
      },
      buymarket: {
        checked: false,
      },
      selllimit: {
        checked: true,
      },
      sellmarket: {
        checked: false,
      },
      pwrup: {
        checked: true,
      },
      pwrdown: {
        checked: false,
      },
      govlock: {
        checked: true,
      },
      govunlock: {
        checked: false,
      },
    }
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.onResize);
  },
  components: {
    CandlestickChart,
    "modal-vue": ModalVue,
    "nav-vue": Navue,
    "foot-vue": FootVue,
  },
  methods: {
    ...MCommon,
    removeOp(txid){
      if(this.toSign.txid == txid){
        this.toSign = {};
      }
    },
    run(op){
      if (typeof this[op] == 'function' && this.account != 'GUEST') {
        this[op](this.account);
      }
    },
    onResize(event) {
      this.chart.width = this.$refs.chartContainer.scrollWidth - 15;
      this.chart.height = this.chart.width / 2.5;
      this.$refs.dumbo.style = `width: ${this.chart.width}px; height: ${
        this.chart.height + 30
      }px;`;
    },
    bcalc(k, w = false) {
      if(!w)setTimeout(() => this.bcalc(k, true), 1000);
      else switch (k) {
        case "t":
          if (this.bform.cl) {
            if (this.buyhive.checked)
              this.buyPrice = (this.buyHiveTotal / this.buyQuantity).toFixed(6);
            else
              this.buyPrice = (this.buyHbdTotal / this.buyQuantity).toFixed(6);
          } else {
            if (this.buyhive.checked)
              this.buyHiveTotal = (this.buyPrice * this.buyQuantity).toFixed(3);
            else
              this.buyHbdTotal = (this.buyPrice * this.buyQuantity).toFixed(3);
          }
          break;
        case "p":
          if (this.bform.cl) {
            if (this.buyhive.checked)
              this.buyQuantity = (this.buyHiveTotal / this.buyPrice).toFixed(3);
            else
              this.buyQuantity = (this.buyHbdTotal / this.buyPrice).toFixed(3);
          } else {
            if (this.buyhive.checked)
              this.buyHiveTotal = (this.buyPrice * this.buyQuantity).toFixed(3);
            else
              this.buyHbdTotal = (this.buyPrice * this.buyQuantity).toFixed(3);
          }
          break;
        case "c":
          if (this.buyhive.checked)
            this.buyHiveTotal = parseFloat(this.buyHiveTotal);
          else this.buyHbdTotal = parseFloat(this.buyHbdTotal);
          if (this.buylimit.checked) {
            if (this.bform.pl) {
              if (this.buyhive.checked)
                this.buyQuantity = (this.buyHiveTotal / this.buyPrice).toFixed(
                  3
                );
              else
                this.buyQuantity = (this.buyHbdTotal / this.buyPrice).toFixed(
                  3
                );
            } else {
              if (this.buyhive.checked)
                this.buyPrice = (this.buyHiveTotal / this.buyQuantity).toFixed(
                  6
                );
              else
                this.buyPrice = (this.buyHbdTotal / this.buyQuantity).toFixed(
                  6
                );
            }
          }
          break;
        default:
      }
    },
    localStoreSet(k, v) {
      localStorage.setItem(k, v);
    },
    scalc(k, w = false) {
      if(!w)setTimeout(() => this.scalc(k, true), 1000);
      else switch (k) {
        case "t":
          this.sellQuantity = parseFloat(this.sellQuantity);
          if (this.sform.cl) {
            if (this.buyhive.checked)
              this.sellPrice = (this.sellHiveTotal / this.sellQuantity).toFixed(
                6
              );
            else
              this.sellPrice = (this.sellHbdTotal / this.sellQuantity).toFixed(
                6
              );
          } else {
            if (this.buyhive.checked)
              this.sellHiveTotal = (this.sellPrice * this.sellQuantity).toFixed(
                3
              );
            else
              this.sellHbdTotal = (this.sellPrice * this.sellQuantity).toFixed(
                3
              );
          }
          break;
        case "p":
          this.sellPrice = parseFloat(this.sellPrice);
          if (this.sform.cl) {
            if (this.buyhive.checked)
              this.sellQuantity = (this.sellHiveTotal / this.sellPrice).toFixed(
                3
              );
            else
              this.sellQuantity = (this.sellHbdTotal / this.sellPrice).toFixed(
                3
              );
          } else {
            if (this.buyhive.checked)
              this.sellHiveTotal = (this.sellPrice * this.sellQuantity).toFixed(
                3
              );
            else
              this.sellHbdTotal = (this.sellPrice * this.sellQuantity).toFixed(
                3
              );
          }
          break;
        case "c":
          if (this.buyhive.checked)
            this.sellHiveTotal = parseFloat(this.sellHiveTotal);
          else this.sellHbdTotal = parseFloat(this.sellHbdTotal);
          if (this.selllimit.checked) {
            if (this.sform.pl) {
              if (this.buyhive.checked)
                this.sellQuantity = (
                  this.sellHiveTotal / this.sellPrice
                ).toFixed(3);
              else
                this.sellQuantity = (
                  this.sellHbdTotal / this.sellPrice
                ).toFixed(3);
            } else {
              if (this.buyhive.checked)
                this.sellPrice = (
                  this.sellHiveTotal / this.sellQuantity
                ).toFixed(6);
              else
                this.sellPrice = (
                  this.sellHbdTotal / this.sellQuantity
                ).toFixed(6);
            }
          }
          break;
        default:
      }
    },
    block(o) {
      switch (o) {
        case "t":
          this.bform.tl = !this.bform.tl;
          this.bform.cl = false;
          this.bform.pl = !this.bform.tl;
          break;
        case "c":
          this.bform.cl = !this.bform.cl;
          this.bform.tl = false;
          this.bform.pl = !this.bform.cl;
          break;
        case "p":
          this.bform.pl = !this.bform.pl;
          this.bform.cl = !this.bform.pl;
          this.bform.tl = false;
          break;
        default:
          this.bform.cl = false;
          this.bform.tl = false;
          this.bform.pl = true;
          break;
      }
    },
    slock(o) {
      switch (o) {
        case "t":
          this.sform.tl = !this.sform.tl;
          this.sform.cl = false;
          this.sform.pl = !this.sform.tl;
          break;
        case "c":
          this.sform.cl = !this.sform.cl;
          this.sform.tl = false;
          this.sform.pl = !this.sform.cl;
          break;
        case "p":
          this.sform.pl = !this.sform.pl;
          this.sform.cl = !this.sform.pl;
          this.sform.tl = false;
          break;
        default:
          this.sform.cl = false;
          this.sform.tl = false;
          this.sform.pl = true;
          break;
      }
    },
    trade_date(ts){
      if (Date.now() - ts < 86400000) return new Date(ts).toLocaleTimeString()
      return new Date(ts).toLocaleDateString()
    },
    proveAPI(url){
      return new Promise((resolve, reject) => {
        fetch(url)
          .then(response => response.json())
          .then(data => { 
            if (data.behind > -5){
              resolve('GOOD')
            } else {
              reject({data})
            }
          })
          .catch(error => {
            reject(error)
          })
      })
    },
    sendhive() {
      if (!this.hiveFormValid) return;
      if (this.sendHiveAllowed)
        this.toSign = {
          type: "xfr",
          cj: {
            to: this.sendHiveTo,
            hive: this.sendHiveAmount * 1000,
            memo: this.sendHiveMemo,
          },
          txid: "sendhive",
          msg: ``,
          ops: ["getHiveUser"],
        };
      else alert("Account Not Found");
    },
    sendhbd() {
      if (!this.hbdFormValid) return;
      if (this.sendHBDAllowed)
        this.toSign = {
          type: "xfr",
          cj: {
            to: this.sendHBDTo,
            hbd: this.sendHBDAmount * 1000,
            memo: this.sendHBDMemo,
          },
          txid: "sendhbd",
          msg: ``,
          ops: ["getHiveUser"],
        };
      else alert("Account Not Found");
    },
    toUpperCase(value) {
      return value.toUpperCase();
    },
    togglecoin(coin) {
      this.buyhive.checked = coin == "hive" ? true : false;
      this.buyhbd.checked = coin == "hbd" ? true : false;
      if (coin == "hive") {
        this.buyPrice = this.hivesells[0]?.rate;
        this.sellPrice = this.hivebuys[0]?.rate;
      } else {
        this.buyPrice = this.hbdsells[0]?.rate;
        this.sellPrice = this.hbdbuys[0]?.rate;
      }
    },
    togglebuylimit(type) {
      this.buylimit.checked = type == "limit" ? true : false;
      this.buymarket.checked = type == "market" ? true : false;
    },
    toggleselllimit(type) {
      this.selllimit.checked = type == "limit" ? true : false;
      this.sellmarket.checked = type == "market" ? true : false;
    },
    toggleAPI(ip) {
      this.filteraccount.usera = ip == "usera" ? true : false;
      this.filteraccount.userd = ip == "userd" ? true : false;
      this.filteraccount.apia = ip == "apia" ? true : false;
      this.filteraccount.apid = ip == "apid" ? true : false;
      this.filteraccount.gova = ip == "gova" ? true : false;
      this.filteraccount.govd = ip == "govd" ? true : false;
    },
    toggleOrders(ip) {
      this.orders.blocka = ip == "blocka" ? true : false;
      this.orders.blockd = ip == "blockd" ? true : false;
      this.orders.coina = ip == "coina" ? true : false;
      this.orders.coind = ip == "coind" ? true : false;
      this.orders.tokena = ip == "tokena" ? true : false;
      this.orders.tokend = ip == "tokend" ? true : false;
      this.orders.ratea = ip == "ratea" ? true : false;
      this.orders.rated = ip == "rated" ? true : false;
      this.orders.typea = ip == "typea" ? true : false;
      this.orders.typed = ip == "typed" ? true : false;
      this.orders.filleda = ip == "filleda" ? true : false;
      this.orders.filledd = ip == "filledd" ? true : false;
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
    setApi(url) {
      if (url.substr(-1) == "/") {
        url = url.substr(0, url.length - 1);
      }
      url = url || prompt("Please enter your API", "https://spkinstant.hivehoneycomb.com");
      if (url.indexOf("https://") == -1) {
        alert("https is required");
        return;
      }
      this.proveAPI(url).then((res) => {
        console.log(res)
        location.hash = "";
        localStorage.setItem("lapi", url);
        location.search = "?api=" + url;
      })
      .catch((err) => {
        console.log(err)
        return alert('This API is not responding, please try another one.')
      })
    },
    suggestValue(key, value) {
      if (key.split(".").length > 1) {
        let keys = key.split(".");
        let obj = this[keys[0]];
        for (let i = 1; i < keys.length; i++) {
          if (i == keys.length - 1) {
            if (!obj[keys[i]]) obj[keys[i]] = value;
          } else {
            obj = obj[keys[i]];
          }
        }
      } else {
        if (!this[key]) this[key] = value;
      }
    },
    atref(key) {
      return `/@${key}`;
    },
    setMem(key, value, reload) {
      if (value.indexOf("https://") == -1) {
        alert("https:// is required for security reasons");
        return;
      } else if (value[value.length - 1] == "/") {
        value = value.substring(0, value.length - 1);
      }
      localStorage.setItem(key, value);
      if (reload) {
        location.reload();
      }
    },
    sort(item, key, method) {
      switch (method) {
        case "asc":
          this[item].sort((a, b) => {
            return a[key] < b[key] ? -1 : 1;
          });
          break;
        case "desc":
        default:
          this[item].sort((a, b) => {
            return a[key] > b[key] ? -1 : 1;
          });
      }
    },
    focus(id) {
      document.getElementById(id).focus();
    },
    searchRunners() {
      const term = this.filteraccount.value;
      if (term) {
        this.filteraccount.checked = true;
        this.filteraccount.value = term;
        this.filterusers.checked = false;
        this.filterusers.value = "";
        this.runnersSearch = this.runners.reduce((acc, runner) => {
          if (runner.account.toLowerCase().includes(term.toLowerCase())) {
            acc.push(runner);
          } else if (runner.api.toLowerCase().includes(term.toLowerCase())) {
            acc.push(runner);
          }
          return acc;
        }, []);
      } else {
        this.filteraccount.checked = false;
        this.filteraccount.value = "";
        this.filterusers.checked = true;
        this.filterusers.value = "";
      }
    },
    validateForm(formKey, validKey) {
      var Container = document.getElementById(formKey);
      if (Container.querySelector('input:invalid'))
        this[validKey] = false;
      else this[validKey] = true;
    },
    buyDEX() {
      if (!this.buyFormValid) return;
      var allowed = false;
      const reqs = [this.$refs.buyQty];
      console.log(reqs[0]);
      var andthen = " at market rate",
        rate = undefined,
        hours = 720;
      if (!this.buymarket.checked) {
        rate = parseFloat(
          (this.buyhive.checked ? this.buyHiveTotal : this.buyHbdTotal) /
            this.buyQuantity
        ).toFixed(6);
        andthen = ` at ${rate} ${this.buyhive.checked ? "HIVE" : "HBD"} per ${
          this.TOKEN
        }`;
      }
      if (this.buyhive.checked)
        this.toSign = {
          type: "xfr",
          cj: {
            to: this.multisig,
            hive: this.buyHiveTotal * 1000,
            memo: JSON.stringify({
              rate: this.buyPrice,
              hours: this.buyHours,
              token: this.TOKEN,
            }),
          },
          txid: "buydex",
          msg: `Buying ${this.TOKEN} with ${parseFloat(
            this.buyHiveTotal
          ).toFixed(3)} HIVE ${andthen}`,
          ops: ["getHiveUser", "popDEX", "getTokenUser"],
        };
      else if (!this.buyhive.checked)
        this.toSign = {
          type: "xfr",
          cj: {
            to: this.multisig,
            hbd: this.buyHbdTotal * 1000,
            memo: JSON.stringify({
              rate: this.buyPrice,
              hours: this.buyHours,
              token: this.TOKEN,
            }),
          },
          txid: "buydex",
          msg: `uying ${this.TOKEN} with ${parseFloat(this.buyHbdTotal).toFixed(
            3
          )} HBD ${andthen}`,
          ops: ["getHiveUser", "popDEX", "getTokenUser"],
        };
    },
    sellDEX() {
      if (!this.sellFormValid) return;
      var andthen = " at market rate",
        dlux = parseInt(parseFloat(this.sellQuantity) * 1000),
        hive = parseInt(parseFloat(this.sellHiveTotal) * 1000),
        hbd = parseInt(parseFloat(this.sellHbdTotal) * 1000),
        hours = parseInt(this.sellHours);
      if (hive || hbd) {
        const price = parseFloat(
          dlux / (this.buyhive.checked ? hive : hbd)
        ).toFixed(6);
        andthen = ` at ${price} ${this.buyhive.checked ? "HIVE" : "HBD"} per ${
          this.TOKEN
        }`;
      }
      if (this.buyhive.checked && dlux)
        this.toSign = {
          type: "cja",
          cj: {
            [this.TOKEN.toLocaleLowerCase()]: dlux,
            hive,
            hours,
          },
          id: `${this.prefix}dex_sell`,
          msg: `Selling ${parseFloat(dlux / 1000).toFixed(3)} ${
            this.TOKEN
          }${andthen}`,
          ops: ["getTokenUser", "popDEX"],
          txid: `${this.prefix}dex_sell`,
        };
      else if (!this.buyhive.checked && dlux)
        this.toSign = {
          type: "cja",
          cj: {
            [this.TOKEN.toLocaleLowerCase()]: dlux,
            hbd,
            hours,
          },
          id: `${this.prefix}dex_sell`,
          msg: `Selling ${parseFloat(dlux / 1000).toFixed(3)} ${
            this.TOKEN
          }${andthen}`,
          ops: ["getTokenUser", "popDEX"],
          txid: `${this.prefix}dex_sell`,
        };
    },
    cancelDEX(txid) {
      if (txid)
        this.toSign = {
          type: "cja",
          cj: {
            txid,
          },
          id: `${this.prefix}dex_clear`,
          msg: `Canceling: ${txid}`,
          ops: ["getTokenUser", "popDEX"],
          txid: `${txid}dex_clear`,
        }
    },
    getHistorical() {
      if(!this.stats.lastIBlock){
        setTimeout(() => {
          this.getHistorical()
        }, 1000)
        return
      }
      const pair = this.buyhive.checked ? "hive" : "hbd";
      const numbars = this.barcount;
      const period = parseInt(this.barwidth);
      const now = this.nowtime;
      var startdate = new Date(now - period * numbars).getTime();
      this.chart.label = this.TOKEN
      var currentBucket = startdate;
      const dex = this.dexapi;
      let recent = true
      if (!dex.markets.hive.his)recent = false
      const current_block = this.stats.lastIBlock;
      const buckets = typeof dex.markets[pair]?.days == "object" ? Object.keys(dex.markets[pair]?.days) : []
      buckets.sort(function (a, b) {
        return parseInt(a) - parseInt(b);
      });
      var bars = [],
        current = {
          o: 0,
          h: 0,
          l: 0,
          c: 0,
          v: 0,
        };
      var dailypair = []
      for (var i = buckets.length - 1; i >= 0; i--) {
        if(dex.markets[pair]?.days[buckets[i]].d){
          dailypair.push({
            trade_timestamp: new Date(
            now - (3000 * (current_block - parseInt(buckets[i])))
          ).getTime(),
          open: dex.markets[pair]?.days[buckets[i]].o,
          high: dex.markets[pair]?.days[buckets[i]].t,
          low: dex.markets[pair]?.days[buckets[i]].b,
          close: dex.markets[pair]?.days[buckets[i]].c,
          volume: dex.markets[pair]?.days[buckets[i]].d,
          })
        }
        if (
          new Date(
            now - 3000 * (current_block - parseInt(buckets[i]))
          ).getTime() > currentBucket
        ) {
          if (!bars.length) {
            while (
              new Date(
                now - 3000 * (current_block - parseInt(buckets[i]))
              ).getTime() >
              currentBucket + period
            ) {
              bars.push({
                t: currentBucket,
                o: dex.markets[pair.toLowerCase()].days[buckets[i]].o,
                h: dex.markets[pair.toLowerCase()].days[buckets[i]].o,
                l: dex.markets[pair.toLowerCase()].days[buckets[i]].o,
                c: dex.markets[pair.toLowerCase()].days[buckets[i]].o,
                v: 0,
              });
              currentBucket = new Date(currentBucket + period).getTime();
            }
          } else {
            while (
              new Date(
                now - 3000 * (current_block - parseInt(buckets[i]))
              ).getTime() >
              currentBucket + period
            ) {
              bars.push({
                t: currentBucket,
                o: bars[bars.length - 1].c,
                h: bars[bars.length - 1].c,
                l: bars[bars.length - 1].c,
                c: bars[bars.length - 1].c,
                v: 0,
              });
              currentBucket = new Date(currentBucket + period).getTime();
            }
          }
          if (dex.markets[pair.toLowerCase()].days[buckets[i]].t > current.h)
            current.h = dex.markets[pair.toLowerCase()].days[buckets[i]].t;
          if (dex.markets[pair.toLowerCase()].days[buckets[i]].b < current.l)
            current.l = dex.markets[pair.toLowerCase()].days[buckets[i]].b;
          current.c = dex.markets[pair.toLowerCase()].days[buckets[i]].c;
          current.v += dex.markets[pair.toLowerCase()].days[buckets[i]].v;
          if (
            buckets[i + 1] &&
            new Date(
              now - 3000 * (current_block - parseInt(buckets[i + 1]))
            ).getTime() >
              currentBucket + period
          ) {
            bars.push({
              t: currentBucket,
              o: current.o,
              h: current.h,
              l: current.l,
              c: current.c,
              v: current.v,
            });
            currentBucket = new Date(currentBucket + period).getTime();
            current.o = current.c;
            current.h = current.c;
            current.l = current.c;
            current.c = current.c;
            current.v = 0;
          } else if (!buckets[i + 1]) {
            bars.push({
              t: currentBucket,
              o: current.o,
              h: current.h,
              l: current.l,
              c: current.c,
              v: current.v,
            });
          }
        }
      }
      this[`daily${pair}`] = dailypair
      let items = recent ? Object.keys(dex.markets[pair.toLowerCase()].his) : []
      for (var i = 0; i < items.length; i++) {
        if (
          new Date(
            now - 3000 * (current_block - parseInt(items[i].split(":")[0]))
          ).getTime() > currentBucket
        ) {
          if (!bars.length) {
            while (
              new Date(
                now - 3000 * (current_block - parseInt(items[i].split(":")[0]))
              ).getTime() >
              currentBucket + period
            ) {
              bars.push({
                t: currentBucket,
                o: parseFloat(
                  dex.markets[pair.toLowerCase()].his[items[i]].price
                ),
                h: parseFloat(
                  dex.markets[pair.toLowerCase()].his[items[i]].price
                ),
                l: parseFloat(
                  dex.markets[pair.toLowerCase()].his[items[i]].price
                ),
                c: parseFloat(
                  dex.markets[pair.toLowerCase()].his[items[i]].price
                ),
                v: 0,
              });
              currentBucket = new Date(currentBucket + period).getTime();
            }
          } else {
            while (
              new Date(
                now - 3000 * (current_block - parseInt(items[i].split(":")[0]))
              ).getTime() >
              currentBucket + period
            ) {
              bars.push({
                t: currentBucket,
                o: bars[bars.length - 1].c,
                h: bars[bars.length - 1].c,
                l: bars[bars.length - 1].c,
                c: bars[bars.length - 1].c,
                v: 0,
              });
              currentBucket = new Date(currentBucket + period).getTime();
            }
          }
          if (
            parseFloat(dex.markets[pair.toLowerCase()].his[items[i]].price) >
            current.h
          )
            current.h = parseFloat(
              dex.markets[pair.toLowerCase()].his[items[i]].price
            );
          if (
            parseFloat(dex.markets[pair.toLowerCase()].his[items[i]].price) <
            current.l
          )
            current.l = parseFloat(
              dex.markets[pair.toLowerCase()].his[items[i]].price
            );
          current.c = parseFloat(
            dex.markets[pair.toLowerCase()].his[items[i]].price
          );
          current.v += parseFloat(
            dex.markets[pair.toLowerCase()].his[items[i]].target_vol
          );
          if (
            items[i + 1] &&
            new Date(
              now -
                3000 * (current_block - parseInt(items[i + 1].split(":")[0]))
            ).getTime() >
              currentBucket + period
          ) {
            bars.push({
              t: currentBucket,
              o: current.o,
              h: current.h,
              l: current.l,
              c: current.c,
              v: current.v,
            });
            currentBucket = new Date(currentBucket + period).getTime();
            current.o = parseFloat(
              dex.markets[pair.toLowerCase()].his[items[i]].price
            );
            current.h = parseFloat(
              dex.markets[pair.toLowerCase()].his[items[i]].price
            );
            current.l = parseFloat(
              dex.markets[pair.toLowerCase()].his[items[i]].price
            );
            current.c = parseFloat(
              dex.markets[pair.toLowerCase()].his[items[i]].price
            );
            current.v = 0;
          } else if (!items[i + 1]) {
            bars.push({
              t: currentBucket,
              o: current.o,
              h: current.h,
              l: current.l,
              c: current.c,
              v: current.v,
            });
          }
        }
      }
      var newBars = [];
      for (var i = 0; i < bars.length; i++) {
        newBars.push([
          bars[i].t,
          bars[i].o,
          bars[i].h,
          bars[i].l,
          bars[i].c,
          bars[i].v,
        ]);
      }
      this.chartData = newBars;
    },
    getQuotes() {
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=hive&amp;vs_currencies=usd"
      )
        .then((response) => response.json())
        .then((data) => {
          this.hiveprice = data;
          localStorage.setItem("hiveprice", JSON.stringify(data));
        })
        .catch((error) => {
          const data = localStorage.getItem("hiveprice") || '{"hive": {"usd": 0}}';
          this.hiveprice = JSON.parse(data);
        })
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=hive_dollar&amp;vs_currencies=usd"
      )
        .then((response) => response.json())
        .then((data) => {
          this.hbdprice = data;
          localStorage.setItem("hbdprice", JSON.stringify(data));
        })
        .catch((error) => {
            const data = localStorage.getItem("hbdprice") || '{"hive_dollar": {"usd": 0}}';
            this.hbdprice = JSON.parse(data);
        })
    },
    getNodes() {
      fetch(this.lapi + "/runners")
        .then((response) => response.json())
        .then((data) => {
          this.runners = data.result.sort((a, b) => {
            return b.g - a.g;
          });
        });
      fetch(this.lapi + "/markets")
        .then((response) => response.json())
        .then((data) => {
          this.nodes = data.markets.node;
          this.stats = data.stats;
        });
    },
    getRecents(){
      fetch(this.lapi + "/api/recent/HIVE_" + this.TOKEN + "?limit=1000")
        .then((response) => response.json())
        .then((data) => {
          this.volume.hive =
            data.recent_trades.reduce((a, b) => {
              if (b.trade_timestamp > this.agoTime)
                return a + parseInt(parseFloat(b.target_volume) * 1000);
              else return a;
            }, 0) / 1000;
          this.volume.token_hive =
            data.recent_trades.reduce((a, b) => {
              if (b.trade_timestamp > this.agoTime)
                return a + parseInt(parseFloat(b.base_volume) * 1000);
              else return a;
            }, 0) / 1000;
          this.recenthive = data.recent_trades.sort((a, b) => {
            return parseInt(b.trade_timestamp) - parseInt(a.trade_timestamp);
          });
        });
      fetch(this.lapi + "/api/recent/HBD_" + this.TOKEN + "?limit=1000")
        .then((response) => response.json())
        .then((data) => {
          this.volume.hbd =
            data.recent_trades.reduce((a, b) => {
              if (b.trade_timestamp > this.agoTime)
                return a + parseInt(parseFloat(b.target_volume) * 1000);
              else return a;
            }, 0) / 1000;
          this.volume.token_hbd =
            data.recent_trades.reduce((a, b) => {
              if (b.trade_timestamp > this.agoTime)
                return a + parseInt(parseFloat(b.base_volume) * 1000);
              else return a;
            }, 0) / 1000;
          this.recenthbd = data.recent_trades.sort((a, b) => {
            return parseInt(b.trade_timestamp) - parseInt(a.trade_timestamp);
          });
        });
    },
    getProtocol() {
      fetch(this.lapi + "/api/protocol")
        .then((response) => response.json())
        .then((data) => {
          this.protocol = data
          this.prefix = data.prefix;
          this.multisig = data.multisig;
          this.jsontoken = data.jsontoken;
          this.TOKEN = data.jsontoken.toUpperCase();
          location.hash = data.jsontoken;
          this.node = data.node;
          this.features = data.features ? data.features : this.features;
          this.behind = data.behind;
          this.behindTitle = data.behind + " Blocks Behind Hive";
          this.getRecents()
        });
    },
    removeUser() {
      this.balance = 0;
      this.bartoken = "";
      this.barpow = "";
      this.bargov = "";
      this.accountapi = "";
      this.hasDrop = false;
      this.openorders = [];
      this.accountinfo = {};
      this.barhive = "";
      this.barhbd = "";
    },
    getTokenUser(user) {
      if(user)fetch(this.lapi + "/@" + user)
        .then((response) => response.json())
        .then((data) => {
          this.balance = (data.balance / 1000).toFixed(3);
          this.bartoken = this.balance;
          this.barpow = (
            (data.poweredUp + data.granted - data.granting) /
            1000
          ).toFixed(3);
          this.bargov = (data.gov / 1000).toFixed(3);
          this.accountapi = data;
          this.openorders = data.contracts.reduce((acc, cur) => {
            cur.nai = `${
              cur.type.split(":")[0] == "hive"
                ? parseFloat(cur.hive / 1000).toFixed(3)
                : parseFloat(cur.hbd / 1000).toFixed(3)
            } ${cur.type.split(":")[0] == "hive" ? "HIVE" : "HBD"}`;
            if (
              cur.partials &&
              cur.partials.length &&
              cur.type.split(":")[1] == "sell"
            ) {
              const filled = cur.partials.reduce(function (a, c) {
                return a + c.coin;
              }, 0);
              cur.percentFilled = parseFloat(
                (100 * filled) / (cur.hive ? cur.hive : cur.hbd + filled)
              ).toFixed(2);
              acc.push(cur);
            } else if (cur.partials && cur.partials.length) {
              const filled = cur.partials.reduce(function (a, c) {
                return a + c.token;
              }, 0);
              cur.percentFilled = parseFloat(
                (100 * filled) / (cur.amount + filled)
              ).toFixed(2);
              acc.push(cur);
            } else {
              cur.percentFilled = "0.00";
              acc.push(cur);
            }
            console.log({
              acc,
            });
            return acc;
          }, []);
        });
    },
    getHiveUser(user) {
      if (user)
        fetch(hapi, {
          body: `{"jsonrpc":"2.0", "method":"condenser_api.get_accounts", "params":[["${user}"]], "id":1}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        })
          .then((response) => response.json())
          .then((data) => {
            this.accountinfo = data.result[0];
            this.barhive = this.accountinfo.balance;
            this.barhbd = this.accountinfo.hbd_balance;
            if (user == this.account) {
            try {
              var profilePicUrl = '/img/no-user.png'
              const metadata = JSON.parse(this.accountinfo.posting_json_metadata || this.accountinfo.json_metadata || '{}');
              if (metadata.profile && metadata.profile.profile_image) {
                profilePicUrl = metadata.profile.profile_image;
              }
              this.mypfp = profilePicUrl
            } catch (e) {
              this.mypfp = '/img/no-user.png'
            }
          }
          });
        if (localStorage.getItem(`hhp:${user}`) && 
          localStorage.getItem(`hhp:${user}`) >
          new Date().getTime() - 86400000
        )this.hasHiddenPrompt = true
        else {
          this.hasHiddenPrompt = false;
          localStorage.removeItem(`hhp:${user}`);
        }
          fetch("https://hive-api.dlux.io", {
            body: `{"jsonrpc":"2.0", "method":"condenser_api.list_proposal_votes", "params":[["${user}", 322], 1, "by_voter_proposal", "ascending", "all"], "id":1}`,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(data);
              if (
                data.result[0].proposal.proposal_id == 322 &&
                data.result[0].voter == user
              ) {
                this.hidePrompt = true;
                localStorage.setItem(`hhp:${user}`, new Date().getTime())
               } else this.hidePrompt = false;
            });
    },
    popDEX() {
      fetch(this.lapi + "/dex")
        .then((response) => response.json())
        .then((data) => {
          this.hivebuys = data.markets.hive.buys
            .sort(function (a, b) {
              return parseFloat(b.rate) - parseFloat(a.rate);
            })
            .reduce((acc, cur) => {
              if (!acc.length || acc[acc.length - 1].rate != cur.rate) {
                cur.total = cur.hive + (acc[acc.length - 1]?.total || 0);
                cur.at = cur.amount + (acc[acc.length - 1]?.amount || 0);
                acc.push(cur);
              } else {
                acc[acc.length - 1].total =
                  cur.hive + acc[acc.length - 1].total;
                acc[acc.length - 1].hive = cur.hive + acc[acc.length - 1].hive;
                acc[acc.length - 1].amount =
                  cur.amount + acc[acc.length - 1].amount;
                acc[acc.length - 1].at = cur.amount + acc[acc.length - 1].at;
              }
              return acc;
            }, []);
          this.hivesells = data.markets.hive.sells
            .sort(function (a, b) {
              return parseFloat(a.rate) - parseFloat(b.rate);
            })
            .reduce((acc, cur) => {
              if (!acc.length || acc[acc.length - 1].rate != cur.rate) {
                cur.total = cur.hive + (acc[acc.length - 1]?.total || 0);
                cur.at = cur.amount + (acc[acc.length - 1]?.amount || 0);
                acc.push(cur);
              } else {
                acc[acc.length - 1].total =
                  cur.hive + acc[acc.length - 1].total;
                acc[acc.length - 1].hive = cur.hive + acc[acc.length - 1].hive;
                acc[acc.length - 1].amount =
                  cur.amount + acc[acc.length - 1].amount;
                acc[acc.length - 1].at = cur.amount + acc[acc.length - 1].at;
              }
              return acc;
            }, []);
          this.hbdbuys = data.markets.hbd.buys
            .sort(function (a, b) {
              return parseFloat(b.rate) - parseFloat(a.rate);
            })
            .reduce((acc, cur) => {
              if (!acc.length || acc[acc.length - 1].rate != cur.rate) {
                cur.total = cur.hbd + (acc[acc.length - 1]?.total || 0);
                cur.at = cur.amount + (acc[acc.length - 1]?.amount || 0);
                acc.push(cur);
              } else {
                acc[acc.length - 1].total = cur.hbd + acc[acc.length - 1].total;
                acc[acc.length - 1].hbd = cur.hbd + acc[acc.length - 1].hbd;
                acc[acc.length - 1].amount =
                  cur.amount + acc[acc.length - 1].amount;
                acc[acc.length - 1].at = cur.amount + acc[acc.length - 1].at;
              }
              return acc;
            }, []);
          this.hbdsells = data.markets.hbd.sells
            .sort(function (a, b) {
              return parseFloat(a.rate) - parseFloat(b.rate);
            })
            .reduce((acc, cur) => {
              if (!acc.length || acc[acc.length - 1].rate != cur.rate) {
                cur.total = cur.hbd + (acc[acc.length - 1]?.total || 0);
                cur.at = cur.amount + (acc[acc.length - 1]?.amount || 0);
                acc.push(cur);
              } else {
                acc[acc.length - 1].total = cur.hbd + acc[acc.length - 1].total;
                acc[acc.length - 1].hbd = cur.hbd + acc[acc.length - 1].hbd;
                acc[acc.length - 1].amount =
                  cur.amount + acc[acc.length - 1].amount;
                acc[acc.length - 1].at = cur.amount + acc[acc.length - 1].at;
              }
              return acc;
            }, []);
          this.dexapi = data;
          this.getHistorical();
          if (this.hivesells[0]) this.buyPrice = this.hivesells[0].rate;
          if (this.hivebuys[0]) this.sellPrice = this.hivebuys[0].rate;
        });
    },
  },
  mounted() {
    // this.chart.width = this.$refs.chartContainer.scrollWidth - 15;
    // this.chart.height = this.chart.width / 2.5;
    // this.$refs.dumbo.style = `width: ${this.chart.width}px; height: ${
    //   this.chart.height + 30
    // }px;`;
    // window.addEventListener("resize", this.onResize);
    this.getQuotes();
    this.getNodes();
    this.getProtocol();
    this.popDEX();
    if (user != "GUEST") this.getTokenUser(user);
    if (user != "GUEST") this.getHiveUser(user);
  },
  computed: {
    chartTitle: {
      get() {
        return `${this.TOKEN}:${this.buyhive.checked ? "HIVE" : "HBD"}`;
      },
    },
    minbuy: {
      get() {
        return parseFloat(
          parseFloat(parseFloat(this.buyPrice / 1000).toFixed(3)) + 0.001
        ).toFixed(3);
      },
    },
    minsell: {
      get() {
        var a;
        if (this.buyhive.checked) a = (0.001 / this.sellPrice).toFixed(3);
        else a = (0.001 / this.sellPrice).toFixed(3);
        return a;
      },
    },
    maxhbuy: {
      get() {
        return this.buymarket.checked
          ? "100000.000"
          : parseFloat(
              (this.dexapi.markets.hive.tick *
                (this.stats.dex_max / 100) *
                (this.buyPrice <=
              this.dexapi.markets.hive.tick
                ? 1 -
                  (this.buyPrice / this.dexapi.markets.hive.tick) *
                    (this.stats.dex_slope / 100)
                : 1 - (this.stats.dex_slope / 100)) * this.stats.safetyLimit) / 1000
            ).toFixed(3);
      },
    },
    maxdbuy: {
      get() {
        return this.buymarket.checked
          ? "100000.000"
          : parseFloat(
              (this.dexapi.markets.hbd.tick *
                (this.stats.dex_max / 100) *
                (this.buyPrice <=
              this.dexapi.markets.hbd.tick
                ? 1 -
                  (this.buyPrice / this.dexapi.markets.hbd.tick) *
                    (this.stats.dex_slope / 100)
                : 1 - (this.stats.dex_slope / 100)) * this.stats.safetyLimit) / 1000
            ).toFixed(3);
      },
    },
    marketCap: {
      get() {
        if (this.buyhive.checked)
          return `${parseFloat(
            (this.stats.tokenSupply / 1000) *
              this.hiveprice.hive.usd *
              this.dexapi.markets.hive.tick
          ).toFixed(2)}`;
        else
          return `${parseFloat(
            (this.stats.tokenSupply / 1000) *
              this.hbdprice.hive_dollar.usd *
              this.dexapi.markets.hbd.tick
          ).toFixed(2)}`;
      },
    },
    isnode: {
      get() {
        return this.nodes[this.account] ? true : false;
      },
    },
  },
}).mount('#app') 
