const nightRoomStorageKey='lili-night-room-selection';
const nightRoomSelections=JSON.parse(localStorage.getItem(nightRoomStorageKey)||'{}');
const activeSlotsWithDayOverrides=activeSlots;
const cellContentWithDayOverrides=cellContent;

function nightRoomLimit(site){return site==='Principal'?8:3}
function physicalRooms(site){return [...new Set(regularities[site].map(entry=>entry[0]))]}
function nightSelectionKey(site,date){return `${site}|${date}`}
function selectedNightRooms(site,date){
 const key=nightSelectionKey(site,date),available=physicalRooms(site),saved=nightRoomSelections[key];
 if(Array.isArray(saved))return saved.filter(room=>available.includes(room)).slice(0,nightRoomLimit(site));
 return available.slice(0,nightRoomLimit(site));
}
function saveNightRoomSelections(){localStorage.setItem(nightRoomStorageKey,JSON.stringify(nightRoomSelections))}

window.toggleNightRoom=function(date,room,checked){
 const site=$('site').value,key=nightSelectionKey(site,date),selected=selectedNightRooms(site,date);
 if(checked&&!selected.includes(room)){
  if(selected.length>=nightRoomLimit(site)){
   alert(`Solo puede activar ${nightRoomLimit(site)} quirofanos en la noche para la sede ${site}. Desactive una sala antes de seleccionar otra.`);
   plan();
   return;
  }
  selected.push(room);
 }else if(!checked){
  const index=selected.indexOf(room);
  if(index>=0)selected.splice(index,1);
 }
 nightRoomSelections[key]=selected;
 saveNightRoomSelections();
 plan();
};

activeSlots=function(){
 const site=$('site').value,date=selectedDate();
 const daytime=activeSlotsWithDayOverrides().filter(slot=>slot.shift!=='Noche');
 const night=selectedNightRooms(site,date).map(room=>({id:`${room}-Noche`,room,shift:'Noche',rule:'URGENCIAS / EMERGENCIAS',cap:720,items:[],night:true}));
 return [...daytime,...night];
};

cellContent=function(room,shift,dayIndex,weekDate,slots){
 if(shift!=='Noche')return cellContentWithDayOverrides(room,shift,dayIndex,weekDate,slots);
 const site=$('site').value,active=selectedNightRooms(site,weekDate).includes(room);
 const slot=weekDate===selectedDate()?slots.find(item=>item.room===room&&item.shift==='Noche'):null;
 const items=slot?slot.items:[];
 return `<label class="night-room-toggle ${active?'active':''}"><input type="checkbox" ${active?'checked':''} onchange="toggleNightRoom('${weekDate}','${room}',this.checked)"><span>${active?'Sala activa':'Activar sala'}</span></label>${active?'<strong class="night-owner">URGENCIAS / EMERGENCIAS</strong>':''}${items.map(c=>`<span class="matrix-case emergente">${esc(c.name)} · ${c.minutes} min<br>Inicio / fin: ${caseTimes(c)}</span>`).join('')}`;
};

plan();

