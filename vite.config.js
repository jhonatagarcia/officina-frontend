import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    esbuild: {
        drop: ['console', 'debugger'],
    },
    build: {
        sourcemap: false,
        minify: 'esbuild',
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes('node_modules'))
                        return undefined;
                    if (id.includes('/react/') || id.includes('/react-dom/'))
                        return 'react-vendor';
                    if (id.includes('/react-router') || id.includes('/react-router-dom'))
                        return 'router-vendor';
                    if (id.includes('/@tanstack/react-query'))
                        return 'query-vendor';
                    if (id.includes('/@radix-ui/') || id.includes('/lucide-react/'))
                        return 'ui-vendor';
                    return undefined;
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
