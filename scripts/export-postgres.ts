import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {auditIntegrity} from '../server/integrity.js';
export function exportPostgres(data:any,schema:string){
 const errors=auditIntegrity(data);if(errors.length)throw Error('Integridade: '+errors.join('; '));
 const sql=(v:any):string=>v===undefined||v===null?'NULL':typeof v==='boolean'?String(v):typeof v==='number'?(Number.isFinite(v)?String(v):'NULL'):typeof v==='object'?`'${JSON.stringify(v).replaceAll("'","''")}'::jsonb`:`'${String(v).replaceAll("'","''")}'`;
 const lines=['-- R5.1: exportação somente. Revise e aplique em homologação; PostgreSQL não foi implantado.','BEGIN;',"SET LOCAL standard_conforming_strings = on;"];
 // Full-fidelity archive: every collection and field, including future modules, is retained.
 lines.push(`INSERT INTO r51_snapshots (id,payload) VALUES (${sql(crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'))},${sql(data)}) ON CONFLICT (id) DO NOTHING;`);
 const mapping:Record<string,string>={tenants:'tenants',users:'users',professionals:'professionals',services:'services',customers:'customers',physicalResources:'physical_resources',appointments:'appointments',financialTransactions:'financial_transactions',inventory:'inventory_items',inventoryMovements:'inventory_movements',packagePlans:'packages',customerPackages:'customer_packages',portfolio:'portfolio_items',blockedTimes:'blocked_times',waitingList:'waiting_list',marketingPosts:'scheduled_posts',connectedAccounts:'social_connections',aiUsage:'ai_usage',auditLogs:'audit_logs'};
 const aliases:Record<string,string>={trade_name:'tradeName',business_segment:'businessSegment',is_active:'active',is_popular:'isPopular',cost_brl:'costBRL',buffer_minutes:'bufferBetweenAppointmentsMinutes',whatsapp_config:'whatsappCloudApiConfig',loyalty_enabled:'loyaltyProgramEnabled',package_id:'packagePlanId',platform:'platform',password_hash:'passwordHash'};
 const snake=(key:string)=>key.replace(/_([a-z])/g,(_,c)=>c.toUpperCase());
 for(const [collection,table] of Object.entries(mapping)){
   const block=new RegExp('CREATE TABLE IF NOT EXISTS '+table+' \\(([\\s\\S]*?)\\n\\);').exec(schema)?.[1];if(!block)throw Error('Tabela ausente: '+table);
   const columns=block.split('\n').map(l=>/^\s+([a-z_]+)\s+(?:VARCHAR|TEXT|INT|NUMERIC|BOOLEAN|DATE|TIME|TIMESTAMP|JSONB)/.exec(l)?.[1]).filter(Boolean) as string[];
   const arrayColumns=new Set([...block.matchAll(/^\s+([a-z_]+)\s+TEXT\[\]/gm)].map(m=>m[1]));
   for(const row of data[collection]||[]){
     const values:Record<string,any>={};
     for(const column of columns){let v=row[aliases[column]||snake(column)];
       if(collection==='tenants'&&column==='business_segment')v=v||'nails';
       if(column==='raw_payload')v=row;
       if(column==='password_hash'&&!v)continue; // Existing accounts stay locked until verified recovery.
       if(v!==undefined)values[column]=v;
     }
     // Omit absent optional fields so SQL defaults remain effective; preserve everything in raw_payload/snapshot.
     lines.push(`INSERT INTO ${table} (${Object.keys(values).join(',')}) VALUES (${Object.entries(values).map(([k,v])=>arrayColumns.has(k)?`ARRAY[${(v as string[]).map(sql).join(',')}]::text[]`:sql(v)).join(',')}) ON CONFLICT (id) DO NOTHING;`);
   }
 }
 // Relational link and membership IDs are deterministic and tenant-scoped.
 const links=new Set<string>();for(const p of data.professionals||[])for(const id of p.services||[])links.add(JSON.stringify([p.tenantId,p.id,id]));for(const s of data.services||[])for(const id of s.professionalIds||[])links.add(JSON.stringify([s.tenantId,id,s.id]));
 for(const link of links){const values=JSON.parse(link);lines.push(`INSERT INTO professional_services (tenant_id,professional_id,service_id) VALUES (${values.map(sql).join(',')}) ON CONFLICT DO NOTHING;`);}
 for(const u of data.users||[])if(u.tenantId&&['owner','manager','professional'].includes(u.role))lines.push(`INSERT INTO tenant_memberships (id,tenant_id,user_id,role) VALUES (${sql('membership-'+u.id)},${sql(u.tenantId)},${sql(u.id)},${sql(u.role)}) ON CONFLICT DO NOTHING;`);
 lines.push('COMMIT;');return lines.join('\n');
}
if(process.argv[1]?.endsWith('export-postgres.ts')||process.argv[1]?.endsWith('migrate-to-postgres.ts')){
 const dataDir=path.resolve(process.env.DATA_DIR||'data');const data=JSON.parse(fs.readFileSync(path.join(dataDir,'database.json'),'utf8'));
 try{const dump=exportPostgres(data,fs.readFileSync('src/db/schema.sql','utf8'));const output=process.env.SQL_OUTPUT||path.join(dataDir,'migration_r51.sql');fs.writeFileSync(output,dump,{flag:'wx'});console.log('Exportação criada sem alterar JSON. Não aplicada em PostgreSQL: '+output);}catch(e){console.error(String(e));process.exitCode=1;}
}
