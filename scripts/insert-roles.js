const { getPool } = require('../config/db');

async function insertRoles() {
  const pool = await getPool();
  try {
    // Insertar roles básicos
    await pool.query(`
      INSERT IGNORE INTO roles (id, nombre) VALUES 
      (1, 'Administrador'),
      (2, 'Supervisor'),
      (3, 'Empleado')
    `);
    
    console.log('Roles insertados correctamente');
    
    // Mostrar los roles
    const [roles] = await pool.query('SELECT * FROM roles');
    console.log('Roles disponibles:', roles);
    
  } catch (err) {
    console.error('Error insertando roles:', err);
  } finally {
    await pool.end();
  }
}

insertRoles();
