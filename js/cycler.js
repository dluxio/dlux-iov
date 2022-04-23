export default {
  data() {
    return {
      text: "",
      index: 0,
    };
  },
  template: `
  <div>{{text}}</div>
        `,
  props: ["items", "interval"],
  watch: {
    // items(newVal, oldVal) {
    //   this.text = this.items[this.index];
    //   this.cycle();
    // },
  },
  mounted() {
      this.text = this.items[this.index];
      this.cycle();
  },
  methods: {
    cycle() {
      this.index = (this.index + 1) % this.items.length;
      this.text = this.items[this.index];
      setTimeout(
        function () {
          this.cycle();
        }.bind(this),
        this.interval
      );
    },
  },
};
