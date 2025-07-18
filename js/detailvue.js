import Marker from "/js/marker.js";
import Ratings from "/js/ratings.js";
import MDE from "/js/mde.js";
import Vote from "/js/vote.js";
import Pop from "/js/pop.js";
import Replies from "/js/replies.js";
import Bennies from "/js/bennies.js";
import Mcommon from "/js/methods-common.js";

export default {
    components: {
        "vue-markdown": Marker,
        "vue-ratings": Ratings,
        "mde": MDE,
        "vote": Vote,
        "pop-vue": Pop,
        "replies": Replies,
        "bennies": Bennies
    },
    template: `
<!-- Modal version -->
<div v-if="modal" :class="{'fade': modal, 'modal': modal}" id="detailModal" tabindex="-1" role="dialog" aria-hidden="true" @focus="orderBy('Reward')">
<div class="modal-dialog modal-full modal-xl modal-dialog-centered" style="max-width: 1000px;" role="document">
<div class="modal-content rounded bg-img-none">
<div class="card bg-img-none bg-blur-none">
<div class="ms-auto">
<button type="button" class="btn-close mt-3 me-3" data-bs-dismiss="modal" aria-label="Close"></button>
<button @click="updateAPP(post, post.subApp)" :class="{'d-none' : !post.subApp, 'invisible' : post.author != account}" type="button" class="btn btn-dark mt-3 me-3">Update dApp</button>
</div>
<div class="ms-auto me-auto w-100 px-2" style="max-width: 750px">
<div class="">
<!-- Parent Post Information -->
<div v-if="isReply" class="alert alert-info d-flex align-items-center mb-3" style="background-color: rgba(13, 110, 253, 0.1); border: 1px solid rgba(13, 110, 253, 0.25);">
  <i class="fa-solid fa-reply me-2"></i>
  <div>
    <span v-if="isReplyToComment">
      This is a reply to 
      <a @click.prevent="navigateToParent" href="#" class="text-info text-decoration-none fw-bold">@{{post.parent_author}}</a>,
      <span v-if="parentPost"> a thread on 
        <a @click.prevent="navigateToRootPost" href="#" class="text-info text-decoration-none fw-bold">{{getRootPostTitle}}</a>
      </span>
    </span>
    <span v-else>
      This is a reply to: 
      <a @click.prevent="navigateToParent" href="#" class="text-info text-decoration-none fw-bold">{{getParentTitle}}</a>
    </span>
  </div>
</div>
<div class="d-flex">
<div><a class=" no-decoration" :href="'/blog/@' + post.author + '/' + post.permlink">
<h3 class="card-title" id="modal_title">{{post.title}}</h3>
</a>
<div class="d-flex flex-wrap text-info" v-if="post.type != 'Blog'">
<div>
<p><i :class="post_select.types[post.type].icon"></i>
{{post_select.types[post.type].launch}}</p>
</div>
<p class="mx-2">•</p>
<vue-ratings class="d-flex" :stars="post.rating" :ratings="post.ratings">
</vue-ratings>
</div>
</div>
</div>
<div class="d-flex align-items-center justify-content-between">
<a :href="'/@' + post.author" class="no-decoration">
<div class="d-flex align-items-center">
<img v-if="post.author" :src="'https://images.hive.blog/u/' + post.author + '/avatar'" :alt="'https://images.hive.blog/u/' + post.author" class="rounded-circle bg-light img-fluid me-1 border border-light" style="width: 50px;">
<div>
<div class="d-flex align-items-center">
<h3 class="m-0 text-white-50">{{post.author}}</h3>
<div>
<span class="ms-1 badge text-white-50" :class="{'rep-danger': modalRep < 25, 'rep-warning': modalRep >= 25 && modalRep < 50, 'rep-success': modalRep >= 50}">{{modalRep}}</span>
</div>
</div>
<!-- Community info display -->
<div v-if="postCommunity && postCommunityTitle" class="d-flex align-items-center mt-1">
<a :href="'#community/' + postCommunity" @click.prevent="navigateToCommunity(postCommunity)" class="d-flex align-items-center no-decoration">
<img :src="'https://images.hive.blog/u/' + postCommunity + '/avatar'" 
     :alt="postCommunity" 
     class="rounded-circle bg-light img-fluid me-1 border border-light" 
     style="width: 24px;">
<span class="small text-info">{{postCommunityTitle}}</span>
</a>
</div>
<span class="small text-muted">{{post.ago}}</span>
</div>
</div>
</a>
<a v-if="post.type != 'Blog'" :href="'/dlux/@' + post.author + '/' + post.permlink" target="_blank" class="ms-auto no-decoration"><button class="btn btn-lg btn-danger px-4 d-flex align-items-center" style="border-radius: 5rem;"><span class="d-none d-md-flex me-2">Launch</span><i class="ms-2 fas fa-external-link-alt"></i></button></a>
<span class="badge bg-primary d-none"><i :class="post_select.types[post.type].icon"></i>{{post.type}}</span>
</div>
</div>
<div>
<hr>
</div>
<div class="mde-body">
<vue-markdown :md="post.body" :author="post.author" :permlink="post.permlink"></vue-markdown>
</div>
<div class="m-auto py-3 text-center" v-if="(post.type == 'Blog' && !solo) || post.type != 'Blog'">
<p><i :class="post_select.types[post.type].icon"></i>{{post_select.types[post.type].launch}}
</p>
<a :href="(post.type == 'Blog' ? '/blog/@' : '/dlux/@') + post.author + '/' + post.permlink"><button class="btn btn-lg btn-danger px-4" style="border-radius: 5rem;">Launch<i class="ms-2 fas fa-external-link-alt"></i></button></a>
</div>
<div class="">
<div class="d-flex align-items-center">
</div>
<div class="collapse" :id="'contract-modal-' + post.author + '-' + post.permlink">
<h4 class="text-white-50 text-center mt-2">Storage Contract Details</h4>
<form v-for="(cid, name, index) in post.contract" id="contractForm">
<div v-if="contracts[name]">
<div class="d-flex flex-column mb-2">
<div class="w-100 py-1">
<div class="d-flex justify-content-between align-items-center">
<span class="text-break">{{fancyBytes(contracts[name].u)}} | {{expIn(contracts[name])}}</span>
<button type="button" class="btn btn-sm btn-outline-success" data-bs-toggle="collapse" :data-bs-target="'#nodes-' + post.permlink">
<i class="fa-solid fa-tower-broadcast fa-fw me-1"></i>{{contracts[name].nt}}/{{contracts[name].p}}</button>
</div>
<div class="collapse" :id="'nodes-' + post.permlink">
<div class="text-lead text-uppercase text-white-50 pb-05 mt-1 border-bottom">Nodes Storing This Contract</div>
<ol type="1" class="my-1" v-for="(acc, prop, index) in contracts[name].n">
<li class="mt-1"><a :href="'/@' + acc " class="no-decoration text-info">@{{acc}}</a></li>
<div v-if="index == Object.keys(contracts[name].n).length - 1 && index + 1 < contracts[name].p" v-for="i in (contracts[name].p - (index + 1))">
<li>Open</li>
</div>
</ol>
<p class="d-none" v-if="index == Object.keys(contracts[name].n).length - 1 && index + 1 < contracts[name].p">{{contracts[name].p - (index + 1) }} slots are open!</p>
</div>
</div>
</div>
<div v-if="has_ipfs" class="alert alert-secondary d-flex align-items-center py-1 ps-2 pe-1 mb-2">
<span class="me-1">{{isStored(contracts[name].i) ? 'Your node is storing this contract' : 'Your node is not storing this contract'}}</span>
<button @click="store(contracts[name].i, isStored(contracts[name].i))" class="btn ms-auto" :class="{'btn-success': !isStored(contracts[name].i), 'btn-danger': isStored(contracts[name].i)}">
<span v-if="!isStored(contracts[name].i)">
<i class="fa-solid fa-square-plus fa-fw me-1"></i>Add</span>
<span v-if="isStored(contracts[name].i)"><i class="fa-solid fa-trash-can fa-fw me-1"></i>Remove</span>
</button>
</div>
<div class="d-flex flex-wrap mb-2">
<div class="btn-group mt-1">
<input name="time" @change="updateCost(name);customTime = false" title="1 Day" class="btn-check" :id="'option1-' + name" type="radio" value="1" v-model="contracts[name].extend" checked>
<label class="btn btn-sm btn-outline-info" :for="'option1-' + name">1D</label>
<input name="time" @change="updateCost(name);customTime = false" title="1 Week" class="btn-check" :id="'option2-' + name" type="radio" value="7" v-model="contracts[name].extend">
<label class="btn btn-sm btn-outline-info" :for="'option2-' + name">1W</label>
<input name="time" @change="updateCost(name);customTime = false" title="1 Month" class="btn-check" :id="'option3-' + name" type="radio" value="30" v-model="contracts[name].extend">
<label class="btn btn-sm btn-outline-info" :for="'option3-' + name">1M</label>
<input name="time" @change="updateCost(name);customTime = false" title="1 Year" class="btn-check" :id="'option4-' + name" type="radio" value="365" v-model="contracts[name].extend">
<label class="btn btn-sm btn-outline-info" :for="'option4-' + name">1Y</label>
</div>
<div class="input-group flex-nowrap col ms-1 mt-1">
<input type="number" step="1" class="form-control px-1 btn-sm text-end border-info text-info" v-model="contracts[name].extend" @change="updateCost(name)" style="min-width: 60px;">
<span class="input-group-text btn-sm">Days</span>
</div>
</div>
<div class="mb-2 d-flex flex-wrap text-nobreak align-items-center text-white-50">
<button type="button" class="btn btn-sm btn-primary mt-1" :disabled="extendcost[name] > broca_calc(broca)" @click="extend(contracts[name], extendcost[name])">
<i class="fa-solid fa-clock-rotate-left fa-fw me-1"></i>Extend</button>
<button type="button" class="btn btn-sm btn-warning ms-1 mt-1" v-if="contracts[name].t == account" @click="cancel_contract(contracts[name])">
<i class="fa-solid fa-file-circle-xmark fa-fw me-1"></i>Sever</button>
<button type="button" class="btn btn-sm btn-secondary ms-1 mt-1" data-bs-toggle="collapse" :data-bs-target="'#contract-modal-' + post.author + '-' + post.permlink">
<i class="fa-solid fa-xmark fa-fw"></i></button>
<div class="d-flex align-items-center text-nobreak ms-1 mt-1 btn btn-sm btn-outline-secondary p-0">
<label :for="'spread-' + name" role="button" class="ps-1">&nbsp;</label>
<input class="form control" :id="'spread-' + name" type="checkbox" role="button" v-model="spread" @change="updateCost(name)">
<label :for="'spread-' + name" role="button" class="px-1 py-05">Add<i class="fa-solid fa-tower-broadcast fa-fw ms-1"></i></label>
</div>
<div class="ms-auto mt-1 text-primary fw-bold">{{formatNumber(extendcost[name], 0, '.',',')}} Broca</div>
</div>
</div>
</form>
</div>
<div class="collapse" :id="'vote-modal-' + post.author + '-' + post.permlink">
<form :id="'voteForm-' + post.author + '-' + post.permlink">
<div class="d-flex align-items-center text-white-50">
<button type="button" class="btn btn-sm me-1" :class="{'btn-success': !flag, ' btn-danger': flag}" @click="vote(post.url)" style="min-width: 85px;"><span v-if="!flag"><i class="fas fa-heart fa-fw me-1"></i></span><span v-if="flag"><i class="fa-solid fa-flag me-1"></i></span>{{flag ? '-' : ''}}{{formatNumber(slider / 100, 0,'.',',')}}%</button>
<button type="button" class="btn btn-sm btn-secondary px-1 me-1" data-bs-toggle="collapse" :data-bs-target="'#vote-modal-' + post.author + '-' + post.permlink">
<i class="fa-solid fa-xmark fa-fw"></i></button>
<input type="range" class="form-range mx-2" step="1" max="10000" v-model="slider">
<span style="min-width: 100px" class="text-end text-nowrap" id="commentVal" :class="{'text-success': !flag, 'text-danger': flag}">{{toFixed(voteval * slider/10000,3)}}
<i class="fab fa-fw fa-hive"></i>
</span>
</div>
</form>
</div>
</div>
</div>
<div class="my-2 p-2" style="border-top: solid 1px rgba(0,0,0,1); border-bottom: solid 1px rgba(255,255,255,0.4);">
<div class="ms-auto me-auto" style="max-width: 750px">
<div class="d-flex align-items-center">
<a role="button" @click="flag = false" class="no-decoration" data-bs-toggle="collapse" :data-bs-target="'#vote-modal-' + post.author + '-' + post.permlink"><i class="fas fa-heart fa-fw me-1"></i><span class="text-white-50">{{post.upVotes}}</span>
</a>
<a href="#comments" class="no-decoration">
<i class="fas fa-comment fa-fw ms-2 me-1"></i><span class="text-white-50">{{post.children}}</span>
</a>
<a role="button" class="no-decoration text-white-50" data-bs-toggle="collapse" :class="{'text-primary': flag > 0}" :data-bs-target="'#vote-modal-' + post.author + '-' + post.permlink" @click="flag = true">
<i class="fa-solid fa-flag fa-fw ms-2 me-1"></i><span class="text-white-50">{{post.downVotes ? post.downVotes : ''}}</span>
</a>
<a role="button" v-for="(contract, name, index) in post.contract" class="no-decoration text-white-50" data-bs-toggle="collapse" :data-bs-target="'#contract-modal-' + post.author + '-' + post.permlink">
<i class="fa-solid fa-file-contract fa-fw ms-2 me-1" :class="{'text-success': color_code(name) > 28800 * 7,'text-warning': color_code(name) < 28800 * 7 &&  color_code(name) > 28800, 'text-warning': color_code(name) < 28800}"></i>
</a>
<div class="ms-auto" id="modal_total_payout"><pop-vue title="Post Earnings" :id="'popper-' + post.author + '-' + post.permlink" :content="(gt(post.total_payout_value, post.pending_payout_value) ? formatNumber(post.total_payout_value + ' ' + post.curator_payout_value, 3, '.',',') + ' HBD' : post.pending_payout_value ? post.pending_payout_value : '') + '<br>' + (post.paid ? precision(post.payout, 3) : 0) + ' ' + TOKEN" trigger="hover">
<button class="btn btn-sm btn-outline-light">
{{ gt(post.total_payout_value, post.pending_payout_value) ? formatNumber(post.total_payout_value + ' ' + post.curator_payout_value, 3, '.',',') : formatNumber(post.pending_payout_value, 3, '.',',')}}<i class="ms-1 fab fa-fw fa-hive"></i>
</button>
</pop-vue>
</div>
</div>
</div>
</div>
<div class="px-2">
<div class="mb-3 ms-auto me-auto" style="max-width: 750px">
<form :id="'commentForm-' + post.author + '-' + post.permlink">
<mde id="body" @data="settext($event)" />
</form>
<div class="collapse" id="bene-collapse">
<bennies :list="bens" @update-bennies="bens=$event"></bennies>
</div>
<div class="d-flex align-items-center">
<button class="btn btn-sm px-2 btn-secondary" data-bs-toggle="collapse" data-bs-target="#bene-collapse"><i class="fa-solid fa-user-group fa-fw me-1"></i>Beneficiaries {{bens.length ? '(' + bens.length + ')' : ''}}<span v-if="!bens.length">+</span></button>
<vue-ratings v-if="post.type != 'Blog'" role="button" class="ms-2" vote="true" @rating="setRating(post.url, $event)"></vue-ratings>
<button class="ms-auto btn btn-sm px-2 btn-primary" :disabled="!mde" @click="comment(post.url)"><i class="fas fa-comment fa-fw me-1"></i>Reply</button>
</div>
</div>
</div>
<div class="bg-darkest border-1 border-start border-end p-1"></div>
<div id="comments" class="replies w-100 ms-auto me-auto px-2 mb-3" style="max-width: 750px">
<div class="d-flex text-nobreak align-items-center my-2">
<h5 class="m-0">{{post.children}} Comment<span v-if="post.children > 1">s</span></h5>
<div class="dropdown ms-auto">
<button class="btn btn-sm btn-dark px-2 text-uppercase" type="button" data-bs-toggle="dropdown" aria-expanded="false">{{orderby}}<i class="fa-solid fa-arrow-down-wide-short fa-fw ms-1"></i>
</button>
<ul class="dropdown-menu dropdown-menu-dark bg-black">
<li><a class="dropdown-item" role="button" @click="orderBy('Reward')">Reward</a></li>
<li><a class="dropdown-item" role="button" @click="orderBy('RateUp')">Ratings<i class="fa-solid fa-arrow-down-wide-short"></i></a></li>
<li><a class="dropdown-item" role="button" @click="orderBy('RateDown')">Ratings<i class="fa-solid fa-arrow-down-short-wide"></i></a></li>
<li><a class="dropdown-item" role="button" @click="orderBy('Newest')">Newest</a></li>
<li><a class="dropdown-item" role="button" @click="orderBy('AuthorVote')">Author Vote</a></li>
<li><a class="dropdown-item" role="button" @click="orderBy('Oldest')">Oldest</a></li>
<li><a class="dropdown-item" role="button" @click="orderBy('Rep')">Reputation</a></li>
</ul>
</div>
</div>
<div v-for="post in post.replies" :key="post.url">
<replies :post="post" :account="account" :voteval="voteval" @vote="vote($event)" @reply="reply($event)" @tosign="handleReplySigning($event)"/>
</div>
</div>
</div>
</div>
</div>
</div>
<!-- Standalone version -->
<div v-else class="w-100">
<div class="ms-auto me-auto w-100 px-2" style="max-width: 750px">
<div class="">
<!-- Parent Post Information -->
<div v-if="isReply" class="alert alert-info d-flex align-items-center mb-3" style="background-color: rgba(13, 110, 253, 0.1); border: 1px solid rgba(13, 110, 253, 0.25);">
  <i class="fa-solid fa-reply me-2"></i>
  <div>
    <span v-if="isReplyToComment">
      This is a reply to 
      <a @click.prevent="navigateToParent" href="#" class="text-info text-decoration-none fw-bold">@{{post.parent_author}}</a>,
      <span v-if="parentPost"> a thread on 
        <a @click.prevent="navigateToRootPost" href="#" class="text-info text-decoration-none fw-bold">{{getRootPostTitle}}</a>
      </span>
    </span>
    <span v-else>
      This is a reply to: 
      <a @click.prevent="navigateToParent" href="#" class="text-info text-decoration-none fw-bold">{{getParentTitle}}</a>
    </span>
  </div>
</div>
<div class="d-flex">
<div><a class=" no-decoration" :href="'/blog/@' + post.author + '/' + post.permlink">
<h3 class="card-title" id="solo_title">{{post.title}}</h3>
</a>
<div class="d-flex flex-wrap text-info" v-if="post.type != 'Blog'">
<div>
<p><i :class="post_select.types[post.type].icon"></i>
{{post_select.types[post.type].launch}}</p>
</div>
<p class="mx-2">•</p>
<vue-ratings class="d-flex" :stars="post.rating" :ratings="post.ratings">
</vue-ratings>
</div>
</div>
</div>
<div class="d-flex align-items-center justify-content-between">
<a :href="'/@' + post.author" class="no-decoration">
<div class="d-flex align-items-center">
<img v-if="post.author" :src="'https://images.hive.blog/u/' + post.author + '/avatar'" :alt="'https://images.hive.blog/u/' + post.author" class="rounded-circle bg-light img-fluid me-1 border border-light" style="width: 50px;">
<div>
<div class="d-flex align-items-center">
<h3 class="m-0 text-white-50">{{post.author}}</h3>
<div>
<span class="ms-1 badge text-white-50" :class="{'rep-danger': modalRep < 25, 'rep-warning': modalRep >= 25 && modalRep < 50, 'rep-success': modalRep >= 50}">{{modalRep}}</span>
</div>
</div>
<!-- Community info display -->
<div v-if="postCommunity && postCommunityTitle" class="d-flex align-items-center mt-1">
<a :href="'#community/' + postCommunity" @click.prevent="navigateToCommunity(postCommunity)" class="d-flex align-items-center no-decoration">
<img :src="'https://images.hive.blog/u/' + postCommunity + '/avatar'" 
     :alt="postCommunity" 
     class="rounded-circle bg-light img-fluid me-1 border border-light" 
     style="width: 24px;">
<span class="small text-info">{{postCommunityTitle}}</span>
</a>
</div>
<span class="small text-muted">{{post.ago}}</span>
</div>
</div>
</a>
<div class="d-flex">
<button @click="updateAPP(post, post.subApp)" v-if="post.subApp && post.author == account" type="button" class="btn btn-dark me-3">Update dApp</button>
<a v-if="post.type != 'Blog'" :href="'/dlux/@' + post.author + '/' + post.permlink" target="_blank" class="ms-auto no-decoration"><button class="btn btn-lg btn-danger px-4 d-flex align-items-center" style="border-radius: 5rem;"><span class="d-none d-md-flex me-2">Launch</span><i class="ms-2 fas fa-external-link-alt"></i></button></a>
</div>
<span class="badge bg-primary d-none"><i :class="post_select.types[post.type].icon"></i>{{post.type}}</span>
</div>
</div>
<div>
<hr>
</div>
<div class="mde-body">
<vue-markdown :md="post.body" :author="post.author" :permlink="post.permlink"></vue-markdown>
</div>
<div class="m-auto py-3 text-center" v-if="(post.type == 'Blog' && !solo) || post.type != 'Blog'">
<p><i :class="post_select.types[post.type].icon"></i>{{post_select.types[post.type].launch}}
</p>
<a :href="(post.type == 'Blog' ? '/blog/@' : '/dlux/@') + post.author + '/' + post.permlink"><button class="btn btn-lg btn-danger px-4" style="border-radius: 5rem;">Launch<i class="ms-2 fas fa-external-link-alt"></i></button></a>
</div>
<div class="">
<div class="d-flex align-items-center">
</div>
<div class="collapse" :id="'contract-standalone-' + post.author + '-' + post.permlink">
<h4 class="text-white-50 text-center mt-2">Storage Contract Details</h4>
<form v-for="(cid, name, index) in post.contract" id="contractForm">
<div v-if="contracts[name]">
<div class="d-flex flex-column mb-2">
<div class="w-100 py-1">
<div class="d-flex justify-content-between align-items-center">
<span class="text-break">{{fancyBytes(contracts[name].u)}} | {{expIn(contracts[name])}}</span>
<button type="button" class="btn btn-sm btn-outline-success" data-bs-toggle="collapse" :data-bs-target="'#nodes-standalone-' + post.permlink">
<i class="fa-solid fa-tower-broadcast fa-fw me-1"></i>{{contracts[name].nt}}/{{contracts[name].p}}</button>
</div>
<div class="collapse" :id="'nodes-standalone-' + post.permlink">
<div class="text-lead text-uppercase text-white-50 pb-05 mt-1 border-bottom">Nodes Storing This Contract</div>
<ol type="1" class="my-1" v-for="(acc, prop, index) in contracts[name].n">
<li class="mt-1"><a :href="'/@' + acc " class="no-decoration text-info">@{{acc}}</a></li>
<div v-if="index == Object.keys(contracts[name].n).length - 1 && index + 1 < contracts[name].p" v-for="i in (contracts[name].p - (index + 1))">
<li>Open</li>
</div>
</ol>
<p class="d-none" v-if="index == Object.keys(contracts[name].n).length - 1 && index + 1 < contracts[name].p">{{contracts[name].p - (index + 1) }} slots are open!</p>
</div>
</div>
</div>
<div v-if="has_ipfs" class="alert alert-secondary d-flex align-items-center py-1 ps-2 pe-1 mb-2">
<span class="me-1">{{isStored(contracts[name].i) ? 'Your node is storing this contract' : 'Your node is not storing this contract'}}</span>
<button @click="store(contracts[name].i, isStored(contracts[name].i))" class="btn ms-auto" :class="{'btn-success': !isStored(contracts[name].i), 'btn-danger': isStored(contracts[name].i)}">
<span v-if="!isStored(contracts[name].i)">
<i class="fa-solid fa-square-plus fa-fw me-1"></i>Add</span>
<span v-if="isStored(contracts[name].i)"><i class="fa-solid fa-trash-can fa-fw me-1"></i>Remove</span>
</button>
</div>
<div class="d-flex flex-wrap mb-2">
<div class="btn-group mt-1">
<input name="time" @change="updateCost(name);customTime = false" title="1 Day" class="btn-check" :id="'option1-standalone-' + name" type="radio" value="1" v-model="contracts[name].extend" checked>
<label class="btn btn-sm btn-outline-info" :for="'option1-standalone-' + name">1D</label>
<input name="time" @change="updateCost(name);customTime = false" title="1 Week" class="btn-check" :id="'option2-standalone-' + name" type="radio" value="7" v-model="contracts[name].extend">
<label class="btn btn-sm btn-outline-info" :for="'option2-standalone-' + name">1W</label>
<input name="time" @change="updateCost(name);customTime = false" title="1 Month" class="btn-check" :id="'option3-standalone-' + name" type="radio" value="30" v-model="contracts[name].extend">
<label class="btn btn-sm btn-outline-info" :for="'option3-standalone-' + name">1M</label>
<input name="time" @change="updateCost(name);customTime = false" title="1 Year" class="btn-check" :id="'option4-standalone-' + name" type="radio" value="365" v-model="contracts[name].extend">
<label class="btn btn-sm btn-outline-info" :for="'option4-standalone-' + name">1Y</label>
</div>
<div class="input-group flex-nowrap col ms-1 mt-1">
<input type="number" step="1" class="form-control px-1 btn-sm text-end border-info text-info" v-model="contracts[name].extend" @change="updateCost(name)" style="min-width: 60px;">
<span class="input-group-text btn-sm">Days</span>
</div>
</div>
<div class="mb-2 d-flex flex-wrap text-nobreak align-items-center text-white-50">
<button type="button" class="btn btn-sm btn-primary mt-1" :disabled="extendcost[name] > broca_calc(broca)" @click="extend(contracts[name], extendcost[name])">
<i class="fa-solid fa-clock-rotate-left fa-fw me-1"></i>Extend</button>
<button type="button" class="btn btn-sm btn-warning ms-1 mt-1" v-if="contracts[name].t == account" @click="cancel_contract(contracts[name])">
<i class="fa-solid fa-file-circle-xmark fa-fw me-1"></i>Sever</button>
<button type="button" class="btn btn-sm btn-secondary ms-1 mt-1" data-bs-toggle="collapse" :data-bs-target="'#contract-standalone-' + post.author + '-' + post.permlink">
<i class="fa-solid fa-xmark fa-fw"></i></button>
<div class="d-flex align-items-center text-nobreak ms-1 mt-1 btn btn-sm btn-outline-secondary p-0">
<label :for="'spread-standalone-' + name" role="button" class="ps-1">&nbsp;</label>
<input class="form control" :id="'spread-standalone-' + name" type="checkbox" role="button" v-model="spread" @change="updateCost(name)">
<label :for="'spread-standalone-' + name" role="button" class="px-1 py-05">Add<i class="fa-solid fa-tower-broadcast fa-fw ms-1"></i></label>
</div>
<div class="ms-auto mt-1 text-primary fw-bold">{{formatNumber(extendcost[name], 0, '.',',')}} Broca</div>
</div>
</div>
</form>
</div>
<div class="collapse" :id="'vote-standalone-' + post.author + '-' + post.permlink">
<form :id="'voteForm-standalone-' + post.author + '-' + post.permlink">
<div class="d-flex align-items-center text-white-50">
<button type="button" class="btn btn-sm me-1" :class="{'btn-success': !flag, ' btn-danger': flag}" @click="vote(post.url)" style="min-width: 85px;"><span v-if="!flag"><i class="fas fa-heart fa-fw me-1"></i></span><span v-if="flag"><i class="fa-solid fa-flag me-1"></i></span>{{flag ? '-' : ''}}{{formatNumber(slider / 100, 0,'.',',')}}%</button>
<button type="button" class="btn btn-sm btn-secondary px-1 me-1" data-bs-toggle="collapse" :data-bs-target="'#vote-standalone-' + post.author + '-' + post.permlink">
<i class="fa-solid fa-xmark fa-fw"></i></button>
<input type="range" class="form-range mx-2" step="1" max="10000" v-model="slider">
<span style="min-width: 100px" class="text-end text-nowrap" id="commentVal" :class="{'text-success': !flag, 'text-danger': flag}">{{toFixed(voteval * slider/10000,3)}}
<i class="fab fa-fw fa-hive"></i>
</span>
</div>
</form>
</div>
</div>
</div>
<div class="my-2 p-2" style="border-top: solid 1px rgba(0,0,0,1); border-bottom: solid 1px rgba(255,255,255,0.4);">
<div class="ms-auto me-auto" style="max-width: 750px">
<div class="d-flex align-items-center">
<a role="button" @click="flag = false" class="no-decoration" data-bs-toggle="collapse" :data-bs-target="'#vote-standalone-' + post.author + '-' + post.permlink"><i class="fas fa-heart fa-fw me-1"></i><span class="text-white-50">{{post.upVotes}}</span>
</a>
<a href="#comments" class="no-decoration">
<i class="fas fa-comment fa-fw ms-2 me-1"></i><span class="text-white-50">{{post.children}}</span>
</a>
<a role="button" class="no-decoration text-white-50" data-bs-toggle="collapse" :class="{'text-primary': flag > 0}" :data-bs-target="'#vote-standalone-' + post.author + '-' + post.permlink" @click="flag = true">
<i class="fa-solid fa-flag fa-fw ms-2 me-1"></i><span class="text-white-50">{{post.downVotes ? post.downVotes : ''}}</span>
</a>
<a role="button" v-for="(contract, name, index) in post.contract" class="no-decoration text-white-50" data-bs-toggle="collapse" :data-bs-target="'#contract-standalone-' + post.author + '-' + post.permlink">
<i class="fa-solid fa-file-contract fa-fw ms-2 me-1" :class="{'text-success': color_code(name) > 28800 * 7,'text-warning': color_code(name) < 28800 * 7 &&  color_code(name) > 28800, 'text-warning': color_code(name) < 28800}"></i>
</a>
<div class="ms-auto" id="standalone_total_payout"><pop-vue title="Post Earnings" :id="'popper-standalone-' + post.author + '-' + post.permlink" :content="(gt(post.total_payout_value, post.pending_payout_value) ? formatNumber(post.total_payout_value + ' ' + post.curator_payout_value, 3, '.',',') + ' HBD' : post.pending_payout_value ? post.pending_payout_value : '') + '<br>' + (post.paid ? precision(post.payout, 3) : 0) + ' ' + TOKEN" trigger="hover">
<button class="btn btn-sm btn-outline-light">
{{ gt(post.total_payout_value, post.pending_payout_value) ? formatNumber(post.total_payout_value + ' ' + post.curator_payout_value, 3, '.',',') : formatNumber(post.pending_payout_value, 3, '.',',')}}<i class="ms-1 fab fa-fw fa-hive"></i>
</button>
</pop-vue>
</div>
</div>
</div>
</div>
<div class="px-2">
<div class="mb-3 ms-auto me-auto" style="max-width: 750px">
<form :id="'commentForm-standalone-' + post.author + '-' + post.permlink">
<mde id="body" @data="settext($event)" />
</form>
<div class="collapse" id="bene-collapse-standalone">
<bennies :list="bens" @update-bennies="bens=$event"></bennies>
</div>
<div class="d-flex align-items-center">
<button class="btn btn-sm px-2 btn-secondary" data-bs-toggle="collapse" data-bs-target="#bene-collapse-standalone"><i class="fa-solid fa-user-group fa-fw me-1"></i>Beneficiaries {{bens.length ? '(' + bens.length + ')' : ''}}<span v-if="!bens.length">+</span></button>
<vue-ratings v-if="post.type != 'Blog'" role="button" class="ms-2" vote="true" @rating="setRating(post.url, $event)"></vue-ratings>
<button class="ms-auto btn btn-sm px-2 btn-primary" :disabled="!mde" @click="comment(post.url)"><i class="fas fa-comment fa-fw me-1"></i>Reply</button>
</div>
</div>
</div>
<div class="bg-darkest border-1 border-start border-end p-1"></div>
<div id="comments" class="replies w-100 ms-auto me-auto px-2 mb-3" style="max-width: 750px">
<div class="d-flex text-nobreak align-items-center my-2">
<h5 class="m-0">{{post.children}} Comment<span v-if="post.children > 1">s</span></h5>
<div class="dropdown ms-auto">
<button class="btn btn-sm btn-dark px-2 text-uppercase" type="button" data-bs-toggle="dropdown" aria-expanded="false">{{orderby}}<i class="fa-solid fa-arrow-down-wide-short fa-fw ms-1"></i>
</button>
<ul class="dropdown-menu dropdown-menu-dark bg-black">
<li><a class="dropdown-item" role="button" @click="orderBy('Reward')">Reward</a></li>
<li><a class="dropdown-item" role="button" @click="orderBy('RateUp')">Ratings<i class="fa-solid fa-arrow-down-wide-short"></i></a></li>
<li><a class="dropdown-item" role="button" @click="orderBy('RateDown')">Ratings<i class="fa-solid fa-arrow-down-short-wide"></i></a></li>
<li><a class="dropdown-item" role="button" @click="orderBy('Newest')">Newest</a></li>
<li><a class="dropdown-item" role="button" @click="orderBy('AuthorVote')">Author Vote</a></li>
<li><a class="dropdown-item" role="button" @click="orderBy('Oldest')">Oldest</a></li>
<li><a class="dropdown-item" role="button" @click="orderBy('Rep')">Reputation</a></li>
</ul>
</div>
</div>
<div v-for="post in post.replies" :key="post.url">
<replies :post="post" :account="account" :voteval="voteval" @vote="vote($event)" @reply="reply($event)" @tosign="handleReplySigning($event)"/>
</div>
</div>
</div>`,
props: {
    head_block: {
        default: 0
    },
    has_ipfs: {
        default: false
    },
    solo: {
        default: false
    },
    TOKEN: {
        default: 'DLUX'
    },
    hide: {
        default: true
    },
    modal: {
        default: true
    },
    post: {
        required: true,
        default: function () {
            return {

            };
        },
    },
    account: {
        default: ''
    },
    voteval: 0,
    post_select: {
        default: function () {
            return {}
        }
    },
    contracts: {
        default: function () {
            return {}
        }
    },
    extendcost: {
        default: function () {
            return {}
        }
    },
    broca_refill:{
        default: 0
    },
    broca: {
        default: 0
    },
    spk_power: {
        default: 0
    }
},
data() {
    return {
        collapse: false,
        hideBens: true,
        edit: false,
        view: true,
        mde: '',
        makeReply: false,
        spread: false,
        warn: false,
        flag: false,
        slider: 10000,
        orderby: 'Reward',
        bens: [],
        postCustom_json: {
            review:{
                rating: 0
            }
        },
        modalRep: "...",
        modalAuthorInfo: null,
        parentPost: null,
        rootPost: null,
    };
},
emits: ['vote', 'reply', 'modalselect', 'tosign'],
computed: {
    postCommunity() {
        return this.post.community || (this.post.json_metadata && this.post.json_metadata.community);
    },
    postCommunityTitle() {
        return this.post.community_title || (this.post.json_metadata && this.post.json_metadata.community_title);
    },
    isReply() {
        return this.post.parent_author && this.post.parent_permlink && 
               this.post.parent_author !== '' && this.post.parent_permlink !== '';
    },
    isReplyToComment() {
        // If this is a reply, check if the parent post also has a parent (making it a nested comment)
        if (!this.isReply) return false;
        return this.parentPost && this.parentPost.parent_author && 
               this.parentPost.parent_author !== '' && this.parentPost.parent_permlink !== '';
    },
    getParentTitle() {
        if (this.parentPost && this.parentPost.title) {
            return this.parentPost.title;
        }
        return `@${this.post.parent_author}/${this.post.parent_permlink}`;
    },
    getRootPostTitle() {
        if (this.rootPost && this.rootPost.title) {
            return this.rootPost.title;
        }
        if (this.parentPost && this.parentPost.root_title) {
            return this.parentPost.root_title;
        }
        return 'original post';
    }
},
methods: {
    ...Mcommon,
    async getModalAuthorReputation() {
        if (this.post.author && !this.modalAuthorInfo) {
            try {
                const response = await fetch("https://api.hive.blog", {
                    body: JSON.stringify({
                        "jsonrpc": "2.0", 
                        "method": "condenser_api.get_accounts", 
                        "params": [[this.post.author]], 
                        "id": 1
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                });
                const data = await response.json();
                if (data.result && data.result.length > 0) {
                    this.modalAuthorInfo = data.result[0];
                    this.updateModalReputation();
                }
            } catch (error) {
                console.error('Error fetching modal author reputation:', error);
                if (this.post.author_reputation) {
                    // Condenser API returns raw reputation values that need calculation
                    this.modalRep = this.post.author_reputation
                }
            }
        }
    },
    updateModalReputation() {
        if (this.post.author_reputation) {
            // Condenser API returns raw reputation values that need calculation
            this.modalRep = this.post.author_reputation
        } else if (this.modalAuthorInfo && this.modalAuthorInfo.reputation) {
            // Condenser API returns raw reputation values that need calculation
            this.modalRep = this.modalAuthorInfo.reputation
        } else if (this.post.rep && this.post.rep !== "...") {
            this.modalRep = this.post.rep;
        }
    },
    orderBy(type){
        this.orderby = type;
        if(this.post?.replies?.length)switch(type){
            case 'Reward':
                this.post.replies.sort((a, b) => {
                    if(parseFloat(b.total_payout_value) || parseFloat(a.total_payout_value))return parseFloat(b.total_payout_value) - parseFloat(a.total_payout_value)
                    return parseFloat(b.pending_payout_value) - parseFloat(a.pending_payout_value)
                });
                break;
            case 'Newest':
                this.post.replies.sort((a, b) => {
                    return Date.parse(b.created + '.000') - Date.parse(a.created + '.000')
                })
                break;
            case 'AuthorVote':
                this.post.replies.sort((a, b) => {
                    const aw = a.active_votes.find(v => v.voter === this.post.author)
                    const bw = b.active_votes.find(v => v.voter === this.post.author)
                    return aw - bw
                })
                break;
            case 'Oldest':
                this.post.replies.sort((a, b) => {
                    return Date.parse(a.created + '.000') - Date.parse(b.created + '.000')
                })
                break;
            case 'Rep':
                this.post.replies.sort((a, b) => {
                    return b.author_reputation - a.author_reputation
                })
                break;
            case 'RateUp':
                this.post.replies.sort((a, b) => {
                    return b.rating - a.rating
                })
                break;
            case 'RateDown':
                this.post.replies.sort((a, b) => {
                    return a.rating - b.rating
                })
                break;
            default:
                break;
        }
    },
    settext(text) {
        this.mde = text;
    },
    expIn(con){
        return `Expires in ${parseInt((parseInt(con.e.split(':')[0]) - this.head_block) / 20 / 60) < 24 ? parseInt((parseInt(con.e.split(':')[0]) - this.head_block) / 20 / 60) + ' hours' : parseInt((parseInt(con.e.split(':')[0]) - this.head_block) / 20 / 60 / 24) + ' days'}`
    },
    color_code(name) {
        return parseInt(this.contracts[name] ? this.contracts[name].e.split(':')[0] : 0) - this.head_block
    },
    modalSelect(url) {
        this.$emit('modalselect', url);
    },
    isStored(contract){
        var found = false
        for (var i in this.contracts[contract].n) {
            if (this.contracts[contract].n[i] == this.account) {
                found = true
                break
            }
        }
        return found
    },
    extend(contract, amount, up = false){
        if(amount > this.broca_calc(this.broca))return
        const toSign = {
            type: "cja",
            cj: {
              broca: amount,
              id: contract.i,
              file_owner: contract.t,
              power: up ? 1 : 0,
            },
            id: `spkccT_extend`,
            msg: `Extending ${contract}...`,
            ops: ["getTokenUser"],
            api: "https://spktest.dlux.io",
            txid: "extend",
          }
          this.$emit('tosign', toSign)
    },
    updateCost(id) {
        this.extendcost[id] = parseInt(this.contracts[id].extend / 30 * this.contracts[id].r)
        this.$forceUpdate()
    },
    getContracts() {
        var contracts = [],
            getContract = (id) => {
                console.log({id})
                fetch('https://spktest.dlux.io/api/fileContract/' + id)
                    .then((r) => r.json())
                    .then((res) => {
                        res.result.extend = "7"
                        if (res.result) {
                            this.contracts[id] = res.result
                            this.extendcost[id] = parseInt(res.result.extend / 30 * res.result.r)
                        }
                    });
            }
        for (var contract in this.post.contract) {
            contracts.push(contract)
        }
        contracts = [...new Set(contracts)]
        for (var i = 0; i < contracts.length; i++) {
            getContract(contracts[i])
        }
    },
    imgUrlAlt(event) {
        event.target.src = "/img/dlux-logo-icon.png";
    },
    picFind(json) {
        var arr;
        try {
            arr = json.image[0];
        } catch (e) { }
        if (typeof json.image == "string") {
            return json.image;
        } else if (typeof arr == "string") {
            return arr;
        } else if (typeof json.Hash360 == "string") {
            return `https://ipfs.dlux.io/ipfs/${json.Hash360}`;
        } else {
            return "/img/dluxdefault.png";
        }
    },
    pending(event) {
        this.mde = event
    },
    vote(url) {
        // Handle both direct URL calls and event objects
        let voteUrl, slider, flag;
        
        if (typeof url === 'object') {
            // Event from vote component
            voteUrl = url.url;
            slider = url.slider;
            flag = url.flag;
        } else {
            // Direct URL call
            voteUrl = `/@${this.post.author}/${this.post.permlink}`;
            slider = this.slider;
            flag = this.flag;
        }
        
        // Create vote signing operation
        const voteOp = {
            type: "vote",
            cj: {
                author: voteUrl.split("/@")[1].split("/")[0],
                permlink: voteUrl.split("/@")[1].split("/")[1],
                weight: slider * (flag ? -1 : 1),
            },
            msg: `Voting ...`,
            ops: [""],
            txid: "vote",
        };
        
        // Send through signing system
        this.handleReplySigning(voteOp);
        
        // Also emit the original vote event for backward compatibility
        this.$emit('vote', { url: voteUrl, slider: slider, flag: flag });
    },
    store(contract, remove = false){
        const toSign = {
            type: "cja",
            cj: {
              items: [contract]
            },
            id: `spkccT_${!remove ? 'store' : 'remove'}`,
            msg: `Storing ${contract}...`,
            ops: ["getTokenUser"],
            api: "https://spktest.dlux.io",
            txid: `${contract}_${!remove ? 'store' : 'remove'}`,
          }
          this.$emit('tosign', toSign)
    },
    updateAPP(post, type = '360'){
        switch (type){
            case '360':
                post.json_metadata.vrHash = "QmZF2ZEZK8WBVUT7dnQyzA6eApLGnMXgNaJtWHFc3PCpqV"
                break;
            default:
                return
        }
        post.json_metadata.subApp = type
        const operations = [["comment",
        {
          "parent_author": post.parent_author,
          "parent_permlink": post.parent_permlink,
          "author": post.author,
          "permlink": post.permlink,
          "title": post.title,
          "body": post.body,
          "json_metadata": JSON.stringify(post.json_metadata)
        }]]
        console.log({operations})
        const toSign = {
            type: "raw",
            op: operations,
            key: `posting`,
            msg: `Updating...`,
            ops: ["checkAccount"],
            api: "https://api.hive.blog",
            txid: `Updating @${post.author}/${post.permlink}`,
          }
          this.$emit('tosign', toSign)
    },
    updateCost(id) {
        this.extendcost[id] = parseInt(this.contracts[id].extend * (this.contracts[id].p + (this.spread ? 1 : 0)) / (30 * 3) * this.contracts[id].r)
        this.$forceUpdate()
    },
    getContracts() {
        var contracts = [],
            getContract = (id) => {
                console.log({id})
                fetch('https://spktest.dlux.io/api/fileContract/' + id)
                    .then((r) => r.json())
                    .then((res) => {
                        res.result.extend = "7"
                        if (res.result) {
                            this.contracts[id] = res.result
                            this.extendcost[id] = parseInt(res.result.extend / 30 * res.result.r)
                        }
                    });
            }
        for (var contract in this.post.contract) {
            contracts.push(contract)
        }
        contracts = [...new Set(contracts)]
        for (var i = 0; i < contracts.length; i++) {
            getContract(contracts[i])
        }
    },
    timeSince(date) {
        var seconds = Math.floor((new Date() - new Date(date + ".000Z")) / 1000);
        var interval = Math.floor(seconds / 86400);
        if (interval > 7) {
            return new Date(date).toLocaleDateString();
        }
        if (interval >= 1) {
            return interval + ` day${interval > 1 ? "s" : ""} ago`;
        }
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
            return interval + ` hour${interval > 1 ? "s" : ""} ago`;
        }
        interval = Math.floor(seconds / 60);
        if (interval >= 1) {
            return `${interval} minute${interval > 1 ? "s" : ""} ago`;
        }
        return Math.floor(seconds) + " seconds ago";
    },
    setReply(event) {
        this.mde = event
    },
    reply(deets) {
        if (!deets) {
            deets = {
            "parent_author": this.post.author,
            "parent_permlink": this.post.permlink,
            "author": this.account,
            "permlink": 're-' + this.post.permlink,
            "title": '',
            "body": this.mde,
            "json_metadata": JSON.stringify(this.postCustom_json)
        }
            if (this.bens.length)deets.bens = this.bens
        }
        this.$emit('reply', deets)
    },
    comment(url){
        if(this.mde){
            var deets = {
                "parent_author": this.post.author,
                "parent_permlink": this.post.permlink,
                "author": this.account,
                "permlink": 're-' + this.post.permlink,
                "title": '',
                "body": this.mde,
                "json_metadata": JSON.stringify(this.postCustom_json)
            }
            if (this.bens.length)deets.bens = this.bens
            console.log({deets})
            this.$emit('reply', deets)
        }
    },
    broca_calc(last = '0,0') {
        if(!last)last='0,0'
        const last_calc = this.Base64toNumber(last.split(',')[1])
        const accured = parseInt((parseFloat(this.broca_refill) * (this.head_block - last_calc)) / (this.spk_power * 1000))
        var total = parseInt(last.split(',')[0]) + accured
        if (total > (this.spk_power * 1000)) total = (this.spk_power * 1000)
        return total
    },
    Base64toNumber(chars) {
        const glyphs =
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
        var result = 0;
        chars = chars.split("");
        for (var e = 0; e < chars.length; e++) {
          result = result * 64 + glyphs.indexOf(chars[e]);
        }
        return result;
    },
    formatNumber(t = 1, n, r, e) {
        if (typeof t != "number") {
            const parts = t ? t.split(" ") : []
            var maybe = 0
            for (i = 0; i < parts.length; i++) {
                if (parseFloat(parts[i]) > 0) {
                    maybe += parseFloat(parts[i])
                }
            }
            if (maybe > parseFloat(t)) {
                t = maybe
            } else {
                t = parseFloat(t)
            }
        }
        if (isNaN(t)) return "Invalid Number";
        if (!isFinite(t)) return (t < 0 ? "-" : "") + "infinite";
        (r = r || "."), (e = e || "");
        var u = t < 0;
        t = Math.abs(t);
        var a = (null != n && 0 <= n ? t.toFixed(n) : t.toString()).split("."),
            i = a[0],
            o = 1 < a.length ? r + a[1] : "";
        if (e)
            for (var c = /(\d+)(\d{3})/; c.test(i);)
                i = i.replace(c, "$1" + e + "$2");
        return (u ? "-" : "") + i + o;
    },
    gt(a, b) {
        return parseFloat(a) > parseFloat(b);
    },
    precision(num, precision) {
        return parseFloat(num / Math.pow(10, precision)).toFixed(precision);
    },
    toFixed(n, digits) {
        return parseFloat(n).toFixed(digits)
    },
    hideLowRep() {
        if (this.modalRep !== '...') {
            if (parseFloat(this.modalRep) < 25) {
                this.view = false;
                this.warn = true;
            }
        } else {
            setTimeout(this.hideLowRep, 1000)
        }
    },
    setRating(url, rating) {
        this.postCustom_json.review.rating = rating;
    },
    fancyBytes(bytes){
        var counter = 0, p = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
        while (bytes > 1024){
          bytes = bytes / 1024
          counter ++
        }
        return `${this.toFixed(bytes, 2)} ${p[counter]}B`
    },
    expIn(con){
        return `Expires in ${parseInt((parseInt(con.e.split(':')[0]) - this.head_block) / 20 / 60) < 24 ? parseInt((parseInt(con.e.split(':')[0]) - this.head_block) / 20 / 60) + ' hours' : parseInt((parseInt(con.e.split(':')[0]) - this.head_block) / 20 / 60 / 24) + ' days'}`
    },
    navigateToCommunity(community) {
        // Navigate to the community feed
        console.log(`Navigating to community: ${community}`);
        window.location.href = `/hub/#community/${community}`;
    },
    async navigateToParent() {
        // Navigate to the immediate parent post/comment
        if (!this.post.parent_author || !this.post.parent_permlink) return;
        
        try {
            // Use the modalSelect method to update the current view
            const parentUrl = `/@${this.post.parent_author}/${this.post.parent_permlink}`;
            
            // Update the URL and emit the event to load the parent post
            window.history.pushState("Parent Post", `${this.post.parent_author}/${this.post.parent_permlink}`, `/blog${parentUrl}`);
            this.$emit('modalselect', parentUrl);
        } catch (error) {
            console.error('Error navigating to parent:', error);
        }
    },
    async navigateToRootPost() {
        // Navigate to the root post (original post in the thread)
        if (!this.parentPost || !this.parentPost.parent_author || !this.parentPost.parent_permlink) {
            // If we don't have root post info, just navigate to parent
            this.navigateToParent();
            return;
        }
        
        try {
            const rootUrl = `/@${this.parentPost.parent_author}/${this.parentPost.parent_permlink}`;
            
            // Update the URL and emit the event to load the root post
            window.history.pushState("Root Post", `${this.parentPost.parent_author}/${this.parentPost.parent_permlink}`, `/blog${rootUrl}`);
            this.$emit('modalselect', rootUrl);
        } catch (error) {
            console.error('Error navigating to root post:', error);
        }
    },
    async loadParentPost() {
        // Load parent post data if this is a reply
        if (!this.isReply) return;
        
        try {
            const response = await fetch("https://api.hive.blog", {
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "method": "condenser_api.get_content",
                    "params": [this.post.parent_author, this.post.parent_permlink],
                    "id": 1
                }),
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
            });
            
            const data = await response.json();
            if (data.result && data.result.author) {
                this.parentPost = data.result;
                
                // If parent post also has a parent, load the root post
                if (this.parentPost.parent_author && this.parentPost.parent_permlink) {
                    this.loadRootPost();
                }
            }
        } catch (error) {
            console.error('Error loading parent post:', error);
        }
    },
    async loadRootPost() {
        // Load root post data if parent is also a comment
        if (!this.parentPost || !this.parentPost.parent_author || !this.parentPost.parent_permlink) return;
        
        try {
            const response = await fetch("https://api.hive.blog", {
                body: JSON.stringify({
                    "jsonrpc": "2.0",
                    "method": "condenser_api.get_content",
                    "params": [this.parentPost.parent_author, this.parentPost.parent_permlink],
                    "id": 1
                }),
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
            });
            
            const data = await response.json();
            if (data.result && data.result.author) {
                this.rootPost = data.result;
            }
        } catch (error) {
            console.error('Error loading root post:', error);
        }
    },
    handleReplySigning(op) {
        this.$emit('tosign', op);
    }
},
watch: {
    post: {
        handler() {
            this.updateModalReputation();
            this.hideLowRep();
            this.loadParentPost();
            try{
                if(this.post?.replies?.length != 0)this.first_replier_permlink = this.post.replies[0].permlink
            } catch (e) {}
        },
        deep: true,
        immediate: true
    }
},
mounted() {
    this.updateModalReputation();
    this.getModalAuthorReputation();
    this.hideLowRep();
    this.getContracts();
    this.loadParentPost();
},
};

