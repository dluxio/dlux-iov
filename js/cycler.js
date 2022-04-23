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
  },
  mounted() {
      this.text = this.items[this.index];
      for(var i = 0; i < this.items.length; i++) {
          if(!parseInt(this.items[i])){
              this.items.splice(i, 1);
              i--
          }
      }
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
