const bcrypt = require('bcryptjs');
const { getPool } = require('../config/db');
const { signToken } = require('../middlewares/auth');

async function register(req, res) {
  console.log('Body completo:', req.body);
  const { dni, nombre, apellido, email, telefono, fecha_nacimiento, codigo_empleado, username, password, fecha_ingreso, rol_id, rolId } = req.body;
  
  // Usar rol_id o rolId (por si viene con diferente nombre)
  const rolFinal = rol_id || rolId || 1; // Por defecto rol 1 (Empleado)
  console.log('Rol asignado:', rolFinal);
  
  if (!dni || !nombre || !apellido || !email || !codigo_empleado || !username || !password || !fecha_ingreso) {
    return res.status(400).json({ message: 'Campos requeridos faltantes (DNI, nombre, apellido, email, codigo_empleado, username, password, fecha_ingreso)' });
  }

  // Validar formato del DNI
  if (!/^\d{8}$/.test(dni)) {
    return res.status(400).json({ message: 'El DNI debe tener exactamente 8 dígitos numéricos' });
  }
  
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    const [p] = await conn.query('INSERT INTO personas (dni, nombre, apellido, email, telefono, fecha_nacimiento) VALUES (?,?,?,?,?,?)', [
      dni, nombre, apellido, email, telefono || null, fecha_nacimiento || null
    ]);
    const personaId = p.insertId;
    console.log('Persona creada con ID:', personaId);
    
    const passwordHash = await bcrypt.hash(password, 10);
    const [u] = await conn.query('INSERT INTO usuarios (persona_id, codigo_empleado, username, password_hash, fecha_ingreso, activo, rol_id) VALUES (?,?,?,?,?,1,?)', [
      personaId, codigo_empleado, username, passwordHash, fecha_ingreso, rolFinal
    ]);
    const usuarioId = u.insertId;
    console.log('Usuario creado con ID:', usuarioId, 'y rol_id:', rolFinal);
    
    // Consultar el registro completo recién creado
    const [registroCompleto] = await conn.query(`
      SELECT 
        u.id as usuario_id,
        u.codigo_empleado,
        u.username,
        u.fecha_ingreso,
        u.activo,
        u.rol_id,
        p.id as persona_id,
        p.dni,
        p.nombre,
        p.apellido,
        p.email,
        p.telefono,
        p.fecha_nacimiento
      FROM usuarios u 
      JOIN personas p ON p.id = u.persona_id 
      WHERE u.id = ?
    `, [usuarioId]);
    
    await conn.commit();
    
    return res.status(201).json({ 
      message: 'Usuario registrado con rol asignado', 
      usuario: registroCompleto[0] // Devolver el registro completo
    });
    
  } catch (err) {
    await conn.rollback();
    console.error('Error en registro:', err);
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email, username o código ya existe' });
    }
    return res.status(500).json({ message: 'Error registrando usuario', error: err.message });
  } finally {
    conn.release();
  }
}

async function login(req, res) {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Credenciales requeridas' });
  
  const pool = await getPool();
  try {
    // Incluir rol_id en la consulta de login
    const [rows] = await pool.query(`
      SELECT 
        u.id, 
        u.username, 
        u.password_hash, 
        u.codigo_empleado, 
        u.activo, 
        u.rol_id,
        p.nombre, 
        p.apellido 
      FROM usuarios u 
      JOIN personas p ON p.id = u.persona_id 
      WHERE u.username = ? LIMIT 1
    `, [username]);
    
    if (rows.length === 0) return res.status(401).json({ message: 'Usuario o contraseña inválidos' });
    
    const user = rows[0];
    if (!user.activo) return res.status(403).json({ message: 'Usuario inactivo' });
    
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Usuario o contraseña inválidos' });
    
    const token = signToken({ 
      userId: user.id, 
      username: user.username, 
      nombre: user.nombre, 
      apellido: user.apellido,
      rol_id: user.rol_id // Incluir rol_id en el token
    });
    
    return res.json({ 
      token,
      user: {
        id: user.id,
        username: user.username,
        codigo_empleado: user.codigo_empleado,
        nombre: user.nombre,
        apellido: user.apellido,
        rol_id: user.rol_id // También en la respuesta
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error en login' });
  }
}

module.exports = { register, login };