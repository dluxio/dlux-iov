export default {
    template: `
<div v-for="(size, file, index) in files" class="card rounded p-0 my-2 mx-1" style="max-width:200px">
        <a :href="'https://ipfs.dlux.io/ipfs/' + file" target="_blank" class="no-decoration">
        <h5 class="m-0 ms-auto align-self-end">{{newMeta[contract.i][index * 4 + 1] || file}}</h5>
        <h5 class="m-0 ms-auto align-self-end"><span class="badge square rounded-top border border-bottom-0 bg-info border-light-50" :class="smartColor(newMeta[contract.i][index * 4 + 4])"><i :class="smartIcon(newMeta[contract.i][index * 4 + 4])"></i>{{ newMeta[contract.i][index * 4 + 2] }}</span></h5>
            <img :src="smartThumb(contract.i, index, file)" onerror="this.style.display='none'"
            class="card-img-top rounded-top" :alt="file">
            <div class="card-body">
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
    smartIcon(flags){
        //get first char of flags
        const flag = this.flagDecode(this.Base64toNumber(flags[0]))
        if (flag.enc) return 'fa-solid fa-file-shield'
        else if (flag.nsfw)return 'fa-solid fa-triangle-exclamation'
        else if (flag.executable)return 'fa-solid fa-cog'
        else return 'fa-solid fa-file'
    },
    smartColor(flags){
        //get first char of flags
        const flag = this.flagDecode(this.Base64toNumber(flags[0]))
        if (flag.nsfw) return 'bg-danger'
        else if (flag.executable)return 'bg-warning'
        else if (flag.enc)return 'bg-dark'
        else return 'bg-info'
    },
    smartThumb(contract, index, cid) {
        var thumb = this.newMeta[contract][index * 4 + 3] || ''
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
                return `https://ipfs.dlux.io/ipfs/${cid}`
            case 'mp4':
            case 'mov':
                return `/img/mov-file-type-svgrepo-com.svg`
            case 'avi':
                return `/img/avi-file-type-svgrepo-com.svg`
            case 'gltf':
            case 'glb':
                return `/img/dluxdefault.png`
            case 'html':
            case 'htm':
                return `/img/html-file-type-svgrepo-com.svg`
            case 'pdf':
                return `/img/pdf-file-type-svgrepo-com.svg`
            case 'txt':
            case 'json':
            case 'md':
            case 'xml':
            case 'yaml':
            case 'yml':
            case 'js':
                return `/img/txt-file-type-svgrepo-com.svg`
            case 'csv':
                return `/img/csv-file-type-svgrepo-com.svg`
            case 'css':
            case 'scss':
                return `/img/css-file-type-svgrepo-com.svg`
            case 'mp3':
                return `/img/mp3-file-type-svgrepo-com.svg`
            case 'wav':
                return `/img/wav-file-type-svgrepo-com.svg`
            case 'rar':
                return `/img/rar-file-type-svgrepo-com.svg`
            case 'zip':
                return `/img/zip-file-type-svgrepo-com.svg`
            case '':
                return '/img/other-file-type-svgrepo-com.svg'
            case 'enc': //encrypted
            default:
                return '/img/other-file-type-svgrepo-com.svg'
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
    flagEncode(fileInfo) {
        var num = 0
        if(this.encryption.encrypted)num += 1
        if(fileInfo.autoRenew)num += 2
        if(fileInfo.nsfw)num += 4
        if(fileInfo.executable)num += 8
        var flags = this.NumberToBase64(num)
        //append category chars here
        return flags
    },
    flagDecode(flags) {
        var num = this.Base64toNumber(flags)
        var out = {}
        if(num & 1)out.enc = true
        if(num & 2)out.autoRenew = true
        if(num & 4)out.nsfw = true
        if(num & 8)out.executable = true
        return out
    },
    Base64toNumber(chars) {
        const glyphs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
        var result = 0;
        chars = chars.split("");
        for (var e = 0; e < chars.length; e++) {
            result = result * 64 + glyphs.indexOf(chars[e]);
        }
        return result;
    },
    NumberToBase64(num) {
        const glyphs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
        var result = "";
        while (num > 0) {
            result = glyphs[num % 64] + result;
            num = Math.floor(num / 64);
        }
        return result;
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