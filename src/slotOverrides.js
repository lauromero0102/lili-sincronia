const slotOverrides=JSON.parse(localStorage.getItem('lili-slot-overrides')||'{}');
const baseActiveSlots=activeSlots;
const baseSpecialistAvailable=specialistAvailable;
const baseCellContent=cellContent;

function slotOverrideKey(site,date,room,shift){return `${site}|${date}|${room}|${shift}`}
function getSlotOverride(date,room,shift){return slotOverrides[slotOverrideKey($('site').value,date,room,shift)]||{}}
function saveSlotOverrides(){localStorage.setItem('lili-slot-overrides',JSON.stringify(slotOverrides))}

window.setSlotOverride=function(date,room,shift,field,value){
 const key=slotOverrideKey($('site').value,date,room,shift),current=slotOverrides[key]||{};
 if(value)current[field]=value;else delete current[field];
 if(current.specialty||current.specialist)slotOverrides[key]=current;else delete slotOverrides[key];
 saveSlotOverrides();plan();
};

activeSlots=function(){
 const slots=baseActiveSlots(),date=selectedDate();
 slots.filter(slot=>slot.shift!=='Noche').forEach(slot=>{
  const manual=getSlotOverride(date,slot.room,slot.shift);
  if(manual.specialty)slot.rule=manual.specialty;
  slot.manualSpecialist=manual.specialist||'';
 });
 return slots;
};

specialistAvailable=function(c,s){
 if(s.manualSpecialist)return norm(c.specialist)===norm(s.manualSpecialist);
 return baseSpecialistAvailable(c,s);
};

function overrideSelects(room,shift,date){
 const manual=getSlotOverride(date,room,shift),locked=shift==='Noche',specialtyOptions=specialties.map(value=>`<option value="${esc(value)}" ${manual.specialty===value?'selected':''}>${esc(value)}</option>`).join(''),specialistOptions=specialists.map(value=>`<option value="${esc(value)}" ${manual.specialist===value?'selected':''}>${esc(value)}</option>`).join('');
 if(locked)return '<div class="slot-locked" title="La franja nocturna permanece reservada para urgencias">Asignacion fija de urgencias</div>';
 return `<div class="slot-overrides"><select aria-label="Especialidad manual" onchange="setSlotOverride('${date}','${room}','${shift}','specialty',this.value)"><option value="">Especialidad</option>${specialtyOptions}</select><select aria-label="Especialista manual" onchange="setSlotOverride('${date}','${room}','${shift}','specialist',this.value)"><option value="">Especialista</option>${specialistOptions}</select></div>`;
}

cellContent=function(room,shift,dayIndex,weekDate,slots){
 const controls=overrideSelects(room,shift,weekDate),manual=getSlotOverride(weekDate,room,shift);
 if(shift==='Noche')return `${baseCellContent(room,shift,dayIndex,weekDate,slots)}${controls}`;
 let entry=regularities[$('site').value].find(x=>x[0]===room&&x[1]===shift),defaultRule=entry&&entry[2][dayIndex]?entry[2][dayIndex]:'—',rule=manual.specialty||defaultRule,slot=slots.find(s=>s.room===room&&s.shift===shift),items=weekDate===selectedDate()&&slot?slot.items:[];
 return `<span class="slot-owner ${manual.specialty?'manual':''}">${esc(rule==='—'?'—':displaySpecialty(rule)).replace(/\n/g,'<br>')}</span>${items.map(c=>`<span class="matrix-case ${c.status}">${esc(c.name)} · ${c.minutes} min<br>Inicio / fin: ${caseTimes(c)}</span>`).join('')}${controls}`;
};

plan();

