import Marker from "/js/marker.js";
import Ratings from "/js/ratings.js";
import MDE from "/js/mde.js";

export default {
    name: "replies",
    components: {
        "vue-markdown": Marker,
        "vue-ratings": Ratings,
        "mde": MDE,
      },
  template: `
  <div>
     <div class="rounded p-3 border border-info">
        <div>
           <div>
              <div>
                 <a :href="'/@' + post.author"><img
                    :src="'https://images.hive.blog/u/' + post.author + '/avatar'"
                    class="rounded-circle bg-light img-fluid mr-2 cover author-img"></a><h5>@{{post.author}}</h5>
              </div>
              <div>
                 <p class="mt-0 mb-0 text-muted text-semibold"><a class="a-1"
                    id="modal_author"><span
                    class="ml-2 badge badge-pill badge-light">{{post.rep}}</span></a>
                 </p>
              </div>
              <span>
                 
                 <a href="#/"
                    v-show="post.author == account"
                    @click="edit = !edit">Edit Post</a>
                 <div v-show="!edit">
                    <vue-ratings class="d-flex"
                       :stars="post?.json_metadata?.review?.rating">
                    </vue-ratings>
                 </div>
                 <div v-show="edit">
                    <vue-ratings class="d-flex" vote="true"
                       @rating="setRating(post.url, $event)">
                    </vue-ratings>
                 </div>
                 <small class="text-muted"
                    id="modal_created">{{post.ago}}</small>
              </span>
           </div>
        </div>
        <div class="card-body" v-show="!edit">
           <vue-markdown :md="post.body">
           </vue-markdown>
        </div>
        <div class="card-body" v-show="edit">
           <vue-markdown :toedit="post.body" @settext="pending(post.url, $event)">
           </vue-markdown>
        </div>
        <div class="card-footer">
              <div class="float-left">Vote</div>
        </div>
        <div v-for="reply in post.replies">
            <replies :post="reply" :account="account"></replies>
        </div>
     </div>
  </div>
        `,
    props: {
        post: {
        required: true,
        default: function () {
            return {
            
            };
        },
        },
        account: {
            default: ''
        }
    },
    data() {
    return {
      collapse: false,
    edit: false,
    };
    },
    methods:{
        setRating(rating){
            this.post.rating = rating;
          }
    },
  mounted() {
  },
};

