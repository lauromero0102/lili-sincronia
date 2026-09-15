const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
for(const file of ['app.js','scheduler.js',...fs.readdirSync(path.join(root,'src/data')).map(f=>'data/'+f)])new vm.Script(fs.readFileSync(path.join(root,'src',file),'utf8'),{filename:file});
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.cpSync(path.join(root,'src'),path.join(root,'dist'),{recursive:true});
fs.cpSync(path.join(root,'public'),path.join(root,'dist'),{recursive:true});
console.log('Build verificado en dist/');
