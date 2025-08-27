import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.',
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/types': resolve(__dirname, './src/types'),
      '@/storage': resolve(__dirname, './src/storage'),
      '@/components': resolve(__dirname, './src/components'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/utils': resolve(__dirname, './src/utils')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './dashboard.html',
        agent: './agent-dashboard.html',
        auth: './auth.html',
        test: './test-dashboard-integration.html'
      }
    },
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: false
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    hmr: {
      overlay: true
    }
  },
  esbuild: {
    target: 'es2020',
    keepNames: true,
    sourcemap: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  }
})