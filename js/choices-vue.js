export default {
  name: "Choices",
  template: `<select multiple id="select-tag" :ref="reference"></select>`,
  emits: ["data"],
  props: {
    reference: {
      type: String,
      default: "default"
    },
    opts: {
      type: Object,
      default: () => {
        return {
          silent: false,
          items: [],
          choices: [{
            value: 'encrypted',
            label: 'Encrypted',
            selected: false,
            disabled: false,
          },
          {
            value: 'nsfw',
            label: 'NSFW',
            selected: false,
            disabled: false,
            customProperties: {
              description: 'Custom description about Option 2',
              random: 'Another random custom property'
            },
          }],
          renderChoiceLimit: -1,
          maxItemCount: 2,
          addItems: true,
          addItemFilter: null,
          removeItems: true,
          removeItemButton: true,
          editItems: true,
          allowHTML: false,
          duplicateItemsAllowed: true,
          delimiter: ',',
          paste: true,
          searchEnabled: true,
          searchChoices: true,
          searchFloor: 1,
          searchResultLimit: 4,
          searchFields: ['label', 'value'],
          position: 'auto',
          resetScrollPosition: true,
          shouldSort: true,
          shouldSortItems: false,
          sorter: function (a, b) {
            return b.label.length - a.label.length;
          },
          placeholder: true,
          placeholderValue: null,
          searchPlaceholderValue: null,
          prependValue: null,
          appendValue: null,
          renderSelectedChoices: 'auto',
          loadingText: 'Loading...',
          noResultsText: 'No results found',
          noChoicesText: 'No choices to choose from',
          itemSelectText: 'Press to select',
          uniqueItemText: 'Only unique values can be added',
          customAddItemText: 'Only values matching specific conditions can be added',
          callbackOnCreateTemplates: function (template) {
            this.passData(template)
          }
        }
      }
    },
  },
  data() {
    return {
      msg: "",
      Choices: null,
    }
  },
  methods: {
    passData(d){
      this.$emit("data", template)
    },
    setUp() {

      if (!Choices) this.msg = 'Choices not loaded'
      else if (this.reference == '') this.msg = 'Ref not set'
      else {
        this.Choices = new Choices(this.$refs[this.reference], this.opts)
      }
    },
  },
  // watch: {
  //   'prop_value': {
  //     handler: function () {
  //     },
  //     deep: true
  //   },
  // },
  mounted() {
    this.setUp()
  }
}