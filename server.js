const express = require('express');
const cors = require('cors');
const app = express();

// Configurar CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Permitir requests desde estos orígenes
  credentials: true, // Permitir cookies y headers de autenticación
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'] // Headers permitidos
}));

app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/empleados', require('./routes/empleados.routes'));
app.use('/api/asistencias', require('./routes/asistencias.routes'));
app.use('/api/permisos', require('./routes/permisos.routes'));
app.use('/api/comisiones', require('./routes/comisiones.routes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));


