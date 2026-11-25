/**
 * seed-6-meses.js — Simulación de 6 meses de operación de una clínica veterinaria grande
 *
 * Genera datos realistas y coherentes respetando todas las FK y restricciones:
 * - Catálogo completo de 30 medicamentos veterinarios
 * - Personal adicional (veterinarios especialistas + recepcionistas)
 * - 300 clientes y ~480 mascotas con sus historias clínicas
 * - ~2,700 citas distribuidas en los últimos 180 días, hoy y próximos 5 días
 * - ~2,100 consultas médicas, servicios facturados, recetas y detalles de receta
 * - ~170 hospitalizaciones (incluyendo 8 activas hoy) y ~320 procedimientos
 *
 * Uso: node scripts/seed-6-meses.js
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Generador determinístico rápido (Mulberry32) para resultados reproducibles
function createRng(seed = 20261125) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createRng(20261125);
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const pad = (n) => String(n).padStart(2, '0');

function fmtDateTime(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function fmtDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

async function batchInsert(conn, sqlPrefix, rows, chunkSize = 400) {
  let firstId = null;
  const ids = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const placeholders = chunk.map((r) => `(${r.map(() => '?').join(',')})`).join(',');
    const flat = chunk.flat();
    const [res] = await conn.query(`${sqlPrefix} VALUES ${placeholders}`, flat);
    if (firstId === null) firstId = res.insertId;
    for (let k = 0; k < chunk.length; k++) {
      ids.push(res.insertId + k);
    }
  }
  return ids;
}

/* ── Catálogos realistas ─────────────────────────────────────────────────── */
const MEDICAMENTOS_SEED = [
  ['Amoxicilina + Ácido Clavulánico', 'Tableta', '250 mg'],
  ['Amoxicilina + Ácido Clavulánico Suspensión', 'Suspensión oral', '250 mg / 5 ml'],
  ['Enrofloxacina', 'Tableta', '50 mg'],
  ['Enrofloxacina Inyectable', 'Solución inyectable', '5% (50 mg/ml)'],
  ['Cefalexina', 'Cápsula / Tableta', '500 mg'],
  ['Doxiciclina', 'Tableta', '100 mg'],
  ['Metronidazol', 'Tableta / Suspensión', '250 mg'],
  ['Meloxicam Oral', 'Suspensión oral', '1.5 mg/ml'],
  ['Meloxicam Tabletas', 'Tableta', '2 mg'],
  ['Carprofeno', 'Tableta masticable', '75 mg'],
  ['Tramadol Veterinario', 'Gotas orales', '50 mg/ml'],
  ['Prednisolona', 'Tableta', '20 mg'],
  ['Dipirona Veterinaria', 'Solución inyectable', '500 mg/ml'],
  ['Milbemicina + Praziquantel', 'Tableta', '12.5 mg / 125 mg'],
  ['Ivermectina + Praziquantel + Pirantel', 'Tableta', 'Según rango de peso'],
  ['Fenbendazol', 'Suspensión oral', '10% (100 mg/ml)'],
  ['Fluralaner', 'Tableta masticable', 'Según rango de peso'],
  ['Fipronil + (S)-Metopreno', 'Pipeta spot-on', 'Según rango de peso'],
  ['Maropitant Citrato', 'Tableta', '24 mg'],
  ['Omeprazol', 'Cápsula', '20 mg'],
  ['Sucralfato', 'Suspensión oral', '1 g / 5 ml'],
  ['Metoclopramida', 'Gotas orales', '4 mg/ml'],
  ['Probiótico Gastrointestinal Veterinario', 'Pasta oral / Polvo', 'Multicepa'],
  ['Shampoo Medicado Clorhexidina 2%', 'Shampoo dermatológico', '2%'],
  ['Gotas Óticas (Gentamicina + Betametasona + Clotrimazol)', 'Solución ótica', 'Uso tópico ótico'],
  ['Colirio Tobramicina Veterinaria', 'Solución oftálmica', '0.3%'],
  ['Pomada Cicatrizante (Óxido de Zinc + Alantoína)', 'Pomada tópica', 'Uso tópico'],
  ['Condroprotector (Glucosamina + Condroitina)', 'Tableta masticable', '500 mg / 400 mg'],
  ['Complejo B + Hierro', 'Jarabe oral', 'Uso veterinario'],
  ['Solución Lactato de Ringer', 'Solución intravenosa', '500 ml'],
];

const PERSONAL_CLINICA = [
  { cedula: '1015423890', nombre: 'Valeria Mendoza', email: 'valeria.mendoza@datavet.com', rol: 'Veterinario', especialidad: 'Dermatología Veterinaria', tp: 'TP-VET-004', col: 'COL-2024-004' },
  { cedula: '1020789456', nombre: 'Andres Morales', email: 'andres.morales@datavet.com', rol: 'Veterinario', especialidad: 'Ortopedia y Traumatología', tp: 'TP-VET-005', col: 'COL-2024-005' },
  { cedula: '1032456123', nombre: 'Sofia Vargas', email: 'sofia.vargas@datavet.com', rol: 'Veterinario', especialidad: 'Medicina de Animales Exóticos', tp: 'TP-VET-006', col: 'COL-2024-006' },
  { cedula: '1041234567', nombre: 'Ricardo Salazar', email: 'ricardo.salazar@datavet.com', rol: 'Veterinario', especialidad: 'Cardiología y Medicina Interna', tp: 'TP-VET-007', col: 'COL-2024-007' },
  { cedula: '1052345678', nombre: 'Paula Castellanos', email: 'paula.castellanos@datavet.com', rol: 'Veterinario', especialidad: 'Oftalmología Veterinaria', tp: 'TP-VET-008', col: 'COL-2024-008' },
  { cedula: '1063456789', nombre: 'Javier Montoya', email: 'javier.montoya@datavet.com', rol: 'Veterinario', especialidad: 'Urgencias y Cuidado Crítico', tp: 'TP-VET-009', col: 'COL-2024-009' },
  { cedula: '1018963254', nombre: 'Camila Herrera', email: 'camila.herrera@datavet.com', rol: 'Recepcionista' },
  { cedula: '1074567890', nombre: 'Daniela Ospina', email: 'daniela.ospina@datavet.com', rol: 'Recepcionista' },
];

const NOMBRES = [
  'Valentina', 'Mateo', 'Isabella', 'Sebastian', 'Mariana', 'Alejandro', 'Lucia', 'Daniel',
  'Paula', 'Felipe', 'Gabriela', 'Nicolas', 'Sara', 'Julian', 'Andrea', 'Camilo', 'Natalia',
  'Tomas', 'Manuela', 'Diego', 'Laura', 'Santiago', 'Carolina', 'Esteban', 'Diana', 'Ricardo',
  'Juliana', 'Hector', 'Monica', 'Oscar', 'Fernanda', 'David', 'Alejandra', 'Miguel', 'Claudia',
  'Jorge', 'Patricia', 'Cristian', 'Tatiana', 'Luis', 'Adriana', 'Juan', 'Lina', 'Mauricio',
  'Marcela', 'Eduardo', 'Viviana', 'Rodrigo', 'Sandra', 'Fabian',
];

const APELLIDOS = [
  'Rojas', 'Giraldo', 'Cardenas', 'Pineda', 'Quintero', 'Salazar', 'Benitez', 'Ospina',
  'Navarro', 'Arias', 'Suarez', 'Cortes', 'Becerra', 'Mesa', 'Beltran', 'Duarte', 'Peña',
  'Guerrero', 'Ortega', 'Pardo', 'Rincon', 'Acosta', 'Vega', 'Molina', 'Castellanos', 'Montoya',
  'Forero', 'Ramirez', 'Alvarez', 'Bermudez', 'Gomez', 'Lopez', 'Torres', 'Martinez', 'Moreno',
  'Hernandez', 'Ruiz', 'Castro', 'Vargas', 'Jimenez', 'Diaz', 'Romero', 'Serrano', 'Parra',
];

const BARRIOS = [
  'Chapinero', 'Teusaquillo', 'Suba', 'Cedritos', 'Chicó', 'Usaquén', 'Salitre', 'Normandía',
  'Galerías', 'Santa Bárbara', 'Niza', 'Mazurén', 'Engativá', 'La Soledad', 'Palermo',
  'Quinta Camacho', 'El Nogal', 'Navarra', 'Prado Veraniego', 'Modelia',
];

const NOMBRES_MASCOTA = [
  'Max', 'Luna', 'Rocky', 'Milo', 'Nala', 'Coco', 'Thor', 'Mia', 'Bruno', 'Kira', 'Simba',
  'Lola', 'Zeus', 'Nube', 'Paco', 'Toby', 'Cleo', 'Dante', 'Maya', 'Oreo', 'Bambi', 'Rocco',
  'Sasha', 'Koko', 'Ares', 'Nina', 'Loki', 'Canela', 'Pelusa', 'Apolo', 'Frida', 'Lucas',
  'Bella', 'Toby', 'Koda', 'Chispa', 'Atenea', 'Boby', 'Princesa', 'Tyson', 'Gala', 'Mateo',
  'Kiwi', 'Copo', 'Hulk', 'Sami', 'Moka', 'Bimba', 'Bowie', 'Nilo',
];

const ESPECIES_CONFIG = [
  { especie: 'Perro', pesoMin: 2.5, pesoMax: 42, razas: ['Labrador', 'Golden Retriever', 'Bulldog Francés', 'Poodle', 'Beagle', 'Pastor Alemán', 'Border Collie', 'Shih Tzu', 'Husky Siberiano', 'Criollo', 'Cocker Spaniel', 'Boxer', 'Chihuahua', 'Rottweiler'] },
  { especie: 'Perro', pesoMin: 4, pesoMax: 35, razas: ['Schnauzer', 'Pug', 'Yorkshire Terrier', 'Dálmata', 'Jack Russell', 'Criollo', 'Pitbull', 'Doberman'] },
  { especie: 'Gato', pesoMin: 2.2, pesoMax: 7.5, razas: ['Criollo', 'Siamés', 'Persa', 'Maine Coon', 'Bengalí', 'Azul Ruso', 'Angora', 'Carey', 'British Shorthair'] },
  { especie: 'Conejo', pesoMin: 1.1, pesoMax: 3.4, razas: ['Cabeza de León', 'Holland Lop', 'Angora', 'Mini Rex'] },
  { especie: 'Ave', pesoMin: 0.05, pesoMax: 0.9, razas: ['Cacatúa Ninfa', 'Agapornis', 'Periquito Australiano', 'Loro Amazónico'] },
  { especie: 'Reptil', pesoMin: 0.2, pesoMax: 3.5, razas: ['Tortuga Morrocoy', 'Iguana Verde', 'Gecko Leopardo'] },
];

const COLORES = ['Dorado', 'Blanco', 'Negro', 'Blanco y negro', 'Atigrado', 'Crema', 'Gris', 'Miel', 'Tricolor', 'Canela', 'Café'];

const CASOS_CLINICOS = [
  {
    motivo: 'Control de vacunación anual y desparasitación',
    sintomas: 'Paciente alerta, mucosas rosadas, apetito conservado. Asiste para refuerzo vacunal anual.',
    diagnostico: 'Paciente clínicamente sano apto para inmunización.',
    tratamiento: 'Aplicación de refuerzo vacunal + desparasitante oral según peso corporal.',
    obs: 'Vigilar zona de aplicación 24 h. Próximo control en 12 meses.',
    hospProb: 0.0,
    recetaProb: 0.35,
    servicioIdx: 1,
  },
  {
    motivo: 'Prurito intenso y enrojecimiento dérmico',
    sintomas: 'Rascado frecuente en pabellones auriculares y abdomen ventral desde hace 4 días.',
    diagnostico: 'Dermatitis alérgica por ectoparásitos / atopia leve.',
    tratamiento: 'Baño medicado con clorhexidina 2% cada 4 días y antiparasitario sistémico.',
    obs: 'Control dermatológico en 15 días.',
    hospProb: 0.02,
    recetaProb: 0.85,
    servicioIdx: 0,
  },
  {
    motivo: 'Vómito agudo y decaimiento',
    sintomas: 'Tres episodios de vómito bilioso en las últimas 12 horas, hiporexia y leve deshidratación.',
    diagnostico: 'Gastroenteritis aguda infecciosa / alimentaria.',
    tratamiento: 'Antiemético inyectable, protector gástrico, dieta blanda gastrointestinal y rehidratación.',
    obs: 'Ofrecer agua en pequeñas cantidades. Acudir a urgencias si persiste vómito.',
    hospProb: 0.22,
    recetaProb: 0.9,
    servicioIdx: 0,
  },
  {
    motivo: 'Cojera en miembro posterior derecho',
    sintomas: 'Claudicación grado 2 tras actividad física intensa, dolor moderado a la palpación de rodilla.',
    diagnostico: 'Esguince articular leve / sospecha de distensión ligamentaria.',
    tratamiento: 'Antiinflamatorio oral por 5 días, reposo estricto y compresas frías locales.',
    obs: 'Evitar saltos y escaleras durante 10 días. Control ortopédico de seguimiento.',
    hospProb: 0.05,
    recetaProb: 0.85,
    servicioIdx: 3,
  },
  {
    motivo: 'Limpieza dental y halitosis marcada',
    sintomas: 'Cálculo dental grado II-III en premolares y gingivitis marginal moderada.',
    diagnostico: 'Enfermedad periodontal moderada.',
    tratamiento: 'Profilaxis dental con ultrasonido bajo sedación segura y pulido dental.',
    obs: 'Dieta blanda por 48 h e iniciar cepillado dental 3 veces por semana.',
    hospProb: 0.12,
    recetaProb: 0.7,
    servicioIdx: 4,
  },
  {
    motivo: 'Secreción ocular y conjuntivitis',
    sintomas: 'Epífora bilateral y leve hiperemia conjuntival desde hace 48 horas.',
    diagnostico: 'Conjuntivitis bacteriana leve sin úlcera corneal (test de fluoresceína negativo).',
    tratamiento: 'Limpieza ocular con solución salina estéril y colirio antibiótico cada 8 horas.',
    obs: 'Usar collar isabelino si se frota los ojos. Revisión en 7 días.',
    hospProb: 0.0,
    recetaProb: 0.95,
    servicioIdx: 0,
  },
  {
    motivo: 'Tos seca persistente y estornudos',
    sintomas: 'Tos no productiva tipo graznido y reflejo tusígeno positivo a la palpación traqueal.',
    diagnostico: 'Traqueobronquitis infecciosa leve.',
    tratamiento: 'Antiinflamatorio, antibiótico de amplio espectro y reposo en ambiente cálido.',
    obs: 'Evitar paseos en parques con otros animales durante 10 días.',
    hospProb: 0.06,
    recetaProb: 0.9,
    servicioIdx: 0,
  },
  {
    motivo: 'Herida lacerante en almohadilla plantar',
    sintomas: 'Laceración superficial de 2 cm en miembro anterior izquierdo con sangrado controlado.',
    diagnostico: 'Herida traumática limpia contaminada.',
    tratamiento: 'Lavado antiséptico con clorhexidina, desbridamiento leve, pomada cicatrizante y vendaje.',
    obs: 'Mantener vendaje seco y limpio. Cambio de curación en 48 horas.',
    hospProb: 0.1,
    recetaProb: 0.8,
    servicioIdx: 0,
  },
  {
    motivo: 'Control geriátrico y exámenes de laboratorio',
    sintomas: 'Chequeo preventivo semestral en paciente senior. Signos vitales estables.',
    diagnostico: 'Estado general estable; se solicitan hemograma y química sanguínea de control.',
    tratamiento: 'Suplementación condroprotectora y ajuste nutricional senior.',
    obs: 'Entrega de resultados de laboratorio en 24 horas.',
    hospProb: 0.03,
    recetaProb: 0.5,
    servicioIdx: 3,
  },
  {
    motivo: 'Otitis externa y sacudida frecuente de cabeza',
    sintomas: 'Eritema del conducto auditivo externo izquierdo y exudado ceruminoso oscuro.',
    diagnostico: 'Otitis externa bacteriana / fúngica.',
    tratamiento: 'Limpieza ótica profesional y tratamiento tópico con gotas óticas cada 12 horas por 10 días.',
    obs: 'Evitar entrada de agua en oídos durante el baño.',
    hospProb: 0.0,
    recetaProb: 0.95,
    servicioIdx: 0,
  },
  {
    motivo: 'Urgencia por intoxicación / ingestión de cuerpo extraño',
    sintomas: 'Sialorrea, dolor abdominal agudo, taquicardia leve y letargo.',
    diagnostico: 'Cuadro abdominal agudo con requerimiento de estabilización intrahospitalaria.',
    tratamiento: 'Fluidoterapia IV con Lactato de Ringer, analgesia, antiemético y monitoreo continuo.',
    obs: 'Pronóstico reservado-favorable; seguimiento estricto en hospitalización.',
    hospProb: 0.75,
    recetaProb: 0.85,
    servicioIdx: 5,
  },
];

const PROCEDIMIENTOS_HOSP = [
  ['Fluidoterapia intravenosa continua', 'Administración controlada de Lactato de Ringer según tasa de mantenimiento y reposición.'],
  ['Hemograma y química sanguínea completa', 'Toma de muestra venosa para evaluación hematológica, hepática y renal.'],
  ['Radiografía abdominal / torácica', 'Estudio radiográfico en 2 proyecciones para valoración diagnóstica.'],
  ['Ecografía abdominal FAST', 'Exploración ultrasonográfica de cavidad abdominal sin líquido libre.'],
  ['Monitoreo de signos vitales y analgesia', 'Control horario de FC, FR, temperatura, presión arterial y escala de dolor.'],
  ['Curación y manejo avanzado de herida', 'Lavado antiséptico estéril y renovación de vendaje compresivo.'],
];

const DOSIS_LIST = ['1/2 tableta', '1 tableta', '2 ml vía oral', '5 ml vía oral', '3 gotas cada oído', '2 gotas por ojo', 'Aplicar capa fina'];
const FREC_LIST = ['Cada 8 horas', 'Cada 12 horas', 'Cada 24 horas', 'Dosis única'];
const DUR_LIST = ['5 días', '7 días', '10 días', '14 días', '30 días'];

async function main() {
  const t0 = Date.now();
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'datavet',
  });

  try {
    await conn.beginTransaction();

    // ── 1. Catálogo de medicamentos (idempotente) ────────────────────────────
    for (const [nombre, presentacion, concentracion] of MEDICAMENTOS_SEED) {
      const [[exists]] = await conn.execute(
        'SELECT id_medicamento FROM medicamentos WHERE nombre = ? LIMIT 1',
        [nombre]
      );
      if (!exists) {
        await conn.execute(
          'INSERT INTO medicamentos (nombre, presentacion, concentracion, activo) VALUES (?, ?, ?, 1)',
          [nombre, presentacion, concentracion]
        );
      }
    }
    const [medsRows] = await conn.execute('SELECT id_medicamento FROM medicamentos WHERE activo = 1');
    const medIds = medsRows.map((r) => r.id_medicamento);

    // ── 2. Personal de clínica grande (idempotente por email) ────────────────
    const [rolesRows] = await conn.execute('SELECT id_rol, nombre_rol FROM roles');
    const rolMap = Object.fromEntries(rolesRows.map((r) => [r.nombre_rol, r.id_rol]));
    const defaultHash = await bcrypt.hash('test1234', 10);

    for (const p of PERSONAL_CLINICA) {
      const [[uExist]] = await conn.execute('SELECT id_usuario FROM usuarios WHERE email = ? LIMIT 1', [p.email]);
      let userId = uExist?.id_usuario;
      if (!userId) {
        const [ins] = await conn.execute(
          'INSERT INTO usuarios (id_rol, nombre, email, password_hash, activo, cedula) VALUES (?, ?, ?, ?, 1, ?)',
          [rolMap[p.rol], p.nombre, p.email, defaultHash, p.cedula]
        );
        userId = ins.insertId;
      }
      if (p.rol === 'Veterinario') {
        const [[vExist]] = await conn.execute('SELECT id_veterinario FROM veterinarios WHERE id_usuario = ? LIMIT 1', [userId]);
        if (!vExist) {
          await conn.execute(
            'INSERT INTO veterinarios (id_usuario, colegiado, especialidad, tarjeta_profesional, activo) VALUES (?, ?, ?, ?, 1)',
            [userId, p.col, p.especialidad, p.tp]
          );
        }
      }
    }

    const [vetRows] = await conn.execute('SELECT id_veterinario FROM veterinarios WHERE activo = 1');
    const vetIds = vetRows.map((r) => r.id_veterinario);

    const [recUsers] = await conn.execute(
      `SELECT u.id_usuario FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol WHERE r.nombre_rol IN ('Administrador', 'Recepcionista') AND u.activo = 1`
    );
    const regUserIds = recUsers.map((r) => r.id_usuario);

    const [servRows] = await conn.execute('SELECT id_servicio, precio FROM servicios WHERE activo = 1 ORDER BY id_servicio ASC');
    const [estRows] = await conn.execute('SELECT id_estado, nombre_estado FROM estados_cita');
    const estMap = Object.fromEntries(estRows.map((r) => [r.nombre_estado, r.id_estado]));

    // ── 3. Insertar 300 clientes nuevos ──────────────────────────────────────
    const ahora = new Date();
    const clientesRows = [];
    const totalClientesNuevos = 300;
    const baseCedula = 700000000 + Math.floor(Date.now() / 1000) % 1000000;

    for (let i = 0; i < totalClientesNuevos; i++) {
      const nombre = pick(NOMBRES);
      const apellido = `${pick(APELLIDOS)} ${pick(APELLIDOS)}`;
      const cedula = String(baseCedula + i);
      const tel = `3${randInt(0, 2)}${randInt(0, 9)}${String(randInt(1000000, 9999999))}`;
      const email = `${nombre.toLowerCase()}.${apellido.split(' ')[0].toLowerCase()}.${i + 1}@correo.com`
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const dir = `Calle ${randInt(10, 175)} #${randInt(5, 95)}-${randInt(10, 99)}, ${pick(BARRIOS)}`;
      const fechaReg = addDays(ahora, -randInt(15, 210));
      clientesRows.push([nombre, apellido, email, tel, dir, fmtDateTime(fechaReg), 1, cedula]);
    }

    const clienteIds = await batchInsert(
      conn,
      'INSERT INTO clientes (nombre, apellido, email, telefono, direccion, fecha_registro, activo, cedula)',
      clientesRows
    );

    // ── 4. Insertar ~480 mascotas + historias clínicas ───────────────────────
    const mascotasRows = [];
    const mascotasMeta = []; // para mantener fecha_apertura coherente

    for (const cid of clienteIds) {
      const numPets = rng() < 0.52 ? 1 : rng() < 0.85 ? 2 : 3;
      for (let k = 0; k < numPets; k++) {
        const cfg = pick(ESPECIES_CONFIG);
        const nombre = pick(NOMBRES_MASCOTA);
        const raza = pick(cfg.razas);
        const sexo = rng() < 0.5 ? 'Macho' : 'Hembra';
        const edadDias = randInt(120, 4200);
        const fechaNac = fmtDate(addDays(ahora, -edadDias));
        const peso = Number((cfg.pesoMin + rng() * (cfg.pesoMax - cfg.pesoMin)).toFixed(2));
        const color = pick(COLORES);
        const obs = rng() < 0.25 ? pick([
          'Alérgico a picadura de pulga. Control preventivo.',
          'Paciente nervioso en consulta, manejar con calma.',
          'Seguimiento nutricional y control de peso.',
          'Esquema de vacunación al día.',
          'Paciente senior, realizar control renal anual.',
        ]) : null;
        mascotasRows.push([cid, nombre, cfg.especie, raza, sexo, fechaNac, peso, color, null, obs, 1]);
        mascotasMeta.push({ nombre, apertura: fmtDate(addDays(ahora, -randInt(20, 195))) });
      }
    }

    const mascotaIds = await batchInsert(
      conn,
      'INSERT INTO mascotas (id_cliente, nombre, especie, raza, sexo, fecha_nacimiento, peso, color, microchip, observaciones, activo)',
      mascotasRows
    );

    const historiasRows = mascotaIds.map((mid, idx) => [
      mid,
      mascotasMeta[idx].apertura,
      'Activa',
      `Historia clínica de ${mascotasMeta[idx].nombre}. Seguimiento integral DataVet.`,
    ]);
    const historiaIds = await batchInsert(
      conn,
      'INSERT INTO historias_clinicas (id_mascota, fecha_apertura, estado, observaciones_generales)',
      historiasRows
    );
    const historiaByMascota = new Map();
    mascotaIds.forEach((mid, idx) => historiaByMascota.set(mid, historiaIds[idx]));

    // ── 5. Generar 6 meses de citas (180 días atrás -> hoy -> +5 días) ───────
    const citasRows = [];
    const citasMeta = [];
    const HORAS_SLOTS = [8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18];

    for (let dayOffset = -180; dayOffset <= 5; dayOffset++) {
      const dia = addDays(ahora, dayOffset);
      const dow = dia.getDay(); // 0 = domingo
      let citasDelDia;
      if (dayOffset === 0) {
        citasDelDia = 18; // Hoy bien poblado para Agenda y Sala de Espera
      } else if (dayOffset > 0) {
        citasDelDia = dow === 0 ? 6 : randInt(10, 14);
      } else {
        citasDelDia = dow === 0 ? randInt(6, 10) : randInt(13, 19);
      }

      const usedVetSlot = new Set();

      for (let c = 0; c < citasDelDia; c++) {
        const vetId = vetIds[(c + Math.abs(dayOffset)) % vetIds.length];
        const slot = HORAS_SLOTS[randInt(0, HORAS_SLOTS.length - 1)];
        const slotKey = `${vetId}-${slot}`;
        if (usedVetSlot.has(slotKey)) continue;
        usedVetSlot.add(slotKey);

        const fechaCita = new Date(dia);
        fechaCita.setHours(Math.floor(slot), slot % 1 ? 30 : 0, 0, 0);

        const mascotaId = pick(mascotaIds);
        const caso = pick(CASOS_CLINICOS);
        const userReg = pick(regUserIds);

        let estadoNombre;
        if (dayOffset < 0) {
          const r = rng();
          estadoNombre = r < 0.78 ? 'Atendida' : r < 0.92 ? 'Cancelada' : 'No asistió';
        } else if (dayOffset === 0) {
          if (c < 5) estadoNombre = 'Atendida';
          else if (c < 8) estadoNombre = 'En atención';
          else if (c < 13) estadoNombre = 'Confirmada';
          else if (c < 16) estadoNombre = 'Programada';
          else estadoNombre = 'Cancelada';
        } else {
          estadoNombre = rng() < 0.45 ? 'Confirmada' : 'Programada';
        }

        const fechaCreacion = addDays(fechaCita, -randInt(1, 7));
        citasRows.push([
          mascotaId,
          vetId,
          estMap[estadoNombre],
          userReg,
          fmtDateTime(fechaCita),
          caso.motivo,
          estadoNombre === 'Cancelada' ? 'Cancelada por el propietario con aviso previo.' : null,
          fmtDateTime(fechaCreacion),
        ]);
        citasMeta.push({
          mascotaId,
          vetId,
          fechaCita,
          estadoNombre,
          caso,
          dayOffset,
        });
      }
    }

    const citaIds = await batchInsert(
      conn,
      'INSERT INTO citas (id_mascota, id_veterinario, id_estado, id_usuario_registro, fecha_hora, motivo, observaciones, fecha_creacion)',
      citasRows
    );

    // ── 6. Consultas médicas, servicios, recetas, hospitalizaciones y proc. ──
    const consultasRows = [];
    const consultasMeta = [];
    const citaServRows = [];

    for (let i = 0; i < citaIds.length; i++) {
      const m = citasMeta[i];
      if (m.estadoNombre !== 'Atendida') continue;

      const citaId = citaIds[i];
      const historiaId = historiaByMascota.get(m.mascotaId);

      // Servicio principal de la cita
      const serv = servRows[m.caso.servicioIdx % servRows.length];
      citaServRows.push([citaId, serv.id_servicio, serv.precio, 1, m.caso.motivo]);

      consultasRows.push([
        citaId,
        historiaId,
        m.vetId,
        fmtDateTime(m.fechaCita),
        m.caso.sintomas,
        m.caso.diagnostico,
        m.caso.tratamiento,
        m.caso.obs,
        'Finalizada',
      ]);
      consultasMeta.push({
        mascotaId: m.mascotaId,
        vetId: m.vetId,
        fechaCita: m.fechaCita,
        caso: m.caso,
        dayOffset: m.dayOffset,
      });
    }

    if (citaServRows.length) {
      await batchInsert(
        conn,
        'INSERT INTO cita_servicio (id_cita, id_servicio, precio_aplicado, cantidad, observaciones)',
        citaServRows
      );
    }

    const consultaIds = await batchInsert(
      conn,
      'INSERT INTO consultas_medicas (id_cita, id_historia, id_veterinario, fecha_consulta, sintomas, diagnostico, tratamiento_resumen, observaciones, estado)',
      consultasRows
    );

    // Recetas médicas + hospitalizaciones
    const recetasRows = [];
    const recetasMedCount = [];
    const hospRows = [];
    const hospMeta = [];
    let activeHospCount = 0;

    for (let i = 0; i < consultaIds.length; i++) {
      const consultaId = consultaIds[i];
      const m = consultasMeta[i];

      if (rng() < m.caso.recetaProb) {
        recetasRows.push([
          consultaId,
          fmtDateTime(m.fechaCita),
          'Seguir dosis exacta según peso y completar todo el tratamiento indicado.',
          m.dayOffset > -7 ? 'Activa' : 'Finalizada',
        ]);
        recetasMedCount.push(randInt(1, 3));
      }

      const forceActiveHosp = m.dayOffset >= -3 && activeHospCount < 8 && rng() < 0.35;
      if (forceActiveHosp || rng() < m.caso.hospProb) {
        const isActive = forceActiveHosp && activeHospCount < 8;
        if (isActive) activeHospCount++;

        const fechaIngreso = new Date(m.fechaCita);
        const horasEstancia = randInt(12, 96);
        const fechaEgreso = isActive ? null : new Date(fechaIngreso.getTime() + horasEstancia * 3600 * 1000);

        hospRows.push([
          m.mascotaId,
          m.vetId,
          consultaId,
          fmtDateTime(fechaIngreso),
          fechaEgreso ? fmtDateTime(fechaEgreso) : null,
          m.caso.motivo,
          m.caso.tratamiento,
          isActive
            ? 'Paciente bajo monitoreo clínico continuo en área de hospitalización.'
            : 'Evolución clínica favorable. Egreso autorizado con fórmula médica.',
          isActive ? 'Activa' : 'Finalizada',
        ]);
        hospMeta.push({ vetId: m.vetId, fechaIngreso });
      }
    }

    const recetaIds = recetasRows.length
      ? await batchInsert(
          conn,
          'INSERT INTO recetas_medicas (id_consulta, fecha_emision, indicaciones_generales, estado)',
          recetasRows
        )
      : [];

    const detalleRecetaRows = [];
    for (let i = 0; i < recetaIds.length; i++) {
      const rid = recetaIds[i];
      const count = recetasMedCount[i];
      const usedMeds = new Set();
      for (let k = 0; k < count; k++) {
        const mid = pick(medIds);
        if (usedMeds.has(mid)) continue;
        usedMeds.add(mid);
        detalleRecetaRows.push([
          rid,
          mid,
          pick(DOSIS_LIST),
          pick(FREC_LIST),
          pick(DUR_LIST),
          'Administrar según recomendación del médico veterinario.',
        ]);
      }
    }

    if (detalleRecetaRows.length) {
      await batchInsert(
        conn,
        'INSERT INTO detalle_receta (id_receta, id_medicamento, dosis, frecuencia, duracion, instrucciones)',
        detalleRecetaRows
      );
    }

    const hospIds = hospRows.length
      ? await batchInsert(
          conn,
          'INSERT INTO hospitalizaciones (id_mascota, id_veterinario, id_consulta, fecha_ingreso, fecha_egreso, motivo, tratamientos_realizados, observaciones, estado)',
          hospRows
        )
      : [];

    const procRows = [];
    for (let i = 0; i < hospIds.length; i++) {
      const hid = hospIds[i];
      const hm = hospMeta[i];
      const numProc = randInt(1, 3);
      for (let k = 0; k < numProc; k++) {
        const [tipo, desc] = pick(PROCEDIMIENTOS_HOSP);
        const fProc = new Date(hm.fechaIngreso.getTime() + (k + 1) * 3 * 3600 * 1000);
        procRows.push([hid, hm.vetId, fmtDateTime(fProc), tipo, desc, 'Procedimiento registrado sin complicaciones.']);
      }
    }

    if (procRows.length) {
      await batchInsert(
        conn,
        'INSERT INTO procedimientos (id_hospitalizacion, id_veterinario, fecha_procedimiento, tipo_procedimiento, descripcion, observaciones)',
        procRows
      );
    }

    await conn.commit();

    const elapsedSec = ((Date.now() - t0) / 1000).toFixed(2);
    console.log(JSON.stringify({
      ok: true,
      elapsedSec: Number(elapsedSec),
      insertados: {
        clientes: clienteIds.length,
        mascotas: mascotaIds.length,
        historias_clinicas: historiaIds.length,
        citas: citaIds.length,
        consultas_medicas: consultaIds.length,
        servicios_facturados: citaServRows.length,
        recetas_medicas: recetaIds.length,
        detalle_receta: detalleRecetaRows.length,
        hospitalizaciones: hospIds.length,
        hospitalizaciones_activas_hoy: activeHospCount,
        procedimientos: procRows.length,
      },
    }, null, 2));
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error en seed-6-meses:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
