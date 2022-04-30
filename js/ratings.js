export default {
  data() {
    return {
      stars: 0,
      rating: 0,
    };
  },
  template: `
  <div>
    <div v-show="stars" class="text-warning">
    <i v-show="stars >= 0.9" class="fas fa-star"></i>
    <i v-show="stars >= 1.9" class="fas fa-star"></i>
    <i v-show="stars >= 2.9" class="fas fa-star"></i>
    <i v-show="stars >= 3.9" class="fas fa-star"></i>
    <i v-show="stars >= 4.9" class="fas fa-star"></i>
    <i v-show="stars % 1 >= 0.4 && stars % 1 < 0.9" class="fas fa-star-half-alt"></i>
    <i v-show="stars < 4.4" class="far fa-star"></i>
    <i v-show="stars < 3.4" class="far fa-star"></i>
    <i v-show="stars < 2.4" class="far fa-star"></i>
    <i v-show="stars < 1.4" class="far fa-star"></i>
    <i v-show="stars < 0.4" class="far fa-star"></i>
    </div>
  </div>`,
  props: ["children", "stars", "rating"],
  methods: {},
  computed: {},
};
