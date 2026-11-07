import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const bad=[];
for(const file of files){
 const synthetic=file==='tests/fixtures/database.synthetic.json';
 if(!synthetic && (/^(data|uploads|private|backups)(\/|$)|(^|\/)\.env(?!\.example$)|(^|\/)database[^/]*\.json$|migration_dump\.sql$|\.(zip|pem|key|p12|sqlite|db)$/i.test(file)))bad.push(file);
 else if(fs.existsSync(file) && fs.statSync(file).size<2_000_000){
  const text=fs.readFileSync(file,'utf8');
  if(/AIza[0-9A-Za-z_-]{35}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text))bad.push(file);
 }
}
if(bad.length){console.error('Publicação bloqueada. Arquivos privados ou credenciais detectados:',bad);process.exit(1);}
console.log('Arquivos rastreados verificados. Revise também o diff e o histórico antes de publicar.');
