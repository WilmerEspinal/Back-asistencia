const { getPool } = require('../config/db');
const ExcelJS = require('exceljs');

// Marcar asistencia (entrada, salida almuerzo, entrada almuerzo, salida)
async function marcar(req, res) {
  const { tipo } = req.body; // entrada | salida_almuerzo | entrada_almuerzo | salida
  const userId = req.user.userId;
  
  if (!['entrada','salida_almuerzo','entrada_almuerzo','salida'].includes(tipo)) {
    return res.status(400).json({ 
      success: false,
      message: 'Tipo inválido. Debe ser: entrada, salida_almuerzo, entrada_almuerzo o salida' 
    });
  }

  const pool = await getPool();
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    
    const ahora = getPeruDateTime();
    const fechaHoy = getPeruDate();
    
    // Verificar si ya existe un registro para hoy
    const [rows] = await conn.query(
      'SELECT * FROM asistencias WHERE usuario_id = ? AND fecha = ?', 
      [userId, fechaHoy]
    );
    
    if (rows.length === 0) {
      // Crear nuevo registro de asistencia
      const campos = { 
        hora_entrada: null, 
        hora_salida_almuerzo: null, 
        hora_entrada_almuerzo: null, 
        hora_salida: null 
      };
      
      const field = getFieldName(tipo);
      campos[field] = ahora;
      
      await conn.query(
        'INSERT INTO asistencias (usuario_id, fecha, hora_entrada, hora_salida_almuerzo, hora_entrada_almuerzo, hora_salida) VALUES (?,?,?,?,?,?)', 
        [userId, fechaHoy, campos.hora_entrada, campos.hora_salida_almuerzo, campos.hora_entrada_almuerzo, campos.hora_salida]
      );
    } else {
      // Actualizar registro existente
      const asistencia = rows[0];
      const field = getFieldName(tipo);
      
      // Validar que no se esté marcando algo que ya fue marcado
      if (asistencia[field]) {
        await conn.rollback();
        return res.status(400).json({ 
          success: false,
          message: `Ya has marcado ${tipo} hoy a las ${formatTimeForExcel(asistencia[field])}` 
        });
      }
      
      // Validar secuencia lógica
      const validationError = validateSequence(tipo, asistencia);
      if (validationError) {
        await conn.rollback();
        return res.status(400).json({ 
          success: false,
          message: validationError 
        });
      }
      
      await conn.query(
        `UPDATE asistencias SET ${field} = NOW(), updated_at = NOW() WHERE id = ?`, 
        [asistencia.id]
      );
    }
    
    // Obtener el registro actualizado para devolver en la respuesta
    const [updatedRows] = await conn.query(
      'SELECT * FROM asistencias WHERE usuario_id = ? AND fecha = ?', 
      [userId, fechaHoy]
    );
    
    await conn.commit();
    
    return res.json({ 
      success: true,
      message: `${tipo.replace('_', ' ')} marcada correctamente`,
      data: {
        tipo,
        hora: formatTimeForExcel(ahora),
        asistencia: updatedRows[0]
      }
    });
    
  } catch (err) {
    await conn.rollback();
    console.error('Error al marcar asistencia:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error al marcar asistencia',
      error: err.message 
    });
  } finally {
    conn.release();
  }
}

// Obtener asistencia del día actual
async function obtenerAsistenciaHoy(req, res) {
  const userId = req.user.userId;
  const pool = await getPool();
  const fechaHoy = getPeruDate();
  
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.*,
        u.codigo_empleado,
        p.nombre,
        p.apellido
      FROM asistencias a
      JOIN usuarios u ON u.id = a.usuario_id
      JOIN personas p ON p.id = u.persona_id
      WHERE a.usuario_id = ? AND a.fecha = ?
    `, [userId, fechaHoy]);
    
    if (rows.length === 0) {
      return res.json({
        success: true,
        message: 'No hay registro de asistencia para hoy',
        data: null
      });
    }
    
    const asistencia = rows[0];
    const estado = calcularEstadoAsistencia(asistencia);
    
    // Formatear las horas directamente en los campos originales
    const asistenciaFormateada = {
      ...asistencia,
      hora_entrada: asistencia.hora_entrada ? formatTimeForExcel(asistencia.hora_entrada) : null,
      hora_salida_almuerzo: asistencia.hora_salida_almuerzo ? formatTimeForExcel(asistencia.hora_salida_almuerzo) : null,
      hora_entrada_almuerzo: asistencia.hora_entrada_almuerzo ? formatTimeForExcel(asistencia.hora_entrada_almuerzo) : null,
      hora_salida: asistencia.hora_salida ? formatTimeForExcel(asistencia.hora_salida) : null
    };
    
    return res.json({
      success: true,
      data: {
        ...asistenciaFormateada,
        estado,
        proxima_accion: getProximaAccion(asistencia)
      }
    });
    
  } catch (err) {
    console.error('Error al obtener asistencia:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener asistencia',
      error: err.message 
    });
  }
}

// Obtener historial de asistencias
async function obtenerHistorial(req, res) {
  const userId = req.user.userId;
  const { fecha_inicio, fecha_fin, page = 1, limit = 10 } = req.query;
  
  const pool = await getPool();
  
  try {
    let whereClause = 'WHERE a.usuario_id = ?';
    let params = [userId];
    
    if (fecha_inicio && fecha_fin) {
      whereClause += ' AND a.fecha BETWEEN ? AND ?';
      params.push(fecha_inicio, fecha_fin);
    } else if (fecha_inicio) {
      whereClause += ' AND a.fecha >= ?';
      params.push(fecha_inicio);
    } else if (fecha_fin) {
      whereClause += ' AND a.fecha <= ?';
      params.push(fecha_fin);
    }
    
    const offset = (page - 1) * limit;
    
    const [rows] = await pool.query(`
      SELECT 
        a.*,
        u.codigo_empleado,
        p.nombre,
        p.apellido
      FROM asistencias a
      JOIN usuarios u ON u.id = a.usuario_id
      JOIN personas p ON p.id = u.persona_id
      ${whereClause}
      ORDER BY a.fecha DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // Contar total de registros
    const [countRows] = await pool.query(`
      SELECT COUNT(*) as total
      FROM asistencias a
      ${whereClause}
    `, params);
    
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);
    
    // Calcular estado y formatear horas directamente en los campos originales
    const asistenciasConEstado = rows.map(asistencia => ({
      ...asistencia,
      hora_entrada: asistencia.hora_entrada ? formatTimeForExcel(asistencia.hora_entrada) : null,
      hora_salida_almuerzo: asistencia.hora_salida_almuerzo ? formatTimeForExcel(asistencia.hora_salida_almuerzo) : null,
      hora_entrada_almuerzo: asistencia.hora_entrada_almuerzo ? formatTimeForExcel(asistencia.hora_entrada_almuerzo) : null,
      hora_salida: asistencia.hora_salida ? formatTimeForExcel(asistencia.hora_salida) : null,
      estado: calcularEstadoAsistencia(asistencia)
    }));
    
    return res.json({
      success: true,
      data: asistenciasConEstado,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
    
  } catch (err) {
    console.error('Error al obtener historial:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener historial',
      error: err.message 
    });
  }
}

// Funciones auxiliares
function getFieldName(tipo) {
  const fieldMap = {
    'entrada': 'hora_entrada',
    'salida_almuerzo': 'hora_salida_almuerzo',
    'entrada_almuerzo': 'hora_entrada_almuerzo',
    'salida': 'hora_salida'
  };
  return fieldMap[tipo];
}

function validateSequence(tipo, asistencia) {
  switch (tipo) {
    case 'entrada':
      return null; // Siempre se puede marcar entrada
    case 'salida_almuerzo':
      if (!asistencia.hora_entrada) {
        return 'Debes marcar entrada antes de salir a almorzar';
      }
      return null;
    case 'entrada_almuerzo':
      if (!asistencia.hora_salida_almuerzo) {
        return 'Debes marcar salida a almuerzo antes de regresar';
      }
      return null;
    case 'salida':
      if (!asistencia.hora_entrada) {
        return 'Debes marcar entrada antes de salir';
      }
      return null;
    default:
      return 'Tipo de marcado inválido';
  }
}

function calcularEstadoAsistencia(asistencia) {
  const estados = [];
  
  if (asistencia.hora_entrada) estados.push('entrada');
  if (asistencia.hora_salida_almuerzo) estados.push('salida_almuerzo');
  if (asistencia.hora_entrada_almuerzo) estados.push('entrada_almuerzo');
  if (asistencia.hora_salida) estados.push('salida');
  
  return {
    completado: estados,
    pendiente: ['entrada', 'salida_almuerzo', 'entrada_almuerzo', 'salida'].filter(
      estado => !estados.includes(estado)
    )
  };
}

function getProximaAccion(asistencia) {
  if (!asistencia.hora_entrada) return 'entrada';
  if (!asistencia.hora_salida_almuerzo) return 'salida_almuerzo';
  if (!asistencia.hora_entrada_almuerzo) return 'entrada_almuerzo';
  if (!asistencia.hora_salida) return 'salida';
  return 'completado';
}

// Obtener fecha actual en zona horaria de Perú
function getPeruDate() {
  const now = new Date();
  const peruTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Lima"}));
  return peruTime.toISOString().slice(0, 10);
}

// Obtener fecha y hora actual en zona horaria de Perú
function getPeruDateTime() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", {timeZone: "America/Lima"}));
}

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

// Obtener todas las asistencias con paginación y validación de horarios
async function obtenerTodasAsistencias(req, res) {
  const { 
    page = 1, 
    limit = 10, 
    fecha, 
    fecha_inicio, 
    fecha_fin, 
    mes, 
    año, 
    codigo_empleado, 
    all 
  } = req.query;
  const pool = await getPool();
  
  try {
    let whereConditions = [];
    let params = [];
    
    // PRIORIDAD 1: Fecha específica
    if (fecha) {
      whereConditions.push('a.fecha = ?');
      params.push(fecha);
    }
    // PRIORIDAD 2: Rango de fechas
    else if (fecha_inicio && fecha_fin) {
      whereConditions.push('a.fecha BETWEEN ? AND ?');
      params.push(fecha_inicio, fecha_fin);
    } else if (fecha_inicio) {
      whereConditions.push('a.fecha >= ?');
      params.push(fecha_inicio);
    } else if (fecha_fin) {
      whereConditions.push('a.fecha <= ?');
      params.push(fecha_fin);
    }
    // PRIORIDAD 3: Filtros por mes y año
    else {
      if (año) {
        whereConditions.push('YEAR(a.fecha) = ?');
        params.push(parseInt(año));
      }
      
      if (mes) {
        whereConditions.push('MONTH(a.fecha) = ?');
        params.push(parseInt(mes));
      }
    }
    
    // Filtrar por código de empleado (se aplica siempre si está presente)
    if (codigo_empleado) {
      whereConditions.push('u.codigo_empleado = ?');
      params.push(codigo_empleado);
    }
    
    // Construir cláusula WHERE
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    // Determinar si usar paginación o no
    const usarPaginacion = !all || all.toLowerCase() !== 'true';
    let limitClause = '';
    let queryParams = [...params];
    
    if (usarPaginacion) {
      const offset = (page - 1) * limit;
      limitClause = 'LIMIT ? OFFSET ?';
      queryParams.push(parseInt(limit), offset);
    }
    
    // Consulta principal con JOIN a configuración de horarios
    const [rows] = await pool.query(`
      SELECT 
        a.*,
        u.codigo_empleado,
        CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
        ch.hora_entrada as horario_entrada,
        ch.hora_salida_almuerzo as horario_salida_almuerzo,
        ch.hora_entrada_almuerzo as horario_entrada_almuerzo,
        ch.hora_salida as horario_salida,
        ch.tolerancia_minutos
      FROM asistencias a
      JOIN usuarios u ON u.id = a.usuario_id
      JOIN personas p ON p.id = u.persona_id
      LEFT JOIN configuracion_horarios ch ON ch.id = 1
      ${whereClause}
      ORDER BY a.fecha DESC, a.created_at DESC
      ${limitClause}
    `, queryParams);
    
    // Contar total de registros
    const [countRows] = await pool.query(`
      SELECT COUNT(*) as total
      FROM asistencias a
      ${whereClause}
    `, params);
    
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);
    
    // Procesar cada asistencia con validación de horarios
    const asistenciasConValidacion = rows.map(asistencia => {
      const validaciones = validarHorarios(asistencia);
      
      return {
        id: asistencia.id,
        usuario_id: asistencia.usuario_id,
        codigo_empleado: asistencia.codigo_empleado,
        nombre_completo: asistencia.nombre_completo,
        fecha: asistencia.fecha,
        hora_entrada: asistencia.hora_entrada ? formatTimeForExcel(asistencia.hora_entrada) : null,
        hora_salida_almuerzo: asistencia.hora_salida_almuerzo ? formatTimeForExcel(asistencia.hora_salida_almuerzo) : null,
        hora_entrada_almuerzo: asistencia.hora_entrada_almuerzo ? formatTimeForExcel(asistencia.hora_entrada_almuerzo) : null,
        hora_salida: asistencia.hora_salida ? formatTimeForExcel(asistencia.hora_salida) : null,
        estado: calcularEstadoAsistencia(asistencia),
        validaciones,
        created_at: asistencia.created_at,
        updated_at: asistencia.updated_at
      };
    });
    
    // Construir información de filtros aplicados
    const filtrosAplicados = {};
    if (fecha) filtrosAplicados.fecha = fecha;
    if (fecha_inicio) filtrosAplicados.fecha_inicio = fecha_inicio;
    if (fecha_fin) filtrosAplicados.fecha_fin = fecha_fin;
    if (año) filtrosAplicados.año = parseInt(año);
    if (mes) filtrosAplicados.mes = parseInt(mes);
    if (codigo_empleado) filtrosAplicados.codigo_empleado = codigo_empleado;
    
    // Generar mensaje descriptivo
    let mensaje = 'Todas las asistencias';
    if (fecha) {
      mensaje = `Asistencias del día ${fecha}`;
    } else if (fecha_inicio && fecha_fin) {
      mensaje = `Asistencias del ${fecha_inicio} al ${fecha_fin}`;
    } else if (fecha_inicio) {
      mensaje = `Asistencias desde ${fecha_inicio}`;
    } else if (fecha_fin) {
      mensaje = `Asistencias hasta ${fecha_fin}`;
    } else if (año && mes) {
      const nombreMes = new Date(año, mes - 1, 1).toLocaleDateString('es-PE', { month: 'long' });
      mensaje = `Asistencias de ${nombreMes} ${año}`;
    } else if (año) {
      mensaje = `Asistencias del año ${año}`;
    } else if (mes) {
      const nombreMes = new Date(2024, mes - 1, 1).toLocaleDateString('es-PE', { month: 'long' });
      mensaje = `Asistencias del mes de ${nombreMes}`;
    }
    
    if (codigo_empleado) {
      mensaje += ` - Empleado: ${codigo_empleado}`;
    }
    
    // Preparar respuesta
    const response = {
      success: true,
      message: mensaje,
      filtros: filtrosAplicados,
      data: asistenciasConValidacion,
      total: total
    };
    
    // Solo agregar paginación si se está usando
    if (usarPaginacion) {
      response.pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      };
    } else {
      response.message += ` (${total} registros sin paginación)`;
    }
    
    return res.json(response);
    
  } catch (err) {
    console.error('Error al obtener todas las asistencias:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener asistencias',
      error: err.message 
    });
  }
}

// Función para validar horarios y generar mensajes
function validarHorarios(asistencia) {
  const validaciones = {
    entrada: { estado: 'normal', mensaje: '', color: 'green' },
    salida_almuerzo: { estado: 'normal', mensaje: '', color: 'green' },
    entrada_almuerzo: { estado: 'normal', mensaje: '', color: 'green' },
    salida: { estado: 'normal', mensaje: '', color: 'green' }
  };
  
  const tolerancia = asistencia.tolerancia_minutos || 0;
  
  // Función auxiliar para convertir hora a minutos desde medianoche
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
  
  // Validar entrada
  if (asistencia.hora_entrada && asistencia.horario_entrada) {
    const minutosEntrada = horaAMinutos(asistencia.hora_entrada);
    const minutosHorarioEntrada = horaAMinutos(asistencia.horario_entrada);
    
    if (minutosEntrada !== null && minutosHorarioEntrada !== null) {
      const diferencia = minutosEntrada - minutosHorarioEntrada;
      
      if (diferencia > tolerancia) {
        validaciones.entrada = {
          estado: 'tarde',
          mensaje: `Llegó ${diferencia} minutos tarde`,
          color: 'red'
        };
      } else if (diferencia < -tolerancia) {
        validaciones.entrada = {
          estado: 'temprano',
          mensaje: `Llegó ${Math.abs(diferencia)} minutos temprano`,
          color: 'blue'
        };
      } else {
        validaciones.entrada = {
          estado: 'puntual',
          mensaje: 'Puntual',
          color: 'green'
        };
      }
    }
  }
  
  // Validar salida a almuerzo
  if (asistencia.hora_salida_almuerzo && asistencia.horario_salida_almuerzo) {
    const minutosSalida = horaAMinutos(asistencia.hora_salida_almuerzo);
    const minutosHorarioSalida = horaAMinutos(asistencia.horario_salida_almuerzo);
    
    if (minutosSalida !== null && minutosHorarioSalida !== null) {
      const diferencia = minutosSalida - minutosHorarioSalida;
      
      if (diferencia > tolerancia) {
        validaciones.salida_almuerzo = {
          estado: 'tarde',
          mensaje: `Salió ${diferencia} minutos tarde a almorzar`,
          color: 'orange'
        };
      } else if (diferencia < -tolerancia) {
        validaciones.salida_almuerzo = {
          estado: 'temprano',
          mensaje: `Salió ${Math.abs(diferencia)} minutos temprano a almorzar`,
          color: 'blue'
        };
      }
    }
  }
  
  // Validar entrada de almuerzo
  if (asistencia.hora_entrada_almuerzo && asistencia.horario_entrada_almuerzo) {
    const minutosEntrada = horaAMinutos(asistencia.hora_entrada_almuerzo);
    const minutosHorarioEntrada = horaAMinutos(asistencia.horario_entrada_almuerzo);
    
    // Guardar valores para debug
    validaciones.entrada_almuerzo.minutosEntrada = minutosEntrada;
    validaciones.entrada_almuerzo.minutosHorario = minutosHorarioEntrada;
    
    if (minutosEntrada !== null && minutosHorarioEntrada !== null) {
      const diferencia = minutosEntrada - minutosHorarioEntrada;
      validaciones.entrada_almuerzo.diferencia = diferencia;
      
      if (diferencia > tolerancia) {
        validaciones.entrada_almuerzo = {
          ...validaciones.entrada_almuerzo,
          estado: 'tarde',
          mensaje: `Regresó ${diferencia} minutos tarde del almuerzo`,
          color: 'red'
        };
      } else if (diferencia < -tolerancia) {
        validaciones.entrada_almuerzo = {
          ...validaciones.entrada_almuerzo,
          estado: 'temprano',
          mensaje: `Regresó ${Math.abs(diferencia)} minutos temprano del almuerzo`,
          color: 'blue'
        };
      } else {
        validaciones.entrada_almuerzo = {
          ...validaciones.entrada_almuerzo,
          estado: 'puntual',
          mensaje: 'Puntual',
          color: 'green'
        };
      }
    }
  }
  
  // Validar salida
  if (asistencia.hora_salida && asistencia.horario_salida) {
    const minutosSalida = horaAMinutos(asistencia.hora_salida);
    const minutosHorarioSalida = horaAMinutos(asistencia.horario_salida);
    
    if (minutosSalida !== null && minutosHorarioSalida !== null) {
      const diferencia = minutosSalida - minutosHorarioSalida;
      
      if (diferencia < -tolerancia) {
        validaciones.salida = {
          estado: 'temprano',
          mensaje: `Salió ${Math.abs(diferencia)} minutos antes de la hora`,
          color: 'orange'
        };
      } else if (diferencia > tolerancia) {
        validaciones.salida = {
          estado: 'tarde',
          mensaje: `Salió ${diferencia} minutos después de la hora`,
          color: 'blue'
        };
      }
    }
  }
  
  return validaciones;
}


// Exportar asistencias a Excel
async function exportarAsistenciasExcel(req, res) {
  const { fecha_inicio, fecha_fin, codigo_empleado, mes, año, fecha } = req.query;
  const pool = await getPool();
  
  try {
    let whereConditions = [];
    let params = [];
    
    // PRIORIDAD 1: Si se especifica una fecha exacta, usar solo esa fecha
    if (fecha) {
      whereConditions.push('a.fecha = ?');
      params.push(fecha);
    }
    // PRIORIDAD 2: Si no hay fecha exacta, usar rango de fechas
    else if (fecha_inicio && fecha_fin) {
      whereConditions.push('a.fecha BETWEEN ? AND ?');
      params.push(fecha_inicio, fecha_fin);
    } else if (fecha_inicio) {
      whereConditions.push('a.fecha >= ?');
      params.push(fecha_inicio);
    } else if (fecha_fin) {
      whereConditions.push('a.fecha <= ?');
      params.push(fecha_fin);
    }
    // PRIORIDAD 3: Si no hay fechas específicas, usar mes y año
    else if (mes && año) {
      whereConditions.push('MONTH(a.fecha) = ? AND YEAR(a.fecha) = ?');
      params.push(parseInt(mes), parseInt(año));
    } else if (año) {
      whereConditions.push('YEAR(a.fecha) = ?');
      params.push(parseInt(año));
    }
    
    // Filtrar por código de empleado (SIEMPRE se aplica si está presente)
    if (codigo_empleado) {
      whereConditions.push('u.codigo_empleado = ?');
      params.push(codigo_empleado);
    }
    
    // Construir cláusula WHERE
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    // Si no hay filtros, no exportar nada (evitar exportar toda la base de datos)
    if (whereConditions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar al menos un filtro para la exportación (fecha, codigo_empleado, mes, o año)'
      });
    }
    
    // Consulta para obtener todas las asistencias con información del empleado
    const [rows] = await pool.query(`
      SELECT 
        a.*,
        u.codigo_empleado,
        CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
        UPPER(LEFT(p.nombre, 1)) as inicial_nombre,
        UPPER(LEFT(p.apellido, 1)) as inicial_apellido,
        ch.hora_entrada as horario_entrada,
        ch.hora_salida_almuerzo as horario_salida_almuerzo,
        ch.hora_entrada_almuerzo as horario_entrada_almuerzo,
        ch.hora_salida as horario_salida,
        ch.tolerancia_minutos
      FROM asistencias a
      JOIN usuarios u ON u.id = a.usuario_id
      JOIN personas p ON p.id = u.persona_id
      LEFT JOIN configuracion_horarios ch ON ch.id = 1
      ${whereClause}
      ORDER BY a.fecha DESC, p.apellido, p.nombre
    `, params);
    
    // Crear workbook y worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Asistencias');
    
    // Determinar el mes para el título
    let mesTexto = '';
    if (fecha) {
      const fechaObj = new Date(fecha);
      mesTexto = fechaObj.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
    } else if (mes && año) {
      const fechaObj = new Date(año, mes - 1, 1);
      mesTexto = fechaObj.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
    } else if (año) {
      mesTexto = `Año ${año}`;
    } else if (fecha_inicio && fecha_fin) {
      mesTexto = `${fecha_inicio} al ${fecha_fin}`;
    } else {
      mesTexto = 'Reporte de Asistencias';
    }
    
    // Agregar título con el mes/período (solo hasta columna H)
    worksheet.mergeCells(1, 1, 1, 8); // Fila 1, desde columna 1 hasta columna 8 (H)
    worksheet.getCell('A1').value = `REPORTE DE ASISTENCIAS - ${mesTexto.toUpperCase()}`;
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    };
    
    // Definir columnas (ahora en la fila 2) - SIN columna Estado
    const headerRow = worksheet.addRow([
      'Empleado', 'Nombre Completo', 'Código', 'Fecha', 
      'Entrada', 'Salida Alm', 'Entrada Alm', 'Salida'
    ]);
    
    // Configurar anchos de columna (solo hasta H)
    worksheet.columns = [
      { width: 12 }, { width: 35 }, { width: 12 }, { width: 12 },
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }
    ];
    
    // Estilizar encabezados (fila 3)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    
    // Procesar y agregar datos
    rows.forEach(asistencia => {
      const validaciones = validarHorarios(asistencia);
      const iniciales = `${asistencia.inicial_nombre}${asistencia.inicial_apellido}`;
      
      // Debug: Mostrar información de validación
      console.log(`\n=== VALIDANDO: ${iniciales} ===`);
      console.log(`Hora entrada RAW: ${asistencia.hora_entrada} (tipo: ${typeof asistencia.hora_entrada})`);
      console.log(`Hora entrada almuerzo RAW: ${asistencia.hora_entrada_almuerzo} (tipo: ${typeof asistencia.hora_entrada_almuerzo})`);
      console.log(`Horario entrada: ${asistencia.horario_entrada}`);
      console.log(`Horario entrada almuerzo: ${asistencia.horario_entrada_almuerzo}`);
      console.log(`Tolerancia: ${asistencia.tolerancia_minutos}`);
      
      // Debug de conversión de horas
      if (asistencia.hora_entrada_almuerzo) {
        const minutosEntradaAlm = validaciones.entrada_almuerzo.minutosEntrada || 'NO_CALCULADO';
        const minutosHorarioEntradaAlm = validaciones.entrada_almuerzo.minutosHorario || 'NO_CALCULADO';
        const diferencia = validaciones.entrada_almuerzo.diferencia || 'NO_CALCULADO';
        console.log(`🕐 Entrada Almuerzo: ${asistencia.hora_entrada_almuerzo} → ${minutosEntradaAlm} minutos`);
        console.log(`🕐 Horario Almuerzo: ${asistencia.horario_entrada_almuerzo} → ${minutosHorarioEntradaAlm} minutos`);
        console.log(`📊 Diferencia: ${diferencia} minutos`);
      }
      
      console.log(`Validación entrada:`, validaciones.entrada);
      console.log(`Validación entrada almuerzo:`, validaciones.entrada_almuerzo);
      
      // Formatear fecha
      const fechaFormateada = new Date(asistencia.fecha).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Agregar fila de datos (SIN columna Estado)
      const dataRow = worksheet.addRow([
        iniciales,
        asistencia.nombre_completo,
        asistencia.codigo_empleado,
        fechaFormateada,
        asistencia.hora_entrada ? formatTimeForExcel(asistencia.hora_entrada) : '---',
        asistencia.hora_salida_almuerzo ? formatTimeForExcel(asistencia.hora_salida_almuerzo) : '---',
        asistencia.hora_entrada_almuerzo ? formatTimeForExcel(asistencia.hora_entrada_almuerzo) : '---',
        asistencia.hora_salida ? formatTimeForExcel(asistencia.hora_salida) : '---'
      ]);
      
      // Aplicar colores según validaciones - SOLO A LAS HORAS TARDÍAS
      const rowNumber = dataRow.number;
      
      // Colorear SOLO la hora de ENTRADA si está tarde (columna E, índice 5)
      if (asistencia.hora_entrada && validaciones.entrada.estado === 'tarde') {
        worksheet.getCell(rowNumber, 5).font = { color: { argb: 'FFFF0000' }, bold: true }; // Texto rojo
        console.log(`🔴 COLOREANDO ENTRADA EN ROJO: ${iniciales} - ${asistencia.hora_entrada}`);
      }
      
      // Colorear SOLO la hora de ENTRADA ALMUERZO si está tarde (columna G, índice 7)
      if (asistencia.hora_entrada_almuerzo && validaciones.entrada_almuerzo.estado === 'tarde') {
        worksheet.getCell(rowNumber, 7).font = { color: { argb: 'FFFF0000' }, bold: true }; // Texto rojo
        console.log(`🔴 COLOREANDO ENTRADA ALMUERZO EN ROJO: ${iniciales} - ${asistencia.hora_entrada_almuerzo}`);
      }
    });
    
    // Aplicar bordes a todas las celdas de datos (solo hasta columna H)
    const totalRows = worksheet.rowCount;
    for (let rowNum = 1; rowNum <= totalRows; rowNum++) {
      for (let colNum = 1; colNum <= 8; colNum++) { // Solo columnas 1-8 (A-H)
        const cell = worksheet.getCell(rowNum, colNum);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    }
    
    // Generar nombre del archivo dinámico basado en filtros
    const fechaActual = new Date().toISOString().slice(0, 10);
    let nombreArchivo = 'asistencias';
    
    if (codigo_empleado) {
      nombreArchivo += `_${codigo_empleado}`;
    }
    
    if (año) {
      nombreArchivo += `_${año}`;
      if (mes) {
        const mesFormateado = mes.toString().padStart(2, '0');
        nombreArchivo += `-${mesFormateado}`;
      }
    } else if (fecha_inicio || fecha_fin) {
      nombreArchivo += `_${fecha_inicio || fechaActual}_${fecha_fin || fechaActual}`;
    } else {
      nombreArchivo += `_${fechaActual}`;
    }
    
    nombreArchivo += '.xlsx';
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    
    // Escribir el archivo a la respuesta
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (err) {
    console.error('Error al exportar asistencias:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error al exportar asistencias',
      error: err.message 
    });
  }
}

// Función auxiliar para formatear tiempo para Excel (formato 24 horas, sin segundos)
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

module.exports = { 
  marcar, 
  obtenerAsistenciaHoy, 
  obtenerHistorial,
  obtenerTodasAsistencias,
  exportarAsistenciasExcel
};