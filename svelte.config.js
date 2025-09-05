import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
        // Consult https://svelte.dev/docs/kit/integrations#preprocessors
        // for more information about preprocessors
        preprocess: vitePreprocess(),

        kit: {
                // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
                // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
                // See https://svelte.dev/docs/kit/adapters for more information about adapters.
                adapter: adapter({
                        out: 'build-svelte',
                        precompress: false,
                        env: {
                                port: 3000
                        }
                }),
                alias: {
                        '$lib': 'src/lib'
                },
                csp: {
                        mode: 'nonce',
                        directives: {
                                'default-src': ['self'],
                                'script-src': ['self', 'unsafe-inline', 'unsafe-eval'],
                                'style-src': ['self', 'unsafe-inline', 'fonts.googleapis.com', 'cdnjs.cloudflare.com'],
                                'font-src': ['self', 'fonts.gstatic.com', 'cdnjs.cloudflare.com'],
                                'img-src': ['self', 'data:', 'blob:', 'https:'],
                                'connect-src': ['self', 'wss:', 'ws:'],
                                'frame-ancestors': ['none']
                        }
                }
        }
};

export default config;