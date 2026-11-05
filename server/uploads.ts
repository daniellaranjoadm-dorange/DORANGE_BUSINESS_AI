import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { Request,Response, Router } from 'express';
import { db } from './db.js';
import { getUserByToken } from './auth.js';
import { onboardingGrant } from './security.js';
export const uploadRoot=path.resolve(process.env.DATA_DIR||path.resolve('data'),'uploads');
fs.mkdirSync(uploadRoot,{recursive:true});
export const uploads=Router();
function uploadIdentity(req:Request) {
  const grant=onboardingGrant(req);if(grant)return grant.tenantId;
  const cookie=(req.headers.cookie||'').split(';').find(c=>c.trim().startsWith('dorange_session='))?.trim().slice(16);
  const user=getUserByToken(req.headers.authorization?.replace(/^Bearer /,'')||cookie||'');
  if(!user || !['owner','manager','professional','superadmin'].includes(user.role))return null;
  const requested=String(req.body?.tenantId||req.params.tenant||user.tenantId||'');
  return (user.role==='superadmin'||user.tenantId===requested)&&db.get('tenants').some(t=>t.id===requested)?requested:null;
}
uploads.post('/upload',async(req,res)=>{
  try {
    const tenant=uploadIdentity(req);if(!tenant){res.status(403).json({error:'Empresa não autorizada'});return;}
    const {fileBase64,type='general'}=req.body;
    if(!['logo','cover','portfolio','service','general'].includes(type)||typeof fileBase64!=='string'||fileBase64.length>12*1024*1024){res.status(400).json({error:'Imagem inválida ou acima de 8MB'});return;}
    const match=/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(fileBase64);
    if(!match){res.status(400).json({error:'Somente PNG, JPEG e WebP são aceitos'});return;}
    const input=Buffer.from(match[2],'base64');
    if(!input.length||input.length>8*1024*1024){res.status(400).json({error:'Limite de 8MB'});return;}
    const image=sharp(input,{limitInputPixels:25_000_000,failOn:'warning'});
    const metadata=await image.metadata();
    const declared=match[1]==='jpg'?'jpeg':match[1];
    if(!['png','jpeg','webp'].includes(metadata.format||'')||metadata.format!==declared||!metadata.width||!metadata.height||(metadata.pages||1)>1)throw Error('Conteúdo inválido');
    // Full decode and re-encode strips scripts, metadata and trailing payloads.
    const output=await image.rotate().webp({quality:88}).toBuffer();
    const dir=path.join(uploadRoot,tenant);fs.mkdirSync(dir,{recursive:true});
    const files=fs.readdirSync(dir);const bytes=files.reduce((n,f)=>n+fs.statSync(path.join(dir,f)).size,0);
    if(files.length>=50||bytes+output.length>100*1024*1024){res.status(413).json({error:'Limite de 50 imagens ou 100MB por empresa'});return;}
    const filename=`${type}_${crypto.randomUUID()}.webp`;fs.writeFileSync(path.join(dir,filename),output,{flag:'wx',mode:0o600});
    res.status(201).json({success:true,url:`/api/uploads/${tenant}/${filename}`,filename});
  }catch{res.status(400).json({error:'Não foi possível decodificar uma imagem válida'});}
});
uploads.delete('/upload',(req,res)=>{
  const tenant=uploadIdentity(req);if(!tenant){res.status(403).json({error:'Empresa não autorizada'});return;}
  const url=String(req.body.url||'');
  if(!url.startsWith(`/api/uploads/${tenant}/`)||url.includes('..')){res.status(403).json({error:'Imagem de outra empresa ou caminho inválido'});return;}
  const filename=path.basename(url);const file=path.join(uploadRoot,tenant,filename);
  // Clear all persisted references, so production never retains a deleted image.
  db.mutate(d=>{
    for(const t of d.tenants.filter(t=>t.id===tenant)){if(t.logoUrl===url)t.logoUrl='';if(t.coverUrl===url)t.coverUrl='';}
    for(const key of ['services','portfolio'] as const)for(const row of d[key].filter(x=>x.tenantId===tenant))if(row.imageUrl===url)row.imageUrl='';
  });
  if(fs.existsSync(file))fs.unlinkSync(file);res.json({success:true});
});
export function readUpload(req:Request,res:Response){
  const tenant=String(req.params.tenant),filename=String(req.params.filename);
  if(!/^tenant-[a-zA-Z0-9-]+$/.test(tenant)||filename!==path.basename(filename)||!/^\w[\w.-]*\.(webp|png|jpe?g)$/i.test(filename)){res.sendStatus(404);return;}
  const url=`/api/uploads/${tenant}/${filename}`;
  const published=db.get('tenants').some(t=>t.id===tenant&&['active','trial'].includes(t.status)&&(t.logoUrl===url||t.coverUrl===url))||db.get('services').some(s=>s.tenantId===tenant&&s.active&&s.imageUrl===url)||db.get('portfolio').some(p=>p.tenantId===tenant&&p.publishedToPortal&&p.imageUrl===url);
  if(!published && uploadIdentity(req)!==tenant){res.sendStatus(403);return;}
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','private, no-store');res.sendFile(path.join(uploadRoot,tenant,filename));
}
