const axios = require('axios');

async function testTodasAsistencias() {
  try {
    console.log('🔐 Haciendo login...');
    
    // Hacer login (ajusta las credenciales según tu usuario)
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      codigo_empleado: 'PLA004', // Cambiar por tu código
      password: 'tu_password' // Cambiar por tu contraseña
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso\n');
    
    // Probar el nuevo endpoint
    console.log('📋 Probando endpoint /api/asistencias/todas...');
    
    const response = await axios.get('http://localhost:3000/api/asistencias/todas?page=1&limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Respuesta del endpoint:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verificar estructura de respuesta
    const data = response.data;
    if (data.success && data.data && data.pagination) {
      console.log('\n✅ Estructura de respuesta correcta');
      console.log(`📄 Total de registros: ${data.pagination.total}`);
      console.log(`📑 Página actual: ${data.pagination.page}`);
      console.log(`📋 Registros por página: ${data.pagination.limit}`);
      
      if (data.data.length > 0) {
        const primerRegistro = data.data[0];
        console.log('\n🔍 Primer registro:');
        console.log(`👤 Empleado: ${primerRegistro.nombre_completo} (${primerRegistro.codigo_empleado})`);
        console.log(`📅 Fecha: ${primerRegistro.fecha}`);
        console.log(`🕐 Entrada: ${primerRegistro.hora_entrada || 'No marcada'}`);
        
        if (primerRegistro.validaciones) {
          console.log('\n🎯 Validaciones:');
          Object.entries(primerRegistro.validaciones).forEach(([tipo, validacion]) => {
            if (validacion.mensaje) {
              console.log(`  ${tipo}: ${validacion.mensaje} (${validacion.color})`);
            }
          });
        }
      }
    } else {
      console.log('❌ Estructura de respuesta incorrecta');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Ejecutar la prueba
testTodasAsistencias();
