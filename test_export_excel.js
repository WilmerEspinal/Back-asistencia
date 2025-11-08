const axios = require('axios');
const fs = require('fs');

// Configuración
const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// Función para hacer login y obtener token
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      codigo_empleado: 'ADM001', // Cambiar por un usuario supervisor válido
      password: '123456'
    });
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login exitoso');
      return true;
    }
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    return false;
  }
}

// Función para probar la exportación a Excel
async function testExportExcel() {
  try {
    console.log('\n📊 Probando exportación a Excel...');
    
    // Probar sin parámetros (todas las asistencias)
    console.log('1. Exportando todas las asistencias...');
    const response1 = await axios.get(`${BASE_URL}/asistencias/exportar-excel`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      responseType: 'arraybuffer'
    });
    
    // Guardar archivo
    fs.writeFileSync('asistencias_todas.xlsx', response1.data);
    console.log('✅ Archivo guardado: asistencias_todas.xlsx');
    
    // Probar con rango de fechas
    console.log('2. Exportando con rango de fechas...');
    const response2 = await axios.get(`${BASE_URL}/asistencias/exportar-excel`, {
      params: {
        fecha_inicio: '2025-10-07',
        fecha_fin: '2025-10-08'
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      responseType: 'arraybuffer'
    });
    
    // Guardar archivo
    fs.writeFileSync('asistencias_rango.xlsx', response2.data);
    console.log('✅ Archivo guardado: asistencias_rango.xlsx');
    
    // Probar por código de empleado
    console.log('3. Exportando por código de empleado...');
    const response3 = await axios.get(`${BASE_URL}/asistencias/exportar-excel`, {
      params: {
        codigo_empleado: 'PLA004'
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      responseType: 'arraybuffer'
    });
    
    fs.writeFileSync('asistencias_empleado.xlsx', response3.data);
    console.log('✅ Archivo guardado: asistencias_empleado.xlsx');
    
    // Probar por mes y año
    console.log('4. Exportando por mes y año...');
    const response4 = await axios.get(`${BASE_URL}/asistencias/exportar-excel`, {
      params: {
        mes: 10,
        año: 2025
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      responseType: 'arraybuffer'
    });
    
    fs.writeFileSync('asistencias_mes_año.xlsx', response4.data);
    console.log('✅ Archivo guardado: asistencias_mes_año.xlsx');
    
    // Probar combinación de filtros
    console.log('5. Exportando con filtros combinados...');
    const response5 = await axios.get(`${BASE_URL}/asistencias/exportar-excel`, {
      params: {
        codigo_empleado: 'TER003',
        mes: 10,
        año: 2025
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      responseType: 'arraybuffer'
    });
    
    fs.writeFileSync('asistencias_combinado.xlsx', response5.data);
    console.log('✅ Archivo guardado: asistencias_combinado.xlsx');
    
    console.log('\n🎉 Pruebas de exportación completadas exitosamente!');
    console.log('📁 Archivos generados:');
    console.log('   - asistencias_todas.xlsx');
    console.log('   - asistencias_rango.xlsx');
    console.log('   - asistencias_empleado.xlsx');
    console.log('   - asistencias_mes_año.xlsx');
    console.log('   - asistencias_combinado.xlsx');
    
  } catch (error) {
    console.error('❌ Error en exportación:', error.response?.data || error.message);
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando pruebas de exportación a Excel...\n');
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ No se pudo hacer login. Verifica las credenciales.');
    return;
  }
  
  await testExportExcel();
}

// Ejecutar pruebas
main().catch(console.error);
