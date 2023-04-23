export default {
  data() {
    return {
      messages: [],
      inputMessage: '',
      uname: '',
      pass: '',
    };
  },
  props: {
    models: {
      default: function () {
        return [];
      },
    },
    account: {
      default: ''
    },
    temp: {
      default: ''
    },
    model: {
      default: 'davinci'
    },
    n: {
      default: 1
    },
    max_len: {
      default: 1000
    },
    max_tokens: {
      default: 50
    },
    top_p: {
      default: 0
    },
    f_penalty: {
      default: 1
    },
    p_penalty: {
      default: 0.5
    }
  },
  template: `
    <div class="content p-0 flex-grow-1 row position-relative">
    <div class="chat-content-area d-flex flex-column" ref="chatContentArea">
      <!-- START CHAT -->
        <div v-for="(message, index) in messages" :key="index" v-bind:class="{'gpt-chat-box': message.role == 'bot'}" class="row chat-box">
          <div class="ms-auto me-auto d-flex" style="max-width: 768px;">
            <div class="chat-icon">
              <img v-if="message.role == 'bot'" class="chatgpt-icon me-4 " src="/img/chatgpt-icon.png" />
              <p v-if="responseTokens">{{ responseTokens }}</p>
              <img v-if="message.role == 'user'" class="chatgpt-icon me-4" :src="'https://images.hive.blog/u/' + account + '/avatar'" />
            </div>
            <div class="chat-txt">
              {{message.text}}
            </div>
          </div>
        </div>
    </div>
    <!-- START CHAT INPUTS -->
    <div class="chat-input-area position-absolute bottom-0">
      <div class="chat-inputs-area-inner h-100">
        <div class="ms-auto me-auto chat-inputs-container h-100" style="max-width: 768px;">
          <form @submit.prevent="sendMessage" class="d-flex align-items-bottom h-100">
            <textarea type="text" v-model="inputMessage" class="flex-grow-1"
              placeholder="Send a message..." @keydown.enter.exact.prevent="sendMessage"></textarea>
            <div class="mt-auto"><button class="btn sendMsg" type="submit"><i class="fa fa-paper-plane" aria-hidden="true"></i>
              </button></div>
          </form>
        </div>
        <p class="text-center">Prompt: {{ promptTokens }} Tokens | Completion: ~{{ estimatedCompletionTokens }} Tokens</p>
      </div>
    </div>
  </div>`,
  emits: ["data"],
  mounted() {
    //this.getModels();
  },
  computed: {
    promptTokens() {
      return this.inputMessage.trim().split(' ').length;
    },
    estimatedCompletionTokens() {
      // Estimate the number of completion tokens based on the length of the prompt
      const promptTokens = this.promptTokens;
      let estimatedTokens;

      if (promptTokens <= 4) {
        estimatedTokens = 10;
      } else if (promptTokens <= 10) {
        estimatedTokens = 25;
      } else if (promptTokens <= 20) {
        estimatedTokens = 50;
      } else if (promptTokens <= 40) {
        estimatedTokens = 75;
      } else {
        estimatedTokens = 100;
      }

      return estimatedTokens;
    },
    responseTokens() {
      if (this.messages.length > 0 && this.messages[this.messages.length - 1].role === 'bot') {
        return this.messages[this.messages.length - 1].tokens;
      }
      return null;
    },
  },
  methods: {
    setValuePrompt(value) { this[value] = prompt(value); return this[value]; },
    setValue(key, value) { this[key] = value },
    getModels(){
      fetch('https://gpt.dlux.io/v1/models').then(response => response.json()).then(data => {

        this.emits("data", data);
      })
    },
    async sendMessage() {

      const response = await axios.post('https://gpt.dlux.io/v1/chat/completions', {
        model: 'gpt-3.5-turbo', // gpt-3.5-turbo or gpt-3.5-turbo-0301 for v1/chat/completions endpoint
        messages: [{
          role: 'user', // required for v1/chat/completions endpoint
          content: this.inputMessage,
        }],
        temperature: 1, // range is 0 to 2, higher is more random
        top_p: 1, // recommended to use only temp or top_p, not both
        n: 1, // number of completion choices returned
        stream: false, // sends partial message deltas
        stop: null, // up to 4 sequences that stop the API
        max_tokens: 50, // max input + completion tokens
        presence_penalty: 0, // range is -2 to 2, positive promotes new topics
        frequency_penalty: 0, // range is -2 to 2, positive decreases verbatim repeats
        //logit_bias: [0.0], // range is -100 to 100, manipulates likelihood of selection and banning
        user: '', // end user to monitor and detect abuse
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: this.uname || this.setValuePrompt('uname'),
          password: this.pass || this.setValuePrompt('pass'),
        },
      });

      // Retrieve the message from the first choice and add it to the messages array
      const message = response.data.choices[0].message.content.trim();
      console.log(message); // Log the message to the console for debugging

      // Add the user role to the messages array based on whether the input message is empty or not
      if (this.inputMessage.trim() === '') {
        this.messages.push({
          text: message,
          role: 'bot'
        });
      } else {
        this.messages.push({
          text: this.inputMessage,
          role: 'user'
        });
        this.messages.push({
          text: message,
          role: 'bot'
        });
      }

      // Clear the input message
      this.inputMessage = '';

      // Get the number of tokens in the response
      const responseTokens = response.data.choices[0].tokens.length;

      // Scroll to the bottom of the chat window
      this.$nextTick(() => {
        const container = this.$refs.chatContentArea;
        container.scrollTop = container.scrollHeight;
      });

    },
  },

};
