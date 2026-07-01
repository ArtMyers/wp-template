import { defineConfig } from 'vite';
import concatPlugin from './vite/concat-plugin.js';

export default defineConfig({
  server: {
    watch: {
      usePolling: true,
      interval: 500,
    },
  },
  plugins: [
    concatPlugin({
      bundles: [
        {
          output: 'theme/assets/css/homepage.min.css',
          files: [
            'theme/assets/css/pages/parts/reset.css',
            'theme/assets/css/pages/parts/fonts.css',
            'theme/assets/css/pages/parts/global.css',
            'theme/assets/css/pages/parts/header.css',
            'theme/assets/css/pages/homepage.css',
            'theme/assets/css/pages/parts/footer.css',
          ],
        },
        // Add more bundles as needed:
        // {
        //   output: 'theme/assets/css/dist/about.css',
        //   files: [
        //     'theme/assets/css/pages/parts/reset.css',
        //     'theme/assets/css/pages/parts/fonts.css',
        //     'theme/assets/css/pages/parts/global.css',
        //     'theme/assets/css/pages/about.css',
        //   ],
        // },
      ],
    }),
  ],
});
