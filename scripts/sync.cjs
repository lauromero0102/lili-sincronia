const {execFileSync}=require('node:child_process');
const path=require('node:path');
process.chdir(path.resolve(__dirname,'..'));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']});
try{
 git('remote','get-url','origin');
 execFileSync(process.execPath,['scripts/build.cjs'],{stdio:'inherit'});
 git('add','--','src','public','scripts','package.json','README.md','.gitignore','.github','AGENTS.md');
 if(git('diff','--cached','--name-only').trim())git('commit','-m','Actualizar Lili Sincronia');
 console.log(git('push','-u','origin','HEAD'));
}catch(error){console.error(error.stderr?.toString()||error.message);process.exit(1)}
