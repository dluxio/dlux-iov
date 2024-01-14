export default {
    template: `
<div>
<div v-if="!Assets.length">No assets added. Use the File Upload
& Hosting section to view or create hosting contracts, then upload assets
into a hosting contract. Once you have assets in a hosting contract, you can
add them to your 360 post and they will appear here.</div>
<div v-if="Assets.length">
<h6>Assets</h6>
<div v-for="(asset, index) in Assets">
    <form onsubmit="return false;">
        <div class="dropdown ms-auto">
            <button class="btn btn-secondary" type="button" data-bs-toggle="dropdown" aria-expanded="true">
             Type
            </button>
            <ul class="dropdown-menu dropdown-menu-dark bg-black">
                <li><a class="dropdown-item" role="button">360</a></li>
                <li><a class="dropdown-item" role="button">GLTF</a></li>
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
                <div class="row g-3 align-items-center">
                    <div class="col-auto me-auto">
                        <label for="ry" class="col-form-label"><i
                                class="fa-solid fa-arrows-left-right me-2"></i>Pan
                            Y:{{asset.ry}}</label>
                    </div>
                    <div class="col-auto">
                        <input type="range" class="form-range" id="ry"
                            v-model="asset.ry"
                            @input="focusAsset(asset.hash, asset.contract, asset.name, asset.thumbHash, [asset.rx, asset.ry, asset.rz])"
                            min="-180" max="180" step="1">
                    </div>
                </div>
                <div class="row g-3 align-items-center">
                    <div class="col-auto me-auto">
                        <label for="rx" class="col-form-label"><i
                                class="fa-solid fa-arrows-rotate me-2"></i>Roll
                            X:{{asset.rx}}</label>
                    </div>
                    <div class="col-auto">
                        <input type="range" class="form-range" id="rx"
                            v-model="asset.rx"
                            @input="focusAsset(asset.hash, asset.contract, asset.name, asset.thumbHash, [asset.rx, asset.ry, asset.rz])"
                            min="-180" max="180" step="1">
                    </div>
                </div>
                <div class="row g-3 align-items-center">
                    <div class="col-auto me-auto">
                        <label for="rz" class="col-form-label"><i
                                class="fa-solid fa-arrows-rotate me-2"></i>Roll
                            Z:{{asset.rz}}</label>
                    </div>
                    <div class="col-auto">
                        <input type="range" class="form-range" id="rz"
                            v-model="asset.rz"
                            @input="focusAsset(asset.hash, asset.contract, asset.name, asset.thumbHash, [asset.rx, asset.ry, asset.rz])"
                            min="-180" max="180" step="1">
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
                <div class="form-check ms-auto me-auto">
                    <input class="form-check-input" type="checkbox" value=""
                        id="firstImage" :checked="asset.f"
                        @click="focusAsset(asset.hash, asset.contract, asset.name, asset.thumbHash, [asset.rx, asset.ry, asset.rz])">
                    <label class="form-check-label" for="firstImage">
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
        defaultTypes: {
            ts: {
                contract: "",
                f: 1,
                hash: "",
                name: "",
                r: "0 0 0",
                rx: "0",
                ry: "0",
                rz: "0",
                thumbHash: "",
                type: "ts"
            }
        }
    };
},
emits: [ "updateassets",  "dluxmock"],
methods: {
    update() {
        this.$emit("updateassets", this.Assets);
    },
    switchType(index,t){
        if(this.Types.indexOf(t) >= 0){
            const keys = Object.keys(this.defaultTypes[t])
            for(var i = 0; i < keys.length; i++){
                if(!this.Assets[index][keys[i]])this.Assets[index][keys[i]] = this.defaultTypes[t][keys[i]]
            }
            const newKeys = Object.keys(this.Assets[index])
            for (var i = 0; i < newKeys.length; i++){
                if(!this.defaultTypes[t][newKeys[i]])delete this.Assets[index][newKeys[i]]
            }
        }
    },
    focusAsset(cid, contract, name = '', thumbHash, type = 'ts') {
        var found = -1
        if (!cid) return false
        for (var i = 0; i < this.Assets.length; i++) {
          this.Assets[i].f = 0
          if (this.Assets[i].hash == cid) {
            found = i
          }
        }
        if (found >= 0) {
          this.Assets[found].name = name || this.Assets[found].name
          this.Assets[found].thumbHash = thumbHash || cid
          this.Assets[found].r = `${this.Assets[found].rx || 0} ${this.Assets[found].ry || 0} ${this.Assets[found].rz || 0}`
          this.Assets[found].f = 1
        } else {
          this.Assets.push({
            hash: cid,
            name: name,
            type: type,
            contract: contract,
            thumbHash,
            r: `${this.Assets[found].rx || 0} ${this.Assets[found].ry || 0} ${this.Assets[found].rz || 0}`,
            f: 1
          })
        }
        this.update()
      },
      addAsset(cid, contract, name = '', thumbHash = '', type = 'ts', rot = [0, 0, 0]) {
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
          this.Assets[found].r = rot.join(' ')
        } else {
          this.Assets.push({
            hash: cid,
            name: name,
            type: type,
            contract: contract,
            thumbHash,
            r: rot.join(' '),
            rx: rot[0],
            ry: rot[1],
            rz: rot[2],
            f: 1
          })
        }
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
      },
},
computed: {
},
mounted() {
    this.Assets=this.assets
    this.Types=this.types.split(',')
},
};