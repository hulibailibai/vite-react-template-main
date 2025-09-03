import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  define: {
    global: 'globalThis',
    'process.env': {},
    'Buffer': 'Buffer',
  },
  resolve: {
    alias: {
      // 为crypto模块提供polyfill
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util',
    },
  },
  optimizeDeps: {
    include: [
      'crypto-browserify',
      'stream-browserify', 
      'buffer',
      'process/browser',
      'util'
    ],
  },
});
