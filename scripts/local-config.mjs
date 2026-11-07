import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
dotenv.config({quiet:true});
if(!process.env.DATA_DIR || !path.isAbsolute(process.env.DATA_DIR))throw Error('DATA_DIR absoluto obrigatório.');
const file=path.join(process.env.DATA_DIR,'database.json');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
console.log(JSON.stringify({dataDirectory:process.env.DATA_DIR,port:Number(process.env.PORT||3000),users:data.users.map(u=>({email:u.email,role:u.role}))}));
