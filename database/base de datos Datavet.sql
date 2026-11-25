-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         11.5.2-MariaDB / MySQL 8.0+
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.6.0.6765
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Crear y seleccionar la base de datos datavet
CREATE DATABASE IF NOT EXISTS `datavet` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `datavet`;

-- Limpiar tablas previas en orden inverso para evitar errores 1062 (Duplicate entry) o 1451 (FK constraint)
DROP TABLE IF EXISTS `archivos_procedimiento`;
DROP TABLE IF EXISTS `detalle_receta`;
DROP TABLE IF EXISTS `recetas_medicas`;
DROP TABLE IF EXISTS `procedimientos`;
DROP TABLE IF EXISTS `hospitalizaciones`;
DROP TABLE IF EXISTS `consultas_medicas`;
DROP TABLE IF EXISTS `historias_clinicas`;
DROP TABLE IF EXISTS `cita_servicio`;
DROP TABLE IF EXISTS `citas`;
DROP TABLE IF EXISTS `mascotas`;
DROP TABLE IF EXISTS `clientes`;
DROP TABLE IF EXISTS `veterinarios`;
DROP TABLE IF EXISTS `usuarios`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `estados_cita`;
DROP TABLE IF EXISTS `servicios`;
DROP TABLE IF EXISTS `medicamentos`;

-- 1. Tabla datavet.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id_rol` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre_rol` (`nombre_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`id_rol`, `nombre_rol`, `descripcion`) VALUES
	(1, 'Administrador', 'Gestion completa del sistema'),
	(2, 'Recepcionista', 'Gestion de clientes, mascotas y citas'),
	(3, 'Veterinario', 'Atencion clinica y gestion medica'),
	(4, 'Cliente', 'Propietario de mascotas con acceso al portal');

-- 2. Tabla datavet.usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_rol` int(10) unsigned NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `cedula` varchar(20) NOT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_usuarios_roles` (`id_rol`),
  CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usuarios` (`id_usuario`, `id_rol`, `nombre`, `email`, `password_hash`, `activo`, `fecha_creacion`, `fecha_actualizacion`, `cedula`) VALUES
	(1, 1, 'Juan Torres', 'admin@datavet.com', '$2a$10$lO5kfIaMiqeAEzaWBs4/ee8VZlOyfcEvN0Mgq4rcdwdIi9vSCnWz6', 1, '2026-10-19 17:58:19', '2026-10-19 19:34:47', 666666666),
	(2, 2, 'Laura Martinez', 'recepcion@datavet.com', '$2a$10$e1LxOkc8Wx1ITwUNctbNJ.LV5hJFFXSCTbQWuOiXmM.6U0cm5jJKy', 1, '2026-10-19 17:58:19', '2026-10-19 19:33:03', 1),
	(3, 3, 'Carlos Ramirez', 'carlos@datavet.com', '$2a$10$e1LxOkc8Wx1ITwUNctbNJ.LV5hJFFXSCTbQWuOiXmM.6U0cm5jJKy', 1, '2026-10-19 17:58:19', '2026-10-19 19:33:03', 2),
	(4, 3, 'Ana Rodriguez', 'ana@datavet.com', '$2a$10$e1LxOkc8Wx1ITwUNctbNJ.LV5hJFFXSCTbQWuOiXmM.6U0cm5jJKy', 1, '2026-10-19 17:58:19', '2026-10-19 19:33:03', 3),
	(5, 3, 'sergio messi', 'messi@datavet.com', '$2a$10$lO5kfIaMiqeAEzaWBs4/ee8VZlOyfcEvN0Mgq4rcdwdIi9vSCnWz6', 1, '2026-10-19 19:39:56', '2026-10-19 19:40:12', 123456789);

-- 3. Tabla datavet.veterinarios
CREATE TABLE IF NOT EXISTS `veterinarios` (
  `id_veterinario` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int(10) unsigned NOT NULL,
  `colegiado` varchar(80) DEFAULT NULL,
  `especialidad` varchar(120) DEFAULT NULL,
  `tarjeta_profesional` varchar(80) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_veterinario`),
  UNIQUE KEY `id_usuario` (`id_usuario`),
  UNIQUE KEY `colegiado` (`colegiado`),
  UNIQUE KEY `tarjeta_profesional` (`tarjeta_profesional`),
  CONSTRAINT `fk_veterinarios_usuarios` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `veterinarios` (`id_veterinario`, `id_usuario`, `colegiado`, `especialidad`, `tarjeta_profesional`, `activo`) VALUES
	(1, 3, 'COL-2024-001', 'Medicina general', 'TP-VET-001', 1),
	(2, 4, 'COL-2024-002', 'Cirugia veterinaria', 'TP-VET-002', 1),
	(3, 5, 'COL-2024-003', 'Cirugia veterinaria', 'TP-VET-003', 1);

-- 4. Tabla datavet.clientes
CREATE TABLE IF NOT EXISTS `clientes` (
  `id_cliente` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_usuario` int(10) unsigned DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(190) DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `cedula` varchar(20) NOT NULL,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `uq_clientes_usuario` (`id_usuario`),
  KEY `idx_clientes_nombre` (`apellido`,`nombre`),
  KEY `idx_clientes_telefono` (`telefono`),
  CONSTRAINT `fk_clientes_usuarios` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `clientes` (`id_cliente`, `nombre`, `apellido`, `email`, `telefono`, `direccion`, `fecha_registro`, `activo`, `cedula`) VALUES
	(1, 'Maria', 'Gomez', 'maria.gomez@example.com', '3001112233', 'Bogota, Chapinero', '2026-10-19 17:58:19', 1, 132131855),
	(2, 'Pedro', 'Lopez', 'pedro.lopez@example.com', '3012223344', 'Bogota, Teusaquillo', '2026-10-19 17:58:19', 1, 2132113126),
	(3, 'Camila', 'Fernandez', 'camila.fernandez@example.com', '3023334455', 'Bogota, Suba', '2026-10-19 17:58:19', 1, 741852963),
	(4, 'Andres', 'Castro', 'andres.castro@example.com', '3034445566', 'Bogota, Engativa', '2026-10-19 17:58:19', 1, 32132123),
	(5, 'Sofia', 'Morales', 'sofia.morales@example.com', '3045556677', 'Bogota, Usaquen', '2026-10-19 17:58:19', 1, 102112551),
	(6, 'Samuel', 'Torres', 'Samuel.torres@tony.com', '3184156502', 'Bogota', '2026-10-19 18:09:35', 1, 1031650543),
	(8, 'pique simpson', '', NULL, '3184156502', 'carrera 84c #145-91', '2026-10-19 19:43:22', 1, 987654321);

-- 5. Tabla datavet.mascotas
CREATE TABLE IF NOT EXISTS `mascotas` (
  `id_mascota` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_cliente` int(10) unsigned NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `especie` varchar(60) NOT NULL,
  `raza` varchar(100) DEFAULT NULL,
  `sexo` enum('Macho','Hembra','Desconocido') NOT NULL DEFAULT 'Desconocido',
  `fecha_nacimiento` date DEFAULT NULL,
  `peso` decimal(7,2) DEFAULT NULL,
  `color` varchar(80) DEFAULT NULL,
  `microchip` varchar(100) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `foto_url` varchar(500) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_mascota`),
  UNIQUE KEY `microchip` (`microchip`),
  KEY `idx_mascotas_cliente` (`id_cliente`),
  CONSTRAINT `fk_mascotas_clientes` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_cliente`) ON UPDATE CASCADE,
  CONSTRAINT `chk_mascotas_peso` CHECK (`peso` is null or `peso` > 0)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `mascotas` (`id_mascota`, `id_cliente`, `nombre`, `especie`, `raza`, `sexo`, `fecha_nacimiento`, `peso`, `color`, `microchip`, `observaciones`, `activo`) VALUES
	(1, 1, 'Max', 'Perro', 'Labrador', 'Macho', '2023-10-19', 25.50, 'Dorado', NULL, 'Sociable, vacunacion en seguimiento', 1),
	(2, 1, 'Luna', 'Gato', 'Siames', 'Hembra', '2024-10-19', 4.20, 'Crema', NULL, 'Control preventivo', 1),
	(3, 2, 'Rocky', 'Perro', 'Bulldog frances', 'Macho', '2022-10-19', 12.30, 'Blanco y negro', NULL, 'Revisar peso periodicamente', 1),
	(4, 3, 'Milo', 'Gato', 'Criollo', 'Macho', '2025-10-19', 3.80, 'Gris', NULL, 'Mascota joven', 1),
	(5, 4, 'Nala', 'Perro', 'Golden Retriever', 'Hembra', '2021-10-19', 28.00, 'Dorado', NULL, 'Seguimiento articular', 1),
	(6, 5, 'Coco', 'Conejo', 'Cabeza de leon', 'Macho', '2025-10-19', 1.60, 'Blanco', NULL, 'Requiere control dental', 1),
	(8, 8, 'shakira', 'Gato', 'costeña', 'Hembra', '2012-02-13', 100.00, 'negra', NULL, NULL, 1);

-- 6. Tabla datavet.estados_cita
CREATE TABLE IF NOT EXISTS `estados_cita` (
  `id_estado` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre_estado` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_estado`),
  UNIQUE KEY `nombre_estado` (`nombre_estado`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `estados_cita` (`id_estado`, `nombre_estado`, `descripcion`) VALUES
	(1, 'Programada', 'Cita agendada'),
	(2, 'Confirmada', 'Cita confirmada'),
	(3, 'En atención', 'La mascota esta siendo atendida'),
	(4, 'Atendida', 'La consulta fue realizada'),
	(5, 'Cancelada', 'Cita cancelada'),
	(6, 'No asistió', 'El cliente no asistio');

-- 7. Tabla datavet.servicios
CREATE TABLE IF NOT EXISTS `servicios` (
  `id_servicio` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre_servicio` varchar(120) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_servicio`),
  CONSTRAINT `chk_servicios_precio` CHECK (`precio` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `servicios` (`id_servicio`, `nombre_servicio`, `descripcion`, `precio`, `activo`) VALUES
	(1, 'Consulta general', 'Evaluacion clinica general', 60000.00, 1),
	(2, 'Vacunacion', 'Aplicacion de vacuna segun valoracion veterinaria', 45000.00, 1),
	(3, 'Desparasitacion', 'Servicio de desparasitacion segun indicacion profesional', 30000.00, 1),
	(4, 'Examen de laboratorio', 'Toma y procesamiento de muestras', 80000.00, 1),
	(5, 'Limpieza dental', 'Valoracion y limpieza dental veterinaria', 120000.00, 1),
	(6, 'Hospitalizacion', 'Atencion y monitoreo intrahospitalario', 150000.00, 1);

-- 8. Tabla datavet.medicamentos
CREATE TABLE IF NOT EXISTS `medicamentos` (
  `id_medicamento` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `presentacion` varchar(100) DEFAULT NULL,
  `concentracion` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_medicamento`),
  KEY `idx_medicamentos_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `medicamentos` (`id_medicamento`, `nombre`, `presentacion`, `concentracion`, `activo`) VALUES
	(1, 'Antiparasitario veterinario', 'Tableta', 'Segun producto', 1),
	(2, 'Antiseptico veterinario', 'Solucion topica', 'Segun producto', 1),
	(3, 'Suplemento veterinario', 'Suspension oral', 'Segun producto', 1),
	(4, 'Analgesico veterinario', 'Tableta', 'Segun producto', 1);

-- 9. Tabla datavet.historias_clinicas
CREATE TABLE IF NOT EXISTS `historias_clinicas` (
  `id_historia` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_mascota` int(10) unsigned NOT NULL,
  `fecha_apertura` date NOT NULL,
  `estado` enum('Activa','Cerrada','Archivada') NOT NULL DEFAULT 'Activa',
  `observaciones_generales` text DEFAULT NULL,
  PRIMARY KEY (`id_historia`),
  UNIQUE KEY `id_mascota` (`id_mascota`),
  CONSTRAINT `fk_historias_mascotas` FOREIGN KEY (`id_mascota`) REFERENCES `mascotas` (`id_mascota`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `historias_clinicas` (`id_historia`, `id_mascota`, `fecha_apertura`, `estado`, `observaciones_generales`) VALUES
	(1, 1, '2026-10-19', 'Activa', 'Historia clinica de Max. Seguimiento integral de salud.'),
	(2, 2, '2026-10-19', 'Activa', 'Historia clinica de Luna. Seguimiento integral de salud.'),
	(3, 3, '2026-10-19', 'Activa', 'Historia clinica de Rocky. Seguimiento integral de salud.'),
	(4, 4, '2026-10-19', 'Activa', 'Historia clinica de Milo. Seguimiento integral de salud.'),
	(5, 5, '2026-10-19', 'Activa', 'Historia clinica de Nala. Seguimiento integral de salud.'),
	(6, 6, '2026-10-19', 'Activa', 'Historia clinica de Coco. Seguimiento integral de salud.'),
	(7, 8, '2026-10-19', 'Activa', 'Historia clinica de shakira. Seguimiento integral de salud.');

-- 10. Tabla datavet.citas
CREATE TABLE IF NOT EXISTS `citas` (
  `id_cita` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_mascota` int(10) unsigned NOT NULL,
  `id_veterinario` int(10) unsigned NOT NULL,
  `id_estado` int(10) unsigned NOT NULL,
  `id_usuario_registro` int(10) unsigned DEFAULT NULL,
  `fecha_hora` datetime NOT NULL,
  `motivo` varchar(255) NOT NULL,
  `observaciones` text DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_cita`),
  KEY `fk_citas_mascotas` (`id_mascota`),
  KEY `fk_citas_estados` (`id_estado`),
  KEY `fk_citas_usuario` (`id_usuario_registro`),
  KEY `idx_citas_fecha` (`fecha_hora`),
  KEY `idx_citas_veterinario_fecha` (`id_veterinario`,`fecha_hora`),
  CONSTRAINT `fk_citas_estados` FOREIGN KEY (`id_estado`) REFERENCES `estados_cita` (`id_estado`) ON UPDATE CASCADE,
  CONSTRAINT `fk_citas_mascotas` FOREIGN KEY (`id_mascota`) REFERENCES `mascotas` (`id_mascota`) ON UPDATE CASCADE,
  CONSTRAINT `fk_citas_usuario` FOREIGN KEY (`id_usuario_registro`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_citas_veterinarios` FOREIGN KEY (`id_veterinario`) REFERENCES `veterinarios` (`id_veterinario`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `citas` (`id_cita`, `id_mascota`, `id_veterinario`, `id_estado`, `id_usuario_registro`, `fecha_hora`, `motivo`, `observaciones`, `fecha_creacion`) VALUES
	(1, 1, 1, 2, 2, '2026-10-20 17:58:19', 'Control general', 'Confirmar asistencia', '2026-10-19 17:58:19'),
	(2, 3, 2, 1, 2, '2026-10-21 17:58:19', 'Revision preventiva', 'Primera cita de control', '2026-10-19 17:58:19'),
	(3, 4, 1, 1, 2, '2026-10-22 17:58:19', 'Revision general', 'Seguimiento preventivo', '2026-10-19 17:58:19'),
	(4, 5, 2, 4, 2, '2026-10-17 17:58:19', 'Control articular', 'Cita de ejemplo ya realizada', '2026-10-19 17:58:19'),
	(5, 6, 1, 5, 2, '2026-10-18 17:58:19', 'Control dental', 'Cita cancelada de prueba', '2026-10-19 17:58:19'),
	(8, 8, 2, 1, NULL, '2026-10-19 20:00:00', 'Revision general', NULL, '2026-10-19 19:53:28');

-- 11. Tabla datavet.cita_servicio
CREATE TABLE IF NOT EXISTS `cita_servicio` (
  `id_cita` int(10) unsigned NOT NULL,
  `id_servicio` int(10) unsigned NOT NULL,
  `precio_aplicado` decimal(10,2) NOT NULL,
  `cantidad` int(10) unsigned NOT NULL DEFAULT 1,
  `observaciones` text DEFAULT NULL,
  PRIMARY KEY (`id_cita`,`id_servicio`),
  KEY `fk_cita_servicio_servicios` (`id_servicio`),
  CONSTRAINT `fk_cita_servicio_citas` FOREIGN KEY (`id_cita`) REFERENCES `citas` (`id_cita`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cita_servicio_servicios` FOREIGN KEY (`id_servicio`) REFERENCES `servicios` (`id_servicio`) ON UPDATE CASCADE,
  CONSTRAINT `chk_cita_precio` CHECK (`precio_aplicado` >= 0),
  CONSTRAINT `chk_cita_cantidad` CHECK (`cantidad` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `cita_servicio` (`id_cita`, `id_servicio`, `precio_aplicado`, `cantidad`, `observaciones`) VALUES
	(1, 1, 60000.00, 1, 'Servicio de ejemplo asociado a la cita');

-- 12. Tabla datavet.consultas_medicas
CREATE TABLE IF NOT EXISTS `consultas_medicas` (
  `id_consulta` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_cita` int(10) unsigned DEFAULT NULL,
  `id_historia` int(10) unsigned NOT NULL,
  `id_veterinario` int(10) unsigned NOT NULL,
  `fecha_consulta` datetime NOT NULL DEFAULT current_timestamp(),
  `sintomas` text DEFAULT NULL,
  `diagnostico` text DEFAULT NULL,
  `tratamiento_resumen` text DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `estado` varchar(50) NOT NULL DEFAULT 'Finalizada',
  PRIMARY KEY (`id_consulta`),
  UNIQUE KEY `id_cita` (`id_cita`),
  KEY `fk_consultas_veterinarios` (`id_veterinario`),
  KEY `idx_consultas_historia_fecha` (`id_historia`,`fecha_consulta`),
  CONSTRAINT `fk_consultas_citas` FOREIGN KEY (`id_cita`) REFERENCES `citas` (`id_cita`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_consultas_historias` FOREIGN KEY (`id_historia`) REFERENCES `historias_clinicas` (`id_historia`) ON UPDATE CASCADE,
  CONSTRAINT `fk_consultas_veterinarios` FOREIGN KEY (`id_veterinario`) REFERENCES `veterinarios` (`id_veterinario`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `consultas_medicas` (`id_consulta`, `id_cita`, `id_historia`, `id_veterinario`, `fecha_consulta`, `sintomas`, `diagnostico`, `tratamiento_resumen`, `observaciones`, `estado`) VALUES
	(1, 1, 1, 1, '2026-10-09 17:58:19', 'Consulta de control y revision general', 'Evaluacion general sin hallazgos de alarma en este ejemplo', 'Seguimiento preventivo y control veterinario', 'Datos ficticios para pruebas del sistema', 'Finalizada'),
	(2, 2, 2, 2, '2026-10-14 17:58:19', 'Revision preventiva', 'Caso de ejemplo para demostracion', 'Control preventivo', 'Registro ficticio de prueba', 'Finalizada');

-- 13. Tabla datavet.hospitalizaciones
CREATE TABLE IF NOT EXISTS `hospitalizaciones` (
  `id_hospitalizacion` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_mascota` int(10) unsigned NOT NULL,
  `id_veterinario` int(10) unsigned NOT NULL,
  `id_consulta` int(10) unsigned DEFAULT NULL,
  `fecha_ingreso` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_egreso` datetime DEFAULT NULL,
  `motivo` varchar(255) NOT NULL,
  `tratamientos_realizados` text DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `estado` enum('Activa','Finalizada','Cancelada') NOT NULL DEFAULT 'Activa',
  PRIMARY KEY (`id_hospitalizacion`),
  UNIQUE KEY `id_consulta` (`id_consulta`),
  KEY `fk_hospitalizaciones_veterinarios` (`id_veterinario`),
  KEY `idx_hospitalizaciones_mascota` (`id_mascota`),
  KEY `idx_hospitalizaciones_estado` (`estado`),
  CONSTRAINT `fk_hospitalizaciones_consultas` FOREIGN KEY (`id_consulta`) REFERENCES `consultas_medicas` (`id_consulta`) ON UPDATE CASCADE,
  CONSTRAINT `fk_hospitalizaciones_mascotas` FOREIGN KEY (`id_mascota`) REFERENCES `mascotas` (`id_mascota`) ON UPDATE CASCADE,
  CONSTRAINT `fk_hospitalizaciones_veterinarios` FOREIGN KEY (`id_veterinario`) REFERENCES `veterinarios` (`id_veterinario`) ON UPDATE CASCADE,
  CONSTRAINT `chk_hospitalizacion_fechas` CHECK (`fecha_egreso` is null or `fecha_egreso` >= `fecha_ingreso`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `hospitalizaciones` (`id_hospitalizacion`, `id_mascota`, `id_veterinario`, `id_consulta`, `fecha_ingreso`, `fecha_egreso`, `motivo`, `tratamientos_realizados`, `observaciones`, `estado`) VALUES
	(1, 1, 1, 1, '2026-10-18 17:58:19', NULL, 'Observacion clinica de demostracion', 'Monitoreo de ejemplo; no corresponde a un tratamiento real', 'Registro ficticio para probar hospitalizaciones', 'Activa');

-- 14. Tabla datavet.procedimientos
CREATE TABLE IF NOT EXISTS `procedimientos` (
  `id_procedimiento` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_hospitalizacion` int(10) unsigned NOT NULL,
  `id_veterinario` int(10) unsigned NOT NULL,
  `fecha_procedimiento` datetime NOT NULL DEFAULT current_timestamp(),
  `tipo_procedimiento` varchar(120) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  PRIMARY KEY (`id_procedimiento`),
  KEY `fk_procedimientos_hospitalizaciones` (`id_hospitalizacion`),
  KEY `fk_procedimientos_veterinarios` (`id_veterinario`),
  CONSTRAINT `fk_procedimientos_hospitalizaciones` FOREIGN KEY (`id_hospitalizacion`) REFERENCES `hospitalizaciones` (`id_hospitalizacion`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_procedimientos_veterinarios` FOREIGN KEY (`id_veterinario`) REFERENCES `veterinarios` (`id_veterinario`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `procedimientos` (`id_procedimiento`, `id_hospitalizacion`, `id_veterinario`, `fecha_procedimiento`, `tipo_procedimiento`, `descripcion`, `observaciones`) VALUES
	(1, 1, 1, '2026-10-19 17:58:19', 'Examen clinico general', 'Registro de ejemplo para probar procedimientos', 'Datos ficticios de demostracion');

-- 15. Tabla datavet.archivos_procedimiento
CREATE TABLE IF NOT EXISTS `archivos_procedimiento` (
  `id_archivo` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_procedimiento` int(10) unsigned NOT NULL,
  `id_usuario_subio` int(10) unsigned NOT NULL,
  `nombre_archivo` varchar(255) NOT NULL,
  `tipo_archivo` varchar(50) NOT NULL COMMENT 'imagen o pdf',
  `mime_type` varchar(100) NOT NULL COMMENT 'image/jpeg, application/pdf...',
  `ruta_archivo` varchar(500) NOT NULL COMMENT 'Ruta/URL',
  `tamano_bytes` bigint(20) unsigned DEFAULT NULL,
  `fecha_subida` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_archivo`),
  KEY `fk_archivos_procedimientos` (`id_procedimiento`),
  KEY `fk_archivos_usuarios` (`id_usuario_subio`),
  CONSTRAINT `fk_archivos_procedimientos` FOREIGN KEY (`id_procedimiento`) REFERENCES `procedimientos` (`id_procedimiento`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_archivos_usuarios` FOREIGN KEY (`id_usuario_subio`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `archivos_procedimiento` (`id_archivo`, `id_procedimiento`, `id_usuario_subio`, `nombre_archivo`, `tipo_archivo`, `mime_type`, `ruta_archivo`, `tamano_bytes`, `fecha_subida`) VALUES
	(1, 1, 3, 'radiografia_control_max.pdf', 'pdf', 'application/pdf', '/uploads/procedimientos/radiografia_control_max.pdf', 245760, '2026-10-19 18:10:00');

-- 16. Tabla datavet.recetas_medicas
CREATE TABLE IF NOT EXISTS `recetas_medicas` (
  `id_receta` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_consulta` int(10) unsigned NOT NULL,
  `fecha_emision` datetime NOT NULL DEFAULT current_timestamp(),
  `indicaciones_generales` text DEFAULT NULL,
  `estado` enum('Activa','Suspendida','Finalizada','Anulada') NOT NULL DEFAULT 'Activa',
  PRIMARY KEY (`id_receta`),
  KEY `fk_recetas_consultas` (`id_consulta`),
  CONSTRAINT `fk_recetas_consultas` FOREIGN KEY (`id_consulta`) REFERENCES `consultas_medicas` (`id_consulta`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `recetas_medicas` (`id_receta`, `id_consulta`, `fecha_emision`, `indicaciones_generales`, `estado`) VALUES
	(1, 1, '2026-10-19 17:58:19', 'Receta ficticia para probar el modulo. No usar como indicacion medica.', 'Activa');

-- 17. Tabla datavet.detalle_receta
CREATE TABLE IF NOT EXISTS `detalle_receta` (
  `id_detalle` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_receta` int(10) unsigned NOT NULL,
  `id_medicamento` int(10) unsigned NOT NULL,
  `dosis` varchar(120) NOT NULL,
  `frecuencia` varchar(120) DEFAULT NULL,
  `duracion` varchar(120) DEFAULT NULL,
  `instrucciones` text DEFAULT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `fk_detalle_receta_medicamentos` (`id_medicamento`),
  KEY `idx_detalle_receta_receta` (`id_receta`),
  CONSTRAINT `fk_detalle_receta_medicamentos` FOREIGN KEY (`id_medicamento`) REFERENCES `medicamentos` (`id_medicamento`) ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_receta_recetas` FOREIGN KEY (`id_receta`) REFERENCES `recetas_medicas` (`id_receta`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `detalle_receta` (`id_detalle`, `id_receta`, `id_medicamento`, `dosis`, `frecuencia`, `duracion`, `instrucciones`) VALUES
	(1, 1, 1, 'Pendiente de valoracion profesional', 'Segun prescripcion veterinaria', 'Por definir por el veterinario', 'Dato de demostracion: no administrar medicamentos con esta informacion');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
