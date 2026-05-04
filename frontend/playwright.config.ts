import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
    testDir: './src/tests/ui',
    testMatch: '**/*.spec.ts',

    webServer: {
        command: 'npm run dev -- --host 127.0.0.1',
        url: 'http://127.0.0.1:5173/',
        reuseExistingServer: true,
        timeout: 120_000,
    },

    use: {
        baseURL: 'http://127.0.0.1:5173',
        launchOptions: {
            args: ['--disable-quic'],
        },
    },
});
