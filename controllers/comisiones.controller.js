const { getPool } = require('../config/db');

async function crear(req, res) {
  const userId = req.user.userId;
  const { fecha, motivo } = req.body;
  if (!fecha) return res.status(400).json({ message: 'fecha es requerida' });
  const pool = await getPool();
  try {
    const [r] = await pool.query('INSERT INTO comisiones (usuario_id, fecha, motivo, created_at) VALUES (?,?,?,NOW())', [userId, fecha, motivo || null]);
    return res.status(201).json({ id: r.insertId, message: 'Comisión creada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error registrando comisión' });
  }
}

async function marcarSalida(req, res) {
  const id = req.params.id;
  const pool = await getPool();
  try {
    await pool.query('UPDATE comisiones SET hora_salida = NOW() WHERE id = ?', [id]);
    return res.json({ message: 'Salida registrada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error marcando salida' });
  }
}

async function marcarRetorno(req, res) {
  const id = req.params.id;
  const pool = await getPool();
  try {
    await pool.query('UPDATE comisiones SET hora_retorno = NOW() WHERE id = ?', [id]);
    return res.json({ message: 'Retorno registrado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error marcando retorno' });
  }
}

module.exports = { crear, marcarSalida, marcarRetorno };


