import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';

const project=fileURLToPath(new URL('../',import.meta.url));
const loader=import.meta.resolve('tsx');
const fixture=fs.readFileSync(path.join(project,'tests/fixtures/database.synthetic.json'));
function run(cwd:string, script:string, variables:Record<string,string>={}) {
  const env={...process.env,...variables};
  delete env.DATA_DIR;
  delete env.ALLOW_EMPTY_DB;
  Object.assign(env,variables);
  return spawnSync(process.execPath,['--import',loader,script],{cwd,env,encoding:'utf8'});
}
test('DATA_DIR do .env é lido antes da abertura do banco',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'dorange-env-'));
  try {
    const directory=path.join(root,'private-data');fs.mkdirSync(directory);
    const file=path.join(directory,'database.json');fs.writeFileSync(file,fixture);
    fs.writeFileSync(path.join(root,'.env'),`DATA_DIR=${directory.replaceAll('\\','/')}\nALLOW_EMPTY_DB=false\n`);
    const entry=path.join(root,'load.mjs');
    fs.writeFileSync(entry,`await import(${JSON.stringify(pathToFileURL(path.join(project,'server/db.ts')).href)});`);
    const result=run(root,entry);
    assert.equal(result.status,0,result.stderr);
    assert.deepEqual(fs.readFileSync(file),fixture);
    assert.equal(fs.existsSync(path.join(root,'data','database.json')),false);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('setup:local recusa banco vazio sem autorização e não cria diretório',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'dorange-init-'));
  try {
    const directory=path.join(root,'not-created');
    const result=run(root,path.join(project,'scripts/init-local.ts'),{DATA_DIR:directory});
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/Nova instalação exige/);
    assert.equal(fs.existsSync(directory),false);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
test('setup:local preserva cada backup e snapshot mesmo com criação autorizada',()=>{
  for(const name of ['database.backup.json','database.r3.backup.json','database.r4.backup.json','database.json.1.tmp','migration_dump.sql']) {
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'dorange-preserve-'));
    try {
      const file=path.join(root,name);fs.writeFileSync(file,fixture);
      const result=run(root,path.join(project,'scripts/init-local.ts'),{DATA_DIR:root,ALLOW_EMPTY_DB:'true'});
      assert.notEqual(result.status,0);
      assert.match(result.stderr,/fonte de recuperação/);
      assert.deepEqual(fs.readFileSync(file),fixture);
      assert.equal(fs.existsSync(path.join(root,'database.json')),false);
    } finally {fs.rmSync(root,{recursive:true,force:true});}
  }
});
