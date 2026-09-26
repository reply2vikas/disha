import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// SPA build to dist/, consumed by the Express server (Cloud Run).
// In `npm run dev`, the frontend runs on :5173 and the backend on :8080, so we
// proxy /api to the backend. In `npm start` everything is one origin on :8080
// and no proxy is used.
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false, target: 'es2022' },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8080' },
  },
});
