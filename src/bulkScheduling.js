const bulkSchedule=new Map();
const bulkAudit={imported:0,rejected:0,file:''};
const baseRenderWithOverrides=render;

function isoDate(value){const d=new Date(`${value}T12:00:00`);return Number.isNaN(d.getTime())?'':`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function addDays(value,count){const d=new Date(`${value}T12:00:00`);d.setDate(d.getDate()+count);return isoDate(d.toISOString().slice(0,10))}
function weekdayIndex(date){const d=new Date(`${date}T12:00:00`);return (d.getDay()+6)%7}
function scheduleKey(site,date){return `${site}|${date}`}
function normalizedHeader(value){return norm(String(value||'')).replace(/[^a-z0-9]/g,'')}
function cleanText(value){return String(value==null?'':value).replace(/\uFFFD/g,'').replace(/\s+/g,' ').trim()}
function valueByAliases(row,headers,aliases){const index=headers.findIndex(header=>aliases.includes(normalizedHeader(header)));return index<0?'':row[index]}
function normalizedPriority(value){const n=norm(value).replace(/\s+/g,'_');if(n.includes('emerg'))return'emergente';if(n==='urgente'||n.includes('urgente'))return'urgente';if(n.includes('relativa'))return'urg_relativa';return'electiva'}
function normalizedSite(value){return norm(value).includes('limonar')?'Limonar':'Principal'}

function rawSlotsFor(site,date){
 const di=weekdayIndex(date),source=regularities[site],rooms=[...new Set(source.map(x=>x[0]))],result=[];
 rooms.forEach(room=>['AM','PM'].forEach(shift=>{const entry=source.find(x=>x[0]===room&&x[1]===shift),manual=slotOverrides[slotOverrideKey(site,date,room,shift)]||{},rule=manual.specialty||(entry&&entry[2][di])||'';result.push({id:`${room}-${shift}`,room,shift,rule,manualSpecialist:manual.specialist||'',cap:rule?360:0,items:[],site,date})}));
 selectedNightRooms(site,date).forEach(room=>result.push({id:`${room}-Noche`,room,shift:'Noche',rule:'URGENCIAS / EMERGENCIAS',cap:720,items:[],night:true,site,date}));
 return result;
}
function slotsFor(site,date){const key=scheduleKey(site,date);if(!bulkSchedule.has(key))bulkSchedule.set(key,rawSlotsFor(site,date));return bulkSchedule.get(key)}
function scheduledItemsFor(site,date,room,shift){return (bulkSchedule.get(scheduleKey(site,date))||[]).find(slot=>slot.room===room&&slot.shift===shift)?.items||[]}
function specialistFits(caseItem,slot){if(slot.manualSpecialist)return norm(caseItem.specialist)===norm(slot.manualSpecialist);const rule=norm(slot.rule),tokens=norm(caseItem.specialist).split(/\s+/).filter(x=>x.length>3&&!['maria','jose','juan','andres','carlos','patricia','jorge','luis'].includes(x));return tokens.some(token=>rule.includes(token))}
function urgencyOwner(slot){const rule=norm(slot.rule);return slot.shift==='Noche'||rule.includes('urgencias')||rule.includes('emergencias')}
function candidateDates(item){const horizon={emergente:0,urgente:0,urg_relativa:1,electiva:30}[item.status]??30;return Array.from({length:horizon+1},(_,i)=>addDays(item.date,i))}
function orderedCandidates(item){
 const all=candidateDates(item).flatMap(date=>slotsFor(item.site,date));
 if(['emergente','urgente'].includes(item.status))return all.filter(urgencyOwner);
 const daytime=all.filter(slot=>slot.shift!=='Noche'&&slot.cap>0),fixed=daytime.filter(slot=>specialistFits(item,slot));
 const pool=fixed.length?fixed:daytime.filter(slot=>compatible(item,slot));
 return pool.sort((a,b)=>a.date.localeCompare(b.date)||({AM:0,PM:1,Noche:2}[a.shift]-{AM:0,PM:1,Noche:2}[b.shift])||a.room.localeCompare(b.room));
}
function scheduleAll(){
 bulkSchedule.clear();cases.forEach(item=>{if(!item.site)item.site=$('site').value;item.assignment=null;item.assignedDate=null;item.startMinute=null;item.endMinute=null;item.targetMet=false});
 [...cases].sort((a,b)=>rank[a.status]-rank[b.status]||a.date.localeCompare(b.date)||a.order-b.order).forEach(item=>{
  const hit=orderedCandidates(item).map(slot=>({slot,start:nextStart(slot,item.minutes,[slot])})).find(candidate=>candidate.start!==null);
  if(!hit)return;
  item.assignedDate=hit.slot.date;item.startMinute=hit.start;item.endMinute=hit.start+item.minutes;item.assignment=`${hit.slot.room} · ${hit.slot.shift==='Noche'?'EXT':hit.slot.shift}`;item.targetMet=candidateDates(item).includes(hit.slot.date);hit.slot.items.push(item);
 });
}
function selectedDayCases(){const date=selectedDate(),site=$('site').value;return cases.filter(item=>item.site===site&&(item.assignedDate===date||(!item.assignment&&item.date===date))).sort((a,b)=>rank[a.status]-rank[b.status]||a.order-b.order)}
function plan(){scheduleAll();const slots=slotsFor($('site').value,selectedDate());render(slots,selectedDayCases())}

function weekCases(){const dates=weekDates().map(x=>x.date),site=$('site').value;return cases.filter(item=>item.site===site&&item.assignedDate&&dates.includes(item.assignedDate))}
function weeklyMetrics(){const scheduled=weekCases(),dates=weekDates().map(x=>x.date),site=$('site').value,slots=dates.flatMap(date=>bulkSchedule.get(scheduleKey(site,date))||[]).filter(slot=>slot.cap>0),used=scheduled.reduce((sum,item)=>sum+item.minutes,0),turnovers=slots.reduce((sum,slot)=>sum+Math.max(0,slot.items.length-1)*turnover,0),available=slots.reduce((sum,slot)=>sum+slot.cap,0),owner=scheduled.filter(item=>{const slot=(bulkSchedule.get(scheduleKey(site,item.assignedDate))||[]).find(x=>x.items.includes(item));return slot&&(specialistFits(item,slot)||compatible(item,slot))}).length;return{scheduled,used,turnovers,available,utilization:available?Math.round((used+turnovers)*1000/available)/10:0,ownerCompliance:scheduled.length?Math.round(owner*1000/scheduled.length)/10:0,pending:cases.filter(item=>item.site===site&&!item.assignment).length}}
function renderWeeklyReport(){const report=$('weeklyReport');if(!report)return;const m=weeklyMetrics(),counts=Object.fromEntries(['emergente','urgente','urg_relativa','electiva'].map(key=>[key,m.scheduled.filter(x=>x.status===key).length]));report.innerHTML=`<div class="report-heading"><div><span class="eyebrow">Informe semanal sin identificadores</span><h2>Gestion de salas</h2></div><span class="report-week">${weekDates()[0].date} / ${weekDates()[6].date}</span></div><div class="report-grid"><div><b>${m.utilization}%</b><span>Ocupacion programada*</span></div><div><b>${m.ownerCompliance}%</b><span>Uso de franja asignada</span></div><div><b>${m.scheduled.length}</b><span>Cirugias programadas</span></div><div><b>${m.pending}</b><span>Pendientes totales</span></div></div><div class="priority-strip"><span>Emergentes <b>${counts.emergente}</b></span><span>Urgentes <b>${counts.urgente}</b></span><span>Urg. relativa <b>${counts.urg_relativa}</b></span><span>Electivas <b>${counts.electiva}</b></span></div><p class="metric-note">* Minutos quirurgicos programados + recambios de 20 min / minutos de franjas activas. Es planificacion, no ejecucion real.</p>`}
function render(slots,sorted){baseRenderWithOverrides(slots,sorted);renderWeeklyReport()}

async function importWorkbook(){
 const input=$('patientWorkbook'),status=$('importStatus'),file=input.files&&input.files[0];if(!file){status.textContent='Seleccione primero un archivo Excel.';return}if(typeof XLSX==='undefined'){status.textContent='No fue posible cargar el lector de Excel. Revise la conexion e intente de nuevo.';return}
 status.textContent='Leyendo y validando el archivo…';await new Promise(resolve=>setTimeout(resolve,20));
 try{const workbook=XLSX.read(await file.arrayBuffer(),{type:'array'}),sheet=workbook.Sheets[workbook.SheetNames[0]],rows=XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:''}),headers=rows.shift()||[];let accepted=0,rejected=0;const start=selectedDate();
  rows.forEach(row=>{const name=cleanText(valueByAliases(row,headers,['nombrecompletodelpaciente','nombrepaciente','paciente'])),doc=cleanText(valueByAliases(row,headers,['ndocumento','numerodocumento','documento','cedula'])),episode=cleanText(valueByAliases(row,headers,['episodio'])),cups=cleanText(valueByAliases(row,headers,['prestacion','codigocups','cups'])),procedure=cleanText(valueByAliases(row,headers,['denominacionprestacion','denominacion','nombreprestacion'])),specialist=cleanText(valueByAliases(row,headers,['especialista','especialistatratante'])),specialty=cleanText(valueByAliases(row,headers,['especialidad','especialidadsolicitante'])),anesthesia=cleanText(valueByAliases(row,headers,['tipodeanestesia','anestesia'])),site=normalizedSite(valueByAliases(row,headers,['sededecirugia','sede'])),statusValue=normalizedPriority(valueByAliases(row,headers,['prioridad','estatus'])),minutes=Number(String(valueByAliases(row,headers,['tiempoquirurgico','tiempominutos','duracion'])).replace(',','.'));if(!name||!episode||!specialty||!specialist||!cups||!Number.isFinite(minutes)||minutes<=0){rejected++;return}cases.push({order:seq++,date:start,site,name,doc,episode,status:statusValue,anesthesia,specialty,specialist,minutes,cups,procedure,source:'excel'});accepted++});bulkAudit.imported=accepted;bulkAudit.rejected=rejected;bulkAudit.file=file.name;plan();status.innerHTML=`<strong>${accepted.toLocaleString('es-CO')} solicitudes importadas.</strong>${rejected?` ${rejected.toLocaleString('es-CO')} filas fueron omitidas por datos obligatorios incompletos.`:''} Inicio de busqueda: ${start}.`}
 catch(error){console.error(error);status.textContent='No se pudo leer el archivo. Verifique que sea un Excel valido y conserve los encabezados de la plantilla.'}
}
function exportWeeklyReport(){const m=weeklyMetrics(),counts=Object.fromEntries(['emergente','urgente','urg_relativa','electiva'].map(key=>[key,m.scheduled.filter(x=>x.status===key).length])),rows=[['Semana inicio','Semana fin','Sede','Cirugias programadas','Minutos quirurgicos','Minutos recambio','Minutos disponibles','Ocupacion programada %','Uso franja asignada %','Emergentes','Urgentes','Urgencia relativa','Electivas','Pendientes'],[weekDates()[0].date,weekDates()[6].date,$('site').value,m.scheduled.length,m.used,m.turnovers,m.available,m.utilization,m.ownerCompliance,counts.emergente,counts.urgente,counts.urg_relativa,counts.electiva,m.pending]],csv=rows.map(row=>row.map(value=>`"${String(value).replace(/"/g,'""')}"`).join(',')).join('\r\n'),link=document.createElement('a');link.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));link.download=`informe-quirofanos-${$('site').value}-${weekDates()[0].date}.csv`;link.click();URL.revokeObjectURL(link.href)}

$('patientWorkbook').addEventListener('change',event=>{const file=event.target.files&&event.target.files[0];$('importStatus').textContent=file?`${file.name} listo para importar.`:'No se ha cargado ningun archivo.'});$('importPatients').onclick=importWorkbook;$('exportWeekly').onclick=exportWeeklyReport;plan();

