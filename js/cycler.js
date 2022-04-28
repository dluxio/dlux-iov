export default {
  data() {
    return {
      text: "",
      index: 0,
    };
  },
  template: `<div>
  <transition name="fade" mode="out-in" appear>
  <p v-show="text" transition="fade">{{ text }}</p>
  </transition>
  </div>`,
  props: ["items", "interval"],
  watch: {},
  mounted() {
    this.text = this.items[this.index];
    this.cycle();
    var css_text = `
    .fade-leave-active {
  transition: opacity .4s ease-in;
}
.fade-enter-active {
  transition: opacity .4s;
}
.fade-enter, .fade-leave-to {
  opacity: 0.0;
}
.fade-leave, .fade-enter-to {
  opacity: 1.0;
}
`;
    var css = document.createElement("style");
    css.type = "text/css";
    css.setAttributeNode(document.createAttribute("scopped"));
    css.appendChild(document.createTextNode(css_text));
    this.$el.appendChild(css);
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
