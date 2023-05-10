export default {
    template: `
    <div>
        <slot v-if="hide"/>
        <div class="modal">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Modal title</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
          <span aria-hidden="true"></span>
        </button>
      </div>
      <div class="modal-body">
        <p>Modal body text goes here.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary">Save changes</button>
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>
        <div v-if="!hide">
            <p>Current Bennies: ({{bennies?.length}}/8){{total/100}}%</p>
            <button @click="cancel()">Cancel</button>
        </div>
    </div>
    `,
    data() {
        return {
            total: 0,
            bennies: []
        }
    },
    props: {
        list: {
            type: Array,
            required: true,
            default: function () {
                return []
            }
        },
        hide: {
            type: Boolean,
            default: true
        } 
    },
    emits: ['updateBennies', 'updateHide'],
    methods:{
        checkHive(account, amount){
            fetch('https://api.hive.blog', {
                method: 'POST',
                body: JSON.stringify({  
                    "jsonrpc": "2.0",
                    "method": "condenser_api.get_accounts",
                    "params": [[account]],
                    "id": 1
                })
            }).then(response => response.json())
            .then(data => {
                if(data.result[0].id){
                    this.total += amount;
                    this.bennies.push({account, weight: amount});
                }
            })
        },
        addBenny(account, amount){
            this.checkHive(account, amount);
        },
        subBenny(account){
            this.bennies = this.bennies.filter(benny => benny.account != account);
        },
        updateBenny(account, amount){
            for (let index = 0; index < this.bennies.length; index++) {
                if(this.bennies[index].account == account){
                    this.bennies[index].weight = amount;
                }
            }
        },
        finalize(){
            this.$emit('updateBennies', this.bennies);
            this.$emit('updateHide', true);
        },
        cancel(){
            this.$emit('updateHide', true);
        }
    },
    mounted() {
        this.list.forEach(benny => {
            this.checkHive(benny.account, benny.weight)
        });
    },
};