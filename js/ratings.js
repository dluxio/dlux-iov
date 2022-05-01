export default {
  data() {
    return {};
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
    <div v-show="!stars" class="text-white-50">
    <i class="fas fa-ghost"></i>
    <i class="fas fa-ghost"></i>
    <i class="fas fa-ghost"></i>
    <i class="fas fa-ghost"></i>
    <i class="fas fa-ghost"></i>
    </div>
    <p>{{ratings}} Reviews</p>
  </div>`,
  props: ["stars", "ratings"],
  methods: {},
  computed: {},
};
