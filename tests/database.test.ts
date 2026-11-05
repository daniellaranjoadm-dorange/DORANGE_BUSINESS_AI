import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawnSync} from 'node:child_process';
import {PGlite} from '@electric-sql/pglite';
import {auditIntegrity} from '../server/integrity.js';import {exportPostgres} from '../scripts/export-postgres.js';
const source=fs.readFileSync('tests/fixtures/database.synthetic.json','utf8');const data=JSON.parse(source);
test('auditoria referencial verifica todas as coleções e detecta vínculos entre empresas',()=>{
 assert.deepEqual(auditIntegrity(data),[]);
 const broken=structuredClone(data);broken.appointments[0].professionalId='missing';assert.ok(auditIntegrity(broken).some(e=>e.includes('professionalId inexistente')));
 const cross=structuredClone(data);const service=cross.services.find((s:any)=>s.tenantId!==cross.appointments[0].tenantId);if(service){cross.appointments[0].serviceId=service.id;assert.ok(auditIntegrity(cross).some(e=>e.includes('outra empresa')));}
 assert.throws(()=>exportPostgres(broken,fs.readFileSync('src/db/schema.sql','utf8')),/Integridade/);
});
test('schema e exportação executam em PostgreSQL embutido sem perda de coleções',async()=>{
 const pg=new PGlite();try{
   // Optional UUID/crypto extensions are not used by this exporter; not available in this embedded test runtime.
   const schema=fs.readFileSync('src/db/schema.sql','utf8').replace(/^CREATE EXTENSION[^;]+;/gm,'');
   await pg.exec(schema);const dump=exportPostgres(data,schema);await pg.exec(dump);await pg.exec(dump);
   for(const [collection,table] of Object.entries({tenants:'tenants',users:'users',professionals:'professionals',services:'services',customers:'customers',appointments:'appointments',financialTransactions:'financial_transactions',inventory:'inventory_items',inventoryMovements:'inventory_movements',packagePlans:'packages',customerPackages:'customer_packages',portfolio:'portfolio_items',physicalResources:'physical_resources',marketingPosts:'scheduled_posts',connectedAccounts:'social_connections',blockedTimes:'blocked_times',waitingList:'waiting_list',aiUsage:'ai_usage',auditLogs:'audit_logs'})){
     const count=await pg.query<{n:number}>(`SELECT COUNT(*)::int AS n FROM ${table}`);assert.equal(count.rows[0].n,(data[collection]||[]).length,table);
   }
   const snapshot=await pg.query<{payload:any}>('SELECT payload FROM r51_snapshots');assert.deepEqual(snapshot.rows[0].payload,data);
   const links=await pg.query<{n:number}>('SELECT COUNT(*)::int AS n FROM professional_services');assert.ok(links.rows[0].n>0);
   await pg.exec("INSERT INTO tenants (id,name,trade_name,slug,document,document_type,email,phone,whatsapp,city,state,plan_id,business_segment) VALUES ('start-test','Start','Start','start-test','','CPF','x@y.test','','','','','start','barber')");
 }finally{await pg.close();}
 assert.equal(fs.readFileSync('tests/fixtures/database.synthetic.json','utf8'),source);
});
test('banco corrompido nunca é substituído por seeds',()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'dorange-corrupt-'));const file=path.join(temporary,'database.json');fs.writeFileSync(file,'{invalid');
 try{const r=spawnSync(process.execPath,['--import','tsx','-e',"import('./server/db.ts')"],{cwd:process.cwd(),env:{...process.env,DATA_DIR:temporary,ALLOW_EMPTY_DB:'false'},encoding:'utf8'});assert.notEqual(r.status,0);assert.equal(fs.readFileSync(file,'utf8'),'{invalid');}finally{fs.rmSync(temporary,{recursive:true,force:true});}
});
test('falha na escrita atômica é propagada e reverte memória e arquivo',async()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'dorange-atomic-'));const file=path.join(temporary,'database.json');fs.writeFileSync(file,source);process.env.DATA_DIR=temporary;
 const {db}=await import('../server/db.js');const old=fs.renameSync;const before=db.get('tenants');
 try{fs.renameSync=()=>{throw Error('simulated disk failure')};assert.throws(()=>db.mutate(d=>{d.tenants[0].tradeName='DO NOT COMMIT'}),/Falha ao persistir/);assert.deepEqual(db.get('tenants'),before);assert.equal(fs.readFileSync(file,'utf8'),source);}finally{fs.renameSync=old;fs.rmSync(temporary,{recursive:true,force:true});}
});
