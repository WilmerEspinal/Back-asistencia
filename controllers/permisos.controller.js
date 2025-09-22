const { getPool } = require('../config/db');

async function crear(req, res) {
  const userId = req.user.userId;
  const { fecha, motivo } = req.body;
  if (!fecha || !motivo) return res.status(400).json({ message: 'fecha y motivo son requeridos' });
  const pool = await getPool();
  try {
    await pool.query('INSERT INTO permisos (usuario_id, fecha, motivo, created_at) VALUES (?,?,?,NOW())', [userId, fecha, motivo]);
    return res.status(201).json({ message: 'Permiso registrado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error registrando permiso' });
  }
}

module.exports = { crear };


