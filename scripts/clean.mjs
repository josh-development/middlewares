import { rm } from 'node:fs/promises';

const rootDir = new URL('../', import.meta.url);
const packagesDir = new URL('packages/', rootDir);
const options = { recursive: true, force: true };
const paths = [
  // Package dist folders
  new URL('provider/dist/', packagesDir),

  // Package .turbo folders
  new URL('provider/.turbo/', packagesDir)
];

for (const path of paths) {
  await rm(path, options);
}
