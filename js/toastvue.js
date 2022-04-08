const { Toast } = bootstrap;

export default {
  template: `
  <div ref="toast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
              <strong class="me-auto">Bootstrap</strong>
              <small class="text-muted">just now</small>
              <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">{{msg}}</div>
        </div>
  `,
  data() {
    return {
      msg: "Is this thing on?",
    };
  },
  mounted() {
    var toast = new Toast(this.$refs.toast);
    toast.show();
  },
};
