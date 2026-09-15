const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const original = fs.readFileSync(path.join(root, 'outputs/gestor-quirofanos.html'), 'utf8');
const script = original.match(/<script>([\s\S]*?)<\/script>/)[1];
const styles = original.match(/<style>([\s\S]*?)<\/style>/)[1];
for (const dir of ['src','src/styles','src/data','public/assets']) fs.mkdirSync(path.join(root,dir),{recursive:true});
const declarations = ['days','regularities','specialties','anesthesiaTypes','specialists'];
let app = script;
for (const name of declarations) {
 const line = script.split(/\r?\n/).find(l=>l.startsWith('const '+name+'='));
 if (!line) throw new Error('Missing '+name);
 fs.writeFileSync(path.join(root,'src/data',name+'.js'),line+'\n');
 app=app.replace(line,'');
}
const from=app.indexOf('function nextStart('), to=app.indexOf('function selectedDate()');
if(from<0||to<0)throw new Error('Scheduler boundaries not found');
fs.writeFileSync(path.join(root,'src/scheduler.js'),app.slice(from,to));
app=app.slice(0,from)+app.slice(to);
fs.writeFileSync(path.join(root,'src/app.js'),app);
fs.writeFileSync(path.join(root,'src/styles/base.css'),styles);
fs.copyFileSync(path.join(root,'outputs/assets/sincronia.css'),path.join(root,'src/styles/sincronia.css'));
for(const file of ['logo-fvl.jpg','identidad-fvl.png']) fs.copyFileSync(path.join(root,'outputs/assets',file),path.join(root,'public/assets',file));
const includes=declarations.map(n=>'<script src="data/'+n+'.js"></script>').join('\n');
const html=original.replace(/<style>[\s\S]*?<\/style>/,'<link rel="stylesheet" href="styles/base.css">').replace('href="assets/sincronia.css"','href="styles/sincronia.css"').replace(/<script>[\s\S]*?<\/script>/,includes+'\n<script src="scheduler.js"></script>\n<script src="app.js"></script>');
fs.writeFileSync(path.join(root,'src/index.html'),html);
console.log('Separados: catalogos, estilos, programador e interfaz.');
