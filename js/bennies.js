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
                <tr v-for="ben in bennies">
                    <td class="w-50">@{{ben.account}}</td>
                    <td class="text-center">
                        <span class="pe-05"><button class="btn btn-sm btn-secondary" @click="decBen(ben)">-</button></span>
                        <span>{{ben.weight/100}}%</span>
                        <span class="ps-05"><button class="btn btn-sm btn-secondary" @click="incBen(ben)">+</button></span>
                    </td>
                    <td class="text-end"><button class="btn btn-danger" @click="subBenny(ben.account)"><i class="fa-solid fa-trash-can fa-fw"></i></button></td>
                </tr>
                <tr v-if="bennies.length < 8 && total < 10000">
                    <td class="w-50">
                        <div class="input-group">
                            <span class="input-group-text">@</span>
                            <input type="text" placeholder="username" class="form-control" v-model="addAccount">
                        </div>
                    </td>
                    <td class="text-center">
                        <div class="input-group">
                            <input type="number" step="0.01" min="0.01" :max="100 - (total/100)" placeholder="amount" class="form-control" v-model="addWeight">
                            <span class="input-group-text">%</span>
                        </div>
                    </td>
                    <td class="text-end"><button class="btn btn-success" :disabled="!addAccount" @click="appendBen()"><i class="fa-solid fa-square-plus fa-fw"></i></button></td>
            </tbody>
        </table>
        </div>
    </div>
    `,
    data() {
        return {
            total: 0,
            addAccount: '',
            addWeight: "1.00",
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
        appendBen(){
            if(this.addAccount != '' && this.addWeight > 0){
                this.checkHive(this.addAccount, parseInt(this.addWeight * 100));
                this.addAccount = '';
                this.addWeight = "1.00";
            }
        },
        incBen(ben){
            if(this.total <= 9900 && ben.weight <= 9900){
                this.total += 100;
                ben.weight += 100;
                this.updateBenny(ben.account, ben.weight)
            }
        },
        decBen(ben){
            if(ben.weight >= 100){
                this.total -= 100;
                ben.weight -= 100;
                this.updateBenny(ben.account, ben.weight)
            }
        },
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