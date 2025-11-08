
CREATE TABLE personas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(8) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(9),
    fecha_nacimiento DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    persona_id INT NOT NULL,
    codigo_empleado VARCHAR(20) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

CREATE TABLE usuarios_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    rol_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

CREATE TABLE asistencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_entrada DATETIME NULL,
    hora_salida_almuerzo DATETIME NULL,
    hora_entrada_almuerzo DATETIME NULL,
    hora_salida DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

CREATE TABLE permisos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha DATE NOT NULL,
    motivo TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

CREATE TABLE comisiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_salida DATETIME NULL,
    hora_retorno DATETIME NULL,
    motivo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
)


CREATE TABLE configuracion_horarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hora_entrada TIME NOT NULL DEFAULT '08:00:00',
    hora_salida_almuerzo TIME NOT NULL DEFAULT '13:00:00',
    hora_entrada_almuerzo TIME NOT NULL DEFAULT '14:00:00',
    hora_salida TIME NOT NULL DEFAULT '17:00:00',
    tolerancia_minutos INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)


CREATE TABLE redes_autorizadas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ssid VARCHAR(100) NOT NULL, 
    direccion_ip VARCHAR(50) NULL, 
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)





-- Relación usuarios → personas
ALTER TABLE usuarios
ADD CONSTRAINT fk_usuario_persona
FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE;

-- Relación usuarios_roles → usuarios
ALTER TABLE usuarios_roles
ADD CONSTRAINT fk_usuario_rol_usuario
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- Relación usuarios_roles → roles
ALTER TABLE usuarios_roles
ADD CONSTRAINT fk_usuario_rol_rol
FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE;

-- Relación asistencias → usuarios
ALTER TABLE asistencias
ADD CONSTRAINT fk_asistencia_usuario
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- Relación permisos → usuarios
ALTER TABLE permisos
ADD CONSTRAINT fk_permiso_usuario
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- Relación comisiones → usuarios
ALTER TABLE comisiones
ADD CONSTRAINT fk_comision_usuario
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;