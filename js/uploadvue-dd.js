import ChoicesVue from '/js/choices-vue.js';
import MCommon from '/js/methods-common.js'
import Mspk from '/js/methods-spk.js'
import { thumbnailService } from '/js/services/thumbnail-service.js';
import debugLogger from '/js/utils/debug-logger.js';
export default {
  components: {
    "choices-vue": ChoicesVue
  },
  template: `
 <!--file uploader-->
    <Transition>
       <div v-if="contract.i" class="">
        <!-- Hide the file input/drag-drop area as files are passed via props -->
        <!-- 
        <div>
            <form onsubmit="return false;">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="ms-auto me-auto my-3">
                        <label for="formFile" class="btn btn-lg btn-light"><i
                                class="fa-solid fa-file-circle-plus fa-fw me-2"></i><span v-if="type == 'files'">Select Files</span><span v-if="type == 'video'">Select Thumbnail</span></label>
                        <input class="d-none" id="formFile" type="file" :multiple="type != 'video'" :accept="type === 'video' ? 'image/*' : ''" @change="uploadFile">
                    </div>
                </div>
                <div class="pb-2">
                    <div class="py-5 text-center lead rounded"
                        style="border-width: 2px; border-style: dashed; background-color:rgba(0,0,0,0.3);" id="img-well"
                        @drop="dragFile($event)" @dragenter.prevent @dragover.prevent>
                        Or drag and drop <span v-if="type == 'files'">file(s)</span><span v-if="type == 'video'">thumbnail</span> here
                    </div>
                </div>
            </form>
        </div>
        -->



        <div v-if="File.length" class="rounded p-2" style="background-color:rgba(0,0,0,0.1)"> 
            <!-- Duplicate files warning -->
            <div v-if="duplicateFiles.length > 0 && !allowDuplicates" class="alert alert-warning mb-2">
                <i class="fa-solid fa-exclamation-triangle fa-fw me-1"></i>
                <strong>{{duplicateFiles.length}} file{{duplicateFiles.length > 1 ? 's' : ''}} already exist on the network:</strong>
                <ul class="mb-1 mt-2">
                    <li v-for="dup in duplicateFiles.slice(0, 5)" :key="dup.cid">
                        {{dup.name}} ({{dup.cid.substring(0, 8)}}...)
                    </li>
                    <li v-if="duplicateFiles.length > 5">...and {{duplicateFiles.length - 5}} more</li>
                </ul>
                <small>Enable "Force re-upload" below to upload anyway.</small>
            </div>
            <!-- Always visible summary -->
            <div class="d-flex mx-1 align-items-center">
                <div class="lead fs-5">{{ fileCount }} | {{fancyBytes(totalSize)}}</div>
                <button class="btn btn-sm btn-outline-secondary ms-auto" @click="showFileDetails = !showFileDetails">
                    {{ showFileDetails ? 'Hide Details' : 'Show Details' }}
                    <i :class="['fa-solid', showFileDetails ? 'fa-chevron-up' : 'fa-chevron-down']" class="fa-fw"></i>
                </button>
            </div>

            <!-- Combined progress bar (always visible during upload) -->
            <div v-if="isUploading" class="mt-3 mb-2">
                <div class="d-flex align-items-center mb-1">
                    <span class="me-2">Overall Upload Progress:</span>
                    <span class="ms-auto">{{Math.round(combinedProgress)}}%</span>
                </div>
                <div class="progress" role="progressbar" aria-label="Combined upload progress">
                    <div class="progress-bar" :style="'width: ' + combinedProgress + '%'"></div>
                </div>
                <div class="text-center mt-1 small text-muted">
                    {{uploadedCount}}/{{totalUploadCount}} files complete
                </div>
            </div>

            <!-- Collapsible file details section -->
            <div v-show="showFileDetails" class="mt-2 border-top pt-2">
                <div id="listOfImgs" v-if="!encryption.encrypted" v-for="(file, key, index) in mainFiles"
                    class="rounded">
                    <div class="card mt-3">
                        <div class="d-flex flex-wrap align-items-center px-2 py-1">
                            <div>
                                <div class="fs-4 fw-light m-0 text-break"><span
                                        class="px-2 py-1 me-2 border border-light text-white rounded-pill"><i
                                            class="fa-solid fa-lock-open fa-fw"></i></span>{{file.name}}</div>
                            </div>
                            <div class="flex-grow-1 mx-5" >
                             <!--v-if="getFileActions(file.name).cancel"-->
                                <div class="progress" role="progressbar" aria-label="Upload progress" aria-valuenow="25"
                                    aria-valuemin="0" aria-valuemax="100">
                                    <div class="progress-bar"
                                        :style="'width: ' + getFileProgress(file.name) + '%'">
                                        {{Math.round(getFileProgress(file.name))}}%
                                    </div>
                                </div>
                            </div>
                            <div class="flex-shrink" v-if="File.length && getFileData(file.name)">
                                <button type="button" class="me-2 btn btn-secondary"
                                    v-if="getFileActions(file.name).pause"
                                    @click="fileRequest[FileInfo[file.name].index] && fileRequest[FileInfo[file.name].index].resumeFileUpload()">Pause</button>
                                <button type="button" class="me-2 btn btn-secondary"
                                    v-if="getFileActions(file.name).resume"
                                    @click="fileRequest[FileInfo[file.name].index] && fileRequest[FileInfo[file.name].index].resumeFileUpload()">Resume</button>
                                <button type="button" class="me-2 btn btn-secondary"
                                    v-if="getFileActions(file.name).cancel"
                                    @click="fileRequest[FileInfo[file.name].index] && fileRequest[FileInfo[file.name].index].resumeFileUpload()">Cancel</button>
                            </div>
                            <div class="ms-auto my-1">
                                <button class="btn btn-danger" @click="deleteImg(FileInfo[file.name].index, file.name)"
                                    data-toggle="tooltip" data-placement="top" title="Delete Asset"><i
                                        class="fas fa-fw fa-trash-alt"></i></button>
                            </div>
                        </div>

                        <div class="d-flex flex-wrap align-items-center px-2 py-2 mb-1 rounded-bottom">
                            <div class="flex-grow-1">

                                <div class="d-flex flex-wrap justify-content-around">

                                    <div class="d-flex flex-column justify-content-center py-2 rounded" style="background-color:rgba(0,0,0,0.3); min-width:350px;">

                                        <div class="d-flex align-items-center px-2 py-1" v-if="FileInfo['thumb' + file.name]" >
                                            <div class="me-auto fs-5 text-wrap">
                                              Automatic Thumbnail
                                              <span class="small d-none">({{fancyBytes(FileInfo['thumb' + file.name].size)}})</span>
                                            </div>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input fs-4" @click="resetThumb(file.name)" type="checkbox"
                                                    role="switch" :id="'includeThumb' + file.name" :checked="FileInfo['thumb' + file.name].use_thumb">
                                                <label class="form-check-label" :for="'includeThumb' + file.name"></label>
                                            </div>
                                        </div>
                                        
                                        <div class="mx-auto my-auto"
                                            v-if="FileInfo['thumb' + file.name] && FileInfo['thumb' + file.name].use_thumb">
                                            <img :src="FileInfo['thumb' + file.name].fileContent"
                                                class="img-thumbnail"></img>
                                        </div>
                                        <div class="img-thumbnail mx-auto my-auto"
                                            v-if="!FileInfo['thumb' + file.name] || !FileInfo['thumb' + file.name].use_thumb">
                                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
                                                xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                                                viewBox="0 0 800 800"
                                                style="enable-background:new 0 0 800 800; background-color: #fff; width: 128px; border-radius: .25em;"
                                                xml:space="preserve">

                                                    <g>
                                                        <path class="st0" d="M650,210H500c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10s10,4.5,10,10v140h140c5.5,0,10,4.5,10,10
                                                          S655.5,210,650,210z" />
                                                        <path class="st0" d="M650,309.7c-5.5,0-10-4.5-10-10v-95.5L495.9,60H200c-22.1,0-40,17.9-40,40v196.3c0,5.5-4.5,10-10,10
                                                          s-10-4.5-10-10V100c0-33.1,26.9-60,60-60h300c2.7,0,5.2,1,7.1,2.9l150,150c1.9,1.9,2.9,4.4,2.9,7.1v99.7
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
                                                            style="text-transform: uppercase; font-size: 149px;">{{FileInfo[file.name].meta.ext}}</text>
                                                    </g>
                                                </svg>
                                        </div>

                                       
                                        <span class="fs-4 mx-auto"> {{ FileInfo['thumb' + file.name] && FileInfo['thumb' + file.name].use_thumb ? fancyBytes(FileInfo['thumb' + file.name].size + FileInfo[file.name].size) : fancyBytes(FileInfo[file.name].size)}} </span>

                                        <!-- link -->
                                        <div class="mx-2">
                                            <a :href="'https://ipfs.dlux.io/ipfs/' + FileInfo[file.name].hash"
                                                target="_blank" class="w-100 btn btn-sm btn-primary mb-1 mx-auto"><span
                                                    class="d-flex align-items-center">URL<i
                                                        class="ms-auto fa-solid fa-fw fa-up-right-from-square"></i></span></a>
                                        </div>
                                    </div>

                                    <div class="d-flex flex-column">

                                        <div class="mb-1">
                                            <label class="mb-1">File Name</label>
                                            <div class="input-group">
                                                <input autocapitalize="off" placeholder="File Name"
                                                    pattern="[a-zA-Z0-9]{3,25}" class="form-control bg-dark border-0 text-info"
                                                    v-model="FileInfo[file.name].meta.name">
                                                <span class="input-group-text">.</span>
                                                <input autocapitalize="off" placeholder="File Type"
                                                    pattern="[a-zA-Z0-9]{1,4}" class="form-control bg-dark border-0 text-info"
                                                    v-model="FileInfo[file.name].meta.ext">
                                            </div>
                                        </div>
                                        <div class="mb-1">
                                            <label class="mb-1">Thumbnail</label>
                                            <div v-if="FileInfo['thumb' + file.name]"
                                                class="position-relative has-validation">
                                                <input autocapitalize="off"
                                                    :disabled="FileInfo['thumb' + file.name].use_thumb"
                                                    placeholder="https://your-thumbnail-image.png"
                                                    pattern="https://.*|Qm[a-zA-Z0-9]+"
                                                    class="form-control disabled bg-dark border-0" v-model="FileInfo[file.name].meta.thumb">
                                            </div>
                                            <div v-if="!FileInfo['thumb' + file.name]"
                                                class="position-relative has-validation">
                                                <input autocapitalize="off" placeholder="https://your-thumbnail-image.png"
                                                    pattern="https://.*|Qm[a-zA-Z0-9]+"
                                                    class="form-control disabled" v-model="FileInfo[file.name].meta.thumb">
                                            </div>
                                        </div>

                                        <!-- choices-js-->
                                        <div class="mb-1">
                                            <label class="mb-1">Tags</label>
                                            <choices-vue :ref="file.name +'select-tag'" prop_type="tags"
                                                :reference="file.name +'select-tag'"
                                                @data="handleTag(file.name, $event)"></choices-vue>
                                        </div>
                                        <div class="mb-1">
                                            <label class="mb-1">License <a
                                                    href="https://creativecommons.org/share-your-work/cclicenses/"
                                                    target="_blank"><i class="fa-solid fa-section"></i></a></label>
                                            <choices-vue :ref="file.name +'license-tag'" prop_type="license"
                                                :reference="file.name +'license-tag'"
                                                @data="handleLic(file.name, $event)"></choices-vue>
                                        </div>
                                        <div class="mb-1">
                                            <label class="mb-1">Labels</label>
                                            <choices-vue :ref="file.name +'select-label'" prop_type="labels"
                                                :reference="file.name +'select-label'"
                                                @data="handleLabel(file.name, $event)"></choices-vue>
                                        </div>

                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>
                    <div class="d-flex flex-column text-end d-none" v-if="FileInfo['thumb' + file.name]">
                        <div class="small text-muted">File: {{FileInfo[file.name].hash}}</div>
                        <div class="small text-muted text-break">Thumbnail: {{FileInfo['thumb' + file.name].hash}}</div>
                    </div>
                </div>
            </div>
            
            <!-- Auxiliary Files Section -->
            <div v-if="auxiliaryFiles.length > 0" class="mt-3">
                <div class="d-flex align-items-center">
                    <div class="lead fs-6">
                        <i class="fa-solid fa-file-circle-plus fa-fw me-1"></i>
                        Supporting Files ({{auxiliaryFiles.length}})
                    </div>
                    <button class="btn btn-sm btn-outline-secondary ms-auto" @click="showAuxiliaryFiles = !showAuxiliaryFiles">
                        {{ showAuxiliaryFiles ? 'Hide' : 'Show' }}
                        <i :class="['fa-solid', showAuxiliaryFiles ? 'fa-chevron-up' : 'fa-chevron-down']" class="fa-fw"></i>
                    </button>
                </div>
                <div v-show="showAuxiliaryFiles" class="mt-2">
                    <p class="text-muted small mb-2">
                        These files are automatically generated to support your main files (video segments, thumbnails, etc.) and will be uploaded together.
                    </p>
                    <div class="list-group">
                        <div v-for="(auxFile, index) in auxiliaryFiles" :key="auxFile.hash || index" 
                             class="list-group-item bg-dark border-secondary">
                            <div class="d-flex align-items-center">
                                <div class="flex-grow-1">
                                    <div class="small">
                                        <span class="badge bg-secondary me-2">{{auxFile.role || 'auxiliary'}}</span>
                                        {{auxFile.name}}
                                    </div>
                                    <div class="text-muted" style="font-size: 0.8rem;">
                                        {{fancyBytes(auxFile.size)}} • CID: {{auxFile.hash ? auxFile.hash.substring(0, 8) + '...' : 'pending'}}
                                    </div>
                                </div>
                                <div v-if="auxFile.progress !== undefined" class="ms-3" style="width: 100px;">
                                    <div class="progress" style="height: 5px;">
                                        <div class="progress-bar" :style="'width: ' + (auxFile.progress || 0) + '%'"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="listOfEncs" v-if="encryption.encrypted" v-for="(file, key, index) in Object.values(FileInfo).filter(file => !file.is_thumb)" class="rounded">
                <div class="card mt-3">
                    <div class="d-flex flex-wrap align-items-center px-2 py-1">
                        <div>
                            <h6 class="m-0 text-break"><span class="px-2 py-1 me-2 bg-darkg rounded"><i
                                        class="fa-solid fa-lock fa-fw"></i></span>{{file.name}}</h6>
                        </div>
                        <div class="flex-grow-1 mx-5" v-if="getEncryptedFileActions(file.name).cancel">
                            <div class="progress" role="progressbar" aria-label="Upload progress" aria-valuenow="25"
                                aria-valuemin="0" aria-valuemax="100">
                                <div class="progress-bar"
                                    :style="'width: ' + getEncryptedFileProgress(file.name) + '%'">
                                    {{Math.round(getEncryptedFileProgress(file.name))}}%
                                </div>
                            </div>
                        </div>
                        <div class="flex-shrink" v-if="File.length && getEncryptedFileData(file.name)">
                            <button type="button" class="me-2 btn btn-secondary"
                                v-if="getEncryptedFileActions(file.name).pause"
                                @click="fileRequest[FileInfo[file.name].enc_index] && fileRequest[FileInfo[file.name].enc_index].resumeFileUpload()">Pause</button>
                            <button type="button" class="me-2 btn btn-secondary"
                                v-if="getEncryptedFileActions(file.name).resume"
                                @click="fileRequest[FileInfo[file.name].enc_index] && fileRequest[FileInfo[file.name].enc_index].resumeFileUpload()">Resume</button>
                            <button type="button" class="me-2 btn btn-secondary"
                                v-if="getEncryptedFileActions(file.name).cancel"
                                @click="fileRequest[FileInfo[file.name].enc_index] && fileRequest[FileInfo[file.name].enc_index].resumeFileUpload()">Cancel</button>
                        </div>
                        <div class="ms-auto">
                            <button class="btn btn-danger" @click="deleteImg(FileInfo[file.name].enc_index, file.name)"
                                data-toggle="tooltip" data-placement="top" title="Delete Asset"><i
                                    class="fas fa-fw fa-trash-alt"></i></button>
                        </div>
                    </div>
                    <div class="d-flex flex-column justify-content-center w-100 px-2 py-1" v-if="FileInfo[file.name]">

                        <div class="">Bytes: {{fancyBytes(FileInfo[file.name].enc_size)}}</div>
                        <div class="text-break">CID:
                            {{FileInfo[file.name].enc_hash}}</div>
                        <div class="">Status:
                            {{FileInfo[file.name].status}}
                        </div>
                        <div class="my-2"><a :href="'https://ipfs.dlux.io/ipfs/' + FileInfo[file.name].enc_hash"
                                target="_blank" class="btn btn-primary">Copy URL<i
                                    class="fa-solid fa-up-right-from-square fa-fw ms-1"></i></a>
                        </div>

                    </div>
                </div>
            </div>

        </div>







        <!-- encryption banner -->
        <div v-if="type != 'video'" class="card card-body d-flex align-items-center my-3">
            <div class="d-flex flex-column w-100 flex-grow-1">

                <!-- bubble preview -->
                <div class="d-flex justify-content-center flex-wrap fs-3 fw-lighter mb-3">
                    <div class="d-flex align-items-center px-3 py-1 m-1 rounded-pill border border-white">
                        <div> Privacy </div>
                        <span v-if="!encryption.encrypted"><i class="mx-2 fa-solid fa-fw fa-lock-open"></i></span>
                        <span v-if="encryption.encrypted"><i class="mx-2 fa-solid fa-fw fa-lock"></i></span>
                        <div>
                            <span v-if="!encryption.encrypted" class="fw-bold">Public</span>
                            <span v-if="encryption.encrypted" class="fw-bold">Private</span>
                        </div>
                    </div>
                </div>

                <!-- encrypt switch -->
                <div v-if="contract.c == 1"
                    class="flex-grow-1 border-top border-bottom border-light border-1 py-2 mb-2">
                    <div class="form-check form-switch d-flex align-items-center ps-0 mt-2 mb-3">
                        <label class="form-check-label mb-0" for="encryptCheck">ENCRYPT FILES</label>
                        <input class="form-check-input fs-2 ms-auto mt-0" type="checkbox" role="switch"
                            id="encryptCheck" v-model="encryption.encrypted">
                    </div>

                    <div v-if="!encryption.encrypted" class="mb-2">Files uploaded to this contract will not be
                        encrypted, <b>they will be publicly available on SPK Network</b></div>
                    <div v-if="encryption.encrypted" class="mb-2">Files uploaded to this contract will be encrypted,
                        <b>only the accounts you add will have access. File and Folder names are public!</b>
                    </div>


                </div>


                <!-- encrypted sharing -->
                <div v-if="encryption.encrypted">
                    <div class="fs-3 fw-lighter">Sharing:</div>
                    <p>You can share the decryption key with a few other accounts to view the files, and you can
                        revoke
                        access at any time.</p>
                    <div class="d-flex mb-2">
                        <div class="me-1 flex-grow-1">
                            <div class="position-relative has-validation">
                                <input autocapitalize="off" placeholder="username"
                                    class="form-control border-light bg-darkg text-info" v-model="encryption.input"
                                    @blur="addUser()" @keyup.enter="addUser(contract.i)">
                            </div>
                        </div>
                        <div class="ms-1">
                            <div class="btn btn-lg btn-light" @click="addUser()"><i class="fa-solid fa-fw fa-plus"></i>
                            </div>
                        </div>
                    </div>
                    <!-- shared accounts -->
                    <div class="d-flex flex-row flex-wrap">
                        <div v-for="(a,b,c) in encryption.accounts"
                            class="rounded text-black filter-bubble bg-white me-1 mb-1 d-flex align-items-center">
                            <!-- warning class for unencrypted keys -->
                            <i class="fa-solid fa-key fa-fw me-1"
                                :class="{'text-primary': encryption.accounts[b].enc_key, 'text-warning': !encryption.accounts[b].enc_key}"></i>
                            <span>{{b}}</span>
                            <div v-if="b != contract.t"><button type="button"
                                    class="ms-1 btn-close small btn-close-white" @click="delUser(b)"></button></div>
                        </div>
                    </div>
                    <!-- update button -->
                    <div class="d-flex mt-3">
                        <button v-if="unkeyed" @click="checkHive()" class="mx-auto btn btn-lg btn-outline-warning"><i
                                class="fa-solid fa-fw fa-user-lock me-2"></i>Encrypt Keys</button>
                    </div>
                </div>
                <!-- Force re-upload option -->
                <div class="d-flex justify-content-center mb-2" v-if="contract.c == 1 && duplicateFiles.length > 0">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" v-model="allowDuplicates" id="forceReuploadCheck">
                        <label class="form-check-label text-warning" for="forceReuploadCheck">
                            <i class="fa-solid fa-exclamation-triangle fa-fw me-1"></i>
                            Force re-upload ({{duplicateFiles.length}} file{{duplicateFiles.length > 1 ? 's' : ''}} already exist)
                        </label>
                    </div>
                </div>
                <div class="d-flex mb-1" v-if="contract.c == 1">
                    <button class="ms-auto me-auto mt-2 btn btn-lg" 
                        :class="[
                            thumbnailsGenerating > 0 ? 'btn-secondary' : 'btn-info',
                            (!reallyReady || !filesReady || thumbnailsGenerating > 0) ? 'disabled' : ''
                        ]"
                        :disabled="(!reallyReady || !filesReady || thumbnailsGenerating > 0)" 
                        @click="signNUpload()">
                        <i :class="['fa-solid', 'fa-fw', 'me-2', thumbnailsGenerating > 0 ? 'fa-spinner fa-spin' : 'fa-file-signature']"></i>
                        <span v-if="thumbnailsGenerating > 0">Generating Thumbnails...</span>
                        <span v-else>Sign and Upload</span>
                    </button>
                </div>
            </div>
        </div>
        <!-- end encryption banner -->
    </div>
    </Transition>
   `,
  props: {
    type: {
      default: 'files'
    },
    user: {
      type: Object,
      default: function () {
        return {}
      }
    },
    propcontract: {
      type: Object,
      default: function () {
        return {
          id: '',
          api: ''
        }
      }
    },
    propStructuredFiles: {
      type: Array,
      default: () => []
    },
    dataurls: {
      type: Object,
      default: function () {
        return []
    }
  },
},
  watch: {
    dataurls(old, n) {
      for(var i = 0; i < n.length; i++){
        if(old.length < (i - 1))this.addDataURL(n[i][1], n[i][0], n[i][2])
      }
    },
    thumbnailsGenerating(newVal, oldVal) {
      debugLogger.debug(`Thumbnails generating: ${oldVal} -> ${newVal}`);
      // When all thumbnails are done generating, try linking playlist posters
      if (oldVal > 0 && newVal === 0) {
        debugLogger.debug('All thumbnails generated, calling linkPlaylistPosters');
        this.linkPlaylistPosters();
      }
    },
    FileInfo: {
      deep: true,
      handler() {
        // Debounce to avoid calling too frequently
        if (this.fileInfoDebounce) {
          clearTimeout(this.fileInfoDebounce);
        }
        this.fileInfoDebounce = setTimeout(() => {
          // Call linkPlaylistPosters whenever FileInfo changes
          this.linkPlaylistPosters();
        }, 100);
      }
    },
    propStructuredFiles: {
      immediate: true,
      deep: true,
      async handler(newFilesArray) {
        if (Array.isArray(newFilesArray) && newFilesArray.length > 0) {
          debugLogger.debug('propStructuredFiles watcher received:', newFilesArray);
          debugLogger.debug('First item structure:', newFilesArray[0]);
          
          // 1. Consolidate newFilesArray to pick the best fullAppPath for identical files
          const consolidatedNewFiles = [];
          const seenFiles = new Map(); // Key: name_size, Value: index in consolidatedNewFiles

          const isNewPathBetter = (newP, oldP) => {
            if (typeof newP !== 'string' && typeof oldP === 'string') return false; // Old exists as string, new is not: old is better
            if (typeof newP === 'string' && typeof oldP !== 'string') return true;  // New exists as string, old is not: new is better
            if (typeof newP !== 'string' && typeof oldP !== 'string') return false; // Neither is a string: no change preference

            // Both newP and oldP are strings
            const newHasSlash = newP.includes('/');
            const oldHasSlash = oldP.includes('/');

            if (newHasSlash && !oldHasSlash) return true; // New has dir, old doesn't
            if (!newHasSlash && oldHasSlash) return false; // Old has dir, new doesn't

            // Both have slashes or neither has slashes
            return newP.length > oldP.length; // Prefer longer path
          };

          newFilesArray.forEach(newItem => {
            // Handle both raw File objects and structured objects
            let file, itemPath, metadata;
            
            if (newItem instanceof File) {
                // Raw File object - wrap it
                file = newItem;
                itemPath = null;
                metadata = {};
            } else if (newItem && newItem.file) {
                // Structured object
                file = newItem.file;
                itemPath = newItem.fullAppPath || newItem.targetPath || null;
                metadata = newItem.metadata || {};
            } else {
                debugLogger.warn('Skipping malformed item in propStructuredFiles:', newItem);
                return;
            }
            
            if (typeof file.name !== 'string' || typeof file.size !== 'number') {
                debugLogger.warn('Skipping item with invalid file properties:', file);
                return;
            }
            
            const fileKey = `${file.name}_${file.size}`;
            // Prefer fullAppPath, fallback to targetPath, then to null if neither exists
            const newItemPath = itemPath;


            if (seenFiles.has(fileKey)) {
              const existingItemIndex = seenFiles.get(fileKey);
              const existingItem = consolidatedNewFiles[existingItemIndex];
              // Prefer fullAppPath, fallback to targetPath, then to null for existing item path
              const existingItemPath = existingItem.fullAppPath || existingItem.targetPath || null;
              const existingMetadata = existingItem.metadata || {};

              if (isNewPathBetter(newItemPath, existingItemPath)) {
                // Create properly structured object
                const structuredItem = newItem instanceof File ? 
                    { file: file, fullAppPath: newItemPath, targetPath: null, metadata: metadata } : 
                    { ...newItem, fullAppPath: newItemPath, metadata: metadata };
                consolidatedNewFiles[existingItemIndex] = structuredItem;
                debugLogger.debug(`Consolidated file ${file.name}: using new path '${newItemPath}' over '${existingItemPath}'`);
              } else if (metadata && Object.keys(metadata).length > 0 && Object.keys(existingMetadata).length === 0) {
                // Even if the path isn't better, if the new item has metadata and the existing doesn't, update the metadata
                consolidatedNewFiles[existingItemIndex] = { ...existingItem, metadata: metadata };
                debugLogger.debug(`Updated metadata for ${file.name}: added missing metadata`);
              }
            } else {
              seenFiles.set(fileKey, consolidatedNewFiles.length);
              // Create properly structured object
              const structuredItem = newItem instanceof File ? 
                  { file: file, fullAppPath: newItemPath, targetPath: null, metadata: metadata } : 
                  { ...newItem, fullAppPath: newItemPath, metadata: metadata };
              consolidatedNewFiles.push(structuredItem);
              
              // Debug log to check metadata
              debugLogger.debug(`Structured item ${file.name} metadata check:`, {
                  hasMetadata: !!structuredItem.metadata,
                  metadata: structuredItem.metadata,
                  structuredItem: structuredItem
              });
            }
          });
          
          // 2. Filter consolidated files against existing this.File
          const filesToAdd = consolidatedNewFiles.filter(newItem => 
              !this.File.some(existingFile => 
                  existingFile.name === newItem.file.name && existingFile.size === newItem.file.size
              )
          );

          if (filesToAdd.length > 0) {
              debugLogger.debug('Adding new (consolidated) files:', filesToAdd);
              debugLogger.debug('Files with metadata check:', filesToAdd.map(f => ({
                  name: f.file.name,
                  hasMetadata: !!f.metadata,
                  metadata: f.metadata
              })));
              const processingPromises = [];
              filesToAdd.forEach(item => {
                  // item.fullAppPath should be the best available path after consolidation
                  debugLogger.debug(`Adding file ${item.file.name} with path: ${item.fullAppPath}`); 
                  
                  // Attach metadata to the file object before processing
                  const fileWithMetadata = item.file;
                  if (item.metadata) {
                      debugLogger.debug(`Raw metadata for ${item.file.name}:`, item.metadata);
                      debugLogger.debug(`Metadata keys:`, Object.keys(item.metadata));
                      fileWithMetadata._isAuxiliary = item.metadata.isAuxiliary;
                      fileWithMetadata._role = item.metadata.role;
                      fileWithMetadata._parentFile = item.metadata.parentFile;
                      fileWithMetadata._processorId = item.metadata.processorId;
                      
                      debugLogger.debug(`Metadata attached to ${item.file.name}:`, {
                          isAuxiliary: fileWithMetadata._isAuxiliary,
                          role: fileWithMetadata._role,
                          parentFile: fileWithMetadata._parentFile
                      });
                  }
                  
                  processingPromises.push(this.processSingleFile(fileWithMetadata, item.fullAppPath)); 
              });
              
              try {
                await Promise.all(processingPromises);
                debugLogger.debug('All files processed from prop update.');
                
                // Link m3u8 files with their poster thumbnails after a delay
                // to ensure all poster files have their hashes calculated
                setTimeout(() => {
                    this.linkPlaylistPosters();
                }, 500);
                
                this.ready = true;
              } catch (error) {
                console.error("Error processing files from props:", error);
                this.ready = false;
              }
          } else {
              debugLogger.debug('No new files to add from prop update (after consolidation).');
              if(this.File.length > 0 && !this.ready) {
                if (Object.keys(this.FileInfo).length > 0) this.ready = true;
              }
          }
        } else {
            debugLogger.debug('propStructuredFiles updated to empty or non-array:', newFilesArray);
        }
      }
    }
    // Removed allowDuplicates watcher to prevent infinite loop
  },
  data() {
    return {
      files: {},
      fetching: false,
      contract: {
        id: '',
        api: ''
      },
      encryption: {
        input: '',
        key: '',
        encrypted: false,
        accounts: {},
      },
      fileRequests: {},
      FileInfo: {},
      FileInfoByCID: {},
      File: [],
      ready: false,
      deletable: true,
      showFileDetails: false,
      showAuxiliaryFiles: false,
      uploadInProgress: false,
      fileProgress: {}, // Tracks progress for each file by CID
      completedFiles: 0,
      thumbnailsGenerating: 0, // Count of thumbnails currently being generated
      allowDuplicates: false, // Allow uploading files even if they exist
      duplicateFiles: [], // Track files that were detected as duplicates
    };
  },
  emits: ["tosign", "done"],
  methods: {
    ...MCommon,
    ...Mspk,
    // Safe getter for file data to prevent undefined errors
    getFileData(fileName) {
      if (!this.FileInfo[fileName] || this.FileInfo[fileName].index === undefined) {
        return null;
      }
      const index = this.FileInfo[fileName].index;
      return this.File[index] || null;
    },
    
    // Safe getter for file actions
    getFileActions(fileName) {
      const fileData = this.getFileData(fileName);
      return fileData?.actions || {};
    },
    
    // Safe getter for file progress
    getFileProgress(fileName) {
      const fileData = this.getFileData(fileName);
      return fileData?.progress || 0;
    },
    
    // Safe getter for encrypted file data
    getEncryptedFileData(fileName) {
      if (!this.FileInfo[fileName] || this.FileInfo[fileName].enc_index === undefined) {
        return null;
      }
      const index = this.FileInfo[fileName].enc_index;
      return this.File[index] || null;
    },
    
    // Safe getter for encrypted file actions
    getEncryptedFileActions(fileName) {
      const fileData = this.getEncryptedFileData(fileName);
      return fileData?.actions || {};
    },
    
    // Safe getter for encrypted file progress
    getEncryptedFileProgress(fileName) {
      const fileData = this.getEncryptedFileData(fileName);
      return fileData?.progress || 0;
    },
    
    pollBundleStatus(contractID, since = 0) {
      const contractInstanceId = contractID; 

      if (!contractInstanceId) {
          console.error("Cannot poll bundle status: uploader account name or contract instance ID is missing.", 
                        { contractInstanceId });
          // Retry, as these might be set asynchronously or if there's a temporary issue.
          setTimeout(() => this.pollBundleStatus(), 5000);
          return;
      }

      debugLogger.debug(`Polling for bundle status. Expecting contract pattern::<number>:${contractInstanceId} bundled`);
      var lastSince = since
      fetch('https://spktest.dlux.io/feed' + (since ? `/${since}` : ''))
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const feed = data.feed;
          let foundAndBundled = false;
          if (feed && typeof feed === 'object') {
            for (const feedEntryKey in feed) {
              lastSince = feedEntryKey.split(':')[0];
              const feedEntryValue = feed[feedEntryKey];
              if (typeof feedEntryValue === contractID + ' bundled') {
                foundAndBundled = true;
              }
            }
          }

          if (foundAndBundled) {
            this.uploadInProgress = false;
            this.$emit('done', contractID);
          } else {
            debugLogger.debug(`Bundle not yet complete for contract ${contractInstanceId}. Retrying in 5s...`);
            setTimeout(() => this.pollBundleStatus(contractID, lastSince), 5000);
          }
        })
        .catch(error => {
          console.error('Error polling bundle status:', error);
          setTimeout(() => this.pollBundleStatus(contractID,lastSince), 5000); 
        });
    },
    processSingleFile(file, fullAppPath = null) {
        return new Promise((resolveProcess, rejectProcess) => { 
            // Removed local duplicate check - let the network CID check handle duplicates
            
            // Security check: skip hidden files (starting with .)
            if (file.name.startsWith('.')) {
                debugLogger.info(`Skipping hidden file for security: ${file.name}`);
                resolveProcess();
                return;
            }

            file.progress = 0;
            file.actions = { cancel: false, pause: false, resume: false };
            const fileIndex = this.File.length;
            this.File.push(file);

            var reader = new FileReader();
            reader.File = file;
            // Make sure we use the full path, not just the filename
            const actualPath = fullAppPath || file.name;
            reader.fullAppPath = actualPath;
            debugLogger.debug(`Processing file: ${file.name} with fullAppPath: ${actualPath} (original input: ${fullAppPath})`);

            reader.onload = (event) => {
                const target = event.currentTarget || event.target;
                const fileContent = target.result;
                const currentFile = target.File;
                const pathForFile = target.fullAppPath;
                const indexForFile = this.File.findIndex(f => f === currentFile);

                if (indexForFile === -1) {
                    console.error("Could not find file in array after reader load:", currentFile.name);
                    rejectProcess("File not found after load");
                    return;
                }
                
                debugLogger.debug(`File ${currentFile.name} loaded with path: ${pathForFile}`);
                
                // Check if file already has a CID assigned (e.g., from video transcoding)
                let hashPromise;
                if (currentFile.cid) {
                    debugLogger.debug(`Using pre-calculated CID for ${currentFile.name}: ${currentFile.cid}`);
                    // Create a fake promise that returns the pre-calculated CID in the expected format
                    hashPromise = Promise.resolve({
                        hash: currentFile.cid,
                        opts: { index: indexForFile, path: pathForFile, originalFile: currentFile }
                    });
                } else {
                    // Calculate CID normally
                    hashPromise = this.hashOf(buffer.Buffer(fileContent), { index: indexForFile, path: pathForFile, originalFile: currentFile });
                }
                
                hashPromise.then((ret) => {
                    const dict = { 
                        hash: ret.hash, 
                        index: ret.opts.index, 
                        size: ret.opts.originalFile.size, 
                        name: ret.opts.originalFile.name, 
                        fullAppPath: ret.opts.path,
                        progress: 0, 
                        status: 'Pending Signature' 
                    };
                    
                    // Skip duplicate check for M3U8 and TS files (video segments)
                    const isVideoSegment = dict.name.toLowerCase().endsWith('.m3u8') || dict.name.toLowerCase().endsWith('.ts');
                    
                    const duplicateCheckPromise = isVideoSegment || this.allowDuplicates
                        ? Promise.resolve({ result: "Not found" }) // Skip API check for video segments or if duplicates allowed
                        : fetch(`https://spktest.dlux.io/api/file/${ret.hash}`).then(r => r.json());
                    
                    duplicateCheckPromise.then(res => {
                        if (res.result == "Not found" || this.allowDuplicates) {
                            this.FileInfo[dict.name] = dict;
                            const names = dict.name.replaceAll(',', '-').split('.');
                            const ext = names.length > 1 ? names.pop() : '';
                            const name = names.join('.'); 
                            
                            // Check if this is a thumb file (ends with _thumb.ts or _thumb.m3u8)
                            const isThumbFile = dict.name.endsWith('_thumb.ts') || dict.name.endsWith('_thumb.m3u8');
                            
                            // Check if this is an auxiliary file from processor (segments, posters, etc)
                            const isAuxiliaryFile = currentFile._isAuxiliary === true;
                            const fileRole = currentFile._role || '';
                            
                            debugLogger.debug(`File ${dict.name} metadata check:`, {
                                _isAuxiliary: currentFile._isAuxiliary,
                                _role: currentFile._role,
                                isAuxiliaryFile,
                                fileRole
                            });
                            
                            // Determine if file should be hidden (flag 2)
                            const shouldHide = isThumbFile || isAuxiliaryFile;
                            
                            this.FileInfo[dict.name].meta = {
                                name: shouldHide ? '' : name, // No name for hidden files
                                ext: shouldHide ? '' : ext,   // No type for hidden files  
                                flag: shouldHide ? "2" : "",  // Flag 2 for hidden files
                                labels: "",
                                thumb: "",
                                license: "",
                                fullAppPath: dict.fullAppPath,
                                role: fileRole // Store role for later reference
                            };
                            
                            // Mark as thumb/auxiliary file for special handling
                            if (isThumbFile) {
                                this.FileInfo[dict.name].is_thumb = true;
                                this.FileInfo[dict.name].use_thumb = true;
                                debugLogger.debug(`Processed thumb file: ${dict.name} with flag 2`);
                            }
                            
                            if (isAuxiliaryFile) {
                                this.FileInfo[dict.name].is_auxiliary = true;
                                this.FileInfo[dict.name].role = fileRole;
                                debugLogger.debug(`Processed auxiliary file: ${dict.name} (role: ${fileRole}) with flag 2`);
                            } else if (fileRole) {
                                // Set role for non-auxiliary files too (like playlists)
                                this.FileInfo[dict.name].role = fileRole;
                                debugLogger.debug(`Set role ${fileRole} for file: ${dict.name}`);
                            }
                            debugLogger.debug(`FileInfo entry created for ${dict.name} with path: ${dict.fullAppPath}`);

                            const currentIndex = this.File.findIndex(f => f === ret.opts.originalFile);
                            if(currentIndex !== -1) dict.index = currentIndex;
                            else debugLogger.warn("File index mismatch after hash check");

                            this.encryptFileAndPlace(dict);
                            
                            // Handle thumbnail generation
                            debugLogger.debug(`Thumbnail handling for ${dict.name}:`, {
                                fileRole,
                                isVideo: fileRole === 'video',
                                isPlaylist: fileRole === 'playlist',
                                isAuxiliaryFile
                            });
                            
                            if (fileRole === 'playlist') {
                                // For m3u8 files, look for associated poster by naming convention
                                const baseName = dict.name.replace('.m3u8', '');
                                const posterName = `_${baseName}_poster.jpg`;
                                
                                // This will be done after all files are processed
                                debugLogger.debug(`📹 Will look for poster ${posterName} for playlist ${dict.name}`);
                            } else if (fileRole === 'video' || (!isAuxiliaryFile && !isThumbFile)) {
                                // Generate thumbnail for all files (images, videos, etc.)
                                debugLogger.debug(`Generating thumbnail for file: ${dict.name}`);
                                this.generateThumbnail(ret.opts.originalFile, dict.name);
                            } else {
                                debugLogger.debug(`Skipping thumbnail for auxiliary/thumb file: ${dict.name}`);
                            }
                            
                            resolveProcess();

                        } else {
                            // Enhanced error messaging - log instead of alert for batch uploads
                            debugLogger.info(`File "${ret.opts.originalFile.name}" appears to be already uploaded (CID: ${ret.hash})`);
                            
                            // Track duplicate files only if force upload is not enabled
                            if (!this.allowDuplicates) {
                                this.duplicateFiles.push({
                                    name: ret.opts.originalFile.name,
                                    cid: ret.hash,
                                    file: ret.opts.originalFile
                                });
                            }
                            
                            // Only show alert for non-video segment files
                            const isVideoSegment = ret.opts.originalFile.name.toLowerCase().endsWith('.m3u8') || 
                                                 ret.opts.originalFile.name.toLowerCase().endsWith('.ts');
                            
                            if (!isVideoSegment && !this.allowDuplicates) {
                                // For regular files, show more informative message with option to force upload
                                const forceUpload = confirm(
                                    `File "${ret.opts.originalFile.name}" appears to be already uploaded.\n\n` +
                                    `This file has the same content (CID: ${ret.hash.substring(0, 8)}...) as a file already on the network.\n\n` +
                                    `Do you want to force upload anyway?`
                                );
                                
                                if (forceUpload) {
                                    // Set flag and re-process the file
                                    this.allowDuplicates = true;
                                    this.processSingleFile(ret.opts.originalFile, dict.fullAppPath).then(() => {
                                        this.allowDuplicates = false; // Reset flag after processing
                                        resolveProcess();
                                    }).catch(err => {
                                        this.allowDuplicates = false; // Reset flag on error
                                        rejectProcess(err);
                                    });
                                    return; // Don't continue with normal flow
                                }
                            }
                            
                            const existingIndex = this.File.findIndex(f => f === ret.opts.originalFile);
                            if(existingIndex !== -1) this.File.splice(existingIndex, 1); 
                            resolveProcess();
                        }
                    }).catch(fetchError => {
                        console.error("Fetch error in processSingleFile:", fetchError);
                        rejectProcess(fetchError);
                    });
                }).catch(hashError => {
                     console.error("Hashing error in processSingleFile:", hashError);
                     rejectProcess(hashError);
                });
            };
            reader.onerror = (error) => {
                console.error("FileReader error:", error);
                rejectProcess(error); 
            };
            reader.readAsArrayBuffer(file);
        });
    },
    addUser() {
      if (this.encryption.input) {
        this.encryption.accounts[this.encryption.input] = {
          key: '',
          enc_key: '',
        }
        this.encryption.input = ''
      }
    },
    delUser(user) {
      delete this.encryption.accounts[user]
    },
    handleLabel(n, m) {
      if (m.action == 'added') {
        var string = this.FileInfo[n].meta.labels
        if (!string) string = '2'
        this.FileInfo[n].meta.labels += m.item
      } else {
        debugLogger.debug('remove', m.item)
        var string = this.FileInfo[n].meta.labels
        var arr = string.split('')
        for (var j = 1; j < arr.length; j++) {
          if (arr[j] == m.item) arr.splice(j, 1)
        }
        this.FileInfo[n].meta.labels = arr.join('')
      }
    },
    handleLic(n, m) {
      if (m.action == 'added') this.FileInfo[n].meta.license = m.item
      else this.FileInfo[n].meta.license = ''
    },
    handleTag(n, m) {
      var num = this.Base64toNumber(this.FileInfo[n].meta.flag) || 0
      if (m.action == 'added') {
        if (num & m.item) { }
        else num += m.item
        this.FileInfo[n].meta.flag = (this.NumberToBase64(num) || "0")
      } else {
        if (num & m.item) num -= m.item
        this.FileInfo[n].meta.flag = (this.NumberToBase64(num) || "0")
      }
    },
    checkHive() {
      return new Promise((resolve, reject) => {
        this.fetching = true
        var accounts = Object.keys(this.encryption.accounts)
        var newAccounts = []
        for (var i = 0; i < accounts.length; i++) {
          if (!this.encryption.accounts[accounts[i]]?.key) {
            newAccounts.push(accounts[i])
          }
        }

        if (newAccounts.length) fetch('https://hive-api.dlux.io', {
          method: 'POST',
          body: JSON.stringify({
            "jsonrpc": "2.0",
            "method": "condenser_api.get_accounts",
            "params": [newAccounts],
            "id": 1
          })
        }).then(response => response.json())
          .then(data => {
            this.fetching = false
            if (data.result) {
              for (var i = 0; i < data.result.length; i++) {
                if (data.result[i].id) {
                  this.encryption.accounts[data.result[i].name].key = data.result[i].memo_key
                }
              }
              this.encryptKeyToUsers()
              resolve(data.result)
            } else {
              reject(data.error)
            }
          })
          .catch(e => {
            this.fetching = false
          })
      })
    },
    encryptKeyToUsers(usernames) {
      return new Promise((resolve, reject) => {
        if (!usernames) usernames = Object.keys(this.encryption.accounts)
        var keys = []
        var dict = {}
        for (var i = 0; i < usernames.length; i++) {
          if (!this.encryption.accounts[usernames[i]].enc_key) keys.push(this.encryption.accounts[usernames[i]].key)
          dict[this.encryption.accounts[usernames[i]].key] = usernames[i]
        }
        const key = "#" + this.encryption.key;
        if (keys.length) hive_keychain.requestEncodeWithKeys(this.user.name, keys, key, 'Memo', (response) => {
          if (response.success) {
            for (var node in response.result) {
              this.encryption.accounts[dict[node]].enc_key = response.result[node]
            }
            resolve("OK")
          } else {
            reject(response.message);
          }
        });
        else resolve(null)
      })
    },
    decryptMessage(username = this.user.name, encryptedMessage) {
      return new Promise((resolve, reject) => {
        let encryptedKey = encryptedMessage.split("#")[1];
        let encryptedMessageOnly = encryptedMessage.split("#")[2];
        debugLogger.debug("Encrypted message: ", encryptedMessageOnly);
        hive_keychain.requestVerifyKey(username, '#' + encryptedKey, 'Memo', (response) => {
          if (response.success) {
            let key = response.result;
            this.encryption.key = key
            resolve(key)
          } else {
            reject(response.message);
          }
        });
      })
    },
    makeThumb(img) {
      return new Promise((resolve, reject) => {
        var originalImage = new Image();
        originalImage.src = img
        originalImage.addEventListener("load", function () {
          var thumbnailImage = createThumbnail();
          resolve(thumbnailImage);
        });
        function createThumbnail(image) {
          var canvas, ctx, thumbnail
          canvas = document.createElement('canvas');
          ctx = canvas.getContext('2d');
          canvas.width = 128
          canvas.height = 128
          ctx.drawImage(image, 0, 0, 128, 128);
          thumbnail = new Image();
          thumbnail.src = canvas.toDataURL('image/jpeg', 70);
          return thumbnail;
        }
      })
    },
    AESEncrypt(message, key = this.encryption.key) {
      if (typeof message != 'string') message = CryptoJS.lib.WordArray.create(message)
      return CryptoJS.AES.encrypt(message, key).toString()
    },
    AESDecrypt(encryptedMessage, key) {
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    },
    hashOf(buf, opts) {
      return new Promise((resolve, reject) => {
        Hash.of(buf, { unixfs: 'UnixFS' }).then(hash => {
          resolve({ hash, opts })
        })
      })
    },
    encryptFileAndPlace(fileInfo) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const fileContent = event.target.result;
          const encrypted = this.AESEncrypt(fileContent, this.encryption.key);
          var newFile = new File([encrypted], fileInfo.name, { type: fileInfo.type });
          newFile.progress = 0;
          newFile.status = 'Pending Signature';
          newFile.actions = {
            cancel: false,
            pause: false,
            resume: false,
          }
          const Reader = new FileReader();
          Reader.onload = (Event) => {
            const encFileContent = Event.target.result;
            const buf = buffer.Buffer(encFileContent)
            const size = buf.byteLength
            this.hashOf(buf, {}).then((ret) => {
              const newIndex = this.File.length
              this.FileInfo[fileInfo.name].enc_hash = ret.hash
              this.FileInfo[fileInfo.name].enc_index = newIndex
              this.FileInfo[fileInfo.name].enc_size = size
              this.File.push(newFile);
            })
            resolve(encrypted)
          }
          Reader.readAsArrayBuffer(newFile);
        };
        reader.readAsDataURL(this.File[fileInfo.index]);
      })
    },
    resetThumb(n) {
      this.FileInfo['thumb' + n].use_thumb = !this.FileInfo['thumb' + n].use_thumb
      this.FileInfo[n].meta.thumb = this.FileInfo['thumb' + n].use_thumb ? this.FileInfo[n].thumb : ''
    },
    addDataURL(url, name, type = "video/mp2t") {
      debugLogger.debug('addDataURL:', name)
      var newFile = new File(new blob([url]), name, { type });
      debugLogger.debug('newFile:', { newFile })
      newFile.progress = 0;
      newFile.status = 'Pending Signature';
      newFile.actions = {
        cancel: false,
        pause: false,
        resume: false,
      }
      const Reader = new FileReader()
      Reader.onload = (Event) => {
        const thumbFileContent = Event.target.result;
        const buf = buffer.Buffer(thumbFileContent)
        const size = buf.byteLength
        that.hashOf(buf, {}).then((ret) => {
          const newIndex = that.File.length
          const dict = { fileContent: new TextDecoder("utf-8").decode(thumbFileContent), hash: ret.hash, index: newIndex, size: buf.byteLength, name: 'thumb' + target.File.name, path: e.target.id, progress: 0, status: 'Pending Signature', is_thumb: true, use_thumb: true }
          that.FileInfo[target.File.name].thumb_index = newIndex
          that.FileInfo[target.File.name].thumb = ret.hash
          that.FileInfo['thumb' + target.File.name] = dict
          const names = dict.name.replaceAll(',', '-').split('.')
          const ext = names[names.length - 1]
          const name = names.slice(0, names.length - 1).join('.')
          that.FileInfo['thumb' + target.File.name].meta = {
            name,
            ext,
            flag: "2",
            labels: "",
            thumb: "",
            license: "",
          }
          that.FileInfo[target.File.name].meta.thumb = ret.hash
          that.File.push(newFile);

        })
      }
      Reader.readAsArrayBuffer(newFile);
  },
    async uploadFile(e) {
      const filesToProcess = e.target?.files || [];
      if (filesToProcess.length === 0) return;

      const processingPromises = [];
      for (let i = 0; i < filesToProcess.length; i++) {
          processingPromises.push(this.processSingleFile(filesToProcess[i]));
      }
      
      try {
        await Promise.all(processingPromises);
        debugLogger.debug('All files processed from upload.');
        this.ready = true;
      } catch (error) {
        console.error("Error processing files from upload:", error);
        this.ready = false;
      }
    },
    async dragFile(e) {
      e.preventDefault();
      const filesToProcess = e.dataTransfer?.files || [];
       if (filesToProcess.length === 0) return;

      // Check if we have DataTransferItemList with directories
      if (e.dataTransfer.items) {
        const items = e.dataTransfer.items;
        const entries = [];
        
        // Collect all entries first
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === 'file') {
            const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
            if (entry) {
              entries.push(entry);
            }
          }
        }
        
        // Process directories recursively
        if (entries.some(entry => entry && entry.isDirectory)) {
          debugLogger.debug("Processing dropped folders...");
          const allFiles = [];
          
          const processEntries = async (entries) => {
            const promises = entries.map(async (entry) => {
              if (entry.isDirectory) {
                // Skip hidden directories for security
                if (entry.name.startsWith('.')) {
                  debugLogger.info(`Skipping hidden directory for security: ${entry.name}`);
                  return [];
                }
                
                // Process directory contents
                const directoryReader = entry.createReader();
                return new Promise((resolve) => {
                  const readEntries = () => {
                    directoryReader.readEntries(async (entries) => {
                      if (entries.length > 0) {
                        const subFiles = await processEntries(entries);
                        readEntries(); // Continue reading if more entries
                        resolve(subFiles);
                      } else {
                        resolve([]); // No more entries
                      }
                    });
                  };
                  readEntries();
                });
              } else if (entry.isFile) {
                // Skip hidden files for security
                if (entry.name.startsWith('.')) {
                  debugLogger.debug(`Skipping hidden file for security: ${entry.name}`);
                  return [];
                }
                
                // Get file with full path
                return new Promise((resolve) => {
                  entry.file((file) => {
                    // Set fullPath property to preserve directory structure
                    file.fullPath = entry.fullPath.substring(1); // Remove leading slash
                    allFiles.push(file);
                    resolve([file]);
                  });
                });
              }
              return [];
            });
            
            const results = await Promise.all(promises);
            return results.flat();
          };
          
          await processEntries(entries);
          
          // Process all collected files with their paths
          const processingPromises = [];
          for (const file of allFiles) {
            processingPromises.push(this.processSingleFile(file, file.fullPath));
          }
          
          try {
            await Promise.all(processingPromises);
            debugLogger.debug('All files processed from folder drop.');
            this.ready = true;
          } catch (error) {
            console.error("Error processing files from folder drop:", error);
            this.ready = false;
          }
          
          return; // Skip regular file processing
        }
      }
      
      // Regular file processing for non-directory drops
      const processingPromises = [];
      for (var i = 0; i < filesToProcess.length; i++) {
         processingPromises.push(this.processSingleFile(filesToProcess[i]));
      }
      
      try {
        await Promise.all(processingPromises);
        debugLogger.debug('All files processed from drag.');
        
        this.ready = true;
      } catch (error) {
        console.error("Error processing files from drag:", error);
        this.ready = false;
      }
    },
    
    async updateM3U8FilesBeforeUpload() {
        debugLogger.info('🔄 Updating M3U8 playlists with IPFS URLs before upload...');
        
        // Find all M3U8 files
        const m3u8Files = [];
        for (const fileName in this.FileInfo) {
            if (fileName.endsWith('.m3u8')) {
                const fileInfo = this.FileInfo[fileName];
                const file = this.File[fileInfo.index];
                if (file) {
                    m3u8Files.push({ file, fileInfo, fileName });
                }
            }
        }
        
        if (m3u8Files.length === 0) {
            debugLogger.debug('No M3U8 files to update');
            return;
        }
        
        debugLogger.info(`Found ${m3u8Files.length} M3U8 files to update`);
        
        // Process each M3U8 file
        for (const { file, fileInfo, fileName } of m3u8Files) {
            try {
                // Update the playlist content
                const updatedFile = await this.updateM3u8ForUpload(file);
                
                // Read the updated content to calculate new hash
                const reader = new FileReader();
                const updatedContent = await new Promise((resolve, reject) => {
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(updatedFile);
                });
                
                // Calculate new hash for the updated content
                const newHashResult = await this.hashOf(buffer.Buffer(updatedContent), {});
                const newHash = newHashResult.hash;
                
                debugLogger.info(`📝 Updated hash for ${fileName}: ${fileInfo.hash} → ${newHash}`);
                
                // Update the FileInfo with new hash
                this.FileInfo[fileName].hash = newHash;
                
                // Replace the file in the File array with the updated one
                this.File[fileInfo.index] = updatedFile;
                
                // Update the file's CID to match the new hash
                this.File[fileInfo.index].cid = newHash;
                debugLogger.debug(`Updated file CID for ${fileName}: ${newHash}`);
                
            } catch (error) {
                console.error(`Failed to update M3U8 file ${fileName}:`, error);
            }
        }
        
        debugLogger.info('✅ M3U8 files updated successfully');
    },
    
    linkPlaylistPosters() {
        debugLogger.debug('🔗 linkPlaylistPosters called');
        debugLogger.debug('FileInfo keys:', Object.keys(this.FileInfo));
        
        // Check if we're still processing files
        if (this.thumbnailsGenerating > 0) {
            debugLogger.debug(`⏳ Still generating ${this.thumbnailsGenerating} thumbnails, postponing linkPlaylistPosters`);
            return;
        }
        
        // After all files are processed, link m3u8 files with their poster thumbnails
        // First, find any available poster file (master playlist poster)
        let sharedPosterHash = null;
        let sharedPosterName = null;
        
        // Look for master playlist poster first
        Object.entries(this.FileInfo).forEach(([fileName, fileInfo]) => {
            if (fileInfo.role === 'poster' && fileName.includes('_poster.jpg')) {
                if (fileInfo.hash) {
                    sharedPosterHash = fileInfo.hash;
                    sharedPosterName = fileName;
                    debugLogger.debug(`🎬 Found shared poster: ${fileName} with hash ${sharedPosterHash}`);
                }
            }
        });
        
        // Now link all playlists to the shared poster
        Object.entries(this.FileInfo).forEach(([fileName, fileInfo]) => {
            debugLogger.debug(`Checking file ${fileName}, role: ${fileInfo.role}, is m3u8: ${fileName.endsWith('.m3u8')}`);
            
            if (fileInfo.role === 'playlist' && fileName.endsWith('.m3u8')) {
                // For resolution playlists (480p_index.m3u8, etc.), use shared poster
                if (fileName.match(/\d+p_index\.m3u8$/)) {
                    if (sharedPosterHash) {
                        this.FileInfo[fileName].thumb = sharedPosterHash;
                        if (this.FileInfo[fileName].meta) {
                            this.FileInfo[fileName].meta.thumb = sharedPosterHash;
                        }
                        debugLogger.debug(`✅ Linked shared poster ${sharedPosterHash} to resolution playlist ${fileName}`);
                    } else {
                        debugLogger.debug(`⚠️ No shared poster available for resolution playlist ${fileName}`);
                    }
                } else {
                    // For master playlist, look for specific poster by naming convention
                    const baseName = fileName.replace('.m3u8', '');
                    const posterName = `_${baseName}_poster.jpg`;
                    
                    debugLogger.debug(`Looking for poster: ${posterName}`);
                    
                    // Find the poster file in FileInfo
                    const posterFile = this.FileInfo[posterName];
                    
                    if (posterFile) {
                        // The hash is stored directly on the FileInfo object
                        const posterHash = posterFile.hash;
                        if (posterHash) {
                            // Use the poster's CID as thumbnail
                            this.FileInfo[fileName].thumb = posterHash;
                            if (this.FileInfo[fileName].meta) {
                                this.FileInfo[fileName].meta.thumb = posterHash;
                            }
                            debugLogger.debug(`✅ Linked poster thumbnail ${posterHash} to master playlist ${fileName}`);
                        } else {
                            debugLogger.debug(`⚠️ Poster file exists but no hash yet for ${posterName}`);
                            debugLogger.debug(`Poster file data:`, posterFile);
                        }
                    } else {
                        debugLogger.debug(`⚠️ No poster found for master playlist ${fileName} (looked for ${posterName})`);
                        // Fallback to shared poster if available
                        if (sharedPosterHash) {
                            this.FileInfo[fileName].thumb = sharedPosterHash;
                            if (this.FileInfo[fileName].meta) {
                                this.FileInfo[fileName].meta.thumb = sharedPosterHash;
                            }
                            debugLogger.debug(`✅ Used shared poster ${sharedPosterHash} as fallback for master playlist ${fileName}`);
                        }
                    }
                }
            }
        });
    },
    
    async updateM3u8ForUpload(file) {
        debugLogger.debug(`Updating playlist ${file.name} with uploaded CIDs`);
        
        // Read the m3u8 content
        const content = await this.readFileAsText(file);
        
        // Check if content already contains IPFS URLs (this shouldn't happen with fresh files)
        if (content.includes('https://ipfs.dlux.io/ipfs/') || content.includes('ipfs://')) {
            console.warn(`WARNING: Playlist ${file.name} already contains IPFS URLs - this indicates file reuse`);
            debugLogger.debug(`Will process anyway to ensure correct CIDs are used`);
            debugLogger.debug(`Playlist content preview:`, content.substring(0, 300));
            // Don't skip - we need to update with correct CIDs
        }
        
        // Track statistics for debugging
        let totalReferences = 0;
        let successfulReplacements = 0;
        let missingReferences = [];
        
        // Parse lines
        const lines = content.split('\n');
        const updatedLines = lines.map(line => {
            if (!line.trim() || line.startsWith('#')) {
                return line; // Keep comments and empty lines as-is
            }
            
            // This is a file reference - could be a segment or another playlist
            let referencedFile = line.trim();
            
            // Extract filename from various URL formats
            let filename = referencedFile;
            
            // Handle IPFS URLs - extract the filename parameter
            if (referencedFile.includes('ipfs.dlux.io/ipfs/') || referencedFile.includes('ipfs://')) {
                const urlMatch = referencedFile.match(/filename=([^&]+)/);
                if (urlMatch) {
                    filename = urlMatch[1];
                    debugLogger.debug(`Extracted filename ${filename} from IPFS URL in ${file.name}`);
                } else {
                    // Try to extract from the URL path
                    const pathMatch = referencedFile.match(/\/([^/?]+)(?:\?|$)/);
                    if (pathMatch) {
                        filename = pathMatch[1];
                        debugLogger.debug(`Extracted filename ${filename} from IPFS URL path in ${file.name}`);
                    }
                }
            }
            
            // Handle blob URLs
            if (referencedFile.startsWith('blob:')) {
                debugLogger.warn(`Playlist ${file.name} contains blob URLs - these cannot be converted to IPFS`);
                // Can't extract filename from blob URL, skip
                return line;
            }
            
            // Now use the extracted filename to look up the correct CID
            referencedFile = filename;
            
            // Remove any session prefixes or relative paths
            if (referencedFile.includes('__')) {
                referencedFile = referencedFile.split('__').pop();
            }
            if (referencedFile.startsWith('../')) {
                referencedFile = referencedFile.replace('../', '');
            }
            
            // Count this as a reference to track
            totalReferences++;
            
            // Look up the file info and hash for this file
            const fileInfo = this.FileInfo[referencedFile];
            if (fileInfo && fileInfo.hash) {
                // Replace with IPFS URL using the old system's format with filename parameter
                const ipfsUrl = `https://ipfs.dlux.io/ipfs/${fileInfo.hash}?filename=${referencedFile}`;
                debugLogger.debug(`Replaced ${referencedFile} with IPFS URL using hash ${fileInfo.hash} in ${file.name}`);
                successfulReplacements++;
                return ipfsUrl;
            } else {
                debugLogger.debug(`No hash found for: ${referencedFile} in ${file.name}`);
                debugLogger.debug(`FileInfo keys:`, Object.keys(this.FileInfo));
                missingReferences.push(referencedFile);
                return line; // Keep original if we can't find the hash
            }
        });
        
        // Create new content
        const updatedContent = updatedLines.join('\n');
        
        // Log summary of the update
        debugLogger.info(`📊 Playlist Update Summary for ${file.name}:`);
        debugLogger.info(`   Total references found: ${totalReferences}`);
        debugLogger.info(`   Successfully replaced: ${successfulReplacements}`);
        if (missingReferences.length > 0) {
            // Only show as error if we're at the end of upload and still missing
            if (successfulReplacements === 0 && totalReferences > 0) {
                console.error(`❌ Failed to update ${file.name} - missing all referenced files`);
                console.error(`   Missing: ${missingReferences.join(', ')}`);
                console.error(`   This playlist will not work for playback!`);
            } else {
                debugLogger.debug(`   References not yet uploaded: ${missingReferences.length}`);
                debugLogger.debug(`   Waiting for: ${missingReferences.join(', ')}`);
            }
        }
        
        // Create a new File object with updated content
        const updatedFile = new File([updatedContent], file.name, {
            type: file.type || 'application/x-mpegURL',
            lastModified: file.lastModified
        });
        
        // Copy over any custom properties from the original file
        // Don't copy CID - the modified content needs a new CID
        if (file._isAuxiliary !== undefined) updatedFile._isAuxiliary = file._isAuxiliary;
        if (file._role) updatedFile._role = file._role;
        if (file._parentFile) updatedFile._parentFile = file._parentFile;
        
        debugLogger.debug(`Updated ${file.name} content for IPFS upload`);
        return updatedFile;
    },
    
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },
    
    async generateThumbnail(originalFile, fileInfoKey) {
        debugLogger.debug(`generateThumbnail called for: ${originalFile.name}, type: ${originalFile.type}, size: ${originalFile.size}`);
        // Increment counter for thumbnail generation
        this.thumbnailsGenerating++;
        
        try {
            // Use the modular thumbnail service
            const thumbnailResult = await thumbnailService.generateThumbnail(originalFile);
            
            if (!thumbnailResult) {
                debugLogger.debug(`No thumbnail generator available for file: ${originalFile.name}`);
                this.thumbnailsGenerating--;
                return;
            }
            
            // Convert the result to a File object
            const thumbFileName = '_' + originalFile.name;
            const newThumbFile = new File(
                [thumbnailResult.data], 
                thumbFileName,
                { type: `image/${thumbnailResult.format}` }
            );
            
            newThumbFile.progress = 0;
            newThumbFile.status = 'Pending Signature';
            newThumbFile.actions = { cancel: false, pause: false, resume: false };
            
            // Hash the thumbnail
            const buf = buffer.Buffer(thumbnailResult.data);
            const ret = await this.hashOf(buf, {});
            const newIndex = this.File.length;
            
            // Assign CID to the thumbnail file
            newThumbFile.cid = ret.hash;
            // Mark as auxiliary file for consistent handling
            newThumbFile._isAuxiliary = true;
            newThumbFile._role = 'thumbnail';
            debugLogger.debug(`Thumbnail CID assigned: ${newThumbFile.name} = ${ret.hash}`);
            
            // Smart truncation that preserves file extension
            let thumbName = '_' + originalFile.name;
            if (thumbName.length > 32) {
                const lastDotIndex = thumbName.lastIndexOf('.');
                if (lastDotIndex > -1) {
                    const ext = thumbName.substring(lastDotIndex);
                    const nameWithoutExt = thumbName.substring(0, lastDotIndex);
                    thumbName = nameWithoutExt.substring(0, 32 - ext.length) + ext;
                } else {
                    thumbName = thumbName.substring(0, 32);
                }
            }
            
            const thumbDict = {
                fileContent: thumbnailResult.dataURL,
                hash: ret.hash,
                index: newIndex,
                size: newThumbFile.size,
                name: thumbName,
                status: 'Pending Signature',
                flag: '2'  // Always flag 2 for thumbnails
            };
            
            this.File.push(newThumbFile);
            this.FileInfo[thumbDict.name] = {
                ...thumbDict,
                is_thumb: true,
                is_auxiliary: true,
                role: 'thumbnail',
                meta: {
                    name: '',
                    ext: '',
                    flag: "2"
                }
            };
            
            debugLogger.debug(`Thumbnail added for ${originalFile.name}: ${thumbName} with hash ${ret.hash}`);
            
            // Update main file with thumbnail reference
            if (this.FileInfo[fileInfoKey]) {
                this.FileInfo[fileInfoKey].thumb = ret.hash;
                // Also update meta.thumb for UI display
                if (this.FileInfo[fileInfoKey].meta) {
                    this.FileInfo[fileInfoKey].meta.thumb = ret.hash;
                }
                debugLogger.debug(`Main file ${fileInfoKey} updated with thumbnail: ${ret.hash}`);
            } else {
                console.error(`Main FileInfo entry not found for key ${fileInfoKey} when adding thumbnail.`);
            }
            
            // Decrement counter when thumbnail generation is done
            this.thumbnailsGenerating--;
            
        } catch (error) {
            console.error("Error generating thumbnail:", error);
            console.error("Failed for file:", originalFile.name, "type:", originalFile.type, "size:", originalFile.size);
            console.error("Error details:", error.message, error.stack);
            // Make sure to decrement even on error
            this.thumbnailsGenerating--;
        }
    },

    makePaths(){
      const allPaths = new Set(['']);
      const fileInfosToProcess = Object.values(this.FileInfo).filter(f => !f.is_thumb);

      // Debug fullAppPath access
      debugLogger.debug("Files for path processing:", fileInfosToProcess.map(f => ({
          name: f.name,
          fullAppPath: f.meta?.fullAppPath,
          metaExists: !!f.meta
      })));

      fileInfosToProcess.forEach(file => {
          // Get path from meta object
          const path = file.meta?.fullAppPath || '';
          debugLogger.debug(`Processing path: ${path} for file ${file.name}`);
          
          if (!path) return; // Skip if no path
          
          const lastSlash = path.lastIndexOf('/');
          const folderPath = lastSlash > -1 ? path.substring(0, lastSlash) : '';

          // Add the folder path
          if (folderPath) allPaths.add(folderPath);

          // Add all parent paths
          const parts = folderPath.split('/').filter(Boolean);
          let current = '';
          for (let i = 0; i < parts.length; i++) {
              current = current ? `${current}/${parts[i]}` : parts[i];
              allPaths.add(current);
          }
      });

      // Sort paths by depth first, then alphabetically within same depth
      const sortedPaths = Array.from(allPaths).sort((a, b) => {
          const depthA = a.split('/').length;
          const depthB = b.split('/').length;
          if (depthA !== depthB) return depthA - depthB;
          return a.localeCompare(b);
      });

      debugLogger.debug("Sorted paths:", sortedPaths);

      const indexToPath = {};
      const pathToIndex = {};
      
      // Add preset folders map from filesvue-dd.js
      var presetFoldersMap = {
          "Documents": "2", "Images": "3", "Videos": "4", "Music": "5",
          "Archives": "6", "Code": "7", "Trash": "8", "Misc": "9"
      };
      
      // For custom paths, use letters (A-Z) as indices
      let nextCustomIndex = 0;
      const customIndexChars = '1ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      
      // Folder list format: folderName|parentIndex/folderName|...
      let folderListEntries = [];

      // Set root index to "0"
      indexToPath["0"] = '';
      pathToIndex[''] = "0";
      
      // First pass: Assign indices to all paths
      sortedPaths.forEach(path => {
          if (path === '') return; // Skip root
          
          const parts = path.split('/');
          const folderName = parts[parts.length - 1];
          
          // If it's a top-level folder, check for preset index
          if (parts.length === 1) {
              if (presetFoldersMap[folderName]) {
                  const index = presetFoldersMap[folderName];
                  indexToPath[index] = path;
                  pathToIndex[path] = index;
              } else {
                  // Use A, B, C, etc. for custom folders
                  const index = customIndexChars[nextCustomIndex++ % customIndexChars.length];
                  indexToPath[index] = path;
                  pathToIndex[path] = index;
              }
          } else {
              // For deeper paths, use A, B, C, etc.
              const index = customIndexChars[nextCustomIndex++ % customIndexChars.length];
              indexToPath[index] = path;
              pathToIndex[path] = index;
          }
      });
      
      // Second pass: Build the folder list entries
      sortedPaths.forEach(path => {
          if (path === '') return; // Skip root
          
          const parts = path.split('/');
          
          if (parts.length === 1) {
              // Top level folders just use the name
              folderListEntries.push(path);
          } else {
              // Find the parent path and use its index
              const parentPath = path.split('/').slice(0, -1).join('/');
              const parentIndex = pathToIndex[parentPath] || '0';
              const folderName = path.split('/').pop();
              
              folderListEntries.push(`${parentIndex}/${folderName}`);
          }
      });
      // filter out preset folders
      folderListEntries = folderListEntries.filter(entry => !presetFoldersMap[entry]);
      
      // Format: folderName|parentIndex/folderName|...
      const folderListString = folderListEntries.join('|');
      
      debugLogger.debug("Generated Folder String:", folderListString);
      debugLogger.debug("Generated PathToIndex Map:", pathToIndex);

      return { folderListString, pathToIndexMap: pathToIndex };
    },
    async processPlaylistsBeforeUpload() {
      debugLogger.debug("Processing playlists before upload...");
      debugLogger.debug("FileInfo entries:", Object.entries(this.FileInfo).length);
      debugLogger.debug("File array length:", this.File.length);
      
      // Find all M3U8 files in FileInfo
      const m3u8Files = [];
      const fileHashMap = new Map();
      
      // Build hash map and find playlists
      for (const [name, info] of Object.entries(this.FileInfo)) {
        debugLogger.debug(`Checking file ${name}, info:`, info);
        // Add to hash map if file has IPFS hash
        const hash = this.encryption.encrypted ? info.enc_hash : info.hash;
        if (hash) {
          fileHashMap.set(name, hash);
          debugLogger.debug(`Added ${name} -> ${hash} to hash map`);
        }
        
        // Check if it's an M3U8 file
        if (name.endsWith('.m3u8')) {
          debugLogger.debug(`Found M3U8 file: ${name}`);
          m3u8Files.push({ name, info, fileIndex: info.index });
        }
      }
      
      if (m3u8Files.length === 0) {
        debugLogger.debug("No M3U8 files found to process");
        return;
      }
      
      debugLogger.debug(`Found ${m3u8Files.length} playlist(s) to process`);
      
      // Process each playlist
      for (const playlist of m3u8Files) {
        try {
          debugLogger.debug(`Processing playlist ${playlist.name} at index ${playlist.fileIndex}`);
          
          // Get the File object - try different approaches
          let file = this.File[playlist.fileIndex];
          
          // If not found by index, try to find by name
          if (!file) {
            debugLogger.debug(`File not at index ${playlist.fileIndex}, searching by name...`);
            const fileIndex = this.File.findIndex(f => f.name === playlist.name);
            if (fileIndex !== -1) {
              file = this.File[fileIndex];
              debugLogger.debug(`Found file ${playlist.name} at index ${fileIndex}`);
            }
          }
          
          if (!file) {
            console.error(`File not found for ${playlist.name}`);
            continue;
          }
          
          // Read the file content
          const content = await this.readFileAsText(file);
          
          // Check if the content contains blob URLs
          if (content.includes('blob:')) {
            console.error(`🚨 ERROR: Playlist ${playlist.name} contains blob URLs!`);
            console.error(`This file was modified for preview and should not be uploaded.`);
            console.error(`Skipping blob URL processing - these will be replaced with IPFS URLs anyway`);
            
            // Instead of trying to recover from blob URLs, we'll just process normally
            // The updatePlaylistContent method will handle replacing references with IPFS URLs
            // Even if it contains blob URLs, they'll be replaced with proper IPFS URLs
          }
          
          // Process the content to update segment references
          const updatedContent = this.updatePlaylistContent(content, fileHashMap);
          
          // Create new file with updated content
          const updatedFile = new File([updatedContent], file.name, { type: file.type });
          
          // Replace the file in the array
          this.File[playlist.fileIndex] = updatedFile;
          
          // Re-hash the updated file
          const buffer = await this.fileToBuffer(updatedFile);
          const hashResult = await this.hashOf(buffer, {});
          
          // Update FileInfo with new hash
          if (this.encryption.encrypted) {
            playlist.info.enc_hash = hashResult.hash;
          } else {
            playlist.info.hash = hashResult.hash;
          }
          
          // IMPORTANT: Also update the File array's CID so it matches during upload
          if (this.File[playlist.fileIndex]) {
            this.File[playlist.fileIndex].cid = hashResult.hash;
          }
          
          debugLogger.debug(`Updated playlist ${playlist.name} with new hash ${hashResult.hash}`);
          
        } catch (error) {
          console.error(`Error processing playlist ${playlist.name}:`, error);
        }
      }
    },
    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    },
    fileToBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(buffer.Buffer(e.target.result));
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    },
    updatePlaylistContent(content, fileHashMap) {
      const lines = content.split('\n');
      let replacementCount = 0;
      const ipfsGateway = 'https://ipfs.dlux.io/ipfs/';
      
      const updatedLines = lines.map(line => {
        // Skip empty lines and M3U8 directives
        if (!line.trim() || line.startsWith('#')) {
          return line;
        }
        
        // This line should be a segment reference
        let segmentName = line.trim();
        
        // Check if this is already a blob URL
        if (segmentName.startsWith('blob:')) {
          console.error(`ERROR: Playlist contains blob URL: ${segmentName}`);
          console.error(`Cannot extract filename from blob URL - this will fail on IPFS!`);
          // Try to extract filename from other parts of the playlist or skip
          return line; // Keep the blob URL for now, but this will fail
        }
        
        // Check if this is already an IPFS URL
        if (segmentName.includes('ipfs.dlux.io') || segmentName.includes('ipfs://')) {
          console.warn(`Playlist already contains IPFS URL: ${segmentName}`);
          // Extract filename from URL if possible
          const urlMatch = segmentName.match(/filename=([^&]+)/);
          if (urlMatch) {
            segmentName = urlMatch[1];
            debugLogger.debug(`Extracted filename ${segmentName} from existing IPFS URL`);
          } else {
            return line; // Keep existing IPFS URL
          }
        }
        
        // Remove session prefixes if present
        if (segmentName.includes('__')) {
          segmentName = segmentName.split('__').pop();
        }
        if (segmentName.startsWith('../')) {
          segmentName = segmentName.replace('../', '');
        }
        
        // Check if we have this segment in our hash map
        if (fileHashMap.has(segmentName)) {
          const hash = fileHashMap.get(segmentName);
          const ipfsUrl = `${ipfsGateway}${hash}`;
          replacementCount++;
          debugLogger.debug(`Replaced ${segmentName} with ${ipfsUrl}`);
          return ipfsUrl;
        }
        
        // Fuzzy matching for segments and playlists
        for (const [fileName, hash] of fileHashMap) {
          // Check for both .ts segments and .m3u8 playlists
          if ((fileName.endsWith('.ts') || fileName.endsWith('.m3u8')) && 
              (segmentName === fileName || 
               segmentName.endsWith(fileName) ||
               fileName.endsWith(segmentName))) {
            const ipfsUrl = `${ipfsGateway}${hash}`;
            replacementCount++;
            const fileType = fileName.endsWith('.m3u8') ? 'playlist' : 'segment';
            debugLogger.debug(`Replaced ${segmentName} with ${ipfsUrl} (fuzzy match - ${fileType}`);
            return ipfsUrl;
          }
        }
        
        console.warn(`No hash found for reference ${segmentName}`);
        return line;
      });
      
      debugLogger.debug(`Updated ${replacementCount} segment references`);
      return updatedLines.join('\n');
    },
    deleteImg(index, name) {
      for (var item in this.FileInfo) {
        if (this.FileInfo[item].index > index) {
          this.FileInfo[item].index--
        }
      }
      this.File.splice(index, 1)
      delete this.FileInfo[name]
      delete this.FileInfo['thumb' + name]
    },
    async signNUpload() {
      console.log('🚀🚀🚀 SIGNUPLOAD METHOD CALLED - STARTING 🚀🚀🚀');
      console.log('🚀 Contract ID:', this.contract.i)
      var header = `${this.contract.i}`
      const { folderListString, pathToIndexMap } = this.makePaths();

      // Ensure makePaths actually returned the map
      if (!pathToIndexMap) {
          console.error("pathToIndexMap is undefined after call to makePaths. Aborting upload.");
          // Handle this error appropriately - maybe show a user message
          return; 
      }

      // Reset upload tracking
      this.uploadInProgress = false
      
      // Clear duplicate files if force re-upload is enabled
      if (this.allowDuplicates && this.duplicateFiles.length > 0) {
        console.log(`Force re-upload enabled. Clearing ${this.duplicateFiles.length} duplicate files.`);
        this.duplicateFiles = [];
      }
      this.fileProgress = {}
      this.completedFiles = 0

      // Collect initial CIDs and metadata
      var body = ""
      var names = Object.keys(this.FileInfo)
      var cids = []
      var meta = {}

      if (!this.encryption.encrypted) for (var i = 0; i < names.length; i++) {
          if ((this.FileInfo[names[i]].is_thumb && this.FileInfo[names[i]].use_thumb) || !this.FileInfo[names[i]].is_thumb) {
            meta[this.FileInfo[names[i]].hash] = `,${this.FileInfo[names[i]].meta.name},${this.FileInfo[names[i]].meta.ext},${this.FileInfo[names[i]].meta.thumb},${this.FileInfo[names[i]].is_thumb ? '2' : this.FileInfo[names[i]].meta.flag}-${this.FileInfo[names[i]].meta.license}-${this.FileInfo[names[i]].meta.labels}`
            body += `,${this.FileInfo[names[i]].hash}`
            cids.push(this.FileInfo[names[i]].hash)
          }
        }
        else for (var i = 0; i < names.length; i++) {
          if (this.FileInfo[names[i]].enc_hash) {
            meta[this.FileInfo[names[i]].enc_hash] = `,${this.FileInfo[names[i]].meta.name},${this.FileInfo[names[i]].meta.ext},,${this.FileInfo[names[i]].meta.flag + 1}--${this.FileInfo[names[i]].meta.labels}`
            body += `,${this.FileInfo[names[i]].enc_hash}`
            cids.push(this.FileInfo[names[i]].enc_hash)
          }
        }
        
        // Process playlists to update with IPFS URLs BEFORE signing the contract
        debugLogger.debug('About to process playlists, FileInfo keys:', Object.keys(this.FileInfo));
        debugLogger.debug('🔧 CRITICAL DEBUG: About to call processPlaylistsBeforeUpload()');
        debugLogger.debug('🔧 Function exists?', typeof this.processPlaylistsBeforeUpload);
        debugLogger.debug('🔧 FileInfo has entries?', Object.keys(this.FileInfo).length > 0);
        
        // First, check if any m3u8 files contain blob URLs
        for (const [name, info] of Object.entries(this.FileInfo)) {
            if (name.endsWith('.m3u8') && info.index !== undefined) {
                const file = this.File[info.index];
                if (file) {
                    try {
                        const content = await this.readFileAsText(file);
                        if (content.includes('blob:')) {
                            console.error(`🚨 CRITICAL: ${name} contains blob URLs before processing!`);
                            console.error(`This indicates the file was modified for preview and should not be uploaded.`);
                            // TODO: We should replace this with the original file
                        }
                    } catch (e) {
                        console.error(`Error checking ${name} for blob URLs:`, e);
                    }
                }
            }
        }
        
        // DISABLED: processPlaylistsBeforeUpload is no longer needed
        // We now update playlists during upload with actual uploaded CIDs
        // try {
        //     console.log('🔧 Calling processPlaylistsBeforeUpload...');
        //     await this.processPlaylistsBeforeUpload();
        //     console.log('🔧 processPlaylistsBeforeUpload completed successfully');
        // } catch (error) {
        //     console.error('🔧 ERROR in processPlaylistsBeforeUpload:', error);
        // }
        
        // Re-collect CIDs and metadata after playlist processing
        body = ""
        cids = []
        meta = {}
        
        if (!this.encryption.encrypted) for (var i = 0; i < names.length; i++) {
          if ((this.FileInfo[names[i]].is_thumb && this.FileInfo[names[i]].use_thumb) || !this.FileInfo[names[i]].is_thumb) {
            meta[this.FileInfo[names[i]].hash] = `,${this.FileInfo[names[i]].meta.name},${this.FileInfo[names[i]].meta.ext},${this.FileInfo[names[i]].meta.thumb},${this.FileInfo[names[i]].is_thumb ? '2' : this.FileInfo[names[i]].meta.flag}-${this.FileInfo[names[i]].meta.license}-${this.FileInfo[names[i]].meta.labels}`
            body += `,${this.FileInfo[names[i]].hash}`
            cids.push(this.FileInfo[names[i]].hash)
          }
        }
        else for (var i = 0; i < names.length; i++) {
          if (this.FileInfo[names[i]].enc_hash) {
            meta[this.FileInfo[names[i]].enc_hash] = `,${this.FileInfo[names[i]].meta.name},${this.FileInfo[names[i]].meta.ext},,${this.FileInfo[names[i]].meta.flag + 1}--${this.FileInfo[names[i]].meta.labels}`
            body += `,${this.FileInfo[names[i]].enc_hash}`
            cids.push(this.FileInfo[names[i]].enc_hash)
          }
        }
        // Create challenge with original body (including comma)
        debugLogger.debug('🎯 ABOUT TO CREATE CHALLENGE - POST PLAYLIST PROCESSING');
        const challenge = this.user.name + ':' + header + body;
        
        // Keep the body as-is with the leading comma for contract.files
        this.contract.files = body;
        debugLogger.debug("Signing challenge:", challenge);
        debugLogger.debug("Contract details:", {
          id: this.contract.i,
          broker: this.contract.b,
          account: this.contract.t,
          api: this.contract.api
        });
        
        const res = await this.signText(challenge);
        debugLogger.debug("signText response:", res);
        this.meta = meta
        // Extract signature from challenge:signature format
        const lastColonIndex = res.lastIndexOf(':');
        this.contract.fosig = lastColonIndex !== -1 ? res.substring(lastColonIndex + 1) : res;
        debugLogger.debug("Extracted signature:", this.contract.fosig);
        
        this.upload(cids, this.contract, folderListString, pathToIndexMap)
        this.ready = false
    },
    appendFile(file, id) {
      if (this.files[file]) delete this.files[file]
      else this.files[file] = id
    },
    uploadAndTrack(name, contract) {
      this.signText(this.user.name + ':').then((headers) => {
        let uploader = null;
        const setFileElement = (file) => {
          // create file element here
        }
        const onProgress = (e, file) => { };
        const onError = (e, file) => { };
        const onAbort = (e, file) => { };
        const onComplete = (e, file) => { };
        return (uploadedFiles) => {
          [...uploadedFiles].forEach(setFileElement);

          uploader = uploadFiles(uploadedFiles, {
            onProgress,
            onError,
            onAbort,
            onComplete
          });
        }
      });
    },
    signText(challenge) {
      return new Promise((res, rej) => {
        this.toSign = {
          type: "sign_headers",
          challenge,
          key: "posting",
          ops: [],
          callbacks: [res, rej],
          txid: "Sign Auth Headers",
        };
        this.$emit("tosign", this.toSign);
      });
    },
    selectContract(id, broker) {
      this.contract.id = id
      fetch(`https://spktest.dlux.io/user_services/${broker}`)
        .then(r => r.json())
        .then(res => {
          debugLogger.debug(res)
          this.contract.api = res.services.IPFS[Object.keys(res.services.IPFS)[0]].a
        })
    },
    stringOfKeys() {
      if (!this.encryption.encrypted) return ''
      var keys = []
      var accounts = Object.keys(this.encryption.accounts)
      for (var i = 0; i < accounts.length; i++) {
        keys.push(`${this.encryption.accounts[accounts[i]].enc_key}@${accounts[i]}`)
      }
      return keys.join(';')
    },
    flagEncode(fileInfo) {
      var num = 0
      if (fileInfo.encrypted) num += 1
      if (fileInfo.is_thumb) num += 2
      if (fileInfo.nsfw) num += 4
      if (fileInfo.executable) num += 8
      var flags = this.NumberToBase64(num)
      return flags
    },
    flagDecode(flags) {
      var num = this.Base64toNumber(flags)
      var out = {}
      if (num & 1) out.enc = true
      if (num & 2) out.autoRenew = true
      if (num & 4) out.nsfw = true
      if (num & 8) out.executable = true
      return out
    },
    async upload(cids = ['QmYJ2QP58rXFLGDUnBzfPSybDy3BnKNsDXh6swQyH7qim3'], contract, folderListString = '', pathToIndexMap = { '': '0' }) {
      console.log('\n🚀 Starting upload process...');
      console.log(`📦 Total files to upload: ${this.File.length}`);
      
      
      // Critical check: Verify no blob URLs in m3u8 files before upload
      const m3u8Files = this.File.filter(f => f.name && f.name.endsWith('.m3u8'));
      if (m3u8Files.length > 0) {
          debugLogger.debug(`\n🔍 Pre-upload verification of ${m3u8Files.length} playlist files...`);
          
          // Check each playlist synchronously to ensure we catch issues
          let hasErrors = false;
          for (const file of m3u8Files) {
              try {
                  const reader = new FileReader();
                  const content = await new Promise((resolve, reject) => {
                      reader.onload = (e) => resolve(e.target.result);
                      reader.onerror = reject;
                      reader.readAsText(file);
                  });
                  
                  if (content.includes('blob:')) {
                      console.error(`\n🚨 UPLOAD BLOCKED: ${file.name} contains blob URLs!`);
                      console.error(`This would cause playback failure after upload.`);
                      hasErrors = true;
                  } else if (content.includes('ipfs.dlux.io') || content.includes('ipfs://')) {
                      // Note: IPFS URLs in HLS files are expected and required for IPFS compatibility
                      // These are added during transcoding to ensure playback works on IPFS
                      // console.warn(`⚠️ WARNING: ${file.name} already contains IPFS URLs`);
                      // console.warn(`This suggests file reuse from a previous upload attempt.`);
                  } else {
                      debugLogger.debug(`✅ ${file.name} verified - contains only local references`);
                  }
              } catch (e) {
                  console.error(`Error verifying ${file.name}:`, e);
              }
          }
          
          if (hasErrors) {
              console.error(`\n❌ Upload cannot proceed - playlists contain blob URLs`);
              console.error(`Please refresh the page and try again.`);
              alert('Upload error: Video playlists contain invalid URLs. Please refresh the page and try again.');
              this.uploadInProgress = false;
              return;
          }
      }
      
      // Files are now pre-processed in video transcoder with IPFS URLs
      // No need to modify them here - CIDs already match the content
      debugLogger.info('📝 Using pre-processed files from video transcoder');
      
      cids = cids.sort(function (a, b) {
        if (a < b) { return -1; }
        if (a > b) { return 1; }
        return 0;
      }) // Sort CIDs alphabetically to save bytes in metadata
      
      // Format: "1|folderList|file1,ext.pathIndex,thumb,flags|file2,ext.pathIndex,thumb,flags|..."
      var metaString = `1${this.stringOfKeys()}`;
      if (folderListString) {
        metaString += '|' + folderListString;
      }
      
      const fileMetaEntries = {};

      debugLogger.debug("Path to index map in upload:", pathToIndexMap);

      // First pass: Assign CIDs to files
      for (var name in this.FileInfo) {
        const fileInfo = this.FileInfo[name];
        
        for (var i = 0; i < cids.length; i++) {
          if (fileInfo.hash == cids[i]) {
            this.File[fileInfo.index].cid = cids[i];
            break;
          } else if (fileInfo.enc_hash == cids[i]) {
            this.File[fileInfo.enc_index].cid = cids[i];
            break;
          }
        }
      }

      // Second pass: Generate metadata entries
      for (var name in this.FileInfo) {
        const fileInfo = this.FileInfo[name];

        // --- Start Sanitization and Path Index ---
        let sanitizedFileName = fileInfo.meta.name.replaceAll(',', '-'); // Replace commas
        sanitizedFileName = sanitizedFileName.substring(0, 32); // Cap length
        if (!sanitizedFileName) sanitizedFileName = '__'; // Ensure min length 2
        if (sanitizedFileName.length < 2) sanitizedFileName = sanitizedFileName + '_'
        
        let sanitizedExt = fileInfo.meta.ext
        // max 4 chars, all lowercase, alphanumeric only
        sanitizedExt = sanitizedExt.substring(0, 4).toLowerCase().replace(/[^a-z0-9]/g, '');
        
        let sanitizedThumb = fileInfo.meta.thumb
        // valid IPFS CID and full https urls are allowed
        const ipfsPattern = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/; // Simplified IPFS CID pattern
        const urlPattern = /^(https?:\/\/[^\s$.?#].[^\s]*)$/; 
        if (!ipfsPattern.test(sanitizedThumb) && !urlPattern.test(sanitizedThumb)) {
          sanitizedThumb = ""
        }
        
        let sanitizedFlag = `${fileInfo.meta.flag}-${fileInfo.meta.license}-${fileInfo.meta.labels}`
        const flagsPattern = /^([0-9a-zA-Z+/=]?)-([0-9a-zA-Z+/=]?)-([0-9a-zA-Z+/=]*)$/
        if (!flagsPattern.test(sanitizedFlag)) {
          sanitizedFlag = `--`
        }
        
        // Get appropriate path for the file
        const fullAppPath = fileInfo.meta?.fullAppPath || '';
        const lastSlash = fullAppPath.lastIndexOf('/');
        const folderPath = lastSlash > -1 ? fullAppPath.substring(0, lastSlash) : '';
        
        // Look up the folder index in pathToIndexMap
        const pathIndex = pathToIndexMap[folderPath] || '0';
        
        // Format extension with path suffix: ext.pathIndex
        // Root files (index '0') get no path suffix, only folder files get suffixes
        const extWithPath = sanitizedExt + (pathIndex !== '1' ? '.' + pathIndex : '');
        
        debugLogger.debug(`File: ${fileInfo.name}, Path: ${folderPath}, Index: ${pathIndex}, Formatted extension: ${extWithPath}`);
        
        // --- End Sanitization and Path Index ---
        for (var i = 0; i < cids.length; i++) {
          if (fileInfo.hash == cids[i]) {
            // Format: name,ext.pathIndex,thumb,flags
            fileMetaEntries[cids[i]] = `${sanitizedFileName},${extWithPath},${sanitizedThumb},${sanitizedFlag}`
            break;
          } else if (fileInfo.enc_hash == cids[i]) {
            // Same format for encrypted files
            fileMetaEntries[cids[i]] = `${sanitizedFileName},${extWithPath},${sanitizedThumb},${sanitizedFlag}`
            break;
          }
        }
      }
    
      // Add file metadata entries to the string
      if (cids.length > 0) {
        
        cids = cids.sort(); // Re-sort to ensure metadata entries are added in alphabetical CID order
        for (var i = 0; i < cids.length; i++) {
          metaString += (metaString.endsWith(',') ? '' : ',') + fileMetaEntries[cids[i]]
        }
      }
      this.finalMetadataString = metaString; // Store it on the instance
      
      debugLogger.debug({metaString});
      debugLogger.debug('CIDs being uploaded:', cids);
      debugLogger.debug('File metadata entries:', fileMetaEntries);
      // return // for testing without actual upload
      
      const apiUrl = this.contract.api;
      const ENDPOINTS = {
        UPLOAD: `${apiUrl}/upload`,
        UPLOAD_STATUS: `${apiUrl}/upload-check`,
        UPLOAD_REQUEST: `${apiUrl}/upload-authorize`
      };
      const defaultOptions = {
        url: ENDPOINTS.UPLOAD,
        startingByte: 0,
        contract: contract,
        cid: null,
        cids: `${cids.join(',')}`,
        meta: encodeURI(metaString),
        onAbort: (e, f) => {
          debugLogger.debug('options.onAbort')
          this.File = []
          this.FileInfo = {}
          this.fileRequests = {}
          this.uploadInProgress = false
          this.fileProgress = {}
          this.completedFiles = 0
        },
        onProgress: (e, f) => {
          debugLogger.debug('options.onProgress', e, f)
          
          // Safety check - ensure FileInfo entry exists
          if (!this.FileInfo[f.name]) {
            console.warn(`FileInfo entry not found for file: ${f.name}`);
            return;
          }
          
          const fileIndex = this.FileInfo[f.name].index;
          const fileData = this.File[fileIndex];
          
          // Safety check - ensure File array entry exists
          if (!fileData) {
            console.warn(`File array entry not found at index ${fileIndex} for file: ${f.name}`);
            return;
          }
          
          // Update file actions and progress
          if (fileData.actions) {
            fileData.actions.pause = true;
            fileData.actions.resume = false;
            fileData.actions.cancel = true;
          }
          
          const progress = e.loaded / e.total * 100;
          fileData.progress = progress;
          this.FileInfo[f.name].status = progress < 100 ? `uploading(${Math.round(progress)}%)` : 'done';
          
          // Update combined progress tracking
          this.uploadInProgress = true;
          if (f.cid) {
            this.fileProgress[f.cid] = {
              loaded: e.loaded,
              total: e.total,
              percentage: progress,
              size: f.size
            };
          }
        },
        onError: (e, f) => {
          console.log('options.onError', e, f)
          
          const fileName = f?.name || e?.file?.name || e?.name;
          if (!fileName) {
            console.error('Error occurred but could not determine file name', e);
            return;
          }
          
          // Log detailed error information
          if (e.type === 'timeout') {
            console.error(`Upload timeout for ${fileName}:`, e.message);
          } else if (e.type === 'network') {
            console.error(`Network error for ${fileName}:`, e.message);
          } else if (e.status) {
            console.error(`HTTP error ${e.status} for ${fileName}:`, e.response || e.statusText);
          } else {
            console.error(`Unknown error for ${fileName}:`, e);
          }
          
          // Update FileInfo status if it exists
          if (this.FileInfo[fileName]) {
            this.FileInfo[fileName].status = '!!ERROR!!';
            
            const fileIndex = this.FileInfo[fileName].index;
            const fileData = this.File[fileIndex];
            
            // Update file actions if the file entry exists
            if (fileData && fileData.actions) {
              fileData.actions.pause = false;
              fileData.actions.resume = true;
              fileData.actions.cancel = true;
            }
          }
        },
        onComplete: (e, f) => {
          debugLogger.debug('options.onComplete', e, f)
          
          // Safety check for file name
          if (!f || !f.name || !this.FileInfo[f.name]) {
            console.warn('onComplete called with invalid file data:', f);
            return;
          }
          
          const fileInfo = this.FileInfo[f.name];
          const fileIndex = fileInfo.index;
          
          // Safety check for file array access
          if (fileIndex === undefined || fileIndex < 0 || fileIndex >= this.File.length || !this.File[fileIndex]) {
            console.warn(`Invalid file index ${fileIndex} for file ${f.name}, File array length: ${this.File.length}`);
            // Still mark FileInfo as done even if File array entry is missing
            fileInfo.progress = 100;
            fileInfo.status = 'done';
          } else {
            // Mark file as fully uploaded
            const fileEntry = this.File[fileIndex];
            if (fileEntry.actions) {
              fileEntry.actions.pause = false;
              fileEntry.actions.resume = false;
              fileEntry.actions.cancel = false;
            }
            fileEntry.progress = 100;
            fileInfo.progress = 100;
            fileInfo.status = 'done';
          }
          
          // Update combined progress tracking
          if (f.cid) {
            this.fileProgress[f.cid] = {
              loaded: f.size,
              total: f.size,
              percentage: 100,
              size: f.size
            }
            this.completedFiles++
          }
          
          // Check if all files are uploaded
          var done = true
          for (var file in this.FileInfo) {
            if (this.FileInfo[file].status != 'done') {
              done = false
              break;
            }
          }
          
          // If all files are uploaded, perform final actions
          if (done) {
            console.log('All files uploaded successfully, emitting done event');
            this.uploadInProgress = false
            this.$emit('done', {
              contractId: this.contract.i,
              metadata: this.finalMetadataString
            });
            
            // Reset component state after a short delay to allow UI to update
            setTimeout(() => {
              this.File = [];
              this.FileInfo = {};
              this.fileInput = [];
              this.showFileDetails = false;
            }, 100)
          }
        }
      };
      const uploadFileChunks = async (file, options) => {
        let fileToUpload = file;
        
        // Enhanced logging for m3u8 file uploads
        if (file.name.endsWith('.m3u8')) {
            debugLogger.debug(`\n=== M3U8 Upload Debug for ${file.name} ===`);
            debugLogger.debug(`File size: ${file.size} bytes`);
            debugLogger.debug(`File type: ${file.type}`);
            debugLogger.debug(`Last modified: ${new Date(file.lastModified).toISOString()}`);
            debugLogger.debug(`CID being uploaded: ${options.cid}`);
            
            // Read and analyze the playlist content
            try {
                const content = await this.readFileAsText(file);
                const lines = content.split('\n');
                
                // Count different types of references
                let localRefs = 0;
                let blobRefs = 0;
                let ipfsRefs = 0;
                let otherRefs = 0;
                
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#')) {
                        if (trimmed.includes('blob:')) {
                            blobRefs++;
                            console.error(`❌ BLOB URL found: ${trimmed}`);
                        } else if (trimmed.includes('ipfs.dlux.io') || trimmed.includes('ipfs://')) {
                            ipfsRefs++;
                            // Note: IPFS URLs are expected in HLS files for IPFS compatibility
                            // console.warn(`⚠️ IPFS URL found: ${trimmed}`);
                        } else if (trimmed.endsWith('.ts') || trimmed.endsWith('.m3u8')) {
                            localRefs++;
                            debugLogger.debug(`✅ Local reference: ${trimmed}`);
                        } else {
                            otherRefs++;
                            debugLogger.debug(`❓ Other reference: ${trimmed}`);
                        }
                    }
                });
                
                debugLogger.debug(`\nPlaylist analysis for ${file.name}:`);
                debugLogger.debug(`- Local references: ${localRefs}`);
                debugLogger.debug(`- Blob URLs: ${blobRefs}`);
                debugLogger.debug(`- IPFS URLs: ${ipfsRefs}`);
                debugLogger.debug(`- Other: ${otherRefs}`);
                
                if (blobRefs > 0) {
                    console.error(`\n🚨 CRITICAL ERROR: Playlist ${file.name} contains ${blobRefs} blob URLs!`);
                    console.error(`This will cause playback failure after upload.`);
                    console.error(`The playlist should only contain local file references.`);
                    
                    // Try to find the original file without blob URLs
                    console.error(`Attempting to find original playlist file...`);
                    
                    // Log the first few blob URLs for debugging
                    lines.forEach((line, idx) => {
                        const trimmed = line.trim();
                        if (trimmed.includes('blob:') && blobRefs <= 3) {
                            console.error(`Line ${idx}: ${trimmed}`);
                        }
                    });
                    
                    // This is a critical issue that needs to be fixed
                    // The upload will fail if we proceed with blob URLs
                }
                
                if (ipfsRefs > 0) {
                    // Note: IPFS URLs in HLS playlists are expected and required for IPFS compatibility
                    // console.warn(`\n⚠️ WARNING: Playlist ${file.name} already contains ${ipfsRefs} IPFS URLs`);
                    // console.warn(`This suggests the file is being reused from a previous upload attempt.`);
                } else if (localRefs > 0) {
                    debugLogger.debug(`✅ Playlist ${file.name} contains ${localRefs} local references - this is expected`);
                    debugLogger.debug(`The IPFS gateway will handle filename resolution during playback`);
                }
                
                debugLogger.debug(`=== End M3U8 Debug ===\n`);
            } catch (error) {
                console.error(`Error reading playlist ${file.name}:`, error);
            }
            
            // M3U8 files are uploaded as-is with local references
            // The IPFS gateway handles filename-to-CID resolution during playback
            debugLogger.debug(`📋 M3U8 file ${file.name} will be uploaded with local references`);
        }
        
        const formData = new FormData();
        const req = new XMLHttpRequest();
        const chunk = fileToUpload.slice(options.startingByte);

        formData.append('chunk', chunk);
        
        debugLogger.debug('uploadFileChunks options:', options)
        debugLogger.debug(`Uploading chunk for file: ${fileToUpload.name}, CID: ${options.cid}, Contract: ${options.contract.i}`);
        req.open('POST', options.url, true);
        req.setRequestHeader(
          'Content-Range', `bytes=${options.startingByte}-${options.startingByte + chunk.size - 1}/${fileToUpload.size}`
        );
        req.setRequestHeader('X-Cid', options.cid);
        req.setRequestHeader('X-Contract', options.contract.i);
        req.setRequestHeader('X-Sig', options.contract.fosig);
        req.setRequestHeader('X-Account', options.contract.t);

        req.onload = (e) => {
          if (req.status === 200) {
            debugLogger.debug(`Upload chunk successful for ${file.name}`, req.responseText);
            
            // Log all response headers for debugging
            const allHeaders = req.getAllResponseHeaders();
            debugLogger.debug(`All response headers for ${file.name}:`, allHeaders);
            
            // Log specific headers
            // Note: Browser will log "Refused to get unsafe header" warnings for custom headers
            // This is expected browser security behavior and can be ignored
            // Wrap in try-catch to reduce console noise
            try {
              const headers = {};
              // Safe header that should always work
              headers['content-type'] = req.getResponseHeader('content-type');
              
              // Custom headers might be blocked by CORS
              try { headers['x-upload-status'] = req.getResponseHeader('x-upload-status'); } catch(e) {}
              try { headers['x-file-persisted'] = req.getResponseHeader('x-file-persisted'); } catch(e) {}
              try { headers['x-cid'] = req.getResponseHeader('x-cid'); } catch(e) {}
              try { headers['x-contract'] = req.getResponseHeader('x-contract'); } catch(e) {}
              
              debugLogger.debug(`Response headers for ${file.name}:`, headers);
            } catch (err) {
              debugLogger.debug(`Could not access response headers for ${file.name}`);
            }
            
            // Capture the actual IPFS CID from the upload response
            let actualCID = null;
            try {
              actualCID = req.getResponseHeader('x-cid');
            } catch(e) {
              // Header not accessible due to CORS
            }
            if (actualCID && actualCID !== options.cid) {
              console.warn(`CID mismatch for ${file.name}: expected ${options.cid}, got ${actualCID}`);
            }
            
            // Parse response if it's JSON
            let responseData = req.responseText;
            try {
              responseData = JSON.parse(req.responseText);
              debugLogger.debug(`Parsed response for ${file.name}:`, responseData);
            } catch (err) {
              debugLogger.debug(`Response is not JSON for ${file.name}, raw text:`, req.responseText);
            }
            
            options.onComplete(e, file);
          } else {
            console.error(`Upload chunk failed for ${file.name}. Status: ${req.status}`, req.responseText);
            options.onError({
              status: req.status,
              statusText: req.statusText,
              response: req.responseText,
              file: file
            }, file);
          }
        };

        req.upload.onprogress = (e) => {
          const loaded = options.startingByte + e.loaded;
          options.onProgress({
            ...e,
            loaded,
            total: fileToUpload.size,
            percentage: loaded / fileToUpload.size * 100
          }, file);
        };

        req.timeout = 30000; // 30 second timeout per chunk

        req.ontimeout = (e) => {
          console.error(`Upload timeout for ${file.name} after 30 seconds`);
          options.onError({ type: 'timeout', message: 'Upload timed out after 30 seconds', file: file }, file);
        };

        req.onabort = (e) => options.onAbort(e, file);

        req.onerror = (e) => {
          console.error(`Upload network error for ${file.name}`, e);
          options.onError({ type: 'network', message: 'Network error during upload', file: file }, file);
        };

        this.fileRequests[options.cid].request = req;

        req.send(formData);
      };
      const uploadFile = (file, options, cid) => {
        debugLogger.debug('Uploading', cid, options, file)
        debugLogger.debug('Upload authorization headers:', {
          'Content-Type': 'application/json',
          'X-Sig': options.contract.fosig,
          'X-Account': options.contract.t,
          'X-Contract': options.contract.i,
          'X-Cid': cid,
          'X-Chain': 'HIVE'
        });
        debugLogger.debug('Contract files string:', options.contract.files);
        debugLogger.debug('CIDs array:', options.cids);
        return fetch(ENDPOINTS.UPLOAD_REQUEST, {
          method: 'POST', // Changed back to POST as per GitHub reference
          headers: {
            'Content-Type': 'application/json',
            'X-Sig': options.contract.fosig,
            'X-Account': options.contract.t,
            'X-Contract': options.contract.i,
            'X-Cid': cid,
            'X-Chain': 'HIVE'
          },
          body: JSON.stringify({ // Added body with files and meta
            files: options.contract.files,
            meta: options.meta
          })
        })
          .then(res => {
            debugLogger.debug(`Upload authorization response status: ${res.status}`);
            
            // Log response headers before parsing JSON
            const responseHeaders = {};
            res.headers.forEach((value, key) => {
              responseHeaders[key] = value;
            });
            debugLogger.debug('Upload authorization response headers:', responseHeaders);
            
            if (!res.ok) {
              // Try to get error details from response body
              return res.text().then(errorText => {
                console.error('Upload authorization error response:', errorText);
                throw new Error(`Upload authorization failed with status ${res.status}: ${errorText || res.statusText}`);
              });
            }
            return res.json();
          })
          .then(jsonData => {
            debugLogger.debug('Upload authorization JSON response:', jsonData);
            debugLogger.debug('Authorized CIDs from server:', jsonData.authorized);
            debugLogger.debug('Attempting to upload CID:', cid);
            debugLogger.debug('Is this CID authorized?', jsonData.authorized && jsonData.authorized.includes(cid));
            debugLogger.debug('Starting chunked upload for file:', file.name);
            
            options = { ...options, ...jsonData };
            options.cid = cid
            this.fileRequests[cid] = { request: null, options }
            uploadFileChunks(file, options);
          })
          .catch(e => {
            console.error('Upload authorization failed:', e);
            options.onError({ 
              type: 'authorization', 
              message: e.message || 'Failed to authorize upload',
              error: e,
              file: file 
            });
          })
      };
      const abortFileUpload = (file) => {
        const fileReq = this.fileRequests[file.cid];

        if (fileReq && fileReq.request) {
          fileReq.request.abort();
          return true;
        }

        return false;
      };
      const retryFileUpload = (file) => {
        const fileReq = this.fileRequests[file.cid];

        if (fileReq) {
          return fetch(
            `${ENDPOINTS.UPLOAD_STATUS}?fileName=${file.name}&fileId=${fileReq.options.fileId}`)
            .then(res => res.json())
            .then(res => {
              uploadFileChunks(
                file,
                {
                  ...fileReq.options,
                  startingByte: Number(res.totalChunkUploaded)
                }
              );
            })
            .catch(() => {
              uploadFileChunks(file, fileReq.options)
            })
        }
      };
      const clearFileUpload = (file) => {
        const fileReq = this.fileRequests[file.cid];

        if (fileReq) {
          abortFileUpload(file)
          delete this.fileRequests[file.cid];

          return true;
        }

        return false;
      };
      const resumeFileUpload = (file) => {
        const fileReq = this.fileRequests[file.cid];

        if (fileReq) {
          return fetch(
            `${ENDPOINTS.UPLOAD_STATUS}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'sig': contract.fosig,
              'account': contract.t,
              'contract': contract.i,
              'cid': file.cid
            }
          })
            .then(res => res.json())
            .then(res => {
              uploadFileChunks(
                file,
                {
                  ...fileReq.options,
                  startingByte: Number(res.totalChunkUploaded)
                }
              );
            })
            .catch(e => {
              fileReq.options.onError({ ...e, file })
            })
        }
      };
      // Sort files into priority groups for HLS upload ordering
      const sortFilesForHLS = (files) => {
        const segments = [];      // .ts files (must upload first)
        const thumbnails = [];    // image files
        const variantPlaylists = []; // resolution-specific .m3u8 files
        const masterPlaylists = [];  // main .m3u8 files
        const otherFiles = [];       // everything else
        
        files.forEach(file => {
          const name = file.name.toLowerCase();
          
          if (name.endsWith('.ts')) {
            segments.push(file);
          } else if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp')) {
            thumbnails.push(file);
          } else if (name.endsWith('.m3u8')) {
            // Check if it's a variant playlist (contains resolution like 720p, 1080p)
            if (/\d{3,4}p/.test(name)) {
              variantPlaylists.push(file);
            } else {
              masterPlaylists.push(file);
            }
          } else {
            otherFiles.push(file);
          }
        });
        
        // Sort variant playlists by resolution (lower first, as they're usually smaller)
        variantPlaylists.sort((a, b) => {
          const aRes = parseInt(a.name.match(/(\d{3,4})p/)?.[1] || '0');
          const bRes = parseInt(b.name.match(/(\d{3,4})p/)?.[1] || '0');
          return aRes - bRes;
        });
        
        // Combine in the correct order
        const sortedFiles = [
          ...segments,       // Upload segments first
          ...thumbnails,     // Then thumbnails
          ...otherFiles,     // Then other files
          ...variantPlaylists, // Then variant playlists (they reference segments)
          ...masterPlaylists   // Finally master playlists (they reference variant playlists)
        ];
        
        debugLogger.info('📋 HLS Upload Order:');
        debugLogger.info(`  1. Segments (.ts): ${segments.length} files`);
        debugLogger.info(`  2. Thumbnails: ${thumbnails.length} files`);
        debugLogger.info(`  3. Other files: ${otherFiles.length} files`);
        debugLogger.info(`  4. Variant playlists: ${variantPlaylists.length} files`);
        debugLogger.info(`  5. Master playlists: ${masterPlaylists.length} files`);
        debugLogger.debug('Detailed order:', sortedFiles.map(f => f.name));
        
        return sortedFiles;
      };
      
      const sortedFiles = sortFilesForHLS([...this.File]);
      
      // Upload files sequentially to ensure dependencies are uploaded first
      const uploadFilesSequentially = async () => {
        for (const file of sortedFiles) {
          if (!file.cid) continue;
          
          let options = { ...defaultOptions };
          options.cid = file.cid;
          
          try {
            // Wait for each upload to complete before starting the next
            await new Promise((resolve, reject) => {
              // Store the original onComplete and onError
              const originalOnComplete = options.onComplete;
              const originalOnError = options.onError;
              
              options.onComplete = (e, f) => {
                originalOnComplete(e, f);
                resolve();
              };
              
              options.onError = (e, f) => {
                originalOnError(e, f);
                // Continue with next file even if this one fails
                resolve();
              };
              
              uploadFile(file, options, file.cid);
            });
          } catch (err) {
            console.error(`Error uploading ${file.name}:`, err);
          }
        }
      };
      
      // Start the sequential upload process
      uploadFilesSequentially();
    },
  },
  computed: {
    hasFiles() {
      return Object.keys(this.files).length > 0;
    },
    unkeyed() {
      if (!this.encryption.encrypted) return false
      var accounts = Object.keys(this.encryption.accounts)
      for (var i = 0; i < accounts.length; i++) {
        if (!this.encryption.accounts[accounts[i]].enc_key) return true
      }
      return false
    },
    reallyReady() {
      return this.ready && !this.unkeyed
    },
    fileCount() {
      var thumbs = 0
      var files = 0
      for (var item in this.FileInfo) {
        if (this.FileInfo[item].use_thumb) thumbs++
        else if (this.FileInfo[item].is_thumb) { }
        else files++
      }
      if (!this.encryption.encrypted) return `${files} file${files > 1 ? 's' : ''} ${thumbs ? `with ${thumbs} thumbnail${thumbs > 1 ? 's' : ''}` : ''}`
      else return `${files} encrypted file${files > 1 ? 's' : ''}`
    },
    filesReady() {
      var files = 0
      for (var item in this.FileInfo) {
        if (!this.FileInfo[item].is_thumb)  files++
      }
      return files > 0
    },
    totalSize() {
      var size = 0
      var cids = []
      var names = Object.keys(this.FileInfo)
      if (!this.encryption.encrypted) for (var i = 0; i < names.length; i++) {
        if ((this.FileInfo[names[i]].is_thumb && this.FileInfo[names[i]].use_thumb) || !this.FileInfo[names[i]].is_thumb) {
          cids.push(this.FileInfo[names[i]].hash)
        }
      }
      else for (var i = 0; i < names.length; i++) {
        if (this.FileInfo[names[i]].enc_hash) {
          cids.push(this.FileInfo[names[i]].enc_hash)
        }
      }
      for (var name in this.FileInfo) {
        for (var i = 0; i < cids.length; i++) {
          if (this.FileInfo[name].hash == cids[i]) {
            size += this.File[this.FileInfo[name].index].size
            break;
          } else if (this.FileInfo[name].enc_hash == cids[i]) {
            size += this.File[this.FileInfo[name].enc_index].size
            break;
          }
        }
      }
      return size
    },
    isUploading() {
      return this.uploadInProgress;
    },
    combinedProgress() {
      let total = 0;
      let completed = 0;
      for (const progress in this.fileProgress) {
        total += this.fileProgress[progress].total;
        completed += this.fileProgress[progress].loaded;
      }
      return total > 0 ? (completed / total) * 100 : 0;
    },
    uploadedCount() {
      return this.completedFiles;
    },
    totalUploadCount() {
      // Count only non-thumbnail files that will be uploaded
      return Object.values(this.FileInfo).filter(file => 
        !file.is_thumb || (file.is_thumb && file.use_thumb)
      ).length;
    },
    mainFiles() {
      const main = Object.values(this.FileInfo).filter(file => 
        !file.is_thumb && !file.is_auxiliary
      );
      debugLogger.debug('Main files:', main.map(f => ({ name: f.name, flag: f.meta?.flag, is_auxiliary: f.is_auxiliary })));
      return main;
    },
    auxiliaryFiles() {
      const aux = Object.values(this.FileInfo).filter(file => 
        file.is_auxiliary || file.is_thumb
      );
      debugLogger.debug('Auxiliary files:', aux.map(f => ({ name: f.name, role: f.role, flag: f.meta?.flag, is_auxiliary: f.is_auxiliary, is_thumb: f.is_thumb })));
      return aux;
    }
  },
  mounted() {
    this.contract = this.propcontract;
    this.selectContract(this.contract.i, this.contract.b)
    this.encryption.key = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
    this.encryption.accounts[this.user.name] = {
      key: '',
      enc_key: '',
    }
  },
};