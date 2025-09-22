const express = require('express');
const router = express.Router();
const { crear } = require('../controllers/permisos.controller');
const { authRequired } = require('../middlewares/auth');

router.post('/', authRequired, crear);

module.exports = router;


