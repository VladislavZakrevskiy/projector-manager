import { fileURLToPath } from 'node:url';

import { defineConfig } from '@rstest/core';

export default defineConfig({
  include: ['src/**/*.spec.ts'],
  testEnvironment: 'jsdom',
  resolve: {
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
