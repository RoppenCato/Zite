import { defineConfig } from 'vitest/config';

// The rules and the server are tested headless in Node, and the client's pure parts (what a reveal shows); the screens
// are judged by screenshot in the browser pane.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['rules/test/**/*.test.ts', 'server/test/**/*.test.ts', 'server-workers/test/**/*.test.ts', 'client/test/**/*.test.ts'],
  },
});
