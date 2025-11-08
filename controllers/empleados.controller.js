const { getPool } = require('../config/db');

async function getAllEmpleados(req, res) {
  const pool = await getPool();
  try {
    // Consulta que obtiene todos los datos de empleados con información completa
    const [rows] = await pool.query(`
      SELECT 
        u.id as usuario_id,
        u.codigo_empleado,
        u.username,
        u.fecha_ingreso,
        u.activo,
        u.rol_id,
        u.created_at as usuario_created_at,
        u.updated_at as usuario_updated_at,
        p.id as persona_id,
        p.dni,
        p.nombre,
        p.apellido,
        p.email,
        p.telefono,
        p.fecha_nacimiento,
        p.created_at as persona_created_at,
        p.updated_at as persona_updated_at,
        r.nombre as rol_nombre
      FROM usuarios u 
      JOIN personas p ON p.id = u.persona_id 
      LEFT JOIN roles r ON r.id = u.rol_id
      ORDER BY u.codigo_empleado ASC
    `);
    
    return res.json({
      success: true,
      total: rows.length,
      empleados: rows
    });
    
  } catch (err) {
    console.error('Error obteniendo empleados:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error obteniendo datos de empleados', 
      error: err.message 
    });
  }
}

async function getEmpleadoById(req, res) {
  const { id } = req.params;
  const pool = await getPool();
  
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id as usuario_id,
        u.codigo_empleado,
        u.username,
        u.fecha_ingreso,
        u.activo,
        u.rol_id,
        u.created_at as usuario_created_at,
        u.updated_at as usuario_updated_at,
        p.id as persona_id,
        p.dni,
        p.nombre,
        p.apellido,
        p.email,
        p.telefono,
        p.fecha_nacimiento,
        p.created_at as persona_created_at,
        p.updated_at as persona_updated_at,
        r.nombre as rol_nombre
      FROM usuarios u 
      JOIN personas p ON p.id = u.persona_id 
      LEFT JOIN roles r ON r.id = u.rol_id
      WHERE u.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }
    
    return res.json({
      success: true,
      empleado: rows[0]
    });
    
  } catch (err) {
    console.error('Error obteniendo empleado:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error obteniendo datos del empleado', 
      error: err.message 
    });
  }
}

async function getEmpleadosActivos(req, res) {
  const pool = await getPool();
  try {
    const [rows] = await pool.query(`
      SELECT u.id
      FROM usuarios u 
      WHERE u.activo = 1
      ORDER BY u.id ASC
    `);
    
    return res.json({
      success: true,
      total: rows.length,
      empleados: rows
    });
    
  } catch (err) {
    console.error('Error obteniendo empleados activos:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error obteniendo empleados activos', 
      error: err.message 
    });
  }
}

async function getUsuariosIds(req, res) {
  const pool = await getPool();
  try {
    const [rows] = await pool.query(`
      SELECT id FROM usuarios ORDER BY id ASC
    `);
    
    return res.json({
      success: true,
      total: rows.length,
      usuarios: rows
    });
    
  } catch (err) {
    console.error('Error obteniendo IDs de usuarios:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error obteniendo IDs de usuarios', 
      error: err.message 
    });
  }
}

module.exports = { 
  getAllEmpleados, 
  getEmpleadoById, 
  getEmpleadosActivos,
  getUsuariosIds
};
