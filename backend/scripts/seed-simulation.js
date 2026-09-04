import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const NOMBRES_VETS = [
  "Dra. Camila Morales", "Dr. Alejandro Torres", "Dra. Valentina Ríos", "Dr. Santiago Mendoza", 
  "Dra. Mariana Gómez", "Dr. Mateo Fernández", "Dra. Lucía Hernández", "Dr. Sebastián Ramírez", 
  "Dra. Sofía Martínez", "Dr. Nicolás Vargas", "Dra. Isabella Castro", "Dr. Samuel Guerrero", 
  "Dra. Gabriela Suárez", "Dr. Emmanuel Benítez", "Dra. Natalia Paredes", "Dr. Andrés Felipe Silva", 
  "Dra. Paula Andrea Ruiz", "Dr. Felipe Cárdenas", "Dra. Daniela Ospina", "Dr. Esteban Salazar", 
  "Dra. Valeria Jaramillo", "Dr. Tomás Echeverri", "Dra. Manuela Restrepo", "Dr. Jerónimo Villegas", 
  "Dra. Salomé Cardona", "Dr. Juan José Quintero", "Dra. Antonia Bedoya", "Dr. Maximiliano Arenas", 
  "Dra. Regina Londoño", "Dr. Emilio Aristizábal", "Dra. Renata Monsalve", "Dr. Joaquín Botero", 
  "Dra. Josefina Giraldo", "Dr. Agustín Zuluaga", "Dra. Victoria Henao", "Dr. Cristóbal Marín", 
  "Dra. Elena Arango"
];

const CLIENTES = [
  { nombre: "Laura Marcela Pérez", telefono: "3001234567", correo: "laura.perez@email.com" },
  { nombre: "Carlos Eduardo Gómez", telefono: "3109876543", correo: "carlos.gomez@email.com" },
  { nombre: "Ana María Rodríguez", telefono: "3204567890", correo: "ana.rodriguez@email.com" },
  { nombre: "Juan David Martínez", telefono: "3156789012", correo: "juan.martinez@email.com" },
  { nombre: "Diana Constanza López", telefono: "3182345678", correo: "diana.lopez@email.com" },
  { nombre: "Felipe Andrés Sánchez", telefono: "3113456789", correo: "felipe.sanchez@email.com" },
  { nombre: "Carolina Hernández", telefono: "3024567890", correo: "carolina.hernandez@email.com" },
  { nombre: "Jorge Luis Díaz", telefono: "3165678901", correo: "jorge.diaz@email.com" },
  { nombre: "Paola Andrea Moreno", telefono: "3176789012", correo: "paola.moreno@email.com" },
  { nombre: "Ricardo Antonio Jiménez", telefono: "3047890123", correo: "ricardo.jimenez@email.com" },
  { nombre: "Andrea del Pilar Romero", telefono: "3018901234", correo: "andrea.romero@email.com" },
  { nombre: "Gabriel Francisco Navarro", telefono: "3219012345", correo: "gabriel.navarro@email.com" },
  { nombre: "Patricia Elena Morales", telefono: "3120123456", correo: "patricia.morales@email.com" },
  { nombre: "Gustavo Adolfo Castro", telefono: "3131234567", correo: "gustavo.castro@email.com" },
  { nombre: "Adriana Lucía Ortiz", telefono: "3142345678", correo: "adriana.ortiz@email.com" },
  { nombre: "Mauricio Alberto Silva", telefono: "3053456789", correo: "mauricio.silva@email.com" },
  { nombre: "Claudia Patricia Ramos", telefono: "3064567890", correo: "claudia.ramos@email.com" },
  { nombre: "Oscar Javier Vargas", telefono: "3075678901", correo: "oscar.vargas@email.com" },
  { nombre: "Verónica Isabel Reyes", telefono: "3086789012", correo: "veronica.reyes@email.com" },
  { nombre: "Hernán Darío Mendoza", telefono: "3097890123", correo: "hernan.mendoza@email.com" },
];

const MASCOTAS_DATA = [
  { nombre: "Luna", especie: "Perro", raza: "Golden Retriever" },
  { nombre: "Thor", especie: "Perro", raza: "Pastor Alemán" },
  { nombre: "Simba", especie: "Gato", raza: "Persa" },
  { nombre: "Milo", especie: "Gato", raza: "Siamés" },
  { nombre: "Rocky", especie: "Perro", raza: "Bulldog Francés" },
  { nombre: "Nala", especie: "Perro", raza: "Labrador" },
  { nombre: "Felix", especie: "Gato", raza: "Criollo / Mestizo" },
  { nombre: "Paco", especie: "Ave", raza: "Loro Real" },
  { nombre: "Kira", especie: "Perro", raza: "Beagle" },
  { nombre: "Zeus", especie: "Perro", raza: "Rottweiler" },
  { nombre: "Coco", especie: "Conejo", raza: "Holandés Enano" },
  { nombre: "Mia", especie: "Gato", raza: "Angora" },
  { nombre: "Max", especie: "Perro", raza: "Pug" },
  { nombre: "Toby", especie: "Perro", raza: "Siberian Husky" },
  { nombre: "Garfield", especie: "Gato", raza: "Maine Coon" },
  { nombre: "Tomy", especie: "Ave", raza: "Canario" },
  { nombre: "Iggy", especie: "Reptil", raza: "Iguana Verde" },
  { nombre: "Bruno", especie: "Perro", raza: "Dóberman" },
  { nombre: "Sasha", especie: "Gato", raza: "Sphynx" },
  { nombre: "Lola", especie: "Perro", raza: "Shih Tzu" },
  { nombre: "Beto", especie: "Perro", raza: "Boxer" },
  { nombre: "Chispa", especie: "Perro", raza: "Poodle" },
  { nombre: "Cleo", especie: "Gato", raza: "Bengalí" },
  { nombre: "Rambo", especie: "Perro", raza: "Pitbull" },
  { nombre: "Niebla", especie: "Conejo", raza: "Cabeza de León" },
];

const MOTIVOS = [
  "Consulta de rutina y vacunación anual",
  "Chequeo odontológico y profilaxis",
  "Desparasitación interna y externa",
  "Evaluación por inapetencia y decaimiento",
  "Control post-operatorio y retiro de puntos",
  "Revisión dermatológica por picazón excesiva",
  "Control de peso y formulación nutricional",
  "Ecografía abdominal preventiva",
  "Corte de uñas y limpieza ótica",
  "Curación de herida en extremidad posterior",
  "Valoración ortopédica por cojera",
  "Exámenes de laboratorio de sangre (Cuadro hemo)",
  "Vacuna antirrábica y triple felina",
  "Limpieza de sacos anales",
  "Consulta por tos canina / traqueobronquitis"
];

async function seedSimulation() {
  console.log("🚀 Iniciando simulación masiva de datos DataVet (20 Pacientes, 37 Veterinarios, Citas e Historias)...");
  
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'datavet',
  });

  try {
    const passwordHash = await bcrypt.hash("123456", 10);

    // 1. Obtener ID del rol veterinario
    const [[rolVet]] = await conn.query("SELECT id FROM roles WHERE nombre = 'veterinario'");
    const rolVetId = rolVet ? rolVet.id : 2;

    // 2. Insertar 37 Veterinarios en `usuarios`
    console.log("🩺 Insertando 37 Veterinarios profesionales...");
    const vetIds = [];
    for (let i = 0; i < NOMBRES_VETS.length; i++) {
      const nombre = NOMBRES_VETS[i];
      const cedula = `10998800${(i + 1).toString().padStart(2, '0')}`;
      
      const [res] = await conn.query(
        `INSERT INTO usuarios (cedula, nombre, password_hash, rol_id, activo)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = 1`,
        [cedula, nombre, passwordHash, rolVetId]
      );

      // Si fue insert o existía, obtenemos su ID
      const [[row]] = await conn.query("SELECT id FROM usuarios WHERE cedula = ?", [cedula]);
      if (row) vetIds.push(row.id);
    }
    console.log(`✅ ${vetIds.length} Veterinarios activos confirmados.`);

    // 3. Insertar 20 Clientes
    console.log("👤 Insertando 20 Clientes/Propietarios...");
    const clienteIds = [];
    for (const c of CLIENTES) {
      const [res] = await conn.query(
        `INSERT INTO clientes (nombre, telefono, correo)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), telefono = VALUES(telefono)`,
        [c.nombre, c.telefono, c.correo]
      );

      const [[row]] = await conn.query("SELECT id FROM clientes WHERE correo = ?", [c.correo]);
      if (row) clienteIds.push(row.id);
    }
    console.log(`✅ ${clienteIds.length} Clientes registrados.`);

    // 4. Insertar Mascotas para los Clientes
    console.log("🐾 Insertando 25 Mascotas distribuidas entre los clientes...");
    const mascotaIds = [];
    for (let i = 0; i < MASCOTAS_DATA.length; i++) {
      const m = MASCOTAS_DATA[i];
      const clienteId = clienteIds[i % clienteIds.length];

      const [res] = await conn.query(
        `INSERT INTO mascotas (cliente_id, nombre, especie, raza)
         VALUES (?, ?, ?, ?)`,
        [clienteId, m.nombre, m.especie, m.raza]
      );
      mascotaIds.push(res.insertId);
    }
    console.log(`✅ ${mascotaIds.length} Mascotas registradas.`);

    // 5. Generar Citas (Hoy 29 de Agosto y días vecinos)
    console.log("📅 Generando citas médicas distribuidas...");
    
    // Citas para HOY (29 de Agosto 2026)
    const hoyStr = "2026-08-29";
    const horasHoy = ["08:00:00", "08:30:00", "09:15:00", "10:00:00", "10:45:00", "11:30:00", "14:00:00", "14:45:00", "15:30:00", "16:15:00", "17:00:00"];
    
    let totalCitas = 0;
    
    // Generar 11 citas para hoy
    for (let i = 0; i < horasHoy.length; i++) {
      const mascotaId = mascotaIds[i % mascotaIds.length];
      const vetId     = vetIds[i % vetIds.length];
      const fechaHora = `${hoyStr} ${horasHoy[i]}`;
      const motivo    = MOTIVOS[i % MOTIVOS.length];
      const estado    = i % 3 === 0 ? 'atendida' : (i % 5 === 0 ? 'cancelada' : 'pendiente');

      await conn.query(
        `INSERT INTO citas (mascota_id, usuario_id, fecha_hora, motivo, estado)
         VALUES (?, ?, ?, ?, ?)`,
        [mascotaId, vetId, fechaHora, motivo, estado]
      );
      totalCitas++;
    }

    // Generar 20 citas para fechas pasadas y futuras
    const fechasOtras = ["2026-08-27", "2026-08-28", "2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02"];
    for (let i = 0; i < 24; i++) {
      const fecha = fechasOtras[i % fechasOtras.length];
      const hora = `${(8 + (i % 9)).toString().padStart(2, '0')}:30:00`;
      const mascotaId = mascotaIds[(i + 5) % mascotaIds.length];
      const vetId     = vetIds[(i + 3) % vetIds.length];
      const fechaHora = `${fecha} ${hora}`;
      const motivo    = MOTIVOS[(i + 2) % MOTIVOS.length];
      const estado    = fecha < hoyStr ? (i % 4 === 0 ? 'cancelada' : 'atendida') : 'pendiente';

      await conn.query(
        `INSERT INTO citas (mascota_id, usuario_id, fecha_hora, motivo, estado)
         VALUES (?, ?, ?, ?, ?)`,
        [mascotaId, vetId, fechaHora, motivo, estado]
      );
      totalCitas++;
    }

    console.log(`✅ ${totalCitas} Citas programadas e integradas a la agenda.`);

    // 6. Generar Historial Clínico para varias mascotas
    console.log("🩺 Generando historias clínicas detalladas...");
    let totalHistorias = 0;
    for (let i = 0; i < 15; i++) {
      const mascotaId = mascotaIds[i % mascotaIds.length];
      const vetId     = vetIds[i % vetIds.length];
      const fecha     = `2026-08-${(15 + i).toString().padStart(2, '0')} 10:30:00`;
      
      await conn.query(
        `INSERT INTO historial_clinico (mascota_id, usuario_id, fecha, motivo, diagnostico, tratamiento, notas)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          mascotaId,
          vetId,
          fecha,
          MOTIVOS[i % MOTIVOS.length],
          `Diagnóstico clínico de control para ${MASCOTAS_DATA[i % MASCOTAS_DATA.length].nombre}. Cuadro estable sin signos de infección aguda.`,
          `Administrar suplemento multivitamínico 1 tab/día por 15 días. Dieta blanda de proteínas.`,
          `Reagendar control en 30 días o si presenta cambios de apetito.`
        ]
      );
      totalHistorias++;
    }
    console.log(`✅ ${totalHistorias} Historias clínicas registradas.`);

    console.log("\n🎉 ¡SIMULACIÓN MASIVA COMPLETADA CON ÉXITO!");
    console.log("📊 Resumen de Datos Generados:");
    console.log(`   • 37 Veterinarios profesionales en tabla usuarios`);
    console.log(`   • 20 Clientes propietarios en tabla clientes`);
    console.log(`   • 25 Mascotas en tabla mascotas`);
    console.log(`   • ${totalCitas} Citas médicas en tabla citas (11 citas hoy)`);
    console.log(`   • ${totalHistorias} Fichas de historial clínico`);

  } catch (err) {
    console.error("❌ Error en la simulación:", err);
  } finally {
    await conn.end();
  }
}

seedSimulation();
