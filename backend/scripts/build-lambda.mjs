import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';
import tsconfigPathsPluginPkg from '@esbuild-plugins/tsconfig-paths';

const TsconfigPathsPlugin =
  tsconfigPathsPluginPkg.TsconfigPathsPlugin ?? tsconfigPathsPluginPkg.default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

const outdir = path.join(backendRoot, 'dist');

await build({
  entryPoints: {
    index: path.join(backendRoot, 'src', 'index.ts'),
    'handlers/bedrock': path.join(backendRoot, 'src', 'handlers', 'bedrock.ts'),
  },
  outdir,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: ['node22'],
  sourcemap: false,
  logLevel: 'info',
  plugins: [
    TsconfigPathsPlugin({
      tsconfig: path.join(backendRoot, 'tsconfig.json'),
    }),
  ],
  external: [],
});
