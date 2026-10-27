import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The docs book. A system that needs an evidence harness page (a page that renders every component on
// every backdrop for tooling/kiln/evidence.mjs) adds it as a second input here and in kiln.config.json.
export default defineConfig({
  plugins: [react()],
});
