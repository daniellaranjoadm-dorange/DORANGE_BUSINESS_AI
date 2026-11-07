import React from 'react';
import {useApp} from '../context/AppContext';
export function ServiceTeamPicker({value,onChange}:{value:string[];onChange:(ids:string[])=>void}){
 const {professionals}=useApp();const active=professionals.filter(p=>p.active);
 return <fieldset className="rounded-2xl border border-stone-200 p-3 space-y-2"><legend className="text-xs font-semibold px-1">Quem realiza este serviço?</legend><p className="text-xs text-stone-500">Escolha quem poderá receber agendamentos. Sem vínculo, o serviço não aparece no portal.</p>{active.map(p=><label key={p.id} className="flex gap-2 items-center text-sm"><input type="checkbox" checked={value.includes(p.id)} onChange={()=>onChange(value.includes(p.id)?value.filter(id=>id!==p.id):[...value,p.id])}/>{p.name}</label>)}{!active.length&&<p className="text-xs text-amber-800">Cadastre ou ative um profissional primeiro.</p>}</fieldset>;
}
