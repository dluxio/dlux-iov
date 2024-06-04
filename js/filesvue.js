export default {
    template: `
<div v-for="(size, file, index) in files" class="card rounded p-0 my-2 mx-1" style="max-width:200px">
        <a :href="'https://ipfs.dlux.io/ipfs/' + file" target="_blank" class="no-decoration">
            <img :src="smartThumb(contract.i, index, file)" onerror="this.style.display='none'"
            class="card-img-top rounded-top" :alt="file">
            <div class="card-body">
                <span class="text-break small text-muted">{{newMeta[contract.i][index * 4 + 1] || file}}</span><br>
                <span class="text-break small text-muted">{{newMeta[contract.i][index * 4 + 2]}}</span><br>
                <span class="text-break small text-muted">{{fancyBytes(size)}}</span><br>
                <button type="button" class="text-break small text-muted" @click="copyText(contract.i)">Copy Contract ID to Clipboard</button>
            </div>
        </a>
        <div class="card-footer mt-auto text-center border-0" v-if="assets">
            <button type="button" class="btn btn-primary" @click="addAsset(file, contract)"><i
                class="fa-solid fa-square-plus me-2"></i>Add</button>
        </div>
    </div>

   `,
props: {
    assets: {
        type: Boolean,
        default: false,
    },
    contract: {
        type: Object,
        default: function () {
            return {
                n: {},
                p: 3,
                df: {},
                nt: "0",
                i: "a:1:1",
                id: "a-1-1",
                m: "",
                u: 1,
                t: 10,
                extend: 7,

            };
        }
    },
},
data() {
    return {
        files: {},
        newMeta: {},
    };
},
emits: [ "addassets" ],
methods: {
    addAsset(id, contract) {
        this.$emit("addassets", { id, contract: contract.i });
    },
    smartThumb(contract, index,cid) {
        var thumb = this.newMeta[contract][index * 4 + 3]
        if (thumb.includes('Qm')) return `https://ipfs.dlux.io/ipfs/${thumb}`
        if (thumb.includes('https')) return thumb
        switch (this.newMeta[contract][index * 4 + 2]) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'bmp':
            case 'webp':
            case 'tiff':
            case 'tif':
                return `https://ipfs.dlux.io/ipfs/${cid}`
            case 'svg':
                return `svg`
            case 'mp4':
            case 'gltf':
            case 'glb':
            case 'html':
            case 'htm':
            case 'pdf':
            case 'txt':
            case 'md':
            case 'json':
            case 'csv':
            case 'xml':
            case 'yaml':
            case 'yml':
            case 'js':
            case 'css':
            case 'scss':
            case 'sass':
            case 'mp3':
            case 'wav':
            case 'ico':
            case 'enc': //encrypted
            default:
                return '/img/dluxdefault.png'
        }
    },
    fancyBytes(bytes) {
        var counter = 0, p = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
        while (bytes > 1024) {
            bytes = bytes / 1024
            counter++
        }
        return `${this.toFixed(bytes, 2)} ${p[counter]}B`
    },
    toFixed(n, digits) {
        return parseFloat(n).toFixed(digits)
    },
    copyText(text){
        navigator.clipboard.writeText(text)
    },
},
computed: {
    hasFiles() {
        return Object.keys(this.files).length > 0;
    }
},
mounted() {
    this.files = this.contract.df;
    if (!this.contract.m) {
        this.contract.m = ""
        const filesNum = this.contract?.df ? Object.keys(this.contract.df).length : 0
        this.newMeta[this.contract.i] = new Array(filesNum * 4 + 1).fill('')
    } else {
        this.newMeta[this.contract.i] = this.contract.m.split(",")
    }
},
};