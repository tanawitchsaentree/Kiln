import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Library build: ESM + CJS + one stylesheet. Types come from tsc (tsconfig.build.json).
export default defineConfig({
  plugins: [react()],
  css: { modules: { generateScopedName: 'ds-[name]__[local]' } },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: { entry: resolve(__dirname, 'src/index.ts'), formats: ['es', 'cjs'], fileName: (f) => (f === 'es' ? 'index.js' : 'index.cjs') },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', /^@radix-ui\//],
      output: { assetFileNames: (a) => (a.name?.endsWith('.css') ? 'styles.css' : '[name][extname]') },
    },
  },
});
