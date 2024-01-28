export default {
    template: `
<div>
    <div v-if="!hasFiles" class="p-3 text-center">
        <p class="m-0 text-center">Cancel this contract?</p>
        <button type="button" class="btn btn-sm btn-danger mt-1"
                    @click="cancel_contract(contract)">
                    <i class="fa-solid fa-file-circle-xmark fa-fw me-1"></i>Sever</button>
    </div>
    <div v-if="hasFiles">
       
            <div>
                <div class="card-group">
                    <div v-for="(size, file) in files" class="card rounded p-0 m-2" style="max-width: 300px;">
                        <a :href="'https://ipfs.dlux.io/ipfs/' + file" target="_blank" class="no-decoration" >
                            <img :src="'https://ipfs.dlux.io/ipfs/' + file" onerror="this.style.display='none'"
                                class="card-img-top rounded-top" :alt="file">
                                <div class="card-body">
                                    <span class="text-break small text-muted">{{file}}</span>
                                </div>
                            </a>
                       
                        <div class="card-footer text-center border-0" v-if="assets">
                            <button type="button" class="btn btn-primary" @click="addAsset(file, contract)"><i class="fa-solid fa-square-plus me-2"></i>Add</button>
                        </div>
                    </div>
                </div>
            </div>
        
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