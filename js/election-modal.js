import MCommon from '/js/methods-common.js'
import MModals from '/js/methods-modals.js'

export default {
  name: 'Election',
  props: {
    account: String,
    func: { type: String, default: 'send' },
    token: { type: String, default: 'balance' },
    tokenprotocol: {
      type: Object,
      default: () => ({
        precision: 3,
        token: 'spk',
        features: [],
        prefix: "spk"
      })
    },
    tokenuser: Object,
    test: { type: Boolean, default: false },
    func: String,
    smarkets: Object,
  },
  template: `
    <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
    <div class="modal-content pt-2">
   
    <div class="row m-0">
      <!-- Available Validators -->
      <div class="col-lg-6">
        <div class="mb-2 text-center border-bottom border-light border-2">
          <h5 class="mb-1">Available Validators</h5>
        </div>
        <div v-for="(node, key) in smarkets" :key="key">
          <div v-if="isVal(node) && !isSelected(node.self)">
            <div class="d-flex justify-content-between align-items-center border border-light rounded ps-2 pe-1 py-1 my-1">
              <span>{{ node.self }}</span>
              <div>
                <button
                  class="btn btn-sm btn-outline-secondary invisible"
                  type="button"
                >
                  <i class="fas fa-plus"></i>
                </button>
                <button
                  :disabled="d.valWorkable.length >= 30 || isSelected(node.self)"
                  class="btn btn-sm btn-outline-info"
                  type="button"
                  @click="add(node)"
                >
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Selected Validators -->
      <div class="col-lg-6">
       <div class="mb-2 text-center border-bottom border-light border-2">
          <h5 class="m-0">Nodes Selected ({{d.valWorkable.length}}/30)</h5>
        </div>
          <div
            v-for="(node, index) in d.valWorkable"
            :key="node.self"
            class=" d-flex justify-content-between align-items-center border border-light rounded ps-2 pe-1 py-1 my-1 draggable"
            draggable="true"
            @dragstart="pick($event, index)"
            @drop="move($event, index)"
            @dragover.prevent
            @dragenter.prevent
          >
            <span>{{ node.self }}</span>
            <span>{{sigFig(((30-index)/30) * 100, 2)}}%</span>
            <button
              class="btn btn-sm btn-outline-danger"
              type="button"
              @click="sub(node)"
            >
              <i class="fas fa-minus"></i>
            </button>
          </div>
        <div v-if="!d.valWorkable.length" class="m-3">
          <div class="lead text-center">No validators selected</div>
          <p class="text-center">Add validators from the available list, then drag to rearrange the vote weight.</p>
        </div>
      </div>
       <div class="lead text-center my-2">Nodes Selected ({{d.valWorkable.length}}/30)</div>
      <div class="text-center my-2">
       <button
          :class="{ 'disabled': !difVote }"
          class="btn btn-success"
          type="button"
          @click="valVote()"
        >
          Save
        </button>
        </div>
      </div>
    </div>
    </div>
    `,
  data() {
    return {
      d: {
        valWorkable: [],
      }
    };
  },
  computed: {
    valCodeDict() {
      const dict = {};
      for (const nodeKey in this.smarkets) {
        const node = this.smarkets[nodeKey];
        if (node?.val_code) {
          dict[node.val_code] = node;
        }
      }
      return dict;
    },
    voteString() {
      return this.d.valWorkable.map(node => node.val_code).join('');
    },
    difVote() {
      if (!this.tokenuser.spk_vote || typeof this.tokenuser.spk_vote !== 'string' || !this.tokenuser.spk_vote.includes(',')) {
        return this.d.valWorkable.length > 0;
      }
      const currentVote = this.tokenuser.spk_vote.split(',')[1] || '';
      return currentVote !== this.voteString;
    }
  },
  watch: {
    tokenuser: {
      handler(newVal) {
        this.d.valWorkable = [];
        if (typeof newVal.spk_vote === 'string' && newVal.spk_vote.includes(',')) {
          const voteString = newVal.spk_vote.split(',')[1];
          for (let i = 0; i < voteString.length; i += 2) {
            const code = voteString.substr(i, 2);
            const node = this.valCodeDict[code];
            if (node) {
              this.d.valWorkable.push(node);
            }
          }
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    ...MCommon,
    ...MModals,
    isVal(node) {
      return typeof node.val_code === 'string' && node.self;
    },
    isSelected(nodeSelf) {
      return this.d.valWorkable.some(node => node.self === nodeSelf);
    },
    add(node) {
      if (!this.isSelected(node.self) && this.d.valWorkable.length < 30) {
        this.d.valWorkable.push(node);
      }
    },
    sub(node) {
      const index = this.d.valWorkable.findIndex(v => v.self === node.self);
      if (index !== -1) {
        this.d.valWorkable.splice(index, 1);
      }
    },
    pick(evt, index) {
      evt.dataTransfer.dropEffect = 'move';
      evt.dataTransfer.effectAllowed = 'move';
      evt.dataTransfer.setData('itemID', index);
    },
    move(evt, index) {
      const fromIndex = evt.dataTransfer.getData('itemID');
      const [movedNode] = this.d.valWorkable.splice(fromIndex, 1);
      this.d.valWorkable.splice(index, 0, movedNode);
    },
    valVote() {
      var op;
      if (this.difVote) {
        op = {
          type: "cja",
          cj: {
            votes: this.voteString,
          },
          id: `${this.tokenprotocol.prefix}val_vote`,
          msg: `Voting for Validators...`,
          ops: ["getSapi"],
          api: "https://spkinstant.hivehoneycomb.com",
          txid: "val_vote",
        };
      }
      if (op) {
        this.$emit("modalsign", op);
      }
    },
  },
  mounted() {
    try {
      this.d.valWorkable = []
      const voteString = this.tokenuser?.spk_vote.split(',')[1];
      for (let i = 0; i < voteString.length; i += 2) {
        const code = voteString.substr(i, 2);
        const node = this.valCodeDict[code];
        if (node) {
          this.d.valWorkable.push(node);
        }
      }
    } catch (e) { }
  }
};