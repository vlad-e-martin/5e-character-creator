import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 1. Enables describe, test, expect without importing them in every file
    globals: true,
    // 2. Simulates a browser environment (requires the 'jsdom' package)
    environment: 'jsdom',
  },
});