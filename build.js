#!/usr/bin/env node
/* Empaqueta el juego en un único HTML autocontenido: dist/scrapheap.html
 * - Incrusta todos los JSON de /src/data en window.G_BUNDLED_DATA
 * - Incrusta el CSS y todos los scripts en el orden de index.html
 * Uso: node build.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const dataDir = path.join(root, 'src', 'data');
const data = {};
for (const f of fs.readdirSync(dataDir)) if (f.endsWith('.json')) data[f.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));

const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]).filter((s) => !s.includes('data/bundle.js'));
const js = scripts.map((s) => `\n/* ==== ${s} ==== */\n` + fs.readFileSync(path.join(root, s), 'utf8')).join('\n');
const css = fs.readFileSync(path.join(root, 'src/ui/style.css'), 'utf8');

let out = html
  .replace('<script src="src/data/bundle.js"></script>\n', '')
  .replace('<link rel="stylesheet" href="src/ui/style.css">', () => `<style>\n${css}\n</style>`)
  .replace(/<!-- BUILD:SCRIPTS[\s\S]*?\/BUILD:SCRIPTS -->/, () =>
    `<script>window.G_BUNDLED_DATA = ${JSON.stringify(data)};</script>\n<script>\n${js.replace(/<\/script>/g, '<\\/script>')}\n</script>`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
// copia de los datos para abrir index.html con doble clic (file://)
fs.writeFileSync(path.join(root, 'src', 'data', 'bundle.js'), '/* Generado por build.js: copia de los JSON para abrir index.html sin servidor. No editar. */\nwindow.G_DATA_FALLBACK = ' + JSON.stringify(data) + ';\n');
// versión jugable en la raíz del proyecto
fs.writeFileSync(path.join(root, 'JUGAR.html'), out);
fs.writeFileSync(path.join(root, 'dist', 'scrapheap.html'), out);
console.log('dist/scrapheap.html', (out.length / 1024).toFixed(0) + ' KB', scripts.length, 'scripts,', Object.keys(data).length, 'JSON');
