export default {
  data() {
    return {
      text: "",
      index: 0,
      interval: 1500,
    };
  },
  template: `
  <div>{{text}}</div>
        `,
  props: ["items", "interval"],
  watch: {
    items(newVal, oldVal) {
      this.text = this.items[this.index];
      setInterval(function() {
        this.index = (this.index + 1) % this.items.length;
        this.text = this.items[this.index];
      }.bind(this), this.interval);
    },
  },
  mounted() {
  },
  methods: {
  },
};
