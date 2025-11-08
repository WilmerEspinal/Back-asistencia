// Script para probar el nuevo formato de 24 horas

// Función copiada del controlador
function formatTimeForExcel(date) {
  if (!date) return '---';
  
  // Si es un objeto Date
  if (date instanceof Date) {
    const horas = date.getHours().toString().padStart(2, '0');
    const minutos = date.getMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  }
  
  // Si es string, extraer la hora en formato 24h
  const dateStr = date.toString();
  
  // Si contiene fecha completa (YYYY-MM-DD HH:MM:SS), extraer solo HH:MM
  const datetimeMatch = dateStr.match(/\d{4}-\d{2}-\d{2}\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (datetimeMatch) {
    const horas = datetimeMatch[1].padStart(2, '0');
    const minutos = datetimeMatch[2];
    return `${horas}:${minutos}`;
  }
  
  // Si es solo hora en formato HH:MM:SS, quitar segundos
  const timeMatch = dateStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const horas = timeMatch[1].padStart(2, '0');
    const minutos = timeMatch[2];
    return `${horas}:${minutos}`;
  }
  
  // Si ya está en formato HH:MM, devolverlo tal como está
  if (dateStr.match(/^\d{1,2}:\d{2}$/)) {
    const parts = dateStr.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1]}`;
  }
  
  return dateStr; // Fallback
}

console.log('=== PRUEBAS DE FORMATO 24 HORAS ===\n');

// Casos basados en tu base de datos
const casos = [
  // Formato datetime completo (como en tu BD)
  '2025-10-07 08:02:00',
  '2025-10-07 12:02:07', 
  '2025-10-08 10:05:45',
  '2025-10-08 10:40:36',
  '2025-10-08 13:10:00', // Tu caso específico
  
  // Formato solo hora
  '08:00:00',
  '13:00:00',
  '14:00:00',
  '17:00:00',
  
  // Formato sin segundos
  '08:02',
  '13:10',
  
  // Casos especiales
  null,
  undefined,
  '',
  
  // Objeto Date
  new Date('2025-10-08T13:10:00')
];

console.log('Formato de entrada → Resultado esperado → Resultado real\n');

casos.forEach((caso, index) => {
  const resultado = formatTimeForExcel(caso);
  let esperado = '';
  
  if (!caso) {
    esperado = '---';
  } else if (typeof caso === 'string') {
    if (caso.includes('08:02')) esperado = '08:02';
    else if (caso.includes('12:02')) esperado = '12:02';
    else if (caso.includes('10:05')) esperado = '10:05';
    else if (caso.includes('10:40')) esperado = '10:40';
    else if (caso.includes('13:10')) esperado = '13:10';
    else if (caso === '08:00:00') esperado = '08:00';
    else if (caso === '13:00:00') esperado = '13:00';
    else if (caso === '14:00:00') esperado = '14:00';
    else if (caso === '17:00:00') esperado = '17:00';
    else if (caso === '08:02') esperado = '08:02';
    else if (caso === '13:10') esperado = '13:10';
    else esperado = caso;
  } else if (caso instanceof Date) {
    esperado = '13:10';
  }
  
  const estado = resultado === esperado ? '✅' : '❌';
  
  console.log(`${index + 1}. ${caso || 'null/undefined'}`);
  console.log(`   Esperado: "${esperado}"`);
  console.log(`   Obtenido: "${resultado}" ${estado}`);
  console.log('');
});

console.log('=== CASOS ESPECÍFICOS DE TU BD ===\n');

const tusBD = [
  { empleado: 'MM', hora_entrada: '2025-10-07 08:02:00', esperado: '08:02' },
  { empleado: 'ZE', hora_entrada: '2025-10-07 12:02:07', esperado: '12:02' },
  { empleado: 'ZE', hora_entrada: '2025-10-08 10:05:45', esperado: '10:05' },
  { empleado: 'MM', hora_entrada: '2025-10-08 10:40:36', esperado: '10:40' },
  { empleado: 'MM', hora_entrada_almuerzo: '2025-10-08 13:10:00', esperado: '13:10' }
];

tusBD.forEach(caso => {
  const resultado = formatTimeForExcel(caso.hora_entrada || caso.hora_entrada_almuerzo);
  const estado = resultado === caso.esperado ? '✅ CORRECTO' : '❌ ERROR';
  
  console.log(`${caso.empleado}: ${caso.hora_entrada || caso.hora_entrada_almuerzo} → ${resultado} ${estado}`);
});

console.log('\n=== VALIDACIÓN FINAL ===');
console.log('Tu caso específico:');
console.log(`Entrada almuerzo: 2025-10-08 13:10:00`);
console.log(`Resultado: ${formatTimeForExcel('2025-10-08 13:10:00')}`);
console.log(`Debe mostrar: 13:10 (formato 24h, sin segundos)`);
console.log(`Estado: ${formatTimeForExcel('2025-10-08 13:10:00') === '13:10' ? '✅ PERFECTO' : '❌ REVISAR'}`);

console.log('\n=== FIN DE PRUEBAS ===');
