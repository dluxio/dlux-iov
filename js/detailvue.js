<div class="modal fade" id="detailModal" tabindex="-1" role="dialog" aria-hidden="true" @blur="goBack()">
    <div class="modal-dialog modal-full modal-xl modal-dialog-centered" style="max-width: 1000px;"
        role="document">
        <div class="modal-content bg-img-none text-white">
            <div class="card text-white bg-img-none bg-blur-none">
                <div class="ms-auto">
                    <button type="button" class="btn-close mt-3 me-3"
                        data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="ms-auto me-auto px-2" style="max-width: 750px">
                    <div class="">
                        <div class="d-flex">
                            <div><a class="text-white no-decoration"
                                    :href="'/blog/@' + displayPost.item.author + '/' + displayPost.item.permlink">
                                    <h3 class="card-title" id="modal_title">
                                        {{displayPost.item.title}}</h3>
                                </a>
                                <div class="d-flex flex-wrap text-info">
                                    <div>
                                        <p><i
                                                :class="postSelect.types[displayPost.item.type].icon"></i>{{postSelect.types[displayPost.item.type].launch}}
                                        </p>

                                    </div>
                                    <p class="mx-2">•</p>
                                    <vue-ratings class="d-flex" :stars="displayPost.item.stars"
                                        :ratings="displayPost.item.ratings">
                                    </vue-ratings>
                                </div>
                            </div>

                        </div>
                        <div class="d-flex align-items-center justify-content-between">
                            <a :href="'/@' + displayPost.author" class="no-decoration">
                                <div class="d-flex align-items-center">
                                    <img v-if="displayPost.item.author" :src="'https://images.hive.blog/u/' + displayPost.item.author + '/avatar'"
                                        alt=""
                                        class="rounded-circle bg-light img-fluid me-3 cover author-img"
                                        style="width: 50px;">
                                    <div>
                                        <div class="d-flex align-items-center">
                                            <h3 class="m-0 text-white-50">{{displayPost.item.author}}</h3>
                                            <div>
                                                <span style="font-size: .5em;"
                                                    class="ms-2 badge small rounded-pill text-white"
                                                    :class="{'bg-danger': displayPost.item.rep < 25, 'bg-warning': displayPost.item.rep >= 25 && displayPost.item.rep < 50, 'bg-success': displayPost.item.rep >= 50}">
                                                    {{displayPost.item.rep}}
                                                </span>
                                            </div>
                                        </div>
                                        <span class="small text-muted">{{displayPost.item.ago}}</span>
                                    </div>
                                </div>
                            </a>

                            <a :href="displayPost.item.url" target="_blank"
                                class="ms-auto no-decoration"><button
                                    class="btn btn-lg btn-primary px-4 d-flex align-items-center"
                                    style="border-radius: 5rem;"><span
                                        class="d-none d-md-flex me-2">Launch</span><i
                                        class="ms-2 fas fa-external-link-alt"></i></button></a>

                            <span class="badge bg-primary d-none"><i
                                    :class="postSelect.types[displayPost.item.type].icon"></i>{{displayPost.item.type}}</span>
                        </div>

                    </div>
                    <div>
                        <hr>
                    </div>
                    <div class="">
                        <vue-markdown :md="displayPost.item.body" :author="displayPost.item.author"
                            :permlink="displayPost.item.permlink"></vue-markdown>
                    </div>
                    <div class="m-auto py-3 text-center">
                        <p><i
                                :class="postSelect.types[displayPost.item.type].icon"></i>{{postSelect.types[displayPost.item.type].launch}}
                        </p>
                        <a :href="displayPost.item.url"><button class="btn btn-lg btn-primary px-4"
                                style="border-radius: 5rem;">Launch<i
                                    class="ms-2 fas fa-external-link-alt"></i></button></a>
                    </div>
                    <div class="">
                        <!--leave comment-->
                        <div
                            :data-bs-target="'#comment-modal-' + displayPost.item.author + '-' + displayPost.item.permlink">
                            <form id="commentForm">
                                <!--input with buttons and preview-->
                                <mde id="body" @settext="pending(displayPost.item.url, $event)" />
                            </form>
                        </div>
                        <div class="d-flex align-items-center">
                            <vue-ratings vote="true" @rating="setRating(displayPost.item.url, $event)">
                            </vue-ratings>
                            <button class="ms-auto btn btn-outline-primary" @click="comment(displayPost.item.url)">Post Comment</button>
                        </div>
                        <!--modal vote collapse-->
                        <div class="collapse"
                            :id="'vote-modal-' + displayPost.item.author + '-' + displayPost.item.permlink">
                            <form id="voteForm">
                                <div class="p-2 d-flex align-items-center text-white-50">

                                    <button type="button" class="btn me-2"
                                        :class="{'btn-success': !displayPost.item.flag, ' btn-danger': displayPost.item.flag}"
                                        @click="vote(displayPost.item.url)"
                                        style="width: 100px;">{{displayPost.item.flag ? '-' :
                                        ''}}{{displayPost.item.slider / 100}}%</button>

                                    <button type="button" class="btn btn-secondary me-2"
                                        :data-bs-target="'#vote-modal-' + displayPost.item.author + '-' + displayPost.item.permlink"
                                        data-bs-toggle="collapse"><span
                                            class="close text-white">×</span></button>

                                    <div class="d-flex align-items-center px-3 border rounded"
                                        style="height: 38px;"
                                        :class="{'border-success': !displayPost.item.flag, 'border-danger': displayPost.item.flag}">
                                        <input type="range" class="form-range mx-auto p-0" step="1"
                                         max="10000" v-model="displayPost.item.slider">
                                    </div>

                                    <div class="ms-auto">
                                        <p class="me-1 my-0" id="commentVal"
                                            :class="{'text-success': !displayPost.item.flag, 'text-danger': displayPost.item.flag}">
                                            {{toFixed(voteVal *
                                            displayPost.item.slider/10000,3)}}
                                            <i class="me-1 fab fa-fw fa-hive"></i>
                                        </p>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <!--modal contract collapse-->
                        <div class="collapse"
                            :id="'contract-modal-' + displayPost.item.author + '-' + displayPost.item.permlink">
                            <form id="contractForm">
                                <div class="d-flex align-items-center text-white-50">
                                    <div>
                                        <button type="button" class="btn btn-primary"
                                            @click="">Extend</button>
                                        <button type="button" class="btn btn-secondary"
                                            data-bs-toggle="collapse"
                                            :data-bs-target="'#contract-modal-' + displayPost.item.author + '-' + displayPost.item.permlink"><span
                                                class="close text-white">×</span></button>
                                    </div>
                                    <p class="my-0"><span class="me-1" id="commentVal">More Time?</span><i
                                            class="ml-1 fab fa-fw fa-hive"></i></p>
                                </div>
                            </form>
                        </div>
                        <!--footer buttons-->
                        <div class="d-flex align-items-center my-2">
                            <div><a role="button" class="no-decoration" data-bs-toggle="collapse"
                                    :data-bs-target="'#vote-modal-' + displayPost.item.author + '-' + displayPost.item.permlink"><i
                                        class="fas fa-heart me-1"></i><span
                                        class="text-white-50">{{displayPost.item.upVotes}}</span></a>
                                <a role="button" class="no-decoration" data-bs-toggle="collapse"
                                    :data-bs-target="'#comment-modal-' + displayPost.item.author + '-' + displayPost.item.permlink">

                                    <i class="fas fa-comment ms-2 me-1"></i><span
                                        class="text-white-50">{{displayPost.item.children}}</span></a>

                                <a role="button" class="no-decoration text-white-50" data-bs-toggle="collapse"
                                    :class="{'text-primary': displayPost.flag > 0}"
                                    :data-bs-target="'#vote-modal-' + displayPost.author + '-' + displayPost.permlink"
                                    @click="displayPost.flag = true">
                                    <i class="fa-solid fa-flag ms-2 me-1"></i><span
                                        class="text-white-50">{{displayPost.downVotes ?
                                        displayPost.downVotes : ''}}</span>
                                </a>
                                <a role="button" v-for="contract in displayPost.contract"
                                    class="no-decoration text-white-50" data-bs-toggle="collapse"
                                    :data-bs-target="'#contract-modal-' + 'contract.i' ">
                                    <i class="fa-solid fa-file-contract ms-2 me-1"></i>
                                </a>
                            </div>
                            <div class="ms-auto" id="modal_total_payout"><i
                                    class="ms-1 fab fa-fw fa-hive text-white-50"></i>
                            </div>
                        </div>
                    </div>
                    <div class="replies">
                        <div v-for="post in displayPost.item.replies" :key="post.url">
                            <replies :post="post" :account="account" :voteval="voteVal" @vote="vote($event)" @reply="reply($event)"/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>