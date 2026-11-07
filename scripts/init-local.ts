import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
const dir=path.resolve(process.env.DATA_DIR || 'data');
const file=path.join(dir,'database.json');
// Never mask an existing database or recovery candidate with a new empty file.
if(fs.existsSync(file))throw new Error('Banco existente: inicialização recusada.');
if(fs.existsSync(dir) && fs.readdirSync(dir).some(name => /^(database(?:[.-].*)?|migration.*\.sql)$/i.test(name))) {
  throw new Error('Possível fonte de recuperação encontrada. Não será criado banco vazio.');
}
if(process.env.ALLOW_EMPTY_DB!=='true')throw new Error('Nova instalação exige ALLOW_EMPTY_DB=true explícito. Não use setup:local para recuperação.');
fs.mkdirSync(dir,{recursive:true});
const data={"tenants":[],"users":[],"professionals":[],"services":[],"customers":[],"appointments":[],"financialTransactions":[],"inventory":[],"marketingPosts":[],"connectedAccounts":[],"portfolio":[],"packagePlans":[],"customerPackages":[],"auditLogs":[],"subscriptionPlans":[],"physicalResources":[],"blockedTimes":[],"waitingList":[],"inventoryMovements":[],"aiUsage":[],"baseCatalog":[]};
fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
console.log('Banco vazio criado; use Cadastrar meu estabelecimento. Nenhuma senha padrão.');
