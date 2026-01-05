import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { nodeFileTrace } from '@vercel/nft';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendRoot = path.resolve(__dirname, '..');
const distDir = path.join(backendRoot, 'dist');
const outDir = path.join(backendRoot, 'lambda');

const entryFiles = [path.join(distDir, 'index.js'), path.join(distDir, 'handlers', 'bedrock.js')];

// Layerを使わない前提のため、確実に同梱したい依存はここで固定指定する
const forceIncludePackages = ['@sparticuz/chromium', 'puppeteer-core'];

const ensureExists = async (filePath) => {
  try {
    await fs.stat(filePath);
  } catch {
    throw new Error(`Missing build output: ${path.relative(backendRoot, filePath)}. Run build:lambda first.`);
  }
};

for (const filePath of entryFiles) {
  await ensureExists(filePath);
}

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

const copyDir = async (srcAbs, dstAbs) => {
  const entries = await fs.readdir(srcAbs, { withFileTypes: true });
  await fs.mkdir(dstAbs, { recursive: true });

  await Promise.all(
    entries.map(async (entry) => {
      const srcChild = path.join(srcAbs, entry.name);
      const dstChild = path.join(dstAbs, entry.name);

      if (entry.isDirectory()) {
        await copyDir(srcChild, dstChild);
        return;
      }

      if (entry.isSymbolicLink()) {
        const linkTarget = await fs.readlink(srcChild);
        await fs.symlink(linkTarget, dstChild);
        return;
      }

      await fs.copyFile(srcChild, dstChild);
    })
  );
};

const resolvePackageRoot = async (pkgName) => {
  const require = createRequire(import.meta.url);

  let resolvedEntry;
  try {
    resolvedEntry = require.resolve(pkgName, { paths: [backendRoot] });
  } catch {
    return null;
  }

  let dir = path.dirname(resolvedEntry);
  for (;;) {
    try {
      await fs.stat(path.join(dir, 'package.json'));
      return dir;
    } catch {
      // keep walking up
    }

    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
};

const { fileList, warnings } = await nodeFileTrace(entryFiles, {
  base: backendRoot,
  processCwd: backendRoot,
});

if (warnings.length > 0) {
  // eslint-disable-next-line no-console
  console.warn('nodeFileTrace warnings:', warnings);
}

const copyFile = async (srcRelative) => {
  if (srcRelative === 'package.json') {
    return;
  }

  const srcAbs = path.join(backendRoot, srcRelative);
  const dstRelative = srcRelative.startsWith('dist/') ? srcRelative.slice('dist/'.length) : srcRelative;
  const dstAbs = path.join(outDir, dstRelative);
  await fs.mkdir(path.dirname(dstAbs), { recursive: true });
  await fs.copyFile(srcAbs, dstAbs);
};

await Promise.all(Array.from(fileList).map(copyFile));

for (const pkgName of forceIncludePackages) {
  const pkgRoot = await resolvePackageRoot(pkgName);
  if (!pkgRoot) {
    throw new Error(`Missing dependency for packaging: ${pkgName}. Install it in backend dependencies.`);
  }

  const pkgOutPath = path.join(outDir, 'node_modules', ...pkgName.split('/'));
  // nodeFileTrace が拾いきれないケース（動的require等）でも確実に同梱する
  await copyDir(pkgRoot, pkgOutPath);
}

// Lambda Node.js runtime: CommonJSで動かす（handlerが module.exports 前提）
await fs.writeFile(
  path.join(outDir, 'package.json'),
  JSON.stringify({ name: 'smart-exam-lambda', private: true, type: 'commonjs' }, null, 2) + '\n',
  'utf8'
);

// Lambda handler resolution: ensure these paths exist in the zip root.
// - index.handler => index.js
// - handlers/bedrock.handler => handlers/bedrock.js

// eslint-disable-next-line no-console
console.log(`Packaged ${fileList.size} files into ${path.relative(backendRoot, outDir)}/`);
