import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'BariwebWidget',
      fileName: 'bariweb',
      formats: ['iife', 'es'], // Independent executable and ES module
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
