import type {Tenant,Professional} from '../types';
const minutes=(value:string)=>{const [h,m]=value.split(':').map(Number);return h*60+m;};
export function validScheduleDate(date:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;const d=new Date(date+'T12:00:00');return !Number.isNaN(d.getTime())&&d.getFullYear()===Number(date.slice(0,4))&&d.getMonth()+1===Number(date.slice(5,7))&&d.getDate()===Number(date.slice(8,10));}
export function withinWorkingHours(tenant:Pick<Tenant,'businessHours'>,professional:Pick<Professional,'schedule'>,date:string,time:string,duration:number){
 if(!validScheduleDate(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||!Number.isInteger(duration)||duration<5)return false;
 const day=new Date(date+'T12:00:00').getDay();const company=tenant.businessHours?.[day],person=professional.schedule?.[day];
 if(!company?.open||!person?.active)return false;
 const start=minutes(time),end=start+duration;
 for(const hours of [company,person])if(start<minutes(hours.start)||end>minutes(hours.end)||(hours.breakStart&&hours.breakEnd&&start<minutes(hours.breakEnd)&&end>minutes(hours.breakStart)))return false;
 return true;
}
export function availableStartTimes(tenant:Pick<Tenant,'businessHours'|'bufferBetweenAppointmentsMinutes'>,professional:Pick<Professional,'id'|'schedule'>,date:string,duration:number,bookings:{time:string;durationMinutes:number;professionalId:string}[],blocks:{startTime:string;endTime:string;professionalId:string}[]){
 const result:string[]=[];const buffer=tenant.bufferBetweenAppointmentsMinutes||0;
 for(let value=0;value<24*60;value+=15){const time=String(Math.floor(value/60)).padStart(2,'0')+':'+String(value%60).padStart(2,'0');if(!withinWorkingHours(tenant,professional,date,time,duration))continue;
  if(bookings.some(a=>a.professionalId===professional.id&&value<minutes(a.time)+a.durationMinutes+buffer&&value+duration+buffer>minutes(a.time)))continue;
  if(blocks.some(b=>b.professionalId===professional.id&&value<minutes(b.endTime)&&value+duration+buffer>minutes(b.startTime)))continue;
  result.push(time);
 }return result;
}
