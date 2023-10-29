export default {
    template: `
    <!-- post builder -->
    <div class="accordion-body">
    <form onsubmit="return false;">
        <div class="form-group mb-3">
            <label for="username">Author</label>
            <div class="input-group">
                <span
                    class="input-group-text">@</span>
                <input type="text"
                    class="form-control text-info"
                    readonly id="username" v-model="account">
            </div>
        </div>
        <div class="form-group mb-3">
            <label for="title">Title</label>
            <input type="text"
                class="form-control" id="title"
                placeholder="Enter an attention grabbing title" v-model="postTitle"
                @blur="permlink()">
            <small id="permlinkPreview" class="form-text text-muted d-flex"><span
                    id="permlink" class="mr-auto">Permlink:
                    https://dlux.io/dlux/@{{account}}/{{postPermlink}}</span>
                <!-- <a href="#" class="ml-auto"> Edit Permlink</a> -->
            </small>
        </div>
        <div class="form-group mb-3">
            <label for="body">Post Body</label>
            <mde id="body" @data="postBody = $event" />
        </div>
        <div class="form-group mb-3">
            <label for="tags">Tags</label><br>
            <tagify class="rounded w-100"
                @data="postTags = $event" id="tags" />
        </div>
        <ul v-if="postBens.length">
            <h6>Benificiaries: ({{postBens.length}}/8) </h6>

            <li v-for="ben in postBens">@{{ben.account}}: {{formatNumber(ben.weight
                / 100,
                2, '.')}}% <button type="button" class="btn btn-outline-danger btn-sm"
                    @click="delBen(ben.account)">Remove</button></li>
        </ul>
        <button class="btn btn-outline-primary" v-if="!isntDlux" type="button"
            @click="addBen('dlux-io', 1000)">Include in
            DLUX Ecosystem</button>
        <button v-for="item in isntBenned" type="button"
            @click="addBen(item.account, item.weight)">Include Contract
            {{item.contract}}</button>
        <div class="text-center">
            <button ref="publishButton" type="button" @keyUp="buildTags()"
                class="btn btn-danger" data-toggle="tooltip" data-placement="top"
                title="Publish Gallery to HIVE" :disable="!validPost"
                @click="post([['vrHash', 'QmNby3SMAAa9hBVHvdkKvvTqs7ssK4nYa2jBdZkxqmRc16']])">Publish</button>
        </div>
    </form>
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