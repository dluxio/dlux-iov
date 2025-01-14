export default {
  components: {
  },
  template: `<div class="card text-white rounded-5">
                                    <div>
                                        <img class="img-fluid featured-img rounded-top-5 border-3 border-bottom border-black"
                                            :src="makeLink('https://ipfs.dlux.io/ipfs/', set.computed.set.featured)"></img>
                                        <div class="center-circle rounded-circle bg-darker"
                                            style="border: solid black 3px">
                                            <div class="rounded-circle" style="width: 100px">
                                                <img class="img-fluid rounded-circle"
                                                    :src="makeLink('https://ipfs.dlux.io/ipfs/', set.computed.set.logo)"></img>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-footer p-0 border-3 border-top border-black rounded-bottom-5"
                                        style="border: none"
                                        :style="{'background': colors}">
                                        <div class="m-3 p-3 rounded-5" style="background-color: rgba(0, 0, 0, 0.7)">
                                            <h2 class="card-title mt-4 pt-2 mb-2 mx-3 text-center">{{set.name_long ?
                                                set.name_long : set.set}}</h2>
                                            <div class="my-2 mx-3 d-flex align-items-center">
                                                <div class="p-2">
                                                    <p class="text-white-50 mb-0"
                                                        style="overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; /* number of lines to show */ line-clamp: 2;  -webkit-box-orient: vertical;">
                                                        {{set.computed.set ? set.computed.set.Description : '...'}}
                                                    </p>
                                                </div>
                                                <img class="img-fluid rounded max-80"
                                                    :src="makeLink('https://ipfs.dlux.io/ipfs/', set.computed.set.wrapped)"></img>
                                            </div>
                                        </div>
                                    </div>
                                </div>
`,
  props: {
    set: {
      type: Object,
      required: true,
    },
    colors: {
      type: String,
      required: true,
    },
  },
  methods: {
    makeLink(base, path) {
      return `${base}${path}`;
    },
  },
};