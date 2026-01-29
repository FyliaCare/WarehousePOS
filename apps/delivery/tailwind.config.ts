import type { Config } from 'tailwindcss';
import sharedConfig from '@warehousepos/config/tailwind';

const config: Config = {
  ...sharedConfig,
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
};

export default config;
