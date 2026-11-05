import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
test('cookie HttpOnly autentica a interface e bloqueia POST de outra origem',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'dorange-cookie-'));fs.copyFileSync('tests/fixtures/database.synthetic.json',path.join(dir,'database.json'));process.env.DATA_DIR=dir;process.env.NODE_ENV='test';
 const {db}=await import('../server/db.js');const {hashPassword}=await import('../server/passwords.js');const hash=await hashPassword('Cookie-regression-2026!');
 db.mutate(d=>{d.users.find(u=>u.role==='owner')!.passwordHash=hash;});const email=db.get('users').find(u=>u.role==='owner')!.email;
 const {app}=await import('../server.js');const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));const base='http://127.0.0.1:'+(server.address() as any).port;
 try{
  const health=await fetch(base+'/healthz');assert.equal(health.status,200);assert.deepEqual(await health.json(),{status:'ok'});
  assert.equal(health.headers.get('x-frame-options'),'DENY');assert.equal(health.headers.get('x-content-type-options'),'nosniff');assert.equal(health.headers.get('cache-control'),'no-store');
  const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'Cookie-regression-2026!'})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie')!;assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);const header=cookie.split(';')[0];await login.text();
  const me=await fetch(base+'/api/auth/me',{headers:{Cookie:header}});assert.equal(me.status,200);assert.equal((await me.json()).user.passwordHash,undefined);
  const denied=await fetch(base+'/api/auth/logout',{method:'POST',headers:{Cookie:header,Origin:'https://foreign.invalid'}});assert.equal(denied.status,403);await denied.text();
  const logout=await fetch(base+'/api/auth/logout',{method:'POST',headers:{Cookie:header}});assert.equal(logout.status,200);await logout.text();
  const expired=await fetch(base+'/api/auth/me',{headers:{Cookie:header}});assert.equal(expired.status,401);await expired.text();
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));fs.rmSync(dir,{recursive:true,force:true});}
});
