/**
 * seed-mes.js — Simulación de 1 mes de actividad en una clínica veterinaria grande
 *
 * Genera de forma segura e idempotente (dentro de transacción):
 * - Personal adicional (veterinarios especialistas + recepción)
 * - 35 clientes y 55 mascotas con sus historias clínicas
 * - ~180 citas distribuidas en los últimos 30 días, hoy y los próximos 3 días
 * - Consultas médicas, servicios facturados, recetas, hospitalizaciones y procedimientos
 *
 * Uso: node scripts/seed-mes.js
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatDateTime(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function pick(arr, idx) {
  return arr[idx % arr.length];
}

const NUEVO_PERSONAL = [
  {
    cedula: '1015423890',
    nombre: 'Valeria Mendoza',
    email: 'valeria.mendoza@datavet.com',
    rol: 'Veterinario',
    pass: 'test1234',
    especialidad: 'Dermatología Veterinaria',
    tarjeta_profesional: 'TP-VET-004',
    colegiado: 'COL-2024-004',
  },
  {
    cedula: '1020789456',
    nombre: 'Andres Morales',
    email: 'andres.morales@datavet.com',
    rol: 'Veterinario',
    pass: 'test1234',
    especialidad: 'Ortopedia y Traumatología',
    tarjeta_profesional: 'TP-VET-005',
    colegiado: 'COL-2024-005',
  },
  {
    cedula: '1032456123',
    nombre: 'Sofia Vargas',
    email: 'sofia.vargas@datavet.com',
    rol: 'Veterinario',
    pass: 'test1234',
    especialidad: 'Medicina de Animales Exóticos',
    tarjeta_profesional: 'TP-VET-006',
    colegiado: 'COL-2024-006',
  },
  {
    cedula: '1018963254',
    nombre: 'Camila Herrera',
    email: 'camila.herrera@datavet.com',
    rol: 'Recepcionista',
    pass: 'test1234',
  },
];

const CLIENTES_SEED = [
  ['Valentina', 'Rojas', '1014235678', '3104567890', 'valentina.rojas@correo.com', 'Calle 85 #15-20, Chapinero'],
  ['Mateo', 'Giraldo', '1022345891', '3115678901', 'mateo.giraldo@correo.com', 'Carrera 7 #45-12, Teusaquillo'],
  ['Isabella', 'Cardenas', '1030987654', '3126789012', 'isabella.cardenas@correo.com', 'Av. Suba #115-40, Suba'],
  ['Sebastian', 'Pineda', '1019876123', '3137890123', 'sebastian.pineda@correo.com', 'Calle 127 #53-18, Prado'],
  ['Mariana', 'Quintero', '1026543210', '3148901234', 'mariana.quintero@correo.com', 'Carrera 15 #93-60, Chicó'],
  ['Alejandro', 'Salazar', '1015678432', '3159012345', 'alejandro.salazar@correo.com', 'Calle 53 #24-10, Galerías'],
  ['Lucia', 'Benitez', '1023456789', '3160123456', 'lucia.benitez@correo.com', 'Carrera 68 #22-35, Salitre'],
  ['Daniel', 'Ospina', '1031234567', '3171234567', 'daniel.ospina@correo.com', 'Calle 140 #12-45, Cedritos'],
  ['Paula', 'Navarro', '1017654321', '3182345678', 'paula.navarro@correo.com', 'Carrera 11 #72-30, Quinta Camacho'],
  ['Felipe', 'Arias', '1028901234', '3193456789', 'felipe.arias@correo.com', 'Calle 116 #18-25, Santa Bárbara'],
  ['Gabriela', 'Suarez', '1016789012', '3204567890', 'gabriela.suarez@correo.com', 'Carrera 50 #3-14, Puente Aranda'],
  ['Nicolas', 'Cortes', '1024567890', '3215678901', 'nicolas.cortes@correo.com', 'Calle 170 #8-50, Toberín'],
  ['Sara', 'Becerra', '1033456781', '3006789012', 'sara.becerra@correo.com', 'Carrera 9 #65-11, Chapinero Alto'],
  ['Julian', 'Mesa', '1012345679', '3017890123', 'julian.mesa@correo.com', 'Calle 26 #69-76, Ciudad Salitre'],
  ['Andrea', 'Beltran', '1021987654', '3028901234', 'andrea.beltran@correo.com', 'Carrera 19 #104-22, Navarra'],
  ['Camilo', 'Duarte', '1034567892', '3049012345', 'camilo.duarte@correo.com', 'Calle 63 #17-40, Chapinero'],
  ['Natalia', 'Peña', '1018765432', '3050123456', 'natalia.pena@correo.com', 'Av. Boyacá #75-18, Engativá'],
  ['Tomas', 'Guerrero', '1029876543', '3101122334', 'tomas.guerrero@correo.com', 'Calle 134 #45-19, Mazurén'],
  ['Manuela', 'Ortega', '1013456780', '3112233445', 'manuela.ortega@correo.com', 'Carrera 13 #59-24, Lourdes'],
  ['Diego', 'Pardo', '1025678901', '3123344556', 'diego.pardo@correo.com', 'Calle 45 #19-30, Palermo'],
  ['Laura', 'Rincon', '1035678903', '3134455667', 'laura.rincon@correo.com', 'Carrera 24 #42-15, La Soledad'],
  ['Santiago', 'Acosta', '1011234568', '3145566778', 'santiago.acosta@correo.com', 'Calle 100 #19-61, Chicó Norte'],
  ['Carolina', 'Vega', '1027890125', '3156677889', 'carolina.vega@correo.com', 'Carrera 70 #52-10, Normandía'],
  ['Esteban', 'Molina', '1036789014', '3167788990', 'esteban.molina@correo.com', 'Calle 72 #10-34, El Nogal'],
  ['Diana', 'Castellanos', '1014567893', '3178899001', 'diana.castellanos@correo.com', 'Carrera 30 #22-18, Gran América'],
  ['Ricardo', 'Montoya', '1023987651', '3189900112', 'ricardo.montoya@correo.com', 'Calle 147 #17-20, Cedro Bolívar'],
  ['Juliana', 'Forero', '1037890126', '3190011223', 'juliana.forero@correo.com', 'Carrera 58 #128-40, Niza'],
  ['Hector', 'Ramirez', '1019234561', '3201122334', 'hector.ramirez@correo.com', 'Calle 19 #4-85, Centro'],
  ['Monica', 'Alvarez', '1026123459', '3212233445', 'monica.alvarez@correo.com', 'Carrera 7 #120-20, Usaquén'],
  ['Oscar', 'Bermudez', '1038901237', '3002233445', 'oscar.bermudez@correo.com', 'Calle 68 #50-12, Barrios Unidos'],
];

const MASCOTAS_PLANTILLA = [
  ['Thor', 'Perro', 'Husky Siberiano', 'Macho', 24.5, 'Gris y blanco'],
  ['Mia', 'Gato', 'Persa', 'Hembra', 3.9, 'Blanco'],
  ['Bruno', 'Perro', 'Rottweiler', 'Macho', 38.0, 'Negro y fuego'],
  ['Kira', 'Perro', 'Border Collie', 'Hembra', 17.2, 'Blanco y negro'],
  ['Simba', 'Gato', 'Maine Coon', 'Macho', 6.8, 'Naranja atigrado'],
  ['Lola', 'Perro', 'Poodle', 'Hembra', 6.4, 'Apricot'],
  ['Zeus', 'Perro', 'Pastor Alemán', 'Macho', 33.4, 'Negro y dorado'],
  ['Nube', 'Conejo', 'Holland Lop', 'Hembra', 1.8, 'Blanco'],
  ['Paco', 'Ave', 'Cacatúa Ninfa', 'Macho', 0.11, 'Gris y amarillo'],
  ['Toby', 'Perro', 'Beagle', 'Macho', 11.6, 'Tricolor'],
  ['Cleo', 'Gato', 'Bengalí', 'Hembra', 4.5, 'Dorado moteado'],
  ['Dante', 'Perro', 'Doberman', 'Macho', 35.0, 'Negro'],
  ['Maya', 'Perro', 'Cocker Spaniel', 'Hembra', 12.1, 'Canela'],
  ['Oreo', 'Gato', 'Criollo', 'Macho', 4.1, 'Blanco y negro'],
  ['Bambi', 'Perro', 'Chihuahua', 'Hembra', 2.4, 'Crema'],
  ['Rocco', 'Perro', 'Boxer', 'Macho', 29.3, 'Atigrado'],
  ['Sasha', 'Gato', 'Azul Ruso', 'Hembra', 3.7, 'Gris azulado'],
  ['Koko', 'Ave', 'Agapornis', 'Macho', 0.06, 'Verde y rojo'],
  ['Ares', 'Perro', 'Pitbull', 'Macho', 26.8, 'Gris'],
  ['Nina', 'Perro', 'Shih Tzu', 'Hembra', 5.2, 'Blanco y café'],
  ['Loki', 'Gato', 'Siamés', 'Macho', 4.8, 'Seal point'],
  ['Canela', 'Perro', 'Criollo', 'Hembra', 14.7, 'Miel'],
  ['Pelusa', 'Conejo', 'Angora', 'Hembra', 2.1, 'Crema'],
  ['Apolo', 'Perro', 'Gran Danés', 'Macho', 54.0, 'Arlequín'],
  ['Frida', 'Gato', 'Carey', 'Hembra', 3.6, 'Tricolor'],
];

const CASOS_CLINICOS = [
  {
    motivo: 'Control de vacunación anual y desparasitación',
    sintomas: 'Paciente alerta, mucosas rosadas, apetito conservado. Asiste para refuerzo vacunal.',
    diagnostico: 'Paciente clínicamente sano apto para inmunización.',
    tratamiento: 'Aplicación de vacuna polivalente/triple felina + desparasitante oral según peso.',
    obs: 'Vigilar zona de aplicación durante 24 horas. Próximo control en 1 año.',
    proc: null,
  },
  {
    motivo: 'Prurito intenso y enrojecimiento en piel',
    sintomas: 'Rascado frecuente en pabellones auriculares y región ventral desde hace 5 días.',
    diagnostico: 'Dermatitis alérgica por ectoparásitos / atopia leve.',
    tratamiento: 'Baño medicado con clorhexidina 2 veces por semana, antiparasitario sistémico y apoquel/corticoide tópico por 7 días.',
    obs: 'Control dermatológico en 15 días para evaluar respuesta.',
    proc: 'Raspado cutáneo y citología ótica',
  },
  {
    motivo: 'Vómitos y decaimiento desde ayer',
    sintomas: 'Tres episodios de emesis alimentaria, leve deshidratación (5%), dolor leve a la palpación epigástrica.',
    diagnostico: 'Gastroenteritis aguda inespecífica.',
    tratamiento: 'Antiemético inyectable (Maropitant), protector gástrico y dieta blanda gastrointestinal por 5 días.',
    obs: 'Si persisten vómitos en 24h, regresar para ecografía abdominal.',
    proc: 'Ecografía abdominal focalizada',
  },
  {
    motivo: 'Cojera en miembro posterior derecho',
    sintomas: 'Apoyo parcial al caminar tras caída jugando en el parque. Dolor moderado en rodilla.',
    diagnostico: 'Esguince articular leve sin evidencia de ruptura de ligamento cruzado.',
    tratamiento: 'Analgésico antiinflamatorio veterinario por 5 días y reposo relativo sin saltos por 10 días.',
    obs: 'Se recomienda control ortopédico si no mejora en 7 días.',
    proc: 'Radiografía de miembro posterior (2 proyecciones)',
  },
  {
    motivo: 'Limpieza dental y mal aliento',
    sintomas: 'Acúmulo moderado de sarro grado II y gingivitis marginal en premolares.',
    diagnostico: 'Enfermedad periodontal grado II.',
    tratamiento: 'Profilaxis dental ultrasónica bajo anestesia inhalatoria, pulido y antiséptico oral.',
    obs: 'Iniciar cepillado dental progresivo 3 veces por semana.',
    proc: 'Perfil prequirúrgico y profilaxis dental',
  },
  {
    motivo: 'Control geriátrico semestral',
    sintomas: 'Paciente senior estable, ligera disminución de actividad física en las mañanas.',
    diagnostico: 'Osteoartritis leve asociada a la edad; función cardiorrespiratoria estable.',
    tratamiento: 'Condroprotector oral diario y ajuste de dieta senior.',
    obs: 'Repetir cuadro hemático y química sanguínea en 6 meses.',
    proc: 'Cuadro hemático y perfil renal/hepático',
  },
  {
    motivo: 'Secreción ocular y estornudos',
    sintomas: 'Epífora bilateral serosa y estornudos ocasionales sin fiebre.',
    diagnostico: 'Rinotraqueítis viral leve / conjuntivitis.',
    tratamiento: 'Limpieza ocular con solución estéril + colirio antibiótico cada 8h por 7 días.',
    obs: 'Mantener aislado de otras mascotas mientras duren los síntomas.',
    proc: null,
  },
];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'datavet',
  });

  console.log('\n🚀 Iniciando simulación de 1 mes en clínica veterinaria grande...\n');

  try {
    await conn.beginTransaction();

    // 1. Insertar personal adicional (veterinarios especialistas + recepción)
    const passwordHash = await bcrypt.hash('test1234', 10);
    for (const p of NUEVO_PERSONAL) {
      const [[rolRow]] = await conn.execute('SELECT id_rol FROM roles WHERE nombre_rol = ? LIMIT 1', [p.rol]);
      if (!rolRow) continue;

      const [[existingUser]] = await conn.execute('SELECT id_usuario FROM usuarios WHERE email = ? OR cedula = ? LIMIT 1', [p.email, p.cedula]);
      let userId;
      if (existingUser) {
        userId = existingUser.id_usuario;
      } else {
        const [uRes] = await conn.execute(
          'INSERT INTO usuarios (id_rol, nombre, email, password_hash, activo, cedula) VALUES (?, ?, ?, ?, 1, ?)',
          [rolRow.id_rol, p.nombre, p.email, passwordHash, p.cedula]
        );
        userId = uRes.insertId;
      }

      if (p.rol === 'Veterinario') {
        const [[existingVet]] = await conn.execute('SELECT id_veterinario FROM veterinarios WHERE id_usuario = ? LIMIT 1', [userId]);
        if (!existingVet) {
          await conn.execute(
            'INSERT INTO veterinarios (id_usuario, colegiado, especialidad, tarjeta_profesional, activo) VALUES (?, ?, ?, ?, 1)',
            [userId, p.colegiado, p.especialidad, p.tarjeta_profesional]
          );
        }
      }
    }

    // Obtener todos los veterinarios activos, recepcionistas, estados, servicios y medicamentos
    const [vets] = await conn.execute('SELECT id_veterinario FROM veterinarios WHERE activo = 1 ORDER BY id_veterinario ASC');
    const [receps] = await conn.execute(
      `SELECT u.id_usuario FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol WHERE r.nombre_rol IN ('Recepcionista', 'Administrador') AND u.activo = 1`
    );
    const [estadosRows] = await conn.execute('SELECT id_estado, nombre_estado FROM estados_cita');
    const estadoByName = Object.fromEntries(estadosRows.map((e) => [e.nombre_estado, e.id_estado]));
    const [servicios] = await conn.execute('SELECT id_servicio, precio FROM servicios WHERE activo = 1');
    const [medicamentos] = await conn.execute('SELECT id_medicamento FROM medicamentos WHERE activo = 1');

    // 2. Insertar 30 clientes nuevos + 50 mascotas nuevas
    const mascotaIds = [];
    const [existingMascotas] = await conn.execute('SELECT id_mascota FROM mascotas WHERE activo = 1');
    for (const m of existingMascotas) mascotaIds.push(m.id_mascota);

    let petTemplateIdx = 0;
    for (let i = 0; i < CLIENTES_SEED.length; i++) {
      const [nombre, apellido, cedula, telefono, email, direccion] = CLIENTES_SEED[i];
      const [[existingCliente]] = await conn.execute(
        'SELECT id_cliente FROM clientes WHERE cedula = ? OR email = ? LIMIT 1',
        [cedula, email]
      );

      let clienteId;
      if (existingCliente) {
        clienteId = existingCliente.id_cliente;
      } else {
        const [cRes] = await conn.execute(
          'INSERT INTO clientes (nombre, apellido, email, telefono, direccion, activo, cedula) VALUES (?, ?, ?, ?, ?, 1, ?)',
          [nombre, apellido, email, telefono, direccion, cedula]
        );
        clienteId = cRes.insertId;

        // 1 o 2 mascotas por cliente (alrededor de 50 mascotas nuevas)
        const numPets = i % 3 === 0 ? 2 : 1;
        for (let j = 0; j < numPets; j++) {
          const tpl = pick(MASCOTAS_PLANTILLA, petTemplateIdx++);
          const petName = j === 1 ? `${tpl[0]} Jr.` : tpl[0];
          const birthYear = 2018 + ((i + j) % 7);
          const birthMonth = 1 + ((i * 3 + j) % 12);
          const birthDay = 1 + ((i * 5 + j) % 27);
          const fechaNac = `${birthYear}-${pad(birthMonth)}-${pad(birthDay)}`;

          const [mRes] = await conn.execute(
            `INSERT INTO mascotas (id_cliente, nombre, especie, raza, sexo, fecha_nacimiento, peso, color, observaciones, activo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [clienteId, petName, tpl[1], tpl[2], tpl[3], fechaNac, tpl[4], tpl[5], 'Paciente registrado en simulación mensual']
          );
          const mId = mRes.insertId;
          mascotaIds.push(mId);

          await conn.execute(
            `INSERT INTO historias_clinicas (id_mascota, fecha_apertura, estado, observaciones_generales)
             VALUES (?, DATE_SUB(CURDATE(), INTERVAL 35 DAY), 'Activa', ?)`,
            [mId, `Historia clínica integral de ${petName}.`]
          );
        }
      }
    }

    // Mapear historias clínicas por mascota
    const [historiasRows] = await conn.execute('SELECT id_historia, id_mascota FROM historias_clinicas');
    const historiaPorMascota = Object.fromEntries(historiasRows.map((h) => [h.id_mascota, h.id_historia]));

    // 3. Generar citas en los últimos 30 días, hoy y próximos 3 días
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Slots posibles de 08:00 a 18:30 cada 30 min
    const SLOTS = [];
    for (let h = 8; h <= 18; h++) {
      SLOTS.push([h, 0]);
      if (h < 18) SLOTS.push([h, 30]);
    }

    let totalCitas = 0;
    let totalConsultas = 0;
    let totalProcedimientos = 0;
    let totalRecetas = 0;
    let cursorMascota = 0;
    let cursorCaso = 0;

    for (let dayOffset = -30; dayOffset <= 3; dayOffset++) {
      const fechaDia = addDays(hoy, dayOffset);
      const dow = fechaDia.getDay(); // 0=Dom, 6=Sab

      // Volumen realista: domingo 2-3 citas, sábado 7 citas, L-V 5-6 citas
      const citasDelDia = dayOffset === 0
        ? 12
        : dow === 0
        ? 2 + (Math.abs(dayOffset) % 2)
        : dow === 6
        ? 7
        : 5 + (Math.abs(dayOffset) % 2);

      const usedVetSlot = new Set();

      for (let k = 0; k < citasDelDia; k++) {
        const vet = vets[(k + Math.abs(dayOffset)) % vets.length];
        const slot = SLOTS[(k * 2 + Math.abs(dayOffset)) % SLOTS.length];
        const dt = new Date(fechaDia);
        dt.setHours(slot[0], slot[1], 0, 0);
        const fechaHoraStr = formatDateTime(dt);

        const vetSlotKey = `${vet.id_veterinario}-${fechaHoraStr}`;
        if (usedVetSlot.has(vetSlotKey)) continue;
        usedVetSlot.add(vetSlotKey);

        // Verificar que no exista ya en BD para ese vet y hora
        const [[yaExiste]] = await conn.execute(
          'SELECT id_cita FROM citas WHERE id_veterinario = ? AND fecha_hora = ? LIMIT 1',
          [vet.id_veterinario, fechaHoraStr]
        );
        if (yaExiste) continue;

        const mascotaId = mascotaIds[cursorMascota % mascotaIds.length];
        cursorMascota++;
        const caso = CASOS_CLINICOS[cursorCaso % CASOS_CLINICOS.length];
        cursorCaso++;
        const recepId = receps[(k + cursorMascota) % receps.length]?.id_usuario || null;

        // Determinar estado según si es pasado, hoy o futuro
        let nombreEstado = 'Programada';
        if (dayOffset < 0) {
          const mod = (k + Math.abs(dayOffset)) % 12;
          if (mod === 0) nombreEstado = 'Cancelada';
          else if (mod === 11) nombreEstado = 'No asistió';
          else nombreEstado = 'Atendida';
        } else if (dayOffset === 0) {
          if (k < 3) nombreEstado = 'Atendida';
          else if (k < 5) nombreEstado = 'En atención';
          else if (k < 8) nombreEstado = 'Confirmada';
          else if (k < 11) nombreEstado = 'Programada';
          else nombreEstado = 'Cancelada';
        } else {
          nombreEstado = k % 2 === 0 ? 'Confirmada' : 'Programada';
        }

        const estadoId = estadoByName[nombreEstado] || estadoByName['Programada'];
        const obsCita = nombreEstado === 'Cancelada'
          ? 'Propietario solicitó reprogramación telefónica'
          : nombreEstado === 'No asistió'
          ? 'No se presentó a la hora programada'
          : 'Agendamiento regular';

        const [citaRes] = await conn.execute(
          `INSERT INTO citas (id_mascota, id_veterinario, id_estado, id_usuario_registro, fecha_hora, motivo, observaciones)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [mascotaId, vet.id_veterinario, estadoId, recepId, fechaHoraStr, caso.motivo, obsCita]
        );
        const citaId = citaRes.insertId;
        totalCitas++;

        // Asociar servicio facturado si no fue cancelada/no asistió
        if (nombreEstado !== 'Cancelada' && nombreEstado !== 'No asistió' && servicios.length > 0) {
          const srv = servicios[(k + totalCitas) % servicios.length];
          await conn.execute(
            'INSERT INTO cita_servicio (id_cita, id_servicio, precio_aplicado, cantidad, observaciones) VALUES (?, ?, ?, 1, ?)',
            [citaId, srv.id_servicio, srv.precio, caso.motivo]
          );
        }

        // Si fue Atendida, crear consulta médica + receta (60%) + procedimiento/hosp (cuando aplica)
        if (nombreEstado === 'Atendida') {
          const historiaId = historiaPorMascota[mascotaId];
          if (historiaId) {
            const [consRes] = await conn.execute(
              `INSERT INTO consultas_medicas
                (id_cita, id_historia, id_veterinario, fecha_consulta, sintomas, diagnostico, tratamiento_resumen, observaciones, estado)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Finalizada')`,
              [citaId, historiaId, vet.id_veterinario, fechaHoraStr, caso.sintomas, caso.diagnostico, caso.tratamiento, caso.obs]
            );
            const consultaId = consRes.insertId;
            totalConsultas++;

            // Receta médica en ~60% de consultas
            if (totalConsultas % 5 !== 0 && medicamentos.length > 0) {
              const [recRes] = await conn.execute(
                `INSERT INTO recetas_medicas (id_consulta, fecha_emision, indicaciones_generales, estado)
                 VALUES (?, ?, ?, 'Activa')`,
                [consultaId, fechaHoraStr, 'Administrar según horario indicado y completar esquema.']
              );
              const med = medicamentos[totalConsultas % medicamentos.length];
              await conn.execute(
                `INSERT INTO detalle_receta (id_receta, id_medicamento, dosis, frecuencia, duracion, instrucciones)
                 VALUES (?, ?, 'Según peso corporal', 'Cada 12 horas', '7 días', 'Administrar después de alimento')`,
                [recRes.insertId, med.id_medicamento]
              );
              totalRecetas++;
            }

            // Procedimiento diagnóstico / hospitalización breve si el caso clínico lo requiere
            if (caso.proc && totalConsultas % 2 === 0) {
              const egreso = new Date(dt.getTime() + 90 * 60000);
              const [hospRes] = await conn.execute(
                `INSERT INTO hospitalizaciones
                  (id_mascota, id_veterinario, id_consulta, fecha_ingreso, fecha_egreso, motivo, tratamientos_realizados, observaciones, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Finalizada')`,
                [
                  mascotaId,
                  vet.id_veterinario,
                  consultaId,
                  fechaHoraStr,
                  formatDateTime(egreso),
                  caso.proc,
                  caso.tratamiento,
                  'Paciente estable al egreso ambulatorio.',
                ]
              );
              await conn.execute(
                `INSERT INTO procedimientos
                  (id_hospitalizacion, id_veterinario, fecha_procedimiento, tipo_procedimiento, descripcion, observaciones)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  hospRes.insertId,
                  vet.id_veterinario,
                  fechaHoraStr,
                  caso.proc,
                  `${caso.proc} realizado sin complicaciones. ${caso.diagnostico}`,
                  caso.obs,
                ]
              );
              totalProcedimientos++;
            }
          }
        }
      }
    }

    await conn.commit();

    console.log('✅ Simulación mensual completada exitosamente:');
    console.log(`   • Veterinarios activos:    ${vets.length}`);
    console.log(`   • Mascotas activas:        ${mascotaIds.length}`);
    console.log(`   • Citas nuevas creadas:    ${totalCitas} (últimos 30 días + hoy + próximos 3 días)`);
    console.log(`   • Consultas médicas:       ${totalConsultas}`);
    console.log(`   • Recetas emitidas:        ${totalRecetas}`);
    console.log(`   • Procedimientos clínicos: ${totalProcedimientos}\n`);
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error en la simulación mensual (rollback aplicado):', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
