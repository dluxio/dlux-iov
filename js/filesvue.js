export default {
    template: `
<div class="d-flex flex-grow-1 flex-column p-05 rounded m-05" style="background-color: rgba(0, 0, 0, 0.6);">
    <div class="pt-1">
        <!-- ACTION BAR -->
                <div class="d-flex flex-wrap align-items-center justify-content-center">



                    <!-- Chain -->
                    <div class="order-1 dropdown d-none d-xl-block mb-1">
                        <button class="btn btn-outline-light dropdown-toggle mx-1" type="button"
                            data-bs-toggle="dropdown" aria-expanded="false">
                            Chain
                        </button>
                        <ul class="dropdown-menu bg-black">
                            <li>
                                <div class="py-1 px-2">
                                    <div class="form-check">
                                        <input @change="addFilters('Chain', item);displaynfts()"
                                            class="form-check-input" type="checkbox" 
                                            id="item +'ChainCheck'">
                                        <label class="form-check-label" for="item +'ChainCheck'">
                                            
                                        </label>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <!-- Set -->
                    <div class="order-2 dropdown d-none d-xl-block mb-1">
                        <button class="btn btn-outline-light dropdown-toggle mx-1" type="button"
                            data-bs-toggle="dropdown" aria-expanded="false">
                            Set
                        </button>
                        <ul class="dropdown-menu bg-black">
                            <div>
                                <li>
                                    <div class="py-1 px-2">
                                        <div class="form-check">
                                            <input @change="addFilters('Set', setname, name);displaynfts()"
                                                class="form-check-input" type="checkbox"
                                                 id="setname + 'SetCheck'">
                                            <label class="form-check-label" for="setname + 'SetCheck'">
                                              
                                            </label>
                                        </div>
                                    </div>
                                </li>
                            </div>
                        </ul>
                    </div>
                    <!-- Status -->
                    <div class="order-3 dropdown d-none d-xl-block mb-1">
                        <button class="btn btn-outline-light dropdown-toggle mx-1" type="button"
                            data-bs-toggle="dropdown" aria-expanded="false">
                            Status
                        </button>
                        <ul class="dropdown-menu bg-black">
                            <li>
                                <div class="py-1 px-2">
                                    <div class="form-check">
                                        <input @change="addFilters('Status', name);displaynfts()"
                                            class="form-check-input" type="checkbox" 
                                            id="name + 'StatusCheck'">
                                        <label class="form-check-label" for="name + 'StatusCheck'">
                                         
                                        </label>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <!-- Currency -->
                    <div class="order-4 dropdown d-none d-xl-block mb-1 ">
                        <button class="btn btn-outline-light dropdown-toggle mx-1" type="button"
                            data-bs-toggle="dropdown" aria-expanded="false">
                            Currency
                        </button>
                        <ul class="dropdown-menu bg-black">
                            <li>
                                <div class="py-1 px-2">
                                    <div class="form-check">
                                        <input @change="addFilters('Currency', name);displaynfts()"
                                            class="form-check-input" type="checkbox" 
                                            id="name + 'CurrencyCheck'">
                                        <label class="form-check-label" for="name + 'CurrencyCheck'">
                                           
                                        </label>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <!-- Search -->
                    <div class="position-relative flex-grow-1 mb-1 mx-1 order-md-5">
                        <span class="position-absolute top-50 translate-middle-y ps-2"><i
                                class="fa-solid fa-magnifying-glass fa-fw"></i></span>
                        <input @keyup="displaynfts()" @change="displaynfts()" @search="displaynfts()"
                            class="ps-4 form-control border-white" type="search"
                            placeholder="Search sets, items, and accounts">
                    </div>
                    <div class="d-flex order-last mx-1 w-sm-100 justify-content-between ">
                        <!-- Filter button -->
                        <div class="d-xl-none mb-1 me-2 flex-fill">
                            <button class="btn btn-outline-light w-100" type="button" data-bs-toggle="collapse"
                                data-bs-target="#collapseFilter" aria-expanded="false" aria-controls="collapseFilter">
                                <i class="fa-solid fa-filter me-1"></i>Filter
                            </button>


                        </div>
                        <!-- Sort -->
                        <div class="dropdown mb-1 flex-fill">
                            <button class="btn btn-outline-light w-100" type="button" data-bs-toggle="dropdown"
                                aria-expanded="false"><i class="fa-solid fa-sort fa-fw ms-1"></i>
                                
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end bg-black">
                                <li>
                                    <a @click="NFTselect.dir='asc';NFTselect.sort='price';displaynfts()"
                                        class="dropdown-item" role="button">Price low to high</a>
                                </li>
                                <li>
                                    <a @click="NFTselect.dir='dec';NFTselect.sort='price';displaynfts()"
                                        class="dropdown-item" role="button">Price high to low</a>
                                </li>
                                <li>
                                    <a @click="NFTselect.dir='asc';NFTselect.sort='time';displaynfts()"
                                        class="dropdown-item" role="button">Time ending soonest</a>
                                </li>
                                <li>
                                    <a @click="NFTselect.dir='dec';NFTselect.sort='time';displaynfts()"
                                        class="dropdown-item" role="button">Time ending latest</a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- filter collapse-->
                    <div class="collapse order-last d-xl-none mx-1" id="collapseFilter">
                        <div class="d-flex flex-row flex-wrap">

                            <!-- Chain -->
                            <div class="order-1 dropdown mb-1">
                                <button class="btn btn-outline-light dropdown-toggle me-2" type="button"
                                    data-bs-toggle="dropdown" aria-expanded="false">
                                    Chain
                                </button>
                                <ul class="dropdown-menu bg-black">
                                    <li>
                                        <div class="py-1 px-2">
                                            <div class="form-check">
                                                <input @change="addFilters('Chain', item);displaynfts()"
                                                    class="form-check-input" type="checkbox"
                                                    >
                                                <label class="form-check-label" for="item +'ChainCheck'">
                                                   
                                                </label>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <!-- Set -->
                            <div class="order-2 dropdown mb-1">
                                <button class="btn btn-outline-light dropdown-toggle me-2" type="button"
                                    data-bs-toggle="dropdown" aria-expanded="false">
                                    Set
                                </button>
                                <ul class="dropdown-menu bg-black">
                                    <div>
                                        <li>
                                            <div class="py-1 px-2">
                                                <div class="form-check">
                                                    <input @change="addFilters('Set', setname, name);displaynfts()"
                                                        class="form-check-input" type="checkbox"
                                                        
                                                        id="setname + 'SetCheck'">
                                                    <label class="form-check-label" for="setname + 'SetCheck'">
                                                       
                                                    </label>
                                                </div>
                                            </div>
                                        </li>
                                    </div>
                                </ul>
                            </div>
                            <!-- Status -->
                            <div class="order-3 dropdown mb-1">
                                <button class="btn btn-outline-light dropdown-toggle me-2" type="button"
                                    data-bs-toggle="dropdown" aria-expanded="false">
                                    Status
                                </button>
                                <ul class="dropdown-menu bg-black">
                                    <li>
                                        <div class="py-1 px-2">
                                            <div class="form-check">
                                                <input @change="addFilters('Status', name);displaynfts()"
                                                    class="form-check-input" type="checkbox" >
                                                <label class="form-check-label" for="name + 'StatusCheck'">
                                                   
                                                </label>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <!-- Currency -->
                            <div class="order-4 dropdown mb-1 ">
                                <button class="btn btn-outline-light dropdown-toggle me-2" type="button"
                                    data-bs-toggle="dropdown" aria-expanded="false">
                                    Currency
                                </button>
                                <ul class="dropdown-menu bg-black">
                                    <li>
                                        <div class="py-1 px-2">
                                            <div class="form-check">
                                                <input @change="addFilters('Currency', name);displaynfts()"
                                                    class="form-check-input" type="checkbox" >
                                                <label class="form-check-label" for="name + 'CurrencyCheck'">
                                                 
                                                </label>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                        </div>

                        <div class="d-flex flex-row flex-wrap mt-2 order-last" >
                            <!-- Active Filters -->
                            <div
                                class="rounded bg-secondary text-black filter-bubble me-1 mb-1 d-flex align-items-center">
                                <span></span>
                                <button @click="clearFilters(item)" type="button"
                                    class="ms-1 btn-close btn-close-white"></button>
                            </div>
                            <button @click="clearFilters()" type="button"
                                class="btn btn-secondary mb-1">
                                Clear All
                            </button>
                        </div>


                    </div>

                </div>
                <div class="d-flex align-items-center mx-1">
                    <h5 class="mb-0"> Items</h5>
                    <div class="d-none d-sm-flex d-md-none ms-auto">
                        <div class="btn-group">
                            <input type="radio" class="btn-check" name="smView" id="setSingle" autocomplete="off" />
                            <label class="btn btn-outline-warning" for="setSingle"><i
                                    class="fa-regular fa-square fa-fw"></i></label>
                            <input type="radio" class="btn-check" name="smView" id="setDouble" autocomplete="off"
                                checked />
                            <label class="btn btn-outline-warning" for="setDouble"><i
                                    class="fa-solid fa-table-cells-large fa-fw"></i></label>
                        </div>
                    </div>

                </div>
                <div class="d-flex flex-wrap mt-2 d-none d-xl-flex mx-1">
                    <!-- Active Filters -->
                    <div class="rounded bg-secondary text-black filter-bubble me-1 mb-1 d-flex align-items-center">
                        <span></span>
                        <button @click="clearFilters(item)" type="button"
                            class="ms-1 btn-close btn-close-white"></button>
                    </div>
                    <button @click="clearFilters()" type="button"
                        class="btn btn-secondary mb-1">
                        Clear All
                    </button>
                </div>
    </div>

    <div class="me-auto">
        <!-- items -->
        <div class="d-flex flex-wrap ">
            <div class="card bg-blur-darkg col-4 col-sm-3 col-md-2 col-lg-1 col-xl-1 m-05 p-05 me-auto" v-for="file in filesArray" style="min-width:150px;">
                <div class="text-start">
                    <a :href="'https://ipfs.dlux.io/ipfs/' + file" target="_blank" class="no-decoration"><div class="small text-black-50 text-truncate">{{newMeta[file.i][file.index * 4 + 1] || file}}.{{ newMeta[file.i][file.index * 4 + 2] }}</div></a>
                    <h5 class="m-0 ms-auto align-self-end"><span class="d-none badge square rounded-top border border-bottom-0 bg-info border-light-50" :class="smartColor(newMeta[file.i][file.index * 4 + 4])"><i :class="smartIcon(newMeta[file.i][file.index * 4 + 4])"></i>{{ newMeta[file.i][file.index * 4 + 2] }}</span></h5>
                    <div class="bg-light">    
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                                viewBox="0 0 800 800" style="enable-background:new 0 0 800 800;" xml:space="preserve">
                            <g>
                                <path class="st0" d="M650,210H500c-5.5,0-10-4.5-10-10V50c0-5.5,4.5-10,10-10s10,4.5,10,10v140h140c5.5,0,10,4.5,10,10
                                    S655.5,210,650,210z"/>
                                <path class="st0" d="M650,309.7c-5.5,0-10-4.5-10-10v-95.5L495.9,60H200c-22.1,0-40,17.9-40,40v196.3c0,5.5-4.5,10-10,10
                                    s-10-4.5-10-10V100c0-33.1,26.9-60,60-60h300c2.7,0,5.2,1,7.1,2.9l150,150c1.9,1.9,2.9,4.4,2.9,7.1v99.7
                                    C660,305.2,655.5,309.7,650,309.7z"/>
                                <path class="st0" d="M600,760H200c-33.1,0-60-26.9-60-60V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150c0,22.1,17.9,40,40,40h400
                                    c22.1,0,40-17.9,40-40V550c0-5.5,4.5-10,10-10s10,4.5,10,10v150C660,733.1,633.1,760,600,760z"/>
                                <path class="st0" d="M550,560H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h300c5.5,0,10,4.5,10,10S555.5,560,550,560z"/>
                                <path class="st0" d="M400,660H250c-5.5,0-10-4.5-10-10s4.5-10,10-10h150c5.5,0,10,4.5,10,10S405.5,660,400,660z"/>
                                <path class="st0" d="M650,560H150c-33.1,0-60-26.9-60-60l0,0V346.3c0-33.1,26.9-60,60-60l0,0h0.4l500,3.3
                                    c32.9,0.3,59.5,27.1,59.6,60V500C710,533.1,683.2,560,650,560C650,560,650,560,650,560z M150,306.3c-22.1,0-40,17.9-40,40V500
                                    c0,22.1,17.9,40,40,40h500c22.1,0,40-17.9,40-40V349.7c-0.1-22-17.8-39.8-39.8-40l-500-3.3H150z"/>
                                <text transform="matrix(1 0 0 1 233.3494 471.9725)" class="st1 st2" style="text-transform: uppercase; font-size: 149px;">{{newMeta[file.i][file.index * 4 + 2]}}</text>
                            </g>
                        </svg>
                    </div>

                    

                    <div class="mt-1">
                            <!-- link -->
                            <div v-if="!flagDecode(newMeta[file.i][file.index * 4 + 4]).enc">
                                <a :href="'https://ipfs.dlux.io/ipfs/' + file.f" target="_blank" class="w-100 btn btn-sm btn-primary mb-1 mx-auto"><span class="d-flex align-items-center">URL<i class="ms-auto fa-solid fa-fw fa-up-right-from-square"></i></span></a>
                            </div>
                            <!-- decrypt  -->
                            <div v-if="flagDecode(newMeta[file.i][file.index * 4 + 4]).enc && !decoded">
                                <button type="button" class="w-100 btn btn-sm btn-primary mb-1 mx-auto" @click="decode(file.i)"><span class="d-flex align-items-center w-100">Decrypt<i class="fa-solid fa-fw ms-auto fa-lock-open"></i></span></button>
                            </div>
                            <!-- download enc -->
                            <div v-if="flagDecode(newMeta[file.i][file.index * 4 + 4]).enc && decoded">
                                <button type="button" class="w-100 btn btn-sm btn-primary mb-1 mx-auto" @click="download(file.i, file)"><span class="d-flex align-items-center w-100">Download<i class="fa-solid fa-download fa-fw ms-auto"></i></span></button>
                            </div>
                            <!-- add to post -->
                            <div v-if="assets">
                                <button type="button" class="w-100 btn btn-sm btn-purp mb-1 mx-auto" @click="addToPost(file.f, contract.i, index)"><span class="d-flex align-items-center w-100">Add to Post<i class="fa-solid fa-plus fa-fw ms-auto"></i></span></button>
                            </div>
                            <!-- add to asset -->
                            <div v-if="assets">
                                <button type="button" class="w-100 btn btn-sm btn-purp mb-1 mx-auto" @click="addAsset(file, contract)"><span class="d-flex align-items-center w-100">Add asset<i class="fa-solid fa-plus fa-fw ms-auto"></i></span></button>
                            </div>
                    </div>
                    <span class="text-break small text-muted">{{fancyBytes(file.s)}}</span>
                    <div v-for="flag in flagsDecode(newMeta[file.i][file.index * 4 + 4])">
                        <span class="d-flex align-items-center w-100">{{flag.l}}<i :class="flag.fa"></i></span>
                    </div>
                    <div v-for="label in labelsDecode(newMeta[file.i][file.index * 4 + 4])">
                        <span class="d-flex align-items-center w-100">{{label.l}}<i :class="label.fa"></i></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
   `,
    props: {
        assets: {
            type: Boolean,
            default: false,
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
                    t: 10,
                    extend: 7,

                }];
            }
        },
    },
    data() {
        return {
            files: {},
            filesArray: [],
            contract: {},
            newMeta: {},
            decoded: false,
            debounce: null,
            labels: {
                ["0"]: { fa: "fa-solid fa-sink fa-fw me-1", l: "Miscellaneous"},
                ["1"]: { fa: "fa-solid fa-exclamation fa-fw me-1", l: "Important"},
                ["2"]: { fa: "fa-solid fa-star fa-fw me-1", l: "Favorite"},
                ["3"]: { fa: "fa-solid fa-dice fa-fw me-1", l: "Random"},
                ["4"]: { fa: "fa-solid fa-circle fa-fw me-1 text-red", l: "Red"},
                ["5"]: { fa: "fa-solid fa-circle fa-fw me-1 text-orange", l: "Orange"},
                ["6"]: { fa: "fa-solid fa-circle fa-fw me-1 text-yellow", l: "Yellow"},
                ["7"]: { fa: "fa-solid fa-circle fa-fw me-1 text-green", l: "Green"},
                ["8"]: { fa: "fa-solid fa-circle fa-fw me-1 text-blue", l: "Blue"},
                ["9"]: { fa: "fa-solid fa-circle fa-fw me-1 text-purple", l: "Purple"},
                ["A"]: { fa: "fa-solid fa-circle fa-fw me-1 text-grey", l: "Grey"},
                ["B"]: { fa: "fa-solid fa-briefcase fa-fw me-1", l: "Work"},
                ["C"]: { fa: "fa-solid fa-heart fa-fw me-1", l: "Personal"},
                ["D"]: { fa: "fa-solid fa-people-roof fa-fw me-1", l: "Family"},
                ["E"]: { fa: "fa-solid fa-people-group fa-fw me-1", l: "Friends"},
                ["F"]: { fa: "fa-solid fa-rocket fa-fw me-1", l: "Projects"},
                ["G"]: { fa: "fa-solid fa-piggy-bank fa-fw me-1", l: "Finance"},
                ["H"]: { fa: "fa-solid fa-kit-medical fa-fw me-1", l: "Health"},
                ["I"]: { fa: "fa-solid fa-graduation-cap fa-fw me-1", l: "Education"},
                ["J"]: { fa: "fa-solid fa-compass fa-fw me-1", l: "Travel"},
                ["K"]: { fa: "fa-regular fa-calendar-days fa-fw me-1", l: "Events"},
                ["L"]: { fa: "fa-solid fa-camera fa-fw me-1", l: "Photography"},
                ["M"]: { fa: "fa-solid fa-gamepad fa-fw me-1", l: "Gaming"},
                ["N"]: { fa: "fa-solid fa-volleyball fa-fw me-1", l: "Sports"},
                ["O"]: { fa: "fa-solid fa-feather fa-fw me-1", l: "Blogging"},
                ["P"]: { fa: "fa-solid fa-crown fa-fw me-1", l: "Meme"},
                ["Q"]: { fa: "fa-solid fa-music fa-fw me-1", l: "Music"},
                ["R"]: { fa: "fa-solid fa-video fa-fw me-1", l: "Video"},
                ["S"]: { fa: "fa-solid fa-microphone fa-fw me-1", l: "Audio"},
                ["T"]: { fa: "fa-solid fa-newspaper fa-fw me-1", l: "News"},
                ["U"]: { fa: "fa-solid fa-code fa-fw me-1", l: "Development"},
                ["V"]: { fa: "fa-solid fa-hat-cowboy fa-fw me-1", l: "Fashion"},
                ["W"]: { fa: "fa-solid fa-burger fa-fw me-1", l: "Food"},
                ["X"]: { fa: "fa-solid fa-utensils fa-fw me-1", l: "Cooking"},
                ["Y"]: { fa: "fa-solid fa-toolbox fa-fw me-1", l: "DIY"},
                ["Z"]: { fa: "fa-solid fa-paintbrush fa-fw me-1", l: "Art"},
                ["a"]: { fa: "fa-solid fa-swatchbook fa-fw me-1", l: "Design"},
                ["b"]: { fa: "fa-solid fa-microchip fa-fw me-1", l: "Technology"},
                ["c"]: { fa: "fa-solid fa-cross fa-fw me-1", l: "Religion"},
                ["d"]: { fa: "fa-solid fa-scale-balanced fa-fw me-1", l: "Government"},
                ["e"]: { fa: "fa-solid fa-landmark-dome fa-fw me-1", l: "Politics"},
                ["f"]: { fa: "fa-solid fa-vial fa-fw me-1", l: "Science"},
                ["g"]: { fa: "fa-solid fa-magnifying-glass fa-fw me-1", l: "Research"},
                ["h"]: { fa: "fa-solid fa-receipt fa-fw me-1", l: "Receipts"},
                ["i"]: { fa: "fa-solid fa-envelope-open-text fa-fw me-1", l: "Correspondence"},
                ["j"]: { fa: "fa-solid fa-copy fa-fw me-1", l: "Templates"},
                ["k"]: { fa: "fa-solid fa-file-lines fa-fw me-1", l: "Resources"},
                ["l"]: { fa: "fa-solid fa-book-bookmark fa-fw me-1", l: "Reference"},
                ["m"]: { fa: "fa-solid fa-floppy-disk fa-fw me-1", l: "Backups"},
                ["n"]: { fa: "fa-solid fa-box-archive fa-fw me-1", l: "Archive"},
                ["o"]: { fa: "fa-solid fa-compass-drafting fa-fw me-1", l: "Drafts"},
                ["p"]: { fa: "fa-solid fa-flag-checkered fa-fw me-1", l: "Finished"},
                ["q"]: { fa: "fa-solid fa-paper-plane fa-fw me-1", l: "Sent"},
                ["r"]: { fa: "fa-solid fa-clock fa-fw me-1", l: "Pending"},
                ["s"]: { fa: "fa-solid fa-thumbs-up fa-fw me-1", l: "Approved"},
                ["t"]: { fa: "fa-solid fa-thumbs-down fa-fw me-1", l: "Rejected"},
                ["u"]: { fa: "fa-solid fa-lightbulb fa-fw me-1", l: "Ideas"},
                ["v"]: { fa: "fa-solid fa-bullseye fa-fw me-1", l: "Goals"},
                ["w"]: { fa: "fa-solid fa-list-check fa-fw me-1", l: "Tasks"},
                ["x"]: { fa: "fa-solid fa-gavel fa-fw me-1", l: "Legal"},
                ["y"]: { fa: "fa-solid fa-handshake fa-fw me-1", l: "Networking"},
                ["z"]: { fa: "fa-solid fa-comments fa-fw me-1", l: "Feedback"},
                ["+"]: { fa: "fa-solid fa-square-poll-vertical fa-fw me-1", l: "Surveys"},
                ["="]: { fa: "fa-solid fa-user-secret fa-fw me-1", l: "Classified"}
            }

        };
    },
    emits: ["addassets"],
    methods: {
        addAsset(id, contract) {
            this.$emit("addassets", { id, contract });
        },
        AESDecrypt(encryptedMessage, key) {
            const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
            return bytes.toString(CryptoJS.enc.Utf8);
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
        smartThumb(contract, index, cid) {
            var thumb = this.newMeta[contract][index * 4 + 3] || ''
            if (thumb.includes('Qm')) return `https://ipfs.dlux.io/ipfs/${thumb}`
            if (thumb.includes('https')) return thumb
            switch (this.newMeta[contract][index * 4 + 2]) {
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'gif':
                case 'bmp':
                case 'webp':
                case 'tiff':
                case 'tif':
                case 'svg':
                    return `https://ipfs.dlux.io/ipfs/${cid}`
                case 'mp4':
                case 'mov':
                    return `/img/mov-file-type-svgrepo-com.svg`
                case 'avi':
                    return `/img/avi-file-type-svgrepo-com.svg`
                case 'gltf':
                case 'glb':
                    return `/img/dluxdefault.png`
                case 'html':
                case 'htm':
                    return `/img/html-file-type-svgrepo-com.svg`
                case 'pdf':
                    return `/img/pdf-file-type-svgrepo-com.svg`
                case 'txt':
                case 'json':
                case 'md':
                case 'xml':
                case 'yaml':
                case 'yml':
                case 'js':
                    return `/img/txt-file-type-svgrepo-com.svg`
                case 'csv':
                    return `/img/csv-file-type-svgrepo-com.svg`
                case 'css':
                case 'scss':
                    return `/img/css-file-type-svgrepo-com.svg`
                case 'mp3':
                    return `/img/mp3-file-type-svgrepo-com.svg`
                case 'wav':
                    return `/img/wav-file-type-svgrepo-com.svg`
                case 'rar':
                    return `/img/rar-file-type-svgrepo-com.svg`
                case 'zip':
                    return `/img/zip-file-type-svgrepo-com.svg`
                case '':
                    return '/img/other-file-type-svgrepo-com.svg'
                case 'enc': //encrypted
                default:
                    return '/img/other-file-type-svgrepo-com.svg'
            }
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
        flagsDecode(flags = "") {
            var num = this.Base64toNumber(flags[0])
            var out = []
            if (num & 1) out.push({fa: 'fa-solid fa-lock', l: "Encrypted"})
            if (num & 2) out.push({fa: 'fa-solid fa-arrows-rotate text-green', l: "AutoRenew"})
            if (num & 4) out.push({fa: 'fa-solid fa-radiation text-yellow', l: "NSFW"})
            if (num & 8) out.push({fa: 'fa-regular fa-file-code text-blue', l: "Executable"})
            return out
        },
        labelsDecode(flags = "") {
            var arr = []
            if(flags.length < 2) return arr
            else for (var i = 1; i < flags.length; i++) {
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
        init() {

            for (var i in this.contracts) {
                if (this.contracts[i].c == 1) continue
                const id = this.contracts[i].i
                this.contract[id] = this.contracts[i];
                var keys = Object.keys(this.contracts[i].df)
                for (var j in keys) {
                    const f = {
                        i: id,
                        f: keys[i],
                        index: j,
                        s: this.contracts[i].df[keys[j]]
                    }
                    this.filesArray.push(f);
                }
                if (!this.contract[id].m) {
                    this.contract[id].m = ""
                    const filesNum = this.contracts[i].df ? Object.keys(this.contracts[i].df).length : 0
                    this.newMeta[id] = new Array(filesNum * 4 + 1).fill('')
                } else {
                    this.newMeta[id] = this.contract[id].m.split(",")
                }
            }
            this.filesArray = new Set(this.filesArray)
            this.files = this.contract.df;
        }
    },
    computed: {
        hasFiles() {
            return Object.keys(this.files).length > 0;
        }
    },
    watch: {
        'contracts': {
            handler: function (newValue) {
                if (this.debounce && new Date().getTime() - this.debounce < 1000) {
                    return
                }
                this.init()
                this.debounce = new Date().getTime()
            },
            deep: true
        }
    },
    mounted() { },
};