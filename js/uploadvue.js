export default {
  template: `
    <!--file uploader-->
    <Transition>
        <div v-if="contract.i">
           
                <div >
                  <form onsubmit="return false;">
                      <div class="d-flex justify-content-between align-items-center">
                          <div class="ms-auto me-auto my-3">
                              <label for="formFile" class="btn btn-lg btn-light"><i
                                      class="fa-solid fa-file-circle-plus fa-fw me-2"></i>Select Files</label>
                              <input class="d-none" id="formFile" type="file" multiple @change="uploadFile">
                          </div>
                      </div>
                      <div class="pb-2">
                          <div class="mx-lg-5 py-5 text-center lead rounded"
                              style="border-width: 2px; border-style: dashed; background-color:rgba(0,0,0,0.3);"
                              id="img-well" @drop="dragFile($event)" @dragenter.prevent @dragover.prevent>
                              Or drag file(s) here
                          </div>
                      </div>
                  </form>
                </div>

                

                <div v-if="File.length" class="mx-lg-5">
                    <div class=" pt-0">

                        <div id="listOfImgs" v-if="!encryption.encrypted" v-for="(file, key,index) in FileInfo">
                            <div class="p-3 mb-2 card card-body bg-black" style="border-radius: 10px;" v-if="!FileInfo[file.name].is_thumb">
                                <div class="d-flex flex-wrap align-items-center pb-2 mb-2">
                                  <div>
                                    <h6 class="m-0 text-break"><span class="px-2 py-1 me-2 bg-darkg rounded"><i class="fa-solid fa-lock-open fa-fw"></i></span>{{file.name}}</h6>
                                  </div>
                                  
                                    <div class="flex-grow-1 mx-5" v-if="File[FileInfo[file.name].index].actions.cancel">
                                        <div class="progress" role="progressbar" aria-label="Upload progress"
                                            aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                                            <div class="progress-bar" :style="'width: ' + File[FileInfo[file.name].index].progress + '%'">
                                                {{File[FileInfo[file.name].index].progress}}%
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex-shrink" v-if="File.length">
                                        <button type="button" class="me-2 btn btn-secondary" v-if="File[FileInfo[file.name].index].actions.pause"
                                            @click="fileRequest[FileInfo[file.name].index].resumeFileUpload()">Pause</button>
                                        <button type="button" class="me-2 btn btn-secondary" v-if="File[FileInfo[file.name].index].actions.resume"
                                            @click="fileRequest[FileInfo[file.name].index].resumeFileUpload()">Resume</button>
                                        <button type="button" class="me-2 btn btn-secondary" v-if="File[FileInfo[file.name].index].actions.cancel"
                                            @click="fileRequest[FileInfo[file.name].index].resumeFileUpload()">Cancel</button>
                                    </div>
                                    <div class="ms-auto">
                                        <button class="btn btn-danger" @click="deleteImg(FileInfo[file.name].index, file.name)"
                                            data-toggle="tooltip" data-placement="top" title="Delete Asset"><i
                                                class="fas fa-fw fa-trash-alt"></i></button>
                                    </div>
                                </div>

                                <div class="d-flex w-100" v-if="FileInfo[file.name]">
                                    <ul class="text-start w-100">
                                        <li class="">Bytes: {{fancyBytes(File[FileInfo[file.name].index].size)}}</li>
                                        <li class="">CID:
                                            {{FileInfo[file.name].hash}}</li>
                                        <li class="">Status:
                                            {{FileInfo[file.name].status}}
                                        </li>
                                        <li class=""><a :href="'https://ipfs.dlux.io/ipfs/' + FileInfo[file.name].hash"
                                                target="_blank">{{FileInfo[file.name].hash}}<i
                                                    class="fa-solid fa-up-right-from-square fa-fw ms-1"></i></a>
                                        </li>
                                    </ul>
                                </div>

                                <div class="d-flex flex-wrap align-items-center mx-1 mb-1 px-2 py-1 rounded bg-dark" v-if="FileInfo['thumb' + file.name]">
                                  <div class="mx-1">
                                    <img :src="FileInfo['thumb' + file.name].fileContent" class="img-thumbnail"></img>
                                  </div>
                                  <div class="d-flex flex-column flex-grow-1 mx-1">
                                    <div class="fs-5 fw-bold border-bottom border-light border-2">File thumbnail has been generated</div>
                                    <div class="fw-6">Thumbnail Size: {{fancyBytes(FileInfo['thumb' + file.name].size)}}</div>
                                    <div class="fw-6 text-break">CID: {{FileInfo['thumb' + file.name].hash}}</div>
                                    <div class="d-flex align-items-center mt-2">
                                      <div class="me-auto fs-5">
                                        Use thumbnail
                                      </div>
                                      <div class="form-check form-switch">
                                        <input class="form-check-input fs-4" type="checkbox" role="switch" id="includeThumb" checked>
                                        <label class="form-check-label" for="includeThumb"></label>
                                      </div>
                                    </div>
                                    
                                  </div>
                                  
                                  <div>

                                  </div>

                                </div>
                                <!--v-if="!FileInfo['thumb' + file.name]"-->
                                <div class="d-flex flex-wrap align-items-center mx-1 px-2 py-2 mb-1 rounded bg-dark" >
                                  <div class="flex-grow-1 mx-sm-2">
                                    <div class="d-flex flex-column">
                                      <label>Add a custom thumbnail</label>
                                      <input class="form-control" placeholder="https://your-image-url.com">
                                    </div>
                                    <div class="d-flex flex-column">
                                      <div class="position-relative">
                                        <div class="position-absolute start-50 translate-middle rounded bg-secondary text-black px-2 py-1">Tags</div>

                                        <div class="d-flex align-items-center mt-2">
                                          <div class="me-auto fs-5">
                                            NSFW (Not Safe For Work)
                                          </div>
                                          <div class="form-check form-switch">
                                            <input class="form-check-input fs-4" type="checkbox" role="switch" id="includeThumb" checked>
                                            <label class="form-check-label" for="includeThumb"></label>
                                          </div>
                                        </div>

                                        <div class="d-flex align-items-center mt-2">
                                          <div class="me-auto fs-5">
                                            Executable
                                          </div>
                                          <div class="form-check form-switch">
                                            <input class="form-check-input fs-4" type="checkbox" role="switch" id="includeThumb" checked>
                                            <label class="form-check-label" for="includeThumb"></label>
                                          </div>
                                        </div>

                                        <div class="d-flex align-items-center mt-2">
                                          <div class="me-auto fs-5">
                                            Licensable
                                          </div>
                                          <div class="form-check form-switch">
                                            <input class="form-check-input fs-4" type="checkbox" role="switch" id="includeThumb" checked>
                                            <label class="form-check-label" for="includeThumb"></label>
                                          </div>
                                        </div>
                                        

                                  </div>
                                </div>

                                
                            </div>
                        </div>

                        <div id="listOfEncs"  v-if="encryption.encrypted" v-for="(file, key,index) in FileInfo">
                            <div class="p-3 mb-2 card card-body bg-black" v-if="!FileInfo[file.name].is_thumb">
                                <div class="d-flex flex-wrap align-items-center pb-2 mb-2">
                                  <div>
                                    <h6 class="m-0 text-break"><span class="px-2 py-1 me-2 bg-darkg rounded"><i class="fa-solid fa-lock fa-fw"></i></span>{{file.name}}</h6>
                                  </div>
                                    <div class="flex-grow-1 mx-5" v-if="File[FileInfo[file.name].enc_index].actions.cancel">
                                        <div class="progress" role="progressbar" aria-label="Upload progress"
                                            aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">
                                            <div class="progress-bar" :style="'width: ' + File[FileInfo[file.name].enc_index].progress + '%'">
                                                {{File[FileInfo[file.name].enc_index].progress}}%
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex-shrink" v-if="File.length">
                                        <button type="button" class="me-2 btn btn-secondary" v-if="File[FileInfo[file.name].enc_index].actions.pause"
                                            @click="fileRequest[FileInfo[file.name].enc_index].resumeFileUpload()">Pause</button>
                                        <button type="button" class="me-2 btn btn-secondary" v-if="File[FileInfo[file.name].enc_index].actions.resume"
                                            @click="fileRequest[FileInfo[file.name].enc_index].resumeFileUpload()">Resume</button>
                                        <button type="button" class="me-2 btn btn-secondary" v-if="File[FileInfo[file.name].enc_index].actions.cancel"
                                            @click="fileRequest[FileInfo[file.name].enc_index].resumeFileUpload()">Cancel</button>
                                    </div>
                                    <div class="ms-auto">
                                        <button class="btn btn-danger" @click="deleteImg(FileInfo[file.name].enc_index, file.name)"
                                            data-toggle="tooltip" data-placement="top" title="Delete Asset"><i
                                                class="fas fa-fw fa-trash-alt"></i></button>
                                    </div>
                                </div>
                                <div class="d-flex w-100" v-if="FileInfo[file.name]">
                                    <ul class="text-start w-100">
                                        <li class="">Bytes: {{fancyBytes(FileInfo[file.name].enc_size)}}</li>
                                        <li class="">CID:
                                            {{FileInfo[file.name].enc_hash}}</li>
                                        <li class="">Status:
                                            {{FileInfo[file.name].status}}
                                        </li>
                                        <li class=""><a :href="'https://ipfs.dlux.io/ipfs/' + FileInfo[file.name].enc_hash"
                                                target="_blank">{{FileInfo[file.name].enc_hash}}<i
                                                    class="fa-solid fa-up-right-from-square fa-fw ms-1"></i></a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>




            <!-- encryption banner -->
            <div class="card card-body d-flex align-items-center mx-lg-5 my-3">
                <div class="d-flex flex-column w-100 flex-grow-1 mx-1 px-md-2 px-lg-5">

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
                    <div v-if="contract.c == 1" class="flex-grow-1 border-top border-bottom border-light border-1 py-2 mb-2">
                      <div  class="form-check form-switch d-flex align-items-center ps-0 mt-2 mb-3">
                          <label class="form-check-label mb-0" for="encryptCheck">ENCRYPT FILES</label>
                          <input class="form-check-input fs-2 ms-auto mt-0" type="checkbox" role="switch" id="encryptCheck" v-model="encryption.encrypted"> 
                      </div>

                      <div v-if="!encryption.encrypted" class="mb-2">Files uploaded to this contract will not be encrypted, <b>they will be publicly available on SPK Network</b></div>
                      <div v-if="encryption.encrypted" class="mb-2">Files uploaded to this contract will be encrypted, <b>only the accounts you add will have access.</b></div>

                      
                    </div>

                    
                    <!-- encrypted sharing -->
                    <div v-if="encryption.encrypted">
                        <div class="fs-3 fw-lighter">Sharing:</div>
                        <p>You can share the decryption key with a few other accounts to view the files, and you can revoke access at any time.</p>
                        <div class="d-flex mb-2">
                            <div class="me-1 flex-grow-1">
                                <div class="position-relative has-validation">
                                    <input autocapitalize="off" placeholder="username" class="form-control border-light bg-darkg text-info" v-model="encryption.input" @blur="addUser()" @keyup.enter="addUser(contract.i)">
                                </div>
                            </div>
                            <div class="ms-1">
                                <div class="btn btn-lg btn-light" @click="addUser()"><i class="fa-solid fa-fw fa-plus"></i></div>
                            </div>
                        </div>
                        <!-- shared accounts -->
                        <div class="d-flex flex-row flex-wrap" >
                            <div v-for="(a,b,c) in encryption.accounts" class="rounded text-black filter-bubble bg-white me-1 mb-1 d-flex align-items-center"> <!-- warning class for unencrypted keys --> 
                               <i class="fa-solid fa-key fa-fw me-1"  :class="{'text-primary': encryption.accounts[b].enc_key, 'text-warning': !encryption.accounts[b].enc_key}"  ></i>  
                            <span>{{b}}</span> 
                                <div v-if="b != contract.t"><button type="button" class="ms-1 btn-close small btn-close-white" @click="delUser(b)"></button></div>
                            </div>
                        </div>
                        <!-- update button -->
                        <div class="d-flex mt-3">
                            <button v-if="unkeyed" @click="checkHive()" class="mx-auto btn btn-lg btn-outline-warning"><i class="fa-solid fa-fw fa-user-lock me-2"></i>Encrypt Keys</button>
                        </div>
                    </div>
                    <div class="d-flex mb-1" v-if="contract.c == 1">
                      <button class="ms-auto me-auto mt-2 btn btn-lg btn-info" :class="{'disabled': !reallyReady}" :disabled="!reallyReady" @click="signNUpload()"><i
                              class="fa-solid fa-file-signature fa-fw me-2"></i>Sign and Upload</button>
                      </div>
                </div>
            </div>
            <!-- end encryption banner -->




        </div>
    </Transition>
   `,
  props: {
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
      File: [],
      ready: false,
      deletable: true,
    };
  },
  emits: ["tosign", "done"],
  methods: {
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
    fancyBytes(bytes) {
      var counter = 0, p = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
      while (bytes > 1024) {
        bytes = bytes / 1024
        counter++
      }
      return `${this.toFixed(bytes, 2)} ${p[counter]}B`
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
    toFixed(n, digits) {
      return parseFloat(n).toFixed(digits)
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
        console.log("Encrypted message: ", encryptedMessageOnly);
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
          console.log({ newFile })
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
        reader.readAsArrayBuffer(this.File[fileInfo.index]);
      })
    },
    uploadFile(e) {
      for (var i = 0; i < e.target.files.length; i++) {
        var reader = new FileReader();
        reader.File = e.target.files[i]
        const thisFileIndex = i
        reader.onload = (Event) => {
          const event = Event
          const target = event.currentTarget ? event.currentTarget : event.target
          const fileContent = target.result;
          for (var j = 0; j < this.File.length; j++) {
            if (
              this.File[j].name == target.File.name
              && this.File[j].size == target.File.size
            ) {
              this.hashOf(buffer.Buffer(fileContent), { i: j }).then((ret) => {
                const dict = { fileContent: new TextDecoder("utf-8").decode(fileContent), hash: ret.hash, index: ret.opts.i, size: target.File.size, name: target.File.name, path: e.target.id, progress: 0, status: 'Pending Signature' }
                console.log({ dict })
                fetch(`https://spktest.dlux.io/api/file/${ret.hash}`).then(r => r.json()).then(res => {
                  if (res.result == "Not found") {
                    this.FileInfo[dict.name] = dict
                    const file = this.File[ret.opts.i];
                    this.File.splice(ret.opts.i, 1, file);
                    this.encryptFileAndPlace(dict)
                    let that = this
                    var thumb = new FileReader();
                    thumb.onload = (e) => {
                      var originalImage = new Image();
                      originalImage.src = e.target.result
                      originalImage.addEventListener("load", function () {
                        var thumbnailImage = createThumbnail(originalImage);
                        var newFile = new File([thumbnailImage.src], 'thumb' + target.File.name, { type: 'jpeg' });
                        console.log({ newFile })
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
                            const dict = { fileContent: new TextDecoder("utf-8").decode(thumbFileContent), hash: ret.hash, index: newIndex, size: buf.byteLength, name: 'thumb' + target.File.name, path: e.target.id, progress: 0, status: 'Pending Signature', is_thumb: true }
                            that.FileInfo[target.File.name].thumb_index = newIndex
                            that.FileInfo[target.File.name].thumb = ret.hash
                            that.FileInfo['thumb' + target.File.name] = dict
                            that.File.push(newFile);
                          })
                        }
                        Reader.readAsArrayBuffer(newFile);
                      })
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
                    }
                    thumb.readAsDataURL(e.target.files[thisFileIndex]);
                  } else {
                    alert(`${target.File.name} already uploaded`)
                    delete this.FileInfo[dict.name]
                    this.File.splice(ret.opts.i, 1)
                  }
                })
              })
              break
            }
          }
        };

        reader.readAsArrayBuffer(e.target.files[i])
        var file = e.target.files[i];
        file.hash = "computing..."
        file.progress = 0;
        file.actions = {
          cancel: false,
          pause: false,
          resume: false,
        }
        this.File.push(file);
      }
      this.ready = true
    },
    dragFile(e) {
      e.preventDefault();
      var FilesTxs = {}
      for (var i = 0; i < e.dataTransfer.files.length; i++) {
        const thisFileIndex = i
        var reader = new FileReader();
        FilesTxs[i] = e.dataTransfer.files[i]
        reader.File = e.dataTransfer.files[i]
        reader.onload = (Event) => {
          const event = Event
          const target = event.currentTarget ? event.currentTarget : event.target
          const fileContent = event.target.result;
          for (var j = 0; j < this.File.length; j++) {
            if (
              this.File[j].name == target.File.name
              && this.File[j].size == target.File.size
            ) {
              this.hashOf(buffer.Buffer(fileContent), { i: j }).then((ret) => {
                const dict = { fileContent: new TextDecoder("utf-8").decode(fileContent), hash: ret.hash, index: ret.opts.i, size: target.File.size, name: target.File.name, nsfw: false, autoRenew: true, executable: false, path: e.target.id, progress: 0, status: 'Pending Signature' }

                fetch(`https://spktest.dlux.io/api/file/${ret.hash}`).then(r => r.json()).then(res => {
                  if (res.result == "Not found") {
                    this.FileInfo[dict.name] = dict
                    const file = this.File[ret.opts.i];
                    this.File.splice(ret.opts.i, 1, file);
                    this.encryptFileAndPlace(dict)
                    let that = this
                    var thumb = new FileReader();
                    thumb.onload = (ev) => {
                      var originalImage = new Image();
                      originalImage.src = ev.target.result
                      originalImage.addEventListener("load", function () {
                        var thumbnailImage = createThumbnail(originalImage);
                        var newFile = new File([thumbnailImage.src], 'thumb' + target.File.name, { type: 'jpeg' });
                        console.log({ newFile })
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
                            const dict = { fileContent: new TextDecoder("utf-8").decode(thumbFileContent), hash: ret.hash, index: newIndex, size: buf.byteLength, name: 'thumb' + target.File.name, path: e.target.id, progress: 0, status: 'Pending Signature', is_thumb: true }
                            that.FileInfo[target.File.name].thumb_index = newIndex
                            that.FileInfo[target.File.name].thumb = ret.hash
                            that.FileInfo['thumb' + target.File.name] = dict
                            that.File.push(newFile);
                          })
                        }
                        Reader.readAsArrayBuffer(newFile);
                      })
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
                    }
                    thumb.readAsDataURL(FilesTxs[thisFileIndex]);
                  } else {
                    alert(`${target.File.name} already uploaded`)
                    delete this.FileInfo[dict.name]
                    this.File.splice(ret.opts.i, 1)
                  }
                })
              })
              break
            }
          }
        };

        reader.readAsArrayBuffer(e.dataTransfer.files[i]);
        var file = e.dataTransfer.files[i]
        file.hash = "computing..."
        file.progress = 0;
        file.actions = {
          cancel: false,
          pause: false,
          resume: false,
        }
        this.File.push(file);
      }
      this.ready = true
    },
    deleteImg(index, name) {
      delete this.FileInfo[name]
      for (var item in this.FileInfo) {
        if (this.FileInfo[item].index > index) {
          this.FileInfo[item].index--
        }
      }
      this.File.splice(index, 1)
    },
    signNUpload() {
      console.log(this.contract.i)
      var header = `${this.contract.i}`
      var body = ""
      var names = Object.keys(this.FileInfo)
      var cids = []
      if (!this.encryption.encrypted) for (var i = 0; i < names.length; i++) {
        body += `,${this.FileInfo[names[i]].hash}`
        cids.push(this.FileInfo[names[i]].hash)
      }
      else for (var i = 0; i < names.length; i++) {
        if (this.FileInfo[names[i]].enc_hash) {
          body += `,${this.FileInfo[names[i]].enc_hash}`
          cids.push(this.FileInfo[names[i]].enc_hash)
        }
      }
      this.contract.files = body
      this.signText(header + body).then(res => {
        console.log({ res })
        this.contract.fosig = res.split(":")[3]
        this.upload(cids, this.contract)
        this.ready = false
      })
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
    selectContract(id, broker) {  //needs PeerID of broker
      this.contract.id = id
      fetch(`https://spktest.dlux.io/user_services/${broker}`)
        .then(r => r.json())
        .then(res => {
          console.log(res)
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
      if (fileInfo.lic) num += 16
      if (fileInfo.tbd) num += 32
      var flags = this.NumberToBase64(num)
      //append category chars here
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
    NumberToBase64(num) {
      const glyphs =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+=";
      var result = "";
      while (num > 0) {
        result = glyphs[num % 64] + result;
        num = Math.floor(num / 64);
      }
      return result;
    },
    upload(cids = ['QmYJ2QP58rXFLGDUnBzfPSybDy3BnKNsDXh6swQyH7qim3'], contract) { // = { api: 'https://ipfs.dlux.io', id: '1668913215284', sigs: {}, s: 10485760, t: 0 }) {
      var files = []
      var meta = `1${this.stringOfKeys()},` //1 is auto renew
      for (var name in this.FileInfo) {
        for (var i = 0; i < cids.length; i++) {
          if (this.FileInfo[name].hash == cids[i]) {
            this.File[this.FileInfo[name].index].cid = cids[i]
            files.push(this.File[this.FileInfo[name].index])
            //get everything before the last .
            var Filename = name.split('.').slice(0, -1).join('')
            //get everything after the last
            var ext = name.split('.').slice(-1).join('')
            meta += `${Filename},${ext},${this.FileInfo[name].thumb || ''},${this.flagEncode(this.FileInfo[name])},`
            break;
          } else if (this.FileInfo[name].enc_hash == cids[i]) {
            this.File[this.FileInfo[name].enc_index].cid = cids[i]
            files.push(this.File[this.FileInfo[name].enc_index])
            //get everything before the last .
            var Filename = name.split('.').slice(0, -1).join('')
            //get everything after the last
            var ext = name.split('.').slice(-1).join('')
            meta += `${Filename},${ext},,${this.flagEncode(this.FileInfo[name])},`
            break;
          }
        }
      }
      console.log({ cids }, files, meta)
      const ENDPOINTS = {
        UPLOAD: `${this.contract.api}/upload`,
        UPLOAD_STATUS: `${this.contract.api}/upload-check`,
        UPLOAD_REQUEST: `${this.contract.api}/upload-authorize`
      };
      const defaultOptions = {
        url: ENDPOINTS.UPLOAD,
        startingByte: 0,
        contract: contract,
        cid: null,
        cids: `${cids.join(',')}`,
        meta: encodeURI(meta),
        onAbort: (e, f) => {
          console.log('options.onAbort')
          // const fileObj = files.get(file);
          this.File = []
          this.FileInfo = {}
          this.fileRequests = {}
          // updateFileElement(fileObj);
        },
        onProgress: (e, f) => {
          console.log('options.onProgress', e, f, this.FileInfo, this.File, this.File[this.FileInfo[f.name].index])
          this.File[this.FileInfo[f.name].index].actions.pause = true
          this.File[this.FileInfo[f.name].index].actions.resume = false
          this.File[this.FileInfo[f.name].index].actions.cancel = true
          this.File[this.FileInfo[f.name].index].progress = e.loaded / e.total * 100
          // const fileObj = files.get(file);
          this.FileInfo[f.name].status = this.File[this.FileInfo[f.name].index].progress < 100 ? `uploading(${this.File[this.FileInfo[f.name].index].progress}%)` : 'done'
          // fileObj.status = FILE_STATUS.UPLOADING;
          // fileObj.percentage = e.percentage;
          // fileObj.uploadedChunkSize = e.loaded;

          // updateFileElement(fileObj);
        },
        onError: (e, f) => {
          console.log('options.onError', e, f)
          if (e.name) {
            // const fileObj = files.get(file);
            this.FileInfo[e.name].status = '!!ERROR!!'
            // fileObj.status = FILE_STATUS.FAILED;
            // fileObj.percentage = 100;
            this.File[this.FileInfo[e.name].index].actions.pause = false
            this.File[this.FileInfo[e.name].index].actions.resume = true
            this.File[this.FileInfo[e.name].index].actions.cancel = true
            // updateFileElement(fileObj);
          }
        },
        onComplete: (e, f) => {
          console.log('options.onComplete', e, f)
          this.File[this.FileInfo[f.name].index].actions.pause = false
          this.File[this.FileInfo[f.name].index].actions.resume = false
          this.File[this.FileInfo[f.name].index].actions.cancel = false
          this.FileInfo[f.name].progress = 100
          this.File[this.FileInfo[f.name].index].progress = 100
          this.FileInfo[f.name].status = 'done'
          var done = true
          for (var file in this.FileInfo) {
            if (this.FileInfo[file].status != 'done') {
              done = false
              break;
            }
          }
          if (done) {
            setTimeout(() => {
              this.$emit('done', this.contract)
            }, 5000)
          }
        }
      };
      const uploadFileChunks = (file, options) => {
        const formData = new FormData();
        const req = new XMLHttpRequest();
        const chunk = file.slice(options.startingByte);

        formData.append('chunk', chunk);
        console.log(options)
        req.open('POST', options.url, true);
        req.setRequestHeader(
          'Content-Range', `bytes=${options.startingByte}-${options.startingByte + chunk.size}/${file.size}`
        );
        req.setRequestHeader('X-Cid', options.cid);
        req.setRequestHeader('X-Contract', options.contract.i);
        req.setRequestHeader('X-Sig', options.contract.fosig);
        req.setRequestHeader('X-Account', options.contract.t);
        req.setRequestHeader('X-Files', options.cids);
        req.setRequestHeader('X-Meta', options.meta);


        req.onload = (e) => {
          if (req.status === 200) {
            options.onComplete(e, file);
          } else {
            options.onError(e, file);
          }
        };

        req.upload.onprogress = (e) => {
          const loaded = options.startingByte + e.loaded;
          options.onProgress({
            ...e,
            loaded,
            total: file.size,
            percentage: loaded / file.size * 100
          }, file);
        };

        req.ontimeout = (e) => options.onError(e, file);

        req.onabort = (e) => options.onAbort(e, file);

        req.onerror = (e) => options.onError(e, file);

        this.fileRequests[options.cid].request = req;

        req.send(formData);
      };
      const uploadFile = (file, options, cid) => {
        console.log('Uploading', cid, options, file)
        return fetch(ENDPOINTS.UPLOAD_REQUEST, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Sig': options.contract.fosig,
            'X-Account': options.contract.t,
            'X-Contract': options.contract.i,
            'X-Cid': cid,
            'X-Files': options.contract.files,
            'X-Meta': options.meta,
            'X-Chain': 'HIVE'
          }
        })
          .then(res => res.json())
          .then(res => {
            console.log('Chunking', options, file)
            options = { ...options, ...res };
            options.cid = cid
            this.fileRequests[cid] = { request: null, options }
            uploadFileChunks(file, options);
          })
          .catch(e => {
            console.log(e)
            options.onError({ ...e, file })
          })
      };
      const abortFileUpload = (file) => {
        const fileReq = fileRequests.get(file);

        if (fileReq && fileReq.request) {
          fileReq.request.abort();
          return true;
        }

        return false;
      };
      const retryFileUpload = (file) => {
        const fileReq = fileRequests.get(file);

        if (fileReq) {
          // try to get the status just in case it failed mid upload
          return fetch(
            `${ENDPOINTS.UPLOAD_STATUS}?fileName=${file.name}&fileId=${fileReq.options.fileId}`)
            .then(res => res.json())
            .then(res => {
              // if uploaded we continue
              uploadFileChunks(
                file,
                {
                  ...fileReq.options,
                  startingByte: Number(res.totalChunkUploaded)
                }
              );
            })
            .catch(() => {
              // if never uploaded we start
              uploadFileChunks(file, fileReq.options)
            })
        }
      };
      const clearFileUpload = (file) => {
        const fileReq = fileRequests.get(file);

        if (fileReq) {
          abortFileUpload(file)
          fileRequests.delete(file);

          return true;
        }

        return false;
      };
      const resumeFileUpload = (file) => {
        const fileReq = this.fileRequests[cid];

        if (fileReq) {
          return fetch(
            `${ENDPOINTS.UPLOAD_STATUS}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'sig': contract.fosig,
              'account': contract.t,
              'contract': contract.i,
              'cid': cid
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
      [...files]
        .forEach(file => {
          let options = defaultOptions
          options.cid = file.cid
          uploadFile(file, options, file.cid)
        });
    },
    appendFile(file, id) {
      if (this.files[file]) delete this.files[file]
      else this.files[file] = id
    },
    uploadAndTrack(name, contract) {
      this.signText().then((headers) => {
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

          //append progress box
          uploader = uploadFiles(uploadedFiles, {
            onProgress,
            onError,
            onAbort,
            onComplete
          });
        }
      });
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