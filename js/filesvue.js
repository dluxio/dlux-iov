export default {
    template: `
<div v-for="(size, file) in files" class="card rounded p-0 my-2 mx-1" style="max-width:200px">
        <a :href="'https://ipfs.dlux.io/ipfs/' + file" target="_blank" class="no-decoration">
            <img :src="'https://ipfs.dlux.io/ipfs/' + file" onerror="this.style.display='none'"
            class="card-img-top rounded-top" :alt="file">
            <div class="card-body">
                <span class="text-break small text-muted">{{file}}</span>
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