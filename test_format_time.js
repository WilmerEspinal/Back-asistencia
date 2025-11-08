// Script para probar la función formatTime

function formatTime(date) {
  // Si ya es un string formateado, aplicar transformaciones
  if (typeof date === 'string' && (date.includes('a. m.') || date.includes('p. m.') || date.includes('AM') || date.includes('PM'))) {
    let formatted = date;
    
    // Quitar segundos si existen (formato HH:MM:SS)
    formatted = formatted.replace(/(\d{1,2}:\d{2}):\d{2}/, '$1');
    
    // Reemplazar formatos de AM/PM
    formatted = formatted
      .replace(' a. m.', 'AM')
      .replace(' p. m.', 'PM')
      .replace(' a.m.', 'AM')
      .replace(' p.m.', 'PM')
      .replace(' AM', 'AM')
      .replace(' PM', 'PM');
    
    return formatted;
  }
  
  // Si es un objeto Date o timestamp, formatear desde cero
  const timeString = new Date(date).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Lima'
  });
  
  // Reemplazar formato de AM/PM: quitar espacios y puntos
  return timeString
    .replace(' a. m.', 'AM')
    .replace(' p. m.', 'PM')
    .replace(' a.m.', 'AM')
    .replace(' p.m.', 'PM');
}

// Casos de prueba
console.log('=== PRUEBAS DE FORMATO DE TIEMPO ===\n');

// Caso 1: String ya formateado con segundos
console.log('1. String con segundos y formato español:');
const caso1 = "10:40:36 a. m.";
console.log(`   Entrada: "${caso1}"`);
console.log(`   Salida:  "${formatTime(caso1)}"`);
console.log(`   Esperado: "10:40AM"\n`);

// Caso 2: String de la tarde
console.log('2. String de la tarde:');
const caso2 = "01:00:00 p. m.";
console.log(`   Entrada: "${caso2}"`);
console.log(`   Salida:  "${formatTime(caso2)}"`);
console.log(`   Esperado: "01:00PM"\n`);

// Caso 3: Objeto Date
console.log('3. Objeto Date:');
const caso3 = new Date();
console.log(`   Entrada: ${caso3}`);
console.log(`   Salida:  "${formatTime(caso3)}"`);
console.log(`   Esperado: Formato "HH:MMAM/PM"\n`);

// Caso 4: String sin segundos
console.log('4. String sin segundos:');
const caso4 = "02:30 p. m.";
console.log(`   Entrada: "${caso4}"`);
console.log(`   Salida:  "${formatTime(caso4)}"`);
console.log(`   Esperado: "02:30PM"\n`);

// Caso 5: Diferentes variantes de formato
console.log('5. Diferentes variantes:');
const casos = [
  "09:15:30 a.m.",
  "11:45:00 a. m.",
  "14:20:15 p.m.",
  "16:30:45 p. m."
];

casos.forEach((caso, index) => {
  console.log(`   ${index + 1}. "${caso}" → "${formatTime(caso)}"`);
});

console.log('\n=== FIN DE PRUEBAS ===');
