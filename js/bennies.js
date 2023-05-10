export default {
    template: `
    <div>
        <p>Current Beneficiaries: ({{bennies?.length}}/8){{total/100}}%</p>
        <div class="table-responsive">
        <table class="table align-middle">
            <thead>
                <tr>
                    <th class="w-50">Username</th>
                    <th class="text-center">Reward</th>
                    <th></th>
                </tr>
            </thead>
            <tbody class="table-group-divider">
                <tr>
                    <td class="w-50">@username</td>
                    <td class="text-center">
                        <span class="pe-05"><button class="btn btn-sm btn-secondary">-</button></span>
                        <span>10%</span>
                        <span class="ps-05"><button class="btn btn-sm btn-secondary">+</button></span>
                    </td>
                    <td class="text-end"><button class="btn btn-danger"><i class="fa-solid fa-trash-can fa-fw"></i></button></td>
                </tr>
                <tr>
                    <td class="w-50">
                        <div class="input-group">
                            <span class="input-group-text">@</span>
                            <input type="search" placeholder="username" class="form-control">
                        </div>
                    </td>
                    <td class="text-center">
                        <div class="input-group">
                            <input type="number" step="1"  placeholder="amount" class="form-control">
                            <span class="input-group-text">%</span>
                        </div>
                    </td>
                    <td class="text-end"><button class="btn btn-success" disabled><i class="fa-solid fa-square-plus fa-fw"></i></button></td>
            </tbody>
        </table>
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