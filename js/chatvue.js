export default {
  data() {
    return {
      messages: [],
      inputMessage: '',
      uname: '',
      pass: '',
      promptTokens: 0,
      completionTokens: 0,
      show_tokens: true,
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
      default: 'gpt-3.5-turbo'
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
    },
    show_tokens: {
      default: true
    },
  },
  template: `
    <div class="content p-0 flex-grow-1 row position-relative">
    <div class="chat-content-area d-flex flex-column" ref="chatContentArea">
      <!-- START CHAT -->
        <div v-for="(message, index) in messages" :key="index" v-bind:class="{'gpt-chat-box': message.role == 'bot'}" class="row chat-box">
          <div class="ms-auto me-auto d-flex" style="max-width: 768px;">
            <div class="chat-icon position-relative me-4" v-if="message.role == 'bot'">
              <img class="chatgpt-icon" src="/img/chatgpt-icon.png" />
              <span v-if="show_tokens" class="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-dark">
                {{ message.tokens }}
                <span class="visually-hidden">Prompt Tokens</span>
              </span>
            </div>
            <div class="chat-icon position-relative me-4" v-if="message.role == 'user'">
              <img class="chatgpt-icon" :src="'https://images.hive.blog/u/' + account + '/avatar'" />
              <span v-if="show_tokens" class="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-dark">
              {{ message.tokens }}
                <span class="visually-hidden">Completion Tokens</span>
              </span>
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
        <p class="text-center">Prompt: {{ estimatedPromptTokens }} Tokens | Completion: ~{{ estimatedCompletionTokens }} Tokens</p>
      </div>
    </div>
  </div>`,
  emits: ["data"],
  mounted() {
    //this.getModels();
  },
  computed: {
    estimatedPromptTokens() {
      return this.inputMessage.trim().split(' ').length;
    },
    estimatedCompletionTokens() {
      // Estimate the number of completion tokens based on the length of the prompt
      const estimatedPromptTokens = this.estimatedPromptTokens;
      let estimatedTokens;

      if (estimatedPromptTokens <= 4) {
        estimatedTokens = 10;
      } else if (estimatedPromptTokens <= 10) {
        estimatedTokens = 25;
      } else if (estimatedPromptTokens <= 20) {
        estimatedTokens = 50;
      } else if (estimatedPromptTokens <= 40) {
        estimatedTokens = 75;
      } else {
        estimatedTokens = 100;
      }

      return estimatedTokens;
    },
    maxTokensInt() {
      return parseInt(this.max_tokens)
    }
  },
  methods: {
    setValuePrompt(value) { this[value] = prompt(value); return this[value]; },
    setValue(key, value) { this[key] = value },
    getModels(){
      fetch('https://api.openai.com/v1/models').then(response => response.json()).then(data => {

        this.$emit("data", data);
      })
    },
    async sendMessage() {

      const response = await axios.post('https://gpt.dlux.io/v1/chat/completions', {
        model: 'gpt-3.5-turbo', // gpt-3.5-turbo or gpt-3.5-turbo-0301 for v1/chat/completions endpoint
        messages: [{
          role: 'user', // required for v1/chat/completions endpoint
          content: this.inputMessage,
        }],
        temperature: this.temp, // range is 0 to 2, higher is more random
        n: this.n, // number of completion choices returned
        stream: false, // sends partial message deltas
        stop: null, // up to 4 sequences that stop the API
        max_tokens: this.maxTokensInt, // max input + completion tokens
        presence_penalty: this.p_penalty, // range is -2 to 2, positive promotes new topics
        frequency_penalty: this.f_penalty, // range is -2 to 2, positive decreases verbatim repeats
        //logit_bias: [0.0], // range is -100 to 100, manipulates likelihood of selection and banning
        user: this.account, // end user to monitor and detect abuse
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
      // Get the number of tokens in the response
      const promptTokens = response.data.usage.prompt_tokens;
      const completionTokens = response.data.usage.completion_tokens;
      console.log(response.data.usage.prompt_tokens, response.data.usage.completion_tokens, response.data.usage.total_tokens)


      // Add the user role to the messages array based on whether the input message is empty or not
      if (this.inputMessage.trim() === '') {
        this.messages.push({
          text: message,
          role: 'bot',
          tokens: completionTokens,
        });
      } else {
        this.messages.push({
          text: this.inputMessage,
          role: 'user',
          tokens: promptTokens,
        });
        this.messages.push({
          text: message,
          role: 'bot',
          tokens: completionTokens,
        });
      }

      // Clear the input message
      this.inputMessage = '';

      
      // Scroll to the bottom of the chat window
      this.$nextTick(() => {
        const container = this.$refs.chatContentArea;
        container.scrollTop = container.scrollHeight;
      });

    },
  },

};
