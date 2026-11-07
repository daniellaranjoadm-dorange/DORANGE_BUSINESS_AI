import crypto from 'node:crypto';
import type {DatabaseSchema} from './db';
import type {Appointment,FinancialTransaction} from '../src/types';
import {localDateKey} from '../src/utils/businessInsights';

export class WorkflowError extends Error {
 constructor(public status:number,message:string){super(message);}
}
type Store={get<K extends keyof DatabaseSchema>(key:K):DatabaseSchema[K];mutate(fn:(data:DatabaseSchema)=>void):void};
const money=(value:number)=>Math.round(value*100);
const validKey=(key:unknown):key is string=>typeof key==='string'&&/^[A-Za-z0-9_-]{8,100}$/.test(key);
function audit(data:DatabaseSchema,tenantId:string,action:string,userId:string){
 data.auditLogs.unshift({id:'audit-'+crypto.randomUUID(),tenantId,action,details:'Operação do fluxo de atendimento registrada.',userId,timestamp:new Date().toISOString()});
}
export function appointmentBalance(appointment:Appointment,transactions:FinancialTransaction[]){
 const linked=transactions.filter(t=>t.tenantId===appointment.tenantId&&t.appointmentId===appointment.id);
 const paidRows=linked.filter(t=>t.type==='income'&&t.status==='paid');
 const invalidPaid=paidRows.some(t=>typeof t.amount!=='number'||!Number.isFinite(t.amount)||t.amount<0);
 const paidCents=paidRows.filter(t=>typeof t.amount==='number'&&Number.isFinite(t.amount)&&t.amount>=0).reduce((sum,t)=>sum+money(t.amount),0);
 const total=money(appointment.price);
 const requiresReview=invalidPaid||!Number.isFinite(total)||total<0||paidCents>total||(appointment.paymentStatus==='paid'&&paidCents!==total)||(appointment.paymentStatus==='deposit_paid'&&money(appointment.depositAmount||0)>paidCents)||linked.filter(t=>t.type==='income'&&t.status==='pending').length>1;
 return {total:total/100,paid:paidCents/100,remaining:Math.max(0,total-paidCents)/100,requiresReview,transactions:linked};
}
export function checkoutSnapshot(store:Store,id:string){
 const appointment=store.get('appointments').find(a=>a.id===id);
 if(!appointment)throw new WorkflowError(404,'Atendimento não encontrado.');
 const professional=store.get('professionals').find(p=>p.id===appointment.professionalId&&p.tenantId===appointment.tenantId);
 return {appointment,...appointmentBalance(appointment,store.get('financialTransactions')),suggestedCommissionRate:professional?.commissionRate??0,inventory:store.get('inventory').filter(i=>i.tenantId===appointment.tenantId)};
}
function updateForecast(data:DatabaseSchema,appointment:Appointment){
 const balance=appointmentBalance(appointment,data.financialTransactions);
 const pending=data.financialTransactions.filter(t=>t.tenantId===appointment.tenantId&&t.appointmentId===appointment.id&&t.type==='income'&&t.status==='pending');
 const remaining=balance.remaining;
 if(pending[0]){pending[0].amount=remaining;pending[0].status=remaining>0?'pending':'void';pending[0].kind='forecast';}
 appointment.paymentStatus=remaining===0?'paid':balance.paid>0?'deposit_paid':'pending';
 appointment.depositAmount=balance.paid;
}
export function recordPayment(store:Store,id:string,input:{amount:number;paymentMethod:string;operationKey:string},userId:string){
 if(!validKey(input.operationKey)||typeof input.amount!=='number'||!Number.isFinite(input.amount)||input.amount<=0||input.amount>1_000_000||Math.abs(input.amount*100-money(input.amount))>0.000001||!['pix','credit_card','debit_card','cash'].includes(input.paymentMethod))throw new WorkflowError(400,'Informe valor positivo com até duas casas decimais, forma de pagamento e referência válidos.');
 const snapshot=checkoutSnapshot(store,id);
 const prior=store.get('financialTransactions').find(t=>t.tenantId===snapshot.appointment.tenantId&&t.operationKey===input.operationKey);
 if(prior){if(prior.appointmentId!==id||money(prior.amount)!==money(input.amount)||prior.paymentMethod!==input.paymentMethod)throw new WorkflowError(409,'Esta referência já foi usada para outro recebimento.');return {...snapshot,replayed:true};}
 if(['cancelled','no_show'].includes(snapshot.appointment.status))throw new WorkflowError(409,'Revise o cancelamento ou a falta antes de registrar valores.');
 if(snapshot.requiresReview)throw new WorkflowError(409,'Há divergência nos pagamentos históricos. Revise o financeiro antes de receber novamente.');
 if(money(input.amount)>money(snapshot.remaining))throw new WorkflowError(409,'O valor excede o saldo deste atendimento.');
 store.mutate(data=>{
  const appointment=data.appointments.find(a=>a.id===id)!;
  data.financialTransactions.push({id:'fin-'+crypto.randomUUID(),tenantId:appointment.tenantId,type:'income',kind:'payment',category:'Recebimento de atendimento',description:`${appointment.serviceName} — recebimento`,amount:input.amount,date:localDateKey(new Date()),appointmentId:id,professionalId:appointment.professionalId,paymentMethod:input.paymentMethod as FinancialTransaction['paymentMethod'],status:'paid',operationKey:input.operationKey});
  updateForecast(data,appointment);
  const customer=data.customers.find(c=>c.id===appointment.customerId&&c.tenantId===appointment.tenantId);
  if(customer){customer.totalSpent=(money(customer.totalSpent||0)+money(input.amount))/100;const tenant=data.tenants.find(t=>t.id===appointment.tenantId);if(tenant?.loyaltyProgramEnabled)customer.loyaltyPoints+=(Math.floor(input.amount*(tenant.loyaltyPointsPerReal||0)));}
  audit(data,appointment.tenantId,'ATTENDANCE_PAYMENT',userId);
 });
 return {...checkoutSnapshot(store,id),replayed:false};
}
export function completeAttendance(store:Store,id:string,input:{operationKey:string;commissionRate:number;materials:{itemId:string;quantity:number}[]},userId:string){
 if(!validKey(input.operationKey)||!Number.isFinite(input.commissionRate)||input.commissionRate<0||input.commissionRate>100||!Array.isArray(input.materials)||input.materials.length>100)throw new WorkflowError(400,'Revise a comissão e os materiais do atendimento.');
 const snapshot=checkoutSnapshot(store,id);
 if(snapshot.appointment.fulfillment)return {...snapshot,replayed:true};
 if(!Number.isFinite(snapshot.appointment.price)||snapshot.appointment.price<0)throw new WorkflowError(409,'Revise o valor histórico do atendimento antes de concluir.');
 if(!['pending','confirmed'].includes(snapshot.appointment.status))throw new WorkflowError(409,'Este atendimento já foi encerrado. Registros históricos não serão reprocessados.');
 if(new Set(input.materials.map(line=>line?.itemId)).size!==input.materials.length)throw new WorkflowError(400,'Não repita o mesmo insumo na lista.');
 if(snapshot.transactions.some(t=>t.type==='commission'))throw new WorkflowError(409,'Já existe comissão vinculada. Revise antes de concluir.');
 store.mutate(data=>{
  const appointment=data.appointments.find(a=>a.id===id)!;
  const materials=input.materials.map(line=>{
   const item=data.inventory.find(i=>i.id===line?.itemId&&i.tenantId===appointment.tenantId);
   if(!item||typeof line.quantity!=='number'||!Number.isFinite(line.quantity)||line.quantity<=0||Math.abs(line.quantity*1000-Math.round(line.quantity*1000))>0.000001)throw new WorkflowError(400,'Escolha insumos desta empresa e quantidades positivas com até três casas decimais.');
   if(item.quantity<line.quantity)throw new WorkflowError(409,'Estoque insuficiente. Nenhum consumo ou comissão foi gravado.');
   if(!Number.isFinite(item.unitCost)||item.unitCost<0)throw new WorkflowError(409,'Revise o custo do insumo antes de concluir.');
   return {itemId:item.id,name:item.name,unit:item.unit,quantity:line.quantity,unitCost:item.unitCost};
  });
  const commission=money(appointment.price*input.commissionRate/100)/100;
  appointment.fulfillment={operationKey:input.operationKey,completedAt:new Date().toISOString(),materials,materialCostBRL:materials.reduce((sum,line)=>sum+money(line.quantity*line.unitCost),0)/100,commissionRate:input.commissionRate,commissionBRL:commission};
  appointment.status='completed';
  for(const line of materials){const item=data.inventory.find(i=>i.id===line.itemId)!;item.quantity=Math.round((item.quantity-line.quantity)*1000)/1000;data.inventoryMovements.push({id:'mov-'+crypto.randomUUID(),tenantId:appointment.tenantId,inventoryItemId:item.id,type:'consumption',quantity:line.quantity,reason:'Consumo no atendimento '+id,createdAt:new Date().toISOString()});}
  if(commission>0)data.financialTransactions.push({id:'fin-'+crypto.randomUUID(),tenantId:appointment.tenantId,type:'commission',kind:'commission',category:'Comissão de atendimento',description:appointment.professionalName+' — comissão a repassar',amount:commission,date:localDateKey(new Date()),appointmentId:id,professionalId:appointment.professionalId,status:'pending'});
  const customer=data.customers.find(c=>c.id===appointment.customerId&&c.tenantId===appointment.tenantId);
  if(customer){if(appointment.workflowVersion===1)customer.appointmentsCount+=1;customer.lastVisit=appointment.date;}
  audit(data,appointment.tenantId,'ATTENDANCE_COMPLETED',userId);
 });
 return {...checkoutSnapshot(store,id),replayed:false};
}
export function settlePayable(store:Store,id:string,operationKey:string,paymentMethod:string,userId:string){
 if(!validKey(operationKey)||!['pix','credit_card','debit_card','cash'].includes(paymentMethod))throw new WorkflowError(400,'Informe forma e referência de pagamento.');
 const transaction=store.get('financialTransactions').find(t=>t.id===id);
 if(!transaction)throw new WorkflowError(404,'Lançamento não encontrado.');
 if(transaction.type==='income'||transaction.status==='void')throw new WorkflowError(409,'Este lançamento não é uma despesa ou comissão a pagar.');
 if(transaction.status==='paid')return transaction;
 if(store.get('financialTransactions').some(t=>t.tenantId===transaction.tenantId&&t.id!==id&&t.settlementKey===operationKey))throw new WorkflowError(409,'Esta referência já foi usada em outro lançamento.');
 store.mutate(data=>{const t=data.financialTransactions.find(t=>t.id===id)!;t.status='paid';t.date=localDateKey(new Date());t.paymentMethod=paymentMethod as FinancialTransaction['paymentMethod'];t.settlementKey=operationKey;audit(data,t.tenantId,'PAYABLE_SETTLED',userId);});
 return store.get('financialTransactions').find(t=>t.id===id)!;
}
