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
          editItems: false,
          allowHTML: true,
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
            return a.value - b.value;
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
        label: '<i class="fa-solid fa-exclamation fa-fw me-1"></i>Important',
        selected: false,
        disabled: false,
      }, {
        value: 1,
        label: '<i class="fa-solid fa-star fa-fw me-1"></i>Favorite',
        selected: false,
        disabled: false,
      }, {
        value: 2,
        label: '<i class="fa-solid fa-dice fa-fw me-1"></i>Random',
        selected: false,
        disabled: false,
      }, {
        value: 3,
        label: '<i class="fa-solid fa-circle fa-fw me-1 text-red"></i>Red',
        selected: false,
        disabled: false,
      }, {
        value: 4,
        label: '<i class="fa-solid fa-circle fa-fw me-1 text-orange"></i>Orange',
        selected: false,
        disabled: false,
      }, {
        value: 5,
        label: '<i class="fa-solid fa-circle fa-fw me-1 text-yellow"></i>Yellow',
        selected: false,
        disabled: false,
      }, {
        value: 6,
        label: '<i class="fa-solid fa-circle fa-fw me-1 text-green"></i>Green',
        selected: false,
        disabled: false,
      }, {
        value: 7,
        label: '<i class="fa-solid fa-circle fa-fw me-1 text-blue"></i>Blue',
        selected: false,
        disabled: false,
      }, {
        value: 8,
        label: '<i class="fa-solid fa-circle fa-fw me-1 text-purple"></i>Purple',
        selected: false,
        disabled: false,
      }, {
        value: 9,
        label: '<i class="fa-solid fa-circle fa-fw me-1 text-grey"></i>Grey',
        selected: false,
        disabled: false,
      }, {
        value: 10,
        label: '<i class="fa-solid fa-briefcase fa-fw me-1"></i>Work',
        selected: false,
        disabled: false,
      }, {
        value: 11,
        label: '<i class="fa-solid fa-heart fa-fw me-1"></i>Personal',
        selected: false,
        disabled: false,
      }, {
        value: 12,
        label: '<i class="fa-solid fa-people-roof fa-fw me-1"></i>Family',
        selected: false,
        disabled: false,
      }, {
        value: 13,
        label: '<i class="fa-solid fa-people-group fa-fw me-1"></i>Friends',
        selected: false,
        disabled: false,
      }, {
        value: 14,
        label: '<i class="fa-solid fa-rocket fa-fw me-1"></i>Projects',
        selected: false,
        disabled: false,
      }, {
        value: 15,
        label: '<i class="fa-solid fa-piggy-bank fa-fw me-1"></i>Finance',
        selected: false,
        disabled: false,
      }, {
        value: 16,
        label: '<i class="fa-solid fa-kit-medical fa-fw me-1"></i>Health',
        selected: false,
        disabled: false,
      }, {
        value: 17,
        label: '<i class="fa-solid fa-graduation-cap fa-fw me-1"></i>Education',
        selected: false,
        disabled: false,
      }, {
        value: 18,
        label: '<i class="fa-solid fa-compass fa-fw me-1"></i>Travel',
        selected: false,
        disabled: false,
      }, {
        value: 19,
        label: '<i class="fa-regular fa-calendar-days fa-fw me-1"></i>Events',
        selected: false,
        disabled: false,
      }, {
        value: 20,
        label: '<i class="fa-solid fa-camera fa-fw me-1"></i>Photography',
        selected: false,
        disabled: false,
      }, {
        value: 21,
        label: '<i class="fa-solid fa-gamepad fa-fw me-1"></i>Gaming',
        selected: false,
        disabled: false,
      }, {
        value: 22,
        label: '<i class="fa-solid fa-volleyball fa-fw me-1"></i>Sports',
        selected: false,
        disabled: false,
      }, {
        value: 23,
        label: '<i class="fa-solid fa-feather fa-fw me-1"></i>Blogging',
        selected: false,
        disabled: false,
      }, {
        value: 24,
        label: '<i class="fa-solid fa-crown fa-fw me-1"></i>Meme',
        selected: false,
        disabled: false,
      }, {
        value: 25,
        label: '<i class="fa-solid fa-music fa-fw me-1"></i>Music',
        selected: false,
        disabled: false,
      }, {
        value: 26,
        label: '<i class="fa-solid fa-video fa-fw me-1"></i>Video',
        selected: false,
        disabled: false,
      }, {
        value: 27,
        label: '<i class="fa-solid fa-microphone fa-fw me-1"></i>Audio',
        selected: false,
        disabled: false,
      }, {
        value: 28,
        label: '<i class="fa-solid fa-newspaper fa-fw me-1"></i>News',
        selected: false,
        disabled: false,
      }, {
        value: 29,
        label: '<i class="fa-solid fa-code fa-fw me-1"></i>Development',
        selected: false,
        disabled: false,
      }, {
        value: 30,
        label: '<i class="fa-solid fa-hat-cowboy fa-fw me-1"></i>Fashion',
        selected: false,
        disabled: false,
      }, {
        value: 31,
        label: '<i class="fa-solid fa-burger fa-fw me-1"></i>Food',
        selected: false,
        disabled: false,
      }, {
        value: 32,
        label: '<i class="fa-solid fa-utensils fa-fw me-1"></i>Cooking',
        selected: false,
        disabled: false,
      }, {
        value: 33,
        label: '<i class="fa-solid fa-toolbox fa-fw me-1"></i>DIY',
        selected: false,
        disabled: false,
      }, {
        value: 34,
        label: '<i class="fa-solid fa-paintbrush fa-fw me-1"></i>Art',
        selected: false,
        disabled: false,
      }, {
        value: 35,
        label: '<i class="fa-solid fa-swatchbook fa-fw me-1"></i>Design',
        selected: false,
        disabled: false,
      }, {
        value: 36,
        label: '<i class="fa-solid fa-microchip fa-fw me-1"></i>Technology',
        selected: false,
        disabled: false,
      }, {
        value: 37,
        label: '<i class="fa-solid fa-cross fa-fw me-1"></i>Religion',
        selected: false,
        disabled: false,
      }, {
        value: 38,
        label: '<i class="fa-solid fa-scale-balanced fa-fw me-1"></i>Government',
        selected: false,
        disabled: false,
      }, {
        value: 39,
        label: '<i class="fa-solid fa-landmark-dome fa-fw me-1"></i>Politics',
        selected: false,
        disabled: false,
      }, {
        value: 40,
        label: '<i class="fa-solid fa-vial fa-fw me-1"></i>Science',
        selected: false,
        disabled: false,
      }, {
        value: 41,
        label: '<i class="fa-solid fa-magnifying-glass fa-fw me-1"></i>Research',
        selected: false,
        disabled: false,
      }, {
        value: 42,
        label: '<i class="fa-solid fa-receipt fa-fw me-1"></i>Receipts',
        selected: false,
        disabled: false,
      }, {
        value: 43,
        label: '<i class="fa-solid fa-envelope-open-text fa-fw me-1"></i>Correspondence',
        selected: false,
        disabled: false,
      }, {
        value: 44,
        label: '<i class="fa-solid fa-copy fa-fw me-1"></i>Templates',
        selected: false,
        disabled: false,
      }, {
        value: 45,
        label: '<i class="fa-solid fa-file-lines fa-fw me-1"></i>Resources',
        selected: false,
        disabled: false,
      }, {
        value: 46,
        label: '<i class="fa-solid fa-book-bookmark fa-fw me-1"></i>Reference',
        selected: false,
        disabled: false,
      }, {
        value: 47,
        label: '<i class="fa-solid fa-floppy-disk fa-fw me-1"></i>Backups',
        selected: false,
        disabled: false,
      }, {
        value: 48,
        label: '<i class="fa-solid fa-box-archive fa-fw me-1"></i>Archive',
        selected: false,
        disabled: false,
      }, {
        value: 49,
        label: '<i class="fa-solid fa-compass-drafting fa-fw me-1"></i>Drafts',
        selected: false,
        disabled: false,
      }, {
        value: 50,
        label: '<i class="fa-solid fa-flag-checkered fa-fw me-1"></i>Finished',
        selected: false,
        disabled: false,
      }, {
        value: 51,
        label: '<i class="fa-solid fa-paper-plane fa-fw me-1"></i>Sent',
        selected: false,
        disabled: false,
      }, {
        value: 52,
        label: '<i class="fa-solid fa-clock fa-fw me-1"></i>Pending',
        selected: false,
        disabled: false,
      }, {
        value: 53,
        label: '<i class="fa-solid fa-thumbs-up fa-fw me-1"></i>Approved',
        selected: false,
        disabled: false,
      }, {
        value: 54,
        label: '<i class="fa-solid fa-thumbs-down fa-fw me-1"></i>Rejected',
        selected: false,
        disabled: false,
      }, {
        value: 55,
        label: '<i class="fa-solid fa-lightbulb fa-fw me-1"></i>Ideas',
        selected: false,
        disabled: false,
      }, {
        value: 56,
        label: '<i class="fa-solid fa-bullseye fa-fw me-1"></i>Goals',
        selected: false,
        disabled: false,
      }, {
        value: 57,
        label: '<i class="fa-solid fa-list-check fa-fw me-1"></i>Tasks',
        selected: false,
        disabled: false,
      }, {
        value: 58,
        label: '<i class="fa-solid fa-gavel fa-fw me-1"></i>Legal',
        selected: false,
        disabled: false,
      }, {
        value: 59,
        label: '<i class="fa-solid fa-handshake fa-fw me-1"></i>Networking',
        selected: false,
        disabled: false,
      }, {
        value: 60,
        label: '<i class="fa-solid fa-comments fa-fw me-1"></i>Feedback',
        selected: false,
        disabled: false,
      }, {
        value: 61,
        label: '<i class="fa-solid fa-square-poll-vertical fa-fw me-1"></i>Surveys',
        selected: false,
        disabled: false,
      }, {
        value: 62,
        label: '<i class="fa-solid fa-user-secret fa-fw me-1"></i>Classified',
        selected: false,
        disabled: false,
      }, {
        value: 63,
        label: '<i class="fa-solid fa-sink fa-fw me-1"></i>Miscellaneous',
        selected: false,
        disabled: false,
      }
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