import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  devToolbar: {
    enabled: false,
  },
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  vite: {
    envPrefix: ['PUBLIC_', 'AZ_'],
  },
});
