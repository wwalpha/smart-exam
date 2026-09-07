import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';
import tsconfigPathsPluginPkg from '@esbuild-plugins/tsconfig-paths';

const TsconfigPathsPlugin = tsconfigPathsPluginPkg.TsconfigPathsPlugin ?? tsconfigPathsPluginPkg.default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

const outdir = path.join(backendRoot, 'dist');

await build({
  entryPoints: {
    index: path.join(backendRoot, 'src', 'index.ts'),
    'handlers/bedrock': path.join(backendRoot, 'src', 'lambda', 'bedrock.ts'),
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

// MCPはWeb/PDFのartifactと別ディレクトリに固定する。
await build({
  entryPoints: [path.join(backendRoot, 'src/mcp/handler.ts')],
  outfile: path.join(backendRoot, 'dist-mcp', 'mcp.js'),
  bundle: true, platform: 'node', format: 'cjs', target: ['node22'],
  sourcemap: false, logLevel: 'info',
  define: { 'process.env.MCP_BUILD_ID': JSON.stringify(process.env.MCP_BUILD_ID || 'local-uncommitted') },
  plugins: [TsconfigPathsPlugin({ tsconfig: path.join(backendRoot, 'tsconfig.json') })],
});
