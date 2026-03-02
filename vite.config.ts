import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 15000,
    hookTimeout: 20000,
    include: ['src/tests/**/*.test.ts'],
    // Separate test pools for unit vs integration
    poolOptions: {
      forks: {
        singleFork: true, // Avoid parallel DB connections clashing
      },
    },
  },
})
