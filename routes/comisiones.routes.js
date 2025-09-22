const express = require('express');
const router = express.Router();
const { crear, marcarSalida, marcarRetorno } = require('../controllers/comisiones.controller');
const { authRequired } = require('../middlewares/auth');

router.post('/', authRequired, crear);
router.post('/:id/salida', authRequired, marcarSalida);
router.post('/:id/retorno', authRequired, marcarRetorno);

module.exports = router;


