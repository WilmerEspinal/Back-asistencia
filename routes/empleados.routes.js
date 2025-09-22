const express = require('express');
const router = express.Router();
const { getAllEmpleados, getEmpleadoById, getEmpleadosActivos, getUsuariosIds } = require('../controllers/empleados.controller');
const { authRequired, requireRole } = require('../middlewares/auth');

// Aplicar autenticación y autorización a todas las rutas de empleados
router.use(authRequired);
router.use(requireRole([2])); // Solo rol 2 (Supervisor)

// GET /api/empleados - Obtener todos los empleados (Solo rol 2 - Supervisor)
router.get('/', getAllEmpleados);

// GET /api/empleados/activos - Obtener solo empleados activos (Solo rol 2 - Supervisor)
router.get('/activos', getEmpleadosActivos);

// GET /api/empleados/usuarios-ids - Obtener solo IDs de usuarios (Solo rol 2 - Supervisor)
router.get('/usuarios-ids', getUsuariosIds);

// GET /api/empleados/:id - Obtener empleado por ID (Solo rol 2 - Supervisor)
router.get('/:id', getEmpleadoById);

module.exports = router;
