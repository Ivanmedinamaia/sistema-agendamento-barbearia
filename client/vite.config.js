import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        // Em desenvolvimento, as chamadas para /api são encaminhadas ao backend.
        // Assim o navegador fala só com o Vite e não há problema de CORS.
        proxy: {
            '/api': process.env.API_URL || 'http://localhost:3000'
        }
    }
});
