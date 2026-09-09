-- ============================================================================
-- ESQUEMA COMPLETO DATAVET (NORMALIZADO A 3FN - ALINEADO AL DIAGRAMA MER)
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cedula VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(120) NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol_id INT NOT NULL,
  especialidad VARCHAR(100) NULL,
  tarjeta_profesional VARCHAR(50) NULL,
  colegiada VARCHAR(50) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cedula VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  apellido VARCHAR(120) NULL,
  telefono VARCHAR(20) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE,
  direccion VARCHAR(255) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mascotas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  especie VARCHAR(80) NOT NULL,
  raza VARCHAR(80) NOT NULL,
  sexo VARCHAR(20) DEFAULT 'Macho',
  fecha_nacimiento DATE NULL,
  peso_kg DECIMAL(5,2) NULL,
  color VARCHAR(80) NULL,
  microchip VARCHAR(50) NULL,
  foto_url VARCHAR(255) NULL,
  observaciones TEXT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS estados_cita (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_estado VARCHAR(30) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS citas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  usuario_id INT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  duracion_min INT NOT NULL DEFAULT 30,
  estado ENUM('pendiente','atendida','cancelada') NOT NULL DEFAULT 'pendiente',
  notas_cancelacion TEXT NULL,
  observaciones TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS historial_clinico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  usuario_id INT NOT NULL,
  fecha DATETIME NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  sintomas TEXT NULL,
  diagnostico TEXT NOT NULL,
  tratamiento TEXT NOT NULL,
  notas TEXT NULL,
  observaciones TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS servicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_servicio VARCHAR(120) NOT NULL UNIQUE,
  descripcion TEXT NULL,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cita_servicio (
  id_cita INT NOT NULL,
  id_servicio INT NOT NULL,
  precio_aplicado DECIMAL(10,2) NOT NULL,
  observaciones VARCHAR(255) NULL,
  PRIMARY KEY (id_cita, id_servicio),
  FOREIGN KEY (id_cita) REFERENCES citas(id) ON DELETE CASCADE,
  FOREIGN KEY (id_servicio) REFERENCES servicios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hospitalizaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mascota_id INT NOT NULL,
  usuario_id INT NOT NULL,
  fecha_ingreso DATETIME NOT NULL,
  fecha_egreso DATETIME NULL,
  motivo VARCHAR(255) NOT NULL,
  tratamiento TEXT NULL,
  observaciones TEXT NULL,
  estado ENUM('en_curso', 'alta', 'traslado', 'fallecido') NOT NULL DEFAULT 'en_curso',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mascota_id) REFERENCES mascotas(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Semillas iniciales
INSERT INTO roles (nombre)
VALUES ('admin'), ('veterinario'), ('recepcionista')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO estados_cita (nombre_estado, descripcion)
VALUES 
  ('pendiente', 'Cita agendada a la espera de atención médica'),
  ('atendida', 'Cita completada por el profesional veterinario'),
  ('cancelada', 'Cita suspendida por el cliente o la clínica')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO servicios (nombre_servicio, descripcion, precio)
VALUES 
  ('Consulta General', 'Evaluación médica preventiva y diagnóstico general', 45000.00),
  ('Vacunación Canina / Felina', 'Aplicación de biológicos y esquema de inmunización', 35000.00),
  ('Desparasitación Interna', 'Tratamiento oral antiparasitario según peso', 20000.00),
  ('Profilaxis Dental', 'Limpieza y remoción de sarro por ultrasonido', 120000.00),
  ('Cirugía Menor / Esterilización', 'Procedimiento quirúrgico ambulatorio con anestesia', 250000.00)
ON DUPLICATE KEY UPDATE precio = VALUES(precio);
