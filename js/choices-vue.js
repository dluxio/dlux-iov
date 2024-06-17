export default {
  name: "Choices",
  template: `<select multiple id="select-tag" :ref="reference"></select>`,
  emits: ["data"],
  props: {
    reference: {
      type: String,
      default: "default"
    },
    prop_type: {
      type: String,
      default: "tags"
    },
    opts: {
      type: Object,
      default: () => {
        return {
          silent: false,
          items: [],
          renderChoiceLimit: -1,
          maxItemCount: -1,
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
          // callbackOnCreateTemplates: function (template) {
          //   console.log(template)
          // }
        }
      }
    },
  },
  data() {
    return {
      msg: "",
      Choices: null,
      tags: [{
        value: 'encrypted',
        label: 'Encrypted',
        selected: false,
        disabled: false,
      },
      {
        value: 'autorenew',
        label: 'Auto-Renew',
        selected: false,
        disabled: false,
      },
      {
        value: 'nsfw',
        label: 'NSFW',
        selected: false,
        disabled: false,
        customProperties: {
          description: 'Not Safe For Work',
          random: 'Another random custom property'
        },
      }],
      labels: [{
          value: 'red',
          label: 'Red',
          selected: false,
          disabled: false,
        },
        {
          value: 'orange',
          label: 'Orange',
          selected: false,
          disabled: false,
        },
        {
          value: 'yellow',
          label: 'Yellow',
          selected: false,
          disabled: false,
        },
        {
          value: 'green',
          label: 'Green',
          selected: false,
          disabled: false,
        },
        {
          value: 'blue',
          label: 'Blue',
          selected: false,
          disabled: false,
        },
        {
          value: 'purple',
          label: 'Purple',
          selected: false,
          disabled: false,
        },
        {
          value: 'grey',
          label: 'Grey',
          selected: false,
          disabled: false,
        },
        {
          value: 'work',
          label: 'Work',
          selected: false,
          disabled: false,
        },
        {
          value: 'personal',
          label: 'Personal',
          selected: false,
          disabled: false,
        },
        {
          value: 'family',
          label: 'Family',
          selected: false,
          disabled: false,
        },
        {
          value: 'friends',
          label: 'Friends',
          selected: false,
          disabled: false,
        },
        {
          value: 'projects',
          label: 'Projects',
          selected: false,
          disabled: false,
        },
        {
          value: 'finance',
          label: 'Finance',
          selected: false,
          disabled: false,
        },
        {
          value: 'health',
          label: 'Health',
          selected: false,
          disabled: false,
        },
        {
          value: 'education',
          label: 'Education',
          selected: false,
          disabled: false,
        },
        {
          value: 'travel',
          label: 'Travel',
          selected: false,
          disabled: false,
        },
        {
          value: 'events',
          label: 'Events',
          selected: false,
          disabled: false,
        }],
    }
  },
  methods: {
    passData(d){
      this.$emit("data", template)
    },
    setUp() {
      var opts = this.opts
      opts.choices = this[this.prop_type]
      if (!Choices) this.msg = 'Choices not loaded'
      else if (this.reference == '') this.msg = 'Ref not set'
      else {
        this.Choices = new Choices(this.$refs[this.reference], opts)
      }
    },
  },
  watch: {
    'Choices': {
      handler: function (o,n) {
        console.log(o,n)
      },
      deep: true
    },
  },
  mounted() {
    this.setUp()
  }
}