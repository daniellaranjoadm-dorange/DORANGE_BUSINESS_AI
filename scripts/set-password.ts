// Operator-only local recovery: never an unauthenticated HTTP endpoint.
import fs from 'node:fs';
import { hashPassword } from '../server/passwords.js';
import {db} from '../server/db.js';
const email=process.argv[2];
if(!email){console.error('Uso: npm run credentials -- email < senha via stdin');process.exit(1);}
const user=db.get('users').find(u=>u.email.toLowerCase()===email.toLowerCase());
if(!user){console.error('Conta existente não encontrada. Nenhuma conta criada.');process.exit(1);}
const password=fs.readFileSync(0,'utf8').replace(/\r?\n$/,'');
const passwordHash=await hashPassword(password);
db.mutate(d=>{const u=d.users.find(u=>u.id===user.id)!;u.passwordHash=passwordHash;delete u.password;});
console.log('Senha ativada para a conta existente. Reinicie o servidor para revogar sessões em memória.');
