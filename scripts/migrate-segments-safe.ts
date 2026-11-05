import fs from 'node:fs';import path from 'node:path';import {auditIntegrity} from '../server/integrity.js';
const directory=path.resolve(process.env.DATA_DIR||'data');
const original=fs.readFileSync(path.join(directory,'database.json'),'utf8');const data=JSON.parse(original);
const segments=['nails','barber','beauty','brows_lashes','esthetics','massage','home_services'];
let changed=0;
for(const tenant of data.tenants){if(!tenant.businessSegment){tenant.businessSegment='nails';changed++;}if(!segments.includes(tenant.businessSegment))throw Error('Segmento desconhecido: '+tenant.id);if(!['free','start','pro','studio'].includes(tenant.planId))throw Error('Plano exige revisão manual: '+tenant.id);}
data.physicalResources??=[];
const errors=auditIntegrity(data);if(errors.length)throw Error(errors.join('\n'));
console.log(`Auditoria concluída: ${data.tenants.length} empresas, ${changed} segmentos históricos a preencher. Original não alterado.`);
const output=process.argv[2];if(output){if(path.resolve(output)===path.join(directory,'database.json'))throw Error('Não é permitido sobrescrever o banco original. Informe um arquivo novo.');fs.writeFileSync(output,JSON.stringify(data,null,2),{flag:'wx',mode:0o600});console.log('Cópia de migração criada: '+output);}else console.log('Somente leitura. Para gerar uma cópia, informe um novo caminho de saída.');
