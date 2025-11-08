require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { authRequired, requireRole } = require('./middlewares/auth');
const app = express();

// Configurar CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Permitir requests desde estos orígenes
  credentials: true, // Permitir cookies y headers de autenticación
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'] // Headers permitidos
}));

app.use(express.json());

// ENDPOINT RENIEC - Requiere JWT del usuario
app.get('/api/reniec/:dni', authRequired, requireRole([2]), async (req, res) => {
  try {
    const { dni } = req.params;
    
    // Validar DNI
    if (!dni || !/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'DNI debe tener exactamente 8 dígitos'
      });
    }

    // Consultar API de Decolecta con tu API key
    const response = await axios.get('https://api.decolecta.com/v1/reniec/dni', {
      params: { numero: dni },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk_2440.q1IfyK19sZVskqxmV33M2skhbQUEcikU'
      },
      timeout: 15000
    });

    return res.json({
      success: true,
      message: 'Datos obtenidos exitosamente de RENIEC',
      data: response.data
    });

  } catch (error) {
    console.error('Error RENIEC:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: 'Error consultando RENIEC',
        error: error.response.data
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/empleados', require('./routes/empleados.routes'));
app.use('/api/asistencias', require('./routes/asistencias.routes'));
app.use('/api/permisos', require('./routes/permisos.routes'));
app.use('/api/comisiones', require('./routes/comisiones.routes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));


