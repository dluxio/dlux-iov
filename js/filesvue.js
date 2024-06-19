export default {
    template: `
<div v-for="(size, file, index) in filesArray" class="card rounded p-0 my-2 mx-1" style="max-width:200px">
        <a :href="'https://ipfs.dlux.io/ipfs/' + file" target="_blank" class="no-decoration">
        <h4 class="m-0 ms-auto align-self-end">{{newMeta[contract.i][index * 4 + 1] || file}}</h4>
        <h5 class="m-0 ms-auto align-self-end"><span class="badge square rounded-top border border-bottom-0 bg-info border-light-50" :class="smartColor(newMeta[contract.i][index * 4 + 4])"><i :class="smartIcon(newMeta[contract.i][index * 4 + 4])"></i>{{ newMeta[contract.i][index * 4 + 2] }}</span></h5>
            <div class="bg-light rounded">    
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                        viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve" >
                   
                    <g >
                        <path class="st0" d="M650,210H500c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10s10,4.5,10,10v140h140c5.5,0,10,4.5,10,10
                            S655.5,210,650,210z"/>
                        <path class="st0" d="M650,309.7c-5.5,0-10-4.5-10-10v-95.5L495.9,60H200c-22.1,0-40,17.9-40,40v196.3c0,5.5-4.5,10-10,10
                            s-10-4.5-10-10V100c0-33.1,26.9-60,60-60h300c2.7,0,5.2,1,7.1,2.9l150,150c1.9,1.9,2.9,4.4,2.9,7.1v99.7
                            C660,305.2,655.5,309.7,650,309.7z"/>
                        <path class="st0" d="M600,760H200c-33.1,0-60-26.9-60-60V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150c0,22.1,17.9,40,40,40h400
                            c22.1,0,40-17.9,40-40V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150C660,733.1,633.1,760,600,760z"/>
                        <path class="st0" d="M550,560H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h300c5.5,0,10,4.5,10,10S555.5,560,550,560z"/>
                        <path class="st0" d="M400,660H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h150c5.5,0,10,4.5,10,10S405.5,660,400,660z"/>
                        <path class="st0" d="M650,560H150c-33.1,0-60-26.9-60-60l0,0V346.3c0-33.1,26.9-60,60-60l0,0h0.4l500,3.3
                            c32.9,0.3,59.5,27.1,59.6,60V500C710,533.1,683.2,560,650,560C650,560,650,560,650,560z M150,306.3c-22.1,0-40,17.9-40,40V500
                            c0,22.1,17.9,40,40,40h500c22.1,0,40-17.9,40-40V349.7c-0.1-22-17.8-39.8-39.8-40l-500-3.3H150z"/>
                        <text transform="matrix(1 0 0 1 233.3494 471.9725)" class="st1 st2" style="text-transform: uppercase; font-size: 149px;">{{newMeta[contract.i][index * 4 + 2]}}</text>
                    </g>
                </svg>
            </div>
            <div class="card-body">
                <span class="text-break small text-muted">{{fancyBytes(size)}}</span><br>
                <button v-if="flagDecode(newMeta[contract.i][index * 4 + 4]).enc && !decoded" type="button" class="text-break small text-muted" @click="decode(contract.i)">Decrypt</button>
                <button v-if="flagDecode(newMeta[contract.i][index * 4 + 4]).enc && decoded" type="button" class="text-break small text-muted" @click="download(contract.i, file)">Download</button>
                
                <button v-if="flagDecode(newMeta[contract.i][index * 4 + 4]).enc" type="button" class="d-none text-break small text-muted" @click="download(file)">Download</button>
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
    contracts: {
        type: Object,
        default: function () {
            return [{
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

            }];
        }
    },
},
data() {
    return {
        files: {},
        filesArray: [],
        contract: {},
        newMeta: {},
        decoded: false,

    };
},
emits: [ "addassets" ],
methods: {
    addAsset(id, contract) {
        this.$emit("addassets", { id, contract: contract.i });
    },
    AESDecrypt(encryptedMessage, key) {
        const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    },
    download(fileInfo, data = false, MIME_TYPE = "image/png") {
        if(data){
            var blob = new Blob([data], {type: MIME_TYPE});
            window.location.href = window.URL.createObjectURL(blob);
        } else {
            fetch(`https://ipfs.dlux.io/ipfs/${fileInfo}`)
            .then((response) => response.blob())
            .then((blob) => {
                var url = window.URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = fileInfo;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            });
        }
    },
    smartIcon(flags){
        if(!flags[0])return 'fa-solid fa-file'
        const flag = this.flagDecode(flags[0])
        if (flag.enc) return 'fa-solid fa-file-shield'
        else if (flag.nsfw)return 'fa-solid fa-triangle-exclamation'
        else if (flag.executable)return 'fa-solid fa-cog'
        else return 'fa-solid fa-file'
    },
    smartColor(flags){
        if(!flags[0])return 'bg-info'
        const flag = this.flagDecode(flags[0])
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
    flagDecode(flags) {
        var num = this.Base64toNumber(flags[0])
        var out = {}
        if(num & 1)out.enc = true
        if(num & 2)out.autoRenew = true
        if(num & 4)out.nsfw = true
        if(num & 8)out.executable = true
        return out
    },
    Base64toNumber(chars = "0") {
        if(typeof chars != 'string'){
            console.log({chars})
            return 0
        }
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
    for (const contract of this.contracts) {
        const id = this.contracts[contract].i
        this.contract[contract.i] = this.contracts[contract];
        for (const file of this.contracts[contract].df) {
            this.filesArray.push(this.contracts[contract][file]);
        }
        if (!this.contract[id].m) {
            this.contract[id].m = ""
            const filesNum = this.contract?.df ? Object.keys(this.contract[id].df).length : 0
            this.newMeta[this.id] = new Array(filesNum * 4 + 1).fill('')
        } else {
            this.newMeta[this.id] = this.contract[id].m.split(",")
        }
    }
    this.files = this.contract.df;
},
};