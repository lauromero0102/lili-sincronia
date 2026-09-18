// Las celdas combinadas del Excel indican que una misma asignacion cubre AM y PM.
// La regla completa conserva en memoria los especialistas de la franja, aunque
// el cronograma muestre unicamente la especialidad propietaria.
const inheritedPmAssignments={"Principal":{"SALA 01":[0,2,3,4,5],"SALA 02":[0,1,2,3,5],"SALA 03":[0,1,2,4,5],"SALA 04":[0,1,2,3,4,5],"SALA 05":[0,1,2,3,4],"SALA 06":[0,1,2,3,4,5],"SALA 07":[0,1,2,3,4,5],"SALA 08":[2,5],"SALA 09":[0,1,2,3,4,5,6],"SALA 10":[0,1,2,3,4,5,6],"SALA 11":[0,1,2,3,4,6],"SALA 12":[1,2,3,4]},"Limonar":{"SALA 01":[1,2,3,4,5],"SALA 02":[0,1,2,3,4,5],"SALA 03":[1,3,5],"SALA 04":[0,1,2,3,5],"SALA 05":[0,1,2,4,5],"SALA 06":[2],"SALA 07":[0,4],"SALA 08":[1,2,3]}};

Object.entries(inheritedPmAssignments).forEach(([site,rooms])=>{
 Object.entries(rooms).forEach(([room,dayIndexes])=>{
  const am=regularities[site].find(entry=>entry[0]===room&&entry[1]==='AM');
  const pm=regularities[site].find(entry=>entry[0]===room&&entry[1]==='PM');
  if(!am||!pm)return;
  dayIndexes.forEach(dayIndex=>{if(!pm[2][dayIndex])pm[2][dayIndex]=am[2][dayIndex]});
 });
});
