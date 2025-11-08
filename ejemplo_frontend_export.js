// Ejemplo de cómo usar la exportación desde el frontend

// Función para construir la URL de exportación basada en los filtros del frontend
function construirURLExportacion(filtros) {
  const baseURL = '/api/asistencias/exportar-excel';
  const params = new URLSearchParams();
  
  // Si hay una fecha específica seleccionada, usarla (prioridad alta)
  if (filtros.fecha) {
    params.append('fecha', filtros.fecha);
  }
  // Si no hay fecha específica pero hay rango, usar el rango
  else if (filtros.fecha_inicio || filtros.fecha_fin) {
    if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
  }
  
  // Agregar código de empleado si está seleccionado
  if (filtros.codigo_empleado) {
    params.append('codigo_empleado', filtros.codigo_empleado);
  }
  
  // Si no hay fechas específicas, usar mes y año
  if (!filtros.fecha && !filtros.fecha_inicio && !filtros.fecha_fin) {
    if (filtros.mes) params.append('mes', filtros.mes);
    if (filtros.año) params.append('año', filtros.año);
  }
  
  return `${baseURL}?${params.toString()}`;
}

// Ejemplos de uso según tu interfaz:

// Caso 1: Usuario selecciona empleado PLA004 y fecha de ayer (2025-10-07)
const filtros1 = {
  codigo_empleado: 'PLA004',
  fecha: '2025-10-07'
};
console.log('URL para empleado específico en fecha específica:');
console.log(construirURLExportacion(filtros1));
// Resultado: /api/asistencias/exportar-excel?fecha=2025-10-07&codigo_empleado=PLA004

// Caso 2: Usuario selecciona solo empleado PLA004 (sin fecha)
const filtros2 = {
  codigo_empleado: 'PLA004',
  año: 2025  // Necesitas especificar al menos año para evitar exportar toda la historia
};
console.log('URL para empleado específico del año actual:');
console.log(construirURLExportacion(filtros2));
// Resultado: /api/asistencias/exportar-excel?codigo_empleado=PLA004&año=2025

// Caso 3: Usuario selecciona solo fecha de ayer
const filtros3 = {
  fecha: '2025-10-07'
};
console.log('URL para fecha específica (todos los empleados):');
console.log(construirURLExportacion(filtros3));
// Resultado: /api/asistencias/exportar-excel?fecha=2025-10-07

// Caso 4: Usuario selecciona mes y año
const filtros4 = {
  mes: 10,
  año: 2025
};
console.log('URL para mes y año específicos:');
console.log(construirURLExportacion(filtros4));
// Resultado: /api/asistencias/exportar-excel?mes=10&año=2025

// Función para realizar la exportación
async function exportarAsistencias(filtros, token) {
  try {
    const url = construirURLExportacion(filtros);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al exportar');
    }
    
    // Crear blob y descargar archivo
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Obtener nombre del archivo desde el header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : 'asistencias.xlsx';
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    console.log('✅ Exportación completada:', filename);
    
  } catch (error) {
    console.error('❌ Error en exportación:', error.message);
    alert('Error al exportar: ' + error.message);
  }
}

// Ejemplo de uso en tu componente React/Vue/etc:
/*
// En tu función de exportar del frontend:
const handleExportar = () => {
  const filtrosActuales = {
    codigo_empleado: selectedEmpleado,
    fecha: selectedFecha,
    mes: selectedMes,
    año: selectedAño
  };
  
  exportarAsistencias(filtrosActuales, userToken);
};
*/
