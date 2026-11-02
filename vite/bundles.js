/**
 * CSS bundles: files are concatenated in the given order.
 * Paths are relative to the project root.
 */
export default [
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
  //   output: 'theme/assets/css/about.min.css',
  //   files: [
  //     'theme/assets/css/pages/parts/reset.css',
  //     'theme/assets/css/pages/parts/fonts.css',
  //     'theme/assets/css/pages/parts/global.css',
  //     'theme/assets/css/pages/about.css',
  //   ],
  // },
];
