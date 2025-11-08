const express = require('express');
const router = express.Router();
const { marcar, obtenerAsistenciaHoy, obtenerHistorial, obtenerTodasAsistencias, exportarAsistenciasExcel } = require('../controllers/asistencias.controller');
const { authRequired, requireSupervisor } = require('../middlewares/auth');

// Marcar asistencia (entrada, salida almuerzo, entrada almuerzo, salida)
router.post('/marcar', authRequired, marcar);

// Obtener asistencia del día actual
router.get('/hoy', authRequired, obtenerAsistenciaHoy);

// Obtener historial de asistencias con paginación
router.get('/historial', authRequired, obtenerHistorial);

// Obtener todas las asistencias con validación de horarios (solo supervisores)
router.get('/todas', authRequired, requireSupervisor, obtenerTodasAsistencias);

// Exportar asistencias a Excel (solo supervisores)
router.get('/exportar-excel', authRequired, requireSupervisor, exportarAsistenciasExcel);

module.exports = router;


