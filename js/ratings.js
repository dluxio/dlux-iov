export default {
  data() {
    return {
      votes: 0,
    };
  },
  template: `
  <div>
    <div v-show="stars && !vote" class="text-warning">
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
    <div v-show="!stars && !vote" class="text-white">
    <i class="fas fa-ghost"></i>
    </div>
    <p v-show="!vote">{{ratings}} Reviews</p>
    <div v-show="vote" class="text-warning">
    <a @click="rating(1)">
    <i v-show="votes >= 1"class="fas fa-star"></i>
    <i v-show="votes < 1"class="far fa-star"></i>
    </a>
    <a @click="rating(2)">
    <i v-show="votes >= 2"class="fas fa-star"></i>
    <i v-show="votes < 2"class="far fa-star"></i>
    </a>
    <a @click="rating(3)">
    <i v-show="votes >= 3"class="fas fa-star"></i>
    <i v-show="votes < 3"class="far fa-star"></i>
    </a>
    <a @click="rating(4)">
    <i v-show="votes >= 4"class="fas fa-star"></i>
    <i v-show="votes < 4"class="far fa-star"></i>
    </a>
    <a @click="rating(5)">
    <i v-show="votes >= 5"class="fas fa-star"></i>
    <i v-show="votes < 5"class="far fa-star"></i>
    </a>
    </div>
  </div>`,
  props: ["stars", "ratings", "vote"],
  emits: ["rating"],
  methods: {
    rating(v) {
      this.votes = v;
      this.$emit("rating", this.votes);
    },
  },
  computed: {},
};
