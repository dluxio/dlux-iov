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
          description: 'Not Safe For Work'
        },
      }, {
        value: 'exe',
        label: 'Executable',
        selected: false,
        disabled: false,
        customProperties: {
          description: 'Is an executable file'
        },
      }
      ],
      labels: [{
        value: 0,
        label: 'Important',
        selected: false,
        disabled: false,
      },{
        value: 1,
        label: 'Red',
        selected: false,
        disabled: false,
      },
      {
        value: 2,
        label: 'Orange',
        selected: false,
        disabled: false,
      },
      {
        value: 3,
        label: 'Yellow',
        selected: false,
        disabled: false,
      },
      {
        value: 4,
        label: 'Green',
        selected: false,
        disabled: false,
      },
      {
        value: 5,
        label: 'Blue',
        selected: false,
        disabled: false,
      },
      {
        value: 6,
        label: 'Purple',
        selected: false,
        disabled: false,
      },
      {
        value: 7,
        label: 'Grey',
        selected: false,
        disabled: false,
      },
      {
        value: 8,
        label: 'Work',
        selected: false,
        disabled: false,
      },
      {
        value: 9,
        label: 'Personal',
        selected: false,
        disabled: false,
      },
      {
        value: 10,
        label: 'Family',
        selected: false,
        disabled: false,
      },
      {
        value: 11,
        label: 'Friends',
        selected: false,
        disabled: false,
      },
      {
        value: 12,
        label: 'Projects',
        selected: false,
        disabled: false,
      },
      {
        value: 13,
        label: 'Finance',
        selected: false,
        disabled: false,
      },
      {
        value: 14,
        label: 'Health',
        selected: false,
        disabled: false,
      },
      {
        value: 15,
        label: 'Education',
        selected: false,
        disabled: false,
      },
      {
        value: 16,
        label: 'Travel',
        selected: false,
        disabled: false,
      },
      {
        value: 17,
        label: 'Events',
        selected: false,
        disabled: false,
      },{
        value: 18,
        label: 'Photography',
        selected: false,
        disabled: false,
      },{
        value: 19,
        label: 'Gaming',
        selected: false,
        disabled: false,
      },{
        value: 20,
        label: 'Sports',
        selected: false,
        disabled: false,
      },{
        value: 21,
        label: 'Blogging',
        selected: false,
        disabled: false,
      },{
        value: 22,
        label: 'Journalism',
        selected: false,
        disabled: false,
      },{
        value: 21,
        label: 'Research',
        selected: false,
        disabled: false,
      },{
        value: 22,
        label: 'Meme',
        selected: false,
        disabled: false,
      },{
        value: 23,
        label: 'Music',
        selected: false,
        disabled: false,
      },{
        value: 24,
        label: 'Media',
        selected: false,
        disabled: false,
      },{
        value: 25,
        label: 'News',
        selected: false,
        disabled: false,
      },{
        value: 26,
        label: 'Archive',
        selected: false,
        disabled: false,
      },{
        value: 27,
        label: 'Fashion',
        selected: false,
        disabled: false,
      },{
        value: 28,
        label: 'Food',
        selected: false,
        disabled: false,
      },{
        value: 29,
        label: 'Cooking',
        selected: false,
        disabled: false,
      },{
        value: 30,
        label: 'DIY',
        selected: false,
        disabled: false,
      },{
        value: 31,
        label: 'Art',
        selected: false,
        disabled: false,
      },{
        value: 32,
        label: 'Design',
        selected: false,
        disabled: false,
      },{
        value: 33,
        label: 'Technology',
        selected: false,
        disabled: false,
      },{
        value: 34,
        label: 'Religion',
        selected: false,
        disabled: false,
      },{
        value: 35,
        label: 'Government',
        selected: false,
        disabled: false,
      },{
        value: 36,
        label: 'Politics',
        selected: false,
        disabled: false,
      },{
        value: 37,
        label: 'Science',
        selected: false,
        disabled: false,
      },
      // {
      //   value: 38,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 39,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 40,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 41,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 42,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 43,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 44,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 45,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 46,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 47,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 48,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 49,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 50,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 51,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 52,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 53,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 54,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 55,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 56,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 57,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 58,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 59,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 60,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 61,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 62,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // },{
      //   value: 63,
      //   label: '',
      //   selected: false,
      //   disabled: false,
      // }
    ],
    }
  },
  methods: {
    passData(d) {
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
      handler: function (o, n) {
        console.log(o, n)
      },
      deep: true
    },
  },
  mounted() {
    this.setUp()
  }
}