import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;

const releaseRoot = join(root, 'release');
const portableDir = join(releaseRoot, `FinanceToolbox-${version}-portable-win-x64`);
const setupDest = join(releaseRoot, `FinanceToolbox-${version}-setup-win-x64.exe`);
const zipPath = join(releaseRoot, `FinanceToolbox-${version}-portable-win-x64.zip`);
const exe = join(root, 'src-tauri/target/release/finance-toolbox.exe');
const setup = join(root, `src-tauri/target/release/bundle/nsis/Finance Toolbox_${version}_x64-setup.exe`);
const releaseNotes = join(root, 'docs/发布说明.md');
const userManual = join(root, 'docs/用户手册.md');
const license = join(root, 'LICENSE');

for (const file of [exe, setup, releaseNotes, userManual, license]) {
  if (!existsSync(file)) {
    console.error(`Missing ${relative(root, file)} — run npm run release first`);
    process.exit(1);
  }
}

mkdirSync(releaseRoot, { recursive: true });
copyFileSync(setup, setupDest);

mkdirSync(portableDir, { recursive: true });
copyFileSync(exe, join(portableDir, 'finance-toolbox.exe'));
copyFileSync(releaseNotes, join(portableDir, '发布说明.md'));
copyFileSync(userManual, join(portableDir, '用户手册.md'));
copyFileSync(license, join(portableDir, 'LICENSE'));

if (existsSync(zipPath)) rmSync(zipPath);
const psPortable = portableDir.replace(/'/g, "''");
const psZip = zipPath.replace(/'/g, "''");
execSync(
  `powershell -NoProfile -Command "Compress-Archive -LiteralPath '${psPortable}' -DestinationPath '${psZip}' -Force"`,
  { stdio: 'inherit', cwd: root },
);

function formatSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

console.log('\nRelease artifacts:\n');
for (const entry of readdirSync(releaseRoot, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const p = join(releaseRoot, entry.name);
  console.log(`  ${entry.name}  ${formatSize(statSync(p).size)}`);
}
console.log(`\n${relative(root, portableDir)}/`);
for (const name of readdirSync(portableDir)) {
  console.log(`  ${name}  ${formatSize(statSync(join(portableDir, name)).size)}`);
}
