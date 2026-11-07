import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {verifyPassword} from '../server/passwords.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const fixture=fs.readFileSync(path.join(root,'tests/fixtures/database.synthetic.json'));
test('ativação local altera apenas senha da conta escolhida e preserva backup',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'dorange-access-'));
 try{
  const file=path.join(directory,'database.json');fs.writeFileSync(file,fixture);
  const before=JSON.parse(fixture.toString());
  const user=before.users[0];
  const password=crypto.randomBytes(24).toString('base64url');
  const result=spawnSync(process.execPath,['--import',import.meta.resolve('tsx'),'scripts/set-password.ts'],{cwd:root,env:{...process.env,DATA_DIR:directory,ALLOW_EMPTY_DB:'false',DORANGE_OPERATOR_EMAIL:user.email},input:password,encoding:'utf8'});
  assert.equal(result.status,0,'Ativação local deve concluir.');
  assert.equal((result.stdout+result.stderr).includes(password),false);
  const after=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(await verifyPassword(password,after.users[0].passwordHash),true);
  for(let n=0;n<after.users.length;n++)if(n!==0)assert.deepEqual(after.users[n],before.users[n]);
  const original={...before.users[0]};delete original.password;delete original.passwordHash;
  const updated={...after.users[0]};delete updated.password;delete updated.passwordHash;
  assert.deepEqual(updated,original);
  for(const key of Object.keys(before))if(key!=='users')assert.deepEqual(after[key],before[key]);
  assert.deepEqual(fs.readFileSync(path.join(directory,'database.backup.json')),fixture);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
