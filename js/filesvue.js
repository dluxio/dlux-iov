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
        <div class="card-footer text-center border-0" v-if="assets">
            <button type="button" class="btn btn-primary" @click="addAsset(file, contract)"><i
                class="fa-solid fa-square-plus me-2"></i>Add</button>
        </div>
    </div>

   `,
props: {
    files: {
        type: Object,
        default: {},
    },
    assets: {
        type: Boolean,
        default: false,
    },
    contract: {
        type: String,
        default: "",
    },
},
data() {
    return {

    };
},
emits: [ "addassets" ],
methods: {
    addAsset(id, contract) {
        this.$emit("addassets", { id, contract });
    },
},
computed: {
    hasFiles() {
        return Object.keys(this.files).length > 0;
    }
},
mounted() {

},
};