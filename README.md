# Sistema de Asistencias - Backend

Sistema completo de registro de asistencias para empleados con autenticación JWT y control de horarios.

## 🚀 Características

- ✅ **Autenticación JWT** - Login seguro con tokens
- ✅ **Registro de Asistencias** - Entrada, salida almuerzo, entrada almuerzo, salida
- ✅ **Validación de Secuencia** - Control lógico del flujo de marcado
- ✅ **Historial Completo** - Consulta de asistencias con paginación
- ✅ **Roles de Usuario** - Administrador, Supervisor, Empleado
- ✅ **API RENIEC** - Consulta de datos por DNI
- ✅ **Base de Datos MySQL** - Estructura normalizada y optimizada

## 📋 Requisitos

- Node.js 16+
- MySQL 8.0+
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd Back-asistencia
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar base de datos**
   ```bash
   # Crear base de datos en MySQL
   mysql -u root -p
   CREATE DATABASE asistencia_db;
   
   # Ejecutar script de estructura
   mysql -u root -p asistencia_db < database.sql
   ```

4. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

5. **Iniciar servidor**
   ```bash
   # Desarrollo
   npm run dev
   
   # Producción
   npm start
   ```

## 🔧 Configuración

### Variables de Entorno (.env)

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=asistencia_db

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro

# Servidor
PORT=3000

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# RENIEC API
RENIEC_API_KEY=tu_api_key_decolecta
```

## 📚 Estructura del Proyecto

```
Back-asistencia/
├── config/
│   └── db.js                 # Configuración de base de datos
├── controllers/
│   ├── auth.controller.js    # Controlador de autenticación
│   ├── asistencias.controller.js # Controlador de asistencias
│   ├── empleados.controller.js   # Controlador de empleados
│   ├── permisos.controller.js    # Controlador de permisos
│   └── comisiones.controller.js  # Controlador de comisiones
├── middlewares/
│   └── auth.js              # Middleware de autenticación
├── routes/
│   ├── auth.routes.js       # Rutas de autenticación
│   ├── asistencias.routes.js # Rutas de asistencias
│   ├── empleados.routes.js   # Rutas de empleados
│   ├── permisos.routes.js    # Rutas de permisos
│   └── comisiones.routes.js  # Rutas de comisiones
├── scripts/
├── database.sql             # Script de base de datos
├── server.js               # Servidor principal
├── test_api.js            # Script de pruebas
├── API_DOCUMENTATION.md    # Documentación de API
└── README.md              # Este archivo
```

## 🔑 Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Asistencias
- `POST /api/asistencias/marcar` - Marcar asistencia
- `GET /api/asistencias/hoy` - Obtener asistencia del día
- `GET /api/asistencias/historial` - Obtener historial

### Empleados
- `GET /api/empleados` - Listar empleados
- `POST /api/empleados` - Crear empleado
- `PUT /api/empleados/:id` - Actualizar empleado

## 🧪 Pruebas

Ejecutar script de pruebas automáticas:

```bash
node test_api.js
```

Este script probará:
- ✅ Login de usuario
- ✅ Marcado de asistencias
- ✅ Consulta de datos
- ✅ Validaciones de seguridad
- ✅ Manejo de errores

## 📖 Uso Básico

### 1. Registrar Usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "dni": "12345678",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@email.com",
    "codigo_empleado": "EMP001",
    "username": "jperez",
    "password": "password123",
    "fecha_ingreso": "2024-01-01",
    "rol_id": 3
  }'
```

### 2. Iniciar Sesión
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jperez",
    "password": "password123"
  }'
```

### 3. Marcar Entrada
```bash
curl -X POST http://localhost:3000/api/asistencias/marcar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"tipo": "entrada"}'
```

## 🔒 Seguridad

- **JWT Tokens** - Autenticación segura con expiración
- **Bcrypt** - Hashing de contraseñas
- **Validación de Roles** - Control de acceso por permisos
- **Validación de Entrada** - Sanitización de datos
- **CORS Configurado** - Control de orígenes permitidos

## 📊 Base de Datos

### Tablas Principales

- **personas** - Datos personales
- **usuarios** - Credenciales y configuración
- **asistencias** - Registro de horarios
- **roles** - Tipos de usuario
- **permisos** - Solicitudes de ausencia
- **comisiones** - Salidas por trabajo

### Campos de Asistencia

- `hora_entrada` - Hora de llegada
- `hora_salida_almuerzo` - Hora de salida a almorzar
- `hora_entrada_almuerzo` - Hora de regreso del almuerzo
- `hora_salida` - Hora de salida del trabajo

## 🚦 Estados de Asistencia

1. **Entrada** - Llegada al trabajo
2. **Salida Almuerzo** - Salida a almorzar
3. **Entrada Almuerzo** - Regreso del almuerzo
4. **Salida** - Salida del trabajo

## 🔄 Flujo de Trabajo

1. Usuario se registra o inicia sesión
2. Marca **entrada** al llegar al trabajo
3. Marca **salida_almuerzo** al ir a almorzar
4. Marca **entrada_almuerzo** al regresar
5. Marca **salida** al terminar la jornada

## 🐛 Solución de Problemas

### Error de Conexión a Base de Datos
```bash
# Verificar que MySQL esté ejecutándose
sudo systemctl status mysql

# Verificar configuración en .env
cat .env
```

### Error de Token JWT
```bash
# Verificar que JWT_SECRET esté configurado
echo $JWT_SECRET
```

### Error de CORS
```bash
# Verificar orígenes permitidos en server.js
# Agregar tu dominio frontend a CORS_ORIGINS
```

## 📝 Logs

Los logs se muestran en consola durante desarrollo:
- ✅ Conexiones exitosas
- ❌ Errores de validación
- 🔐 Intentos de autenticación
- 📊 Consultas de base de datos

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 👥 Roles del Sistema

- **Administrador (ID: 1)** - Acceso completo
- **Supervisor (ID: 2)** - Gestión de empleados y reportes
- **Empleado (ID: 3)** - Registro de asistencia personal

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear issue en el repositorio
- Revisar documentación en `API_DOCUMENTATION.md`
- Ejecutar pruebas con `node test_api.js`
