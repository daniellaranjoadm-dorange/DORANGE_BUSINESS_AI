// Read-only audit: report violations; never repair or remove historical records silently.
export function auditIntegrity(data:any): string[] {
 const errors:string[]=[];const tables=new Map<string,Map<string,any>>();
 for(const [name,rows] of Object.entries(data))if(Array.isArray(rows)){
   const map=new Map();for(const r of rows){if(r.id){if(map.has(r.id))errors.push(`${name}: ID duplicado ${r.id}`);map.set(r.id,r);}}tables.set(name,map);
 }
 const references:Record<string,Record<string,string>>={appointments:{serviceId:'services',professionalId:'professionals',customerId:'customers'},services:{professionalIds:'professionals'},professionals:{services:'services'},financialTransactions:{appointmentId:'appointments',professionalId:'professionals'},packagePlans:{serviceId:'services'},customerPackages:{customerId:'customers',packagePlanId:'packagePlans'},portfolio:{serviceId:'services'},blockedTimes:{professionalId:'professionals'},inventoryMovements:{inventoryItemId:'inventory'}};
 for(const [name,rows] of Object.entries(data))if(Array.isArray(rows))for(const row of rows){
   if(row.tenantId && !['auditLogs'].includes(name) && !tables.get('tenants')?.has(row.tenantId))errors.push(`${name}/${row.id}: tenant inexistente ${row.tenantId}`);
   for(const [field,table] of Object.entries(references[name]||{}))for(const id of Array.isArray(row[field])?row[field]:row[field]?[row[field]]:[]){const target=tables.get(table)?.get(id);if(!target)errors.push(`${name}/${row.id}: ${field} inexistente ${id}`);else if(target.tenantId!==row.tenantId)errors.push(`${name}/${row.id}: ${field} pertence a outra empresa`);}
 }
 return errors;
}
