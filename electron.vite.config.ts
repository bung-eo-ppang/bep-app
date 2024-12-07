import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import renderer from 'vite-plugin-electron-renderer';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    assetsInclude: ['**/*.glb'],
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    plugins: [
      TanStackRouterVite(),
      react(),
      renderer({ resolve: { serialport: { type: 'cjs' } } }),
    ],
  },
});
