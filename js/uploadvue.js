export default {
    template: `
    <!--file uploader-->
    <Transition>
        <div v-if="contract.id" style="background: #16191C;">
            <div class="p-2">
                <form onsubmit="return false;">
                    <div
                        class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0 mx-2">Upload Files</h5>
                        <div class="flex-column ms-auto me-auto">
                            <input type="file" @change="uploadFile" multiple class="form-control bg-darkg border-secondary text-white-50" />
                        </div>
                        <button type="button"
                            class="btn-lg btn-close btn-close-white ms-2"
                            @click="contract.id = ''; contract.api = ''"
                            aria-label="Close"></button>
                    </div>
                    <div class="p-5 my-4 mx-3 text-center" id="img-well"
                        @drop="dragFile($event)" @dragenter.prevent
                        @dragover.prevent>
                        Or drag the file(s) here
                    </div>
                </form>
            </div>
            <div id="listOfImgs" v-for="(file, index) in File">
                <div class="p-3 mb-3 bg-dark" style="border-radius: 10px;">
                    <div class="d-flex align-items-center flex-row pb-2 mb-2">
                        <h6 class="m-0">{{file.name}}</h6>
                        <div class="flex-grow-1 mx-5">
                            <div class="progress" role="progressbar"
                                aria-label="Upload progress" aria-valuenow="25"
                                aria-valuemin="0" aria-valuemax="100">
                                <div class="progress-bar"
                                    :style="'width: ' + file.progress + '%'">
                                    {{file.progress}}%
                                </div>
                            </div>
                        </div>
                        <div class="flex-shrink" v-if="File.length">
                            <button type="button" class="me-2 btn btn-secondary"
                                v-if="file.actions.pause"
                                @click="fileRequest[index].resumeFileUpload()">Pause</button>
                            <button type="button" class="me-2 btn btn-secondary"
                                v-if="file.actions.resume"
                                @click="fileRequest[index].resumeFileUpload()">Resume</button>
                            <button type="button" class="me-2 btn btn-secondary"
                                v-if="file.actions.cancel"
                                @click="fileRequest[index].resumeFileUpload()">Cancel</button>
                        </div>
                        <div class="ms-auto">
                            <button class="btn btn-danger"
                                @click="deleteImg(index, file.name)"
                                data-toggle="tooltip" data-placement="top"
                                title="Delete Asset"><i
                                    class="fas fa-fw fa-trash-alt"></i></button>
                        </div>
                    </div>
                    <div class="d-flex w-100">
                        <ul class="text-start w-100">
                            <li class="">Bytes: {{file.size}}</li>
                            <li class="">CID:
                                {{FileInfo[file.name].hash}}</li>
                            <li class="">Status:
                                {{FileInfo[file.name].status}}
                            </li>
                            <li class=""><a
                                    :href="'https://ipfs.dlux.io/ipfs/' + FileInfo[file.name].hash"
                                    target="_blank">{{FileInfo[file.name].hash}}<i
                                        class="fa-solid fa-up-right-from-square fa-fw ms-1"></i></a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div v-if="File.length" class="text-center">
                <button type="button" class="btn btn-info mb-2"
                    @click="signNUpload()"><i
                        class="fa-solid fa-file-signature fa-fw me-2"></i>Sign
                    and
                    Upload</button>
            </div>
        </div>
    </Transition>
   `,
props: {
    files: {
        type: Object,
        default: {},
    },
},
data() {
    return {

    };
},
emits: [],
methods: {
},
computed: {
    hasFiles() {
        return Object.keys(this.files).length > 0;
    }
},
mounted() {
},
};