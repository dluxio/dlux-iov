export default {
    data() {
        return {
            messages: [],
            inputMessage: '',
        };
    },
    template: `
    <div class="content p-0 flex-grow-1 row position-relative">
    <div class="chat-content-area d-flex flex-column" ref="chatContentArea">
      <!-- START CHAT -->
        <div v-for="(message, index) in messages" :key="index" v-bind:class="{'gpt-chat-box': message.role == 'bot'}" class="row chat-box">
          <div class="ms-auto me-auto d-flex" style="max-width: 768px;">
            <div class="chat-icon">
              <img v-if="message.role == 'bot'" class="chatgpt-icon me-4 " src="/img/chatgpt-icon.png" />
              <img v-if="message.role == 'user'" class="chatgpt-icon me-4" :src="'https://images.hive.blog/u/' + pageAccount + '/avatar'" />
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
      </div>
    </div>
  </div>`,
    created() {
        // Log the available models to the console
        axios.get('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': 'Bearer API-KEY'
            }
        })
            .then(response => {
                console.log(response.data.data);
            })
            .catch(error => {
                console.error(error);
            });
    },
    methods: {
        async sendMessage() {

            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                // prompt: this.currentMessage,
                max_tokens: 50,
                temperature: 0.5,
                model: 'gpt-3.5-turbo', // Use the GPT-3.5 Turbo model
                messages: [{
                    role: 'user',
                    content: this.inputMessage,
                }],
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer API-KEY'
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
            // Scroll to the bottom of the chat window
            this.$nextTick(() => {
                const container = this.$refs.chatContentArea;
                container.scrollTop = container.scrollHeight;
            });

        },
    },
};
