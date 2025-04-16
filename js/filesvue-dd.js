import ChoicesVue from '/js/choices-vue.js';
import Pop from "/js/pop.js";

export default {
    components: {
        "pop-vue": Pop,
        "choices-vue": ChoicesVue
    },
    template: `
<div ref="container" class="d-flex flex-grow-1 flex-column rounded" @contextmenu.prevent="showContextMenu($event, 'background', null)">
    <div class="pt-1">
<!-- USER INPUT -->
        <div v-if="cc" class="d-flex flex-column flex-grow-1 mb-1 mx-1">
            <label class="fs-5 fw-light mb-1">View other users' files, use <i
                    class="fa-brands fa-creative-commons fa-fw"></i> and <i
                    class="fa-brands fa-creative-commons-zero fa-fw"></i> licensed files, and decrypt files that have
                been shared with you</label>
            <div class="d-flex">
                <div class="position-relative flex-grow-1">
                    <span class="position-absolute top-50 translate-middle-y ps-2"><i
                            class="fa-solid fa-at fa-fw"></i></span>
                    <input class="ps-4 mb-1 form-control border-white" type="search" placeholder="username"
                        @blur="appendUserFiles()" v-model="newUser">
                </div>
                <div class="ms-1">
                    <div class="btn btn-lg btn-light" @click="appendUserFiles()"><i class="fa-solid fa-fw fa-plus"></i>
                    </div>
                </div>
            </div>

            <div class="d-flex flex-wrap d-xl-flex mb-1" v-if="owners.length > 1">
<!-- Active Filters -->
                <div v-for="owner in owners" class="btn-group btn-group me-1 mb-1" style="height:50px">
                    <a :href="'/@' + owner" target="_blank" class="btn btn-light rounded-start align-content-center">
                        <span>{{owner}}</span>
                    </a>
                    <button type="button" class="btn btn-dark ms-0 me-0 ps-0 pe-0" disabled>
                    </button>
                    <button type="button" @click="cycleView(owner)" class="btn btn-light px-2">
                        <i class="fa-solid fa-fw"
                            :class="{'fa-eye': filesSelect.addusers[owner] === true, 'fa-eye-slash': filesSelect.addusers[owner] === false, 'fa-lock': filesSelect.addusers[owner] == 'lock', 'fa-brands fa-creative-commons': filesSelect.addusers[owner] == 'cc'}"></i>
                        <i class="fa-solid fa-eye-slash fa-fw d-none"></i>
                    </button>
                    <button type="button" class="btn btn-dark ms-0 me-0 ps-0 pe-0" disabled>
                    </button>
                    <button @click="purge(owner)" type="button" class="btn btn-light px-2">
                        <i class="fa-solid fa-xmark fa-fw"></i>
                    </button>
                </div>

                <button @click="clearFilters()" type="button" class="btn btn-secondary mb-1 d-none">
                    Clear All
                </button>

            </div>
        </div>



<!-- ACTION BAR -->
        <div class="d-flex border-bottom border-white-50">
            <div class="d-flex flex-wrap align-items-center justify-content-center mx-1 flex-grow-1">

<!-- Search -->
                <div class="position-relative flex-grow-1 mb-1 me-1">
                    <span class="position-absolute top-50 translate-middle-y ps-2"><i
                            class="fa-solid fa-magnifying-glass fa-fw"></i></span>
                    <input @keyup="render()" @change="render()" @search="render()"
                        class="ps-4 form-control border-0 bg-dark text-info" type="search" placeholder="Search filename"
                        v-model="filesSelect.search">
                </div>

<!-- choices-js-->
                <div class=" mb-1 mx-1" style="min-width: 300px !important;">

                    <choices-vue ref="select-tag" :prop_selections="filterFlags" prop_function="search" prop_type="tags"
                        @data="handleTag($event)"></choices-vue>
                </div>
                <div class="mb-1 mx-1" style="min-width: 300px !important;">

                    <choices-vue ref="select-label" :prop_selections="filterLabels" prop_function="search"
                        prop_type="labels" @data="handleLabel($event)"></choices-vue>
                </div>

<!-- Sort -->
                <div class="dropdown ms-1 mb-1">
                    <button class="btn btn-dark w-100"
                        style="padding-top: 11px !important; padding-bottom: 11px !important;" type="button"
                        data-bs-toggle="dropdown" aria-expanded="false"><i class="fa-solid fa-sort fa-fw ms-1"></i>
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
        </div>

<!-- change view list / grid -->
        <div class="d-flex align-items-center my-1 mx-1">
            <h5 v-if="viewOpts.view === 'grid' || viewOpts.view === 'list'" class="mb-0">{{filesArray.length}} File{{filesArray.length > 1 ? 's' : ''}}</h5>
            <h5 v-else class="mb-0">{{ getSubfolderCount }} Folder{{ getSubfolderCount === 1 ? '' : 's' }} & {{ currentFileCount }} File{{ currentFileCount === 1 ? '' : 's' }}</h5>
            <button class="btn btn-success btn-sm ms-2" @click="saveChanges" v-if="Object.keys(pendingChanges).length > 0"><i class="fa-solid fa-save me-1"></i>Save</button>
            <button class="btn btn-danger btn-sm ms-2" @click="revertPendingChanges" v-if="Object.keys(pendingChanges).length > 0"><i class="fa-solid fa-undo me-1"></i>Revert</button>
            <div class="ms-auto">
                <div class="ms-auto">
                    <div class="btn-group">
                        <input type="radio" class="btn-check" :name="bid + 'smView'" :id="bid + 'setGrid'"
                            autocomplete="off" @click="setView('grid')" :checked="viewOpts.view === 'grid'" />
                        <label class="btn btn-outline-light" :for="bid + 'setGrid'"><i
                                class="fa-solid fa-table-cells-large fa-fw"></i></label>
                        <input type="radio" class="btn-check" :name="bid + 'smView'" :id="bid + 'setList'"
                            autocomplete="off" @click="setView('list')" :checked="viewOpts.view === 'list'" />
                        <label class="btn btn-outline-light" :for="bid + 'setList'"><i
                                class="fa-solid fa-table-list fa-fw"></i></label>
                        <input type="radio" class="btn-check" :name="bid + 'smView'" :id="bid + 'setFolder'"
                            autocomplete="off" @click="setView('folder')" :checked="viewOpts.view === 'folder'" />
                        <label class="btn btn-outline-light" :for="bid + 'setFolder'"><i
                                class="fa-solid fa-folder-tree fa-fw"></i></label>
                        <input type="radio" class="btn-check" :name="bid + 'smView'" :id="bid + 'setIcon'"
                            autocomplete="off" @click="setView('icon')" :checked="viewOpts.view === 'icon'" />
                        <label class="btn btn-outline-light" :for="bid + 'setIcon'"><i
                                class="fa-solid fa-icons fa-fw"></i></label>
                    </div>
                </div>
            </div>
        </div>
    </div>
<!-- Folder view -->
    <div v-if="viewOpts.view === 'folder' && selectedUser">
        <h3>@{{ selectedUser }}</h3>
        <div class="breadcrumb d-flex align-items-center">
            <span @click="navigateTo('')" @dragover.prevent="dragOverBreadcrumb($event)" @drop="dropOnBreadcrumb('', $event)" @dragenter="handleDragEnterBreadcrumb($event, '')" @dragleave="handleDragLeave" class="breadcrumb-item px-2 py-1 me-1" style="cursor: pointer; background-color: #333; border-radius: 4px;"><i class="fa-solid fa-hard-drive"></i></span>
            <template v-for="(part, index) in currentFolderPath.split('/').filter(Boolean)" :key="index">
                <span @click="navigateTo(currentFolderPath.split('/').slice(0, index + 1).join('/'))" @dragover.prevent="dragOverBreadcrumb($event)" @drop="dropOnBreadcrumb(currentFolderPath.split('/').slice(0, index + 1).join('/'), $event)" @dragenter="handleDragEnterBreadcrumb($event, currentFolderPath.split('/').slice(0, index + 1).join('/'))" @dragleave="handleDragLeave" class="breadcrumb-item px-2 py-1 me-1" style="cursor: pointer; background-color: #333; border-radius: 4px;">{{ part }}</span>
                <span class="mx-1">/</span>
            </template>
        </div>
        <div class="ms-2 d-flex align-items-center">
            <i class="fa-solid fa-file me-2" style="color: white;"></i>
            <div class="btn-group">
                <input type="radio" class="btn-check" :name="bid + 'fileView'" :id="bid + 'fileGrid'" autocomplete="off" @click="viewOpts.fileView = 'grid'" :checked="viewOpts.fileView === 'grid'" />
                <label class="btn btn-outline-light" :for="bid + 'fileGrid'"><i class="fa-solid fa-table-cells-large"></i></label>
                <input type="radio" class="btn-check" :name="bid + 'fileView'" :id="bid + 'fileList'" autocomplete="off" @click="viewOpts.fileView = 'list'" :checked="viewOpts.fileView === 'list'" />
                <label class="btn btn-outline-light" :for="bid + 'fileList'"><i class="fa-solid fa-table-list"></i></label>
                <button class="btn btn-outline-light ms-1"><i class="fa-solid fa-gear"></i></button>
            </div>
            <button class="btn btn-success btn-sm ms-2" @click="saveChanges" v-if="Object.keys(pendingChanges).length > 0"><i class="fa-solid fa-save me-1"></i>Save</button>
            <button class="btn btn-danger btn-sm ms-2" @click="revertPendingChanges" v-if="Object.keys(pendingChanges).length > 0"><i class="fa-solid fa-undo me-1"></i>Revert</button>
        </div>
        <div class="files" @contextmenu.prevent="showContextMenu($event, 'background', null)" @dragover="dragOverBackground($event)" @drop="dropOnBackground($event)" style="position: relative; min-height: 200px;">
<!-- List Mode -->
            <div v-if="viewOpts.fileView === 'list'">
                <table class="table table-dark table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Preview</th>
                            <th>Filename</th>
                            <th>Owner</th>
                            <th>Size</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="folder in getSubfolders(selectedUser, currentFolderPath)" :key="'folder-' + folder.path" class="folder-row" @click="navigateTo(folder.path)" @contextmenu.prevent.stop="showContextMenu($event, 'folder', folder)" @dragover="dragOverFolder($event)" @drop="dropOnFolder($event, folder)" @dragenter="handleDragEnterFolder($event, folder)" @dragleave="handleDragLeave">
                            <td><i class="fa-solid fa-folder"></i></td>
                            <td>{{ folder.name }}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr v-for="file in getFiles(selectedUser, currentFolderPath)" :key="file.f" draggable="true" @dragstart="dragStartFile($event, file)">
                            <td>
                                <img v-if="newMeta[file.i][file.f].thumb && isValidThumb(newMeta[file.i][file.f].thumb_data)" :src="isValidThumb(newMeta[file.i][file.f].thumb_data)" class="img-fluid" width="50" />
                                <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve" width="50">
                                    <g>
                                        <path class="st0" d="M650,210H500c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10s10,4.5,10,10v140h140c5.5,0,10,4.5,10,10 S655.5,210,650,210z" />
                                        <path class="st0" d="M650,309.7c-5.5,0-10-4.5-10-10v-95.5L495.9,60H200c-22.1,0-40,17.9-40,40v196.3c0,5.5-4.5,10-10,10 s-10-4.5-10-10V100c0-33.1,26.9-60,60-60h300c2.7,0,5.2,1,7.1,2.9l150,150c1.9,1.9,2.9,4.4,2.9,7.1v99.7 C660,305.2,655.5,309.7,650,309.7z" />
                                        <path class="st0" d="M600,760H200c-33.1,0-60-26.9-60-60V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150c0,22.1,17.9,40,40,40h400 c22.1,0,40-17.9,40-40V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150C660,733.1,633.1,760,600,760z" />
                                        <path class="st0" d="M550,560H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h300c5.5,0,10,4.5,10,10S555.5,560,550,560z" />
                                        <path class="st0" d="M400,660H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h150c5.5,0,10,4.5,10,10S405.5,660,400,660z" />
                                        <path class="st0" d="M650,560H150c-33.1,0-60-26.9-60-60l0,0V346.3c0-33.1,26.9-60,60-60l0,0h0.4l500,3.3 c32.9,0.3,59.5,27.1,59.6,60V500C710,533.1,683.2,560,650,560C650,560,650,560,650,560z M150,306.3c-22.1,0-40,17.9-40,40V500 c0,22.1,17.9,40,40,40h500c22.1,0,40-17.9,40-40V349.7c-0.1-22-17.8-39.8-39.8-40l-500-3.3H150z" />
                                        <text transform="matrix(1 0 0 1 233.3494 471.9725)" class="st1 st2" style="text-transform: uppercase; font-size: 149px;">{{newMeta[file.i][file.f].type}}</text>
                                    </g>
                                </svg>
                            </td>
                            <td>{{ newMeta[file.i][file.f].name || file.f }}</td>
                            <td>@{{ file.o }}</td>
                            <td>{{ fancyBytes(file.s) }}</td>
                            <td>
                                <a v-if="!newMeta[file.i][file.f].encrypted" :href="'https://ipfs.dlux.io/ipfs/' + file.f" target="_blank" class="btn btn-sm btn-info">URL</a>
                                <button v-if="newMeta[file.i][file.f].encrypted && contract[file.i].encryption.key" class="btn btn-sm btn-primary" @click="downloadFile(file.f, file.i)">Download</button>
                            </td>
                        </tr>
                        <!-- Empty state row -->
                        <tr v-if="getSubfolders(selectedUser, currentFolderPath).length === 0 && getFiles(selectedUser, currentFolderPath).length === 0">
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
<!-- Grid Mode -->
            <div v-if="viewOpts.fileView === 'grid'" class="d-flex flex-wrap" style="background-color: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px;">
                <div v-for="folder in getSubfolders(selectedUser, currentFolderPath)" :key="folder.path" 
                     class="file-grid m-2 p-2 rounded text-center" 
                     :class="{ 'bg-dark': !isFolderSelected(folder), 'bg-primary': isFolderSelected(folder) }"
                     :data-key="folder.path"  
                     :data-type="'folder'"
                     draggable="true"
                     @dragstart="dragStartItem($event, folder, 'folder')"
                     @dblclick="navigateTo(folder.path)" 
                     @click="handleFolderClick($event, folder)"
                     @contextmenu.prevent.stop="showContextMenu($event, 'folder', folder)" 
                     @dragover="dragOverFolder($event)" 
                     @drop="dropOnFolder($event, folder)" 
                     @dragenter="handleDragEnterFolder($event, folder)" 
                     @dragleave="handleDragLeave"
                     style="width: 120px; height: 120px; position: relative; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.2); cursor: pointer;"
                     @mouseenter="$event.currentTarget.style.transform = 'translateY(-3px)'; $event.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'; $event.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'"
                     @mouseleave="$event.currentTarget.style.transform = ''; $event.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'; $event.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'">
                    <div class="d-flex align-items-center justify-content-center" style="height: 70px; width: 100%;">
                        <i class="fa-solid fa-folder fa-3x" style="color: #ffd166;"></i>
                </div>
                    <div class="text-truncate mt-2" style="max-width: 110px; font-size: 0.9rem;">{{ folder.name }}</div>
                </div>
                <div v-for="file in getFiles(selectedUser, currentFolderPath)" :key="file.f" 
                     class="file-grid m-2 p-2 rounded text-center" 
                     :class="{ 'bg-primary': isFileSelected(file) }"
                     :data-key="file.f"  
                     :data-type="'file'"
                     :data-file-id="file.f"
                     draggable="true" 
                     @dragstart="dragStartItem($event, file, 'file')" 
                     @click="handleFileClick($event, file)"
                     @contextmenu.prevent.stop="showContextMenu($event, 'file', file)"
                     style="width: 120px; height: 120px; position: relative; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.2); cursor: pointer;"
                     @mouseenter="$event.currentTarget.style.transform = 'translateY(-3px)'; $event.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'; $event.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'"
                     @mouseleave="$event.currentTarget.style.transform = ''; $event.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'; $event.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'">
                    <div class="file-icon-container d-flex align-items-center justify-content-center" style="height: 70px; width: 100%;">
                        <img v-if="newMeta[file.i][file.f].thumb && isValidThumb(newMeta[file.i][file.f].thumb_data)" :src="isValidThumb(newMeta[file.i][file.f].thumb_data)" class="img-fluid" style="max-height: 70px; max-width: 100%; object-fit: contain;" />
                        <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve" width="70">
                            <g>
                                <path class="st0" d="M650,210H500c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10s10,4.5,10,10v140h140c5.5,0,10,4.5,10,10 S655.5,210,650,210z" />
                                <path class="st0" d="M650,309.7c-5.5,0-10-4.5-10-10v-95.5L495.9,60H200c-22.1,0-40,17.9-40,40v196.3c0,5.5-4.5,10-10,10 s-10-4.5-10-10V100c0-33.1,26.9-60,60-60h300c2.7,0,5.2,1,7.1,2.9l150,150c1.9,1.9,2.9,4.4,2.9,7.1v99.7 C660,305.2,655.5,309.7,650,309.7z" />
                                <path class="st0" d="M600,760H200c-33.1,0-60-26.9-60-60V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150c0,22.1,17.9,40,40,40h400 c22.1,0,40-17.9,40-40V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150C660,733.1,633.1,760,600,760z" />
                                <path class="st0" d="M550,560H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h300c5.5,0,10,4.5,10,10S555.5,560,550,560z" />
                                <path class="st0" d="M400,660H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h150c5.5,0,10,4.5,10,10S405.5,660,400,660z" />
                                <path class="st0" d="M650,560H150c-33.1,0-60-26.9-60-60l0,0V346.3c0-33.1,26.9-60,60-60l0,0h0.4l500,3.3 c32.9,0.3,59.5,27.1,59.6,60V500C710,533.1,683.2,560,650,560C650,560,650,560,650,560z M150,306.3c-22.1,0-40,17.9-40,40V500 c0,22.1,17.9,40,40,40h500c22.1,0,40-17.9,40-40V349.7c-0.1-22-17.8-39.8-39.8-40l-500-3.3H150z" />
                                <text transform="matrix(1 0 0 1 233.3494 471.9725)" class="st1 st2" style="text-transform: uppercase; font-size: 149px;">{{newMeta[file.i][file.f].type}}</text>
                            </g>
                        </svg>
                    </div>
                    <div class="text-truncate mt-2" style="max-width: 110px; font-size: 0.9rem;">{{ newMeta[file.i][file.f].name || file.f }}</div>
                    <div v-if="flagsDecode(newMeta[file.i][file.f].flags, 1).length" class="position-absolute bottom-0 end-0 bg-dark rounded-circle p-1" style="margin: 2px;">
                        <i class="fa-solid fa-lock fa-sm"></i>
                    </div>
                </div>
                
                <!-- Empty state for grid view -->
                <div v-if="getSubfolders(selectedUser, currentFolderPath).length === 0 && getFiles(selectedUser, currentFolderPath).length === 0" 
                     class="w-100 text-center p-5 d-flex flex-column align-items-center justify-content-center" 
                     style="min-height: 180px; background-color: rgba(255,255,255,0.05); border-radius: 8px; border: 1px dashed rgba(255,255,255,0.2); margin: 10px;">
                    <i class="fa-solid fa-folder-open fa-3x mb-3" style="color: #adb5bd;"></i>
                    <p class="text-muted">This folder is empty. Drag and drop files here or create a new folder.</p>
                    <button class="btn btn-outline-secondary btn-sm mt-2" @click="createNewFolder">
                        <i class="fa-solid fa-folder-plus me-1"></i>New Folder
                    </button>
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
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="folder in getSubfolders(selectedUser, currentFolderPath)" :key="'folder-' + folder.path" class="folder-row" @dblclick="navigateTo(folder.path)" @contextmenu.prevent.stop="showContextMenu($event, 'folder', folder)" @dragover="dragOverFolder($event)" @drop="dropOnFolder($event, folder)" @dragenter="handleDragEnterFolder($event, folder)" @dragleave="handleDragLeave">
                            <td><i class="fa-solid fa-folder"></i></td>
                            <td>{{ folder.name }}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr v-for="file in getFiles(selectedUser, currentFolderPath)" :key="file.f" 
                            :class="{ 'table-primary': isFileSelected(file) }"
                            draggable="true" 
                            @dragstart="dragStartItem($event, file, 'file')" 
                     @click="handleFileClick($event, file)"
                     @contextmenu.prevent.stop="showContextMenu($event, 'file', file)">
                            <td>
                                <img v-if="newMeta[file.i][file.f].thumb && isValidThumb(newMeta[file.i][file.f].thumb_data)" :src="isValidThumb(newMeta[file.i][file.f].thumb_data)" class="img-fluid" width="50" />
                                <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve" width="50">
                                    <g>
                                        <path class="st0" d="M650,210H500c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10s10,4.5,10,10v140h140c5.5,0,10,4.5,10,10 S655.5,210,650,210z" />
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
                        </tr>
                        <!-- Empty state row for table view -->
                        <tr v-if="getSubfolders(selectedUser, currentFolderPath).length === 0 && getFiles(selectedUser, currentFolderPath).length === 0">
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
            
            <!-- Empty state indicator for both views when folder is empty -->
            <div v-if="getSubfolders(selectedUser, currentFolderPath).length === 0 && getFiles(selectedUser, currentFolderPath).length === 0 && viewOpts.fileView !== 'grid'" 
                 class="w-100 text-center p-5 d-flex flex-column align-items-center justify-content-center" 
                 style="min-height: 150px;">
                <i class="fa-solid fa-folder-open fa-3x mb-3"></i>
                <p class="text-muted">This folder is empty. Drag and drop files here or create a new folder.</p>
            </div>
        </div>
    </div>
<!-- Icon View -->
    <div v-else-if="viewOpts.view === 'icon' && selectedUser" class="d-flex flex-wrap">
        <h3>@{{ selectedUser }}</h3>
        <div class="breadcrumb d-flex align-items-center">
            <span @click="navigateTo('')" @dragover.prevent="dragOverBreadcrumb($event)" @drop="dropOnBreadcrumb('', $event)" @dragenter="handleDragEnterBreadcrumb($event, '')" @dragleave="handleDragLeave" class="breadcrumb-item px-2 py-1 me-1" style="cursor: pointer; background-color: #333; border-radius: 4px;"><i class="fa-solid fa-hard-drive"></i></span>
            <template v-for="(part, index) in currentFolderPath.split('/').filter(Boolean)" :key="index">
                <span @click="navigateTo(currentFolderPath.split('/').slice(0, index + 1).join('/'))" @dragover.prevent="dragOverBreadcrumb($event)" @drop="dropOnBreadcrumb(currentFolderPath.split('/').slice(0, index + 1).join('/'), $event)" @dragenter="handleDragEnterBreadcrumb($event, currentFolderPath.split('/').slice(0, index + 1).join('/'))" @dragleave="handleDragLeave" class="breadcrumb-item px-2 py-1 me-1" style="cursor: pointer; background-color: #333; border-radius: 4px;">{{ part }}</span>
                <span class="mx-1">/</span>
            </template>
        </div>
        <div class="d-flex justify-content-end w-100 my-2">
            <button class="btn btn-secondary btn-sm" @click="createNewFolder"><i class="fa-solid fa-folder-plus me-1"></i>New Folder</button>
            <button class="btn btn-success btn-sm ms-2" @click="saveChanges" v-if="Object.keys(pendingChanges).length > 0"><i class="fa-solid fa-save me-1"></i>Save</button>
            <button class="btn btn-danger btn-sm ms-2" @click="revertPendingChanges" v-if="Object.keys(pendingChanges).length > 0"><i class="fa-solid fa-undo me-1"></i>Revert</button>
            <div class="btn-group ms-2">
                <button class="btn btn-sm" :class="viewOpts.fileView === 'grid' ? 'btn-primary' : 'btn-secondary'" @click="viewOpts.fileView = 'grid'"><i class="fa-solid fa-th-large"></i></button>
                <button class="btn btn-sm" :class="viewOpts.fileView === 'list' ? 'btn-primary' : 'btn-secondary'" @click="viewOpts.fileView = 'list'"><i class="fa-solid fa-list"></i></button>
            </div>
        </div>
        <div class="files" @contextmenu.prevent="showContextMenu($event, 'background', null)" 
             @dragover="dragOverBackground($event)" 
             @drop="dropOnBackground($event)"
             @mousedown="startSelectionBox($event)"
             @mousemove="updateSelectionBox($event)"
             @mouseup="endSelectionBox"
             style="position: relative; min-height: 200px;">
            <!-- Remove the template-based selection box overlay -->
            
            <div v-if="viewOpts.fileView === 'grid'" class="d-flex flex-wrap" style="background-color: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px;">
                <div v-for="folder in getSubfolders(selectedUser, currentFolderPath)" :key="folder.path" 
                     class="file-grid m-2 p-2 rounded text-center" 
                     :class="{ 'bg-dark': !isFolderSelected(folder), 'bg-primary': isFolderSelected(folder) }"
                     :data-key="folder.path"  
                     :data-type="'folder'"
                     draggable="true"
                     @dragstart="dragStartItem($event, folder, 'folder')"
                     @dblclick="navigateTo(folder.path)" 
                     @click="handleFolderClick($event, folder)"
                     @contextmenu.prevent.stop="showContextMenu($event, 'folder', folder)" 
                     @dragover="dragOverFolder($event)" 
                     @drop="dropOnFolder($event, folder)" 
                     @dragenter="handleDragEnterFolder($event, folder)" 
                     @dragleave="handleDragLeave"
                     style="width: 120px; height: 120px; position: relative; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.2); cursor: pointer;"
                     @mouseenter="$event.currentTarget.style.transform = 'translateY(-3px)'; $event.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'; $event.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'"
                     @mouseleave="$event.currentTarget.style.transform = ''; $event.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'; $event.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'">
                    <div class="d-flex align-items-center justify-content-center" style="height: 70px; width: 100%;">
                        <i class="fa-solid fa-folder fa-3x" style="color: #ffd166;"></i>
                    </div>
                    <div class="text-truncate mt-2" style="max-width: 110px; font-size: 0.9rem;">{{ folder.name }}</div>
                </div>
                <div v-for="file in getFiles(selectedUser, currentFolderPath)" :key="file.f" 
                     class="file-grid m-2 p-2 rounded text-center" 
                     :class="{ 'bg-primary': isFileSelected(file) }"
                     :data-key="file.f"  
                     :data-type="'file'"
                     :data-file-id="file.f"
                     draggable="true" 
                     @dragstart="dragStartItem($event, file, 'file')" 
                     @click="handleFileClick($event, file)"
                     @contextmenu.prevent.stop="showContextMenu($event, 'file', file)"
                     style="width: 120px; height: 120px; position: relative; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.2); cursor: pointer;"
                     @mouseenter="$event.currentTarget.style.transform = 'translateY(-3px)'; $event.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'; $event.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'"
                     @mouseleave="$event.currentTarget.style.transform = ''; $event.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'; $event.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'">
                    <div class="file-icon-container d-flex align-items-center justify-content-center" style="height: 70px; width: 100%;">
                        <img v-if="newMeta[file.i][file.f].thumb && isValidThumb(newMeta[file.i][file.f].thumb_data)" :src="isValidThumb(newMeta[file.i][file.f].thumb_data)" class="img-fluid" style="max-height: 70px; max-width: 100%; object-fit: contain;" />
                        <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve" width="70">
                            <g>
                                <path class="st0" d="M650,210H500c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10s10,4.5,10,10v140h140c5.5,0,10,4.5,10,10 S655.5,210,650,210z" />
                                <path class="st0" d="M650,309.7c-5.5,0-10-4.5-10-10v-95.5L495.9,60H200c-22.1,0-40,17.9-40,40v196.3c0,5.5-4.5,10-10,10 s-10-4.5-10-10V100c0-33.1,26.9-60,60-60h300c2.7,0,5.2,1,7.1,2.9l150,150c1.9,1.9,2.9,4.4,2.9,7.1v99.7 C660,305.2,655.5,309.7,650,309.7z" />
                                <path class="st0" d="M600,760H200c-33.1,0-60-26.9-60-60V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150c0,22.1,17.9,40,40,40h400 c22.1,0,40-17.9,40-40V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150C660,733.1,633.1,760,600,760z" />
                                <path class="st0" d="M550,560H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h300c5.5,0,10,4.5,10,10S555.5,560,550,560z" />
                                <path class="st0" d="M400,660H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h150c5.5,0,10,4.5,10,10S405.5,660,400,660z" />
                                <path class="st0" d="M650,560H150c-33.1,0-60-26.9-60-60l0,0V346.3c0-33.1,26.9-60,60-60l0,0h0.4l500,3.3 c32.9,0.3,59.5,27.1,59.6,60V500C710,533.1,683.2,560,650,560C650,560,650,560,650,560z M150,306.3c-22.1,0-40,17.9-40,40V500 c0,22.1,17.9,40,40,40h500c22.1,0,40-17.9,40-40V349.7c-0.1-22-17.8-39.8-39.8-40l-500-3.3H150z" />
                                <text transform="matrix(1 0 0 1 233.3494 471.9725)" class="st1 st2" style="text-transform: uppercase; font-size: 149px;">{{newMeta[file.i][file.f].type}}</text>
                            </g>
                        </svg>
                </div>
                    <div class="text-truncate mt-2" style="max-width: 110px; font-size: 0.9rem;">{{ newMeta[file.i][file.f].name || file.f }}</div>
                    <div v-if="flagsDecode(newMeta[file.i][file.f].flags, 1).length" class="position-absolute bottom-0 end-0 bg-dark rounded-circle p-1" style="margin: 2px;">
                        <i class="fa-solid fa-lock fa-sm"></i>
                    </div>
                </div>
                
                <!-- Empty state for grid view -->
                <div v-if="getSubfolders(selectedUser, currentFolderPath).length === 0 && getFiles(selectedUser, currentFolderPath).length === 0" 
                     class="w-100 text-center p-5 d-flex flex-column align-items-center justify-content-center" 
                     style="min-height: 180px; background-color: rgba(255,255,255,0.05); border-radius: 8px; border: 1px dashed rgba(255,255,255,0.2); margin: 10px;">
                    <i class="fa-solid fa-folder-open fa-3x mb-3" style="color: #adb5bd;"></i>
                    <p class="text-muted">This folder is empty. Drag and drop files here or create a new folder.</p>
                    <button class="btn btn-outline-secondary btn-sm mt-2" @click="createNewFolder">
                        <i class="fa-solid fa-folder-plus me-1"></i>New Folder
                    </button>
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
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="folder in getSubfolders(selectedUser, currentFolderPath)" :key="'folder-' + folder.path" class="folder-row" @dblclick="navigateTo(folder.path)" @contextmenu.prevent.stop="showContextMenu($event, 'folder', folder)" @dragover="dragOverFolder($event)" @drop="dropOnFolder($event, folder)" @dragenter="handleDragEnterFolder($event, folder)" @dragleave="handleDragLeave">
                            <td><i class="fa-solid fa-folder"></i></td>
                            <td>{{ folder.name }}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr v-for="file in getFiles(selectedUser, currentFolderPath)" :key="file.f" 
                            :class="{ 'table-primary': isFileSelected(file) }"
                            draggable="true" 
                            @dragstart="dragStartItem($event, file, 'file')" 
                            @click="handleFileClick($event, file)"
                            @contextmenu.prevent.stop="showContextMenu($event, 'file', file)">
                            <td>
                                <img v-if="newMeta[file.i][file.f].thumb && isValidThumb(newMeta[file.i][file.f].thumb_data)" :src="isValidThumb(newMeta[file.i][file.f].thumb_data)" class="img-fluid" width="50" />
                                <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve" width="50">
                                    <g>
                                        <path class="st0" d="M650,210H500c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10s10,4.5,10,10v140h140c5.5,0,10,4.5,10,10S555.5,210,550,210z" />
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
                        </tr>
                        <!-- Empty state row for table view -->
                        <tr v-if="getSubfolders(selectedUser, currentFolderPath).length === 0 && getFiles(selectedUser, currentFolderPath).length === 0">
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
            
            <!-- Empty state indicator for both views when folder is empty -->
            <div v-if="getSubfolders(selectedUser, currentFolderPath).length === 0 && getFiles(selectedUser, currentFolderPath).length === 0 && viewOpts.fileView !== 'grid'" 
                 class="w-100 text-center p-5 d-flex flex-column align-items-center justify-content-center" 
                 style="min-height: 150px;">
                <i class="fa-solid fa-folder-open fa-3x mb-3"></i>
                <p class="text-muted">This folder is empty. Drag and drop files here or create a new folder.</p>
            </div>
        </div>
    </div>
<!-- list view -->

    <div class="text-center" role="table" aria-label="Files" v-else-if="viewOpts.view === 'list'">
        <div class="d-flex flex-wrap align-items-center fw-bold justify-content-end border-top border-start border-end border-dark"
            role="rowgroup" style="background-color: #1976D2">
            <div class="py-1 border-bottom border-dark" role="columnheader" style="width:70px">&nbsp;</div>
            <div class="py-1 border-start border-bottom border-dark flex-grow-1 first" role="columnheader"
                style="max-width:480px">Filename</div>
            <div class="py-1 border-start border-bottom border-dark" role="columnheader" style="width:150px">Tags &
                Labels</div>
            <div class="py-1 border-start border-bottom border-dark" role="columnheader" style="width:150px">Owner
            </div>
            <div class="py-1 border-start border-bottom border-dark" role="columnheader" style="width:80px">Size
            </div>
            <div class="py-1 border-start border-bottom border-dark" role="columnheader" style="width:100px">Created
            </div>
            <div class="py-1 border-start border-bottom border-dark" role="columnheader" style="width:146px">
                Expiration</div>
            <div class="py-1 border-start border-bottom border-dark" role="columnheader" style="width:120px">&nbsp;
            </div>
        </div>
        <div class="flex-table bg-dark-2 d-flex flex-wrap align-items-center justify-content-end" role="rowgroup"
            v-for="file in filesArray">
            <div class="" role="cell">
                <div style="width: 70px;">


                    <div class="d-flex bg-light position-relative rounded first m-1" style="width: 50px;">
                        <div v-if="flagsDecode(newMeta[file.i][file.f].flags, 1).length"
                            class="position-absolute bottom-0 end-0 bg-dark rounded-circle small px-05">
                            <i class="fa-solid fa-lock"></i>
                        </div>
                        <img v-if="newMeta[file.i][file.f].thumb && isValidThumb(newMeta[file.i][file.f].thumb_data)"
                            class="img-fluid rounded" :src="isValidThumb(newMeta[file.i][file.f].thumb_data)">
                        <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 800 800"
                            style="enable-background:new 0 0 800 800;" xml:space="preserve">
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
                                    style="text-transform: uppercase; font-size: 149px;">{{newMeta[file.i][file.f].type}}</text>
                            </g>
                        </svg>
                    </div>

                </div>
            </div>
            <div class="flex-grow-1 first" role="cell">
                <div style="max-width:480px;">
                    <div class="text-start text-break m-1">{{newMeta[file.i][file.f].name ||
                        file.f}}{{newMeta[file.i][file.f].thumb ? '.' + newMeta[file.i][file.f].type : ''}}</div>
                </div>
            </div>

            <div class="" role="cell">
                <div style="width:150px;">
                    <div
                        class="d-flex flex-wrap align-items-center justify-content-center bg-darkg rounded px-1 py-05 m-1">
                        <div>&nbsp;</div>
<!-- colors -->
                        <div v-if="file.lc" class="d-flex me-1 align-items-center" style="margin-left: 15px">
                            <i v-for="(color, num) in labelsDecode(file.lc)" :class="color.fa"
                                :style="'margin-left: ' + -15 +'px !important;'"></i>
                        </div>
<!-- labels -->
                        <div class="me-1" v-for="label in labelsDecode(file.ll)">
                            <span class="d-flex align-items-center">
                                <pop-vue :id=" bid + 'popperL-' + file.i + file.index + label.l + (cc ? 'cc' : '')"
                                    :title="label.l" trigger="hover">
                                    <i :class="label.fa"></i>
                                </pop-vue>
                            </span>
                        </div>
<!-- flags -->
                        <div class="d-flex align-items-center">
                            <div v-for="flag in flagsDecode(newMeta[file.i][file.f].flags, 0, 3)">
<!-- title="Labels"  -->
                                <pop-vue :id=" bid + 'popper-' + file.i + file.index + flag.l + (cc ? 'cc' : '')"
                                    :title="flag.l" trigger="hover">
                                    <i :class="flag.fa"></i>
                                </pop-vue>
                            </div>
                        </div>
                        <div>
                            <pop-vue v-if="licenses[file.lic]" v-for="lic in licenses[file.lic].fa"
                                :id=" bid + 'popper-Lic' + (cc ? 'cc' : '') + file.i + file.index + file.lic"
                                :title="lic.l" trigger="hover">
                                <i :class="lic.fa"></i>
                            </pop-vue>
                        </div>
                    </div>
                </div>
            </div>
            <div class="" role="cell">
                <div style="width:150px">
                    <div class="m-1"><a :href="'/@' + contract[file.i].t">@{{contract[file.i].t}}</a></div>
                </div>
            </div>
            <div class="" role="cell">
                <div style="width:80px">
                    <div class="m-1">{{fancyBytes(file.s)}}</div>
                </div>
            </div>
            <div class="" role="cell">
                <div style="width:100px">
                    <div class="m-1">{{blockToTime(file.c)}}</div>
                </div>
            </div>
            <div class="">
                <div style="width: 146px;" role="cell">
                    <div class="border rounded px-1 py-05 m-1"
                        :class="{'border-success': newMeta[file.i].contract.autoRenew, 'border-warning': !newMeta[file.i].contract.autoRenew}">
                        {{blockToTime(file.e)}}
                        <i :class="{'text-success': newMeta[file.i].contract.autoRenew, 'text-warning': !newMeta[file.i].contract.autoRenew}"
                            class="ms-05 fa-solid fa-arrows-rotate fa-fw"></i>
                    </div>
                </div>
            </div>
            <div class="" role="cell">
                <div class="" style="width: 120px;">
                    <div class="m-1">
<!-- link -->
                        <div v-if="!newMeta[file.i][file.f].encrypted">
                            <a :href="'https://ipfs.dlux.io/ipfs/' + file.f" target="_blank"
                                class="w-100 btn btn-sm btn-info my-1 mx-auto"><span
                                    class="d-flex align-items-center">URL<i
                                        class="ms-auto fa-solid fa-fw fa-up-right-from-square"></i></span></a>
                        </div>
<!-- decrypt  -->
                        <div v-if="newMeta[file.i][file.f].encrypted && !contract[file.i].encryption.key">
                            <button type="button" class="w-100 btn btn-sm btn-primary my-1 mx-auto"
                                @click="decode(file.i)"><span class="d-flex align-items-center w-100">Decrypt<i
                                        class="fa-solid fa-fw ms-auto fa-lock-open"></i></span></button>
                        </div>
<!-- download enc -->
                        <div v-if="newMeta[file.i][file.f].encrypted && contract[file.i].encryption.key">
                            <button type="button" class="w-100 btn btn-sm btn-primary my-1 mx-auto"
                                @click="downloadFile(file.f, file.i)"><span
                                    class="d-flex align-items-center w-100">Download<i
                                        class="fa-solid fa-download fa-fw ms-auto"></i></span></button>
                        </div>
<!-- add to post -->
                        <div v-if="assets">
                            <button type="button" class="w-100 btn btn-sm btn-purp my-1 mx-auto"
                                @click="addToPost(file.f, contract.i, index)"><span
                                    class="d-flex align-items-center w-100"><span class="d-sm-none">Add to</span>
                                    Post<i class="fa-solid fa-plus fa-fw ms-auto"></i></span></button>
                        </div>
<!-- add to asset -->
                        <div v-if="assets">
                            <button type="button" class="w-100 btn btn-sm btn-purp my-1 mx-auto"
                                @click="addAsset(file, contract)"><span
                                    class="d-flex align-items-center w-100"><span class="d-sm-none">Add to
                                    </span>Asset<i class="fa-solid fa-plus fa-fw ms-auto"></i></span></button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        <div class="flex-table header" role="rowgroup">
            <div class="flex-row order-md-first" role="columnheader"></div>
            <div class="flex-row order-first first flex-grow-1" role="columnheader">Filename</div>
            <div class="flex-row" role="columnheader">Owner</div>
            <div class="flex-row" role="columnheader">Tags & Labels</div>
            <div class="flex-row" role="columnheader">Size</div>
            <div class="flex-row" role="columnheader">Created</div>
            <div class="flex-row" role="columnheader">Expiration</div>
            <div class="flex-row" role="columnheader"></div>
        </div>
        <div class="flex-table row" role="rowgroup" v-for="file in filesArray">
            <div class="flex-row order-md-first" role="cell">
                <div class="bg-light mx-auto" style="width:50px;">
                    <img v-if="newMeta[file.i][file.f].thumb && isValidThumb(newMeta[file.i][file.f].thumb_data)"
                        class="mx-auto img-fluid rounded bg-light"
                        :src="isValidThumb(newMeta[file.i][file.f].thumb_data)" width="50px">
                    <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg"
                        xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 800 800"
                        style="enable-background:new 0 0 800 800;" xml:space="preserve">
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
                                style="text-transform: uppercase; font-size: 149px;">{{newMeta[file.i][file.f].type}}</text>
                        </g>
                    </svg>
                </div>
            </div>
            <div class="flex-row order-first first flex-grow-1" role="cell">{{newMeta[file.i][file.f].name ||
                file.f}}{{newMeta[file.i][file.f].thumb ? '.' + newMeta[file.i][file.f].type : ''}}</div>
            <div class="flex-row " role="cell">@{{contract[file.i].t}}</div>
            <div class="flex-row" role="cell">
                <div class="d-flex flex-wrap align-items-center justify-content-center">
<!-- colors -->
                    <div v-if="file.lc" class="d-flex me-1 align-items-center" style="margin-left: 15px">
                        <i v-for="(color, num) in labelsDecode(file.lc)" :class="color.fa"
                            :style="'margin-left: ' + -15 +'px !important;'"></i>
                    </div>
<!-- labels -->
                    <div class="me-1" v-for="label in labelsDecode(file.ll)">
                        <span class="d-flex align-items-center">
                            <pop-vue :id=" bid + 'popperL-' + file.i + file.index + label.l + (cc ? 'cc' : '')"
                                :title="label.l" trigger="hover">
                                <i :class="label.fa"></i>
                            </pop-vue>
                        </span>
                    </div>
<!-- flags -->
                    <div class="d-flex align-items-center">
                        <div v-for="flag in flagsDecode(newMeta[file.i][file.f].flags, 0, 3)">
<!-- title="Labels"  -->
                            <pop-vue :id=" bid + 'popper-' + file.i + file.index + flag.l + (cc ? 'cc' : '')"
                                :title="flag.l" trigger="hover">
                                <i :class="flag.fa"></i>
                            </pop-vue>
                        </div>
                    </div>
                    <div>
                        <pop-vue v-if="licenses[file.lic]" v-for="lic in licenses[file.lic].fa"
                            :id=" bid + 'popper-Lic' + (cc ? 'cc' : '') + file.i + file.index + file.lic"
                            :title="lic.l" trigger="hover">
                            <i :class="lic.fa"></i>
                        </pop-vue>
                    </div>
                </div>
            </div>
            <div class="flex-row" role="cell">{{fancyBytes(file.s)}}</div>
            <div class="flex-row" role="cell">{{blockToTime(file.c)}}</div>
            <div class="flex-row" role="cell">{{blockToTime(file.e)}}<i v-if="newMeta[file.i].contract.autoRenew"
                    class="fa-solid fa-arrows-rotate text-success fa-fw"></i></div>
            <div class="flex-row" role="cell">
                <div class="mt-1">
<!-- link -->
                    <div v-if="!newMeta[file.i][file.f].encrypted">
                        <a :href="'https://ipfs.dlux.io/ipfs/' + file.f" target="_blank"
                            class="w-100 btn btn-sm btn-info mb-1 mx-auto"><span
                                class="d-flex align-items-center">URL<i
                                    class="ms-auto fa-solid fa-fw fa-up-right-from-square"></i></span></a>
                    </div>
<!-- decrypt  -->
                    <div v-if="newMeta[file.i][file.f].encrypted && !contract[file.i].encryption.key">
                        <button type="button" class="w-100 btn btn-sm btn-primary mb-1 mx-auto"
                            @click="decode(file.i)"><span class="d-flex align-items-center w-100">Decrypt<i
                                    class="fa-solid fa-fw ms-auto fa-lock-open"></i></span></button>
                    </div>
<!-- download enc -->
                    <div v-if="newMeta[file.i][file.f].encrypted && contract[file.i].encryption.key">
                        <button type="button" class="w-100 btn btn-sm btn-primary mb-1 mx-auto"
                            @click="downloadFile(file.f, file.i)"><span
                                class="d-flex align-items-center w-100">Download<i
                                    class="fa-solid fa-download fa-fw ms-auto"></i></span></button>
                    </div>
<!-- add to post -->
                    <div v-if="assets">
                        <button type="button" class="w-100 btn btn-sm btn-purp mb-1 mx-auto"
                            @click="addToPost(file.f, contract.i, index)"><span
                                class="d-flex align-items-center w-100">Add to Post<i
                                    class="fa-solid fa-plus fa-fw ms-auto"></i></span></button>
                    </div>
<!-- add to asset -->
                    <div v-if="assets">
                        <button type="button" class="w-100 btn btn-sm btn-purp my-1 mx-auto"
                            @click="addAsset(file, contract)"><span class="d-flex align-items-center w-100">Add
                                asset<i class="fa-solid fa-plus fa-fw ms-auto"></i></span></button>
                    </div>
                </div>
            </div>


<!-- item table -->
            <table class="table table-dark table-striped table-hover  align-middle mb-0">
                <thead>
                    <tr>
<!-- thumb -->
                        <th scope="col" class="col-1">

                        </th>
<!-- name -->
                        <th scope="col" class="col-2">
                            <div class="d-flex flex-wrap align-items-center">
                                <div class="d-flex flex-wrap align-items-center">
                                    <i class="fa-solid fa-file fa-fw"></i>
                                    <span class="m-1">Filename</span>
                                </div>
                                <div class="d-none d-flex align-items-center">
                                    <button class="btn btn-sm btn-secondary ms-1"
                                        @click="sortContracts('c','asc')"><i
                                            class="fa-solid fa-caret-up"></i></button>
                                    <button class="btn btn-sm btn-secondary ms-1"
                                        @click="sortContracts('c','dec')"><i
                                            class="fa-solid fa-caret-down"></i></button>
                                </div>
                            </div>
                        </th>
<!-- owners -->
                        <th scope="col" class="col-2" v-if="owners.length > 1">
                            <div class="d-flex flex-wrap align-items-center">
                                <div class="d-flex flex-wrap align-items-center">
                                    <i class="fa-solid fa-tag fa-fw"></i>
                                    <span class="m-1">File Owner</span>
                                </div>
                                <div class="d-none d-flex align-items-center">
                                    <button class="btn btn-sm btn-secondary" @click="sortContracts('e','dec')"><i
                                            class="fa-solid fa-caret-up"></i></button>
                                    <button class="btn btn-sm btn-secondary ms-1"
                                        @click="sortContracts('e','asc')"><i
                                            class="fa-solid fa-caret-down"></i></button>
                                </div>
                            </div>
                        </th>
<!-- tags & labels -->
                        <th scope="col" class="col-2">
                            <div class="d-flex flex-wrap align-items-center">
                                <div class="d-flex flex-wrap align-items-center">
                                    <i class="fa-solid fa-tag fa-fw"></i>
                                    <span class="m-1">Tags & Labels</span>
                                </div>
                                <div class="d-none d-flex align-items-center">
                                    <button class="btn btn-sm btn-secondary" @click="sortContracts('e','dec')"><i
                                            class="fa-solid fa-caret-up"></i></button>
                                    <button class="btn btn-sm btn-secondary ms-1"
                                        @click="sortContracts('e','asc')"><i
                                            class="fa-solid fa-caret-down"></i></button>
                                </div>
                            </div>
                        </th>
<!-- size -->
                        <th scope="col" class="col-1">
                            <div class="d-flex flex-wrap align-items-center">
                                <div class="d-flex flex-wrap align-items-center">
                                    <i class="fa-solid fa-database fa-fw"></i>
                                    <span class="m-1">Size</span>
                                </div>
                                <div class="d-none d-flex align-items-center">
                                    <button class="btn btn-sm btn-secondary" @click="sortContracts('e','dec')"><i
                                            class="fa-solid fa-caret-up"></i></button>
                                    <button class="btn btn-sm btn-secondary ms-1"
                                        @click="sortContracts('e','asc')"><i
                                            class="fa-solid fa-caret-down"></i></button>
                                </div>
                            </div>
                        </th>
<!-- created -->
                        <th scope="col" class="col-1">
                            <div class="d-flex flex-wrap align-items-center">
                                <div class="d-flex flex-wrap align-items-center">
                                    <i class="fa-solid fa-calendar-days fa-fw"></i>
                                    <span class="m-1">Created</span>
                                </div>
                                <div class="d-none d-flex align-items-center">
                                    <button class="btn btn-sm btn-secondary" @click="sortContracts('e','dec')"><i
                                            class="fa-solid fa-caret-up"></i></button>
                                    <button class="btn btn-sm btn-secondary ms-1"
                                        @click="sortContracts('e','asc')"><i
                                            class="fa-solid fa-caret-down"></i></button>
                                </div>
                            </div>
                        </th>
<!-- expires -->
                        <th scope="col" class="col-1">
                            <div class="d-flex flex-wrap align-items-center">
                                <div class="d-flex flex-wrap align-items-center">
                                    <i class="fa-solid fa-clock fa-fw"></i>
                                    <span class="m-1">Expires</span>
                                </div>
                                <div class="d-none d-flex align-items-center">
                                    <button class="btn btn-sm btn-secondary" @click="sortContracts('e','dec')"><i
                                            class="fa-solid fa-caret-up"></i></button>
                                    <button class="btn btn-sm btn-secondary ms-1"
                                        @click="sortContracts('e','asc')"><i
                                            class="fa-solid fa-caret-down"></i></button>
                                </div>
                            </div>
                        </th>
<!-- buttons -->
                        <th scope="col" class="col-1">

                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="file in filesArray">
                        <th scope="row" class="col-1">
                            <div class="bg-light" style="width:50px;">
                                <img v-if="newMeta[file.i][file.f].thumb && isValidThumb(newMeta[file.i][file.f].thumb_data)"
                                    class="mx-auto img-fluid rounded bg-light"
                                    :src="isValidThumb(newMeta[file.i][file.f].thumb_data)" width="50px">
                                <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg"
                                    xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 800 800"
                                    style="enable-background:new 0 0 800 800;" xml:space="preserve">
                                    <g>
                                        <path class="st0" d="M650,210H500c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10s10,4.5,10,10v140h140c5.5,0,10,4.5,10,10
                                        S655.5,210,650,210z" />
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
                                            style="text-transform: uppercase; font-size: 149px;">{{newMeta[file.i][file.f].type}}</text>
                                    </g>
                                </svg>
                            </div>
                        </th>
                        <td class="col-2">
                            <div class="text-break">{{newMeta[file.i][file.f].name ||
                                file.f}}{{newMeta[file.i][file.f].thumb ? '.' + newMeta[file.i][file.f].type : ''}}
                            </div>
                        </td>
                        <td class="col-2" v-if="owners.length > 1">
                            <div class="text-break">@{{contract[file.i].t}}</div>
                        </td>
                        <td class="col-2">
                            <div class="d-flex flex-wrap align-items-center">


                                <div v-if="file.lc" class="d-flex me-1 align-items-center"
                                    style="margin-left: 15px">
                                    <i v-for="(color, num) in labelsDecode(file.lc)" :class="color.fa"
                                        :style="'margin-left: ' + -15 +'px !important;'"></i>
                                </div>


                                <div class="me-1" v-for="label in labelsDecode(file.ll)">
                                    <span class="d-flex align-items-center">
                                        <pop-vue
                                            :id=" bid + 'popperL-' + file.i + file.index + label.l + (cc ? 'cc' : '')"
                                            :title="label.l" trigger="hover">
                                            <i :class="label.fa"></i>
                                        </pop-vue>
                                    </span>
                                </div>

                                <div class="d-flex align-items-center">
                                    <div v-for="flag in flagsDecode(newMeta[file.i][file.f].flags, 0, 3)">
<!-- title="Labels"  -->
                                        <pop-vue
                                            :id=" bid + 'popper-' + file.i + file.index + flag.l + (cc ? 'cc' : '')"
                                            :title="flag.l" trigger="hover">
                                            <i :class="flag.fa"></i>
                                        </pop-vue>
                                    </div>
                                </div>
                                <pop-vue v-if="licenses[file.lic]" v-for="lic in licenses[file.lic].fa"
                                    :id=" bid + 'popper-Lic' + (cc ? 'cc' : '') + file.i + file.index + file.lic"
                                    :title="lic.l" trigger="hover">
                                    <i :class="lic.fa"></i>
                                </pop-vue>
                            </div>
                        </td>
                        <td class="col-1">{{fancyBytes(file.s)}}</td>
                        <td class="col-1">{{blockToTime(file.c)}}</td>
                        <td class="col-1">{{blockToTime(file.e)}}<i v-if="newMeta[file.i].contract.autoRenew"
                                class="fa-solid fa-arrows-rotate text-success fa-fw"></i></td>
                        <td class="col-1">
                            <div class="mt-1">
<!-- link -->
                                <div v-if="!newMeta[file.i][file.f].encrypted">
                                    <a :href="'https://ipfs.dlux.io/ipfs/' + file.f" target="_blank"
                                        class="w-100 btn btn-sm btn-info mb-1 mx-auto"><span
                                            class="d-flex align-items-center">URL<i
                                                class="ms-auto fa-solid fa-fw fa-up-right-from-square"></i></span></a>
                                </div>
<!-- decrypt  -->
                                <div v-if="newMeta[file.i][file.f].encrypted && !contract[file.i].encryption.key">
                                    <button type="button" class="w-100 btn btn-sm btn-primary mb-1 mx-auto"
                                        @click="decode(file.i)"><span class="d-flex align-items-center w-100">Decrypt<i
                                                class="fa-solid fa-fw ms-auto fa-lock-open"></i></span></button>
                                </div>
<!-- download enc -->
                                <div v-if="newMeta[file.i][file.f].encrypted && contract[file.i].encryption.key">
                                    <button type="button" class="w-100 btn btn-sm btn-primary mb-1 mx-auto"
                                        @click="downloadFile(file.f, file.i)"><span
                                            class="d-flex align-items-center w-100">Download<i
                                                class="fa-solid fa-download fa-fw ms-auto"></i></span></button>
                                </div>
<!-- add to post -->
                                <div v-if="assets">
                                    <button type="button" class="w-100 btn btn-sm btn-purp mb-1 mx-auto"
                                        @click="addToPost(file.f, contract.i, index)"><span
                                            class="d-flex align-items-center w-100">Add to Post<i
                                                class="fa-solid fa-plus fa-fw ms-auto"></i></span></button>
                                </div>
<!-- add to asset -->
                                <div v-if="assets">
                                    <button type="button" class="w-100 btn btn-sm btn-purp mb-1 mx-auto"
                                        @click="addAsset(file, contract)"><span class="d-flex align-items-center w-100">Add
                                            asset<i class="fa-solid fa-plus fa-fw ms-auto"></i></span></button>
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
<!-- item grid -->
    <div class="d-flex flex-wrap" v-else-if="viewOpts.view === 'grid'">
        <div class="file-grid" v-for="file in filesArray">
            <div class="card bg-blur-darkg m-05 p-05 text-start">
                <a :href="'https://ipfs.dlux.io/ipfs/' + file.f" target="_blank" class="no-decoration">
                    <div class="text-black text-truncate">{{newMeta[file.i][file.f].name || file.f}}</div>
                </a>
                <h5 class="m-0 ms-auto align-self-end"><span
                        class="d-none badge square rounded-top border border-bottom-0 bg-info border-light-50"
                        :class="smartColor(file.lc)"><i :class="smartIcon(file.l)"></i>{{
                        newMeta[file.i][file.f].type }}</span></h5>
                <div class="bg-light d-flex ratio ratio-1x1 rounded">
                    <img v-if="newMeta[file.i][file.f].thumb && isValidThumb(newMeta[file.i][file.f].thumb_data)"
                        class="mx-auto img-fluid rounded bg-light"
                        :src="isValidThumb(newMeta[file.i][file.f].thumb_data)" width="128px">
                    <svg v-else version="1.1" xmlns="http://www.w3.org/2000/svg"
                        xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 800 800"
                        style="enable-background:new 0 0 800 800;" xml:space="preserve">
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
                                style="text-transform: uppercase; font-size: 149px;">{{newMeta[file.i][file.f].type}}</text>
                        </g>
                    </svg>
                </div>



                <div class="mt-1">
<!-- link -->
                    <div v-if="!newMeta[file.i][file.f].encrypted">
                        <a :href="'https://ipfs.dlux.io/ipfs/' + file.f" target="_blank"
                            class="w-100 btn btn-sm btn-info mb-1 mx-auto"><span
                                class="d-flex align-items-center">URL<i
                                    class="ms-auto fa-solid fa-fw fa-up-right-from-square"></i></span></a>
                    </div>
<!-- decrypt  -->
                    <div v-if="newMeta[file.i][file.f].encrypted && !contract[file.i].encryption.key">
                        <button type="button" class="w-100 btn btn-sm btn-primary mb-1 mx-auto"
                            @click="decode(file.i)"><span class="d-flex align-items-center w-100">Decrypt<i
                                    class="fa-solid fa-fw ms-auto fa-lock-open"></i></span></button>
                    </div>
<!-- download enc -->
                    <div v-if="newMeta[file.i][file.f].encrypted && contract[file.i].encryption.key">
                        <button type="button" class="w-100 btn btn-sm btn-primary mb-1 mx-auto"
                            @click="downloadFile(file.f, file.i)"><span
                                class="d-flex align-items-center w-100">Download<i
                                    class="fa-solid fa-download fa-fw ms-auto"></i></span></button>
                    </div>
<!-- add to post -->
                    <div v-if="assets">
                        <button type="button" class="w-100 btn btn-sm btn-purp mb-1 mx-auto"
                            @click="addToPost(file.f, contract.i, index)"><span
                                class="d-flex align-items-center w-100">Add to Post<i
                                    class="fa-solid fa-plus fa-fw ms-auto"></i></span></button>
                    </div>
<!-- add to asset -->
                    <div v-if="assets">
                        <button type="button" class="w-100 btn btn-sm btn-purp mb-1 mx-auto"
                            @click="addAsset(file, contract)"><span class="d-flex align-items-center w-100">Add
                                asset<i class="fa-solid fa-plus fa-fw ms-auto"></i></span></button>
                    </div>
                </div>



                <div class="d-flex flex-column rounded p-1" style="background-color: rgba(0, 0, 0, 0.6);">
<!-- Edit Button -->
                    <div v-if="!(file.l.length || file.lf)" class="ms-auto me-auto text-muted">

                    </div>

                    <div class="d-flex align-items-center justify-content-between">
                        &nbsp;
                        <div class="me-1">
                            <div class="d-flex align-items-center" style="margin-left: 15px">
                                <i v-for="(color, num) in labelsDecode(file.lc)" :class="color.fa"
                                    :style="'margin-left: ' + -15 +'px !important;'"></i>
                            </div>
                        </div>

                        <div class="mx-auto" v-for="(label, index) in labelsDecode(file.ll, 0)">
                            <span class="d-flex align-items-center w-100">
                                <pop-vue :id=" bid + 'popperL-' + (cc ? 'cc' : '') + file.i + index + label.l"
                                    title="Labels" trigger="hover">
                                    <i :class="label.fa"></i>
                                </pop-vue>
                            </span>
                        </div>

                        <div class="d-flex align-items-center ms-auto ms-1">
                            <pop-vue v-if="licenses[file.lic]" v-for="lic in licenses[file.lic].fa"
                                :id=" bid + 'popper-Lic' + (cc ? 'cc' : '') + file.i + file.index + file.lic"
                                :title="lic.l" trigger="hover">
                                <i :class="lic.fa"></i>
                            </pop-vue>
                            <div v-for="flag in flagsDecode(newMeta[file.i][file.f].flags)">
<!-- title="Labels"  -->
                                <pop-vue :id=" bid + 'popper-' + (cc ? 'cc' : '') + file.i + file.index + flag.l"
                                    :title="flag.l" trigger="hover">
                                    <i :class="flag.fa"></i>
                                </pop-vue>
                            </div>
                        </div>
                    </div>

                </div>

                <div class="d-flex align-items-center justify-content-center text-break small text-muted">
                    {{fancyBytes(file.s)}}
                </div>

            </div>
        </div>
    </div>
<!-- Context menu -->
    <Teleport to="body">
  <div
    v-if="contextMenu.show"
    :style="{ position: 'fixed', left: contextMenu.x + 'px', top: contextMenu.y + 'px', zIndex: 1000 }"
    class="bg-dark text-white p-2 rounded shadow"
    @click.stop
  >
    <ul class="list-unstyled m-0">
      <!-- Background Options -->
      <li
        v-if="contextMenu.type === 'background' && selectedUser === account"
        class="p-1"
        @click="createNewFolder"
      >
        New Folder
      </li>
      <!-- File Options -->
      <li
        v-if="contextMenu.type === 'file' && isEditable(contextMenu.item)"
        class="p-1"
        @click="renameItem(contextMenu.item, 'file')"
      >
        Rename File
      </li>
      <li
        v-if="contextMenu.type === 'file' && isEditable(contextMenu.item)"
        class="p-1"
        @click="deleteFile(contextMenu.item)"
      >
        Delete File
      </li>
      <!-- Folder Options -->
      <li
        v-if="contextMenu.type === 'folder' && isEditableFolder(contextMenu.item)"
        class="p-1"
        @click="renameItem(contextMenu.item, 'folder')"
      >
        Rename Folder
      </li>
      <li
        v-if="contextMenu.type === 'folder' && isEditableFolder(contextMenu.item)"
        class="p-1"
        @click="deleteFolder(contextMenu.item)"
      >
        Delete Folder
      </li>
    </ul>
  </div>
</Teleport>

<!-- Save Changes Footer -->
<div v-if="Object.keys(pendingChanges).length > 0" class="border-top bg-dark mt-3 p-3 d-flex justify-content-end">
  <button class="btn btn-warning me-2" @click="saveChanges">Save Changes ({{ Object.keys(pendingChanges).length }} contracts affected)</button>
  <button class="btn btn-secondary" @click="revertPendingChanges">Revert Pending Changes</button>
</div>

</div>
   `,
    props: {
        assets: {
            type: Boolean,
            default: false,
        },
        bid: {
            type: String,
            default: "",
        },
        contracts: {
            type: Object,
            default: function () {
                return [{
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

                }];
            }
        },
        account: {
            type: String,
            default: "",
        },
        current: {
            type: Number,
            default: 85000000,
        },
        cc: {
            default: false,
        },
        nodeview: {
            type: Boolean,
            default: false,
        }
    },
    data() {
        return {
            files: {},
            userFolderTrees: {},
            owners: [],
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
                view: "grid", // grid, list, folder, icon
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
            debounce: null,
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
        };
    },
    emits: ["addassets"],
    methods: {
        isValidThumb(string) {
            if (typeof string === 'string') {
                if (string.startsWith("data:image/")) return string;
                if (string.startsWith("https://")) return string;
                else if (string.startsWith("Qm")) return `https://ipfs.dlux.io/ipfs/${string}`;
            }
            return "";
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
                    console.log("Cleared pending changes from localStorage");
                }
                
                // Rebuild from original contract data
                this.init();
                console.log("Reverted all pending changes");
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
            // Ensure user is the current logged-in account and folderName is valid
            if (folderName && this.selectedUser === this.account) {
                const newPath = this.currentFolderPath ? `${this.currentFolderPath}/${folderName}` : folderName;

                // --- Prevent creating folder if it already exists (check pending and current) ---
                 const userTree = this.userFolderTrees[this.selectedUser] || [];
                 const findFolder = (nodes, pathParts) => {
                     if (!pathParts.length) return null; // Should target a folder name
                     let currentLevel = nodes;
                     let node = null;
                     for(const part of pathParts) {
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
                 // Also check pending changes (more complex, maybe skip for now or add later)

                // --- Stage in Pending Changes ---
                const userContractId = Object.keys(this.contract).find(id => this.contract[id].t === this.selectedUser);

                if (userContractId) {
                    this.pendingChanges[userContractId] = this.pendingChanges[userContractId] || {};
                    this.pendingChanges[userContractId]['__newFolders__'] = this.pendingChanges[userContractId]['__newFolders__'] || [];
                    if (!this.pendingChanges[userContractId]['__newFolders__'].includes(newPath)) {
                         this.pendingChanges[userContractId]['__newFolders__'].push(newPath);
                         console.log("Pending Changes after staging new folder:", JSON.parse(JSON.stringify(this.pendingChanges)));

                         // --- Trigger UI update by rebuilding tree ---
                         // No direct UI manipulation needed now, buildFolderTrees will handle it
                         this.buildFolderTrees();
                         // Optional: Force update if reactivity is sometimes slow, but ideally not needed
                         // this.$forceUpdate();
                } else {
                         alert(`Folder "${folderName}" is already pending creation.`);
                    }
                } else {
                    console.error("Cannot add new folder to pending changes: No contract found for user", this.selectedUser);
                    alert("Could not stage folder creation for saving. No contract found.");
                }

            } else if (folderName && this.selectedUser !== this.account) {
                 alert("Cannot create folders for other users.");
            }
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
        AESDecrypt(encryptedMessage, key) {
            const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
            return bytes.toString(CryptoJS.enc.Utf8);
        },
        handleLabel(m) {
            if (m.action == 'added') {
                var string = this.filterLabels
                if (!string) string = '2'
                this.filterLabels += m.item
            } else {
                var string = this.filterLabels
                var arr = string.split('')
                for (var j = 0; j < arr.length; j++) {
                    if (arr[j] == m.item) arr.splice(j, 1)
                }
                this.filterLabels = arr.join('')
            }
            this.render()
        },
        handleTag(m) {
            var num = this.Base64toNumber(this.filterFlags) || 0
            if (m.action == 'added') {
                if (num & m.item) { }
                else num += m.item
                this.filterFlags = num
            } else {
                if (num & m.item) num -= m.item
                this.filterFlags = num
            }
            this.render()
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
                    });
            }
        },
        downloadFile(cid, id) {
            fetch(`https://ipfs.dlux.io/ipfs/${cid}`)
                .then((response) => response.text())
                .then((blob) => {

                    const name = this.newMeta[id][cid].name + '.' + this.newMeta[id][cid].type || 'file'
                    if (this.contract[id].encryption.key) {
                        blob = this.AESDecrypt(blob, this.contract[id].encryption.key);
                        var byteString = atob(blob.split(',')[1])
                        var mimeString = blob.split(',')[0].split(':')[1].split(';')[0];
                        var ab = new ArrayBuffer(byteString.length);
                        var ia = new Uint8Array(ab);
                        for (var i = 0; i < byteString.length; i++) {
                            ia[i] = byteString.charCodeAt(i);
                        }
                        blob = new Blob([ab], { type: mimeString });
                    }
                    try {
                        var url = window.URL.createObjectURL(blob);
                        var a = document.createElement('a');
                        a.href = url;
                        a.download = name;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                    } catch (e) {
                        var url = window.URL.createObjectURL(response);
                        var a = document.createElement('a');
                        a.href = url;
                        a.download = name;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                    }

                });
        },
        setView(mode) {
            this.viewOpts.view = mode;
            this.viewOpts.list = mode === "list"; // Sync viewOpts.list with view === "list"
            if (mode !== "folder") {
                this.viewOpts.fileView = "grid";
            }
            // Ensure selectedUser is set for folder/icon views
            if ((mode === "folder" || mode === "icon") && !this.selectedUser && this.owners.length > 0) {
                this.selectedUser = this.account || this.owners[0];
            }
        },
        navigateTo(path) {
            this.currentFolderPath = path;
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
            console.log('Drag start file:', file);
            
            // If dragging a selected file and there are multiple files selected
            if (this.isFileSelected(file) && this.selectedFiles.length > 1) {
                // Include all selected files in the drag data
                event.dataTransfer.setData("fileids", JSON.stringify(this.selectedFiles));
                console.log('Dragging multiple files:', this.selectedFiles);
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
            let itemIds = [];
            
            // Check for multiple items being dragged
            const itemIdsStr = event.dataTransfer.getData("itemids"); 
            if (itemIdsStr) {
                try {
                    itemIds = JSON.parse(itemIdsStr);
                } catch (e) {
                    // Fallback to text/plain if parsing fails
                    const textData = event.dataTransfer.getData("text/plain");
                    if(textData) itemIds = textData.split('\n');
                }
            } else {
                 // Fallback to text/plain if itemids is missing
                 const textData = event.dataTransfer.getData("text/plain");
                 if(textData) itemIds = textData.split('\n');
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
                        console.warn("Cannot move preset folders");
                        return;
                    }
                    
                    // Check if we're dropping into a subfolder of the folder being moved
                    // This would create a recursive loop and is not allowed
                    if (targetPath.startsWith(folderPathToMove + '/')) {
                        console.warn('Cannot move a folder into its own subfolder');
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
                     if(textData) itemIds = textData.split('\n');
                 }
             } else {
                  const textData = event.dataTransfer.getData("text/plain");
                  if(textData) itemIds = textData.split('\n');
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
                         console.warn("Cannot move preset folders");
                         return;
                     }
                     
                     // Check if we're dropping into a subfolder of the folder being moved
                     if (targetPath.startsWith(folderPathToMove + '/')) {
                         console.warn('Cannot move a folder into its own subfolder');
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
            console.log("Starting saveChanges...");
            console.log("Initial pendingChanges:", JSON.parse(JSON.stringify(this.pendingChanges)));
            console.log("Initial contract data:", JSON.parse(JSON.stringify(this.contract)));
            console.log("Initial newMeta:", JSON.parse(JSON.stringify(this.newMeta)));
            
            // Base58 characters for folder indexing
            const base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
            
            // Helper to convert number to Base58
            const numberToBase58 = (num) => {
                if (num === 0) return base58Chars[0]; // Should not happen for indices >= 1
                let result = "";
                while (num > 0) {
                    result = base58Chars[num % 58] + result;
                    num = Math.floor(num / 58);
                }
                return result;
            };
            
            // Helper to convert Base58 to number
            const base58ToNumber = (b58) => {
                let num = 0;
                for (let i = 0; i < b58.length; i++) {
                    num = num * 58 + base58Chars.indexOf(b58[i]);
                }
                return num;
            };
            
            // Iterate through each contract with pending changes
            for (const contractId in this.pendingChanges) {
                console.log(`Processing contract: ${contractId}`);
                
                if (!this.contract[contractId]) {
                    console.warn(`Contract ${contractId} not found in this.contract. Skipping.`);
                    continue;
                }
                
                const contractChanges = this.pendingChanges[contractId];
                const originalContract = this.contract[contractId];
                const originalMeta = this.newMeta[contractId];
                
                // Extract the original metadata parts
                const m = originalContract.m || "";
                
                let contractData = originalContract.m.split(',')[0]
                let parts = contractData.split("|");
                let encData = parts[0] || "1";

                // Fallback for non-pipe-separated metadata
                if (parts.length === 1 && m.includes(",")) {
                    const temp = m.split(",")
                    encData = temp[0] || "1"
                }

                // --- 1. Determine the final state of files for this contract ---
                const finalFileStates = {};
                const allFileCIDs = Object.keys(originalContract.df || {});
                
                // First, identify if there's a folder rename operation
                let folderRename = null;
                if (contractChanges.__newFolders__ && contractChanges.__newFolders__.length > 0) {
                    // Check if this is a folder rename (one new folder with the same parent path)
                    const newFolders = contractChanges.__newFolders__;
                    if (newFolders.length === 1) {
                        const newFolderPath = newFolders[0];
                        const newFolderName = newFolderPath.split('/').pop();
                        
                        // Find the original folder path by looking at file paths
                        const originalPaths = new Set();
                        allFileCIDs.forEach(cid => {
                            const originalFileData = originalMeta?.[cid] || {};
                            if (originalFileData.folderPath) {
                                originalPaths.add(originalFileData.folderPath);
                            }
                        });
                        
                        // If we have exactly one original path, this is likely a rename
                        if (originalPaths.size === 1) {
                            const originalPath = Array.from(originalPaths)[0];
                            const originalName = originalPath.split('/').pop();
                            
                            // If the parent paths match, this is a rename
                            const originalParent = originalPath.split('/').slice(0, -1).join('/');
                            const newParent = newFolderPath.split('/').slice(0, -1).join('/');
                            
                            if (originalParent === newParent) {
                                folderRename = {
                                    from: originalPath,
                                    to: newFolderPath,
                                    fromName: originalName,
                                    toName: newFolderName
                                };
                                console.log("Detected folder rename:", folderRename);
                            }
                        }
                    }
                }
                
                // Process all files
                allFileCIDs.forEach(cid => {
                    const originalFileData = originalMeta?.[cid] || {};
                    const changedFileData = contractChanges[cid] || {};
                    
                    // Determine final folderPath, considering changes first
                    let finalFolderPath = originalFileData.folderPath || ''; // Default to root
                    
                    // If this is a folder rename, update the path
                    if (folderRename && finalFolderPath === folderRename.from) {
                        finalFolderPath = folderRename.to;
                    } else if (changedFileData.hasOwnProperty('folderPath')) {
                        finalFolderPath = changedFileData.folderPath;
                    }
                    
                    // Determine final name
                    const finalName = changedFileData.name || originalFileData.name || cid;
                    
                    // Keep other metadata from original unless changed
                    finalFileStates[cid] = {
                        ...originalFileData, // Start with original data
                        name: finalName,
                        folderPath: finalFolderPath,
                        // Include other necessary fields
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
                
                // --- 2. Build the Directory Tree for this contract ---
                const allPaths = new Set(['']); // Include root path
                
                // Add all file paths
                Object.values(finalFileStates).forEach(file => {
                    if (file.is_thumb) return; // Skip thumbs
                    const path = file.folderPath || '';
                    allPaths.add(path);
                    
                    // Add all parent paths as well
                    const parts = path.split('/').filter(Boolean);
                    let current = '';
                    for (let i = 0; i < parts.length; i++) {
                        current = current ? `${current}/${parts[i]}` : parts[i];
                        allPaths.add(current);
                    }
                });
                
                // Also include newly created folders from pending changes
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
                
                // Sort paths by depth and then alphabetically
                const sortedPaths = Array.from(allPaths).sort((a, b) => {
                    const depthA = a.split('/').length;
                    const depthB = b.split('/').length;
                    if (depthA !== depthB) return depthA - depthB;
                    return a.localeCompare(b);
                });
                
                console.log("Sorted paths:", sortedPaths);
                
                // --- 3. Assign Indices and Build folderListStr ---
                const indexToPath = {};
                const pathToIndex = {};
                const presetFoldersMap = { // Map preset names to their fixed indices 2-9
                    "Documents": "2", "Images": "3", "Videos": "4", "Music": "5",
                    "Archives": "6", "Code": "7", "Designs": "8", "Misc": "9"
                };
                let nextCustomIndex = 0; // Start custom indices from 10 (Base58 'A') (++ executes before next step)
                let folderListEntries = [];
                
                // First, assign index to root
                indexToPath["0"] = '';
                pathToIndex[''] = "0";
                folderListEntries.push(''); // Root entry is empty
                
                // Then process all other paths
                sortedPaths.forEach(path => {
                    if (path === '') return; // Skip root, already processed
                    
                    const parts = path.split('/');
                    const folderName = parts[parts.length - 1];
                    const parentPath = parts.slice(0, -1).join('/');
                    
                    const parentIndex = pathToIndex[parentPath];
                    if (!parentIndex) {
                        console.error(`Error: Parent path '${parentPath}' for folder '${path}' not found in pathToIndex. Skipping.`);
                        return; // Skip this folder if parent doesn't have an index yet
                    }
                    if(nextCustomIndex == 1)nextCustomIndex = 9 //skip presets
                    let assignedIndex;
                    // Check if it's a top-level preset folder
                    if (parts.length === 1 && presetFoldersMap[folderName]) {
                        assignedIndex = presetFoldersMap[folderName];
                    } else {
                        // Assign next custom index
                        assignedIndex = numberToBase58(nextCustomIndex++);
                    }
                    
                    indexToPath[assignedIndex] = path;
                    pathToIndex[path] = assignedIndex;
                    
                    // Format: "parentIndex/folderName" for subfolders, "folderName" for top-level
                    const entry = (parentIndex === "0") ? folderName : `${parentIndex}/${folderName}`;
                    folderListEntries.push(entry);
                });
                
                // Ensure preset folders are included in the list if they exist in paths but weren't added
                Object.entries(presetFoldersMap).forEach(([name, index]) => {
                    if (allPaths.has(name) && !folderListEntries.some(entry => entry === name)) {
                        // Find its correct alphabetical position among top-level folders
                        const topLevelFolders = folderListEntries.filter(e => e && !e.includes('/'));
                        topLevelFolders.push(name);
                        topLevelFolders.sort();
                        const insertIndex = topLevelFolders.indexOf(name);
                        
                        // Find the index in the main list *after* the root entry ('')
                        let mainListInsertIndex = 1; // Start after root
                        let topLevelCount = 0;
                        while(mainListInsertIndex < folderListEntries.length && topLevelCount < insertIndex) {
                            if(folderListEntries[mainListInsertIndex] && !folderListEntries[mainListInsertIndex].includes('/')) {
                                topLevelCount++;
                            }
                            mainListInsertIndex++;
                        }
                        folderListEntries.splice(mainListInsertIndex, 0, name);
                    }
                });
                
                const newFolderListStr = folderListEntries.join("|");
                console.log("Generated indexToPath:", indexToPath);
                console.log("Generated pathToIndex:", pathToIndex);
                console.log("Generated folderListStr:", newFolderListStr);
                
                // --- 4. Build File Metadata String ---
                const newFilesMetadata = [];
                // Ensure consistent order matching original contract.df keys
                const sortedFileCIDs = Object.keys(originalContract.df || {}).sort();
                
                sortedFileCIDs.forEach(cid => {
                    const fileState = finalFileStates[cid];
                    
                    const folderPath = fileState?.folderPath || "";
                    const folderIndex = folderPath ? pathToIndex[folderPath] : 1
                    
                    
                    // Combine flags, license, labels back into the compact string format
                    // Convert numeric flags back to Base64
                    const flagsNum = fileState.flags || 0;
                    const flagsB64 = this.NumberToBase64(flagsNum) || '0'; // Ensure '0' if flagsNum is 0
                    const licenseStr = fileState.license || "";
                    const labelsStr = fileState.labels || "";
                    const flagsCombined = `${flagsB64}-${licenseStr}-${labelsStr}`;
                    
                    // Format: name,type.folderIndex,thumb,flagsCombined
                    const entry = `${fileState.name || ""},${fileState.type || 'unk'}${(typeof folderIndex == "string" && folderIndex != 1) ? '.' + folderIndex : ''},${fileState.thumb || ''},${flagsCombined}`;
                    newFilesMetadata.push(entry);
                });
                
                const newFilesMetadataStr = newFilesMetadata.join(',');
                console.log("Generated Files Metadata String:", newFilesMetadataStr);
                
                // --- 5. Construct Final Metadata String ---
                // The correct format is: encData|folderListStr,fileMetadataStr
                // Note: The folderListStr and fileMetadataStr are separated by a comma, not a pipe
                // const newMetaString = `${encData}|${newFolderListStr},${newFilesMetadataStr}`; // Old incorrect concatenation

                let finalMetaString;
                if (encData) {
                    // If encData exists, use it, add pipe, then folderList (minus its leading pipe if present), then comma, then fileMeta
                    const folderPart = newFolderListStr.startsWith('|') ? newFolderListStr : `|${newFolderListStr}`;
                    finalMetaString = `${encData}${folderPart},${newFilesMetadataStr}`;
                } else {
                    // If no encData, use folderListStr as is (which might start with '|' or be empty), then comma, then fileMeta
                    finalMetaString = `1${newFolderListStr},${newFilesMetadataStr}`;
                }
                const newMetaString = finalMetaString; // Assign to the variable used later

                console.log(`Final generated metadata for ${contractId}:`, newMetaString);
                
                if (newMetaString.length > 8000) {
                    alert(`Metadata size for contract ${contractId} exceeds 8000 bytes (${newMetaString.length}). Please save fewer changes at a time.`);
                    continue; // Skip this contract
                }
                
                // --- 6. Prepare transaction (but don't send or update state yet) ---
                const transactionPayload = {
                    contractId: contractId,
                    metadata: newMetaString
                };
                
                console.log("Prepared transaction payload (not sending):", transactionPayload);
                
                // TODO: Emit an event or return payload for Keychain signing
                // Example: this.$emit('prepare-save', transactionPayload);
                
                // **IMPORTANT: State is NOT updated here anymore**
                // this.contract[contractId].m = newMetaString; // Don't update local contract data yet
            }
            
            // **IMPORTANT: pendingChanges and localStorage are NOT cleared here anymore**
            // They should only be cleared after successful confirmation from the blockchain/API
            // this.pendingChanges = {};
            // if (this.localStorageKey) {
            //    localStorage.removeItem(this.localStorageKey);
            //    console.log("Cleared pending changes from localStorage (commented out - should happen on success)");
            // }
            
            // **IMPORTANT: init() is NOT called here anymore**
            // this.init();
            
            alert("Changes prepared. Signing and state update will be handled later."); // Placeholder message
            console.log("saveChanges finished preparing data. No state updated.");
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
            const then = new Date(now - ((this.current - block) * 3000))
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
            if (flags.length == 0) return arr
            const len = only >= 0 ? 1 : flags.length
            for (var i = (only >= 0 ? only : 0); i < len; i++) {
                arr.push(this.labels[flags[i]])
            }
            arr = new Set(arr)
            return new Array(...arr)
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
            this.filesArray = []
            for (var i in this.files) {
                if (!this.files[i].is_thumb)
                    this.filesArray.push(this.files[i])
            }
            // filterFlags: "=",
            // filterLabels: "",
            // filesSelect: {
            //     sort: "time",
            //     dir: "dec",
            //     search: "",
            // },
            this.filesArray = this.filesArray.filter((file) => {
                if (this.filterFlags && !(this.filterFlags & file.lf)) return false
                if (this.filterLabels) {
                    const arr = this.filterLabels.split('')
                    for (var j = 0; j < arr.length; j++) {
                        if (file.l.indexOf(arr[j]) == -1) return false

                    }
                }
                switch (this.filesSelect.addusers[file.o]) {
                    case false:
                        return false
                    case 'lock':
                        if (!(file.lf & 1) && !this.contract[file.i].encryption.accounts[this.account]) return false
                        break
                    case 'cc':
                        if (!file.lic) return false
                    case true:
                        break
                    default:
                        return false
                }
                if (this.filesSelect.cc_only && (!file.lic && file.o != this.account)) return false
                if (this.filesSelect.search && file.n.toLowerCase().indexOf(this.filesSelect.search.toLowerCase()) == -1) return false
                return true
            })
            this.filesArray.sort((a, b) => {
                if (this.filesSelect.sort == 'time') {
                    if (this.filesSelect.dir == 'dec') return a.c - b.c
                    else return b.c - a.c
                } else if (this.filesSelect.sort == 'size') {
                    if (this.filesSelect.dir == 'dec') return a.s - b.s
                    else return b.s - a.s
                } else if (this.filesSelect.sort == 'name') {
                    if (this.filesSelect.dir == 'dec') return a.n.localeCompare(b.n)
                    else return b.n.localeCompare(a.n)
                } else if (this.filesSelect.sort == 'type') {
                    if (this.filesSelect.dir == 'dec') return a.y - b.y
                    else return b.s - a.s
                } else if (this.filesSelect.sort == 'exp') {
                    if (this.filesSelect.dir == 'dec') return a.e - b.e
                    else return b.e - a.e
                } else {
                    return 0
                }
            })

        },
        getImgData(id, cid) {
            var string = this.smartThumb(id, cid)
            if (string.includes("https://")) fetch(string).then(response => response.text()).then(data => {
                if (data.indexOf('data:image/') >= 0) this.newMeta[id][cid].thumb_data = data
                else this.newMeta[id][cid].thumb_data = string
            }).catch(e => {
                console.log("caught", e)
                this.newMeta[id][cid].thumb_data = string
            })
        },
        toBase58(num) {
            const glyphs = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
            let result = "";
            while (num > 0) {
                result = glyphs[num % 58] + result;
                num = Math.floor(num / 58);
            }
            return result || "1";
        },
        parseFolderList(folderListStr) {
            var folderEntries = folderListStr.split("|").filter(Boolean);
            const indexToPath = {
                "1": folderEntries[0],
                "2": "Documents",
                "3": "Images",
                "4": "Videos",
                "5": "Music",
                "6": "Archives",
                "7": "Code",
                "8": "Designs",
                "9": "Misc",
            };
            folderEntries = folderEntries.splice(1)
            let currentIndex = 10;

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
                const index = this.toBase58(currentIndex);
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
                 node.files.sort((a,b) => (a.n || a.f).localeCompare(b.n || b.f));

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
            console.log("Building folder trees...");
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
                 if(!user) continue;

                 // 1. Build tree based on files for this user
                 const userFiles = filesByUser[user] || [];
                 const fileBasedTreeArray = this.buildFolderTree(userFiles); // Returns array of top-level folders

                 // 2. Get pending new folders for this user
                 let pendingFolderPaths = [];
                 const userContractIds = Object.keys(this.contract).filter(id => this.contract[id]?.t === user);
                 for(const contractId of userContractIds) {
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
                                let folderNode = currentLevelArray.find(node => node.name === part /* && node.path === currentPath */ ); // Find existing node

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
                     "Designs",
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
            // Handle contracts as an array or object
            if (Array.isArray(this.contracts)) {
                contracts = this.contracts.slice();
            } else {
                for (var id in this.contracts) {
                    contracts.push(this.contracts[id]);
                }
            }
            if (this.nodeview) {
                contracts.forEach(contract => {
                    this.filesSelect.addusers[contract.t] = true;
                });
            }
            for (var user in this.filesSelect.addusers) {
                for (var id in this.contractIDs[user]) {
                    contracts.push(this.contractIDs[user][id]);
                }
            }

            this.files = {};
            this.userFolderTrees = {};

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
                        this.newMeta[id][filesNames[j]] = {
                            name: filesNames[j],
                            type: "",
                            thumb: "",
                            is_thumb: false,
                            flags: 0,
                            folderPath: "",
                        };
                        const f = {
                            i: id,
                            f: filesNames[j],
                            c: id.split(":")[2].split("-")[0],
                            e: this.contract[id].e.split(":")[0],
                            n: filesNames[j],
                            y: "",
                            o: this.contract[id].t,
                            folderPath: indexToPath["1"],
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
                        const folderPath = indexToPath[folderIndex] || indexToPath["1"];

                        this.newMeta[id][filesNames[j]] = {
                            name,
                            type,
                            thumb,
                            thumb_data: thumb,
                            is_thumb: false,
                            flags: this.Base64toNumber(flags.split("-")[0]),
                            folderPath,
                            license: flags.includes("-") ? flags.split("-")[1] : "",
                            labels: flags.includes("-") ? flags.split("-")[2] : flags.slice(1),
                        };

                        if (thumb) this.getImgData(id, filesNames[j]);
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

                        this.files[f.f] = f;
                    }
                }
            }

            this.owners = [...new Set(this.owners)];
            this.buildFolderTrees();
            this.render();
        },
        dragOverBackground(event) {
            event.preventDefault();
        },
        dropOnBackground(event) {
            event.preventDefault();
            const fileId = event.dataTransfer.getData("fileid");
            console.log('Background drop - fileId:', fileId);
            
            // Find the file by ID
            const file = this.files[fileId];
            console.log('Background drop - Found file:', file);
            
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
                console.log('Background drop - File already in this folder');
                return;
            }
            
            // Store original path for debugging
            const originalPath = file.folderPath;
            console.log('Background drop - Original path:', originalPath, 'New path:', this.currentFolderPath);
            
            // Update file folder path
                this.pendingChanges[file.i] = this.pendingChanges[file.i] || {};
                this.pendingChanges[file.i][file.f] = {
                    folderPath: this.currentFolderPath,
                    name: this.newMeta[file.i][file.f].name || file.f,
                };
            
            // Important: Actually update the file object's folderPath
                file.folderPath = this.currentFolderPath;
            console.log('Background drop - Updated file:', file);
            
            // Force folder path into metadata if needed
            if (this.newMeta[file.i] && this.newMeta[file.i][file.f]) {
                this.newMeta[file.i][file.f].folderPath = this.currentFolderPath;
            }
            
            // Rebuild and render
                this.buildFolderTrees();
                this.render();
        },
        handleDragEnterFolder(event, folder) {
            clearTimeout(this.dragHoverTimeout);
            this.dragHoverTargetPath = folder.path;
            console.log('Entering folder:', folder.path);
            this.dragHoverTimeout = setTimeout(() => {
                if (this.dragHoverTargetPath === folder.path) {
                    console.log('Navigating due to hover on folder:', folder.path);
                    this.navigateTo(folder.path);
                    this.dragHoverTargetPath = null; // Reset after navigation
                }
            }, 1000); // 1 second delay
        },
        handleDragEnterBreadcrumb(event, path) {
            clearTimeout(this.dragHoverTimeout);
            this.dragHoverTargetPath = path;
             console.log('Entering breadcrumb:', path);
            this.dragHoverTimeout = setTimeout(() => {
                if (this.dragHoverTargetPath === path) {
                    console.log('Navigating due to hover on breadcrumb:', path);
                    this.navigateTo(path);
                    this.dragHoverTargetPath = null; // Reset after navigation
                }
            }, 1000); // 1 second delay
        },
        handleDragLeave(event) {
            // Only clear the timeout if we're truly leaving the element
            // Check if the related target (what we're moving to) is a child of the current target (what we're leaving)
            const currentTarget = event.currentTarget;
            const relatedTarget = event.relatedTarget;
            
            // If relatedTarget is null or not a descendant of currentTarget, we're truly leaving
            if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
                clearTimeout(this.dragHoverTimeout);
                console.log('Truly leaving hover target:', this.dragHoverTargetPath);
                this.dragHoverTargetPath = null;
            } else {
                console.log('Moving within the same element, not clearing timeout');
            }
        },
        isFileSelected(file) {
            return this.selectedFiles.includes(file.f);
        },
        handleFileClick(event, file) {
            // Multi-select with Alt/Ctrl key
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
            return true;
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
                    if ((intersects || centerInSelection) && elementKey) {
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
            console.log(`Drag start ${type}:`, item);
            
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
                dragDataIds = [...this.selectedFiles]; 
                console.log('Dragging multiple items:', dragDataIds);
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
                console.log(`Dragging single ${type}:`, singleId);
                event.dataTransfer.setData("itemids", JSON.stringify(dragDataIds)); // Still use generic name
            }

            // Set fallback text data (might be useful for external drops)
            event.dataTransfer.setData("text/plain", dragDataIds.join('\n')); 

            // **Important**: Need contract ID(s) if files are involved
            // For simplicity now, just use the contract ID of the first file found in selection
            let representativeContractId = null;
            const firstFileId = dragDataIds.find(id => !id.startsWith('folder-'));
            if(firstFileId && this.files[firstFileId]){
                 representativeContractId = this.files[firstFileId].i;
                 event.dataTransfer.setData("contractid", representativeContractId);
                 console.log("Using contractId:", representativeContractId);
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
                
                dragIcon.innerHTML = `<div style="padding: 10px; background: rgba(0,0,0,0.7); color: white; border-radius: 4px; display: flex; align-items-center; max-width: 200px; white-space: nowrap;">
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
        dragOverFolder(event) {
            event.preventDefault();
        },
        dropOnFolder(event, folder) {
            event.preventDefault();
            event.stopPropagation(); 
            let itemIds = [];
            
            // Check for multiple items being dragged
            const itemIdsStr = event.dataTransfer.getData("itemids"); 
            if (itemIdsStr) {
                try {
                    itemIds = JSON.parse(itemIdsStr);
                } catch (e) {
                    // Fallback to text/plain if parsing fails
                    const textData = event.dataTransfer.getData("text/plain");
                    if(textData) itemIds = textData.split('\n');
                }
            } else {
                 // Fallback to text/plain if itemids is missing
                 const textData = event.dataTransfer.getData("text/plain");
                 if(textData) itemIds = textData.split('\n');
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
                        console.warn("Cannot move preset folders");
                        return;
                    }
                    
                    // Check if we're dropping into a subfolder of the folder being moved
                    // This would create a recursive loop and is not allowed
                    if (targetPath.startsWith(folderPathToMove + '/')) {
                        console.warn('Cannot move a folder into its own subfolder');
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
                     if(textData) itemIds = textData.split('\n');
                 }
             } else {
                  const textData = event.dataTransfer.getData("text/plain");
                  if(textData) itemIds = textData.split('\n');
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
                         console.warn("Cannot move preset folders");
                         return;
                     }
                     
                     // Check if we're dropping into a subfolder of the folder being moved
                     if (targetPath.startsWith(folderPathToMove + '/')) {
                         console.warn('Cannot move a folder into its own subfolder');
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
            const presetFolders = ["Documents", "Images", "Videos", "Music", "Archives", "Code", "Designs", "Misc"];
            return presetFolders.includes(path);
        },
        // Add method to load pending changes from localStorage
        loadPendingChanges() {
            if (this.localStorageKey) {
                try {
                    const savedChanges = localStorage.getItem(this.localStorageKey);
                    if (savedChanges) {
                        this.pendingChanges = JSON.parse(savedChanges);
                        console.log("Loaded pending changes from localStorage");
                        // Rebuild folder trees to reflect loaded changes
                        this.buildFolderTrees();
                    }
                } catch (e) {
                    console.error("Error loading pending changes from localStorage:", e);
                }
            }
        },
        findNextFolderIndex(indexToPathMap) {
            const glyphs = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
            const existingIndices = Object.keys(indexToPathMap).map(idx => {
                let num = 0;
                for (let i = 0; i < idx.length; i++) {
                    num = num * 58 + glyphs.indexOf(idx[i]);
                }
                return num;
            });
            // Find the maximum numeric value, default to 9 if only presets 1-9 exist
            const maxExisting = existingIndices.length > 0 ? Math.max(...existingIndices) : 9;
            return maxExisting + 1; // The next available numeric value
        }
    },
    computed: {
        hasFiles() {
            return Object.keys(this.files).length > 0;
        },
        currentFileCount() {
            return this.getFiles(this.selectedUser, this.currentFolderPath).length;
        },
        getSubfolderCount() {
            return this.getSubfolders(this.selectedUser, this.currentFolderPath).length
        }
    },
    watch: {
        'contracts': {

            handler(newValue, oldValue) {
                //find the difference in this object
                var diff = false
                for (var i = 0; i < newValue.length; i++) {
                    if (!this.newMeta[newValue[i].i]) {
                        diff = true
                        break
                    }
                }
                if (diff) {
                    if (this.debounce && new Date().getTime() - this.debounce < 1000) return
                    this.init()
                    this.debounce = new Date().getTime()
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
        'pendingChanges': {
            handler(newValue) {
                if (this.localStorageKey) {
                    try {
                        if (Object.keys(newValue).length > 0) {
                            localStorage.setItem(this.localStorageKey, JSON.stringify(newValue));
                            // console.log("Saved pendingChanges to localStorage"); // Optional debug log
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
        }
    },
    mounted() {
        // Set up localStorage key based on current account
        this.localStorageKey = this.account ? `fileVuePendingChanges_${this.account}` : '';
        // Load any pending changes from previous sessions
        this.loadPendingChanges();
        
        // Existing mounted code
        if (this.account) this.filesSelect.addusers[this.account] = true;
        if (!this.nodeview) this.filesSelect.cc_only = false;
        if (this.owners.length > 0) {
            this.selectedUser = this.account || this.owners[0];
        }
        this.init()

        // Add window mouseup handler for selection box (emergency escape)
        window.addEventListener('mouseup', (e) => {
            if (this.selectionBox.active) {
                console.log('Emergency ending selection box (window mouseup)');
                this.endSelectionBox();
            }
        });
    },
    beforeUnmount() {
        // Clean up event listeners
        window.removeEventListener('mouseup', this.endSelectionBox);
    }
};