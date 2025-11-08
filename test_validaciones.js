// Script para probar las validaciones de horarios

// Función auxiliar para convertir hora a minutos desde medianoche
function horaAMinutos(horaString) {
  if (!horaString) return null;
  
  // Si es un objeto Date, extraer solo la hora
  if (horaString instanceof Date) {
    const horas = horaString.getHours();
    const minutos = horaString.getMinutos();
    return horas * 60 + minutos;
  }
  
  // Si es string en formato HH:MM:SS
  const match = horaString.toString().match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const horas = parseInt(match[1]);
    const minutos = parseInt(match[2]);
    return horas * 60 + minutos;
  }
  
  return null;
}

// Función de validación (simplificada para pruebas)
function validarEntrada(horaEntrada, horarioEntrada, tolerancia) {
  const minutosEntrada = horaAMinutos(horaEntrada);
  const minutosHorarioEntrada = horaAMinutos(horarioEntrada);
  
  if (minutosEntrada !== null && minutosHorarioEntrada !== null) {
    const diferencia = minutosEntrada - minutosHorarioEntrada;
    
    if (diferencia > tolerancia) {
      return {
        estado: 'tarde',
        mensaje: `Llegó ${diferencia} minutos tarde`,
        diferencia: diferencia
      };
    } else if (diferencia < -tolerancia) {
      return {
        estado: 'temprano',
        mensaje: `Llegó ${Math.abs(diferencia)} minutos temprano`,
        diferencia: diferencia
      };
    } else {
      return {
        estado: 'puntual',
        mensaje: 'Puntual',
        diferencia: diferencia
      };
    }
  }
  
  return { estado: 'error', mensaje: 'No se pudo validar' };
}

console.log('=== PRUEBAS DE VALIDACIÓN DE HORARIOS ===\n');

// Configuración de tu sistema
const horarioEntrada = '08:00:00';
const tolerancia = 5;

console.log(`Horario configurado: ${horarioEntrada}`);
console.log(`Tolerancia: ${tolerancia} minutos`);
console.log(`Límite aceptable: hasta las 08:05:00\n`);

// Casos de prueba basados en tu Excel
const casos = [
  { empleado: 'ZE', hora: '10:05:00', fecha: '08/10/2025' },
  { empleado: 'MM', hora: '10:40:00', fecha: '08/10/2025' },
  { empleado: 'ZE', hora: '12:02:00', fecha: '07/10/2025' },
  { empleado: 'MM', hora: '11:31:00', fecha: '07/10/2025' },
  { empleado: 'TEST', hora: '07:58:00', fecha: 'Prueba' }, // Temprano
  { empleado: 'TEST', hora: '08:03:00', fecha: 'Prueba' }, // Puntual
];

casos.forEach((caso, index) => {
  const resultado = validarEntrada(caso.hora, horarioEntrada, tolerancia);
  
  console.log(`${index + 1}. ${caso.empleado} - ${caso.fecha}`);
  console.log(`   Hora: ${caso.hora}`);
  console.log(`   Estado: ${resultado.estado.toUpperCase()}`);
  console.log(`   Diferencia: ${resultado.diferencia} minutos`);
  console.log(`   Mensaje: ${resultado.mensaje}`);
  
  if (resultado.estado === 'tarde') {
    console.log(`   🔴 DEBE APARECER EN ROJO EN EXCEL`);
  } else if (resultado.estado === 'puntual') {
    console.log(`   ✅ Normal (sin color)`);
  } else if (resultado.estado === 'temprano') {
    console.log(`   🔵 Temprano`);
  }
  
  console.log('');
});

console.log('=== CONVERSIÓN DE HORAS A MINUTOS ===\n');

const horasPrueba = ['08:00:00', '10:05:00', '10:40:00', '12:02:00', '11:31:00'];
horasPrueba.forEach(hora => {
  const minutos = horaAMinutos(hora);
  const horas24 = Math.floor(minutos / 60);
  const mins = minutos % 60;
  console.log(`${hora} = ${minutos} minutos = ${horas24}:${mins.toString().padStart(2, '0')}`);
});

console.log('\n=== CÁLCULO DE DIFERENCIAS ===\n');

const horarioBase = horaAMinutos('08:00:00'); // 480 minutos
console.log(`Horario base (08:00): ${horarioBase} minutos\n`);

horasPrueba.forEach(hora => {
  const minutosHora = horaAMinutos(hora);
  const diferencia = minutosHora - horarioBase;
  console.log(`${hora}: ${minutosHora} - ${horarioBase} = ${diferencia} minutos`);
  
  if (diferencia > tolerancia) {
    console.log(`  → TARDE (${diferencia} > ${tolerancia}) 🔴`);
  } else if (diferencia < -tolerancia) {
    console.log(`  → TEMPRANO (${diferencia} < -${tolerancia}) 🔵`);
  } else {
    console.log(`  → PUNTUAL (${diferencia} dentro de ±${tolerancia}) ✅`);
  }
});

console.log('\n=== FIN DE PRUEBAS ===');
