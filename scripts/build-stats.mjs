import { readFile, writeFile } from 'node:fs/promises';
const files = ['stats-data', 'stats-engine', 'stats-view'];
const sources = await Promise.all(files.map(name => readFile(new URL(`../lib/${name}.js`, import.meta.url), 'utf8')));
await writeFile(new URL('../public/stats.js', import.meta.url), sources.join('\n;\n'));
