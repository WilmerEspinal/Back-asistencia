// Script para probar específicamente el caso de entrada almuerzo

// Función auxiliar para convertir hora a minutos desde medianoche (copiada del controlador)
function horaAMinutos(horaString) {
  if (!horaString) return null;
  
  // Si es un objeto Date, extraer solo la hora en zona horaria de Perú
  if (horaString instanceof Date) {
    // Convertir a zona horaria de Perú
    const peruTime = new Date(horaString.toLocaleString("en-US", {timeZone: "America/Lima"}));
    const horas = peruTime.getHours();
    const minutos = peruTime.getMinutes();
    return horas * 60 + minutos;
  }
  
  // Si es string, puede ser formato completo datetime o solo hora
  const horaStr = horaString.toString();
  
  // Si contiene fecha completa (YYYY-MM-DD HH:MM:SS), extraer solo la hora
  const datetimeMatch = horaStr.match(/\d{4}-\d{2}-\d{2}\s+(\d{1,2}):(\d{2}):(\d{2})/);
  if (datetimeMatch) {
    const horas = parseInt(datetimeMatch[1]);
    const minutos = parseInt(datetimeMatch[2]);
    return horas * 60 + minutos;
  }
  
  // Si es solo hora en formato HH:MM:SS o HH:MM
  const timeMatch = horaStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const horas = parseInt(timeMatch[1]);
    const minutos = parseInt(timeMatch[2]);
    return horas * 60 + minutos;
  }
  
  return null;
}

console.log('=== PRUEBA ESPECÍFICA: ENTRADA ALMUERZO ===\n');

// Tu caso específico
const horaEntradaAlmuerzo = '2025-10-08 13:10:00'; // Lo que pusiste en la BD
const horarioConfigurado = '14:00:00'; // Horario configurado
const tolerancia = 5;

console.log(`Hora en BD: ${horaEntradaAlmuerzo}`);
console.log(`Horario configurado: ${horarioConfigurado}`);
console.log(`Tolerancia: ${tolerancia} minutos\n`);

// Convertir a minutos
const minutosEntrada = horaAMinutos(horaEntradaAlmuerzo);
const minutosHorario = horaAMinutos(horarioConfigurado);

console.log(`=== CONVERSIÓN A MINUTOS ===`);
console.log(`${horaEntradaAlmuerzo} → ${minutosEntrada} minutos`);
console.log(`${horarioConfigurado} → ${minutosHorario} minutos\n`);

// Calcular diferencia
const diferencia = minutosEntrada - minutosHorario;
const limite = minutosHorario + tolerancia;

console.log(`=== CÁLCULO ===`);
console.log(`Diferencia: ${minutosEntrada} - ${minutosHorario} = ${diferencia} minutos`);
console.log(`Límite aceptable: ${minutosHorario} + ${tolerancia} = ${limite} minutos`);
console.log(`Hora límite: ${Math.floor(limite/60)}:${(limite%60).toString().padStart(2,'0')}\n`);

// Determinar estado
let estado;
if (diferencia > tolerancia) {
  estado = 'TARDE';
  console.log(`❌ RESULTADO: ${estado} (${diferencia} > ${tolerancia})`);
  console.log(`🔴 DEBE APARECER EN ROJO`);
} else if (diferencia < -tolerancia) {
  estado = 'TEMPRANO';
  console.log(`✅ RESULTADO: ${estado} (${diferencia} < -${tolerancia})`);
} else {
  estado = 'PUNTUAL';
  console.log(`✅ RESULTADO: ${estado} (${diferencia} dentro de ±${tolerancia})`);
}

console.log('\n=== ANÁLISIS DETALLADO ===');
console.log(`13:10 (1:10 PM) vs 14:00 (2:00 PM):`);
console.log(`- 13:10 = 13*60 + 10 = 790 minutos`);
console.log(`- 14:00 = 14*60 + 0 = 840 minutos`);
console.log(`- Diferencia: 790 - 840 = -50 minutos`);
console.log(`- Llegó 50 minutos ANTES del horario`);
console.log(`- Como -50 < -5, está TEMPRANO (no tardío)`);
console.log(`- NO debe aparecer en rojo`);

console.log('\n=== CASOS DE PRUEBA ADICIONALES ===');
const casos = [
  '14:10:00', // 10 min tarde → ROJO
  '14:05:00', // Exacto límite → PUNTUAL
  '14:06:00', // 1 min tarde → ROJO
  '13:50:00', // 10 min temprano → PUNTUAL
  '15:00:00'  // 60 min tarde → ROJO
];

casos.forEach(hora => {
  const mins = horaAMinutos(hora);
  const diff = mins - minutosHorario;
  let result;
  
  if (diff > tolerancia) result = '🔴 TARDE (ROJO)';
  else if (diff < -tolerancia) result = '🔵 TEMPRANO';
  else result = '✅ PUNTUAL';
  
  console.log(`${hora}: ${diff} min → ${result}`);
});

console.log('\n=== FIN DE PRUEBA ===');
