import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
        plugins: [sveltekit()],
        server: {
                port: 3000,
                host: '0.0.0.0', // Bind to all interfaces for external access
                proxy: {
                        '/api': {
                                target: 'http://localhost:5000',
                                changeOrigin: true,
                                secure: false,
                                ws: true, // Enable WebSocket proxying
                                headers: {
                                        'X-Forwarded-For': 'localhost',
                                        'X-Forwarded-Proto': 'http'
                                }
                        }
                },
                cors: {
                        origin: true,
                        credentials: true
                }
        },
        build: {
                outDir: 'build-svelte'
        }
});