import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// En développement, les appels /api sont relayés vers le backend Spring Boot.
// Adresse réglable avec BACKEND_URL (fichier .env), par défaut http://localhost:8080.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: { '/api': env.BACKEND_URL || 'http://localhost:8080' },
    },
  };
});
