export default {
  template: `
  <footer class="footer bg-dark mt-auto">
  <!-- Footer Elements -->
  <div class="container text-center pt-1">
        <div class="py-4">
          <!-- Github -->
          <a href="https://github.com/dluxio" target="_blank">
            <i class="fab fa-github fa-2x mx-md-3 mx-2"></i>
          </a>
          <!-- Discord -->
          <a href="https://discord.gg/Beeb38j" target="_blank">
            <i class="fab fa-discord fa-2x mx-md-3 mx-2"></i>
          </a>
          <!-- Hive -->
          <a href="https://peakd.com/@dlux-io" target="_blank">
          <i class="fab fa-hive fa-2x mx-md-3 mx-2"></i>
          </a>
          <!--Twitter -->
          <a href="https://twitter.com/dluxxr" target="_blank">
            <i class="fab fa-x-twitter fa-2x mx-md-3 mx-2"></i>
          </a>
        </div>
  </div>
  <!-- Footer Elements -->
  
  <!-- Page-specific content slot -->
  <slot></slot>
  
  <!-- Copyright -->
  <div class="footer-copyright text-center text-white-50 pb-1">Copyright © 2025 dlux.io</div>
  <div class="footer-copyright text-center text-white-50 pb-1"> 
  <a href="/about#terms" class="text-white-50 text-decoration-none">Terms of Service</a> | 
    <a href="/about#privacy" class="text-white-50 text-decoration-none">Privacy Policy</a></div>
  </footer>
  `,
};
