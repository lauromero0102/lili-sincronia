function nextStart(slot,duration,slots){
 const base={AM:420,PM:780,Noche:1140}[slot.shift],limit=base+slot.cap;
 let start=base;
 const bookings=slots.filter(s=>s.room===slot.room).flatMap(s=>s.items).sort((a,b)=>a.startMinute-b.startMinute);
 for(const booking of bookings){
  if(start+duration+turnover<=booking.startMinute)break;
  if(start<booking.endMinute+turnover)start=booking.endMinute+turnover;
 }
 return start+duration<=limit?start:null;
}
function programTime(minute){
 const dayOffset=Math.floor(minute/1440),clock=minute%1440;
 return String(Math.floor(clock/60)).padStart(2,'0')+':'+String(clock%60).padStart(2,'0')+(dayOffset?' (dia siguiente)':'');
}
function caseTimes(c){return c.startMinute==null?'Sin horario':programTime(c.startMinute)+' – '+programTime(c.endMinute)}
