# API de Sistema de Asistencias

## Configuración Inicial

1. Copia `.env.example` a `.env` y configura tus variables de entorno
2. Ejecuta el script SQL `database.sql` en tu base de datos MySQL
3. Instala dependencias: `npm install`
4. Inicia el servidor: `npm run dev`

## Autenticación

Todos los endpoints (excepto login y register) requieren autenticación JWT.

**Header requerido:**
```
Authorization: Bearer <tu_jwt_token>
```

## Endpoints de Autenticación

### POST /api/auth/register
Registrar un nuevo usuario.

**Body:**
```json
{
  "dni": "12345678",
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@email.com",
  "telefono": "987654321",
  "fecha_nacimiento": "1990-01-01",
  "codigo_empleado": "EMP001",
  "username": "jperez",
  "password": "password123",
  "fecha_ingreso": "2024-01-01",
  "rol_id": 3
}
```

**Respuesta exitosa:**
```json
{
  "message": "Usuario registrado con rol asignado",
  "usuario": {
    "usuario_id": 1,
    "codigo_empleado": "EMP001",
    "username": "jperez",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@email.com",
    "rol_id": 3
  }
}
```

### POST /api/auth/login
Iniciar sesión.

**Body:**
```json
{
  "username": "jperez",
  "password": "password123"
}
```

**Respuesta exitosa:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "jperez",
    "codigo_empleado": "EMP001",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol_id": 3
  }
}
```

## Endpoints de Asistencias

### POST /api/asistencias/marcar
Marcar asistencia (entrada, salida almuerzo, entrada almuerzo, salida).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "tipo": "entrada"
}
```

**Tipos válidos:**
- `entrada`: Marcar entrada al trabajo
- `salida_almuerzo`: Marcar salida a almorzar
- `entrada_almuerzo`: Marcar regreso del almuerzo
- `salida`: Marcar salida del trabajo

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "entrada marcada correctamente",
  "data": {
    "tipo": "entrada",
    "hora": "08:30:15",
    "asistencia": {
      "id": 1,
      "usuario_id": 1,
      "fecha": "2024-01-15",
      "hora_entrada": "2024-01-15T08:30:15.000Z",
      "hora_salida_almuerzo": null,
      "hora_entrada_almuerzo": null,
      "hora_salida": null,
      "created_at": "2024-01-15T08:30:15.000Z",
      "updated_at": "2024-01-15T08:30:15.000Z"
    }
  }
}
```

**Respuesta de error (ya marcado):**
```json
{
  "success": false,
  "message": "Ya has marcado entrada hoy a las 08:30:15"
}
```

**Respuesta de error (secuencia inválida):**
```json
{
  "success": false,
  "message": "Debes marcar entrada antes de salir a almorzar"
}
```

### GET /api/asistencias/hoy
Obtener la asistencia del día actual.

**Headers:**
```
Authorization: Bearer <token>
```

**Nota sobre formatos de hora:**
- Los campos `hora_*` devuelven la hora en formato de 24 horas (ej: "13:10", "08:02")
- **MEJORAS RECIENTES:**
- Todas las horas se manejan en zona horaria de Perú (America/Lima)
- **Formato de horas unificado**: Todas las APIs devuelven formato 24 horas (ej: "13:10", "08:02")
- Funciones auxiliares: getPeruDate(), getPeruDateTime(), formatTimeForExcel()
- Consultas SQL actualizadas para usar fecha de Perú en lugar de CURDATE()

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "usuario_id": 1,
    "fecha": "2024-01-15",
    "hora_entrada": "08:30",
    "hora_salida_almuerzo": "13:00",
    "hora_entrada_almuerzo": null,
    "hora_salida": null,
    "codigo_empleado": "EMP001",
    "nombre": "Juan",
    "apellido": "Pérez",
    "estado": {
      "completado": ["entrada", "salida_almuerzo"],
      "pendiente": ["entrada_almuerzo", "salida"]
    },
    "proxima_accion": "entrada_almuerzo"
  }
}
```

**Respuesta sin asistencia:**
```json
{
  "success": true,
  "message": "No hay registro de asistencia para hoy",
  "data": null
}
```

### GET /api/asistencias/historial
Obtener historial de asistencias con paginación.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `fecha_inicio` (opcional): Fecha de inicio en formato YYYY-MM-DD
- `fecha_fin` (opcional): Fecha de fin en formato YYYY-MM-DD
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Registros por página (default: 10)

**Ejemplo:**
```
GET /api/asistencias/historial?fecha_inicio=2024-01-01&fecha_fin=2024-01-31&page=1&limit=5
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "usuario_id": 1,
      "fecha": "2024-01-15",
      "hora_entrada": "08:30:15 a. m.",
      "hora_salida_almuerzo": "01:00:00 p. m.",
      "hora_entrada_almuerzo": "02:00:00 p. m.",
      "hora_salida": "05:30:00 p. m.",
      "codigo_empleado": "EMP001",
      "nombre": "Juan",
      "apellido": "Pérez",
      "estado": {
        "completado": ["entrada", "salida_almuerzo", "entrada_almuerzo", "salida"],
        "pendiente": []
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 25,
    "totalPages": 5
  }
}
```

### GET /api/asistencias/todas
Obtener todas las asistencias con paginación y validación de horarios.

**⚠️ Requiere rol de Supervisor ÚNICAMENTE (rol_id = 2)**
**❌ Administradores (rol_id = 1) NO tienen acceso**

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Registros por página (default: 10)
- `all` (opcional): Si es "true", obtiene TODOS los registros sin paginación

**Filtros de Fecha (por prioridad):**
1. **Fecha específica:**
   - `fecha`: Filtrar por fecha específica en formato YYYY-MM-DD

2. **Rango de fechas:**
   - `fecha_inicio`: Fecha de inicio en formato YYYY-MM-DD
   - `fecha_fin`: Fecha de fin en formato YYYY-MM-DD

3. **Filtros por período:**
   - `año`: Filtrar por año (ej: 2025)
   - `mes`: Filtrar por mes (1-12, ej: 1 para enero)

**Otros filtros:**
- `codigo_empleado`: Filtrar por código de empleado específico

**Ejemplos de uso:**

**Con paginación (comportamiento por defecto):**
```
GET /api/asistencias/todas?page=2&limit=10
```

**Filtrar por fecha específica:**
```
GET /api/asistencias/todas?fecha=2025-01-15
```

**Filtrar por rango de fechas (como pediste):**
```
GET /api/asistencias/todas?fecha_inicio=2025-01-01&fecha_fin=2025-01-31
```

**Filtrar por mes específico:**
```
GET /api/asistencias/todas?mes=1&año=2025
```

**Filtrar solo por año:**
```
GET /api/asistencias/todas?año=2025
```

**Filtrar por empleado específico:**
```
GET /api/asistencias/todas?codigo_empleado=PLA004
```

**Combinar filtros:**
```
GET /api/asistencias/todas?fecha_inicio=2025-01-01&fecha_fin=2025-01-31&codigo_empleado=PLA004&page=2&limit=10
```

**Sin paginación (TODOS los registros):**
```
GET /api/asistencias/todas?all=true
```

**Sin paginación con filtro por rango:**
```
GET /api/asistencias/todas?all=true&fecha_inicio=2025-01-01&fecha_fin=2025-01-31
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "usuario_id": 4,
      "codigo_empleado": "PLA004",
      "nombre_completo": "MARCOS ANTONIO MAZA VALDEZ",
      "fecha": "2025-10-07",
      "hora_entrada": "08:15:30 a. m.",
      "hora_salida_almuerzo": "01:05:00 p. m.",
      "hora_entrada_almuerzo": "02:10:00 p. m.",
      "hora_salida": "05:30:00 p. m.",
      "estado": {
        "completado": ["entrada", "salida_almuerzo", "entrada_almuerzo", "salida"],
        "pendiente": []
      },
      "validaciones": {
        "entrada": {
          "estado": "tarde",
          "mensaje": "Llegó 15 minutos tarde",
          "color": "red"
        },
        "salida_almuerzo": {
          "estado": "tarde",
          "mensaje": "Salió 5 minutos tarde a almorzar",
          "color": "orange"
        },
        "entrada_almuerzo": {
          "estado": "tarde",
          "mensaje": "Regresó 10 minutos tarde del almuerzo",
          "color": "red"
        },
        "salida": {
          "estado": "puntual",
          "mensaje": "Puntual",
          "color": "green"
        }
      },
      "created_at": "2025-10-07T16:15:30.000Z",
      "updated_at": "2025-10-07T22:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Colores para validaciones:**
- `green`: Puntual o normal
- `red`: Tarde (entrada/regreso almuerzo)
- `orange`: Tarde (salidas) o temprano (salida final)
- `blue`: Temprano o después de hora

**Respuesta de error (Empleado - rol_id = 3):**
```json
{
  "message": "Acceso denegado. Solo supervisores pueden acceder a este recurso.",
  "required": "Supervisor (rol_id: 2)",
  "current": "rol_id: 3"
}
```

**Respuesta de error (Admin - rol_id = 1):**
```json
{
  "message": "Acceso denegado. Solo supervisores pueden acceder a este recurso.",
  "required": "Supervisor (rol_id: 2)",
  "current": "rol_id: 1"
}
```

**Respuesta sin paginación (all=true):**
```json
{
  "success": true,
  "message": "Se obtuvieron todas las 63 asistencias sin paginación",
  "total": 63,
  "data": [
    {
      "id": 1,
      "usuario_id": 4,
      "codigo_empleado": "PLA004",
      "nombre_completo": "MARCOS ANTONIO MAZA VALDEZ",
      "fecha": "2025-10-20T05:00:00.000Z",
      "hora_entrada": "09:33",
      "hora_salida_almuerzo": null,
      "hora_entrada_almuerzo": null,
      "hora_salida": null,
      "estado": {
        "completado": ["entrada"],
        "pendiente": ["salida_almuerzo", "entrada_almuerzo", "salida"]
      },
      "validaciones": {
        "entrada": {
          "estado": "tarde",
          "mensaje": "Llegó 93 minutos tarde",
          "color": "red"
        }
      }
    }
    // ... todos los demás registros sin límite
  ]
}
```

## 📊 Exportar Asistencias a Excel

### GET `/api/asistencias/exportar-excel`

Exporta las asistencias a un archivo Excel con formato personalizado.

**Autenticación:** Requerida (Solo Supervisores)

**Parámetros de consulta:**
- `fecha` (string): Fecha exacta en formato YYYY-MM-DD (prioridad alta)
- `fecha_inicio` (string): Fecha de inicio en formato YYYY-MM-DD
- `fecha_fin` (string): Fecha de fin en formato YYYY-MM-DD
- `codigo_empleado` (string): Código específico del empleado (ej: PLA004, TER003)
- `mes` (number): Mes específico (1-12)
- `año` (number): Año específico (ej: 2025)

**⚠️ Importante:** Debe especificar al menos un filtro. No se permite exportar sin filtros.

**Ejemplos de solicitud:**
```bash
# Exportar por fecha exacta (ej: solo el día de ayer)
GET /api/asistencias/exportar-excel?fecha=2025-10-07
Authorization: Bearer <token>

# Exportar empleado específico en fecha exacta
GET /api/asistencias/exportar-excel?codigo_empleado=PLA004&fecha=2025-10-07
Authorization: Bearer <token>

# Exportar con rango de fechas
GET /api/asistencias/exportar-excel?fecha_inicio=2025-10-01&fecha_fin=2025-10-31
Authorization: Bearer <token>

# Exportar por código de empleado (todas sus asistencias del año actual)
GET /api/asistencias/exportar-excel?codigo_empleado=PLA004&año=2025
Authorization: Bearer <token>

# Exportar por mes y año específicos
GET /api/asistencias/exportar-excel?mes=10&año=2025
Authorization: Bearer <token>

# Exportar solo por año
GET /api/asistencias/exportar-excel?año=2025
Authorization: Bearer <token>
```

**Lógica de Filtros (por prioridad):**
1. **Fecha exacta** (`fecha`) - Mayor prioridad
2. **Rango de fechas** (`fecha_inicio`, `fecha_fin`) - Si no hay fecha exacta
3. **Mes y año** (`mes`, `año`) - Si no hay fechas específicas
4. **Código de empleado** - Se combina con cualquier filtro de fecha

**Respuesta exitosa:**
- **Content-Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition:** `attachment; filename="[nombre_dinámico].xlsx"`
- **Cuerpo:** Archivo Excel binario

**Nombres de archivo generados automáticamente:**
- Todas las asistencias: `asistencias_2025-10-08.xlsx`
- Por rango de fechas: `asistencias_2025-10-01_2025-10-31.xlsx`
- Por empleado: `asistencias_PLA004_2025-10-08.xlsx`
- Por año: `asistencias_2025.xlsx`
- Por mes y año: `asistencias_2025-10.xlsx`
- Combinado: `asistencias_PLA004_2025-10.xlsx`

**Estructura del archivo Excel:**

| Empleado | Nombre Completo | Código | Fecha | Entrada | Salida Alm | Entrada Alm | Salida | Estado |
|----------|-----------------|--------|-------|---------|------------|-------------|--------|---------|
| MA | MARCOS ANTONIO MAZA VALDEZ | PLA004 | 08/10/2025 | 10:40 | 10:45 | 13:10 | --- | Puntual |
| ZE | ZIMA ESTEFANI CAMPOS HUARINGA | TER003 | 08/10/2025 | 10:05 | 10:32 | 10:32 | 10:32 | Puntual |

**Características del archivo:**
- **Título dinámico**: Muestra el mes/período exportado (ej: "REPORTE DE ASISTENCIAS - OCTUBRE 2025")
- **Encabezados**: Fondo azul con texto blanco
- **Colores automáticos por validación de horarios**:
  - 🔴 **Rojo**: Solo las HORAS que superan la tolerancia configurada (ej: entrada después de 08:05)
  - Las horas puntuales se muestran sin color especial
- **Bordes**: En todas las celdas de datos
- **Formato de fecha**: DD/MM/YYYY
- **Horas**: Formato 24 horas sin segundos (ej: 13:10, 08:02)
- **Campos vacíos**: "---"
- **Leyenda de colores**: Incluida al final del archivo
- **Configuración de horarios**: Muestra horarios y tolerancia configurados

**Respuesta de error (Sin permisos):**
```json
{
  "message": "Acceso denegado. Solo supervisores pueden acceder a este recurso.",
  "required": "Supervisor (rol_id: 2)",
  "current": "rol_id: 3"
}
```

**Respuesta de error (Error interno):**
```json
{
  "success": false,
  "message": "Error al exportar asistencias",
  "error": "Descripción del error"
}
```

## Códigos de Estado HTTP

- `200`: Éxito
- `201`: Creado exitosamente
- `400`: Error en los datos enviados
- `401`: No autenticado o token inválido
- `403`: Sin permisos suficientes
- `409`: Conflicto (datos duplicados)
- `500`: Error interno del servidor

## Roles de Usuario

- `1`: Administrador
- `2`: Supervisor
- `3`: Empleado

## Flujo de Trabajo Típico

1. **Registro/Login**: El usuario se registra o inicia sesión
2. **Marcar Entrada**: Al llegar al trabajo, marca `entrada`
3. **Salida a Almorzar**: Marca `salida_almuerzo`
4. **Regreso del Almuerzo**: Marca `entrada_almuerzo`
5. **Salida del Trabajo**: Marca `salida`

## Validaciones

- No se puede marcar el mismo tipo dos veces en el mismo día
- Se debe seguir la secuencia lógica (entrada → salida_almuerzo → entrada_almuerzo → salida)
- No se puede salir a almorzar sin haber marcado entrada
- No se puede regresar del almuerzo sin haber salido
- No se puede marcar salida sin haber marcado entrada

## Ejemplos de Uso con cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "jperez", "password": "password123"}'
```

### Marcar Entrada
```bash
curl -X POST http://localhost:3000/api/asistencias/marcar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"tipo": "entrada"}'
```

### Ver Asistencia de Hoy
```bash
curl -X GET http://localhost:3000/api/asistencias/hoy \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Ver Historial
```bash
curl -X GET "http://localhost:3000/api/asistencias/historial?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
