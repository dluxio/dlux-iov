export default {
    template: `
<div>
<div v-if="!assets.length">No assets added. Use the File Upload
& Hosting section to view or create hosting contracts, then upload assets
into a hosting contract. Once you have assets in a hosting contract, you can
add them to your 360 post and they will appear here.</div>
<div v-if="Assets.length">
<h6>Assets</h6>
<div v-for="(asset, index) in Assets">
    <form onsubmit="return false;">
        <div class="dropdown ms-auto">
            <button class="btn btn-secondary" type="button" data-bs-toggle="dropdown" aria-expanded="true">
             Type: {{typeDict[asset.type].name}}
            </button>
            <ul class="dropdown-menu dropdown-menu-dark bg-black" >
                <li v-for="type in Types"><a class="dropdown-item" role="button" @click="switchType(index,type)">{{typeDict[type].name}}</a></li>
            </ul>
        </div>
        <p class="text-break">CID: {{asset.hash}}</p>
        <p>In: {{asset.contract}}</p>
        <div
            class="d-flex p-2 justify-content-between align-items-center flex-wrap">
            <div class="m-2">
                <div class="input-group m-2">
                    <input type="text" class="form-control" v-model="asset.name"
                        placeholder="Picture Name">
                </div>
                <div class="input-group m-2">
                    <input type="text" class="form-control"
                        v-model="asset.thumbHash"
                        placeholder="Thumbnail IPFS Hash">
                </div>
            </div>
            <div class="d-flex flex-column p-2 m-2">
                <div class="row g-3 align-items-center" v-for="(val, param, index) in asset.config">
                    <div class="col-auto me-auto" v-if="paramDict[asset.type][param]">
                        <label :for="param" class="col-form-label"><i
                                :class="paramDict[asset.type][param].icon"></i>{{paramDict[asset.type][param].name}}:{{asset.config[param]}}</label>
                    </div>
                    <div class="col-auto">
                        <input :type="paramDict[asset.type][param].type" :class="{['form-' + paramDict[asset.type][param].type]: true}" :id="param"
                            v-model="asset.config[param]"
                            @input="focusAsset(asset.hash, asset.contract, asset.name, asset.thumbHash)"
                            :min="paramDict[asset.type][param].min" :max="paramDict[asset.type][param].max" :step="paramDict[asset.type][param].default">
                    </div>
                    <div v-if="param == 'atr'">
                        <p v-if="asset.config[param]">{{asset.config[param]}}</p><button class="btn btn-primary" @click="addAtr(asset.hash)">Add Attribute</button>
                        <p v-for="(atr, j) in asset.atr">{{atr}}</p><button class="btn btn-danger" @click="subAtr(asset.hash, j)">Remove Attribute</button>
                    </div>
                </div>
            </div>
            <div class="d-flex flex-column">
                <div class="d-flex" style="justify-content: center;"><img
                        :src="'https://ipfs.dlux.io/ipfs/' + asset.hash"
                        class="img-fluid" style="max-width: 300px;"
                        :alt="asset.hash"></div>
                <div class="m-2 btn-group">
                    <button class="btn btn-primary"
                        @click="addAsset(asset.hash, asset.contract, asset.name, asset.thumbHash, asset.r)">Refresh
                        dApp</button>
                    <button type="button"
                        class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                        disabled></button>
                    <button class="btn btn-primary"
                        @click="delAsset(asset.hash, asset.contract, asset.name, asset.thumbHash)">Delete
                        Asset</button>
                    <button v-if="asset.type == 'img' || asset.type == 'ts'" class="btn btn-primary"
                        @click="copyToClipboard('![' + asset.name + '](http://ipfs.dlux.io/ipfs/' + asset.hash + ')')"><i class="fa-solid fa-image"></i><i class="fa-solid fa-caret-right"></i><i class="fa-solid fa-clipboard"></i></button>
                        <button class="btn btn-primary"
                        @click="copyToClipboard('[' + asset.name + '](http://ipfs.dlux.io/ipfs/' + asset.hash + ')')"><i class="fa-solid fa-clipboard"></i></button>
                    <button type="button"
                        class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                        disabled></button>
                    <button class="btn btn-primary" :disabled="index == 0"
                        @click="moveAsset(asset.hash, 'up')"><i
                            class="fa-solid fa-up-long"></i></button>
                    <button type="button"
                        class="btn btn-dark ms-0 me-0 ps-0 pe-0"
                        disabled></button>
                    <button class="btn btn-primary"
                        :disabled="index == Assets.length - 1"
                        @click="moveAsset(asset.hash, 'down')"><i
                            class="fa-solid fa-down-long"></i></button>
                </div>
                <div class="form-check ms-auto me-auto" v-if="hasProp(asset, 'f')">
                    <input class="form-check-input" type="checkbox" value=""
                        :id="asset.hash + 'firstImage'" :checked="asset.f"
                        @click="focusAsset(asset.hash, asset.contract, asset.name, asset.thumbHash)">
                    <label class="form-check-label" :for="asset.hash + 'firstImage'">
                        Initial Image
                    </label>
                </div>
            </div>
        </div>
    </form>
</div>
</div>
</div>
   `,
props: {
    assets: {
        default: function () {
            return []
        }
    },
    types: {
        default: ""
    }

},
data() {
    return {
        Assets: [],
        Types: [],
        typeDict: {
            ts: {
                name: "360",
            },
            obj: {
                name: "Object",
            },
            img: {
                name: "Image",
            },
            aud: {
                name: "Audio",
            },
            vid: {
                name: "Video",
            },
            txt: {
                name: "Text",
            },
            bin: {
                name: "Binary",
            },
            pdf: {
                name: "PDF",
            },
            doc: {
                name: "Document",
            },
            app: {
                name: "Application",
            },
            oth: {
                name: "Other",
            },
        },
        paramDict: {
            oth: {
                atr: {
                    name: "Attributes",
                    type: "text",
                    default: "",
                    icon: "",
                },
            },
            app: {
                atr: {
                    name: "Attributes",
                    type: "text",
                    default: "",
                    icon: "",
                },
            },
            doc: {
                atr: {
                    name: "Attributes",
                    type: "text",
                    default: "",
                    icon: "",
                },
            },
            pdf: {
                atr: {
                    name: "Attributes",
                    type: "text",
                    default: "",
                    icon: "",
                },
            },
            bin: {
                atr: {
                    name: "Attributes",
                    type: "text",
                    default: "",
                    icon: "",
                },
            },
            txt: {
                atr: {
                    name: "Attributes",
                    type: "text",
                    default: "",
                    icon: "",
                },
            },
            vid: {
                atr: {
                    name: "Attributes",
                    type: "text",
                    default: "",
                    icon: "",
                },
            },
            aud: {
                atr: {
                    name: "Attributes",
                    type: "text",
                    default: "",
                    icon: "",
                },
            },
            img: {
                atr: {
                    name: "Attributes",
                    type: "text",
                    default: "",
                    icon: "",
                },
                sx: {
                    name: "Scale X",
                    min: 0,
                    max: 10,
                    step: 0.1,
                    type: "range",
                    default: 1,
                    units: "deg",
                },
                sy: {
                    name: "Scale Y",
                    min: 0,
                    max: 10,
                    step: 0.1,
                    type: "range",
                    default: 1,
                    units: "deg",
                },
                s: {
                    name: "Scale",
                },
            },
            ts: {
                atr: {
                    name: "Attributes",
                    type: "text",
                    default: "",
                    icon: "",
                },
                r: {
                    name: "Rotation",
                    icon: "",
                },
                rx: {
                    name: "Roll X",
                    min: -180,
                    max: 180,
                    step: 1,
                    type: "range",
                    default: 0,
                    units: "deg",
                    icon: ["fa-solid", "fa-arrows-rotate", "me-2"],
                },
                ry: {
                    name: "Pan Y",
                    min: -180,
                    max: 180,
                    step: 1,
                    type: "range",
                    default: 0,
                    units: "deg",
                    icon: ["fa-solid", "fa-arrows-left-right", "me-2"],
                },
                rz: {
                    name: "Roll Z",
                    min: -180,
                    max: 180,
                    step: 1,
                    type: "range",
                    default: 0,
                    units: "deg",
                    icon: ["fa-solid", "fa-arrows-rotate", "me-2"],
                },
            },
            obj: {
                atr: {
                    name: "Attributes",
                    type: "text",
                    default: "",
                    icon: "",
                },
                r: {
                    name: "Rotation",
                },
                rx: {
                    name: "Roll X",
                    min: -180,
                    max: 180,
                    step: 1,
                    type: "range",
                    default: 0,
                    units: "deg",
                },
                ry: {
                    name: "Pan Y",
                    min: -180,
                    max: 180,
                    step: 1,
                    type: "range",
                    default: 0,
                    units: "deg",
                },
                rz: {
                    name: "Roll Z",
                    min: -180,
                    max: 180,
                    step: 1,
                    type: "range",
                    default: 0,
                    units: "deg",
                },
                px: {
                    name: "Position X",
                    min: -180,
                    max: 180,
                    step: 1,
                    type: "range",
                    default: 0,
                    units: "deg",
                },
                py: {
                    name: "Position Y",
                    min: -180,
                    max: 180,
                    step: 1,
                    type: "range",
                    default: 0,
                    units: "deg",
                },
                pz: {
                    name: "Position Z",
                    min: -180,
                    max: 180,
                    step: 1,
                    type: "range",
                    default: 0,
                    units: "deg",
                },
                sx: {
                    name: "Scale X",
                    min: 0,
                    max: 10,
                    step: 0.1,
                    type: "range",
                    default: 1,
                    units: "deg",
                },
                sy: {
                    name: "Scale Y",
                    min: 0,
                    max: 10,
                    step: 0.1,
                    type: "range",
                    default: 1,
                    units: "deg",
                },
                sz: {
                    name: "Scale Z",
                    min: 0,
                    max: 10,
                    step: 0.1,
                    type: "range",
                    default: 1,
                    units: "deg",
                },
                s: {
                    name: "Scale",
                },
                p: {
                    name: "Position",
                },
            }
        },
        defaultTypes: {
            ts: {
                contract: "",
                f: 0,
                hash: "",
                name: "",
                r: "0 0 0",
                config: {
                    rx: "0",
                    ry: "0",
                    rz: "0",
                    atr: "",
                },
                thumbHash: "",
                type: "ts",
                atr: [],
            },
            img: {
                contract: "",
                f: 0,
                hash: "",
                name: "",
                s: "1 1 1",
                config: {
                    sx: "1",
                    sy: "1",
                    atr: "",
                },
                thumbHash: "",
                type: "img",
                atr: [],
            },
            aud: {
                contract: "",
                hash: "",
                name: "",
                config: {
                    atr: "",
                },
                thumbHash: "",
                type: "aud",
                atr: [],
            },
            vid: {
                contract: "",
                hash: "",
                name: "",
                config: {
                    atr: "",
                },
                thumbHash: "",
                type: "vid",
                atr: [],
            },
            txt: {
                contract: "",
                hash: "",
                name: "",
                config: {
                    atr: "",
                },
                thumbHash: "",
                type: "txt",
                atr: [],
            },
            bin: {
                contract: "",
                hash: "",
                name: "",
                config: {
                    atr: "",
                },
                thumbHash: "",
                type: "bin",
                atr: [],
            },
            doc: {
                contract: "",
                hash: "",
                name: "",
                config: {
                    atr: "",
                },
                thumbHash: "",
                type: "doc",
                atr: [],
            },
            app: {
                contract: "",
                hash: "",
                name: "",
                config: {
                    perm: "",
                    atr: "",
                },
                thumbHash: "",
                type: "app",
                atr: [],
                perm: [],
            },
            oth: {
                contract: "",
                hash: "",
                name: "",
                config: {
                    atr: "",
                },
                thumbHash: "",
                type: "oth",
                atr: [],
            },
            pdf: {
                contract: "",
                hash: "",
                name: "",
                config: {
                    atr: "",
                },
                thumbHash: "",
                type: "pdf",
                atr: [],
            },
            obj: {
                contract: "",
                hash: "",
                name: "",
                r: "0 0 0",
                config: {
                    rx: "0",
                    ry: "0",
                    rz: "0",
                    px: "0",
                    py: "0",
                    pz: "0",
                    sx: "1",
                    sy: "1",
                    sz: "1",
                    atr: "",
                },
                p: "0 0 0",
                s: "1 1 1",
                atr: [],
                thumbHash: "",
                type: "obj"
            }
        }
    };
},
emits: [ "updateassets",  "dluxmock"],
methods: {
    update() {
        let assets = []
        for (var i = 0; i < this.Assets.length; i++) {
            const keys = Object.keys(this.Assets[i])
            for (var j = 0; j < keys.length; j++) {
                if (!this.defaultTypes[this.Assets[i].type].hasOwnProperty(keys[j])) {
                    delete this.Assets[i][keys[j]]
                }
            }
            if(this.Assets[i].config.hasOwnProperty('rx')){
                this.Assets[i].r = `${this.Assets[i].config.rx} ${this.Assets[i].config.ry} ${this.Assets[i].config.rz || 0}`
            }
            if(this.Assets[i].config.hasOwnProperty('px')){
                this.Assets[i].p = `${this.Assets[i].config.px} ${this.Assets[i].config.py} ${this.Assets[i].config.pz || 0}`
            }
            if(this.Assets[i].config.hasOwnProperty('sx')){
                this.Assets[i].s = `${this.Assets[i].config.sx} ${this.Assets[i].config.sy} ${this.Assets[i].config.sz || 1}`
            }
            assets.push(Object.assign({},this.Assets[i]))
            delete assets[assets.length - 1].config
        }
        this.$emit("updateassets", assets);
    },
    hasProp(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    },
    copyToClipboard(text) {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    },
    switchType(index,t){
        if(index = -1)index = this.Assets.length - 1
        if(this.Types.indexOf(t) >= 0){
            this.Assets[index] = Object.assign({}, this.defaultTypes[t], this.Assets[index])
            this.Assets[index].type = t
            this.Assets[index].config = Object.assign({}, this.defaultTypes[t].config)
        }
        console.log(this.Assets[index])
    },
    focusAsset(cid, contract, name = '', thumbHash, type) {
        var found = -1
        if (!cid) return false
        var first = []
        for (var i = 0; i < this.Assets.length; i++) {
          if (this.Assets[i].hash == cid) {
            found = i
          }
          if (this.Assets[i].f == 1) {
            first.push(i)
          }
        }
        if (first.indexOf(found) >= 0){
            first.splice(first.indexOf(found), 1)
            for (var i = 0; i < first.length; i++) {
                this.Assets[first[i]].f = 0
            }
        }
        if (found >= 0) {
          this.Assets[found].name = name || this.Assets[found].name
          this.Assets[found].thumbHash = thumbHash || cid
          if(this.Assets[found].type != type){
              this.switchType(found, type)
          }
        } else {
          this.Assets.push({
            hash: cid,
            name: name,
            type: type,
            contract: contract,
            thumbHash
          })
        }
        this.update()
      },
      addAtr(cid) {
        var found = -1
        if (!cid) return false
        for (var i = 0; i < this.Assets.length; i++) {
          if (this.Assets[i].hash == cid) {
            found = i
            break
          }
        }
        if (found >= 0) {
          this.Assets[found].atr.push(this.Assets[found].config.atr)
        this.Assets[found].config.atr = ''
        }
        this.update()
      },
      subAtr(cid, j) {
        var found = -1
        if (!cid) return false
        for (var i = 0; i < this.Assets.length; i++) {
          if (this.Assets[i].hash == cid) {
            found = i
            break
          }
        }
        if (found >= 0) {
          this.Assets[found].atr.splice(j, 1)
        }
        this.update()
      },
      addAsset(cid, contract, name = '', thumbHash = '', type = 'ts') {
        var found = -1
        if (!cid) return false
        if(typeof cid == 'object'){
          contract = cid.contract
          cid = cid.id
        }
        for (var i = 0; i < this.Assets.length; i++) {
          this.Assets[i].f = 0
          if (this.Assets[i].hash == cid) {
            found = i
          }
        }
        if (found >= 0) {
          this.Assets[found].name = name || this.Assets[found].name
          this.Assets[found].thumbHash = thumbHash || cid
        } else {
          this.Assets.push({
            hash: cid,
            name: name,
            type: type,
            contract: contract,
            thumbHash,
          })
        }
        this.switchType(found, type)
        this.update()
      },
      delAsset(cid) {
        var found = -1
        if (!cid) return false
        for (var i = 0; i < this.Assets.length; i++) {
          if (this.Assets[i].hash == cid) {
            found = i
          }
        }
        if (found >= 0) {
          this.Assets.splice(found, 1)
        }
        this.update()
      },
      moveAsset(cid, dir = 'up') {
        var found = -1
        if (!cid) return false
        for (var i = 0; i < this.Assets.length; i++) {
          if (this.Assets[i].hash == cid) {
            found = i
          }
        }
        if ((found >= 1 && dir == 'up') || (found < this.Assets.length - 1 && dir == 'down')) {
          const asset = this.Assets[found]
          this.Assets.splice(found, 1)
          this.Assets.splice(dir == 'up' ? found - 1 : found + 1, 0, asset)
        }
        this.update()
      }
},
computed: {
},
watch: {
    'assets.length' (newValue) {
        console.log('newAsset')
        for (var i = 0; i < this.assets.length; i++) {
            this.addAsset(this.assets[i].hash, this.assets[i].contract, this.assets[i].name, this.assets[i].thumbHash, this.assets[i].type)
        }
    }
},
mounted() {
    this.Types=this.types.split(',')
    for (var i = 0; i < this.assets.length; i++) {
        console.log(this.assets[i])
        this.addAsset(this.assets[i].hash, this.assets[i].contract, this.assets[i].name, this.assets[i].thumbHash, this.assets[i].type)
    }
},
};