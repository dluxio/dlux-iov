import ChoicesVue from '/js/choices-vue.js';
import Pop from "/js/pop.js";
import Upload from '/js/upload-everywhere.js';
import VideoChoiceModal from '/js/video-choice-modal.js';
import VideoTranscoder from '/js/video-transcoder.js';
import common from './methods-common.js';
import spk from './methods-spk.js';
import watchers from './watchers-common.js';
import debugLogger from './utils/debug-logger.js';
import hlsDebug from './utils/hls-debug.js';
import VideoEnhancementMixin from './video-enhancement-mixin.js';

export default {
    mixins: [VideoEnhancementMixin],
    components: {
        "pop-vue": Pop,
        "choices-vue": ChoicesVue,
        "upload-everywhere": Upload,
        "video-transcoder": VideoTranscoder,
        "video-choice-modal": VideoChoiceModal
    },
    template: `<div ref="container" class="vfs-scroll-pass d-flex flex-grow-1 flex-column rounded">
    <!-- warning message -->
    <div v-if="computedData.usedBytes > computedData.availableBytes">
        <div class="alert alert-warning d-flex text-center text-lg-start flex-column flex-lg-row gap-2 gap-lg-3 align-items-center mb-3"
            role="alert">
            <i class="fa-solid fa-triangle-exclamation fa-fw text-warning m-1 fs-1"></i>
            <div class="d-flex flex-column">
                <p class="lead text-light">You are out of storage space! Power Up BROCA to increase your storage. </p>
                <p class="text-light">File pinning contracts may not renew when the initial 30 days expires due
                    to insufficient resource credits. Files that no longer have valid pinning contracts will be
                    garbage collected and removed. <a class="text-info no-decoration" href="#" data-bs-toggle="modal"
                        data-bs-target="#contractsModal">Power up Broca and turn on
                        auto-renew</a> for files you want to keep online.</p>
            </div>
            <div class="position-relative">
                <div class="text-center position-relative">
                    <div class="ratio ratio-1x1 wallet-token-img">
                        <div
                            class="rounded-circle border border-warning d-flex justify-content-center align-items-center bg-dark">
                            <img src="/img/tokens/broca_icon.png" class="rounded img-fluid p-1"
                                alt="BROCA Token Logo">
                        </div>
                    </div>
                    <div class="position-absolute badge-type-offset top-0 start-0 translate-middle">
                        <span
                            class="badge badge-type bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle">
                            <i class="fa-solid fa-bolt-lightning"></i>
                        </span>
                    </div>
                    <div class="position-absolute badge-perk-offset top-100 start-100 translate-middle">
                        <span
                            class="badge badge-perk bg-warning text-dark d-flex align-items-center justify-content-center rounded-circle">
                            <i class="fa-solid fa-hard-drive"></i>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- ACTION BAR -->
    <div class="d-flex flex-column justify-content-center border-bottom border-white-50">
    <small class="text-center mb-1 text-muted">Decentralized Storage For All Your Content</small>
        <div class="d-flex gap-2 flex-wrap align-items-start justify-content-center flex-grow-1 mb-1">
            <div class="d-flex flex-grow-1 flex-column">
                <!-- Search -->
                <div class="position-relative flex-grow-1 mb-1">
                    <span class="position-absolute top-50 translate-middle-y ps-2"><i
                            class="fa-solid fa-magnifying-glass fa-fw"></i></span>
                    <input @keyup="render()" @change="render()" @search="render()"
                        class="ps-4 pe-5 rounded-pill form-control border-0 bg-dark text-info" type="search"
                        placeholder="Search Drive" v-model="filesSelect.search" style="height: 50px;">
                    <a class="position-absolute top-50 end-0 translate-middle-y pe-4 me-1" data-bs-toggle="collapse"
                        href="#choicesCollapse" role="button" aria-expanded="false" aria-controls="choicesCollapse">
                        <i class="fa-solid fa-sliders fa-fw"></i>
                    </a>
                     <a class="position-absolute top-50 end-0 translate-middle-y pe-2 ms-1" data-bs-toggle="modal"
                    data-bs-target="#contractsModal" role="button">
                        <i class="fa-solid fa-chart-pie fa-fw"></i>
                    </a>
                </div>
                <div class="collapse" id="choicesCollapse">
                    <div class="d-flex gap-2 flex-grow-1 flex-wrap">
                        <!-- choices-js-->
                        <div class="mb-1 flex-fill">
                            <choices-vue ref="select-tag" :prop_selections="filterFlags" prop_function="search"
                                prop_type="tags" @data="handleTag($event)"></choices-vue>
                        </div>
                        <div class="mb-1 flex-fill">
                            <choices-vue ref="select-label" :prop_selections="filterLabels" prop_function="search"
                                prop_type="labels" @data="handleLabel($event)"></choices-vue>
                        </div>
                    </div>
                </div>
            </div>

            <div class="d-flex mb-1 flex-wrap align-items-center d-none">
                <!-- storage widget -->
                <a class="ms-auto d-flex align-items-center btn btn-dark" data-bs-toggle="modal"
                    data-bs-target="#contractsModal">
                    <div class="spk-widg">
                        <div class="d-flex flex-column">
                            <div class="d-none mb-1 fw-light text-center" style="font-size: 1.1rem !important;"
                                v-if="saccountapi">{{fancyBytes(computedData.usedBytes)}} of
                                {{fancyBytes(computedData.availableBytes)}} used
                            </div>
                            <div class="progress bg-dark-4" role="progressbar" aria-label="Basic example"
                                aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" style="min-width: 100px;">
                                <div class="progress-bar"
                                    :style="'width:' + (computedData.usedBytes && computedData.availableBytes ? (computedData.usedBytes/computedData.availableBytes)*100 : 0) + '%;'">
                                    {{formatNumber((computedData.usedBytes && computedData.availableBytes ?
                                    (computedData.usedBytes/computedData.availableBytes)*100 :
                                    0),'2','.',',')}}%</div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <i class="fa-solid fa-angle-down fa-fw ms-2"></i>
                    </div>
                </a>
            </div>
        </div>

        <!-- Sort -->
        <div class="d-none dropdown ms-1 mb-1">
            <button class="btn btn-dark w-100" style="padding-top: 11px !important; padding-bottom: 11px !important;"
                type="button" data-bs-toggle="dropdown" aria-expanded="false"><i
                    class="fa-solid fa-sort fa-fw ms-1"></i>
                {{filesSelect.sort.charAt(0).toUpperCase() + filesSelect.sort.slice(1)}} {{filesSelect.dir ==
                'asc' ? 'Ascending' : 'Descending'}}
            </button>
            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end bg-black">
                <li>
                    <a @click="filesSelect.dir='asc';filesSelect.sort='time';render()"
                        class="dropdown-item d-flex align-items-center" role="button"><i
                            class="fa-solid fa-calendar-days fa-fw me-1"></i>Created<i
                            class="fa-solid fa-caret-up fa-fw ms-auto"></i></a>
                </li>
                <li>
                    <a @click="filesSelect.dir='dec';filesSelect.sort='time';render()"
                        class="dropdown-item d-flex align-items-center" role="button"><i
                            class="fa-solid fa-calendar-days fa-fw me-1"></i>Created<i
                            class="fa-solid fa-caret-down fa-fw ms-auto"></i></a>
                </li>
                <li>
                    <hr class="dropdown-divider">
                </li>
                <li>
                    <a @click="filesSelect.dir='asc';filesSelect.sort='exp';render()"
                        class="dropdown-item d-flex align-items-center" role="button"><i
                            class="fa-solid fa-clock fa-fw me-1"></i><span class="me-1">Expiration</span><i
                            class="fa-solid fa-caret-up fa-fw ms-auto"></i></a>
                </li>
                <li>
                    <a @click="filesSelect.dir='dec';filesSelect.sort='exp';render()"
                        class="dropdown-item d-flex align-items-center" role="button"><i
                            class="fa-solid fa-clock fa-fw me-1"></i><span class="me-1">Expiration</span><i
                            class="fa-solid fa-caret-down fa-fw ms-auto"></i></a>
                </li>
                <li>
                    <hr class="dropdown-divider">
                </li>
                <li>
                    <a @click="filesSelect.dir='asc';filesSelect.sort='size';render()"
                        class="dropdown-item d-flex align-items-center" role="button"><i
                            class="fa-solid fa-database fa-fw me-1"></i>Size<i
                            class="fa-solid fa-caret-up fa-fw ms-auto"></i></a>
                </li>
                <li>
                    <a @click="filesSelect.dir='dec';filesSelect.sort='size';render()"
                        class="dropdown-item d-flex align-items-center" role="button"><i
                            class="fa-solid fa-database fa-fw me-1"></i>Size<i
                            class="fa-solid fa-caret-down fa-fw ms-auto"></i></a>
                </li>
                <li>
                    <hr class="dropdown-divider">
                </li>
                <li>
                    <a @click="filesSelect.dir='dec';filesSelect.sort='name';render()"
                        class="dropdown-item d-flex align-items-center" role="button"><i
                            class="fa-solid fa-file fa-fw me-1"></i>Name<i
                            class="fa-solid fa-caret-up fa-fw ms-auto"></i></a>
                </li>
                <li>
                    <a @click="filesSelect.dir='asc';filesSelect.sort='name';render()"
                        class="dropdown-item d-flex align-items-center" role="button"><i
                            class="fa-solid fa-file fa-fw me-1"></i>Name<i
                            class="fa-solid fa-caret-down fa-fw ms-auto"></i></a>
                </li>
                <li>
                    <hr class="dropdown-divider">
                </li>
                <li>
                    <a @click="filesSelect.dir='asc';filesSelect.sort='type';render()"
                        class="dropdown-item d-flex align-items-center" role="button"><i
                            class="fa-solid fa-layer-group fa-fw me-1"></i>Type<i
                            class="fa-solid fa-caret-up fa-fw ms-auto"></i></a>
                </li>
                <li>
                    <a @click="filesSelect.dir='dec';filesSelect.sort='type';render()"
                        class="dropdown-item d-flex align-items-center" role="button"><i
                            class="fa-solid fa-layer-group fa-fw me-1"></i>Type<i
                            class="fa-solid fa-caret-down fa-fw ms-auto"></i></a>
                </li>

            </ul>
        </div>

    </div>
    
    <!-- Filesystem View -->
    <div class="d-flex flex-column flex-grow-1 flex-wrap vfs-scroll-pass">
        <h3 class="d-none">@{{ selectedUser }}</h3>

        <div class="d-flex flex-wrap w-100 my-2">
           
            <div class="d-flex flex-wrap gap-1 w-100">
                <div class="btn-group me-auto">
                <button class="btn btn-secondary"><upload-everywhere v-if="selectedUser == account" :account="account" :saccountapi="saccountapi"
                    :external-drop="droppedExternalFiles" @update:externalDrop="droppedExternalFiles = $event"
                    @tosign="sendIt($event)" @done="handleUploadDone($event)" teleportref="#UEController"
                    :video-handling-mode="'external'" /></button>
                <button type="button" class="btn btn-dark ms-0 me-0 ps-0 pe-0" disabled></button>
                <button class="btn btn-secondary" @click="createNewFolder"><i
                        class="fa-solid fa-folder-plus fa-fw"></i></button>
                
               </div>
               <div class="btn-group mx-auto">
                    <button class="btn btn-secondary" @click="refreshDrive" title="Refresh Drive"><i class="fa-solid fa-sync fa-fw"></i></button>
                    <button v-if="Object.keys(pendingChanges).length > 0" type="button" class="btn btn-dark ms-0 me-0 ps-0 pe-0" disabled></button>
                    <button v-if="Object.keys(pendingChanges).length > 0" class="btn btn-secondary" @click="saveChanges"><i class="fa-solid fa-save"></i></button>
                    <button v-if="Object.keys(pendingChanges).length > 0" type="button" class="btn btn-dark ms-0 me-0 ps-0 pe-0" disabled></button>
                    <button v-if="Object.keys(pendingChanges).length > 0" class="btn btn-secondary" @click="revertPendingChanges"><i class="fa-solid fa-undo"></i></button>
                </div>
                <div class="btn-group ms-auto">
                    <button class="btn" :class="viewOpts.fileView === 'grid' ? 'btn-primary' : 'btn-secondary'"
                        @click="viewOpts.fileView = 'grid'"><i class="fa-solid fa-th-large"></i></button>
                    <button class="btn" :class="viewOpts.fileView === 'list' ? 'btn-primary' : 'btn-secondary'"
                        @click="viewOpts.fileView = 'list'"><i class="fa-solid fa-list"></i></button>
                </div>

                </div>
        </div>
        <div class="vfs-scroll" v-show="processingFiles.length > 0 || uploadActive">
            <!-- Video Processing Section -->
            <div v-if="processingFiles.length > 0" class="mb-3 border-bottom pb-3">
                <h5 class="mb-2">
                    <i class="fa-solid fa-gear fa-spin me-2"></i>
                    Processing Files
                </h5>
                <div class="d-flex flex-column g-2">
                    <div v-for="pFile in processingFiles" :key="pFile.id" class="">
                        <div class="card bg-dark border-secondary">
                            <div class="card-body p-3">
                                <div class="d-flex align-items-start mb-2">
                                    <i class="fa-solid fa-video text-primary me-2 mt-1"></i>
                                    <div class="flex-grow-1 text-truncate">
                                        <h6 class="mb-0 text-truncate">{{ pFile.fileName }}</h6>
                                        <small class="text-muted">{{ fancyBytes(pFile.fileSize) }}</small>
                                    </div>
                                </div>
                                
                                <!-- Progress Bar -->
                                <div v-if="pFile.status === 'transcoding'" class="mb-2">
                                    <div class="progress" style="height: 10px;">
                                        <div class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                                            :style="'width: ' + pFile.progress + '%'">
                                        </div>
                                    </div>
                                    <small class="text-muted">
                                        Transcoding... {{ pFile.progress }}%
                                        <span v-if="pFile.message" class="ms-1">{{ pFile.message }}</span>
                                    </small>
                                </div>
                                
                                <!-- Queued State -->
                                <div v-else-if="pFile.status === 'queued'" class="mb-2">
                                    <div class="progress" style="height: 10px;">
                                        <div class="progress-bar bg-secondary" style="width: 100%"></div>
                                    </div>
                                    <small class="text-muted">
                                        <i class="fa-solid fa-clock me-1"></i>
                                        Waiting in queue...
                                    </small>
                                </div>
                                
                                <!-- Failed State -->
                                <div v-else-if="pFile.status === 'failed'" class="text-danger mb-2">
                                    <i class="fa-solid fa-exclamation-circle me-1"></i>
                                    <small>{{ pFile.error || 'Transcoding failed' }}</small>
                                </div>
                                
                                <!-- Complete State -->
                                <div v-else-if="pFile.status === 'complete'" class="text-success mb-2">
                                    <i class="fa-solid fa-check-circle me-1"></i>
                                    <small>Ready to upload</small>
                                </div>
                                
                                
                                <!-- Action Buttons -->
                                <div class="d-flex gap-2 mt-2 align-items-center">
                                    <!-- Info message for active transcoding -->
                                    <small v-if="pFile.status === 'transcoding'" class="text-muted">
                                        <i class="fa-solid fa-info-circle me-1"></i>Cannot cancel once started
                                    </small>
                                    
                                    <!-- Retry button for failed states only -->
                                    <button v-if="pFile.status === 'failed'" 
                                            @click="retryProcessing(pFile.id)"
                                            class="btn btn-sm btn-primary">
                                        <i class="fa-solid fa-redo me-1"></i>Retry
                                    </button>
                                    
                                    <!-- Delete button - only show when not transcoding -->
                                    <button v-if="pFile.status !== 'transcoding'"
                                            @click="deleteProcessingFile(pFile.id)"
                                            class="btn btn-sm btn-danger"
                                            title="Remove from queue">
                                        <i class="fa-solid fa-trash me-1"></i>Delete
                                    </button>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Upload Everywhere Controller -->
            <div id="UEController"></div>
        </div>
        <!-- Warning Box for Trash Folder -->
        <div v-if="currentFolderPath === 'Trash'" class="alert alert-warning d-flex align-items-center my-2"
            role="alert">
            <i class="fa-solid fa-triangle-exclamation fa-fw me-2 fs-1 text-warning"></i>
            <p class="mb-0 lead">Files in Trash will be permanently deleted after their deletion date.</p>
        </div>
        <!-- breadcrumb -->
        <div  class="breadcrumb d-flex align-items-center w-100 rounded-top bg-darkg mb-0">
        <span @click="navigateTo('')" @dragover.prevent="dragOverBreadcrumb($event)"
            @drop="dropOnBreadcrumb('', $event)" @dragenter="handleDragEnterBreadcrumb($event, '')"
            @dragleave="handleDragLeave($event)" class="breadcrumb-item px-2 py-1 me-1"
            style="cursor: pointer; border-radius: 4px;">
            <i class="fa-fw fa-solid fa-hard-drive me-1"></i>IPFS Drive

            <!-- Added: Search result count for root -->
            <span v-if="breadcrumbCounts && breadcrumbCounts[''] > 0" class="badge bg-info ms-1">{{ breadcrumbCounts['']
                }}</span>
        </span>
        <span class="mx-1" v-if="currentFolderPath">/</span>
        <template v-for="(part, index) in currentFolderPath.split('/').filter(Boolean)" :key="index">
            <span @click="navigateTo(currentFolderPath.split('/').slice(0, index + 1).join('/'))"
                @dragover.prevent="dragOverBreadcrumb($event)"
                @drop="dropOnBreadcrumb(currentFolderPath.split('/').slice(0, index + 1).join('/'), $event)"
                @dragenter="handleDragEnterBreadcrumb($event, currentFolderPath.split('/').slice(0, index + 1).join('/'))"
                @dragleave="handleDragLeave($event)" class="breadcrumb-item px-2 py-1 mx-1"
                style="cursor: pointer; border-radius: 4px;">{{ part }}
                <!-- Added: Search result count for this folder level -->
                <span
                    v-if="breadcrumbCounts && breadcrumbCounts[currentFolderPath.split('/').slice(0, index + 1).join('/')] > 0"
                    class="badge bg-info ms-1">{{ breadcrumbCounts[currentFolderPath.split('/').slice(0, index +
                    1).join('/')] }}</span>
            </span>
            <span class="mx-1">/</span>
        </template>
    </div>
        <!-- Search Results -->
        <div v-if="filesSelect.search" class="table-responsive vfs-scroll">
            <table class="table table-dark table-striped table-hover">
                <thead>
                    <tr>
                        <th>Preview</th>
                        <th>Filename</th>
                        <th>Owner</th>
                        <th>Size</th>
                        <th>{{ currentFolderPath === 'Trash' ? 'Deletion Date' : 'Labels & Tags' }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="file in filesArray" :key="file.f" :class="{ 'table-primary': isFileSelected(file) }"
                        draggable="true" @dragstart="dragStartItem($event, file, 'file')"
                        @click="handleFileClick($event, file)"
                        @contextmenu.prevent.stop="showContextMenu($event, 'file', file)">
                        <td>
                            <img v-if="newMeta[file.i][file.f].thumb && newMeta[file.i][file.f].thumb_loaded && isValidThumb(newMeta[file.i][file.f].thumb_data)"
                                :src="isValidThumb(newMeta[file.i][file.f].thumb_data)" class="img-fluid" width="50" />
                            <div v-else-if="newMeta[file.i][file.f].thumb && !newMeta[file.i][file.f].thumb_loaded" 
                                class="d-flex align-items-center justify-content-center" 
                                style="width: 50px; height: 50px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                                <i class="fa-solid fa-spinner fa-spin" style="color: #adb5bd;"></i>
                            </div>
                            <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg"
                                xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 800 800"
                                style="enable-background:new 0 0 800 800;" xml:space="preserve" width="50">
                                <g>
                                    <path class="st0"
                                        d="M650,210H500c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10s10,4.5,10,10v140h140c5.5,0,10,4.5,10,10S555.5,210,550,210z" />
                                    <path class="st0" d="M650,309.7c-5.5,0-10-4.5-10-10v-95.5L495.9,60H200c-22.1,0-40,17.9-40,40v196.3c0,5.5-4.5,10-10,10 s-10-4.5-10-10V100c0-33.1,26.9-60,60-60h300c2.7,0,5.2,1,7.1,2.9l150,150c1.9,1.9,2.9,4.4,2.9,7.1v99.7
                                C660,305.2,655.5,309.7,650,309.7z" />
                                    <path class="st0"
                                        d="M600,760H200c-33.1,0-60-26.9-60-60V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150c0,22.1,17.9,40,40,40h400
                                c22.1,0,40-17.9,40-40V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150C660,733.1,633.1,760,600,760z" />
                                    <path class="st0"
                                        d="M550,560H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h300c5.5,0,10,4.5,10,10S555.5,560,550,560z" />
                                    <path class="st0"
                                        d="M400,660H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h150c5.5,0,10,4.5,10,10S405.5,660,400,660z" />
                                    <path class="st0"
                                        d="M650,560H150c-33.1,0-60-26.9-60-60l0,0V346.3c0-33.1,26.9-60,60-60l0,0h0.4l500,3.3
                                c32.9,0.3,59.5,27.1,59.6,60V500C710,533.1,683.2,560,650,560C650,560,650,560,650,560z M150,306.3c-22.1,0-40,17.9-40,40V500
                                c0,22.1,17.9,40,40,40h500c22.1,0,40-17.9,40-40V349.7c-0.1-22-17.8-39.8-39.8-40l-500-3.3H150z" />
                                    <text transform="matrix(1 0 0 1 233.3494 471.9725)" class="st1 st2"
                                        style="text-transform: uppercase; font-size: 149px;">{{newMeta[file.i][file.f].type}}</text>
                                </g>
                            </svg>
                        </td>
                        <td>{{ newMeta[file.i][file.f].name || file.f }}</td>
                        <td>@{{ file.o }}</td>
                        <td>{{ fancyBytes(file.s) }}</td>
                        <td>
                            <div v-if="currentFolderPath !== 'Trash'"
                                class="d-flex flex-wrap align-items-center justify-content-center">
                                <!-- colors -->
                                <div v-if="file.lc" class="d-flex me-1 align-items-center" style="margin-left: 15px">
                                    <i v-for="(color, num) in labelsDecode(file.lc)" :class="color.fa"
                                        :style="'margin-left: ' + -15 +'px !important;'"></i>
                                </div>
                                <!-- labels -->
                                <div class="me-1" v-for="label in labelsDecode(file.l)">
                                    <span class="d-flex align-items-center">
                                        <pop-vue :id="'popperL-' + file.i + file.index + label.l + (cc ? 'cc' : '')"
                                            :title="label.l" trigger="hover">
                                            <i :class="label.fa"></i>
                                        </pop-vue>
                                    </span>
                                </div>
                                <!-- flags -->
                                <div class="d-flex align-items-center">
                                    <div v-for="flag in flagsDecode(newMeta[file.i][file.f].flags, 0, 3)">
                                        <!-- title="Labels"  -->
                                        <pop-vue :id="'popper-' + file.i + file.index + flag.l + (cc ? 'cc' : '')"
                                            :title="flag.l" trigger="hover">
                                            <i :class="flag.fa"></i>
                                        </pop-vue>
                                    </div>
                                </div>
                                <div>
                                    <pop-vue v-if="licenses[file.lic]" v-for="lic in licenses[file.lic].fa"
                                        :id="'popper-Lic' + (cc ? 'cc' : '') + file.i + file.index + file.lic"
                                        :title="lic.l" trigger="hover">
                                        <i :class="lic.fa"></i>
                                    </pop-vue>
                                </div>
                            </div>
                            <div v-else>
                                <p class="text-muted">This file will be deleted on {{ blockToTime(file.e) }}</p>
                            </div>
                        </td>
                    </tr>
                    <!-- Empty state row for table view -->
                    <tr
                        v-if="getSubfolders(selectedUser, currentFolderPath).length === 0 && getFiles(selectedUser, currentFolderPath).length === 0">
                        <td colspan="5" class="text-center p-5">
                            <div class="text-muted">
                                <i class="fa-solid fa-folder-
                                 fa-2x mb-3"></i>
                                <p>This folder is empty. Drag and drop files here or create a new folder.</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

       
    
        <!-- Files -->
        <div v-if="!filesSelect.search" class="d-flex flex-grow-1 vfs-scroll-pass">
            <div class="d-flex flex-grow-1 vfs-scroll rounded-bottom" @contextmenu.prevent="showContextMenu($event, 'background', null)"
                @dragover="dragOverBackground($event)" @drop="dropOnBackground($event)"
                @mousedown="startSelectionBox($event)" @mousemove="updateSelectionBox($event)"
                @mouseup="endSelectionBox" 
                style="background-color:rgba(0, 0, 0, 0.2); position: relative; min-height: 200px; border: 2px solid rgba(0, 0, 0, 0);">
                 <!-- count folders files -->
            <div class="d-flex align-items-center justify-content-center mx-1">
                <!-- Added: Search results explanation -->
                <small v-if="filesSelect.search || filterLabels || filterFlags > 0" class="mb-0 text-muted text-center">
                    <span class="text-info">Search results:</span> {{filesArray.length}} File{{filesArray.length > 1 ?
                    's' :
                    ''}}
                    <span v-if="currentFolderPath" class="text-muted small"> in "{{ currentFolderPath }}" and
                        subfolders</span>
                </small>
                <small v-else-if="viewOpts.view === 'grid' || viewOpts.view === 'list'" class="mb-0 text-muted text-center">{{filesArray.length}}
                    File{{filesArray.length > 1 ? 's' : ''}}</small>
                <small v-else class="mb-0 text-muted text-center">{{ getSubfolderCount }} Folder{{ getSubfolderCount === 1 ? '' : 's' }} & {{
                    currentFileCount }} File{{ currentFileCount === 1 ? '' : 's' }}</small>
            </div>

                <div v-if="viewOpts.fileView === 'grid'" class="d-flex flex-grow-1 flex-wrap">
                    <div v-for="folder in getSubfolders(selectedUser, currentFolderPath)" :key="folder.path"
                        class="file-grid m-2 p-2 rounded text-center"
                        :class="{ 'bg-dark': !isFolderSelected(folder), 'bg-primary': isFolderSelected(folder) }"
                        :data-key="folder.path" :data-is-preset="folder.isPreset ? 'true' : null" :data-type="'folder'"
                        draggable="true" @dragstart="dragStartItem($event, folder, 'folder')"
                        @dblclick="navigateTo(folder.path)" @click="handleFolderClick($event, folder)"
                        @contextmenu.prevent.stop="showContextMenu($event, 'folder', folder)"
                        @dragover="dragOverFolder($event)" @drop="dropOnFolder($event, folder)"
                        @dragenter="handleDragEnterFolder($event, folder)" @dragleave="handleDragLeave($event)"
                        style="width: 120px; height: 120px; position: relative; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.2); cursor: pointer;"
                        @mouseenter="$event.currentTarget.style.transform = 'translateY(-3px)'; $event.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'; $event.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'"
                        @mouseleave="$event.currentTarget.style.transform = ''; $event.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'; $event.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'">
                        <div class="d-flex align-items-center justify-content-center"
                            style="height: 70px; width: 100%;">
                            <i class="fa-solid fa-folder fa-3x" style="color: #ffd166;"></i>
                        </div>
                        <div class="text-truncate pb-1" style="max-width: 110px; font-size: 0.9rem;">{{ folder.name }}
                        </div>
                    </div>
                    <div v-for="file in getFiles(selectedUser, currentFolderPath)" :key="file.f"
                        class="file-grid m-2 p-2 rounded text-center" :class="{ 'bg-primary': isFileSelected(file) }"
                        :data-key="file.f" :data-type="'file'" :data-file-id="file.f" draggable="true"
                        @dragstart="dragStartItem($event, file, 'file')" @click="handleFileClick($event, file)"
                        @contextmenu.prevent.stop="showContextMenu($event, 'file', file)"
                        style="width: 120px; height: 120px; position: relative; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.2); cursor: pointer;"
                        @mouseenter="$event.currentTarget.style.transform = 'translateY(-3px)'; $event.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'; $event.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'"
                        @mouseleave="$event.currentTarget.style.transform = ''; $event.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'; $event.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'">
                        <div class="file-icon-container d-flex align-items-center justify-content-center"
                            style="height: 70px; width: 100%;">
                            <img v-if="newMeta[file.i][file.f].thumb && newMeta[file.i][file.f].thumb_loaded && isValidThumb(newMeta[file.i][file.f].thumb_data)"
                                :src="isValidThumb(newMeta[file.i][file.f].thumb_data)" class="img-fluid"
                                style="max-height: 70px; max-width: 100%; object-fit: contain;" />
                            <div v-else-if="newMeta[file.i][file.f].thumb && !newMeta[file.i][file.f].thumb_loaded" 
                                class="d-flex align-items-center justify-content-center" 
                                style="height: 70px; width: 100%; background: rgba(255,255,255,0.1); border-radius: 4px;">
                                <i class="fa-solid fa-spinner fa-spin fa-2x" style="color: #adb5bd;"></i>
                            </div>
                            <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg"
                                xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 800 800"
                                style="enable-background:new 0 0 800 800;" xml:space="preserve" width="70">
                                <g>
                                    <path class="st0"
                                        d="M650,210H500c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10s10,4.5,10,10v140h140c5.5,0,10,4.5,10,10 S655.5,210,650,210z" />
                                    <path class="st0"
                                        d="M650,309.7c-5.5,0-10-4.5-10-10v-95.5L495.9,60H200c-22.1,0-40,17.9-40,40v196.3c0,5.5-4.5,10-10,10 s-10-4.5-10-10V100c0-33.1,26.9-60,60-60h300c2.7,0,5.2,1,7.1,2.9l150,150c1.9,1.9,2.9,4.4,2.9,7.1v99.7 C660,305.2,655.5,309.7,650,309.7z" />
                                    <path class="st0"
                                        d="M600,760H200c-33.1,0-60-26.9-60-60V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150c0,22.1,17.9,40,40,40h400 c22.1,0,40-17.9,40-40V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150C660,733.1,633.1,760,600,760z" />
                                    <path class="st0"
                                        d="M550,560H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h300c5.5,0,10,4.5,10,10S555.5,560,550,560z" />
                                    <path class="st0"
                                        d="M400,660H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h150c5.5,0,10,4.5,10,10S405.5,660,400,660z" />
                                    <path class="st0"
                                        d="M650,560H150c-33.1,0-60-26.9-60-60l0,0V346.3c0-33.1,26.9-60,60-60l0,0h0.4l500,3.3 c32.9,0.3,59.5,27.1,59.6,60V500C710,533.1,683.2,560,650,560C650,560,650,560,650,560z M150,306.3c-22.1,0-40,17.9-40,40V500
                                c0,22.1,17.9,40,40,40h500c22.1,0,40-17.9,40-40V349.7c-0.1-22-17.8-39.8-39.8-40l-500-3.3H150z" />
                                    <text transform="matrix(1 0 0 1 233.3494 471.9725)" class="st1 st2"
                                        style="text-transform: uppercase; font-size: 149px;">{{newMeta[file.i][file.f].type}}</text>
                                </g>
                            </svg>
                        </div>
                        <div class="text-truncate pb-1" style="max-width: 110px; font-size: 0.9rem;">{{
                            newMeta[file.i][file.f].name || file.f }}</div>
                        <div v-if="flagsDecode(newMeta[file.i][file.f].flags, 1).length"
                            class="position-absolute bottom-0 end-0 bg-dark rounded-circle p-1" style="margin: 2px;">
                            <i class="fa-solid fa-lock fa-sm"></i>
                        </div>
                        <!-- Streaming badge for m3u8 files -->
                        <div v-if="isStreamableVideo(file.f)"
                            class="position-absolute top-0 end-0 bg-success rounded-circle p-1" style="margin: 2px;">
                            <i class="fa-solid fa-play fa-sm text-white"></i>
                        </div>
                    </div>

                    <!-- Empty state for grid view -->
                    <div v-if="getSubfolders(selectedUser, currentFolderPath).length === 0 && getFiles(selectedUser, currentFolderPath).length === 0"
                        class="w-100 text-center p-5 d-flex flex-column align-items-center justify-content-center"
                        style="min-height: 180px;">
                        <div v-if="currentFolderPath === 'Trash'">
                            <i class="fa-solid fa-trash fa-3x mb-3" style="color: #adb5bd;"></i>
                            <p class="text-muted">The trash is empty.</p>
                        </div>
                        <div v-if="currentFolderPath != 'Trash'">
                            <i class="fa-solid fa-folder-open fa-3x mb-3" style="color: #adb5bd;"></i>
                            <p class="text-muted">This folder is empty. Drag and drop files here or create a new folder.
                            </p>
                            <div class="d-flex flex-wrap align-items-center justify-content-center gap-2">
                                <!-- <upload-everywhere class="my-2" v-if="selectedUser == account" :account="account"
                                    :saccountapi="saccountapi" :external-drop="droppedExternalFiles"
                                    @update:externalDrop="droppedExternalFiles = $event" @tosign="sendIt($event)"
                                    @done="handleUploadDone($event)" teleportref="#UEController" /> -->
                                <button class="btn btn-outline-secondary btn-sm my-2" @click="createNewFolder">
                                    <i class="fa-solid fa-folder-plus me-1"></i>New Folder
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="table-responsive">
                    <table class="table table-dark table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Preview</th>
                                <th>Filename</th>
                                <th>Owner</th>
                                <th>Size</th>
                                <th>{{ currentFolderPath === 'Trash' ? 'Deletion Date' : 'Labels & Tags' }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="folder in getSubfolders(selectedUser, currentFolderPath)"
                                :key="'folder-' + folder.path" class="folder-row" :data-key="folder.path"
                                :data-type="'folder'" :data-is-preset="folder.isPreset ? 'true' : null" draggable="true"
                                @dragstart="dragStartItem($event, folder, 'folder')" @dblclick="navigateTo(folder.path)"
                                @click="handleFolderClick($event, folder)"
                                @contextmenu.prevent.stop="showContextMenu($event, 'folder', folder)"
                                @dragover="dragOverFolder($event)" @drop="dropOnFolder($event, folder)"
                                @dragenter="handleDragEnterFolder($event, folder)" @dragleave="handleDragLeave($event)">
                                <td><i class="fa-solid fa-folder"></i></td>
                                <td>{{ folder.name }}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                            <tr v-for="file in getFiles(selectedUser, currentFolderPath)" :key="file.f"
                                :class="{ 'table-primary': isFileSelected(file) }" draggable="true"
                                @dragstart="dragStartItem($event, file, 'file')" @click="handleFileClick($event, file)"
                                @contextmenu.prevent.stop="showContextMenu($event, 'file', file)">
                                <td>
                                    <img v-if="newMeta[file.i][file.f].thumb && newMeta[file.i][file.f].thumb_loaded && isValidThumb(newMeta[file.i][file.f].thumb_data)"
                                        :src="isValidThumb(newMeta[file.i][file.f].thumb_data)" class="img-fluid"
                                        width="50" />
                                    <div v-else-if="newMeta[file.i][file.f].thumb && !newMeta[file.i][file.f].thumb_loaded" 
                                        class="d-flex align-items-center justify-content-center" 
                                        style="width: 50px; height: 50px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                                        <i class="fa-solid fa-spinner fa-spin" style="color: #adb5bd;"></i>
                                    </div>
                                    <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg"
                                        xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 800 800"
                                        style="enable-background:new 0 0 800 800;" xml:space="preserve" width="50">
                                        <g>
                                            <path class="st0"
                                                d="M650,210H500c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10s10,4.5,10,10v140h140c5.5,0,10,4.5,10,10S555.5,210,550,210z" />
                                            <path class="st0" d="M650,309.7c-5.5,0-10-4.5-10-10v-95.5L495.9,60H200c-22.1,0-40,17.9-40,40v196.3c0,5.5-4.5,10-10,10 s-10-4.5-10-10V100c0-33.1,26.9-60,60-60h300c2.7,0,5.2,1,7.1,2.9l150,150c1.9,1.9,2.9,4.4,2.9,7.1v99.7
                                        C660,305.2,655.5,309.7,650,309.7z" />
                                            <path class="st0"
                                                d="M600,760H200c-33.1,0-60-26.9-60-60V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150c0,22.1,17.9,40,40,40h400
                                        c22.1,0,40-17.9,40-40V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150C660,733.1,633.1,760,600,760z" />
                                            <path class="st0"
                                                d="M550,560H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h300c5.5,0,10,4.5,10,10S555.5,560,550,560z" />
                                            <path class="st0"
                                                d="M400,660H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h150c5.5,0,10,4.5,10,10S405.5,660,400,660z" />
                                            <path class="st0"
                                                d="M650,560H150c-33.1,0-60-26.9-60-60l0,0V346.3c0-33.1,26.9-60,60-60l0,0h0.4l500,3.3
                                        c32.9,0.3,59.5,27.1,59.6,60V500C710,533.1,683.2,560,650,560C650,560,650,560,650,560z M150,306.3c-22.1,0-40,17.9-40,40V500
                                        c0,22.1,17.9,40,40,40h500c22.1,0,40-17.9,40-40V349.7c-0.1-22-17.8-39.8-39.8-40l-500-3.3H150z" />
                                            <text transform="matrix(1 0 0 1 233.3494 471.9725)" class="st1 st2"
                                                style="text-transform: uppercase; font-size: 149px;">{{newMeta[file.i][file.f].type}}</text>
                                        </g>
                                    </svg>
                                </td>
                                <td>{{ newMeta[file.i][file.f].name || file.f }}</td>
                                <td>@{{ file.o }}</td>
                                <td>{{ fancyBytes(file.s) }}</td>
                                <td>
                                    <div v-if="currentFolderPath !== 'Trash'"
                                        class="d-flex flex-wrap align-items-center justify-content-center">
                                        <!-- colors -->
                                        <div v-if="file.lc" class="d-flex me-1 align-items-center"
                                            style="margin-left: 15px">
                                            <i v-for="(color, num) in labelsDecode(file.lc)" :class="color.fa"
                                                :style="'margin-left: ' + -15 +'px !important;'"></i>
                                        </div>
                                        <!-- labels -->
                                        <div class="me-1" v-for="label in labelsDecode(file.l)">
                                            <span class="d-flex align-items-center">
                                                <pop-vue
                                                    :id="'popperL-' + file.i + file.index + label.l + (cc ? 'cc' : '')"
                                                    :title="label.l" trigger="hover">
                                                    <i :class="label.fa"></i>
                                                </pop-vue>
                                            </span>
                                        </div>
                                        <!-- flags -->
                                        <div class="d-flex align-items-center">
                                            <div v-for="flag in flagsDecode(newMeta[file.i][file.f].flags, 0, 3)">
                                                <!-- title="Labels"  -->
                                                <pop-vue
                                                    :id="'popper-' + file.i + file.index + flag.l + (cc ? 'cc' : '')"
                                                    :title="flag.l" trigger="hover">
                                                    <i :class="flag.fa"></i>
                                                </pop-vue>
                                            </div>
                                        </div>
                                        <div>
                                            <pop-vue v-if="licenses[file.lic]" v-for="lic in licenses[file.lic].fa"
                                                :id="'popper-Lic' + (cc ? 'cc' : '') + file.i + file.index + file.lic"
                                                :title="lic.l" trigger="hover">
                                                <i :class="lic.fa"></i>
                                            </pop-vue>
                                        </div>
                                        <!-- Streaming badge for m3u8 files -->
                                        <div v-if="isStreamableVideo(file.f)">
                                            <pop-vue 
                                                :id="'popper-Stream' + file.i + file.index"
                                                title="Streaming Video" trigger="hover">
                                                <i class="fa-solid fa-play-circle text-success"></i>
                                            </pop-vue>
                                        </div>
                                    </div>
                                    <div v-else>
                                        <p class="text-muted">This file will be deleted on {{ blockToTime(file.e) }}</p>
                                    </div>
                                </td>
                            </tr>
                            <!-- Empty state row for table view -->
                            <tr
                                v-if="getSubfolders(selectedUser, currentFolderPath).length === 0 && getFiles(selectedUser, currentFolderPath).length === 0">
                                <td colspan="5" class="text-center p-5">
                                    <div class="text-muted">
                                        <i class="fa-solid fa-folder-open fa-2x mb-3"></i>
                                        <p>This folder is empty. Drag and drop files here or create a new folder.</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <!-- Save Changes Footer -->
    <div v-if="Object.keys(pendingChanges).length > 0" class="border-top bg-dark mt-3 p-3 d-flex justify-content-end">
        <button class="btn btn-warning me-2" @click="saveChanges" :disabled="updatesPayloadTooLarge"
            :title="updatesPayloadTooLarge ? 'Payload size exceeds the maximum allowed size (7500 bytes)' : ''">
            Save Changes ({{ Object.keys(pendingChanges).length }} contracts, ~{{ Math.round(updatesPayloadSize / 1024 *
            10)
            / 10 }}KB)
            <span v-if="updatesPayloadTooLarge" class="text-danger ms-1">
                <i class="fa-solid fa-exclamation-triangle"></i>
            </span>
        </button>
        <button class="btn btn-secondary" @click="revertPendingChanges">Revert Pending Changes</button>
    </div>
    <!-- Context menu -->
    <Teleport to="body">
        <div v-if="contextMenu.show" @click.stop
            :style="{ position: 'fixed', left: contextMenu.x + 'px', top: contextMenu.y + 'px', zIndex: 1000 }"
            class="dropdown ">
            <ul class="dropdown-menu dropdown-menu-dark bg-dark border-dark bg-img-none show">
                <!-- Background Options -->
                <li v-if="contextMenu.type === 'background' && selectedUser === account">
                    <a class="dropdown-item py-1" href="#" @click="createNewFolder(); hideContextMenu();">
                        New Folder
                    </a>
                </li>
                <!-- File Options -->
                <li v-if="contextMenu.type === 'file' && isEditable(contextMenu.item)">
                    <a class="dropdown-item py-1" href="#"
                        @click="renameItem(contextMenu.item, 'file'); hideContextMenu();">
                        Rename File
                    </a>
                </li>
                <!-- Changed: Conditionally show Move to Trash -->
                <li v-if="contextMenu.type === 'file' && isEditable(contextMenu.item) && currentFolderPath !== 'Trash'">
                    <a class="dropdown-item py-1" href="#" @click="deleteFile(contextMenu.item); hideContextMenu();">
                        Move to Trash
                    </a>
                </li>
                <!-- Added: Restore option for Trash -->
                <li v-if="contextMenu.type === 'file' && isEditable(contextMenu.item) && currentFolderPath === 'Trash'">
                    <a class="dropdown-item py-1" href="#" @click="restoreFile(contextMenu.item); hideContextMenu();">
                        Restore File
                    </a>
                </li>
                <li v-if="contextMenu.type === 'file' && isEditable(contextMenu.item)" class="dropdown-divider"></li>
                <li v-if="contextMenu.type === 'file' && isEditable(contextMenu.item)">
                    <a class="dropdown-item py-1" href="#"
                        @click="openMetadataEditor(contextMenu.item); hideContextMenu();">
                        Edit Metadata
                    </a>
                </li>
                <li v-if="contextMenu.type === 'file'" class="dropdown-divider"></li>
                <li
                    v-if="contextMenu.type === 'file' && flagsDecode(newMeta[contextMenu.item.i][contextMenu.item.f].flags, 1).length && !contract[contextMenu.item.i].encryption.key">
                    <a class="dropdown-item py-1" href="#" @click="decryptFile(contextMenu.item); hideContextMenu();">
                        Decrypt File
                    </a>
                </li>
                <li
                    v-if="contextMenu.type === 'file' && ( !flagsDecode(newMeta[contextMenu.item.i][contextMenu.item.f].flags, 1).length || (flagsDecode(newMeta[contextMenu.item.i][contextMenu.item.f].flags, 1).length && contract[contextMenu.item.i].encryption.key))">
                    <a class="dropdown-item py-1" href="#" @click="downloadFile(contextMenu.item); hideContextMenu();">
                        Download File
                    </a>
                </li>
                <!-- Folder Options -->
                <li v-if="contextMenu.type === 'folder' && isEditableFolder(contextMenu.item)">
                    <a class="dropdown-item py-1" href="#"
                        @click="renameItem(contextMenu.item, 'folder'); hideContextMenu();">
                        Rename Folder
                    </a>
                </li>
                <li v-if="contextMenu.type === 'folder' && isEditableFolder(contextMenu.item)">
                    <a class="dropdown-item py-1" href="#" @click="deleteFolder(contextMenu.item); hideContextMenu();">
                        Delete Folder
                    </a>
                </li>
                <!-- Folder operations for contracts - only shown if user has a storage node or broca balance -->
                <li v-if="contextMenu.type === 'folder' && (hasStorageNode || account)" class="dropdown-divider"></li>
                <li v-if="contextMenu.type === 'folder' && account">
                    <a class="dropdown-item py-1" href="#"
                        @click="extendFolderContracts(contextMenu.item); hideContextMenu();">
                        Extend All Contracts in Folder
                    </a>
                </li>
                <li v-if="contextMenu.type === 'folder' && hasStorageNode">
                    <a class="dropdown-item py-1" href="#"
                        @click="storeFolderContracts(contextMenu.item, false); hideContextMenu();">
                        Store All Files in Folder
                    </a>
                </li>
                <li v-if="contextMenu.type === 'folder' && hasStorageNode">
                    <a class="dropdown-item py-1" href="#"
                        @click="storeFolderContracts(contextMenu.item, true); hideContextMenu();">
                        Remove All Files in Folder from Storage
                    </a>
                </li>
                <li v-if="contextMenu.type === 'file'">
                    <a class="dropdown-item py-1" href="#"
                        @click="openDetailsViewer(contextMenu.item); hideContextMenu();">
                        View Details
                    </a>
                </li>
                <!-- Add Extend option for any user with broca balance -->
                <li v-if="contextMenu.type === 'file' && account">
                    <a class="dropdown-item py-1" href="#"
                        @click="openExtensionDialog(contextMenu.item); hideContextMenu();">
                        Extend Contract
                    </a>
                </li>
                <!-- Add Store option for storage node operators who aren't storing this file -->
                <li
                    v-if="contextMenu.type === 'file' && hasStorageNode && contract[contextMenu.item?.i] && !isStored(contract[contextMenu.item.i])">
                    <a class="dropdown-item py-1" href="#" @click="store(contextMenu.item, false); hideContextMenu();">
                        Store File
                    </a>
                </li>
                <!-- Add Remove option for storage node operators who are storing this file -->
                <li
                    v-if="contextMenu.type === 'file' && hasStorageNode && contract[contextMenu.item?.i] && isStored(contract[contextMenu.item.i])">
                    <a class="dropdown-item py-1" href="#" @click="store(contextMenu.item, true); hideContextMenu();">
                        Remove File from Storage
                    </a>
                </li>
                <!-- Add to dApp option - only show when dApp is available -->
                <li v-if="contextMenu.type === 'file' && postComponentAvailable && dappAvailable" class="dropdown-divider"></li>
                <li v-if="contextMenu.type === 'file' && postComponentAvailable && dappAvailable">
                    <a class="dropdown-item py-1" href="#" @click="addToDapp(contextMenu.item); hideContextMenu();">
                        <i class="fa-solid fa-puzzle-piece fa-fw me-2"></i>Add to dApp
                    </a>
                </li>
                
                <!-- Add to Post option - only show when editor is available -->
                <li v-if="contextMenu.type === 'file' && postComponentAvailable && editorAvailable" class="dropdown-divider"></li>
                <li v-if="contextMenu.type === 'file' && postComponentAvailable && editorAvailable">
                    <a class="dropdown-item py-1" href="#" @click="addToEditor(contextMenu.item); hideContextMenu();">
                        <i class="fa-solid fa-plus fa-fw me-2"></i>Add to Post
                    </a>
                </li>
                
                <!-- File Slots - only show when fileSlots prop has values and it's an image file -->
                <li v-if="contextMenu.type === 'file' && Object.keys(fileSlots).length > 0 && contextMenu.item && (isImageFile((newMeta[contextMenu.item.i] && newMeta[contextMenu.item.i][contextMenu.item.f] && newMeta[contextMenu.item.i][contextMenu.item.f].type) || '') || isImageFile(contextMenu.item.f))" class="dropdown-divider"></li>
                <li v-for="(slotConfig, slotType) in fileSlots" :key="slotType" 
                    v-if="contextMenu.type === 'file' && contextMenu.item && (isImageFile((newMeta[contextMenu.item.i] && newMeta[contextMenu.item.i][contextMenu.item.f] && newMeta[contextMenu.item.i][contextMenu.item.f].type) || '') || isImageFile(contextMenu.item.f))">
                    <a class="dropdown-item py-1" href="#" @click="handleFileSlot(slotType, contextMenu.item); hideContextMenu();">
                        <i :class="slotConfig.icon + ' fa-fw me-2'"></i>{{ slotConfig.label }}
                        <small class="text-muted d-block ms-4" v-if="slotConfig.description">{{ slotConfig.description }}</small>
                    </a>
                </li>
            </ul>
        </div>
    </Teleport>
    <!-- Metadata Editor Overlay -->
    <Teleport to="body">
        <div v-if="showMetadataEditor" class="metadata-editor-overlay d-flex justify-content-center align-items-center"
            @click.self="closeMetadataEditor"
            style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.7); z-index: 1050;">

            <div class="bg-dark text-white p-4 rounded shadow-lg" style="min-width: 400px; max-width: 90%;">
                <h5 class="mb-3">Edit Metadata for: <code
                        class="text-info">{{ fileToEditMetadata?.n || fileToEditMetadata?.f }}</code></h5>

                <!-- Labels -->
                <div class="mb-3">
                    <label class="form-label">Labels</label>
                    <choices-vue ref="editLabelsChoices" prop_type="labels" :prop_selections="tempMetadata.labels"
                        @data="handleTempLabel"></choices-vue>
                </div>

                <!-- License -->
                <div class="mb-3">
                    <label class="form-label">License <a href="https://creativecommons.org/share-your-work/cclicenses/"
                            target="_blank"><i class="fa-solid fa-section fa-xs"></i></a></label>
                    <choices-vue ref="editLicenseChoices" prop_type="license" :prop_selections="tempMetadata.license"
                        :prop_max_items="1" @data="handleTempLic"></choices-vue>
                </div>

                <!-- Flags -->
                <div class="mb-3">
                    <label class="form-label">Flags</label>
                    <choices-vue ref="editFlagsChoices" :prop_options="availableFlags"
                        :prop_selections="tempMetadata.flags" @data="handleTempFlag"></choices-vue>
                </div>

                <!-- Actions -->
                <div class="d-flex justify-content-end mt-4">
                    <button class="btn btn-secondary me-2" @click="closeMetadataEditor">Cancel</button>
                    <button class="btn btn-primary" @click="saveMetadataChanges">Save Changes</button>
                </div>
            </div>
        </div>
    </Teleport>
    <!-- Added: Details Viewer Overlay -->
    <Teleport to="body">
        <div v-if="showDetailsViewer && detailsData"
            class="details-viewer-overlay d-flex justify-content-center align-items-center"
            @click.self="closeDetailsViewer"
            style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.8); z-index: 1055; overflow-y: auto; padding: 20px;">

            <div class="bg-dark text-white p-4 rounded shadow-lg" style="min-width: 500px; max-width: 800px;">
                <h5 class="mb-3 border-bottom pb-2">File Details: <code
                        class="text-info">{{ detailsData.file.name }}</code>
                </h5>

                <div class="row">
                    <!-- File Info Column -->
                    <div class="col-md-6 mb-3">
                        <h6>File Information</h6>
                        <ul class="list-unstyled small">
                            <li><strong>CID: </strong> <code class="text-break">{{ detailsData.file.cid }}</code> <i
                                    class="fa-regular fa-copy fa-fw ms-1" role="button"
                                    @click="copyText(detailsData.file.cid)"></i></li>
                            <li><strong>Owner:</strong> @{{ detailsData.file.owner }}</li>
                            <li><strong>Size:</strong> {{ detailsData.file.size }}</li>
                            <li><strong>Path:</strong> {{ detailsData.file.path || '/' }}</li>
                            <li><strong>Type:</strong> {{ detailsData.file.type }}</li>
                            <li><strong>Encrypted:</strong> {{ detailsData.file.encrypted ? 'Yes' : 'No' }}</li>
                            <li><strong>Created:</strong> {{ detailsData.file.creationTime }} (Block: {{
                                detailsData.file.creationBlock }})</li>
                            <li><strong>Review/Expire:</strong>{{ detailsData.file.expirationTime }} (Block {{
                                detailsData.file.expirationBlock }})</li>
                            <li><span class="text-muted">...Empties Trash</span></li>
                            <li v-if="detailsData.file.thumbCid"><strong>Thumbnail CID: </strong> <code
                                    class="text-break">{{ detailsData.file.thumbCid }}</code> <i
                                    class="fa-regular fa-copy fa-fw ms-1" role="button"
                                    @click="copyText(detailsData.file.thumbCid)"></i></li>
                            <li v-if="detailsData.file.thumbData" class="mt-2">
                                <strong>Thumbnail:</strong><br>
                                <img :src="detailsData.file.thumbData" class="img-fluid mt-1 border rounded"
                                    style="max-height: 100px; max-width: 100px; object-fit: contain;" />
                            </li>
                            <li v-if="detailsData.file.flags.length > 0" class="mt-2">
                                <strong>Flags:</strong>
                                <span v-for="flag in detailsData.file.flags" :key="flag.l" class="ms-2">
                                    <i :class="flag.fa" :title="flag.l"></i>
                                </span>
                            </li>
                            <li v-if="detailsData.file.labels.length > 0" class="mt-2">
                                <strong>Labels:</strong>
                                <span v-for="label in detailsData.file.labels" :key="label.l" class="ms-2">
                                    <i :class="label.fa" :title="label.l"></i>
                                </span>
                            </li>
                            <li v-if="detailsData.file.license" class="mt-2">
                                <strong>License:</strong> {{ detailsData.file.license.name }}
                                <span v-for="lic in detailsData.file.license.fa" :key="lic.l" class="ms-1">
                                    <i :class="lic.fa" :title="lic.l"></i>
                                </span>
                            </li>
                        </ul>
                    </div>

                    <!-- Contract Info Column -->
                    <div class="col-md-6 mb-3">
                        <h6>Contract Information</h6>
                        <ul class="list-unstyled small">
                            <li><strong>Contract ID:</strong> <code
                                    class="text-break">{{ detailsData.contract.id }}</code>
                                <i class="fa-regular fa-copy fa-fw ms-1" role="button"
                                    @click="copyText(detailsData.contract.id)"></i>
                            </li>
                            <li><strong>Contract Owner:</strong> @{{ detailsData.contract.owner }}</li>
                            <li><strong>Storage Nodes:</strong>
                                <div v-for="node in detailsData.contract.nodes" :key="node">@{{ node }}</div>
                            </li>
                            <li><strong>Incentivized Nodes:</strong> {{ detailsData.contract.prominence }} </li>
                            <li><strong>Pay Scale:</strong> {{ detailsData.contract.payScale }} </li>
                            <li><strong>Price/Month:</strong> {{ detailsData.contract.cost }} BROCA </li>
                            <li><strong>Total Size Stored:</strong> {{ detailsData.contract.totalSizeStored }}</li>
                            <li><strong>Auto-Renew:</strong> {{ detailsData.contract.autoRenew ? 'Yes' : 'No' }}</li>
                            <li><strong>Contract Encrypted:</strong> {{ detailsData.contract.encrypted ? 'Yes' : 'No' }}
                            </li>
                            <li v-if="detailsData.contract.encryptionAccounts.length > 0">
                                <strong>Encrypted For:</strong>
                                <ul>
                                    <li v-for="acc in detailsData.contract.encryptionAccounts" :key="acc">@{{ acc }}
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Actions -->
                <div class="d-flex justify-content-end mt-3 border-top pt-3">
                    <button class="btn btn-secondary" @click="closeDetailsViewer">Close</button>
                </div>
            </div>
        </div>
    </Teleport>
    <!-- Extension Dialog Overlay -->
    <Teleport to="body">
        <div v-if="showExtensionDialog"
            class="extension-dialog-overlay d-flex justify-content-center align-items-center"
            @click.self="closeExtensionDialog"
            style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.7); z-index: 1060;">

            <div class="bg-dark text-white p-4 rounded shadow-lg" style="min-width: 400px; max-width: 90%;">
                <h5 class="mb-3">Extend Contract: <code class="text-info">{{ extensionFile?.i }}</code></h5>

                <div class="mb-3">
                    <label class="form-label">Extension Period (days)</label>
                    <div class="d-flex align-items-center">
                        <input type="range" class="form-range flex-grow-1 me-2" min="7" max="90" step="7"
                            v-model="extensionDays">
                        <span class="badge bg-primary">{{ extensionDays }} days</span>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label">BROCA Cost</label>
                    <div class="input-group">
                        <input type="number" class="form-control" v-model="extensionAmount" min="1" :max="brocaBalance">
                        <span class="input-group-text">BROCA (max: {{ brocaBalance }})</span>
                    </div>
                </div>

                <div class="d-flex justify-content-end mt-4">
                    <button class="btn btn-secondary me-2" @click="closeExtensionDialog">Cancel</button>
                    <button class="btn btn-primary" @click="confirmExtension"
                        :disabled="extensionAmount <= 0 || extensionAmount > brocaBalance">
                        Extend Contract
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- File Preview Modal -->
    <teleport to="body">
        <!-- Backdrop -->
        <transition name="fade">
            <div v-if="previewModal.show" 
                 class="modal-backdrop fade show"
                 @click="closeFilePreview"></div>
        </transition>
        
        <!-- Modal -->
        <transition name="modal">
            <div v-if="previewModal.show" 
                 class="modal fade show d-block spk-drive-preview-modal"
                 tabindex="-1"
                 role="dialog"
                 @keyup.esc="closeFilePreview">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content bg-dark text-white">
                
                <!-- Modal Header -->
                <div class="modal-header border-bottom border-secondary p-3">
                    <h5 class="modal-title mb-0"> <i class="fa-solid fa-eye me-2"></i> {{ previewModal.file?.name || 'File Preview' }}</h5>
                    <button type="button" class="btn-close btn-close-white" @click="closeFilePreview"></button>
                </div>
                
                <!-- Modal Body -->
                <div class="modal-body p-0">
                    
                    <!-- Loading Spinner (Non-blocking) -->
                    <div v-if="previewModal.loading" 
                         class="position-absolute top-0 end-0 m-3 z-1">
                        <div class="spinner-border text-light" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    
                    <!-- Image Preview -->
                    <div v-if="previewModal.file && isImageFile(previewModal.file.type)" 
                         class="text-center p-3">
                        <img :src="previewModal.file.url" 
                             :alt="previewModal.file.name"
                             @load="previewModal.loading = false"
                             @error="previewModal.loading = false"
                             class="img-fluid">
                    </div>
                    
                    <!-- Video Preview -->
                    <div v-else-if="previewModal.file && isVideoFile(previewModal.file.type)" 
                         class="hls-video-wrapper text-center p-3">
                        <video :src="getFileUrlWithType(previewModal.file)" 
                               :data-video-type="getVideoMimeType(previewModal.file)"
                               controls 
                               class="w-100">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    
                    <!-- Audio Preview -->
                    <div v-else-if="previewModal.file && isAudioFile(previewModal.file.type)" 
                         class="text-center p-4">
                        <div class="mb-3">
                            <i class="fa-solid fa-music fa-3x text-primary"></i>
                        </div>
                        <audio :src="previewModal.file.url" 
                               controls 
                               class="w-100">
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                    
                    <!-- Default/Download Preview -->
                    <div v-else class="text-center p-5">
                        <div class="mb-4">
                            <i class="fa-solid fa-file fa-4x text-secondary"></i>
                        </div>
                        <h6 class="text-muted mb-3">Preview not available for this file type</h6>
                        <p class="text-muted small mb-4">
                            File Type: {{ previewModal.file?.type || 'Unknown' }}<br>
                            Size: {{ previewModal.file?.size || 'Unknown' }}
                        </p>
                    </div>
                </div>
                
                <!-- Modal Footer -->
                <div class="modal-footer border-top border-secondary p-3">
                    <div class="d-flex justify-content-between align-items-center w-100">
                        <div class="text-muted small text-break me-2">
                            <strong>CID: </strong> 
                            <a :href="'https://ipfs.dlux.io/ipfs/' + previewModal.file?.cid" 
                               target="_blank" 
                               class="text-info text-decoration-none">
                                {{ previewModal.file?.cid }}
                            </a>
                        </div>
                        <div>
                            <button type="button" 
                                    class="btn btn-outline-light btn-sm me-2 d-none"
                                    @click="window.open(previewModal.file?.url, '_blank')">
                                <i class="fa-solid fa-external-link-alt me-1"></i>
                                Open in New Tab
                            </button>
                            <button type="button" 
                                    class="btn btn-primary btn-sm text-nowrap"
                                    @click="downloadFile({f: previewModal.file?.cid, i: Object.keys(newMeta).find(id => newMeta[id][previewModal.file?.cid])})">
                                <i class="fa-solid fa-download me-1"></i>
                                Download
                            </button>
                        </div>
                    </div>
                </div>
                    </div>
                </div>
            </div>
        </transition>
    </teleport>
    
    <!-- Video Choice Modal -->
    <video-choice-modal
        :show="showVideoChoiceModal"
        :file-name="videoToTranscode?.fileName || ''"
        :file-size="videoToTranscode?.fileSize || 0"
        @choice="handleVideoChoice"
        @cancel="cancelVideoChoice"
    />
    
    <!-- Hidden Video Transcoders for Processing -->
    <div v-show="false">
        <video-transcoder
            v-for="pFile in processingFiles"
            :key="pFile.id"
            :ref="'transcoder_' + pFile.id"
            :file="pFile.file"
            :file-name="pFile.fileName || pFile.file?.name"
            :file-size="pFile.fileSize || pFile.file?.size"
            :auto-start="true"
            :headless="true"
            @complete="handleProcessingComplete(pFile.id, $event)"
            @error="handleProcessingError(pFile.id, $event)"
            @progress="handleProcessingProgress(pFile.id, $event)"
        />
    </div>
</div>`,
    props: {
        signedtx: Array,
        assets: {
            type: Boolean,
            default: false,
        },
        saccountapi: {
            type: Object,
            default: function () {
                return {
                    channels: {},
                    name: "",
                    spk_power: 0,
                    pow_broca: 0,
                };
            },
        },
        bid: {
            type: String,
            default: "",
        },
        account: {
            type: String,
            default: "",
        },
        cc: {
            default: false,
        },
        computedData: {
            type: Object,
            default: function () {
                return {
                    usedBytes: 0,
                    availableBytes: 0,
                };
            },
        },
        broca: {
            type: String,
            default: "0,0",
        },
        sstats: {
            type: Object,
            default: function () {
                return {
                    head_block: 0,
                    broca_refill: "0",
                };
            },
        },
        postComponentAvailable: {
            type: Boolean,
            default: false,
        },
        dappAvailable: {
            type: Boolean,
            default: false,
        },
        editorAvailable: {
            type: Boolean,
            default: false,
        },
        fileSlots: {
            type: Object,
            default: function () {
                return {}
            },
        },
        postType: {
            type: String,
            default: 'blog',
        },
        updateUrl: {
            type: Boolean,
            default: true,  // Keep current behavior by default
        },
    },
    data() {
        return {
            files: {},
            userFolderTrees: {},
            owners: [],
            contracts: [{
                n: {},
                p: 3,
                df: {},
                nt: "0",
                i: "a:1:1",
                id: "a-1-1",
                m: "",
                u: 1,
                t: "",
                extend: 7,
                r: 100,  // Added data needed for calculations
            }],
            contractIDs: {},
            newUser: '',
            filesArray: [],
            filterFlags: 0,
            filterLabels: "",
            postBodyAdder: {},
            filesSelect: {
                sort: "time",
                dir: "dec",
                search: "",
                cc_only: false,
                addusers: {},
            },
            contract: {},
            viewOpts: {
                view: "icon", // grid, list, folder, icon
                fileView: "grid", // for folder view: grid or list
                list: false
            },
            selectedUser: null,
            currentFolderPath: "",
            contextMenu: {
                show: false,
                x: 0,
                y: 0,
                type: "", // 'file' or 'folder'
                item: null,
                positionStyle: 'fixed',
            },
            pendingChanges: {},
            newMeta: {},
            decoded: false,
            debounceTime: null,
            dragHoverTimeout: null, // Timeout ID for drag hover navigation
            dragHoverTargetPath: null, // Path of the element being hovered over
            selectedFiles: [], // Array of selected file IDs
            selectionBox: {
                active: false,
                startX: 0,
                startY: 0,
                endX: 0,
                endY: 0
            }, // For rubber-band selection
            initialSelection: [], // Added: To store selection state at drag start
            droppedExternalFiles: { files: [], targetPath: null }, // Added: For external file drops
            uploadActive: false, // Track if upload-everywhere has content
            labels: {
                "0": { fa: "fa-solid fa-sink fa-fw", l: "Miscellaneous", c: 0 },
                "1": { fa: "fa-solid fa-exclamation fa-fw", l: "Important", c: 0 },
                "2": { fa: "fa-solid fa-trash fa-fw", l: "Trash", c: 0 },
                "3": { fa: "fa-solid fa-lock fa-fw", l: "Sensitive", c: 0 },
                "4": { fa: "fa-solid fa-earth-americas fa-fw", l: "World", c: 0 },
                "5": { fa: "fa-solid fa-star fa-fw", l: "Favourite", c: 0 }
            },
            licenses: {
                ["1"]: {
                    fa: [{ fa: "fa-brands fa-creative-commons", l: "Creative Commons License" }, { fa: "fa-brands fa-creative-commons-by", l: "Attribution Required" }],
                    name: "CC BY",
                },
                ["2"]: {
                    fa: [{ fa: "fa-brands fa-creative-commons", l: "Creative Commons License" }, { fa: "fa-brands fa-creative-commons-by", l: "Attribution Required" }, { fa: "fa-brands fa-creative-commons-sa", l: "Share Alike" }],
                    name: "CC BY-SA",
                },
                ["3"]: {
                    fa: [{ fa: "fa-brands fa-creative-commons", l: "Creative Commons License" }, { fa: "fa-brands fa-creative-commons-by", l: "Attribution Required" }, { fa: "fa-brands fa-creative-commons-nd", l: "No Derivatives" }],
                    name: "CC BY-ND",
                },
                ["4"]: {
                    fa: [{ fa: "fa-brands fa-creative-commons", l: "Creative Commons License" }, { fa: "fa-brands fa-creative-commons-by", l: "Attribution Required" }, { fa: "fa-brands fa-creative-commons-nc", l: "Non-Commerical" }, { fa: "fa-brands fa-creative-commons-nd", l: "No Derivatives" }],
                    name: "CC BY-NC-ND",
                },
                ["5"]: {
                    fa: [{ fa: "fa-brands fa-creative-commons", l: "Creative Commons License" }, { fa: "fa-brands fa-creative-commons0-by", l: "Attribution Required" }, { fa: "fa-brands fa-creative-commons-nc", l: "Non-Commerical" }],
                    name: "CC BY-NC",
                },
                ["6"]: {
                    fa: [{ fa: "fa-brands fa-creative-commons", l: "Creative Commons License" }, { fa: "fa-brands fa-creative-commons-by", l: "Attribution Required" }, { fa: "fa-brands fa-creative-commons-nc", l: "Non-Commerical" }, { fa: "fa-brands fa-creative-commons-sa", l: "Share Alike" }],
                    name: "CC BY-NC-SA",
                },
                ["7"]: {
                    fa: [{ fa: "fa-brands fa-creative-commons-zero", l: "CC0", c: 1 }],
                    name: "CC0",
                },
            },
            dragHoverTargetPath: null,
            localStorageKey: '', // Added: Key for localStorage persistence
            showMetadataEditor: false,
            fileToEditMetadata: null,
            tempMetadata: { // To hold temporary edits in the editor
                labels: [], // Expecting array of keys like ['1', '5']
                license: [], // Expecting single key in array like ['7'] or empty
                flags: []   // Expecting array of flag numbers like [4, 8]
            },
            availableFlags: [
                // value corresponds to the bit, label is display text
                { value: 4, label: 'NSFW (Content Warning)', selected: false, customProperties: { icon: 'fa-solid fa-radiation text-warning' } },
                { value: 8, label: 'Executable (May run code)', selected: false, customProperties: { icon: 'fa-regular fa-file-code text-info' } },
                // Add other toggleable flags here if needed in the future
            ],
            showDetailsViewer: false, // Added: Control visibility of details viewer
            fileToViewDetails: null,  // Added: Store the file for the details viewer
            breadcrumbCounts: {},
            showExtensionDialog: false,
            extensionFile: null,
            extensionDays: 7,
            extensionAmount: 100,
            extensionWithPower: false,
            brocaBalance: 0,
            previewModal: {
                show: false,
                file: null,
                loading: true
            },
            videoObserver: null, // MutationObserver for HLS video setup
            // Video transcoding
            showVideoTranscoder: false,
            showVideoChoiceModal: false,
            videoToTranscode: null,
            pendingVideoFiles: [], // Queue of video files to process
            processingFiles: [], // Files currently being transcoded
            processedVideoFiles: [], // Completed video files ready for upload
        };
    },
    emits: ["tosign", "addassets", 'update:externalDrop', 'update-contract', 'add-to-post', 'add-to-dapp', 'add-to-editor', 'set-logo', 'set-featured', 'set-banner', 'set-wrapped', 'refresh-drive'], // Ensure 'tosign', 'update:externalDrop', and 'update-contract' are included here
    methods: {
        ...common,
        ...spk,
        /**
         * Helper function to recursively scan dropped directory entries.
         * @param {FileSystemDirectoryEntry} directoryEntry - The directory entry to scan.
         * @returns {Promise<Array<{ file: File, relativePath: string }>>} - Promise resolving to an array of file objects with relative paths.
         */
        async scanDirectory(directoryEntry) {
            const reader = directoryEntry.createReader();
            let entries = [];
            let readEntries = await new Promise((resolve, reject) => {
                reader.readEntries(resolve, reject);
            });
            while (readEntries.length > 0) {
                entries = entries.concat(readEntries);
                readEntries = await new Promise((resolve, reject) => {
                    reader.readEntries(resolve, reject);
                });
            }

            let files = [];
            for (const entry of entries) {
                if (entry.isFile) {
                    const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
                    // Ensure relativePath uses forward slashes and removes leading slash if present
                    const relativePath = entry.fullPath.startsWith('/') ? entry.fullPath.substring(1) : entry.fullPath;
                    files.push({ file: file, relativePath: relativePath });
                } else if (entry.isDirectory) {
                    // Recursively scan subdirectories
                    const subFiles = await this.scanDirectory(entry);
                    files = files.concat(subFiles);
                }
            }
            return files;
        },

        /**
         * Process dropped items (files or folders) from an external source.
         * @param {DataTransferItemList} items - The items from the drop event.
         * @returns {Promise<Array<{ file: File, relativePath: string }>>} - Promise resolving to a flat array of file objects with relative paths.
         */
        async processDroppedItems(items) {
            let allFiles = [];
            const promises = [];

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.kind === 'file') {
                    const entry = item.webkitGetAsEntry();
                    if (entry) {
                        if (entry.isFile) {
                            promises.push(
                                new Promise((resolve, reject) => entry.file(resolve, reject))
                                    .then(file => ({ file: file, relativePath: file.name })) // Single file has its name as path
                            );
                        } else if (entry.isDirectory) {
                            // Start scanning the directory
                            promises.push(this.scanDirectory(entry));
                        }
                    }
                }
            }

            // Wait for all scanning/file reading promises to complete
            const results = await Promise.all(promises);
            // Flatten the results (scanDirectory returns arrays)
            results.forEach(result => {
                if (Array.isArray(result)) {
                    allFiles = allFiles.concat(result);
                } else if (result) { // Handle single file case
                    allFiles.push(result);
                }
            });

            return allFiles;
        },

        revertPendingChanges() {
            if (Object.keys(this.pendingChanges).length === 0) {
                return; // Nothing to revert
            }

            // Confirm with user before discarding changes
            if (confirm("Are you sure you want to discard all pending changes? This cannot be undone.")) {
                // Clear pending changes
                this.pendingChanges = {};

                // Clear from localStorage
                if (this.localStorageKey) {
                    localStorage.removeItem(this.localStorageKey);
                    debugLogger.debug("Cleared pending changes from localStorage");
                }

                // Rebuild from original contract data
                this.init();
                debugLogger.debug("Reverted all pending changes");
            }
        },
        addAsset(id, contract) {
            this.$emit("addassets", { id, contract });
        },
        cycleView(user) {
            const view = this.filesSelect.addusers[user]
            switch (view) {
                case true:
                    this.filesSelect.addusers[user] = 'cc'
                    break
                case false:
                    this.filesSelect.addusers[user] = true
                    break
                case 'lock':
                    this.filesSelect.addusers[user] = false
                    break
                case 'cc':
                    this.filesSelect.addusers[user] = 'lock'
                    break
            }
            this.render()
        },
        purge(user) {
            delete this.filesSelect.addusers[user]
            this.owners = this.owners.filter(o => o != user)
            this.render()
        },
        createNewFolder() {
            const folderName = prompt("Enter new folder name:", "New Folder");
            // Validate folder name
            if (folderName) {
                const validation = this.validateItemName(folderName, "folder");
                if (!validation.valid) {
                    alert(validation.message);
                    return;
                }
            }

            // Ensure user is the current logged-in account and folderName is valid
            if (folderName && this.selectedUser === this.account) {
                const newPath = this.currentFolderPath ? `${this.currentFolderPath}/${folderName}` : folderName;

                // --- Prevent creating folder if it already exists (check pending and current) ---
                const userTree = this.userFolderTrees[this.selectedUser] || [];
                const findFolder = (nodes, pathParts) => {
                    if (!pathParts.length) return null; // Should target a folder name
                    let currentLevel = nodes;
                    let node = null;
                    for (const part of pathParts) {
                        node = currentLevel.find(n => n.name === part);
                        if (!node) return null; // Path segment not found
                        currentLevel = node.subfolders;
                    }
                    return node; // Return the found node
                };
                const parts = newPath.split('/').filter(Boolean);
                if (findFolder(userTree, parts)) {
                    alert(`Folder "${folderName}" already exists at this level.`);
                    return;
                }

                // --- Create Virtual Folder ---
                // Instead of attaching to a random contract, we'll store it separately
                if (!this.pendingChanges['__virtualFolders__']) {
                    this.pendingChanges['__virtualFolders__'] = {};
                }
                if (!this.pendingChanges['__virtualFolders__'][this.selectedUser]) {
                    this.pendingChanges['__virtualFolders__'][this.selectedUser] = [];
                }

                // Add to virtual folders if not already there
                if (!this.pendingChanges['__virtualFolders__'][this.selectedUser].includes(newPath)) {
                    this.pendingChanges['__virtualFolders__'][this.selectedUser].push(newPath);
                    debugLogger.debug("Added virtual folder:", newPath);

                    // --- Trigger UI update by rebuilding tree ---
                    this.buildFolderTrees();
                } else {
                    alert(`Folder "${folderName}" is already pending creation.`);
                }
            } else if (folderName && (this.selectedUser !== this.account)) {
                alert("Cannot create folders for other users.");
            }
        },
        refreshDrive() {
            debugLogger.debug('🔄 Refreshing drive data...');
            this.$emit('refresh-drive');
            // Also call init to reload local data
            this.init();
        },
        appendUserFiles() {
            const newUser = this.newUser
            this.newUser = ''
            this.filesSelect.addusers[newUser] = true
            if (newUser) fetch("https://spktest.dlux.io/@" + newUser)
                .then((response) => response.json())
                .then((data) => {
                    this.contractIDs[newUser] = {}
                    for (var node in data.file_contracts) {
                        data.file_contracts[node].encryption = {
                            input: "",
                            key: "",
                            accounts: {},
                        }
                        if (!data.file_contracts[node].m) {
                            data.file_contracts[node].autoRenew = false
                            data.file_contracts[node].m = ""
                            this.newMeta[data.file_contracts[node].i] = {
                                contract: {
                                    autoRenew: false,
                                    encrypted: false,
                                    m: "",
                                }
                            }
                            var filesNames = data.file_contracts[node]?.df ? Object.keys(data.file_contracts[node].df) : []
                            filesNames = filesNames.sort((a, b) => {
                                if (a > b) return 1
                                else if (a < b) return -1
                                else return 0
                            })
                            for (var i = 0; i < filesNames.length; i++) {
                                this.newMeta[data.file_contracts[node].i][filesNames[i]] = {
                                    name: '',
                                    type: '',
                                    thumb: '',
                                    flags: '',
                                    is_thumb: false,
                                    encrypted: false,
                                    license: '',
                                    labels: '',
                                    size: data.file_contracts[node].df[filesNames[i]]
                                }
                            }
                        } else {
                            if (data.file_contracts[node].m.indexOf('"') >= 0) data.file_contracts[node].m = JSON.parse(data.file_contracts[node].m)
                            var encData = data.file_contracts[node].m.split(',')[0] || ''
                            var renew = this.Base64toNumber(encData[0] || '0') & 1 ? true : false
                            var encAccounts = []
                            var encrypted = false
                            if (encData) {
                                encData = encData.split('#')
                                renew = this.Base64toNumber(encData.shift()) & 1 ? true : false
                                if (encData.length) {
                                    encData = '#' + encData.join('#')
                                    encAccounts = encData.split(';')
                                    encrypted = true
                                }
                            }
                            this.newMeta[data.file_contracts[node].i] = {
                                contract: {
                                    autoRenew: renew,
                                    encrypted,
                                    m: data.file_contracts[node].m,
                                }
                            }
                            for (var i = 0; i < encAccounts.length; i++) {
                                const encA = encAccounts[i].split('@')[1]
                                data.file_contracts[node].autoRenew = renew
                                data.file_contracts[node].encryption.accounts[encA] = {
                                    enc_key: `#${encAccounts[i].split('@')[0].split('#')[1]}`,
                                    key: '',
                                    done: true,
                                }
                            }

                            var filesNames = data.file_contracts[node]?.df ? Object.keys(data.file_contracts[node].df) : []
                            filesNames = filesNames.sort((a, b) => {
                                if (a > b) return 1
                                else if (a < b) return -1
                                else return 0
                            })
                            const slots = data.file_contracts[node].m.split(",")
                            for (var i = 0; i < filesNames.length; i++) {
                                const flags = slots[i * 4 + 4]
                                this.newMeta[data.file_contracts[node].i][filesNames[i]] = {
                                    name: slots[i * 4 + 1],
                                    type: slots[i * 4 + 2],
                                    thumb: slots[i * 4 + 3],
                                    thumb_data: slots[i * 4 + 3],
                                    flags: flags.indexOf('-') >= 0 ? flags.split('-')[0] : flags[0],
                                    license: flags.indexOf('-') >= 0 ? flags.split('-')[1] : '',
                                    labels: flags.indexOf('-') >= 0 ? flags.split('-')[2] : flags.slice(1),
                                }
                                if (this.newMeta[data.file_contracts[node].i][filesNames[i]].thumb) this.getImgData(data.file_contracts[node].i, filesNames[i])
                                if (this.Base64toNumber(this.newMeta[data.file_contracts[node].i][filesNames[i]].flags) & 1) this.newMeta[data.file_contracts[node].i][filesNames[i]].encrypted = true
                                else this.newMeta[data.file_contracts[node].i][filesNames[i]].encrypted = false
                                if (this.Base64toNumber(this.newMeta[data.file_contracts[node].i][filesNames[i]].flags) & 2) this.newMeta[data.file_contracts[node].i][filesNames[i]].is_thumb = true
                                else this.newMeta[data.file_contracts[node].i][filesNames[i]].is_thumb = false
                                if (this.Base64toNumber(this.newMeta[data.file_contracts[node].i][filesNames[i]].flags) & 4) this.newMeta[data.file_contracts[node].i][filesNames[i]].nsfw = true
                                else this.newMeta[data.file_contracts[node].i][filesNames[i]].nsfw = false
                            }
                        }
                        this.contractIDs[newUser][data.file_contracts[node].i] = data.file_contracts[node];
                        this.contractIDs[newUser][data.file_contracts[node].i].index = this.contracts.length - 1;
                        this.postBodyAdder[data.file_contracts[node].i] = {}

                    }
                    for (var user in data.channels) {
                        for (var node in data.channels[user]) {
                            if (this.contractIDs[newUser][data.channels[user][node].i]) continue
                            else {
                                this.contractIDs[newUser][data.channels[user][node].i] = data.channels[user][node];
                                this.contractIDs[newUser][data.channels[user][node].i].index = this.contracts.length - 1;
                            }
                        }
                    }
                    this.init()

                });
        },
        handleLabel(m) {
            debugLogger.debug('handleLabel:', m); // Debug log
            let currentLabels = this.filterLabels ? this.filterLabels.split('') : [];
            if (m.action == 'added') {
                if (!currentLabels.includes(m.item)) {
                    currentLabels.push(m.item);
                }
            } else if (m.action == 'removed') {
                currentLabels = currentLabels.filter(label => label !== m.item);
            }
            this.filterLabels = currentLabels.sort().join('');
            debugLogger.debug('Updated filterLabels:', this.filterLabels); // Debug log
            this.render();
        },
        handleTag(m) {
            debugLogger.debug('handleTag:', m); // Debug log
            // Flags seem to be a bitmask, passed directly as prop_selections?
            // Let's assume the @data event for tags/flags gives us the *new complete bitmask*
            // If it gives individual add/remove like labels, we need to adjust
            if (m.action === 'update') { // Assuming choices-vue emits an 'update' with the full value
                this.filterFlags = m.value || 0;
            } else {
                // Fallback logic if it sends add/remove like labels (adjust as needed)
                let num = this.filterFlags || 0;
                const itemValue = parseInt(m.item); // Ensure item is treated as number
                if (m.action == 'added') {
                    if (!(num & itemValue)) { // Add flag if not present
                        num |= itemValue;
                    }
                } else if (m.action == 'removed') {
                    if (num & itemValue) { // Remove flag if present
                        num &= ~itemValue;
                    }
                }
                this.filterFlags = num;
            }

            debugLogger.debug('Updated filterFlags:', this.filterFlags); // Debug log
            this.render();
        },
        download(fileInfo, data = false, MIME_TYPE = "image/png") {
            if (data) {
                var blob = new Blob([data], { type: MIME_TYPE });
                window.location.href = window.URL.createObjectURL(blob);
            } else {
                fetch(`https://ipfs.dlux.io/ipfs/${fileInfo}`)
                    .then((response) => response.blob())
                    .then((blob) => {
                        var url = window.URL.createObjectURL(blob);
                        var a = document.createElement('a');
                        a.href = url;
                        a.download = fileInfo;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a); // Added cleanup
                    });
            }
        },
        downloadFile(file) {
            const cid = file.f;
            const id = file.i;
            const name = (this.newMeta[id] && this.newMeta[id][cid])
                ? `${this.newMeta[id][cid].name}.${this.newMeta[id][cid].type}`
                : 'file';

            const isEncrypted = this.contract[id]?.encryption?.key;

            fetch(`https://ipfs.dlux.io/ipfs/${cid}`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
                    }
                    if (isEncrypted) {
                        return response.text(); // Encrypted files are expected to be base64 data URLs after decryption
                    } else {
                        return response.blob(); // Non-encrypted files are downloaded as blobs directly
                    }
                })
                .then((data) => { // data will be text for encrypted, blob for non-encrypted
                    if (isEncrypted) {
                        const decryptedDataUrl = this.AESDecrypt(data, this.contract[id].encryption.key);
                        if (!decryptedDataUrl || !decryptedDataUrl.includes(',')) {
                            throw new Error('Decryption failed or did not produce a valid data URL.');
                        }
                        var byteString = atob(decryptedDataUrl.split(',')[1]);
                        var mimeString = decryptedDataUrl.split(',')[0].split(':')[1].split(';')[0];
                        var ab = new ArrayBuffer(byteString.length);
                        var ia = new Uint8Array(ab);
                        for (var i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                        }
                        const blob = new Blob([ab], { type: mimeString });
                        this.triggerDownload(blob, name);
                    } else {
                        // data is already a blob for non-encrypted files
                        this.triggerDownload(data, name);
                    }
                })
                .catch((error) => {
                    console.error(`Download failed for ${name} (CID: ${cid}):`, error);
                    // Optionally, show a user-friendly error message
                    alert(`Failed to download file: ${name}. ${error.message}`);
                });
        },
        triggerDownload(blob, name) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a); // Ensure the anchor element is removed
        },
        setView(mode) {
            this.viewOpts.view = mode;
            this.viewOpts.list = mode === "list"; // Sync viewOpts.list with view === "list"
            if (mode !== "folder") {
                this.viewOpts.fileView = "grid";
            }
            // Ensure selectedUser is set for folder/icon views
            if ((mode === "folder" || mode === "icon") && !this.selectedUser && this.owners.length >= 0) {
                this.selectedUser = this.saccountapi.name || this.owners[0];
            }
        },
        navigateTo(path) {
            this.currentFolderPath = path;

            // Update URL hash to reflect the current folder path
            if (this.updateUrl) {
                const newHash = path ? `#drive/${path}` : '#drive';
                history.replaceState(null, null, newHash);
            } else if (window.location.hash.startsWith('#drive')) {
                // If updateUrl is false but we still have a #drive hash, remove it
                history.replaceState(null, null, window.location.pathname + window.location.search);
            }

            // Load thumbnails for the new folder
            this.$nextTick(() => {
                this.loadThumbnailsForCurrentFolder();
            });
        },
        getSubfolders(user, path) {
            const folders = this.userFolderTrees[user] || [];
            if (!path) return folders;
            const pathParts = path.split("/").filter(Boolean);
            let current = folders;
            for (const part of pathParts) {
                const subfolder = current.find(f => f.name === part);
                if (!subfolder) return [];
                current = subfolder.subfolders;
            }
            return current;
        },
        getFiles(user, path) {
            // Normalize empty paths
            const normalizedPath = path === undefined ? '' : path;

            // Get all files for this user that match the path
            return Object.values(this.files).filter(file => {
                // Check if owner matches
                const ownerMatch = file.o === user;

                // Normalize file path
                const filePathNormalized = file.folderPath === undefined ? '' : file.folderPath;

                // Check if path matches
                const pathMatch = filePathNormalized === normalizedPath;

                // Skip thumbnails
                const notThumb = !file.is_thumb;

                return ownerMatch && pathMatch && notThumb;
            });
        },
        showContextMenu(event, type, item) {
            this.contextMenu = {
                show: true,
                x: event.clientX,
                y: event.clientY,
                type,
                item,
            };
            
            // Debug logging for file slots
            if (type === 'file' && item) {
                debugLogger.debug('Context menu for file:', item);
                debugLogger.debug('File slots available:', Object.keys(this.fileSlots));
                debugLogger.debug('File metadata:', this.newMeta[item.i] && this.newMeta[item.i][item.f]);
                const fileType = (this.newMeta[item.i] && this.newMeta[item.i][item.f] && this.newMeta[item.i][item.f].type) || '';
                debugLogger.debug('File type:', fileType);
                debugLogger.debug('Is image (by type):', this.isImageFile(fileType));
                debugLogger.debug('Is image (by filename):', this.isImageFile(item.f));
            }
            
            const hide = () => {
                this.contextMenu.show = false;
                document.removeEventListener("click", hide);
            };
            document.addEventListener("click", hide);
        },
        isEditable(file) {
            return file.o === this.account; // Only current user's files are editable
        },
        isEditableFolder(folder) {
            // Preset folders can't be renamed
            if (folder.isPreset) {
                return false;
            }

            // Check if *any* loaded file belongs to the current user
            // This might need refinement if folder ownership becomes a thing
            // For now, assume if the user owns *any* files, they can manage folders
            return this.owners.includes(this.account);
        },
        renameItem(item, type) {
            const oldName = type === "file" ? (this.newMeta[item.i][item.f].name || item.f) : item.name;
            const newName = prompt(`Rename ${type} from "${oldName}" to:`, oldName);

            if (newName && newName !== oldName) {
                // Validate the new name
                const validation = this.validateItemName(newName, type);
                if (!validation.valid) {
                    alert(validation.message);
                    return;
                }

                if (type === "file") {
                    this.pendingChanges[item.i] = this.pendingChanges[item.i] || {};
                    this.pendingChanges[item.i][item.f] = {
                        ...this.pendingChanges[item.i][item.f],
                        name: newName,
                        folderPath: item.folderPath,
                    };
                    this.newMeta[item.i][item.f].name = newName;
                } else {
                    const files = this.getFiles(this.selectedUser, item.path);
                    files.forEach(file => {
                        if (this.isEditable(file)) {
                            const newPath = item.path.replace(item.name, newName);
                            this.pendingChanges[file.i] = this.pendingChanges[file.i] || {};
                            this.pendingChanges[file.i][file.f] = {
                                folderPath: newPath,
                                name: this.newMeta[file.i][file.f].name || file.f,
                            };
                            file.folderPath = newPath;
                        }
                    });
                    item.name = newName;
                    item.path = item.path.replace(new RegExp(`${oldName}$`), newName);
                }
                this.buildFolderTrees();
                this.render();
            }
        },
        dragStartFile(event, file) {
            debugLogger.debug('Drag start file:', file);

            // If dragging a selected file and there are multiple files selected
            if (this.isFileSelected(file) && this.selectedFiles.length > 1) {
                // Include all selected files in the drag data
                event.dataTransfer.setData("fileids", JSON.stringify(this.selectedFiles));
                debugLogger.debug('Dragging multiple files:', this.selectedFiles);
            } else {
                // Single file drag (traditional behavior)
                this.selectedFiles = [file.f]; // Select only this file
                event.dataTransfer.setData("fileid", file.f);
            }

            event.dataTransfer.setData("contractid", file.i);

            // Use text/plain as a fallback
            event.dataTransfer.setData("text/plain", file.f);

            // Set drag image
            const dragIcon = document.createElement('div');
            dragIcon.style.position = 'absolute';
            dragIcon.style.top = '-1000px'; // Position off-screen initially
            dragIcon.style.maxWidth = '200px'; // Limit width

            if (this.selectedFiles.length > 1) {
                // Show count for multiple files
                dragIcon.innerHTML = `<div style="padding: 10px; background: rgba(0,0,0,0.7); color: white; border-radius: 4px; display: flex; align-items: center; max-width: 200px; white-space: nowrap;">
                    <i class="fa-solid fa-files fa-lg me-2"></i> 
                    <span>${this.selectedFiles.length} files</span>
                </div>`;
            } else {
                // Show single file icon
                const fileName = this.newMeta[file.i][file.f].name || file.f;
                const truncatedName = fileName.length > 15 ? fileName.substring(0, 15) + '...' : fileName;

                dragIcon.innerHTML = `<div style="padding: 10px; background: rgba(0,0,0,0.7); color: white; border-radius: 4px; display: flex; align-items: center; max-width: 200px; white-space: nowrap;">
                    <i class="fa-solid ${this.smartIcon(file.a)} fa-lg me-2"></i> 
                    <span>${truncatedName}</span>
                </div>`;
            }

            document.body.appendChild(dragIcon);
            event.dataTransfer.setDragImage(dragIcon, 0, 0);

            // Clean up the drag image element after drag starts
            setTimeout(() => {
                document.body.removeChild(dragIcon);
            }, 0);
        },
        dragOverFolder(event) {
            event.preventDefault();
        },
        dropOnFolder(event, folder) {
            event.preventDefault();
            event.stopPropagation();
            const targetPath = folder.path;

            // Check for external files first
            if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
                this.processDroppedItems(event.dataTransfer.items).then(processedFiles => {
                    if (processedFiles.length > 0) {
                        // Combine targetPath with relativePath here
                        const filesWithFullPath = processedFiles.map(item => {
                            let fullAppPath;
                            // Combine targetPath (app folder) and relativePath (from dropped item)
                            if (targetPath && item.relativePath) {
                                // Avoid double slashes if relativePath already starts with one (unlikely but safe)
                                fullAppPath = `${targetPath}/${item.relativePath.replace(/^\/+/, '')}`;
                            } else if (targetPath) {
                                fullAppPath = targetPath; // e.g., dropping an empty folder?
                            } else { // targetPath is empty (root drop)
                                fullAppPath = item.relativePath;
                            }
                            // Clean up potential double slashes from concatenation
                            fullAppPath = fullAppPath.replace(/\/+/g, '/');
                            return { file: item.file, fullAppPath: fullAppPath };
                        });

                        debugLogger.debug(`External items processed (dropped on folder "${targetPath}"):`, filesWithFullPath);
                        // Check for video files and show transcoding options
                        this.processFilesWithVideoCheck(filesWithFullPath);
                        // Prevent internal D&D logic from running for external files
                        return;
                    }
                }).catch(error => {
                    debugLogger.error("Error processing dropped items:", error);
                    alert("Error processing dropped folder/files.");
                });
                return; // Prevent internal D&D logic
            }

            // --- Existing internal D&D logic ---
            let itemIds = [];
            // ... (rest of existing internal drop logic) ...

            // Get contract ID if available (may not be for folder-only drags)
            const contractId = event.dataTransfer.getData("contractid");

            if (!itemIds.length) {
                return;
            }

            // Process each item
            itemIds.forEach(itemId => {
                if (itemId.startsWith('folder-')) {
                    // --- Handle Folder Drop ---
                    const folderPathToMove = itemId.substring('folder-'.length);

                    // Skip if moving to itself
                    if (folderPathToMove === targetPath) {
                        return;
                    }

                    // Check if this is a preset folder - don't allow moving preset folders
                    if (this.isPresetFolder(folderPathToMove)) {
                        debugLogger.warn("Cannot move preset folders");
                        return;
                    }

                    // Check if we're dropping into a subfolder of the folder being moved
                    // This would create a recursive loop and is not allowed
                    if (targetPath.startsWith(folderPathToMove + '/')) {
                        debugLogger.warn('Cannot move a folder into its own subfolder');
                        return;
                    }

                    // Find all files that are in the folder being moved or its subfolders
                    const filesInFolder = Object.values(this.files).filter(file =>
                        file.folderPath === folderPathToMove || file.folderPath.startsWith(folderPathToMove + '/')
                    );

                    if (filesInFolder.length === 0) {
                        // This is an empty folder, perhaps a newly created one
                        // We'll need to update any pending folder creation
                        for (const cid in this.pendingChanges) {
                            if (this.pendingChanges[cid].__newFolders__) {
                                // Find the index of the folder in the pending folders array
                                const index = this.pendingChanges[cid].__newFolders__.indexOf(folderPathToMove);
                                if (index !== -1) {
                                    // Remove the old path
                                    this.pendingChanges[cid].__newFolders__.splice(index, 1);

                                    // Add the new path
                                    const newPath = targetPath + '/' + folderPathToMove.split('/').pop();
                                    this.pendingChanges[cid].__newFolders__.push(newPath);
                                }
                            }
                        }
                    } else {
                        // Move all files to the new location, preserving subfolder structure
                        filesInFolder.forEach(file => {
                            // Only process files we can edit
                            if (!this.isEditable(file)) {
                                return;
                            }

                            // Calculate new path
                            // If the file is directly in the moved folder:
                            //    folderPathToMove = "docs"
                            //    file.folderPath = "docs"
                            //    targetPath = "personal"
                            //    => newPath = "personal"
                            //
                            // If the file is in a subfolder:
                            //    folderPathToMove = "docs"
                            //    file.folderPath = "docs/reports"
                            //    targetPath = "personal"
                            //    => newPath = "personal/reports"
                            let newPath;

                            if (file.folderPath === folderPathToMove) {
                                // File is directly in the folder being moved
                                newPath = targetPath;
                            } else {
                                // File is in a subfolder of the folder being moved
                                const relativePath = file.folderPath.substring(folderPathToMove.length + 1);
                                newPath = `${targetPath}/${relativePath}`;
                            }

                            const fileId = file.f;
                            const currentContractId = file.i;

                            // Skip if the file is already at the target path
                            if (file.folderPath === newPath) {
                                return;
                            }

                            // Update the file's folder path
                            file.folderPath = newPath;

                            // Update metadata
                            if (this.newMeta[currentContractId] && this.newMeta[currentContractId][fileId]) {
                                this.newMeta[currentContractId][fileId].folderPath = newPath;
                            }

                            // Update pending changes
                            this.pendingChanges[currentContractId] = this.pendingChanges[currentContractId] || {};
                            this.pendingChanges[currentContractId][fileId] = {
                                ...(this.pendingChanges[currentContractId][fileId] || {}),
                                folderPath: newPath,
                                name: this.newMeta[currentContractId]?.[fileId]?.name || fileId,
                            };

                            // Check if target folder is a virtual folder
                            // If so, move it from virtual to the contract so it's saved properly
                            if (this.pendingChanges['__virtualFolders__']?.[this.selectedUser]) {
                                const virtualFolders = this.pendingChanges['__virtualFolders__'][this.selectedUser];
                                const pathParts = newPath.split('/');

                                // Build paths for all parent folders
                                let parentPath = '';
                                for (let i = 0; i < pathParts.length; i++) {
                                    const part = pathParts[i];
                                    parentPath = parentPath ? `${parentPath}/${part}` : part;

                                    // Check if this path is in virtual folders
                                    const virtualIndex = virtualFolders.indexOf(parentPath);
                                    if (virtualIndex !== -1) {
                                        // Ensure contract has newFolders array
                                        this.pendingChanges[currentContractId]['__newFolders__'] =
                                            this.pendingChanges[currentContractId]['__newFolders__'] || [];

                                        // Add to contract's newFolders if not already there
                                        if (!this.pendingChanges[currentContractId]['__newFolders__'].includes(parentPath)) {
                                            this.pendingChanges[currentContractId]['__newFolders__'].push(parentPath);
                                            debugLogger.debug(`Converted virtual folder '${parentPath}' to real folder in contract ${currentContractId}`);
                                        }

                                        // Remove from virtual folders since it's now a real folder
                                        virtualFolders.splice(virtualIndex, 1);
                                    }
                                }
                            }
                        });
                    }
                } else {
                    // --- Handle File Drop ---
                    const fileId = itemId;
                    const file = this.files[fileId];
                    if (!file) {
                        return;
                    }

                    // Use the contractId obtained earlier if available, otherwise try to get from file
                    const currentContractId = contractId || file.i;
                    if (!currentContractId) {
                        return;
                    }

                    if (!this.isEditable(file)) {
                        return;
                    }

                    const originalPath = file.folderPath || '';
                    const newPath = folder.path;

                    if (originalPath === newPath) {
                        return;
                    }

                    // Update the file's folder path
                    file.folderPath = newPath;

                    // Update metadata in newMeta
                    if (this.newMeta[currentContractId] && this.newMeta[currentContractId][fileId]) {
                        this.newMeta[currentContractId][fileId].folderPath = newPath;
                    }

                    // Update pending changes
                    this.pendingChanges[currentContractId] = this.pendingChanges[currentContractId] || {};
                    this.pendingChanges[currentContractId][fileId] = {
                        ...(this.pendingChanges[currentContractId][fileId] || {}),
                        folderPath: newPath,
                        name: this.newMeta[currentContractId]?.[fileId]?.name || fileId,
                    };
                }
            });

            this.buildFolderTrees();
            this.$nextTick(() => {
                this.render();
            });
        },
        dragOverBreadcrumb(event) {
            event.preventDefault();
        },
        dropOnBreadcrumb(path, event) {
            event.preventDefault();
            let itemIds = [];

            // Check for multiple items
            const itemIdsStr = event.dataTransfer.getData("itemids");
            if (itemIdsStr) {
                try {
                    itemIds = JSON.parse(itemIdsStr);
                } catch (e) {
                    const textData = event.dataTransfer.getData("text/plain");
                    if (textData) itemIds = textData.split('\n');
                }
            } else {
                const textData = event.dataTransfer.getData("text/plain");
                if (textData) itemIds = textData.split('\n');
            }

            const contractId = event.dataTransfer.getData("contractid");
            const targetPath = path == null ? '' : path;

            if (!itemIds.length) {
                return;
            }

            // Process each item
            itemIds.forEach(itemId => {
                if (itemId.startsWith('folder-')) {
                    // --- Handle Folder Drop ---
                    const folderPathToMove = itemId.substring('folder-'.length);

                    // Skip if moving to itself
                    if (folderPathToMove === targetPath) {
                        return;
                    }

                    // Check if this is a preset folder - don't allow moving preset folders
                    if (this.isPresetFolder(folderPathToMove)) {
                        debugLogger.warn("Cannot move preset folders");
                        return;
                    }

                    // Check if we're dropping into a subfolder of the folder being moved
                    if (targetPath.startsWith(folderPathToMove + '/')) {
                        debugLogger.warn('Cannot move a folder into its own subfolder');
                        return;
                    }

                    // Find all files that are in the folder being moved or its subfolders
                    const filesInFolder = Object.values(this.files).filter(file =>
                        file.folderPath === folderPathToMove || file.folderPath.startsWith(folderPathToMove + '/')
                    );

                    if (filesInFolder.length === 0) {
                        // This is an empty folder, perhaps a newly created one
                        // We'll need to update any pending folder creation
                        for (const cid in this.pendingChanges) {
                            if (this.pendingChanges[cid].__newFolders__) {
                                // Find the index of the folder in the pending folders array
                                const index = this.pendingChanges[cid].__newFolders__.indexOf(folderPathToMove);
                                if (index !== -1) {
                                    // Remove the old path
                                    this.pendingChanges[cid].__newFolders__.splice(index, 1);

                                    // Add the new path, keeping the folder name but changing the parent location
                                    const folderName = folderPathToMove.split('/').pop();
                                    const newPath = targetPath ? `${targetPath}/${folderName}` : folderName;
                                    this.pendingChanges[cid].__newFolders__.push(newPath);
                                }
                            }
                        }
                    } else {
                        // Move all files to the new location, preserving subfolder structure
                        filesInFolder.forEach(file => {
                            // Only process files we can edit
                            if (!this.isEditable(file)) {
                                return;
                            }

                            // Calculate new path
                            let newPath;

                            if (file.folderPath === folderPathToMove) {
                                // File is directly in the folder being moved
                                newPath = targetPath;
                            } else {
                                // File is in a subfolder of the folder being moved
                                const relativePath = file.folderPath.substring(folderPathToMove.length + 1);
                                newPath = targetPath ? `${targetPath}/${relativePath}` : relativePath;
                            }

                            const fileId = file.f;
                            const currentContractId = file.i;

                            // Skip if the file is already at the target path
                            if (file.folderPath === newPath) {
                                return;
                            }

                            // Update the file's folder path
                            file.folderPath = newPath;

                            // Update metadata
                            if (this.newMeta[currentContractId] && this.newMeta[currentContractId][fileId]) {
                                this.newMeta[currentContractId][fileId].folderPath = newPath;
                            }

                            // Update pending changes
                            this.pendingChanges[currentContractId] = this.pendingChanges[currentContractId] || {};
                            this.pendingChanges[currentContractId][fileId] = {
                                ...(this.pendingChanges[currentContractId][fileId] || {}),
                                folderPath: newPath,
                                name: this.newMeta[currentContractId]?.[fileId]?.name || fileId,
                            };
                        });
                    }
                } else {
                    // --- Handle File Drop ---
                    const fileId = itemId;
                    const file = this.files[fileId];
                    if (!file) {
                        return;
                    }

                    const currentContractId = contractId || file.i;
                    if (!currentContractId) {
                        return;
                    }

                    if (!this.isEditable(file)) {
                        return;
                    }

                    const originalPath = file.folderPath || '';

                    if (originalPath === targetPath) {
                        return;
                    }

                    // Update the canonical file object
                    file.folderPath = targetPath;

                    // Update newMeta (if it exists)
                    if (this.newMeta[currentContractId]?.[fileId]) {
                        this.newMeta[currentContractId][fileId].folderPath = targetPath;
                    }

                    // Update pending changes
                    this.pendingChanges[currentContractId] = this.pendingChanges[currentContractId] || {};
                    this.pendingChanges[currentContractId][fileId] = {
                        ...(this.pendingChanges[currentContractId][fileId] || {}),
                        folderPath: targetPath,
                        name: this.pendingChanges[currentContractId]?.[fileId]?.name || this.newMeta[currentContractId]?.[fileId]?.name || fileId,
                    };
                }
            });

            this.buildFolderTrees();
            this.$nextTick(() => {
                this.render();
            });
        },
        saveChanges() {
            if (!this.account) {
                alert("Please log in to save changes.");
                return;
            }

            // Check if there are any pending changes
            if (!this.pendingChanges || Object.keys(this.pendingChanges).length === 0) {
                alert("No pending changes to save.");
                return;
            }

            const transactionPayloads = []; // Collect payloads first

            // --- Logic to calculate payloads (as before) ---
            for (const contractId in this.pendingChanges) {
                if (!this.contract[contractId]) {
                    // console.warn(`Contract ${contractId} not found in this.contract. Skipping.`);
                    continue;
                }

                const contractChanges = this.pendingChanges[contractId];
                const originalContract = this.contract[contractId];
                const originalMeta = this.newMeta[contractId];
                const m = originalContract.m || "";
                let contractData = originalContract.m.split(',')[0]
                let parts = contractData.split("|");
                let encData = parts[0] || "1";
                if (parts.length === 1 && m.includes(",")) {
                    const temp = m.split(",")
                    encData = temp[0] || "1"
                }
                const finalFileStates = {};
                const allFileCIDs = Object.keys(originalContract.df || {});
                let folderRename = null;
                if (contractChanges.__newFolders__ && contractChanges.__newFolders__.length > 0) {
                    const newFolders = contractChanges.__newFolders__;
                    if (newFolders.length === 1) {
                        const newFolderPath = newFolders[0];
                        const newFolderName = newFolderPath.split('/').pop();
                        const originalPaths = new Set();
                        allFileCIDs.forEach(cid => {
                            const originalFileData = originalMeta?.[cid] || {};
                            if (originalFileData.folderPath) {
                                originalPaths.add(originalFileData.folderPath);
                            }
                        });
                        if (originalPaths.size === 1) {
                            const originalPath = Array.from(originalPaths)[0];
                            const originalName = originalPath.split('/').pop();
                            const originalParent = originalPath.split('/').slice(0, -1).join('/');
                            const newParent = newFolderPath.split('/').slice(0, -1).join('/');
                            if (originalParent === newParent) {
                                folderRename = {
                                    from: originalPath,
                                    to: newFolderPath,
                                    fromName: originalName,
                                    toName: newFolderName
                                };
                            }
                        }
                    }
                }
                allFileCIDs.forEach(cid => {
                    const originalFileData = originalMeta?.[cid] || {};
                    const changedFileData = contractChanges[cid] || {};
                    let finalFolderPath = originalFileData.folderPath || '';
                    if (folderRename && finalFolderPath === folderRename.from) {
                        finalFolderPath = folderRename.to;
                    } else if (changedFileData.hasOwnProperty('folderPath')) {
                        finalFolderPath = changedFileData.folderPath;
                    }
                    const finalName = changedFileData.name || originalFileData.name || cid;
                    finalFileStates[cid] = {
                        ...originalFileData,
                        name: finalName,
                        folderPath: finalFolderPath,
                        type: originalFileData.type || "",
                        thumb: originalFileData.thumb || "",
                        thumb_data: originalFileData.thumb_data || "",
                        flags: originalFileData.flags || 0,
                        license: originalFileData.license || "",
                        labels: originalFileData.labels || "",
                        encrypted: originalFileData.encrypted || false,
                        is_thumb: originalFileData.is_thumb || false,
                    };
                });
                const allPaths = new Set(['']);
                Object.values(finalFileStates).forEach(file => {
                    if (file.is_thumb) return;
                    const path = file.folderPath || '';
                    allPaths.add(path);
                    const parts = path.split('/').filter(Boolean);
                    let current = '';
                    for (let i = 0; i < parts.length; i++) {
                        current = current ? `${current}/${parts[i]}` : parts[i];
                        allPaths.add(current);
                    }
                });
                if (contractChanges.__newFolders__) {
                    contractChanges.__newFolders__.forEach(newPath => {
                        allPaths.add(newPath);
                        const parts = newPath.split('/').filter(Boolean);
                        let current = '';
                        for (let i = 0; i < parts.length; i++) {
                            current = current ? `${current}/${parts[i]}` : parts[i];
                            allPaths.add(current);
                        }
                    });
                }
                const sortedPaths = Array.from(allPaths).sort((a, b) => {
                    const depthA = a.split('/').length;
                    const depthB = b.split('/').length;
                    if (depthA !== depthB) return depthA - depthB;
                    return a.localeCompare(b);
                });
                const indexToPath = {};
                const pathToIndex = {};
                const presetFoldersMap = {
                    "Documents": "2", "Images": "3", "Videos": "4", "Music": "5",
                    "Archives": "6", "Code": "7", "Trash": "8", "Misc": "9"
                };
                let nextCustomIndex = 0;
                let folderListEntries = [];
                indexToPath["0"] = '';
                pathToIndex[''] = "0";
                folderListEntries.push('');
                sortedPaths.forEach(path => {
                    if (path === '') return;
                    const parts = path.split('/');
                    const folderName = parts[parts.length - 1];
                    const parentPath = parts.slice(0, -1).join('/');
                    const parentIndex = pathToIndex[parentPath];
                    if (!parentIndex) {
                        console.error(`Error: Parent path '${parentPath}' for folder '${path}' not found in pathToIndex. Skipping.`);
                        return;
                    }

                    let assignedIndex;
                    if (parts.length === 1 && presetFoldersMap[folderName]) {
                        assignedIndex = presetFoldersMap[folderName];
                    } else {
                        assignedIndex = this.numberToBase58(nextCustomIndex);
                    }
                    indexToPath[assignedIndex] = path;
                    pathToIndex[path] = assignedIndex;
                    const entry = (parentIndex === "0") ? folderName : `${parentIndex}/${folderName}`;
                    folderListEntries.push(entry);
                    nextCustomIndex++
                    if (nextCustomIndex == 1) nextCustomIndex = 9;
                });
                Object.entries(presetFoldersMap).forEach(([name, index]) => {
                    if (allPaths.has(name) && !folderListEntries.some(entry => entry === name)) {
                        const topLevelFolders = folderListEntries.filter(e => e && !e.includes('/'));
                        topLevelFolders.push(name);
                        topLevelFolders.sort();
                        const insertIndex = topLevelFolders.indexOf(name);
                        let mainListInsertIndex = 1;
                        let topLevelCount = 0;
                        while (mainListInsertIndex < folderListEntries.length && topLevelCount < insertIndex) {
                            if (folderListEntries[mainListInsertIndex] && !folderListEntries[mainListInsertIndex].includes('/')) {
                                topLevelCount++;
                            }
                            mainListInsertIndex++;
                        }
                        folderListEntries.splice(mainListInsertIndex, 0, name);
                    }
                });
                const newFolderListStr = folderListEntries.join("|");
                debugLogger.debug({ newFolderListStr })
                const newFilesMetadata = [];
                const sortedFileCIDs = Object.keys(originalContract.df || {}).sort();
                sortedFileCIDs.forEach(cid => {
                    const fileState = finalFileStates[cid];
                    const folderPath = fileState?.folderPath || "";
                    // Ensure folderIndex is correctly retrieved or defaulted
                    let folderIndex = folderPath ? pathToIndex[folderPath] : pathToIndex['']; // Use root index if path is empty
                    if (folderIndex === undefined) {
                        folderIndex = "1";
                    }

                    const flagsNum = fileState.flags || 0;
                    const flagsB64 = this.NumberToBase64(flagsNum) || '0';
                    const licenseStr = fileState.license || "";
                    const labelsStr = fileState.labels || "";
                    const flagsCombined = `${flagsB64}-${licenseStr}-${labelsStr}`;
                    // Ensure folderIndex is a string before using it
                    const folderIndexStr = typeof folderIndex === 'string' ? folderIndex : "1"; // Default to root index '0'
                    const entry = `${fileState.name || ""},${fileState.type || 'unk'}${(folderIndexStr !== "1") ? '.' + folderIndexStr : ''},${fileState.thumb || ''},${flagsCombined}`;
                    newFilesMetadata.push(entry);
                });
                const newFilesMetadataStr = newFilesMetadata.join(',');
                let finalMetaString;
                if (encData) {
                    const folderPart = (!newFolderListStr.length || newFolderListStr.startsWith('|')) ? newFolderListStr : `|${newFolderListStr}`;
                    finalMetaString = `${encData}${folderPart},${newFilesMetadataStr}`;
                } else {
                    finalMetaString = `1${newFolderListStr},${newFilesMetadataStr}`;
                }
                const newMetaString = finalMetaString;

                if (newMetaString.length > 8000) {
                    alert(`Metadata size for contract ${contractId} exceeds 8000 bytes (${newMetaString.length}). Please save fewer changes at a time.`);
                    continue;
                }

                // Add payload to the list for later emission
                const originalMetadata = this.contract[contractId].m || '';
                const newMetadata = newMetaString;

                // Create a diff using jsdiff
                const metadataDiff = Diff.createPatch('metadata', originalMetadata, newMetadata);

                // Determine if using diff is more efficient (smaller)
                const useDiff = false //metadataDiff.length < newMetadata.length;

                transactionPayloads.push({
                    contractId: contractId,
                    metadata: useDiff ? undefined : newMetadata,
                    diff: useDiff ? metadataDiff : undefined
                });
            }

            // Check if there are any payloads to send
            if (transactionPayloads.length === 0) {
                alert("No valid changes to save.");
                return;
            }

            // --- Prepare single update object for multiple contracts --- 
            const updates = {};

            transactionPayloads.forEach(payload => {
                // Add either metadata or diff to the updates object, keyed by contractId
                if (payload.metadata) {
                    // Use full metadata update
                    if (!updates[payload.contractId]) {
                        updates[payload.contractId] = {};
                    }
                    updates[payload.contractId].m = payload.metadata;
                } else if (payload.diff) {
                    // Use diff update
                    if (!updates[payload.contractId]) {
                        updates[payload.contractId] = {};
                    }
                    updates[payload.contractId].diff = payload.diff;
                }
            });

            // Check the size of the updates object
            const updatesPayload = { updates: updates };
            const payloadSize = JSON.stringify(updatesPayload).length;
            const MAX_SIZE = 7500; // Maximum size in bytes

            if (payloadSize > MAX_SIZE) {
                alert(`Updates payload size (${payloadSize} bytes) exceeds the maximum allowed size (${MAX_SIZE} bytes). Please save fewer changes at a time.`);
                return;
            }

            // Emit a single transaction with all updates bundled
            const opData = {
                type: 'cj', // Custom JSON
                cj: updatesPayload, // All updates in one object
                id: 'spkccT_update_metadata', // The required_posting_auths id for the custom_json
                msg: `Updating metadata for ${Object.keys(updates).length} contracts`,
                ops: ['getSPKUser', { op: 'propogate_changes', args: [`revertPendingChanges`] }], // Custom ops array to trigger cleanup for all contracts
                txid: `saveMeta_batch_${Date.now()}`, // Unique ID for tracking
                key: 'Posting' // Specify Posting key
            };

            debugLogger.debug("Emitting tosign for batch update:", opData);
            this.$emit('tosign', opData);

            // **DO NOT** clear pending changes or re-init here.
            alert(`Preparing update for ${Object.keys(updates).length} contract(s) for signing to save changes.`);
        },
        isValidMetadata(metadataString) {
            // build arrays to validate each portion of the metadata
            let metaData = metadataString.split(',')

            debugLogger.debug(`Validating metadata with ${metaData.length} parts`);

            // Isolate the first portion of the metadata, this is the contract data
            const contractData = metaData[0]
            // Isolate the rest of the metadata, this is the file metadata
            const metadata = metaData.splice(1)

            if (metadata.length % 4 !== 0) {
                debugLogger.debug(`Metadata validation failed: File metadata length (${metadata.length}) is not a multiple of 4`);
                return false;
            }

            // Validate the first character of the contract data containing 6 bitwise flags, we will assume the first character is a 1 if none are present
            // its valid as a base64 character
            let firstChar = contractData.split('')[0]
            // if the first character is a # or |, we will set the first character is a 1
            if (firstChar == '#') {
                firstChar = "1"
            }
            if (firstChar == '|') {
                firstChar = "1"
            }
            // test to see it's a valid character
            let simpleTest = this.Base64toNumber(firstChar) + 1
            if (typeof simpleTest !== 'number') {
                debugLogger.debug(`Metadata validation failed: First character '${firstChar}' is not a valid Base64 character`);
                return false
            }

            // Verify encryption keys if present
            let encryptionData = contractData.split('#')
            encryptionData[encryptionData.length - 1] = encryptionData[encryptionData.length - 1].split('|')[0]
            encryptionData = encryptionData.splice(1)
            for (let i = 0; i < encryptionData.length; i++) {
                let key = encryptionData[i];
                if (key.endsWith(';')) {
                    key = key.substring(0, key.length - 1);
                }
                let atIndex = key.indexOf('@');
                if (atIndex === -1) {
                    debugLogger.debug(`Metadata validation failed: Missing @ in encryption key ${key}`);
                    return false;
                }
                let cipher = key.substring(0, atIndex);
                if (!/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(cipher)) {
                    debugLogger.debug(`Metadata validation failed: Invalid cipher format in encryption key: '${cipher}'`);
                    return false;
                }
                let account = key.substring(atIndex + 1);
                if (!/^[a-z0-9-.]{1,16}$/.test(account)) {
                    debugLogger.debug(`Metadata validation failed: Invalid account format in encryption key: '${account}'`);
                    return false;
                }
            }

            // Verify folder data
            let folderData = contractData.split('|')
            folderData = folderData.splice(1)
            if (folderData.length > 48) {
                debugLogger.debug(`Metadata validation failed: Too many folders (${folderData.length}), maximum is 48`);
                return false;
            }

            let folderIndexMap = new Map(); // Track folder indices by path
            folderIndexMap.set('', 0); // Root folder
            let k = 0
            for (let i = 0; i < folderData.length; i++) {
                let folderPath = folderData[i];
                let pathParts = folderPath.split('/');
                for (let j = 0; j < pathParts.length; j++) {
                    let part = pathParts[j];
                    if (j < pathParts.length - 1) {
                        // Parent indices
                        if (!part.match(/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/)) {
                            debugLogger.debug(`Metadata validation failed: Invalid parent folder index format: '${part}'`);
                            return false;
                        }
                        let parentIndex = this.base58ToNumber(part);
                        if (!folderIndexMap.has(parentIndex)) {
                            debugLogger.debug(`Metadata validation failed: Parent folder index not found: ${parentIndex}`);
                            return false;
                        }
                    } else {
                        // Folder name
                        if (!part.match(/^[0-9a-zA-Z+_.\- ]{2,16}$/)) {
                            debugLogger.debug(`Metadata validation failed: Invalid folder name format: '${part}'`);
                            return false;
                        }
                        folderIndexMap.set(k + 1, folderPath); // Assign index to path
                        if (k == 0) {
                            for (var l = 2; l < 10; l++) {
                                folderIndexMap.set(l, l)
                            }
                            k = 9
                        }
                        k++
                    }
                }
            }

            // if folderIndexMap is < 9, fill with dummy values
            for (let i = folderIndexMap.size; i < 9; i++) {
                folderIndexMap.set(i, i)
            }

            if (!validateFileMetadata(metadata, folderIndexMap)) {
                // Validation error is logged in validateFileMetadata
                return false;
            }

            debugLogger.debug('Metadata validation passed');
            return true;

            function validateFileMetadata(metadataStr, folderIndexMap) {
                // Split the metadata string into file entries (each entry has 4 fields)
                const fileEntries = [];
                for (let i = 0; i < metadataStr.length; i += 4) {
                    if (i + 4 <= metadataStr.length) {
                        fileEntries.push(metadataStr.slice(i, i + 4));
                    } else {
                        debugLogger.debug(`Metadata validation failed: Incomplete file entry at position ${i}`);
                        return false;
                    }
                }

                // Regex patterns for validation
                const namePattern = /^[^,]{1,32}$/u; // Up to 32 chars, no commas, Unicode support
                const typePattern = /^[a-z0-9]{1,4}(?:\.[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+)?$/; // Up to 4 lowercase chars/numbers, optional .folderIndex
                const ipfsPattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/; // Simplified IPFS CID pattern
                const urlPattern = /^(https?:\/\/[^\s$.?#].[^\s]*)$/; // Valid full URL
                const flagsPattern = /^([0-9a-zA-Z+/=]?)-([0-9a-zA-Z+/=]?)-([0-9a-zA-Z+/=]*)$/;// Two base64 chars with hyphens, then several base64 chars

                // Validate each file entry
                for (let i = 0; i < fileEntries.length; i++) {
                    const entry = fileEntries[i];
                    if (entry.length !== 4) {
                        debugLogger.debug(`Metadata validation failed: File entry ${i} has ${entry.length} fields, expected 4`);
                        return false;
                    }

                    const [name, type, thumb, flagsCombined] = entry;

                    // Validate name
                    if (!namePattern.test(name)) {
                        debugLogger.debug(`Metadata validation failed: Invalid file name format: '${name}'`);
                        return false;
                    }

                    // Validate type
                    if (!typePattern.test(type)) {
                        debugLogger.debug(`Metadata validation failed: Invalid file type format: '${type}'`);
                        return false;
                    }
                    const typeParts = type.split('.');
                    if (typeParts.length > 1 && !folderIndexMap.has(typeParts[1])) {
                        debugLogger.debug(`Metadata validation failed: Invalid folder index in type: '${type}', folder index '${typeParts[1]}' not found`);
                        return false;
                    }

                    // Validate thumb (IPFS CID or URL)
                    if (thumb && !ipfsPattern.test(thumb) && !urlPattern.test(thumb)) {
                        debugLogger.debug(`Metadata validation failed: Invalid thumbnail format: '${thumb}'`);
                        return false;
                    }

                    // Validate flagsCombined
                    if (flagsCombined && !flagsPattern.test(flagsCombined)) {
                        debugLogger.debug(`Metadata validation failed: Invalid flags format: '${flagsCombined}'`);
                        return false;
                    }
                }

                return true; // All entries are valid
            }
        },
        handleChangesConfirmed(contractId) {
            debugLogger.debug(`Handling confirmed changes for contract: ${contractId}`);
            if (this.pendingChanges[contractId]) {
                // Remove the specific contract's changes from pendingChanges
                delete this.pendingChanges[contractId];

                // Use Vue.delete for reactivity if pendingChanges is reactive
                // this.$delete(this.pendingChanges, contractId);

                // Create a new object to ensure reactivity if the above doesn't work
                this.pendingChanges = { ...this.pendingChanges };

                // Persist the updated pendingChanges to localStorage
                if (this.localStorageKey) {
                    try {
                        if (Object.keys(this.pendingChanges).length > 0) {
                            localStorage.setItem(this.localStorageKey, JSON.stringify(this.pendingChanges));
                        } else {
                            localStorage.removeItem(this.localStorageKey);
                        }
                        // debugLogger.debug(`Updated localStorage after confirming changes for ${contractId}`);
                    } catch (e) {
                        console.error("Error saving updated pending changes to localStorage:", e);
                    }
                }

                // Re-initialize data to reflect the saved state from the blockchain
                this.init();
                // debugLogger.debug(`Re-initialized data after confirming changes for ${contractId}`);

            } else {
                console.warn(`Received confirmation for ${contractId}, but no pending changes found.`);
            }
        },
        smartIcon(flags = "") {
            if (!flags[0]) return 'fa-solid fa-file'
            const flag = this.flagDecode(flags[0])
            if (flag.enc) return 'fa-solid fa-file-shield'
            else if (flag.nsfw) return 'fa-solid fa-triangle-exclamation'
            else if (flag.executable) return 'fa-solid fa-cog'
            else return 'fa-solid fa-file'
        },
        smartColor(flags = "") {
            if (!flags[0]) return 'bg-info'
            const flag = this.flagDecode(flags[0])
            if (flag.nsfw) return 'bg-danger'
            else if (flag.executable) return 'bg-warning'
            else if (flag.enc) return 'bg-dark'
            else return 'bg-info'
        },
        smartThumb(contract, cid) {
            if (this.newMeta[contract][cid].thumb.includes('https://')) {
                return this.newMeta[contract][cid].thumb
            } else if (this.newMeta[contract][cid].thumb.includes('Qm')) {
                return `https://ipfs.dlux.io/ipfs/${this.newMeta[contract][cid].thumb}`
            } else return false
        },
        blockToTime(block) {
            const now = new Date().getTime()
            const then = new Date(now - ((this.saccountapi.head_block) * 3000))
            // simple ago or until format

            return then.toLocaleDateString()
        },
        fancyBytes(bytes, decimals = 0) {
            var counter = 0, p = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
            while (bytes > 1024) {
                bytes = bytes / 1024
                counter++
            }
            return `${this.toFixed(bytes, decimals)} ${p[counter]}B`
        },
        toFixed(n, digits) {
            return parseFloat(n).toFixed(digits)
        },
        copyText(text) {
            navigator.clipboard.writeText(text)
        },
        flagDecode(flags = "") {
            var num = this.Base64toNumber(flags[0])
            var out = {
                enc: num & 1,
                autoRenew: num & 2,
                nsfw: num & 4,
                executable: num & 8
            }
            return out
        },
        flagsDecode(flags = "", only = 0, omit = 0) {
            var num = typeof flags == "string" ? this.Base64toNumber(flags[0]) : flags
            var out = []
            if (only) num = num & only
            if (omit) num = num & ~omit
            if (num & 1) out.push({ fa: 'fa-solid fa-lock text-primary fa-fw', l: "Encrypted" })
            if (num & 2) out.push({ fa: 'fa-solid fa-arrows-rotate text-success fa-fw fa-spin', l: "Thumbnail" })
            if (num & 4) out.push({ fa: 'fa-solid fa-radiation text-warning fa-fw', l: "NSFW" })
            if (num & 8) out.push({ fa: 'fa-regular fa-file-code text-info fa-fw', l: "Executable" })
            return out
        },
        labelsDecode(flags = "", only = -1) {
            var arr = []
            if (!flags || typeof flags !== 'string' || flags.length === 0) return arr; // Added check for non-string/empty flags
            const len = only >= 0 ? 1 : flags.length;
            for (var i = (only >= 0 ? only : 0); i < len; i++) {
                const labelKey = flags[i];
                const labelData = this.labels[labelKey]; // Get label data
                if (labelData) { // Check if labelData is found
                    arr.push(labelData);
                } else {
                    // Optional: Log a warning if an invalid key is found
                    console.warn(`Invalid label key "${labelKey}" found in file data. Skipping.`);
                }
            }
            arr = new Set(arr); // Remove potential duplicates
            return new Array(...arr); // Return array of valid label objects
        },
        Base64toNumber(chars = "0") {
            if (typeof chars != 'string') {
                return 0
            }
            const glyphs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
            var result = 0;
            chars = chars.split("");
            for (var e = 0; e < chars.length; e++) {
                result = result * 64 + glyphs.indexOf(chars[e]);
            }
            return result;
        },
        NumberToBase64(num) {
            const glyphs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
            var result = "";
            while (num > 0) {
                result = glyphs[num % 64] + result;
                num = Math.floor(num / 64);
            }
            return result;
        },
        decode(id) {
            return new Promise((resolve, reject) => {
                const key = this.contract[id].encryption.accounts[this.account].enc_key;
                hive_keychain.requestVerifyKey(this.account, key, 'Memo', (response) => {
                    if (response.success) {
                        this.contract[id].encryption.key = response.result.split('#')[1]
                        resolve("OK")
                    } else {
                        reject(response.message);
                    }
                });
            })
        },
        render() {
            debugLogger.debug('Rendering with filters:',
                {
                    search: this.filesSelect.search,
                    flags: this.filterFlags,
                    labels: this.filterLabels,
                    owners: JSON.parse(JSON.stringify(this.filesSelect.addusers)),
                    cc_only: this.filesSelect.cc_only,
                    currentFolderPath: this.currentFolderPath
                }
            );

            // Start with all non-thumbnail files
            let filteredFiles = Object.values(this.files).filter(file => !file.is_thumb);

            // Apply owner/view filters
            filteredFiles = filteredFiles.filter(file => {
                const ownerViewSetting = this.filesSelect.addusers[file.o];
                switch (ownerViewSetting) {
                    case false:
                        return false; // Explicitly hidden
                    case 'lock':
                        // Show only if encrypted OR user has decryption key (check contract)
                        const isEncrypted = (file.lf & 1);
                        const canDecrypt = this.contract[file.i]?.encryption?.accounts?.[this.account] || this.contract[file.i]?.encryption?.key;
                        return isEncrypted && canDecrypt;
                    case 'cc':
                        // Show only if CC licensed
                        return !!file.lic && file.lic !== '0'; // Check if license exists and is not '0'
                    case true:
                        return true; // Explicitly shown
                    default:
                        // If user is not in addusers, default based on whether it's the page owner
                        return file.o === this.saccountapi.name;
                }
            });

            // Keep track of all files that match the search/tag/label criteria
            // but may not be in the current folder - we'll use this for breadcrumb counts
            let allMatchingFiles = [...filteredFiles];

            // Apply search filter (case-insensitive)
            if (this.filesSelect.search) {
                const searchTerm = this.filesSelect.search.toLowerCase();
                allMatchingFiles = allMatchingFiles.filter(file =>
                    (file.n || file.f).toLowerCase().includes(searchTerm)
                );
            }

            // Apply label filter (must contain ALL selected labels)
            if (this.filterLabels) {
                const requiredLabels = this.filterLabels.split('');
                allMatchingFiles = allMatchingFiles.filter(file => {
                    const fileLabels = (file.l || '').split('');
                    return requiredLabels.every(reqLabel => fileLabels.includes(reqLabel));
                });
            }

            // Apply flag filter (must contain ALL selected flags - bitwise AND)
            if (this.filterFlags > 0) {
                allMatchingFiles = allMatchingFiles.filter(file =>
                    (file.lf & this.filterFlags) === this.filterFlags
                );
            }

            // Apply CC-only filter (if enabled, only show own files or CC licensed files)
            if (this.filesSelect.cc_only) {
                allMatchingFiles = allMatchingFiles.filter(file =>
                    file.o === this.account || (!!file.lic && file.lic !== '0')
                );
            }

            // Now filter by current folder path only if search or other filters are active
            let isSearchActive = this.filesSelect.search || this.filterLabels || this.filterFlags > 0;

            if (this.currentFolderPath) {
                // When in a folder, show files from that folder and its subfolders if searching
                filteredFiles = allMatchingFiles.filter(file => {
                    if (isSearchActive) {
                        // If searching, include files in this folder and all subfolders
                        return file.folderPath === this.currentFolderPath ||
                            file.folderPath.startsWith(this.currentFolderPath + '/');
                    } else {
                        // If not searching, show only files directly in this folder
                        return file.folderPath === this.currentFolderPath;
                    }
                });
            } else {
                // When at root, show only root files if not searching
                filteredFiles = allMatchingFiles.filter(file => {
                    if (isSearchActive) {
                        // If searching, include all matching files
                        return true;
                    } else {
                        // If not searching, show only files directly in root
                        return !file.folderPath || file.folderPath === '';
                    }
                });
            }

            // Compute breadcrumb search counts if search is active
            if (isSearchActive) {
                this.breadcrumbCounts = this.computeBreadcrumbCounts(allMatchingFiles);
            } else {
                this.breadcrumbCounts = {};
            }

            // Apply sorting
            filteredFiles.sort((a, b) => {
                let comparison = 0;
                const dirMultiplier = this.filesSelect.dir === 'asc' ? 1 : -1;

                switch (this.filesSelect.sort) {
                    case 'time':
                        comparison = a.c - b.c;
                        break;
                    case 'size':
                        comparison = a.s - b.s;
                        break;
                    case 'name':
                        comparison = (a.n || a.f).localeCompare(b.n || b.f);
                        break;
                    case 'type':
                        // Ensure type comparison is consistent
                        const typeA = a.y || '';
                        const typeB = b.y || '';
                        comparison = typeA.localeCompare(typeB);
                        break;
                    case 'exp':
                        comparison = a.e - b.e;
                        break;
                }
                return comparison * dirMultiplier;
            });

            // Update the reactive array used by the template
            this.filesArray = filteredFiles;
            debugLogger.debug('Render complete. Files matching filters:', this.filesArray.length, 'Total matching anywhere:', allMatchingFiles.length); // Debug log
        },

        // Helper method to compute the number of matching files at each breadcrumb level
        computeBreadcrumbCounts(matchingFiles) {
            const counts = {};

            // Count files at root level
            counts[''] = matchingFiles.filter(file => !file.folderPath || file.folderPath === '').length;

            // Count files at each folder level
            matchingFiles.forEach(file => {
                if (!file.folderPath) return;

                // Count files for each folder level in the path
                const pathParts = file.folderPath.split('/').filter(Boolean);
                let currentPath = '';

                for (let i = 0; i < pathParts.length; i++) {
                    currentPath = currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i];

                    if (!counts[currentPath]) {
                        counts[currentPath] = 0;
                    }

                    // If this file is directly in this folder (not a subfolder)
                    if (file.folderPath === currentPath) {
                        counts[currentPath]++;
                    }
                }
            });

            return counts;
        },

        getImgData(id, cid) {
            return new Promise((resolve, reject) => {
                var string = this.smartThumb(id, cid)
                if (string.includes("https://")) fetch(string).then(response => response.text()).then(data => {
                    if (data.indexOf('data:image/') >= 0) this.newMeta[id][cid].thumb_data = data
                    else this.newMeta[id][cid].thumb_data = string
                    this.newMeta[id][cid].thumb_loaded = true
                    resolve(this.newMeta[id][cid].thumb_data)
                }).catch(e => {
                    this.newMeta[id][cid].thumb_data = string
                    this.newMeta[id][cid].thumb_loaded = true
                    resolve(this.newMeta[id][cid].thumb_data)
                })
            })
        },
        // Lazy load thumbnails for files in current folder
        loadThumbnailsForCurrentFolder() {
            const currentFiles = this.getFiles(this.selectedUser, this.currentFolderPath);
            currentFiles.forEach(file => {
                if (this.newMeta[file.i] && this.newMeta[file.i][file.f]) {
                    const meta = this.newMeta[file.i][file.f];
                    // Only load if has thumbnail and not already loaded
                    if (meta.thumb && !meta.thumb_loaded) {
                        this.getImgData(file.i, file.f);
                    }
                }
            });
        },
        parseFolderList(folderListStr) {
            var folderEntries = folderListStr.split("|").filter(Boolean);
            const indexToPath = {
                "0": "",
                "1": folderEntries[0],
                "2": "Documents",
                "3": "Images",
                "4": "Videos",
                "5": "Music",
                "6": "Archives",
                "7": "Code",
                "8": "Trash",
                "9": "Misc",
            };
            folderEntries = folderEntries.splice(1)
            let currentIndex = 9;

            for (const entry of folderEntries) {
                let fullPath;
                if (entry.includes("/")) {
                    const [parentIndex, subfolderName] = entry.split("/");
                    const parentPath = indexToPath[parentIndex];
                    if (!parentPath) throw new Error(`Parent index ${parentIndex} not found`);
                    fullPath = `${parentPath}/${subfolderName}`;
                } else {
                    fullPath = entry;
                }
                const index = this.numberToBase58(currentIndex);
                indexToPath[index] = fullPath;
                currentIndex++;
            }
            return indexToPath;
        },
        buildFolderTree(files) {
            // Root node acts as a temporary container
            const rootNode = { name: '__root__', path: '', files: [], subfolders: {} }; // Use object for subfolders for quick lookup

            // Helper to find or create folder nodes based on path parts
            const ensureNodePath = (path) => {
                let currentNode = rootNode;
                const parts = path.split('/').filter(Boolean);
                let currentPath = '';
                for (const part of parts) {
                    currentPath = currentPath ? `${currentPath}/${part}` : part;
                    if (!currentNode.subfolders[part]) {
                        currentNode.subfolders[part] = {
                            name: part,
                            path: currentPath,
                            files: [],
                            subfolders: {} // Still use object here
                        };
                    }
                    currentNode = currentNode.subfolders[part];
                }
                return currentNode;
            };

            // Populate tree with files
            for (const file of files) {
                const folderPath = file.folderPath || ''; // Default to root
                const targetNode = ensureNodePath(folderPath);
                targetNode.files.push(file);
            }

            // Recursive function to convert the temp structure (objects) to the final array structure
            const convertNode = (node) => {
                // Sort files?
                node.files.sort((a, b) => (a.n || a.f).localeCompare(b.n || b.f));

                const subfoldersArray = Object.values(node.subfolders)
                    .map(convertNode) // Convert children first
                    .sort((a, b) => a.name.localeCompare(b.name)); // Sort converted children by name

                return {
                    name: node.name,
                    path: node.path,
                    files: node.files,
                    subfolders: subfoldersArray // Final structure uses array
                };
            };

            // Convert the subfolders of the temporary root node
            // The rootNode itself is not part of the final tree array
            const finalTree = Object.values(rootNode.subfolders)
                .map(convertNode)
                .sort((a, b) => a.name.localeCompare(b.name));

            return finalTree; // This is the array of top-level folders
        },

        buildFolderTrees() {
            debugLogger.debug("Building folder trees...");
            const filesByUser = {};
            for (const fileId in this.files) {
                const file = this.files[fileId];
                if (file.is_thumb) continue;
                const user = file.o;
                if (!filesByUser[user]) filesByUser[user] = [];
                file.folderPath = file.folderPath || ''; // Ensure it exists
                filesByUser[user].push(file);
            }

            const newUserFolderTrees = {};
            const relevantUsers = new Set(Object.keys(filesByUser));

            // Add users who have pending folder changes even if they have no files currently loaded
            for (const contractId in this.pendingChanges) {
                if (this.pendingChanges[contractId]?.__newFolders__ && this.contract[contractId]?.t) {
                    relevantUsers.add(this.contract[contractId].t);
                }
            }
            relevantUsers.delete(undefined);

            for (const user of relevantUsers) {
                if (!user) continue;

                // 1. Build tree based on files for this user
                const userFiles = filesByUser[user] || [];
                const fileBasedTreeArray = this.buildFolderTree(userFiles); // Returns array of top-level folders

                // 2. Get pending new folders for this user
                let pendingFolderPaths = [];

                // First check for the new virtual folders system
                if (this.pendingChanges['__virtualFolders__']?.[user]) {
                    pendingFolderPaths = [...this.pendingChanges['__virtualFolders__'][user]];
                }

                // Also check the old system for backward compatibility
                const userContractIds = Object.keys(this.contract).filter(id => this.contract[id]?.t === user);
                for (const contractId of userContractIds) {
                    if (this.pendingChanges[contractId]?.__newFolders__) {
                        pendingFolderPaths = [...pendingFolderPaths, ...this.pendingChanges[contractId]['__newFolders__']];
                    }
                }
                pendingFolderPaths = [...new Set(pendingFolderPaths)]; // Unique paths

                // 3. Merge pending new folders into the file-based tree array
                const mergeFoldersIntoTree = (treeArray, paths) => {
                    for (const fullPath of paths) {
                        const parts = fullPath.split('/').filter(Boolean);
                        let currentLevelArray = treeArray; // Start with the top-level array
                        let currentPath = '';

                        for (let i = 0; i < parts.length; i++) {
                            const part = parts[i];
                            currentPath = currentPath ? `${currentPath}/${part}` : part;
                            let folderNode = currentLevelArray.find(node => node.name === part /* && node.path === currentPath */); // Find existing node

                            if (!folderNode) {
                                folderNode = { name: part, path: currentPath, files: [], subfolders: [] };
                                currentLevelArray.push(folderNode);
                                // Sort siblings after adding
                                currentLevelArray.sort((a, b) => a.name.localeCompare(b.name));
                            }

                            // Descend to the subfolder array of the found/created node
                            currentLevelArray = folderNode.subfolders;
                        }
                    }
                    return treeArray; // Return the potentially modified tree array
                };

                // 4. Add the preset folders to ensure they're always present
                const presetFolders = [
                    "Documents",
                    "Images",
                    "Videos",
                    "Music",
                    "Archives",
                    "Code",
                    "Trash",
                    "Misc"
                ];

                // Add preset folders if they don't exist
                const treeWithPresets = [...fileBasedTreeArray]; // Start with existing folders

                for (const presetName of presetFolders) {
                    if (!treeWithPresets.some(folder => folder.name === presetName)) {
                        treeWithPresets.push({
                            name: presetName,
                            path: presetName,
                            files: [],
                            subfolders: [],
                            isPreset: true // Mark as preset to prevent moving/renaming
                        });
                    } else {
                        // Mark existing preset folder
                        const existingPreset = treeWithPresets.find(folder => folder.name === presetName);
                        if (existingPreset) {
                            existingPreset.isPreset = true;
                        }
                    }
                }

                // Sort alphabetically, but make 'Documents' first
                treeWithPresets.sort((a, b) => {
                    if (a.name === "Documents") return -1;
                    if (b.name === "Documents") return 1;
                    return a.name.localeCompare(b.name);
                });

                // Merge any pending folders that aren't presets
                const finalTree = mergeFoldersIntoTree(treeWithPresets, pendingFolderPaths);
                newUserFolderTrees[user] = finalTree;
            }

            // Update the main userFolderTrees object
            this.userFolderTrees = newUserFolderTrees;
        },
        init() {
            var contracts = [];
            if (this.saccountapi.file_contracts) {
                this.contracts = this.saccountapi.file_contracts;
            }
            // Handle contracts as an array or object
            if (Array.isArray(this.contracts)) {
                contracts = this.contracts.slice();
            } else {
                for (var id in this.contracts) {
                    contracts.push(this.contracts[id]);
                }
            }
            for (var user in this.filesSelect.addusers) {
                for (var id in this.contractIDs[user]) {
                    contracts.push(this.contractIDs[user][id]);
                }
            }

            this.files = {};
            this.userFolderTrees = {};
            this.owners.push(this.saccountapi.name)
            for (var i in contracts) {
                if (contracts[i].c == 1) continue;
                const id = contracts[i].i;
                this.contract[id] = contracts[i];
                this.owners.push(contracts[i].t);

                const m = contracts[i].m || "";
                // Handle the actual metadata format
                let contractData = contracts[i].m.split(',')[0]
                let parts = contractData.split("|");
                let encData = parts[0] || "";
                let folderListStr = parts.length > 1 ? parts.slice(1).join('|') : id.split(':')[2]
                let fileMetadata = m

                // Fallback for non-pipe-separated metadata
                if (parts.length === 1 && m.includes(",")) {
                    const temp = m.split(";");
                    encData = temp[0] || "";
                    folderListStr = id.split(':')[2]; // No folder data in this format
                }

                const indexToPath = this.parseFolderList(folderListStr)

                var renew = this.Base64toNumber(encData[0] || "0") & 1 ? true : false;
                var encrypted = encData.includes("#");
                this.newMeta[id] = { contract: { autoRenew: renew, encrypted, m: m } };

                var filesNames = this.contract[id]?.df ? Object.keys(this.contract[id].df) : [];
                if (!fileMetadata && !folderListStr) {
                    // Fallback: Add files with minimal metadata
                    for (var j = 0; j < filesNames.length; j++) {
                        const typeIndex = slots[j * 4 + 2] || "";
                        const [type, folderIndex] = typeIndex.split(".");
                        debugLogger.debug({ typeIndex, type, folderIndex })
                        const folderPath = folderIndex ? indexToPath[folderIndex] : indexToPath["1"];
                        this.newMeta[id][filesNames[j]] = {
                            name: filesNames[j],
                            type,
                            thumb: "",
                            is_thumb: false,
                            flags: 0,
                            folderPath,
                        };
                        const f = {
                            i: id,
                            f: filesNames[j],
                            c: id.split(":")[2].split("-")[0],
                            e: this.contract[id].e.split(":")[0],
                            n: filesNames[j],
                            y: "",
                            o: this.contract[id].t,
                            folderPath,
                            s: this.contract[id].df[filesNames[j]],
                            lf: 0,
                            lic: "",
                            l: "",
                            is_thumb: false,
                        };
                        this.files[f.f] = f;
                    }
                } else {
                    // Parse existing metadata
                    const slots = fileMetadata.split(",") || [];
                    for (var j = 0; j < filesNames.length; j++) {
                        const name = slots[j * 4 + 1] || filesNames[j];
                        const typeIndex = slots[j * 4 + 2] || "";
                        const [type, folderIndex] = typeIndex.split(".");
                        const thumb = slots[j * 4 + 3] || "";
                        const flags = slots[j * 4 + 4] || "0";
                        const folderPath = folderIndex ? indexToPath[folderIndex] : indexToPath["1"];
                        this.newMeta[id][filesNames[j]] = {
                            name,
                            type,
                            thumb,
                            thumb_data: thumb, // Initialize with thumb URL, will be replaced with data when loaded
                            thumb_loaded: false, // Track if thumbnail data has been loaded
                            is_thumb: false,
                            flags: this.Base64toNumber(flags.split("-")[0]),
                            folderPath,
                            license: flags.includes("-") ? flags.split("-")[1] : "",
                            labels: flags.includes("-") ? flags.split("-")[2] : flags.slice(1),
                        };
                        // Remove automatic thumbnail loading - we'll load lazily instead
                        // if (thumb) this.getImgData(id, filesNames[j]);
                        if (this.newMeta[id][filesNames[j]].flags & 1) this.newMeta[id][filesNames[j]].encrypted = true;
                        if (this.newMeta[id][filesNames[j]].flags & 2) this.newMeta[id][filesNames[j]].is_thumb = true

                        const f = {
                            i: id,
                            f: filesNames[j],
                            c: id.split(":")[2].split("-")[0],
                            e: this.contract[id].e.split(":")[0],
                            n: name || filesNames[j],
                            y: type || "",
                            o: this.contract[id].t,
                            folderPath,
                            is_thumb: this.newMeta[id][filesNames[j]].is_thumb,
                            s: this.contract[id].df[filesNames[j]],
                            lf: this.newMeta[id][filesNames[j]].flags,
                            lic: this.newMeta[id][filesNames[j]].license,
                            l: this.newMeta[id][filesNames[j]].labels,
                        };

                        // Apply pending folderPath change if it exists
                        if (this.pendingChanges[id] && this.pendingChanges[id][filesNames[j]] && this.pendingChanges[id][filesNames[j]].hasOwnProperty('folderPath')) {
                            const pendingPath = this.pendingChanges[id][filesNames[j]].folderPath;
                            f.folderPath = pendingPath; // Update the file object
                            this.newMeta[id][filesNames[j]].folderPath = pendingPath; // Update the metadata object
                        }

                        // Also apply pending name changes if they exist
                        if (this.pendingChanges[id] && this.pendingChanges[id][filesNames[j]] && this.pendingChanges[id][filesNames[j]].hasOwnProperty('name')) {
                            const pendingName = this.pendingChanges[id][filesNames[j]].name;
                            f.n = pendingName; // Update the file object
                            this.newMeta[id][filesNames[j]].name = pendingName; // Update the metadata object
                        }

                        // Apply pending labels, license, and flags changes
                        if (this.pendingChanges[id] && this.pendingChanges[id][filesNames[j]]) {
                            const pendingFileChanges = this.pendingChanges[id][filesNames[j]];
                            if (pendingFileChanges.hasOwnProperty('labels')) {
                                const pendingLabels = pendingFileChanges.labels;
                                f.l = pendingLabels;
                                this.newMeta[id][filesNames[j]].labels = pendingLabels;
                            }
                            if (pendingFileChanges.hasOwnProperty('license')) {
                                const pendingLicense = pendingFileChanges.license;
                                f.lic = pendingLicense;
                                this.newMeta[id][filesNames[j]].license = pendingLicense;
                            }
                            if (pendingFileChanges.hasOwnProperty('flags')) {
                                const pendingFlags = pendingFileChanges.flags;
                                f.lf = pendingFlags;
                                this.newMeta[id][filesNames[j]].flags = pendingFlags;
                            }
                        }

                        this.files[f.f] = f;
                    }
                }
            }

            this.owners = [...new Set(this.owners)];
            this.buildFolderTrees();
            this.render();
            this.setView('icon');
            
            // Load thumbnails for initial folder view
            this.$nextTick(() => {
                this.loadThumbnailsForCurrentFolder();
            });
        },
        dragOverBackground(event) {
            event.preventDefault();
            this.clearAllDragHighlights();
            // Only highlight background if the event is directly on it, not bubbling from a child
            event.currentTarget.classList.add('drag-over-active');
        },
        dropOnBackground(event) {
            event.preventDefault();
            if (event.currentTarget.classList.contains('drag-over-active')) {
                event.currentTarget.classList.remove('drag-over-active');
            }
            const targetPath = this.currentFolderPath; // Target is the current folder when dropping on background

            // Check for external files first
            if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
                if (targetPath == 'Trash') {
                    debugLogger.debug('Dropped on trash')
                    return
                }
                debugLogger.debug('Dropped on background - event.dataTransfer.items:', event.dataTransfer.items);
                this.processDroppedItems(event.dataTransfer.items).then(processedFiles => {
                    if (processedFiles.length > 0) {
                        // Combine targetPath with relativePath here
                        const filesWithFullPath = processedFiles.map(item => {
                            let fullAppPath;
                            // Combine targetPath (app folder) and relativePath (from dropped item)
                            if (targetPath && item.relativePath) {
                                // Avoid double slashes if relativePath already starts with one (unlikely but safe)
                                fullAppPath = `${targetPath}/${item.relativePath.replace(/^\/+/, '')}`;
                            } else if (targetPath) {
                                fullAppPath = targetPath; // e.g., dropping an empty folder?
                            } else { // targetPath is empty (root drop)
                                fullAppPath = item.relativePath;
                            }
                            // Clean up potential double slashes from concatenation
                            fullAppPath = fullAppPath.replace(/\/+/g, '/');
                            return { file: item.file, fullAppPath: fullAppPath };
                        });

                        debugLogger.debug(`External items processed (dropped on background, target: "${targetPath}"):`, filesWithFullPath);
                        // Check for video files and show transcoding options
                        this.processFilesWithVideoCheck(filesWithFullPath);
                    }
                }).catch(error => {
                    debugLogger.error("Error processing dropped items:", error);
                    alert("Error processing dropped folder/files.");
                });
                return; // Prevent internal D&D logic
            }

            // --- Existing internal D&D logic ---
            const fileId = event.dataTransfer.getData("fileid");
            debugLogger.debug('Background drop - fileId:', fileId);

            // Find the file by ID
            const file = this.files[fileId];
            debugLogger.debug('Background drop - Found file:', file);

            if (!file) {
                console.error('Background drop - File not found with ID:', fileId);
                return;
            }

            if (!this.isEditable(file)) {
                console.warn('Background drop - File not editable:', file);
                return;
            }

            // Skip if folder path is the same
            if (file.folderPath === this.currentFolderPath) {
                debugLogger.debug('Background drop - File already in this folder');
                return;
            }

            // Store original path for debugging
            const originalPath = file.folderPath;
            debugLogger.debug('Background drop - Original path:', originalPath, 'New path:', this.currentFolderPath);

            // Update file folder path
            this.pendingChanges[file.i] = this.pendingChanges[file.i] || {};
            this.pendingChanges[file.i][file.f] = {
                folderPath: this.currentFolderPath,
                name: this.newMeta[file.i][file.f].name || file.f,
            };

            // Important: Actually update the file object's folderPath
            file.folderPath = this.currentFolderPath;
            debugLogger.debug('Background drop - Updated file:', file);

            // Force folder path into metadata if needed
            if (this.newMeta[file.i] && this.newMeta[file.i][file.f]) {
                this.newMeta[file.i][file.f].folderPath = this.currentFolderPath;
            }

            // Rebuild and render
            this.buildFolderTrees();
            this.render();
            this.clearAllDragHighlights(); // Ensure cleanup on drop
        },
        handleDragEnterFolder(event, folder) {
            event.preventDefault(); // Still needed for dnd
            // event.stopPropagation(); // Not strictly needed here if dragover handles highlight exclusively

            // Highlight is now handled by dragOverFolder
            // Original hover-to-navigate logic
            clearTimeout(this.dragHoverTimeout);
            this.dragHoverTargetPath = folder.path;
            debugLogger.debug('Entering folder:', folder.path);
            this.dragHoverTimeout = setTimeout(() => {
                if (this.dragHoverTargetPath === folder.path) {
                    debugLogger.debug('Navigating due to hover on folder:', folder.path);
                    this.navigateTo(folder.path);
                    this.dragHoverTargetPath = null; // Reset after navigation
                }
            }, 1000); // 1 second delay
        },
        handleDragEnterBreadcrumb(event, path) {
            event.preventDefault(); // Still needed for dnd
            // event.stopPropagation(); // Not strictly needed here if dragover handles highlight exclusively

            // Highlight is now handled by dragOverBreadcrumb
            // Original hover-to-navigate logic
            clearTimeout(this.dragHoverTimeout);
            this.dragHoverTargetPath = path;
            debugLogger.debug('Entering breadcrumb:', path);
            this.dragHoverTimeout = setTimeout(() => {
                if (this.dragHoverTargetPath === path) {
                    debugLogger.debug('Navigating due to hover on breadcrumb:', path);
                    this.navigateTo(path);
                    this.dragHoverTargetPath = null; // Reset after navigation
                }
            }, 1000); // 1 second delay
        },
        handleDragLeave(event) {
            const currentTarget = event.currentTarget;
            const relatedTarget = event.relatedTarget;

            // Visual feedback: Remove highlight from the element being left
            if (currentTarget.classList.contains('drag-over-active')) {
                currentTarget.classList.remove('drag-over-active');
            }

            // Hover Navigation Timeout Logic
            // Check if the element we are leaving is the one for which a navigation timeout was set.
            let isLeavingHoverTarget = false;
            if (this.dragHoverTargetPath !== null) {
                if (currentTarget.dataset.key && currentTarget.dataset.key === this.dragHoverTargetPath) { // Folders have data-key
                    isLeavingHoverTarget = true;
                } else if (currentTarget.classList.contains('breadcrumb-item')) {
                    // For breadcrumbs, check if dragHoverTargetPath matches based on text content or a future data attribute
                    const potentialPath = this.dragHoverTargetPath;
                    const isRootBreadcrumb = potentialPath === '' && currentTarget.textContent.includes('My Drive');
                    const isSubBreadcrumb = potentialPath !== '' && currentTarget.textContent.trim().startsWith(potentialPath.split('/').pop() || '');
                    if (isRootBreadcrumb || isSubBreadcrumb) {
                        isLeavingHoverTarget = true;
                    }
                }
            }

            // If we are truly leaving the bounds of the element that had the hover timeout
            if (isLeavingHoverTarget && (!relatedTarget || !currentTarget.contains(relatedTarget))) {
                clearTimeout(this.dragHoverTimeout);
                debugLogger.debug('Cleared nav timeout for:', this.dragHoverTargetPath);
                this.dragHoverTargetPath = null;
            }

            // If relatedTarget is the main .files div, its own dragover (dragOverBackground)
            // will handle adding the class back to it if no other specific target is entered.
        },
        isFileSelected(file) {
            return this.selectedFiles.includes(file.f);
        },
        handleFileClick(event, file) {
            // Check for double click
            if (event.detail === 2) {
                this.handleFileDoubleClick(event, file);
                return;
            }

            // Multi-select with Alt/Ctrl key (existing code)
            if (event.altKey || event.ctrlKey) {
                if (this.isFileSelected(file)) {
                    // Deselect if already selected
                    this.selectedFiles = this.selectedFiles.filter(id => id !== file.f);
                } else {
                    // Add to selection
                    this.selectedFiles.push(file.f);
                }
            } else {
                // Single select
                this.selectedFiles = [file.f];
            }
        },

        // Add a method to check if a folder is selected
        isFolderSelected(folder) {
            // Simple check if the folder's ID is in the selection
            const id = `folder-${folder.path}`;
            return this.selectedFiles.includes(id);
        },

        // Add a helper method for folder click
        handleFolderClick(event, folder) {
            // Prevent selection of preset folders
            if (folder.isPreset) {
                // If it wasn't an Alt/Ctrl click, still allow navigation
                if (!event.altKey && !event.ctrlKey) {
                    this.navigateTo(folder.path);
                }
                return; // Stop further selection processing
            }

            // If Alt/Ctrl is pressed, select folder instead of navigating
            if (event.altKey || event.ctrlKey) {
                event.preventDefault();
                event.stopPropagation();

                const folderId = `folder-${folder.path}`;

                if (this.selectedFiles.includes(folderId)) {
                    // Deselect if already selected
                    this.selectedFiles = this.selectedFiles.filter(id => id !== folderId);
                } else {
                    // Add to selection
                    this.selectedFiles.push(folderId);
                }

                return false; // Prevent navigation
            }

            // Otherwise allow normal navigation
            this.navigateTo(folder.path);
        },

        startSelectionBox(event) {
            // Only start selection box on left click on background (not on files/folders)
            if (event.button !== 0 || event.target.closest('.file-grid') || event.target.closest('tr')) {
                return;
            }

            // Stop propagation and prevent default text selection
            event.stopPropagation();
            event.preventDefault();

            // Store viewport coordinates
            this.selectionBox = {
                active: true,
                startX: event.clientX,
                startY: event.clientY,
                endX: event.clientX,
                endY: event.clientY
            };

            // Store initial selection state if Alt/Ctrl is pressed
            this.initialSelection = (event.altKey || event.ctrlKey) ? [...this.selectedFiles] : [];

            // Clear current selection if *not* holding Alt/Ctrl
            if (!event.altKey && !event.ctrlKey) {
                this.selectedFiles = [];
            }

            // ANTI-FREEZE: Temporarily disable pointer events on folders to prevent freeze
            document.querySelectorAll('.files .file-grid, .files .folder-row').forEach(el => {
                if (el.dataset.type === 'folder') {
                    // Store original pointer-events style
                    el.dataset.originalPointerEvents = el.style.pointerEvents || '';
                    // Disable pointer events
                    el.style.pointerEvents = 'none';
                }
            });

            // Create a single selection box overlay
            const selectionOverlay = document.createElement('div');
            selectionOverlay.id = 'selection-box-overlay';
            selectionOverlay.style.position = 'fixed'; // Use fixed for viewport positioning
            selectionOverlay.style.backgroundColor = 'rgba(13, 110, 253, 0.2)'; // Bootstrap primary color with transparency
            selectionOverlay.style.border = '1px solid #0d6efd'; // Bootstrap primary color
            selectionOverlay.style.zIndex = '10000'; // Ensure it's on top
            selectionOverlay.style.pointerEvents = 'none';
            document.body.appendChild(selectionOverlay);

            // ANTI-FREEZE: Add document-level mouseup listener
            document.addEventListener('mouseup', this.endSelectionBox, { once: true });
        },

        updateSelectionBox(event) {
            if (!this.selectionBox.active) return;

            // Prevent default and stop propagation
            event.preventDefault();
            event.stopPropagation();

            // Update end viewport coordinates
            this.selectionBox.endX = event.clientX;
            this.selectionBox.endY = event.clientY;

            // Calculate selection box viewport coordinates
            const selLeft = Math.min(this.selectionBox.startX, this.selectionBox.endX);
            const selTop = Math.min(this.selectionBox.startY, this.selectionBox.endY);
            const selRight = Math.max(this.selectionBox.startX, this.selectionBox.endX);
            const selBottom = Math.max(this.selectionBox.startY, this.selectionBox.endY);

            // Update the selection box overlay
            const selectionOverlay = document.getElementById('selection-box-overlay');
            if (selectionOverlay) {
                selectionOverlay.style.left = `${selLeft}px`;
                selectionOverlay.style.top = `${selTop}px`;
                selectionOverlay.style.width = `${selRight - selLeft}px`;
                selectionOverlay.style.height = `${selBottom - selTop}px`;
            }

            this.$nextTick(() => {
                // Get the files container
                const filesContainer = this.$refs.container.querySelector('.files');
                if (!filesContainer) {
                    return;
                }

                // Get all selectable elements with their type clearly marked
                const allElements = [];

                // Get files and folders in grid view
                if (this.viewOpts.fileView === 'grid') {
                    // Get all .file-grid elements with data-type
                    const gridItems = Array.from(filesContainer.querySelectorAll('.file-grid[data-type]'));
                    allElements.push(...gridItems);
                } else {
                    // Get all tr elements with data-type in list view
                    const listItems = Array.from(filesContainer.querySelectorAll('tbody tr[data-type]'));
                    allElements.push(...listItems);
                }

                // Count files and folders for debug
                const fileCount = allElements.filter(el => el.dataset.type === 'file').length;
                const folderCount = allElements.filter(el => el.dataset.type === 'folder').length;

                // Process all elements
                const selectedItems = [];
                allElements.forEach(element => {
                    // Get element's viewport position
                    const rect = element.getBoundingClientRect();

                    // Get element data attributes for type and key
                    const elementType = element.dataset.type; // 'file' or 'folder'
                    const elementKey = element.dataset.key;

                    // Intersection test using viewport coordinates
                    const overlapHoriz = !(rect.right < selLeft || rect.left > selRight);
                    const overlapVert = !(rect.bottom < selTop || rect.top > selBottom);
                    const intersects = overlapHoriz && overlapVert;

                    // Alternative test - check if center point is inside selection (viewport)
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    const centerInSelection =
                        centerX >= selLeft &&
                        centerX <= selRight &&
                        centerY >= selTop &&
                        centerY <= selBottom;

                    // If we have a valid element that intersects with the selection
                    // AND it's not a preset folder
                    if ((intersects || centerInSelection) && elementKey && element.dataset.isPreset !== 'true') {
                        let itemId;
                        if (elementType === 'folder') {
                            itemId = `folder-${elementKey}`;
                        } else { // file
                            itemId = elementKey; // Files use CID directly
                        }

                        if (itemId) {
                            selectedItems.push(itemId);
                        }
                    }
                });

                // Final selection combining initial selection if Alt/Ctrl was held
                const combinedSelection = new Set([...this.initialSelection, ...selectedItems]);
                this.selectedFiles = Array.from(combinedSelection);

                // Force re-render to update visual highlighting
                this.$forceUpdate();
            });
        },

        endSelectionBox() {
            if (!this.selectionBox.active) {
                return; // Don't do anything if not active
            }

            this.selectionBox.active = false;
            this.initialSelection = []; // Clear initial selection state

            // Remove the selection overlay
            const selectionOverlay = document.getElementById('selection-box-overlay');
            if (selectionOverlay) {
                selectionOverlay.remove();
            }

            // ANTI-FREEZE: Re-enable pointer events on folders
            document.querySelectorAll('.files .file-grid, .files .folder-row').forEach(el => {
                if (el.dataset.originalPointerEvents !== undefined) {
                    el.style.pointerEvents = el.dataset.originalPointerEvents;
                    delete el.dataset.originalPointerEvents;
                }
            });

            // ANTI-FREEZE: Remove document-level mouseup listener if it was added externally
            document.removeEventListener('mouseup', this.endSelectionBox);

            // Force re-render to ensure visual state reflects the selection
            this.$forceUpdate();
        },
        dragStartItem(event, item, type) {
            debugLogger.debug(`Drag start ${type}:`, item);

            let dragDataIds = [];
            let isDraggingSelected = false;

            if (type === 'file') {
                isDraggingSelected = this.isFileSelected(item);
            } else if (type === 'folder') {
                // Check if this is a preset folder - don't allow dragging preset folders
                if (item.isPreset) {
                    console.warn("Cannot drag preset folders");
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }

                isDraggingSelected = this.isFolderSelected(item);
            }

            // If dragging a selected item and multiple items are selected
            if (isDraggingSelected && this.selectedFiles.length > 1) {
                // Include all selected file and folder IDs in the drag data
                dragDataIds = this.selectedFiles.filter(id => !id.startsWith('folder-') || !this.isPresetFolder(id.substring('folder-'.length)));
                debugLogger.debug('Dragging multiple items:', dragDataIds);
                event.dataTransfer.setData("itemids", JSON.stringify(dragDataIds)); // Use a generic name
            } else {
                // Single item drag (traditional behavior)
                // Clear selection and select only this item
                let singleId;
                if (type === 'file') {
                    singleId = item.f;
                } else { // folder
                    singleId = `folder-${item.path}`;
                }
                this.selectedFiles = [singleId];
                dragDataIds = [singleId];
                debugLogger.debug(`Dragging single ${type}:`, singleId);
                event.dataTransfer.setData("itemids", JSON.stringify(dragDataIds)); // Still use generic name
            }

            // Set fallback text data (might be useful for external drops)
            event.dataTransfer.setData("text/plain", dragDataIds.join('\n'));

            // **Important**: Need contract ID(s) if files are involved
            // For simplicity now, just use the contract ID of the first file found in selection
            let representativeContractId = null;
            const firstFileId = dragDataIds.find(id => !id.startsWith('folder-'));
            if (firstFileId && this.files[firstFileId]) {
                representativeContractId = this.files[firstFileId].i;
                event.dataTransfer.setData("contractid", representativeContractId);
                debugLogger.debug("Using contractId:", representativeContractId);
            } else {
                console.warn("No file found in selection to determine contractId.");
                // Optionally set a placeholder or handle folder-only drags differently later
            }

            // Set drag image
            const dragIcon = document.createElement('div');
            dragIcon.style.position = 'absolute';
            dragIcon.style.top = '-1000px';
            dragIcon.style.maxWidth = '200px';

            if (dragDataIds.length > 1) {
                // Show count for multiple items
                dragIcon.innerHTML = `<div style="padding: 10px; background: rgba(0,0,0,0.7); color: white; border-radius: 4px; display: flex; align-items: center; max-width: 200px; white-space: nowrap;">
                    <i class="fa-solid fa-copy fa-lg me-2"></i> 
                    <span>${dragDataIds.length} items</span>
                </div>`;
            } else {
                // Show single item icon
                let itemName = '';
                let itemIconClass = 'fa-solid fa-question'; // Default icon
                if (type === 'file') {
                    itemName = this.newMeta[item.i][item.f].name || item.f;
                    itemIconClass = `fa-solid ${this.smartIcon(item.a)}`; // Use smartIcon for files
                } else { // folder
                    itemName = item.name;
                    itemIconClass = 'fa-solid fa-folder'; // Folder icon
                }

                const truncatedName = itemName.length > 15 ? itemName.substring(0, 15) + '...' : itemName;

                dragIcon.innerHTML = `<div style="padding: 10px; background: rgba(0,0,0,0.7); color: white; border-radius: 4px; display: flex; align-items: center; max-width: 200px; white-space: nowrap;">
                    <i class="${itemIconClass} fa-lg me-2"></i> 
                    <span>${truncatedName}</span>
                </div>`;
            }

            document.body.appendChild(dragIcon);
            event.dataTransfer.setDragImage(dragIcon, 0, 0);

            // Clean up the drag image element
            setTimeout(() => {
                if (document.body.contains(dragIcon)) {
                    document.body.removeChild(dragIcon);
                }
            }, 0);
        },
        dragOverFolder(event, folder) {
            event.preventDefault();
            event.stopPropagation(); // Prevent background from highlighting
            this.clearAllDragHighlights();
            event.currentTarget.classList.add('drag-over-active');
        },
        dropOnFolder(event, folder) {
            event.preventDefault();
            event.stopPropagation();
            this.clearAllDragHighlights(); // Ensure cleanup on drop
            let itemIds = [];

            // Check for multiple items being dragged
            const itemIdsStr = event.dataTransfer.getData("itemids");
            if (itemIdsStr) {
                try {
                    itemIds = JSON.parse(itemIdsStr);
                } catch (e) {
                    // Fallback to text/plain if parsing fails
                    const textData = event.dataTransfer.getData("text/plain");
                    if (textData) itemIds = textData.split('\n');
                }
            } else {
                // Fallback to text/plain if itemids is missing
                const textData = event.dataTransfer.getData("text/plain");
                if (textData) itemIds = textData.split('\n');
            }

            // Get contract ID if available (may not be for folder-only drags)
            const contractId = event.dataTransfer.getData("contractid");

            if (!itemIds.length) {
                return;
            }

            const targetPath = folder.path;

            // Process each item
            itemIds.forEach(itemId => {
                if (itemId.startsWith('folder-')) {
                    // --- Handle Folder Drop ---
                    const folderPathToMove = itemId.substring('folder-'.length);

                    // Skip if moving to itself
                    if (folderPathToMove === targetPath) {
                        return;
                    }

                    // Check if this is a preset folder - don't allow moving preset folders
                    if (this.isPresetFolder(folderPathToMove)) {
                        debugLogger.warn("Cannot move preset folders");
                        return;
                    }

                    // Check if we're dropping into a subfolder of the folder being moved
                    // This would create a recursive loop and is not allowed
                    if (targetPath.startsWith(folderPathToMove + '/')) {
                        debugLogger.warn('Cannot move a folder into its own subfolder');
                        return;
                    }

                    // Find all files that are in the folder being moved or its subfolders
                    const filesInFolder = Object.values(this.files).filter(file =>
                        file.folderPath === folderPathToMove || file.folderPath.startsWith(folderPathToMove + '/')
                    );

                    if (filesInFolder.length === 0) {
                        // This is an empty folder, perhaps a newly created one
                        // We'll need to update any pending folder creation
                        for (const cid in this.pendingChanges) {
                            if (this.pendingChanges[cid].__newFolders__) {
                                // Find the index of the folder in the pending folders array
                                const index = this.pendingChanges[cid].__newFolders__.indexOf(folderPathToMove);
                                if (index !== -1) {
                                    // Remove the old path
                                    this.pendingChanges[cid].__newFolders__.splice(index, 1);

                                    // Add the new path
                                    const newPath = targetPath + '/' + folderPathToMove.split('/').pop();
                                    this.pendingChanges[cid].__newFolders__.push(newPath);
                                }
                            }
                        }
                    } else {
                        // Move all files to the new location, preserving subfolder structure
                        filesInFolder.forEach(file => {
                            // Only process files we can edit
                            if (!this.isEditable(file)) {
                                return;
                            }

                            // Calculate new path
                            // If the file is directly in the moved folder:
                            //    folderPathToMove = "docs"
                            //    file.folderPath = "docs"
                            //    targetPath = "personal"
                            //    => newPath = "personal"
                            //
                            // If the file is in a subfolder:
                            //    folderPathToMove = "docs"
                            //    file.folderPath = "docs/reports"
                            //    targetPath = "personal"
                            //    => newPath = "personal/reports"
                            let newPath;

                            if (file.folderPath === folderPathToMove) {
                                // File is directly in the folder being moved
                                newPath = targetPath;
                            } else {
                                // File is in a subfolder of the folder being moved
                                const relativePath = file.folderPath.substring(folderPathToMove.length + 1);
                                newPath = `${targetPath}/${relativePath}`;
                            }

                            const fileId = file.f;
                            const currentContractId = file.i;

                            // Skip if the file is already at the target path
                            if (file.folderPath === newPath) {
                                return;
                            }

                            // Update the file's folder path
                            file.folderPath = newPath;

                            // Update metadata
                            if (this.newMeta[currentContractId] && this.newMeta[currentContractId][fileId]) {
                                this.newMeta[currentContractId][fileId].folderPath = newPath;
                            }

                            // Update pending changes
                            this.pendingChanges[currentContractId] = this.pendingChanges[currentContractId] || {};
                            this.pendingChanges[currentContractId][fileId] = {
                                ...(this.pendingChanges[currentContractId][fileId] || {}),
                                folderPath: newPath,
                                name: this.newMeta[currentContractId]?.[fileId]?.name || fileId,
                            };

                            // Check if target folder is a virtual folder
                            // If so, move it from virtual to the contract so it's saved properly
                            if (this.pendingChanges['__virtualFolders__']?.[this.selectedUser]) {
                                const virtualFolders = this.pendingChanges['__virtualFolders__'][this.selectedUser];
                                const pathParts = newPath.split('/');

                                // Build paths for all parent folders
                                let parentPath = '';
                                for (let i = 0; i < pathParts.length; i++) {
                                    const part = pathParts[i];
                                    parentPath = parentPath ? `${parentPath}/${part}` : part;

                                    // Check if this path is in virtual folders
                                    const virtualIndex = virtualFolders.indexOf(parentPath);
                                    if (virtualIndex !== -1) {
                                        // Ensure contract has newFolders array
                                        this.pendingChanges[currentContractId]['__newFolders__'] =
                                            this.pendingChanges[currentContractId]['__newFolders__'] || [];

                                        // Add to contract's newFolders if not already there
                                        if (!this.pendingChanges[currentContractId]['__newFolders__'].includes(parentPath)) {
                                            this.pendingChanges[currentContractId]['__newFolders__'].push(parentPath);
                                            debugLogger.debug(`Converted virtual folder '${parentPath}' to real folder in contract ${currentContractId}`);
                                        }

                                        // Remove from virtual folders since it's now a real folder
                                        virtualFolders.splice(virtualIndex, 1);
                                    }
                                }
                            }
                        });
                    }
                } else {
                    // --- Handle File Drop ---
                    const fileId = itemId;
                    const file = this.files[fileId];
                    if (!file) {
                        return;
                    }

                    // Use the contractId obtained earlier if available, otherwise try to get from file
                    const currentContractId = contractId || file.i;
                    if (!currentContractId) {
                        return;
                    }

                    if (!this.isEditable(file)) {
                        return;
                    }

                    const originalPath = file.folderPath || '';
                    const newPath = folder.path;

                    if (originalPath === newPath) {
                        return;
                    }

                    // Update the file's folder path
                    file.folderPath = newPath;

                    // Update metadata in newMeta
                    if (this.newMeta[currentContractId] && this.newMeta[currentContractId][fileId]) {
                        this.newMeta[currentContractId][fileId].folderPath = newPath;
                    }

                    // Update pending changes
                    this.pendingChanges[currentContractId] = this.pendingChanges[currentContractId] || {};
                    this.pendingChanges[currentContractId][fileId] = {
                        ...(this.pendingChanges[currentContractId][fileId] || {}),
                        folderPath: newPath,
                        name: this.newMeta[currentContractId]?.[fileId]?.name || fileId,
                    };
                }
            });

            this.buildFolderTrees();
            this.$nextTick(() => {
                this.render();
            });
        },
        dragOverBreadcrumb(event, path) {
            event.preventDefault();
            event.stopPropagation(); // Prevent background from highlighting
            this.clearAllDragHighlights();
            event.currentTarget.classList.add('drag-over-active');
        },
        dropOnBreadcrumb(path, event) {
            event.preventDefault();
            this.clearAllDragHighlights(); // Ensure cleanup on drop
            let itemIds = [];

            // Check for multiple items
            const itemIdsStr = event.dataTransfer.getData("itemids");
            if (itemIdsStr) {
                try {
                    itemIds = JSON.parse(itemIdsStr);
                } catch (e) {
                    // Fallback to text/plain if parsing fails
                    const textData = event.dataTransfer.getData("text/plain");
                    if (textData) itemIds = textData.split('\n');
                }
            } else {
                // Fallback to text/plain if itemids is missing
                const textData = event.dataTransfer.getData("text/plain");
                if (textData) itemIds = textData.split('\n');
            }

            const contractId = event.dataTransfer.getData("contractid");
            const targetPath = path == null ? '' : path;

            if (!itemIds.length) {
                return;
            }

            // Process each item
            itemIds.forEach(itemId => {
                if (itemId.startsWith('folder-')) {
                    // --- Handle Folder Drop ---
                    const folderPathToMove = itemId.substring('folder-'.length);

                    // Skip if moving to itself
                    if (folderPathToMove === targetPath) {
                        return;
                    }

                    // Check if this is a preset folder - don't allow moving preset folders
                    if (this.isPresetFolder(folderPathToMove)) {
                        debugLogger.warn("Cannot move preset folders");
                        return;
                    }

                    // Check if we're dropping into a subfolder of the folder being moved
                    if (targetPath.startsWith(folderPathToMove + '/')) {
                        debugLogger.warn('Cannot move a folder into its own subfolder');
                        return;
                    }

                    // Find all files that are in the folder being moved or its subfolders
                    const filesInFolder = Object.values(this.files).filter(file =>
                        file.folderPath === folderPathToMove || file.folderPath.startsWith(folderPathToMove + '/')
                    );

                    if (filesInFolder.length === 0) {
                        // This is an empty folder, perhaps a newly created one
                        // We'll need to update any pending folder creation
                        for (const cid in this.pendingChanges) {
                            if (this.pendingChanges[cid].__newFolders__) {
                                // Find the index of the folder in the pending folders array
                                const index = this.pendingChanges[cid].__newFolders__.indexOf(folderPathToMove);
                                if (index !== -1) {
                                    // Remove the old path
                                    this.pendingChanges[cid].__newFolders__.splice(index, 1);

                                    // Add the new path, keeping the folder name but changing the parent location
                                    const folderName = folderPathToMove.split('/').pop();
                                    const newPath = targetPath ? `${targetPath}/${folderName}` : folderName;
                                    this.pendingChanges[cid].__newFolders__.push(newPath);
                                }
                            }
                        }
                    } else {
                        // Move all files to the new location, preserving subfolder structure
                        filesInFolder.forEach(file => {
                            // Only process files we can edit
                            if (!this.isEditable(file)) {
                                return;
                            }

                            // Calculate new path
                            let newPath;

                            if (file.folderPath === folderPathToMove) {
                                // File is directly in the folder being moved
                                newPath = targetPath;
                            } else {
                                // File is in a subfolder of the folder being moved
                                const relativePath = file.folderPath.substring(folderPathToMove.length + 1);
                                newPath = targetPath ? `${targetPath}/${relativePath}` : relativePath;
                            }

                            const fileId = file.f;
                            const currentContractId = file.i;

                            // Skip if the file is already at the target path
                            if (file.folderPath === newPath) {
                                return;
                            }

                            // Update the file's folder path
                            file.folderPath = newPath;

                            // Update metadata
                            if (this.newMeta[currentContractId] && this.newMeta[currentContractId][fileId]) {
                                this.newMeta[currentContractId][fileId].folderPath = newPath;
                            }

                            // Update pending changes
                            this.pendingChanges[currentContractId] = this.pendingChanges[currentContractId] || {};
                            this.pendingChanges[currentContractId][fileId] = {
                                ...(this.pendingChanges[currentContractId][fileId] || {}),
                                folderPath: newPath,
                                name: this.newMeta[currentContractId]?.[fileId]?.name || fileId,
                            };
                        });
                    }
                } else {
                    // --- Handle File Drop ---
                    const fileId = itemId;
                    const file = this.files[fileId];
                    if (!file) {
                        return;
                    }

                    const currentContractId = contractId || file.i;
                    if (!currentContractId) {
                        return;
                    }

                    if (!this.isEditable(file)) {
                        return;
                    }

                    const originalPath = file.folderPath || '';

                    if (originalPath === targetPath) {
                        return;
                    }

                    // Update the canonical file object
                    file.folderPath = targetPath;

                    // Update newMeta (if it exists)
                    if (this.newMeta[currentContractId]?.[fileId]) {
                        this.newMeta[currentContractId][fileId].folderPath = targetPath;
                    }

                    // Update pending changes
                    this.pendingChanges[currentContractId] = this.pendingChanges[currentContractId] || {};
                    this.pendingChanges[currentContractId][fileId] = {
                        ...(this.pendingChanges[currentContractId][fileId] || {}),
                        folderPath: targetPath,
                        name: this.pendingChanges[currentContractId]?.[fileId]?.name || this.newMeta[currentContractId]?.[fileId]?.name || fileId,
                    };
                }
            });

            this.buildFolderTrees();
            this.$nextTick(() => {
                this.render();
            });
        },
        isEditableFolder(folder) {
            // Preset folders can't be renamed
            if (folder.isPreset) {
                return false;
            }

            // Check if *any* loaded file belongs to the current user
            // This might need refinement if folder ownership becomes a thing
            // For now, assume if the user owns *any* files, they can manage folders
            return this.owners.includes(this.account);
        },
        isPresetFolder(path) {
            const presetFolders = ["Documents", "Images", "Videos", "Music", "Archives", "Code", "Trash", "Misc"];
            return presetFolders.includes(path);
        },
        // Add method to load pending changes from localStorage
        loadPendingChanges() {
            if (this.localStorageKey) {
                try {
                    const savedChanges = localStorage.getItem(this.localStorageKey);
                    if (savedChanges) {
                        this.pendingChanges = JSON.parse(savedChanges);
                        debugLogger.debug("Loaded pending changes from localStorage");

                        // Update newMeta based on pendingChanges
                        for (const contractId in this.pendingChanges) {
                            const contractUpdates = this.pendingChanges[contractId];
                            // Handle non-file specific changes like __newFolders__ if necessary
                            if (contractUpdates.__newFolders__) {
                                // No direct UI update needed here, buildFolderTrees handles it
                            }

                            for (const fileId in contractUpdates) {
                                if (fileId === '__newFolders__') continue; // Skip special keys

                                const change = contractUpdates[fileId];
                                if (this.newMeta[contractId] && this.newMeta[contractId][fileId]) {
                                    // Merge pending changes into newMeta for the specific file
                                    // Ensure all relevant fields (name, folderPath, labels, license, flags) are updated
                                    if (change.hasOwnProperty('name')) {
                                        this.newMeta[contractId][fileId].name = change.name;
                                    }
                                    if (change.hasOwnProperty('folderPath')) {
                                        this.newMeta[contractId][fileId].folderPath = change.folderPath;
                                    }
                                    if (change.hasOwnProperty('labels')) {
                                        this.newMeta[contractId][fileId].labels = change.labels;
                                    }
                                    if (change.hasOwnProperty('license')) {
                                        this.newMeta[contractId][fileId].license = change.license;
                                    }
                                    if (change.hasOwnProperty('flags')) {
                                        this.newMeta[contractId][fileId].flags = change.flags;
                                    }

                                    // Also update the main file object if it exists (for UI binding)
                                    if (this.files[fileId]) {
                                        if (change.hasOwnProperty('name')) this.files[fileId].n = change.name;
                                        if (change.hasOwnProperty('folderPath')) this.files[fileId].folderPath = change.folderPath;
                                        if (change.hasOwnProperty('labels')) this.files[fileId].l = change.labels;
                                        if (change.hasOwnProperty('license')) this.files[fileId].lic = change.license;
                                        if (change.hasOwnProperty('flags')) this.files[fileId].lf = change.flags;
                                    }
                                }
                            }
                        }

                        // Rebuild folder trees to reflect loaded changes (folder path changes, new folders)
                        this.buildFolderTrees();
                    }
                } catch (e) {
                    console.error("Error loading pending changes from localStorage:", e);
                }
            }
        },
        hideContextMenu() {
            if (this.contextMenu.show) {
                this.contextMenu.show = false;
                // Clean up the listener if it exists
                if (this.clickOutsideListener) {
                    document.removeEventListener("click", this.clickOutsideListener, { capture: true });
                    this.clickOutsideListener = null; // Clear the reference
                }
            }
        },
        openMetadataEditor(file) {
            if (!file || !this.newMeta[file.i] || !this.newMeta[file.i][file.f]) return;
            this.hideContextMenu(); // Ensure context menu is closed
            this.fileToEditMetadata = file;
            const meta = this.newMeta[file.i][file.f];

            // Initialize tempMetadata based on the *current* state in newMeta
            // This ensures pending changes loaded earlier are reflected
            const currentFlags = meta.flags || 0; // Use the potentially updated meta.flags
            this.tempMetadata = {
                labels: (meta.labels || '').split('').filter(Boolean), // String '15' -> ['1', '5']
                license: meta.license ? [meta.license] : [], // String '7' -> ['7'] or []
                flags: this.availableFlags.filter(flag => (currentFlags & flag.value) !== 0).map(flag => flag.value)
            };

            this.showMetadataEditor = true;

            // The choices-vue components should reactively update based on the
            // :prop_selections binding when tempMetadata changes.
            // Explicit method calls are not needed (and were causing errors).
        },

        saveMetadataChanges() {
            if (!this.fileToEditMetadata) return;

            debugLogger.debug('Saving metadata, current tempMetadata:', JSON.parse(JSON.stringify(this.tempMetadata)));

            const file = this.fileToEditMetadata;
            const contractId = file.i;
            const fileId = file.f;

            // --- Calculate final values --- 
            // Labels: Join array back to string, ensure sorted
            const finalLabels = this.tempMetadata.labels.sort().join('');

            // License: Get the single value from array or empty string
            const finalLicense = this.tempMetadata.license[0] || '';

            // Flags: Combine selected flag values back into a number
            // Start with existing non-editable flags (like encryption bit 1)
            let finalFlagsNum = (this.newMeta[contractId][fileId].flags || 0) & 1; // Preserve encryption flag
            this.tempMetadata.flags.forEach(flagVal => {
                finalFlagsNum |= flagVal; // Add selected flags using bitwise OR
            });

            debugLogger.debug('Calculated final values:', { finalLabels, finalLicense, finalFlagsNum });

            // --- Update newMeta --- 
            this.newMeta[contractId][fileId].labels = finalLabels;
            this.newMeta[contractId][fileId].license = finalLicense;
            this.newMeta[contractId][fileId].flags = finalFlagsNum;

            // --- Update file object for reactivity --- 
            file.l = finalLabels;
            file.lic = finalLicense;
            file.lf = finalFlagsNum;

            // --- Update pendingChanges --- 
            this.pendingChanges[contractId] = this.pendingChanges[contractId] || {};
            this.pendingChanges[contractId][fileId] = {
                // Keep existing pending changes for this file if any
                ...(this.pendingChanges[contractId][fileId] || {}),
                // Overwrite with new metadata values
                labels: finalLabels,
                license: finalLicense,
                flags: finalFlagsNum,
                // Ensure name and path are preserved from newMeta/pendingChanges
                name: this.newMeta[contractId][fileId].name || fileId,
                folderPath: this.newMeta[contractId][fileId].folderPath || '',
            };

            debugLogger.debug('Updated pendingChanges for', contractId, fileId, ':', JSON.parse(JSON.stringify(this.pendingChanges[contractId][fileId])));

            // --- Close editor --- 
            this.closeMetadataEditor();

            // Optional: Force update if UI doesn't refresh automatically
            // this.$forceUpdate(); 
        },

        closeMetadataEditor() {
            this.showMetadataEditor = false;
            this.fileToEditMetadata = null;
            this.tempMetadata = { labels: [], license: [], flags: [] }; // Reset temp data
        },

        // Handlers for the choices-vue components in the editor
        handleTempLabel(data) {
            debugLogger.debug('handleTempLabel received data:', data);
            const currentLabels = [...this.tempMetadata.labels]; // Clone for modification
            if (data.action === 'added') {
                if (!currentLabels.includes(data.item)) {
                    currentLabels.push(data.item);
                }
            } else if (data.action === 'removed') {
                const index = currentLabels.indexOf(data.item);
                if (index > -1) {
                    currentLabels.splice(index, 1);
                }
            }
            // Force reactivity by creating a new object with the updated array
            this.tempMetadata = {
                ...this.tempMetadata,
                labels: currentLabels.sort() // Keep it sorted
            };
            debugLogger.debug('tempMetadata after label update:', JSON.parse(JSON.stringify(this.tempMetadata)));
        },
        handleTempLic(data) {
            debugLogger.debug('handleTempLic received data:', data);
            let newLicense = [];
            if (data.action === 'added') {
                newLicense = [data.item]; // License allows only one selection
            } else if (data.action === 'removed') {
                newLicense = []; // Clear if removed
            }
            // Force reactivity
            this.tempMetadata = {
                ...this.tempMetadata, // Spread existing values
                license: newLicense
            };
            debugLogger.debug('tempMetadata after license update:', JSON.parse(JSON.stringify(this.tempMetadata)));
        },
        handleTempFlag(data) {
            debugLogger.debug('handleTempFlag received data:', data);

            // Initialize current flags as a bitwise number
            let currentFlagsNum = this.tempMetadata.flags.reduce((acc, flag) => acc | flag, 0);

            if (data.action === 'added') {
                currentFlagsNum |= data.item; // Add the flag using bitwise OR
            } else if (data.action === 'removed') {
                currentFlagsNum &= ~data.item; // Remove the flag using bitwise AND with negation
            }

            // Convert back to an array of flags for tempMetadata
            const newFlagsArray = [];
            if (currentFlagsNum & 4) newFlagsArray.push(4); // NSFW
            if (currentFlagsNum & 8) newFlagsArray.push(8); // Executable
            // Add other flags as needed

            // Force reactivity
            this.tempMetadata = {
                ...this.tempMetadata,
                flags: newFlagsArray.sort((a, b) => a - b) // Sort numerically
            };

            debugLogger.debug('tempMetadata after flag update:', JSON.parse(JSON.stringify(this.tempMetadata)));
        },
        // Added: Method to open the details viewer
        openDetailsViewer(file) {
            if (!file || !this.newMeta[file.i] || !this.contract[file.i]) return;
            this.hideContextMenu(); // Ensure context menu is closed
            this.fileToViewDetails = file;
            this.showDetailsViewer = true;
        },

        // Added: Method to close the details viewer
        closeDetailsViewer() {
            this.showDetailsViewer = false;
            this.fileToViewDetails = null;
        },

        // Added/Modified: Method to move a file to the Trash folder
        deleteFile(file) {
            if (!this.isEditable(file)) {
                alert("You can only move your own files to trash.");
                return;
            }

            const contractId = file.i;
            const fileId = file.f;
            const newPath = "Trash"; // The target folder is always "Trash"

            debugLogger.debug(`Moving file ${fileId} (contract ${contractId}) to Trash.`);

            // Update the canonical file object in this.files
            if (this.files[fileId]) {
                this.files[fileId].folderPath = newPath;
            }

            // Update newMeta
            if (this.newMeta[contractId] && this.newMeta[contractId][fileId]) {
                this.newMeta[contractId][fileId].folderPath = newPath;
            }

            // Update pendingChanges
            this.pendingChanges[contractId] = this.pendingChanges[contractId] || {};
            this.pendingChanges[contractId][fileId] = {
                ...(this.pendingChanges[contractId][fileId] || {}), // Preserve other pending changes like name, labels etc.
                folderPath: newPath, // Set/overwrite the folder path
                name: this.newMeta[contractId]?.[fileId]?.name || fileId, // Ensure name is preserved
            };

            debugLogger.debug('Updated pendingChanges for move to trash:', JSON.parse(JSON.stringify(this.pendingChanges[contractId][fileId])));

            // Rebuild folder trees and re-render the view
            this.buildFolderTrees();
            this.render(); // Ensure the UI updates to reflect the move
        },

        // Added: Method to move a folder and its contents to the Trash folder
        deleteFolder(folder) {
            if (!this.isEditableFolder(folder)) {
                alert("You don't have permission to delete this folder.");
                return;
            }

            const folderPath = folder.path;

            // Check if any files exist in this folder or its subfolders
            const hasFiles = Object.values(this.files).some(file =>
                file.folderPath === folderPath || file.folderPath.startsWith(folderPath + '/')
            );

            if (hasFiles) {
                // If the folder has files, we need confirmation and we'll move files to Trash
                const confirmation = confirm(`Delete folder "${folder.name}" and move all its files to Trash?`);
                if (!confirmation) {
                    return;
                }

                // Move all files to Trash
                Object.values(this.files).forEach(file => {
                    if ((file.folderPath === folderPath || file.folderPath.startsWith(folderPath + '/')) && this.isEditable(file)) {
                        this.deleteFile(file); // This will move the file to Trash
                    }
                });
            } else {
                // For empty folders, simple confirmation
                const confirmation = confirm(`Delete empty folder "${folder.name}"?`);
                if (!confirmation) {
                    return;
                }

                // Check if it's a virtual folder and remove it if found
                if (this.pendingChanges['__virtualFolders__']?.[this.selectedUser]) {
                    const virtualFolders = this.pendingChanges['__virtualFolders__'][this.selectedUser];
                    const virtualIndex = virtualFolders.indexOf(folderPath);

                    if (virtualIndex !== -1) {
                        // Remove from virtual folders
                        virtualFolders.splice(virtualIndex, 1);
                        debugLogger.debug(`Deleted virtual folder: ${folderPath}`);
                        this.buildFolderTrees();
                        return;
                    }
                }

                // For regular pending folders, we need to remove from contracts
                for (const contractId in this.pendingChanges) {
                    if (contractId === '__virtualFolders__') continue;

                    if (this.pendingChanges[contractId].__newFolders__) {
                        const folderIndex = this.pendingChanges[contractId].__newFolders__.indexOf(folderPath);
                        if (folderIndex !== -1) {
                            this.pendingChanges[contractId].__newFolders__.splice(folderIndex, 1);
                            debugLogger.debug(`Removed pending new folder "${folderPath}" as it was deleted.`);
                        }
                    }
                }
            }

            // Rebuild folder trees to reflect changes
            this.buildFolderTrees();
        },

        // Added: Method to restore a file from the Trash folder
        restoreFile(file) {
            if (!this.isEditable(file)) {
                alert("You can only restore your own files.");
                return;
            }

            if (file.folderPath !== 'Trash') {
                // Safety check, should not happen if context menu logic is correct
                console.warn("Attempted to restore a file not in Trash.");
                return;
            }

            const contractId = file.i;
            const fileId = file.f;
            const restorePath = ""; // Restore to root directory

            debugLogger.debug(`Restoring file ${fileId} (contract ${contractId}) from Trash to root.`);

            // Update the canonical file object in this.files
            if (this.files[fileId]) {
                this.files[fileId].folderPath = restorePath;
            }

            // Update newMeta
            if (this.newMeta[contractId] && this.newMeta[contractId][fileId]) {
                this.newMeta[contractId][fileId].folderPath = restorePath;
            }

            // Update pendingChanges
            this.pendingChanges[contractId] = this.pendingChanges[contractId] || {};
            this.pendingChanges[contractId][fileId] = {
                ...(this.pendingChanges[contractId][fileId] || {}), // Preserve other pending changes
                folderPath: restorePath, // Set/overwrite the folder path
                name: this.newMeta[contractId]?.[fileId]?.name || fileId, // Ensure name is preserved
            };

            debugLogger.debug('Updated pendingChanges for restore from trash:', JSON.parse(JSON.stringify(this.pendingChanges[contractId][fileId])));

            // Rebuild folder trees and re-render the view
            this.buildFolderTrees();
            this.render(); // Ensure the UI updates to reflect the move
        },

        /**
         * Validates file or folder names against allowed patterns
         * @param {string} name - The name to validate
         * @param {string} type - Either "file" or "folder"
         * @returns {object} - { valid: boolean, message: string }
         */
        validateItemName(name, type) {
            // Specific validations
            if (type === "file") {
                const namePattern = /^[^,]{1,32}$/u
                // Files should not start/end with spaces or periods
                if (!namePattern.test(name)) {
                    return { valid: false, message: "File name contains a comma or is too long. " };
                }
            } else if (type === "folder") {
                const namePattern = /^[0-9a-zA-Z+_.\- ]{2,16}$/
                // Folders should not start/end with spaces and can't be named "." or ".."
                if (!namePattern.test(name)) {
                    return { valid: false, message: "Valid Folder Names are 2-16 characters long, alphanumeric, and can include +, _, -, and spaces." };
                }
                if (name.length > 16) {
                    return { valid: false, message: "Folder name is too long (max 16 characters)." };
                }
                if (name.length < 2) {
                    return { valid: false, message: "Folder name must be at least 2 characters long." };
                }
                if (name === "." || name === "..") {
                    return { valid: false, message: "Folder name cannot be '.' or '..'." };
                }
            }

            return { valid: true, message: "" };
        },
        handleUploadDone(payload) {
            debugLogger.debug('📤 Upload completed, updating contract data...', payload);
            
            // Emit update-contract with the payload containing the new files
            this.$emit('update-contract', payload);
            
            // Instead of triggering a full refresh, just update the local file list
            // Call init() to reload the file data without a page refresh
            this.init();
            
            // Clear the dropped files state after upload is handled by child
            this.droppedExternalFiles = { files: [] };
        },
        hasStorage() {
            if (this.saccountapi && typeof this.saccountapi.storage === "string" && this.saccountapi.storage) {
                return this.saccountapi.name;
            } else {
                return false;
            }
        },

        isStored(contract) {
            if (!contract || !contract.n) return false;

            var found = false;
            for (var i in contract.n) {
                if (contract.n[i] === this.account) {
                    found = true;
                    break;
                }
            }
            return found;
        },

        extend(contract, amount) {
            // Check broca balance first
            const brocaBalance = this.broca_calc(this.broca);
            if (amount > brocaBalance) return;

            const toSign = {
                type: "cja",
                cj: {
                    broca: amount,
                    id: contract.i,
                    file_owner: contract.t,
                    power: this.extensionWithPower ? 1 : 0,
                },
                id: `spkccT_extend`,
                msg: `Extending ${contract.i}...`,
                ops: ["getTokenUser"],
                api: "https://spktest.dlux.io",
                txid: "extend",
            };
            this.$emit('tosign', toSign);
        },

        store(contract, remove = false) {
            // Check if user has a storage node
            if (!this.hasStorage()) return;

            const toSign = {
                type: "cja",
                cj: {
                    items: [contract.i]
                },
                id: `spkccT_${!remove ? 'store' : 'remove'}`,
                msg: `${!remove ? 'Storing' : 'Removing'} ${contract.i}...`,
                ops: ["getTokenUser"],
                api: "https://spktest.dlux.io",
                txid: `${contract.i}_${!remove ? 'store' : 'remove'}`,
            };
            this.$emit('tosign', toSign);
        },

        broca_calc(last = '0,0') {
            const last_calc = this.Base64toNumber(last.split(',')[1]);
            const accured = parseInt((parseFloat(this.sstats?.broca_refill || 0) * (this.saccountapi.head_block - last_calc)) / (this.saccountapi.pow_broca * 1000));
            var total = parseInt(last.split(',')[0]) + accured;
            if (total > (this.saccountapi.pow_broca * 1000)) total = (this.saccountapi.pow_broca * 1000);
            return total;
        },

        extendFolderContracts(folder) {
            // Get all files in the folder
            const folderPath = folder.path;
            const filesInFolder = this.filesArray.filter(file => {
                return this.newMeta[file.i][file.f].folderPath === folderPath;
            });

            if (filesInFolder.length === 0) {
                alert('No files found in this folder.');
                return;
            }

            // Ask for confirmation
            if (!confirm(`Extend ${filesInFolder.length} contract(s) in folder "${folderPath}"?`)) {
                return;
            }

            // Calculate total broca needed (100 per contract)
            const brocaPerContract = 100;
            const totalBrocaNeeded = filesInFolder.length * brocaPerContract;
            const brocaBalance = this.broca_calc(this.broca);

            if (totalBrocaNeeded > brocaBalance) {
                alert(`Not enough broca balance. Need ${totalBrocaNeeded}, have ${brocaBalance}.`);
                return;
            }

            // Process each file
            const uniqueContracts = new Set();
            filesInFolder.forEach(file => {
                if (!uniqueContracts.has(file.i)) {
                    uniqueContracts.add(file.i);
                    this.extend({
                        i: file.i,
                        t: file.t
                    }, brocaPerContract);
                }
            });
        },

        storeFolderContracts(folder, remove = false) {
            // Get all files in the folder
            const folderPath = folder.path;
            const filesInFolder = this.filesArray.filter(file => {
                return this.newMeta[file.i][file.f].folderPath === folderPath;
            });

            if (filesInFolder.length === 0) {
                alert('No files found in this folder.');
                return;
            }

            // Verify the user has a storage node
            if (!this.hasStorage()) {
                alert('You do not have a registered storage node.');
                return;
            }

            // Ask for confirmation
            if (!confirm(`${remove ? 'Remove' : 'Store'} ${filesInFolder.length} contract(s) in folder "${folderPath}"?`)) {
                return;
            }

            // Process each file, but only store each contract once
            const uniqueContracts = new Set();
            filesInFolder.forEach(file => {
                if (!uniqueContracts.has(file.i)) {
                    uniqueContracts.add(file.i);

                    // Check if we're storing or removing based on current status
                    const shouldProcess = remove ?
                        this.isStored(this.contract[file.i]) :
                        !this.isStored(this.contract[file.i]);

                    if (shouldProcess) {
                        this.store({
                            i: file.i,
                            t: file.t
                        }, remove);
                    }
                }
            });
        },

        handleFileDoubleClick(event, file) {
            // Prevent default behavior
            event.preventDefault();

            // Check if file is encrypted
            const isEncrypted = this.flagsDecode(this.newMeta[file.i][file.f].flags, 1).length > 0;

            if (!isEncrypted) {
                // Show preview modal instead of opening in new tab
                this.showFilePreview(file);
            } else if (this.contract[file.i]?.encryption?.key) {
                // If it's encrypted but we have the key, offer to download decrypted
                if (confirm('This file is encrypted. Do you want to download the decrypted file?')) {
                    this.downloadFile(file);
                }
            } else {
                // If it's encrypted and we don't have the key, offer to decrypt
                if (confirm('This file is encrypted. Do you want to attempt to decrypt it?')) {
                    this.decode(file.i);
                }
            }
        },

        showFilePreview(file) {
            const meta = this.newMeta[file.i][file.f];
            const fileType = meta.type?.toLowerCase() || '';
            const fileName = meta.name || file.f;
            const cid = file.f;
            const ipfsUrl = `https://ipfs.dlux.io/ipfs/${cid}`;

            this.previewModal = {
                show: true,
                file: {
                    name: fileName,
                    type: fileType,
                    cid: cid,
                    url: ipfsUrl,
                    size: this.fancyBytes(file.s),
                    meta: meta
                },
                loading: this.isImageFile(fileType) // Only show spinner for images
            };
        },

        closeFilePreview() {
            // HLS cleanup is handled by the MutationObserver pattern
            // Each video element manages its own HLS instance
            this.previewModal.show = false;
            this.previewModal.file = null;
            this.previewModal.loading = true;
        },

        getFileUrlWithType(file) {
            if (!file) return '';

            let url = file.url;

            // For IPFS URLs, add filename parameter for proper MIME type detection
            // This matches the original working implementation
            if (url.includes('ipfs.dlux.io/ipfs/')) {
                const cid = url.split('/ipfs/')[1].split('?')[0];
                
                // Reconstruct full filename with extension for VFS files
                let filename = file.name;
                if (file.meta?.type) {
                    filename = `${file.name}.${file.meta.type}`;
                }
                
                // Add filename parameter to help IPFS gateway resolve file type and references
                url = `https://ipfs.dlux.io/ipfs/${cid}?filename=${encodeURIComponent(filename)}`;
            }

            return url;
        },

        getVideoMimeType(file) {
            if (!file) return undefined;
            
            // Log file for debugging
            hlsDebug.fileDetection(file);
            
            // Check explicit MIME type in file.type
            if (file.type === 'application/x-mpegURL' || 
                file.type === 'audio/x-mpegurl' ||
                file.type === 'application/vnd.apple.mpegurl') {
                return 'application/x-mpegURL';
            }
            
            // Check metadata type field (VFS stores extension here)
            if (file.meta?.type === 'm3u8' || file.type === 'm3u8') {
                hlsDebug.log('DETECTION', 'HLS detected from VFS metadata type field', file);
                return 'application/x-mpegURL';
            }
            
            // Check file name with extension
            if (file.name?.endsWith('.m3u8')) {
                return 'application/x-mpegURL';
            }
            
            // For VFS files, reconstruct full name with extension
            const fullName = file.meta ? `${file.name}.${file.meta.type}` : file.name;
            if (fullName?.endsWith('.m3u8')) {
                hlsDebug.log('DETECTION', `HLS detected from reconstructed VFS name: ${fullName}`, file);
                return 'application/x-mpegURL';
            }
            
            return undefined;
        },

        isImageFile(type) {
            return type && (type.includes('image') ||
                type.includes('jpg') ||
                type.includes('jpeg') ||
                type.includes('png') ||
                type.includes('gif') ||
                type.includes('webp') ||
                type.includes('svg'));
        },

        isVideoFile(type) {
            return type && (type.includes('video') ||
                type.includes('mp4') ||
                type.includes('webm') ||
                type.includes('ogg') ||
                type.includes('m3u8') ||
                type.includes('avi') ||
                type.includes('mov') ||
                type.includes('mkv'));
        },

        isAudioFile(type) {
            return type && (type.includes('audio') ||
                type.includes('mp3') ||
                type.includes('wav') ||
                type.includes('ogg') ||
                type.includes('flac'));
        },


        sendIt(payload) {
            this.$emit('tosign', payload);
        },
        confirmExtension() {
            if (this.extensionFile && this.extensionAmount > 0 && this.extensionAmount <= this.brocaBalance) {
                this.extend({
                    i: this.extensionFile.i,
                    t: this.extensionFile.t
                }, parseInt(this.extensionAmount));
                this.closeExtensionDialog();
            }
        },
        closeExtensionDialog() {
            this.showExtensionDialog = false;
        },
        openExtensionDialog(file) {
            this.extensionFile = file;
            this.brocaBalance = this.broca_calc(this.saccountapi.broca);

            // Calculate cost based on contract details
            const contractDetails = this.contract[file.i];
            if (contractDetails) {
                // r is the daily rate, calculate default based on 7 days
                const defaultCost = Math.min(
                    parseInt((parseInt(7) / 30) * parseInt(contractDetails.r || 100)),
                    this.brocaBalance
                );
                this.extensionAmount = Math.max(defaultCost, 1); // Ensure minimum of 1
                this.extensionDays = 7;
            } else {
                this.extensionAmount = 100;
                this.extensionDays = 7;
            }

            this.showExtensionDialog = true;
        },
        handleGlobalDragEnd() {
            const activeElements = this.$refs.container?.querySelectorAll('.drag-over-active');
            activeElements?.forEach(el => el.classList.remove('drag-over-active'));
            debugLogger.debug('Cleaned up all drag-over-active on global dragend');
        },
        clearAllDragHighlights() {
            this.$refs.container?.querySelectorAll('.drag-over-active').forEach(el => el.classList.remove('drag-over-active'));
            const filesDiv = this.$refs.container?.querySelector('.files');
            if (filesDiv?.classList.contains('drag-over-active')) {
                filesDiv.classList.remove('drag-over-active');
            }
        },
        handleComponentDragLeave(event) {
            // If relatedTarget is null, it means we left the window or a non-browser area
            if (!event.relatedTarget || event.relatedTarget.nodeName === 'HTML') {
                this.clearAllDragHighlights();
                debugLogger.debug('Drag left component/window, cleared all highlights');
            }
        },
        addToDapp(file) {
            // Get file metadata
            const meta = this.newMeta[file.i][file.f];
            const fileName = meta.name || file.f;
            const fileType = meta.type || '';
            const cid = file.f;
            const contractId = file.i;

            // Determine how to format the file based on its type
            let formattedContent = '';
            const fileTypeFormatted = fileType.toLowerCase();

            // Video files and playlists
            if (fileTypeFormatted.includes('video') ||
                fileTypeFormatted.includes('mp4') ||
                fileTypeFormatted.includes('webm') ||
                fileTypeFormatted.includes('ogg') ||
                fileTypeFormatted.includes('avi') ||
                fileTypeFormatted.includes('mov') ||
                fileTypeFormatted.includes('mkv') ||
                fileTypeFormatted.includes('flv') ||
                fileTypeFormatted.includes('wmv') ||
                fileTypeFormatted.includes('m4v') ||
                fileTypeFormatted.includes('3gp') ||
                fileName.toLowerCase().includes('playlist') ||
                fileName.toLowerCase().endsWith('.m3u8') ||
                fileName.toLowerCase().endsWith('.m3u') ||
                fileName.toLowerCase().endsWith('.mp4') ||
                fileName.toLowerCase().endsWith('.webm') ||
                fileName.toLowerCase().endsWith('.ogg') ||
                fileName.toLowerCase().endsWith('.avi') ||
                fileName.toLowerCase().endsWith('.mov') ||
                fileName.toLowerCase().endsWith('.mkv') ||
                fileName.toLowerCase().endsWith('.flv') ||
                fileName.toLowerCase().endsWith('.wmv') ||
                fileName.toLowerCase().endsWith('.m4v') ||
                fileName.toLowerCase().endsWith('.3gp')) {
                // Set proper type attribute for M3U8 playlists
                const typeAttr = (fileTypeFormatted.includes('m3u8') || fileName.toLowerCase().endsWith('.m3u8')) 
                    ? ' type="application/x-mpegURL"' : '';
                formattedContent = `<video src="https://${location.hostname != 'localhost' ? location.hostname : 'dlux.io'}/ipfs/${cid}"${typeAttr} controls></video>`;
            }
            // Image files
            else if (fileTypeFormatted.includes('image') ||
                fileTypeFormatted.includes('png') ||
                fileTypeFormatted.includes('jpg') ||
                fileTypeFormatted.includes('jpeg') ||
                fileTypeFormatted.includes('gif') ||
                fileTypeFormatted.includes('svg') ||
                fileTypeFormatted.includes('webp')) {
                formattedContent = `![${fileName}](https://${location.hostname != 'localhost' ? location.hostname : 'dlux.io'}/ipfs/${cid})`;
            }
            // Everything else as anchor tag
            else {
                formattedContent = `[${fileName}](https://${location.hostname != 'localhost' ? location.hostname : 'dlux.io'}/ipfs/${cid})`;
            }

            // Emit the formatted content and contract info to parent (for backwards compatibility)
            this.$emit('add-to-post', {
                content: formattedContent,
                contractId: contractId,
                cid: cid,
                fileName: fileName,
                fileType: fileType
            });
            
            // Also emit the specific dapp event
            this.$emit('add-to-dapp', {
                content: formattedContent,
                contractId: contractId,
                cid: cid,
                fileName: fileName,
                fileType: fileType
            });
        },
        
        addToEditor(file) {
            // Get file metadata
            const meta = this.newMeta[file.i][file.f];
            const fileName = meta.name || file.f;
            const fileType = meta.type || '';
            // Strip folder depth suffix from file type (e.g., 'png.0' -> 'png')
            const cleanFileType = fileType.split('.')[0];
            const cid = file.f;
            const contractId = file.i;
            
            // Emit the file data for the editor to handle directly
            this.$emit('add-to-editor', {
                cid: cid,
                contractId: contractId,
                fileName: fileName,
                fileType: fileType,
                cleanFileType: cleanFileType,
                url: `https://${location.hostname != 'localhost' ? location.hostname : 'dlux.io'}/ipfs/${cid}`,
                meta: meta
            });
        },
        
        handleFileSlot(slotType, file) {
            // Get file metadata
            const meta = this.newMeta[file.i][file.f];
            const fileName = meta.name || file.f;
            const fileType = meta.type || '';
            const cid = file.f;
            const contractId = file.i;

            // Emit the file slot event with the slot type
            this.$emit(`set-${slotType}`, {
                cid: cid,
                hash: cid,
                filename: fileName,
                name: fileName,
                size: file.s,
                type: fileType,
                mime: fileType,
                contractId: contractId,
                f: file.f,
                i: file.i
            });
        },

        // Get context menu text based on post type (generic for any iframe app)
        getAddToPostText() {
            switch(this.postType) {
                case 'QmcAkxXzczkzUJWrkWNhkJP9FF1L9Lu5sVCrUFtAZvem3k':
                    return 'Add to 360° Gallery';
                case 'dapp':
                    return 'Add to dApp Builder';
                case 'remix':
                    return 'Add to ReMix Builder';
                case 'video':
                    return 'Add to Video Post';
                case 'blog':
                default:
                    return 'Add to Post';
            }
        },
        
        // Video transcoding methods
        isVideoFileName(fileName) {
            if (!fileName) return false;
            const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.mpg', '.mpeg', '.3gp', '.ogv'];
            return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
        },
        
        isStreamableVideo(fileName) {
            if (!fileName) return false;
            return fileName.toLowerCase().endsWith('.m3u8');
        },
        
        processFilesWithVideoCheck(files) {
            // Separate video files from other files
            const videoFiles = [];
            const otherFiles = [];
            
            files.forEach(fileInfo => {
                if (this.isVideoFileName(fileInfo.file.name)) {
                    videoFiles.push(fileInfo);
                } else {
                    otherFiles.push(fileInfo);
                }
            });
            
            // If we have video files, add them to the queue and show choice modal
            if (videoFiles.length > 0) {
                debugLogger.debug('Found video files:', videoFiles);
                this.pendingVideoFiles = videoFiles;
                // Show choice modal for first video instead of old transcoder modal
                const firstVideo = this.pendingVideoFiles[0];
                debugLogger.debug('First video:', firstVideo);
                this.videoToTranscode = {
                    file: firstVideo.file,
                    fileName: firstVideo.file.name,
                    fileSize: firstVideo.file.size,
                    fullAppPath: firstVideo.fullAppPath
                };
                debugLogger.debug('Setting showVideoChoiceModal to true');
                this.showVideoChoiceModal = true;
            }
            
            // If we have other files, pass them directly to upload
            if (otherFiles.length > 0) {
                // Extract just the File objects since upload-everywhere expects raw files
                const rawFiles = otherFiles.map(fileInfo => fileInfo.file);
                this.droppedExternalFiles = { files: rawFiles };
            }
        },
        
        processNextVideoFile() {
            if (this.pendingVideoFiles.length === 0) {
                // All video files processed
                return;
            }
            
            const videoFileInfo = this.pendingVideoFiles[0];
            this.videoToTranscode = {
                file: videoFileInfo.file,
                fileName: videoFileInfo.file.name,
                fileSize: videoFileInfo.file.size,
                fullAppPath: videoFileInfo.fullAppPath
            };
            this.showVideoChoiceModal = true;
        },
        
        handleTranscodeComplete(result) {
            // Remove the processed video from queue
            const processedVideo = this.pendingVideoFiles.shift();
            
            // Add raw files directly - upload-everywhere expects File objects
            const filesToAdd = result.files || [];
            
            // Add to upload queue
            const currentFiles = this.droppedExternalFiles?.files || [];
            this.droppedExternalFiles = { 
                files: [...currentFiles, ...filesToAdd],
                blobUrls: result.blobUrls || {} // Pass blob URLs from transcoder
            };
            
            // Close transcoder and process next video using choice modal
            this.closeVideoTranscoder();
            if (this.pendingVideoFiles.length > 0) {
                const nextVideo = this.pendingVideoFiles[0];
                this.videoToTranscode = {
                    file: nextVideo.file,
                    fileName: nextVideo.file.name,
                    fileSize: nextVideo.file.size,
                    fullAppPath: nextVideo.fullAppPath
                };
                this.showVideoChoiceModal = true;
            }
        },
        
        skipVideoTranscoding() {
            // User chose to skip transcoding, upload original
            const processedVideo = this.pendingVideoFiles.shift();
            
            // Add just the raw File object
            const currentFiles = this.droppedExternalFiles?.files || [];
            this.droppedExternalFiles = { 
                files: [...currentFiles, processedVideo.file] 
            };
            
            // Close transcoder and process next video using choice modal
            this.closeVideoTranscoder();
            if (this.pendingVideoFiles.length > 0) {
                const nextVideo = this.pendingVideoFiles[0];
                this.videoToTranscode = {
                    file: nextVideo.file,
                    fileName: nextVideo.file.name,
                    fileSize: nextVideo.file.size,
                    fullAppPath: nextVideo.fullAppPath
                };
                this.showVideoChoiceModal = true;
            }
        },
        
        closeVideoTranscoder() {
            this.showVideoTranscoder = false;
            this.showVideoChoiceModal = false;
            this.videoToTranscode = null;
        },
        
        closeVideoChoiceModal() {
            this.showVideoChoiceModal = false;
            this.videoToTranscode = null;
        },
        
        cancelVideoChoice() {
            // Skip current video without processing
            const skippedVideo = this.pendingVideoFiles.shift();
            debugLogger.debug('User cancelled video choice for:', skippedVideo?.file?.name);
            
            // Close the modal
            this.closeVideoChoiceModal();
            
            // Process next video if any
            if (this.pendingVideoFiles.length > 0) {
                this.processNextVideoFile();
            }
        },
        
        handleTranscodeError(error) {
            console.error('Video transcoding error:', error);
            alert('Video transcoding failed: ' + (error.message || 'Unknown error'));
            this.skipVideoTranscoding();
        },
        
        // New video processing methods
        handleVideoChoice(choice) {
            
            // Get current video from queue
            const video = this.pendingVideoFiles.shift();
            
            // Guard clause: check if video exists
            if (!video) {
                console.warn('No video to process in handleVideoChoice');
                this.closeVideoChoiceModal();
                return;
            }
            
            // Close the choice modal
            this.closeVideoChoiceModal();
            
            if (choice === 'original') {
                // Add just the raw File object - upload-everywhere expects this
                const currentFiles = this.droppedExternalFiles?.files || [];
                this.droppedExternalFiles = { 
                    files: [...currentFiles, video.file] 
                };
            } else {
                // For "both" option, add original file to ready section too
                if (choice === 'both') {
                    // Add just the raw File object
                    const currentFiles = this.droppedExternalFiles?.files || [];
                    this.droppedExternalFiles = { 
                        files: [...currentFiles, video.file] 
                    };
                }
                
                // Add to processing queue for transcoding
                const processingId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                
                // Check if any other file is actively transcoding
                const hasActiveTranscoding = this.processingFiles.some(f => f.status === 'transcoding');
                
                this.processingFiles.push({
                    id: processingId,
                    file: video.file,
                    fileName: video.file.name,    // Extract from inner file object
                    fileSize: video.file.size,    // Extract from inner file object
                    choice: choice,
                    status: hasActiveTranscoding ? 'queued' : 'transcoding',
                    progress: 0,
                    error: null,
                    transcodedFiles: [],
                    thumbnailUrl: null,
                    transcoderInstance: null
                });
                
                // Start transcoding in the background (if not queued)
                if (!hasActiveTranscoding) {
                    this.$nextTick(() => {
                        this.startVideoTranscoding(processingId);
                    });
                }
            }
            
            // Process next video if any using the new choice modal system
            if (this.pendingVideoFiles.length > 0) {
                // Show choice modal for next video instead of old transcoder modal
                const nextVideo = this.pendingVideoFiles[0];
                this.videoToTranscode = {
                    file: nextVideo.file,
                    fileName: nextVideo.file.name,
                    fileSize: nextVideo.file.size,
                    fullAppPath: nextVideo.fullAppPath
                };
                this.showVideoChoiceModal = true;
            }
        },
        
        async startVideoTranscoding(processingId) {
            const processingFile = this.processingFiles.find(f => f.id === processingId);
            if (!processingFile) {
                debugLogger.error(`❌ Cannot start transcoding - no file found with ID: ${processingId}`);
                return;
            }
            
            // Check if any other file is actively transcoding
            const activeTranscoding = this.processingFiles.find(f => 
                f.id !== processingId && f.status === 'transcoding'
            );
            
            if (activeTranscoding) {
                // Queue this file to start after the current one finishes
                processingFile.status = 'queued';
                processingFile.progress = 0;
                debugLogger.info(`📋 Queuing ${processingFile.fileName} - waiting for ${activeTranscoding.fileName} to complete`);
                return;
            }
            
            // Mark as actively transcoding
            processingFile.status = 'transcoding';
            debugLogger.info(`✅ Starting transcoding for: ${processingFile.fileName}`);
            
            // The transcoder component will auto-start
            // Events will be handled by the handlers below
        },
        
        handleProcessingProgress(processingId, progressData) {
            const processingFile = this.processingFiles.find(f => f.id === processingId);
            if (processingFile) {
                // Handle both number and object formats
                if (typeof progressData === 'number') {
                    processingFile.progress = progressData;
                } else if (typeof progressData === 'object' && progressData !== null) {
                    if (typeof progressData.progress === 'number') {
                        processingFile.progress = progressData.progress;
                    }
                    if (typeof progressData.message === 'string') {
                        processingFile.message = progressData.message;
                    }
                }
                
                // Vue 3's reactivity should automatically detect these property changes
            }
        },
        
        handleProcessingComplete(processingId, result) {
            const processingFile = this.processingFiles.find(f => f.id === processingId);
            if (processingFile) {
                processingFile.status = 'complete';
                processingFile.transcodedFiles = result.files;
                processingFile.blobUrls = result.blobUrls || {}; // Store blob URLs from transcoder
                processingFile.thumbnailUrl = result.thumbnail ? URL.createObjectURL(result.thumbnail) : null;
                // Emit progress 100 to ensure UI updates
                processingFile.progress = 100;
                
                debugLogger.info(`✅ Processing complete for: ${processingFile.fileName}`);
                
                // Auto-move to ready section after a brief moment to show completion
                setTimeout(() => {
                    this.moveToReady(processingFile);
                    
                    // Start the next queued video if any
                    this.processNextQueuedVideo();
                }, 500);
            }
        },
        
        handleProcessingError(processingId, error) {
            const processingFile = this.processingFiles.find(f => f.id === processingId);
            if (processingFile) {
                processingFile.status = 'failed';
                processingFile.error = error.message || 'Transcoding failed';
                
                // Start the next queued video even if this one failed
                this.processNextQueuedVideo();
            }
        },
        
        processNextQueuedVideo() {
            // Find the next queued video
            const queuedFile = this.processingFiles.find(f => f.status === 'queued');
            if (queuedFile) {
                debugLogger.info(`🚀 Processing next queued video: ${queuedFile.fileName}`);
                
                // Reset status and start transcoding
                queuedFile.status = 'transcoding';
                queuedFile.progress = 0;
                
                // Give the transcoder time to initialize, then start
                setTimeout(() => {
                    const transcoderRef = `transcoder_${queuedFile.id}`;
                    
                    if (this.$refs[transcoderRef] && this.$refs[transcoderRef][0]) {
                        const transcoder = this.$refs[transcoderRef][0];
                        
                        // The transcoder should start automatically, but we can force it
                        if (transcoder.state === 'ready' && transcoder.startProcess) {
                            transcoder.uploadChoice = 'transcode';
                            transcoder.startProcess();
                        } else if (transcoder.state === 'transcoding') {
                            // Already transcoding - no action needed
                        } else if (!transcoder.state || transcoder.state === 'loading') {
                            // Wait for transcoder to be ready
                            const checkReady = setInterval(() => {
                                if (transcoder.state === 'ready') {
                                    clearInterval(checkReady);
                                    transcoder.uploadChoice = 'transcode';
                                    transcoder.startProcess();
                                }
                            }, 100);
                            
                            // Stop checking after 10 seconds
                            setTimeout(() => clearInterval(checkReady), 10000);
                        }
                    } else {
                        // Try again after a longer delay
                        setTimeout(() => {
                            if (this.$refs[transcoderRef] && this.$refs[transcoderRef][0]) {
                                const transcoder = this.$refs[transcoderRef][0];
                                if (transcoder.state === 'ready' && transcoder.startProcess) {
                                    transcoder.uploadChoice = 'transcode';
                                    transcoder.startProcess();
                                }
                            }
                        }, 1000);
                    }
                }, 500);
            }
        },
        
        retryProcessing(processingId) {
            const processingFile = this.processingFiles.find(f => f.id === processingId);
            if (!processingFile) return;
            
            // Reset status and progress
            processingFile.status = 'transcoding';
            processingFile.progress = 0;
            processingFile.error = null;
            
            // Start transcoding again
            this.startVideoTranscoding(processingId);
        },
        
        
        deleteProcessingFile(processingId) {
            const index = this.processingFiles.findIndex(f => f.id === processingId);
            if (index === -1) return;
            
            const processingFile = this.processingFiles[index];
            
            // Get the transcoder component ref and clean it up
            const transcoderRef = `transcoder_${processingId}`;
            if (this.$refs[transcoderRef] && this.$refs[transcoderRef][0]) {
                const transcoder = this.$refs[transcoderRef][0];
                if (transcoder.cleanup) {
                    transcoder.cleanup();
                }
            }
            
            // Clean up transcoder instance if it exists
            if (processingFile.transcoderInstance) {
                processingFile.transcoderInstance.$destroy();
            }
            
            // Remove from processing queue
            this.processingFiles.splice(index, 1);
        },
        
        previewProcessedVideo(processingFile) {
            // Create a temporary video transcoder instance just for preview
            // We'll reuse the existing video transcoder component's preview functionality
            const tempTranscoder = {
                state: 'complete',
                outputFiles: {
                    m3u8: processingFile.transcodedFiles.find(f => f.name.endsWith('.m3u8')),
                    segments: processingFile.transcodedFiles.filter(f => f.name.endsWith('.ts')),
                    thumbnail: processingFile.thumbnailUrl
                },
                transcodedFiles: processingFile.transcodedFiles,
                thumbnailUrl: processingFile.thumbnailUrl,
                fileName: processingFile.fileName,
                showPreview: true
            };
            
            // Store for modal display
            this.videoPreviewData = tempTranscoder;
            
            // You would need to add a video preview modal to the template
            // For now, we'll just log
            debugLogger.debug('Preview video:', processingFile);
            alert('Video preview functionality will be integrated with the existing video player modal.');
        },
        
        moveToReady(processingFile) {
            // Extract all raw files for upload
            const allFiles = processingFile.transcodedFiles.map(pf => {
                // Handle ProcessedFile objects properly
                return pf.getFile ? pf.getFile() : pf.file || pf;
            });
            
            // Create metadata map for upload component
            const fileMetadata = {};
            processingFile.transcodedFiles.forEach(pf => {
                // Get metadata from ProcessedFile object
                const metadata = pf.getMetadata ? pf.getMetadata() : {
                    isAuxiliary: pf.isAuxiliary,
                    role: pf.role,
                    parentFile: pf.parentFile
                };
                
                const fileName = pf.getFile ? pf.getFile().name : (pf.file?.name || pf.name);
                
                fileMetadata[fileName] = {
                    isAuxiliary: metadata.isAuxiliary,
                    role: metadata.role,
                    parentFile: metadata.parentFile
                };
                
                debugLogger.debug(`filesvue-dd: Metadata for ${fileName}:`, {
                    ...fileMetadata[fileName]
                });
            });
            
            // Add all files to upload queue
            const currentFiles = this.droppedExternalFiles?.files || [];
            const currentMetadata = this.droppedExternalFiles?.metadata || {};
            const currentBlobUrls = this.droppedExternalFiles?.blobUrls || {};
            
            this.droppedExternalFiles = { 
                files: [...currentFiles, ...allFiles],
                metadata: { ...currentMetadata, ...fileMetadata },
                blobUrls: { ...currentBlobUrls, ...(processingFile.blobUrls || {}) }
            };
            
            debugLogger.debug('moveToReady: Setting droppedExternalFiles with metadata:', {
                fileCount: allFiles.length,
                metadata: fileMetadata
            });
            
            // Remove from processing queue
            this.deleteProcessingFile(processingFile.id);
        },
    },
    computed: {
        hasFiles() {
            return Object.keys(this.files).length > 0;
        },
        hasStorageNode() {
            return this.hasStorage();
        },
        hasUploadContent() {
            // Check if there are external files dropped for upload
            return this.droppedExternalFiles && this.droppedExternalFiles.files && this.droppedExternalFiles.files.length > 0;
        },
        currentFileCount() {
            return this.getFiles(this.selectedUser, this.currentFolderPath).length;
        },
        getSubfolderCount() {
            return this.getSubfolders(this.selectedUser, this.currentFolderPath).length
        },
        // Calculate the estimated size of the updates payload
        updatesPayloadSize() {
            if (!this.pendingChanges || Object.keys(this.pendingChanges).length === 0) {
                return 0;
            }

            // Create a test updates object similar to what would be sent
            const testUpdates = {};

            for (const contractId in this.pendingChanges) {
                if (this.contract && this.contract[contractId] && this.contract[contractId].m) {
                    const originalMetadata = this.contract[contractId].m || '';

                    // This is approximate - we're using the original metadata length as an estimate
                    // The actual size would be calculated during saveChanges
                    if (!testUpdates[contractId]) {
                        testUpdates[contractId] = { m: originalMetadata };
                    }
                }
            }

            // Estimate the size of the stringified updates
            const payloadObj = { updates: testUpdates };
            return JSON.stringify(payloadObj).length;
        },
        // Check if updates payload exceeds limit
        updatesPayloadTooLarge() {
            const MAX_SIZE = 7500; // Maximum size in bytes
            return this.updatesPayloadSize > MAX_SIZE;
        },
        // Added: Computed property for details viewer data (optional, but can help clean up template)
        detailsData() {
            if (!this.showDetailsViewer || !this.fileToViewDetails) return null;

            const file = this.fileToViewDetails;
            const contract = this.contract[file.i];
            const meta = this.newMeta[file.i]?.[file.f] || {};

            // Need to check if helper methods exist before calling them
            const fancyBytes = this.fancyBytes || ((bytes) => `${bytes} B`);
            const flagsDecode = this.flagsDecode || ((flags) => []);
            const labelsDecode = this.labelsDecode || ((labels) => []);
            const blockToTime = this.blockToTime || ((block) => `Block ${block}`);
            const Base64toNumber = this.Base64toNumber || ((str) => 0);
            const isValidThumb = this.isValidThumb || ((data) => data && data.startsWith('data:image'));

            return {
                file: {
                    cid: file.f,
                    name: meta.name || file.f,
                    owner: file.o,
                    size: fancyBytes(file.s),
                    path: meta.folderPath || file.folderPath || '/',
                    type: meta.type || 'unknown',
                    flags: flagsDecode(meta.flags),
                    labels: labelsDecode(meta.labels),
                    license: this.licenses[meta.license],
                    thumbData: isValidThumb(meta.thumb_data) ? meta.thumb_data : null,
                    thumbCid: meta.thumb,
                    encrypted: meta.encrypted || (Base64toNumber(meta.flags) & 1),
                    creationBlock: file.c,
                    creationTime: blockToTime(file.c),
                    expirationBlock: file.e,
                    expirationTime: blockToTime(file.e), // If needed
                },
                contract: {
                    id: file.i,
                    owner: contract.t,
                    nodes: contract.n,
                    payScale: parseFloat(1 / (Object.keys(contract.n).length / contract.p)).toFixed(2),
                    prominence: contract.p, // number of incentivized nodes to decentralize the file
                    cost: contract.r, // cost per month
                    reviewBlock: contract.e.split(':')[0], // trash empty date
                    totalSizeStored: fancyBytes(contract.u || 0),
                    autoRenew: Number(contract.m.substring(0, 1)) & 1,
                    encrypted: contract.m.substring(1, 1) === '#' ? true : false,
                    encryptionAccounts: contract.encryption?.accounts ? Object.keys(contract.encryption.accounts) : [],
                }
            };
        }
    },
    watch: {
        ...watchers,
        // Watch for modal opening to enhance videos
        'previewModal.show': {
            handler(newValue) {
                if (newValue && this.previewModal.file && this.isVideoFile(this.previewModal.file.type)) {
                    // Modal opened with video file - enhance videos after DOM update
                    this.$nextTick(() => {
                        this.enhanceVideosManually();
                    });
                }
            },
            immediate: false
        },
        'contracts': {

            handler(newValue, oldValue) {
                //find the difference in this object
                var diff = false
                //check if the contract is in the new value 
                for (var i = 0; i < newValue.length; i++) {
                    if (!this.newMeta[newValue[i].i]) {
                        diff = true
                        break
                    }
                }
                //if the contract is in the new value check each .m string for a change
                if (!diff) for (var i = 0; i < newValue.length; i++) {
                    if (newValue[i].m != oldValue[i].m) {
                        diff = true
                        break
                    }
                }
                if (diff) {
                    if (this.debounceTime && new Date().getTime() - this.debounceTime < 1000) return
                    this.init()
                    this.debounceTime = new Date().getTime()
                }
            },
            deep: true
        },
        'account': {
            handler: function (newValue) {
                // Update localStorage key when account changes
                this.localStorageKey = newValue ? `fileVuePendingChanges_${newValue}` : '';
                // Load pending changes for the new account
                this.loadPendingChanges();
                // Original account-related logic
                if (this.account) this.filesSelect.addusers[this.account] = true;
                this.init();
            },
            deep: false
        },
        'saccountapi': {
            handler(newValue) {
                if (this.saccountapi.name) this.filesSelect.addusers[this.saccountapi.name] = true;
                if (this.owners.length > 0) {  //when saccountapi.name is not set
                    this.selectedUser = this.saccountapi.name
                }
                this.init();
            },
            deep: true
        },
        'pendingChanges': {
            handler(newValue) {
                if (this.localStorageKey) {
                    try {
                        if (Object.keys(newValue).length > 0) {
                            localStorage.setItem(this.localStorageKey, JSON.stringify(newValue));
                            // debugLogger.debug("Saved pendingChanges to localStorage"); // Optional debug log
                        } else {
                            // If pendingChanges becomes empty, remove it from localStorage
                            localStorage.removeItem(this.localStorageKey);
                        }
                    } catch (e) {
                        console.error("Error saving pending changes to localStorage:", e);
                    }
                }
            },
            deep: true
        },
        'extensionDays': {
            handler(newValue) {
                if (this.extensionFile && this.contract[this.extensionFile.i]) {
                    const contractDetails = this.contract[this.extensionFile.i];
                    const cost = Math.min(
                        parseInt((parseInt(newValue) / 30) * parseInt(contractDetails.r || 100)),
                        this.brocaBalance
                    );
                    this.extensionAmount = Math.max(cost, 1); // Ensure minimum of 1
                }
            }
        },
        'selectedUser': {
            handler(newValue) {
                // Load thumbnails when user selection changes
                this.$nextTick(() => {
                    this.loadThumbnailsForCurrentFolder();
                });
            }
        },
    },
    mounted() {
        // Set up localStorage key based on current account
        this.localStorageKey = this.account ? `fileVuePendingChanges_${this.account}` : '';
        // Load any pending changes from previous sessions
        this.loadPendingChanges();

        // Clear the hash if updateUrl is false and we're at #drive
        if (!this.updateUrl && window.location.hash === '#drive') {
            history.replaceState(null, null, window.location.pathname + window.location.search);
        }

        // Existing mounted code
        this.init()

        // Start observing for video elements to setup HLS
        
        // Set up MutationObserver to watch UEController for content changes
        const ueController = document.getElementById('UEController');
        if (ueController) {
            const observer = new MutationObserver((mutations) => {
                // Check if UEController has children
                this.uploadActive = ueController.children.length > 0;
            });
            
            observer.observe(ueController, { 
                childList: true, 
                subtree: false 
            });
            
            // Store observer for cleanup
            this.ueControllerObserver = observer;
        }
        this.videoObserver = this.initIpfsVideoSupport();

        // Add window mouseup handler for selection box (emergency escape)
        window.addEventListener('mouseup', (e) => {
            if (this.selectionBox.active) {
                debugLogger.debug('Emergency ending selection box (window mouseup)');
                this.endSelectionBox();
            }
        });
        document.documentElement.addEventListener('dragend', this.handleGlobalDragEnd);
        // Add component-level dragleave listener
        if (this.$refs.container) {
            this.$refs.container.addEventListener('dragleave', this.handleComponentDragLeave);
        }
        
        // Add keyboard listener for escape key
        this.handleEscapeKey = (e) => {
            if (e.key === 'Escape' && this.previewModal.show) {
                this.closeFilePreview();
            }
        };
        document.addEventListener('keyup', this.handleEscapeKey);
    },
    beforeUnmount() {
        // Clean up video observer and HLS instances
        if (this.videoObserver) {
            this.videoObserver.disconnect();
            window._dluxVideoObserver = null;
        }
        
        // Clean up UEController observer
        if (this.ueControllerObserver) {
            this.ueControllerObserver.disconnect();
        }
        
        // Clean up event listeners
        window.removeEventListener('mouseup', this.endSelectionBox);
        document.documentElement.removeEventListener('dragend', this.handleGlobalDragEnd);
        // Remove component-level dragleave listener
        if (this.$refs.container) {
            this.$refs.container.removeEventListener('dragleave', this.handleComponentDragLeave);
        }
        
        // Remove keyboard listener
        if (this.handleEscapeKey) {
            document.removeEventListener('keyup', this.handleEscapeKey);
        }
    }
};
