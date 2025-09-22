const { getPool } = require('../config/db');

async function marcar(req, res) {
  const { tipo } = req.body; // entrada | salida_almuerzo | entrada_almuerzo | salida
  const userId = req.user.userId;
  if (!['entrada','salida_almuerzo','entrada_almuerzo','salida'].includes(tipo)) {
    return res.status(400).json({ message: 'Tipo inválido' });
  }
  const pool = await getPool();
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT id FROM asistencias WHERE usuario_id = ? AND fecha = CURDATE()', [userId]);
    if (rows.length === 0) {
      const campos = { hora_entrada: null, hora_salida_almuerzo: null, hora_entrada_almuerzo: null, hora_salida: null };
      const field = tipo === 'entrada' ? 'hora_entrada' : tipo === 'salida_almuerzo' ? 'hora_salida_almuerzo' : tipo === 'entrada_almuerzo' ? 'hora_entrada_almuerzo' : 'hora_salida';
      campos[field] = new Date();
      await conn.query('INSERT INTO asistencias (usuario_id, fecha, hora_entrada, hora_salida_almuerzo, hora_entrada_almuerzo, hora_salida) VALUES (?,?,?,?,?,?)', [
        userId, new Date().toISOString().slice(0,10), campos.hora_entrada, campos.hora_salida_almuerzo, campos.hora_entrada_almuerzo, campos.hora_salida
      ]);
    } else {
      const field = tipo === 'entrada' ? 'hora_entrada' : tipo === 'salida_almuerzo' ? 'hora_salida_almuerzo' : tipo === 'entrada_almuerzo' ? 'hora_entrada_almuerzo' : 'hora_salida';
      await conn.query(`UPDATE asistencias SET ${field} = NOW(), updated_at = NOW() WHERE id = ?`, [rows[0].id]);
    }
    return res.json({ message: 'Marcado ok' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error al marcar asistencia' });
  } finally {
    conn.release();
  }
}

module.exports = { marcar };


