import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
// oxlint-disable-next-line sort-keys, import/no-default-export
export default defineConfig(() => ({
    plugins: [vue()],

    resolve: {
        alias: {
            '@': '/src',
        },
    },

    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['src/test-setup.ts'],
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent Vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
        hmr: host
            ? {
                  host,
                  port: 1421,
                  protocol: 'ws',
              }
            : undefined,
        host: host || false,
        port: 1420,
        strictPort: true,
        watch: {
            // 3. tell Vite to ignore watching `src-tauri`
            ignored: ['**/src-tauri/**'],
        },
    },
}));
