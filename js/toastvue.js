const { Toast } = bootstrap;

export default {
  template: `
  <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
  <div ref="toast" class="toast bg-dark border-info" role="alert" aria-live="assertive" aria-atomic="true" >
            <div class="toast-header bg-info">
              <strong class="me-auto text-dark">Bootstrap</strong>
              <small class="text-white-50">just now</small>
              <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body text-white">{{msg}}</div>
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
