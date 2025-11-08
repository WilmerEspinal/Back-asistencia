const axios = require('axios');

// Configuración base
const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// Función para hacer peticiones con manejo de errores
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test de login
async function testLogin() {
  console.log('\n🔐 Probando Login...');
  
  const loginData = {
    username: 'admin', // Cambia por un usuario existente
    password: 'admin123' // Cambia por la contraseña correcta
  };
  
  const result = await makeRequest('POST', '/auth/login', loginData);
  
  if (result.success) {
    authToken = result.data.token;
    console.log('✅ Login exitoso');
    console.log('Usuario:', result.data.user.nombre, result.data.user.apellido);
    console.log('Rol ID:', result.data.user.rol_id);
    return true;
  } else {
    console.log('❌ Error en login:', result.error);
    return false;
  }
}

// Test de marcar entrada
async function testMarcarEntrada() {
  console.log('\n⏰ Probando marcar entrada...');
  
  const result = await makeRequest('POST', '/asistencias/marcar', 
    { tipo: 'entrada' },
    { Authorization: `Bearer ${authToken}` }
  );
  
  if (result.success) {
    console.log('✅ Entrada marcada exitosamente');
    console.log('Hora:', result.data.data.hora);
  } else {
    console.log('❌ Error al marcar entrada:', result.error);
  }
  
  return result.success;
}

// Test de obtener asistencia de hoy
async function testObtenerAsistenciaHoy() {
  console.log('\n📅 Probando obtener asistencia de hoy...');
  
  const result = await makeRequest('GET', '/asistencias/hoy', null,
    { Authorization: `Bearer ${authToken}` }
  );
  
  if (result.success) {
    console.log('✅ Asistencia obtenida exitosamente');
    if (result.data.data) {
      console.log('Estado:', result.data.data.estado);
      console.log('Próxima acción:', result.data.data.proxima_accion);
    } else {
      console.log('No hay asistencia registrada para hoy');
    }
  } else {
    console.log('❌ Error al obtener asistencia:', result.error);
  }
  
  return result.success;
}

// Test de marcar salida almuerzo
async function testMarcarSalidaAlmuerzo() {
  console.log('\n🍽️ Probando marcar salida a almuerzo...');
  
  const result = await makeRequest('POST', '/asistencias/marcar', 
    { tipo: 'salida_almuerzo' },
    { Authorization: `Bearer ${authToken}` }
  );
  
  if (result.success) {
    console.log('✅ Salida a almuerzo marcada exitosamente');
    console.log('Hora:', result.data.data.hora);
  } else {
    console.log('❌ Error al marcar salida a almuerzo:', result.error);
  }
  
  return result.success;
}

// Test de obtener historial
async function testObtenerHistorial() {
  console.log('\n📊 Probando obtener historial...');
  
  const result = await makeRequest('GET', '/asistencias/historial?page=1&limit=5', null,
    { Authorization: `Bearer ${authToken}` }
  );
  
  if (result.success) {
    console.log('✅ Historial obtenido exitosamente');
    console.log('Total de registros:', result.data.pagination.total);
    console.log('Página actual:', result.data.pagination.page);
    console.log('Registros en esta página:', result.data.data.length);
  } else {
    console.log('❌ Error al obtener historial:', result.error);
  }
  
  return result.success;
}

// Test de validación de secuencia
async function testValidacionSecuencia() {
  console.log('\n🔒 Probando validación de secuencia...');
  
  // Intentar marcar entrada almuerzo sin haber marcado salida almuerzo
  const result = await makeRequest('POST', '/asistencias/marcar', 
    { tipo: 'entrada_almuerzo' },
    { Authorization: `Bearer ${authToken}` }
  );
  
  if (!result.success && result.error.message.includes('salida a almuerzo')) {
    console.log('✅ Validación de secuencia funcionando correctamente');
    console.log('Error esperado:', result.error.message);
    return true;
  } else {
    console.log('❌ La validación de secuencia no está funcionando');
    return false;
  }
}

// Test de token inválido
async function testTokenInvalido() {
  console.log('\n🚫 Probando token inválido...');
  
  const result = await makeRequest('GET', '/asistencias/hoy', null,
    { Authorization: 'Bearer token_invalido' }
  );
  
  if (!result.success && result.status === 401) {
    console.log('✅ Validación de token funcionando correctamente');
    return true;
  } else {
    console.log('❌ La validación de token no está funcionando');
    return false;
  }
}

// Función principal
async function runTests() {
  console.log('🚀 Iniciando pruebas del API de Asistencias...');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Marcar Entrada', fn: testMarcarEntrada },
    { name: 'Obtener Asistencia Hoy', fn: testObtenerAsistenciaHoy },
    { name: 'Marcar Salida Almuerzo', fn: testMarcarSalidaAlmuerzo },
    { name: 'Obtener Historial', fn: testObtenerHistorial },
    { name: 'Validación Secuencia', fn: testValidacionSecuencia },
    { name: 'Token Inválido', fn: testTokenInvalido }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Error inesperado en ${test.name}:`, error.message);
      failed++;
    }
    
    // Pausa entre tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Resumen de Pruebas:');
  console.log(`✅ Pasaron: ${passed}`);
  console.log(`❌ Fallaron: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
  } else {
    console.log('\n⚠️ Algunas pruebas fallaron. Revisa la configuración.');
  }
}

// Ejecutar pruebas si se ejecuta directamente
if (require.main === module) {
  runTests().catch(error => {
    console.error('Error ejecutando pruebas:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
