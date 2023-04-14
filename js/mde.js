export default {

    data() {
        return {
            // default options, see more options at: http://codemirror.net/doc/manual.html#config
            options: {                   
                // lineNumbers: true,
                // styleActiveLine: true,
                // styleSelectedText: true,
                // lineWrapping: true,
                // indentWithTabs: true,
                // tabSize: 2,
                // indentUnit: 2
            },
            value: 'Hello World',

        }

    },
    template: `
    <div class="container">
        <markdown-editor v-model="value" toolbar="bold italic heading | image link | numlist bullist code quote"></markdown-editor>
    </div>
    `,

}