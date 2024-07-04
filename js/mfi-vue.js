export default {
  name: "MFI",
  template: `<!-- Get Token Modal-->
            <div class="modal fade" :id="bsid" tabindex="-1" role="dialog" aria-labelledby="buyDluxModalTitle"
                aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" role="document" :id="bsid + 'buy-modal'">
                    <div class="modal-content">
                        <form class="needs-validation" novalidate @submit.prevent="dexBuy()">
                            <input v-model="markethbd" value="0" class="d-none">
                            <input v-model="marketqty" value="0" class="d-none">
                            <input v-model="markettime" value="0" class="d-none">
                            <div class="modal-header d-flex flex-fill justify-content-between align-items-center">
                                <h5 class="modal-title">MARKET ORDER</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                                </button>
                            </div>
                            <div class="modal-body">
                                <p class="small text-white-50">Market Orders utilize multisig to
                                    complete partial fills of open orders on the <a
                                        :href="'/dex?api=' + api">DEX</a>,
                                    starting
                                    with the lowest rate to ensure you're getting the best
                                    price.</p>
                                <div class="d-flex flex-column">
                                    <div class="d-flex flex-column flex-fill rounded-top p-3 bg-darker">
                                        <div class="d-flex flex-row flex-fill align-items-center">
                                            <p style="font-size: 18px;" class="p-0 m-0 font-weight-light">From
                                            </p>
                                            <div class="d-flex ms-auto align-items-baseline">
                                                <div class="d-flex small justify-content-between">
                                                    <p class="my-0 text-white-50">Available<i
                                                            class="fab fa-hive mx-1"></i></p>
                                                    <p @click="popOrder()" class="my-0 text-primary">
                                                         {{ accountinfo.balance }}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="d-flex flex-row flex-fill mt-1">
                                            <div class="d-flex align-items-center">
                                                <div class="circle2"><i class="fab fa-hive"></i>
                                                </div>
                                                <h2 class="p-0 m-0 ms-2 font-weight-bold">HIVE
                                                </h2>
                                            </div>
                                            <div class="d-flex ms-auto flex-column">
                                                <p class="ms-auto my-0 text-white-50 font-weight-bolder"
                                                    style="font-size: 30px;">
                                                    <input class="form-control text-white"
                                                        style="background-color: rgba(0,0,0,0.5); max-width: 150px"
                                                        v-model="markethive" value="1" placeholder="0" type="number"
                                                        min="0.001" step="0.001" required @change="marketValue()"
                                                        @keyup="marketValue()" :max="parseFloat(accountinfo.balance)">
                                                </p>
                                                <p class="ms-auto my-0 text-muted font-weight-bold"
                                                    style="font-size: 16px;">
                                                    &asymp;
                                                    $ marketorder.hive * hiveprice
                                                </p>
                                            </div>
                                        </div>
                                        <div class="d-flex justify-content-between">
                                            <div></div>
                                            <div>
                                                <button class="btn btn-outline-secondary btn-sm text-muted"
                                                    type="button" data-bs-toggle="collapse"
                                                    :data-bs-target="'#' + bsid + 'collapseExample'" aria-expanded="false"
                                                    :aria-controls="bsid + 'collapseExample'"><i
                                                        class="fas fa-info-circle"></i></button>
                                            </div>
                                        </div>
                                        <div class="collapse" :id=" bsid + 'collapseExample'">
                                            <div class="d-flex">
                                                <p style="font-size: 18px;"
                                                    class="p-0 m-0 text-white-50 font-weight-light">
                                                    Rate</p>
                                                <p style="font-size: 16px;" class="p-0 m-0 text-white-50 ms-auto">1
                                                    HIVE
                                                    &asymp; 1 / dex.account.tick  {{ protocol.TOKEN }}
                                                </p>
                                            </div>
                                            <div class="d-flex">
                                                <p style="font-size: 12px;"
                                                    class="p-0 m-0 text-muted ms-auto text-success">
                                                    1 {{ protocol.TOKEN }} &asymp; dex.hive.tick
                                                    HIVE</p>
                                            </div>
                                            <hr width="100%" style="border: #333 thin solid">
                                            <div class="d-flex">
                                                <p style="font-size: 18px;"
                                                    class="p-0 m-0 text-white-50 font-weight-light">
                                                    Swap Fee<small
                                                        class="rounded-pill border border-secondary py-05 px-1 ms-1">0.1%</small>
                                                </p>
                                                <p style="font-size: 16px;" class="p-0 m-0 text-white-50 ms-auto">
                                                    &asymp;
                                                    <input v-model="marketfee" class="d-none"
                                                        value="((markethive.value/dexview1.data[0].rate)*0.001).formatNumber(3,'.',',')">
                                                     (marketorder.hive * .999 ) *
                                                    dex.hive.tick {{ TOKEN }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="p-0 m-0 bg-dark">
                                        <div class="arrow2 rounded-circle border border-warning bg-darker text-warning">
                                            <h1 class="m-2 px-2 py-1"><i class="fas fa-angle-double-down"></i>
                                            </h1>
                                        </div>
                                    </div>
                                    <div class="d-flex flex-column flex-fill rounded-bottom p-3 border border-warning"
                                        style="background: radial-gradient(#222,#111);">
                                        <div class="d-flex flex-row flex-fill align-items-center">
                                            <p style="font-size: 18px;" class="p-0 m-0 font-weight-light">To</p>
                                        </div>
                                        <div class="d-flex flex-row flex-fill mt-1 align-items-center">
                                            <div class="d-flex align-items-center">
                                                <div class="circle2 d-flex align-items-center justify-content-around">
                                                    <img src="/img/dlux-hive-logo-alpha.svg" width="70%">
                                                </div>
                                                <h2 class="p-0 m-0 ms-2 font-weight-bold">
                                                    {{ protocol.TOKEN }}
                                                </h2>
                                            </div>
                                            <div class="d-flex ms-auto">
                                                <p class="ms-auto my-0 text-warning font-weight-bolder"
                                                    style="font-size: 30px;">&asymp;
                                                    marketorder.value / 1000
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <div class="d-flex justify-content-around">
                                    <button type="submit" class="btn btn-lg btn-primary">Convert</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>`,
  emits: ['tosign'],
  data() {
    return {
      account: "",
      markethbd: 0,
      marketqty: 0,
      markettime: 0,
      markethive: 0,
      marketfee: 0,
      protocol: {
        prefix: "",
        multisig: "",
        jsontoken: "",
      },
      marketorder: {
        hive: 1,
        name: 'dlux',
        value: 1,
        dex: []
      },
    }
  },
  props: {
    api: {
      type: String,
      required: false,
      default: ""
    },
    bsid: {
      required: true,
    },
    accountinfo: {
      type: Object,
      required: false,
      default: function () {
        return {
          name: "Guest",
          balance: "0.000 HIVE",
          hbd_balance: "0.000 HBD",
        };
      },
    },
    info: {
      type: Object,
      required: false,
      default: function () {
        return {
          
        };
      },
    }
  },
  methods: {
    init(){
      if(this.account){
        fetch(this.api + "/api/protocol")
        .then((response) => response.json())
        .then((data) => {
          this.protocol.prefix = data.prefix;
          this.protocol.multisig = data.multisig;
          this.protocol.jsontoken = data.jsontoken;
          this.marketorder.name = data.jsontoken;
          this.protocol.TOKEN = data.jsontoken.toUpperCase();
          this.protocol.node = data.node;
          this.protocol.features = data.features ? data.features : this.features;
          this.protocol.behind = data.behind;
          this.protocol.behindTitle = data.behind + " Blocks Behind Hive";
          this.protocol.volume = {}
        })
        fetch(this.api + "/dex")
        .then((response) => response.json())
        .then((data) => {
          this.protocol.prefix = data.prefix;
          this.protocol.multisig = data.multisig;
          this.protocol.jsontoken = data.jsontoken;
          this.marketorder.name = data.jsontoken;
          this.protocol.TOKEN = data.jsontoken.toUpperCase();
          this.protocol.node = data.node;
          this.protocol.features = data.features ? data.features : this.features;
          this.protocol.behind = data.behind;
          this.protocol.behindTitle = data.behind + " Blocks Behind Hive";
          this.protocol.volume = {}
        })
        fetch(this.api + "/@" + this.account )
        .then((response) => response.json())
        .then((data) => {
          this.protocol.prefix = data.prefix;
          this.protocol.multisig = data.multisig;
          this.protocol.jsontoken = data.jsontoken;
          this.marketorder.name = data.jsontoken;
          this.protocol.TOKEN = data.jsontoken.toUpperCase();
          this.protocol.node = data.node;
          this.protocol.features = data.features ? data.features : this.features;
          this.protocol.behind = data.behind;
          this.protocol.behindTitle = data.behind + " Blocks Behind Hive";
          this.protocol.volume = {}
        })
      }
    },
    dexBuy(){
      this.$emit('tosign', {
        type: "xfr",
        cj: {
          to: this.protocol.multisig,
          hive: parseInt(this.marketorder.hive) * 1000,
          memo: ``,
        },
        txid: "sendhive",
        msg: `Market Order`,
        api: this.api,
        ops: ["getTokenUser"],
      })
    },
    marketValue() {
      
    }
  },
  watch: {
    'accountinfo': {
      handler: function (newValue) {
        if (newValue) {
          this.account = this.accountinfo.name;
        }
      },
      deep: true
    }
  },
  mounted() {
    this.account = this.accountinfo.name;
  }
};