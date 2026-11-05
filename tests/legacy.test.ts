import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawn} from 'node:child_process';
test('suíte R4 mantém oito regressões com credenciais reais e banco isolado',async()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'dorange-legacy-'));fs.copyFileSync('tests/fixtures/database.synthetic.json',path.join(temporary,'database.json'));
 process.env.DATA_DIR=temporary;process.env.NODE_ENV='test';process.env.GEMINI_API_KEY='';
 const {db}=await import('../server/db.js');const {hashPassword}=await import('../server/passwords.js');
 const password='Credencial-teste-R51!';const hash=await hashPassword(password);
 db.mutate(d=>{for(const u of d.users)if(['owner1@example.invalid','professional1@example.invalid'].includes(u.email))u.passwordHash=hash;});
 const {app}=await import('../server.js');const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));
 try{
   const result=await new Promise<{code:number|null,output:string}>(resolve=>{const child=spawn(process.execPath,['--import','tsx','scripts/test-r4-suite.ts'],{env:{...process.env,TEST_BASE_URL:'http://127.0.0.1:'+(server.address() as any).port,TEST_OWNER_PASSWORD:password,TEST_PROF_PASSWORD:password},stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);child.once('exit',code=>resolve({code,output}));});
   assert.equal(result.code,0,result.output);assert.match(result.output,/8\/8 PASSARAM/);console.log('Suíte R4: 8/8 passaram com autenticação por senha.');
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));fs.rmSync(temporary,{recursive:true,force:true});}
});
