import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Intel N100 Optimized Vite Configuration
// Optimized for 800MHz base frequency, 4 cores, 16GB RAM
export default defineConfig({
  plugins: [react()],
  
  server: {
    host: '0.0.0.0',
    port: process.env.CLIENT_PORT || 3003,
    // Intel N100 optimizations
    hmr: {
      overlay: false, // Reduce overlay rendering overhead
    },
    watch: {
      // Optimized file watching for Intel N100
      usePolling: false,
      interval: 1000, // Slightly increased for CPU efficiency
      binaryInterval: 2000,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Intel N100 build optimizations
    target: 'es2018', // Slightly older target for better compatibility
    minify: 'esbuild', // Faster minification for Intel N100
    chunkSizeWarningLimit: 1000, // Increased for better chunking
    rollupOptions: {
      output: {
        // Optimized chunking strategy for Intel N100
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['styled-components', 'framer-motion'],
          charts: ['recharts'],
          utils: ['date-fns', 'validator'],
        },
        // Reduce chunk size for faster loading
        // maxParallelFileOps removed - not supported in this Rollup version
      },
    },
    // Enable build caching for faster rebuilds
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      ignoreDynamicRequires: true,
    },
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@config': resolve(__dirname, './src/config'),
      '@styles': resolve(__dirname, './src/styles'),
    },
  },
  
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  
  optimizeDeps: {
    // Intel N100 dependency optimization
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'socket.io-client',
      'styled-components',
      'framer-motion',
      'recharts',
      'date-fns',
    ],
    // Enable aggressive dependency optimization for Intel N100
    force: process.env.NODE_ENV === 'development',
    // Reduce bundle scanning for faster startup
    entries: [
      './src/main.jsx',
      './src/components/Dashboard.jsx'
    ],
  },
  
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    'process.env': process.env,
  },
  
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Intel N100 esbuild optimizations
    target: 'es2018',
    platform: 'node',
    // Optimize for Intel N100 characteristics
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    treeShaking: true,
    // Performance tuning for 800MHz CPU
    keepNames: false, // Reduce bundle size
    legalComments: 'none', // Remove legal comments for size
  },
  
  // Intel N100 performance optimizations
  cacheDir: 'node_modules/.vite',
  
  // Worker configuration for 4-core CPU
  worker: {
    format: 'es',
    plugins: [react()],
  },
});