export default {
    template: ``,
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
        }   
    },
    emits: ['updateBennies'],
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
        }
    },
    mounted() {
        this.list.forEach(benny => {
            this.checkHive(benny.account, benny.weight)
        });
    },
};