import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import sharp from 'sharp';
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'dorange-r51-'));
const baseline=JSON.parse(fs.readFileSync('tests/fixtures/database.synthetic.json','utf8'));
fs.copyFileSync('tests/fixtures/database.synthetic.json',path.join(temporary,'database.json'));
process.env.DATA_DIR=temporary;process.env.NODE_ENV='test';process.env.GEMINI_API_KEY='';
let server:any,base:string,db:any,auth:any;const accounts:any[]=[];let image:string;
const password='Teste-seguro-2026!';
async function request(url:string,method='GET',body?:any,token?:string,grant?:string){
 const r=await fetch(base+url,{signal:AbortSignal.timeout(10000),method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(grant?{'x-onboarding-token':grant}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 const text=await r.text();let data:any;try{data=JSON.parse(text)}catch{data=text}return {status:r.status,data,headers:r.headers};
}
before(async()=>{({db}=await import('../server/db.js'));auth=await import('../server/auth.js');const {app}=await import('../server.js');server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));base='http://127.0.0.1:'+server.address().port;});
after(async()=>{await new Promise<void>(resolve=>server.close(()=>resolve()));fs.rmSync(temporary,{recursive:true,force:true});});
test('login sem senha, por papel e com senha incorreta são rejeitados',async()=>{
 for(const body of [{email:baseline.users[0].email},{role:'superadmin'},{email:baseline.users[0].email,password:'errada'}])assert.equal((await request('/api/auth/login','POST',body)).status,401);
 assert.equal(db.get('users').length,baseline.users.length);
});
test('tokens previsíveis e fabricados são rejeitados',async()=>{
 for(const token of ['token_user-juliana','token_user-juliana_forged','session_user-juliana_123','sess_fabricated'])assert.equal((await request('/api/financial','GET',undefined,token)).status,401);
});
test('APIs privadas exigem autenticação, inclusive todas as operações de escrita',async()=>{
 const routes=['tenants','services','professionals','customers','appointments','appointments/blocked-times','appointments/waiting-list','inventory','inventory/movements','packages/plans','packages/customer-subscriptions','marketing/accounts','marketing/posts','portfolio','financial','admin/metrics','resources'];
 for(const route of routes)assert.equal((await request('/api/'+route)).status,401,route);
 for(const [method,url] of [['PATCH','/api/tenants/tenant-1'],['PUT','/api/services/serv-1'],['DELETE','/api/upload'],['POST','/api/upload'],['POST','/api/resources'],['POST','/api/ai/chat']])assert.equal((await request(url,method,{})).status,401,url);
});
test('cadastro exige autorização temporária e senha forte',async()=>{
 assert.equal((await request('/api/tenants','POST',{})).status,401);
 const g=await request('/api/onboarding/session','POST');assert.equal(g.status,200);
 const r=await request('/api/tenants','POST',{name:'Teste',tradeName:'Teste',email:'x@example.invalid',businessSegment:'nails',password:'123'},undefined,g.data.token);assert.equal(r.status,400);
});
for(const segment of ['nails','barber','beauty','brows_lashes','esthetics','massage','home_services'])test('cadastro completo '+segment+' preserva serviços, horários e proprietário',async()=>{
 const grant=(await request('/api/onboarding/session','POST')).data.token;
 const response=await request('/api/tenants','POST',{name:'Proprietário '+segment,tradeName:'Teste '+segment,email:segment+'@example.invalid',password,businessSegment:segment,openTime:'08:00',closeTime:'20:00',breakStart:'12:00',breakEnd:'13:00',bufferMinutes:15,customServices:[{name:'Serviço confirmado IA '+segment,category:'Personalizado',price:75,durationMinutes:30}]},undefined,grant);
 assert.equal(response.status,201,JSON.stringify(response.data));const a=response.data;accounts.push(a);
 assert.equal(a.user.role,'owner');assert.equal(a.user.tenantId,a.tenant.id);assert.ok(a.token.startsWith('sess_'));assert.equal(a.user.passwordHash,undefined);
 const persisted=db.get('users').find((u:any)=>u.id===a.user.id);assert.match(persisted.passwordHash,/^scrypt\$/);assert.equal(persisted.password,undefined);
 assert.equal(a.tenant.businessHours['1'].start,'08:00');assert.equal(a.tenant.businessHours['1'].breakStart,'12:00');assert.equal(a.tenant.businessHours['1'].breakEnd,'13:00');assert.equal(a.tenant.bufferBetweenAppointmentsMinutes,15);
 const services=db.get('services').filter((s:any)=>s.tenantId===a.tenant.id);assert.equal(services[0].name,'Serviço confirmado IA '+segment);assert.deepEqual(services[0].professionalIds,[a.professional.id]);
 const stock=db.get('inventory').filter((s:any)=>s.tenantId===a.tenant.id).map((s:any)=>s.name).join(' ');assert.match(stock,segment==='nails'?/Gel/:segment==='barber'?/barbear/:segment==='beauty'?/Shampoo/:/descartáveis|massagem|atendimento/);if(segment!=='nails')assert.doesNotMatch(stock,/Gel|Fibra/);
 assert.equal((await request('/api/auth/me','GET',undefined,a.token)).status,200);
 if(segment==='nails') assert.equal((await request('/api/tenants','POST',{...a.tenant,password},undefined,grant)).status,401);
});
test('login válido ignora papel do cliente; administrador e empresa alheia são negados',async()=>{
 const a=accounts[0],b=accounts[1];const r=await request('/api/auth/login','POST',{email:a.user.email,password,role:'superadmin',tenantId:b.tenant.id});assert.equal(r.status,200);assert.equal(r.data.user.role,'owner');
 assert.equal((await request('/api/admin/metrics','GET',undefined,r.data.token)).status,403);
 for(const [method,url,body] of [['PATCH','/api/tenants/'+b.tenant.id,{tradeName:'Invadido'}],['GET','/api/financial?tenantId='+b.tenant.id,undefined],['PUT','/api/services/'+db.get('services').find((s:any)=>s.tenantId===b.tenant.id).id,{price:1}] ] as any[])assert.equal((await request(url,method,body,a.token)).status,403);
 const list=await request('/api/tenants','GET',undefined,a.token);assert.deepEqual(list.data.map((t:any)=>t.id),[a.tenant.id]);
});
test('sessões expiram e logout revoga token',async()=>{
 let r=await request('/api/auth/login','POST',{email:accounts[0].user.email,password});auth.expireSessionForTest(r.data.token);assert.equal((await request('/api/auth/me','GET',undefined,r.data.token)).status,401);
 r=await request('/api/auth/login','POST',{email:accounts[0].user.email,password});assert.equal((await request('/api/auth/logout','POST',{},r.data.token)).status,200);assert.equal((await request('/api/auth/me','GET',undefined,r.data.token)).status,401);
});
test('PNG falso, HTML, MIME errado e empresa alheia são rejeitados',async()=>{
 for(const data of ['data:image/png;base64,'+Buffer.from('NOT PNG').toString('base64'),'data:text/html;base64,'+Buffer.from('<script>alert(1)</script>').toString('base64')])assert.equal((await request('/api/upload','POST',{tenantId:accounts[0].tenant.id,fileBase64:data,filename:'a.png'},accounts[0].token)).status,400);
 assert.equal((await request('/api/upload','POST',{tenantId:accounts[1].tenant.id,fileBase64:'x'},accounts[0].token)).status,403);
});
test('imagem real é persistida, isolada, publicada explicitamente e excluída fisicamente',async()=>{
 const png=await sharp({create:{width:10,height:10,channels:3,background:'#ff8800'}}).png().toBuffer();
 const r=await request('/api/upload','POST',{tenantId:accounts[0].tenant.id,fileBase64:'data:image/png;base64,'+png.toString('base64'),filename:'foto.png',type:'logo'},accounts[0].token);assert.equal(r.status,201,JSON.stringify(r.data));image=r.data.url;
 const file=path.join(temporary,'uploads',accounts[0].tenant.id,r.data.filename);assert.ok(fs.existsSync(file));assert.equal((await sharp(fs.readFileSync(file)).metadata()).format,'webp');
 assert.equal((await request(image)).status,403);assert.equal((await request(image,'GET',undefined,accounts[1].token)).status,403);assert.equal((await request(image,'GET',undefined,accounts[0].token)).status,200);
 assert.equal((await request('/api/upload','DELETE',{tenantId:accounts[1].tenant.id,url:image},accounts[1].token)).status,403);assert.ok(fs.existsSync(file));
 assert.equal((await request('/api/tenants/'+accounts[0].tenant.id,'PATCH',{logoUrl:image},accounts[0].token)).status,200);assert.equal((await request(image)).status,200);
 assert.equal((await request('/api/upload','DELETE',{tenantId:accounts[0].tenant.id,url:image},accounts[0].token)).status,200);assert.ok(!fs.existsSync(file));assert.equal(db.get('tenants').find((t:any)=>t.id===accounts[0].tenant.id).logoUrl,'');
});
test('onboarding temporário não pode gravar na empresa de uma sessão existente',async()=>{
 const grant=(await request('/api/onboarding/session','POST')).data.token;const png=await sharp({create:{width:1,height:1,channels:3,background:'red'}}).png().toBuffer();
 const r=await request('/api/upload','POST',{tenantId:accounts[0].tenant.id,fileBase64:'data:image/png;base64,'+png.toString('base64'),type:'cover'},accounts[0].token,grant);assert.equal(r.status,201);assert.ok(!r.data.url.includes(accounts[0].tenant.id));assert.equal((await request(r.data.url)).status,403);
});
test('resposta pública é mínima e agenda impede conflito concorrente',async()=>{
 const a=accounts[0],service=db.get('services').find((s:any)=>s.tenantId===a.tenant.id);
 const payload={tenantId:a.tenant.id,serviceId:service.id,professionalId:a.professional.id,customerName:'Cliente teste',customerPhone:'51999999999',date:'2026-12-07',time:'09:00'};
 const results=await Promise.all([request('/api/appointments','POST',payload),request('/api/appointments','POST',payload)]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
 const publicData=(await request('/api/public/booking/'+a.tenant.slug+'?date=2026-12-07')).data;
 assert.equal(publicData.tenant.document,undefined);assert.equal(publicData.tenant.email,undefined);assert.equal(publicData.services[0].costBRL,undefined);assert.equal(publicData.professionals[0].email,undefined);
 assert.equal(publicData.appointments[0].customerName,undefined);assert.equal(publicData.appointments[0].customerPhone,undefined);
 assert.equal((await request('/api/appointments','POST',{...payload,serviceId:db.get('services').find((s:any)=>s.tenantId===accounts[1].tenant.id).id})).status,404);
 assert.equal((await request('/api/appointments','POST',{...payload,time:'12:15'})).status,409);
});
test('encerramento de conta preserva dados e revoga sessões sem deixar vínculos órfãos',async()=>{
 const a=accounts[2];const before=db.get('users').filter((u:any)=>u.tenantId===a.tenant.id);
 const services=db.get('services').filter((s:any)=>s.tenantId===a.tenant.id);
 assert.equal((await request('/api/tenants/'+a.tenant.id+'/delete-account','DELETE',{},a.token)).status,200);
 assert.equal(db.get('tenants').find((t:any)=>t.id===a.tenant.id).status,'suspended');
 assert.deepEqual(db.get('users').filter((u:any)=>u.tenantId===a.tenant.id),before);
 assert.deepEqual(db.get('services').filter((s:any)=>s.tenantId===a.tenant.id),services);
 assert.equal((await request('/api/auth/me','GET',undefined,a.token)).status,401);
 assert.equal((await request('/api/auth/login','POST',{email:a.user.email,password})).status,401);
});
test('todos os registros anteriores permanecem iguais após as operações',()=>{
 const current=JSON.parse(fs.readFileSync(path.join(temporary,'database.json'),'utf8'));
 for(const [key,rows] of Object.entries(baseline))if(Array.isArray(rows))for(const row of rows){if(!row.id)continue;assert.deepEqual(current[key].find((r:any)=>r.id===row.id),row,`${key}/${row.id}`);}
});
