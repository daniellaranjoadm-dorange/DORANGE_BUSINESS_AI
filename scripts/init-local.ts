import fs from 'node:fs';
import path from 'node:path';
const dir=path.resolve(process.env.DATA_DIR || 'data');
fs.mkdirSync(dir,{recursive:true});
const file=path.join(dir,'database.json');
const data={"tenants":[],"users":[],"professionals":[],"services":[],"customers":[],"appointments":[],"financialTransactions":[],"inventory":[],"marketingPosts":[],"connectedAccounts":[],"portfolio":[],"packagePlans":[],"customerPackages":[],"auditLogs":[],"subscriptionPlans":[],"physicalResources":[],"blockedTimes":[],"waitingList":[],"inventoryMovements":[],"aiUsage":[],"baseCatalog":[]};
fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
console.log('Banco vazio criado; use Cadastrar meu estabelecimento. Nenhuma senha padrão.');
