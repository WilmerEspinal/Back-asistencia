const express = require('express');
const router = express.Router();
const { marcar } = require('../controllers/asistencias.controller');
const { authRequired } = require('../middlewares/auth');

router.post('/marcar', authRequired, marcar);

module.exports = router;


