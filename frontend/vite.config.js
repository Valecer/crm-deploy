import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 600, // Increase warning limit slightly (chunks are still optimized)
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'src/pages/login.html'),
        landing: resolve(__dirname, 'src/pages/landing.html'),
        clientDashboard: resolve(__dirname, 'src/pages/client-dashboard.html'),
        supportDashboard: resolve(__dirname, 'src/pages/support-dashboard.html'),
      },
      output: {
        manualChunks: (id) => {
          // Extract large vendor libraries into separate chunks
          
          // Three.js (large 3D library)
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
          
          // GSAP (animation library)
          if (id.includes('node_modules/gsap')) {
            return 'vendor-gsap';
          }
          
          // jsPDF and related PDF libraries
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/jspdf-autotable')) {
            return 'vendor-pdf';
          }
          
          // html2canvas (used with PDF generation)
          if (id.includes('node_modules/html2canvas')) {
            return 'vendor-pdf';
          }
          
          // Lenis (smooth scroll library)
          if (id.includes('node_modules/lenis')) {
            return 'vendor-lenis';
          }
          
          // Group other node_modules into a vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.fbx', '**/*.obj', '**/*.png', '**/*.jpeg', '**/*.jpg'],
});

