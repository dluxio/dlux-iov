export default {
    template: `
<div>
    <div v-if="!hasFiles" class="p-3">
        <p class="m-0 text-center">Looks like there's nothing here yet.</p>
    </div>
    <div v-if="hasFiles" style="background-color: #16191C;" class="p-2">
        <div class="bg-darkg rounded my-2 p-2">
            <div>
                <div class="d-flex flex-wrap">
                    <div v-for="(size, file) in files" class="d-flex flex-column p-2 rounded m-1"
                        style="background-color: #000000;">
                        <a :href="'https://ipfs.io/ipfs/' + file" target="_blank"><img
                                :src="'https://ipfs.io/ipfs/' + file" onerror="this.style.display='none'"
                                class="img-fluid" style="max-width: 300px;" :alt="file"></a>
                        
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
},
data() {
    return {

    };
},
emits: [],
methods: {
},
computed: {
    hasFiles() {
        return Object.keys(this.files).length > 0;
    }
},
mounted() {
},
};