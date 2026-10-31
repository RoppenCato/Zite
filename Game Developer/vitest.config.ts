import { defineConfig } from 'vitest/config';

// The rules and the server are tested headless in Node. The client has no tests yet; it is judged by screenshot.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['rules/test/**/*.test.ts', 'server/test/**/*.test.ts'],
  },
});
