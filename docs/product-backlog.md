# PRODUCT BACKLOG — PROYECTO DATAVET
## Sistema de Gestión Veterinaria y Expedientes Clínicos

---

### 👥 Información del Proyecto
* **Institución:** SENA — Servicio Nacional de Aprendizaje
* **Programa:** Tecnólogo en Análisis y Desarrollo de Software (ADSO)
* **Autores / Equipo de Desarrollo:**
  * **Juan Esteban Torres Romero** — *Product Owner & Scrum Master*
  * **Diego Jesús Ospitia Fernández** — *Development Team (Backend / QA)*
  * **Yulied Marcela López Ramírez** — *Development Team (Frontend / Mobile)*

---

## 1. Introducción y Contexto del Negocio
En la actualidad, el bienestar de las mascotas y la gestión oportuna de su salud representan un factor crítico en los centros veterinarios. **DATAVET** nace como una solución integral que digitaliza y automatiza los procesos operativos, de recepción, agendamiento de citas, consulta de historias clínicas y monitoreo de pacientes, sustituyendo registros manuales o fragmentados por una arquitectura moderna, segura y transaccional.

### 1.1 Planteamiento y Formulación del Problema
* **Problema:** Procesos manuales lentos, riesgo de registros huérfanos, inconsistencia en citas médicas y falta de control de acceso según los roles del personal clínico.
* **Pregunta Orientadora:** *¿Cómo un sistema de información desacoplado y multiplataforma optimiza la gestión operativa y clínica en centros veterinarios?*
* **Objetivo General:** Construir una plataforma web y móvil transaccional que centralice la gestión de propietarios, pacientes, agenda médica, expedientes clínicos y reportes operacionales en tiempo real.

### 1.2 Arquitectura Técnica Implementada
* **Backend:** Node.js (v20+) + Express + MySQL/MariaDB (InnoDB 3FN) con arquitectura por capas (*Routes, Middlewares, Controllers, Services, Pool*).
* **Frontend Web:** React 19 + Vite + Tailwind CSS + Phosphor Icons + Context API.
* **Mobile:** React Native + Expo + AsyncStorage.
* **Seguridad & Calidad:** JWT, Hash Bcrypt (12 rondas), Esquemas Zod, OpenAPI / Swagger UI y Suite de Pruebas Automatizadas con Vitest (59/59 aprobadas).

---

## 2. Estructura de Épicas e Historias de Usuario

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCT BACKLOG DATAVET                           │
├──────────────────────────────────────┬──────────────────────────────────────┤
│ ÉPICA 1: Acceso, Clientes y Pacientes│ ÉPICA 2: Operación Clínica y Agenda  │
│  • HU-01: Login y Control de Roles   │  • HU-04: Visualización de Agenda    │
│  • HU-02: Registro Unificado         │  • HU-05: Historia Clínica / Ficha   │
│  • HU-03: Listado y Búsqueda         │  • HU-06: Monitoreo de Pacientes     │
│  • HU-07: Protección de Rutas RBAC   │  • HU-08: Persistencia Real de Citas │
│                                      │  • HU-09: Testing y Calidad (Vitest) │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 3. Detalle de Historias de Usuario y Estado Real de Ejecución

### 📌 ÉPICA 1 — Acceso Seguro, Gestión de Propietarios y Pacientes

---

#### 🟢 HU-01: Login del Sistema y Autenticación de Roles
* **Como:** Usuario del sistema (*Administrador, Veterinario o Recepcionista*).
* **Quiero:** Iniciar sesión con mi cédula y contraseña segura.
* **Para:** Acceder únicamente a los módulos y privilegios autorizados para mi perfil.

**Criterios de Aceptación:**
1. Formulario responsivo con validación de campos obligatorios.
2. Verificación de contraseña contra hash Bcrypt en base de datos.
3. Generación y retorno de token JWT firmado.
4. Redirección contextual según el rol autenticado.
5. Bloqueo total de accesos no autenticados (HTTP 401).

| Nº | Tarea Técnica | Responsable | Estimación | Estado |
| :---: | :--- | :---: | :---: | :---: |
| 1.1 | Diseño de tabla `usuarios` y `roles` en MySQL | Backend | 3h | **Terminado** |
| 1.2 | Encriptación de claves con `bcryptjs` (salt 12) | Backend | 2h | **Terminado** |
| 1.3 | Endpoint `POST /api/auth/login` con validación Zod | Backend | 3h | **Terminado** |
| 1.4 | Generación y verificación de firmas JWT | Backend | 3h | **Terminado** |
| 1.5 | Middleware de autorización por rol (`requireRole`) | Backend | 4h | **Terminado** |
| 1.6 | Vista de Login en React con accesos rápidos para demo | Frontend | 4h | **Terminado** |
| 1.7 | Persistencia de sesión en Context API y localStorage | Frontend | 3h | **Terminado** |
| 1.8 | Pruebas unitarias de autenticación con Vitest / Supertest | QA | 3h | **Terminado** |
* **Prioridad:** Urgente | **Estimación:** 25h | **Avance:** 100% ✅

---

#### 🟢 HU-02: Registro Unificado de Cliente y Mascota
* **Como:** Recepcionista o Administrador.
* **Quiero:** Registrar al cliente y a su primera mascota en un solo formulario simultáneo.
* **Para:** Agilizar la atención en recepción y evitar registros parciales o huérfanos.

**Criterios de Aceptación:**
1. Formulario con datos del cliente (*nombre, teléfono, correo, dirección*).
2. Formulario con datos del paciente (*nombre, especie, raza, sexo, peso, color*).
3. Transacción ACID: si falla la mascota, se revierte el cliente (*Rollback*).
4. Feedback visual con confirmación inmediata del registro.

| Nº | Tarea Técnica | Responsable | Estimación | Estado |
| :---: | :--- | :---: | :---: | :---: |
| 2.1 | Diseño de vista `RegistrarPage.jsx` con diseño modular | Frontend | 4h | **Terminado** |
| 2.2 | Validación en tiempo real de campos obligatorios | Frontend | 3h | **Terminado** |
| 2.3 | Endpoint transaccional `POST /api/clientes/registrar` | Backend | 5h | **Terminado** |
| 2.4 | Implementación de `connection.beginTransaction()` y rollback | Backend | 6h | **Terminado** |
| 2.5 | Integración cliente HTTP Axios con interceptores | Frontend | 3h | **Terminado** |
| 2.6 | Feedback visual de éxito con banner y limpieza de form | Frontend | 2h | **Terminado** |
| 2.7 | Pruebas de integración de transacciones atómicas | QA | 3h | **Terminado** |
* **Prioridad:** Alta | **Estimación:** 26h | **Avance:** 100% ✅

---

#### 🟢 HU-03: Directorio y Búsqueda de Pacientes / Clientes
* **Como:** Veterinario o Recepcionista.
* **Quiero:** Consultar y filtrar el listado de clientes y sus mascotas asociadas.
* **Para:** Contactar a los propietarios y acceder al expediente de las mascotas rápidamente.

**Criterios de Aceptación:**
1. Tabla con información de contacto y mascotas registradas por cliente.
2. Buscador reactivo por nombre, teléfono o correo.
3. Botón de acceso directo al expediente médico de cada mascota.
4. Estado de carga y pantalla informativa cuando no hay resultados.

| Nº | Tarea Técnica | Responsable | Estimación | Estado |
| :---: | :--- | :---: | :---: | :---: |
| 3.1 | Endpoint `GET /api/clientes` con JOIN de mascotas | Backend | 3h | **Terminado** |
| 3.2 | Componente de tabla con paginación y diseño limpio | Frontend | 4h | **Terminado** |
| 3.3 | Filtro en tiempo real por término de búsqueda | Frontend | 3h | **Terminado** |
| 3.4 | Enlaces dinámicos a `/mascotas/:id` | Frontend | 2h | **Terminado** |
| 3.5 | Pruebas de rendimiento en consultas con Pool | QA / Dev | 2h | **Terminado** |
* **Prioridad:** Alta | **Estimación:** 14h | **Avance:** 100% ✅

---

#### 🟢 HU-07: Protección de Rutas, Seguridad y Control de Acceso (RBAC)
* **Como:** Administrador del sistema.
* **Quiero:** Que las vistas y los endpoints del API estén protegidos estrictamente por rol.
* **Para:** Prevenir el acceso no autorizado a historiales médicos o configuraciones del sistema.

**Criterios de Aceptación:**
1. Bloqueo de rutas en frontend mediante componente `<PrivateRoute roles={[...]} />`.
2. Redirección automática a login si el token expira o es inválido.
3. Middlewares de Express que validan permisos por rol (403 Forbidden).
4. Menú de navegación adaptable que solo renderiza módulos autorizados.

| Nº | Tarea Técnica | Responsable | Estimación | Estado |
| :---: | :--- | :---: | :---: | :---: |
| 7.1 | Middleware `requireAuth` para extracción de Bearer token | Backend | 3h | **Terminado** |
| 7.2 | Middleware `requireRole` para matriz de privilegios | Backend | 4h | **Terminado** |
| 7.3 | Componente `PrivateRoute.jsx` con protección de rutas | Frontend | 3h | **Terminado** |
| 7.4 | Manejador centralizado de errores HTTP 401 y 403 | Frontend | 2h | **Terminado** |
| 7.5 | Pruebas de seguridad contra acceso no autorizado | QA | 3h | **Terminado** |
* **Prioridad:** Alta | **Estimación:** 15h | **Avance:** 100% ✅

---

### 📌 ÉPICA 2 — Operación Clínica, Agenda Médica, Historial y Calidad

---

#### 🟢 HU-04: Visualización y Gestión de la Agenda Diaria
* **Como:** Veterinario y Recepcionista.
* **Quiero:** Visualizar la agenda de citas del día con pestañas de estado y conteos exactos.
* **Para:** Priorizar la atención médica y organizar el flujo de consultas.

**Criterios de Aceptación:**
1. Selector de fecha con opción de ver todas las citas históricas.
2. Pestañas de estado (*Todas, Pendientes, Atendidas, Canceladas*) con contadores estables y no fluctuantes.
3. Acciones rápidas para cambiar el estado de la cita con un solo clic.
4. Modal interactivo para agendar nuevas citas vinculando cliente, mascota y médico.

| Nº | Tarea Técnica | Responsable | Estimación | Estado |
| :---: | :--- | :---: | :---: | :---: |
| 4.1 | Creación de endpoints `GET /api/citas` y `POST /api/citas` | Backend | 4h | **Terminado** |
| 4.2 | Endpoint `PATCH /api/citas/:id/estado` | Backend | 3h | **Terminado** |
| 4.3 | Vista `AgendaPage.jsx` con filtros por fecha y pestañas | Frontend | 5h | **Terminado** |
| 4.4 | Corrección y estabilización reactiva de contadores de citas | Frontend | 3h | **Terminado** |
| 4.5 | Modal de agendamiento con selector de veterinario real | Frontend | 4h | **Terminado** |
* **Prioridad:** Alta | **Estimación:** 19h | **Avance:** 100% ✅

---

#### 🟢 HU-05: Expediente e Historia Clínica Electrónica
* **Como:** Veterinario.
* **Quiero:** Consultar el historial previo y registrar nuevas consultas médicas a los pacientes.
* **Para:** Garantizar la continuidad en los tratamientos, diagnósticos y prescripciones.

**Criterios de Aceptación:**
1. Ficha del paciente con especie, raza, sexo, peso, color y datos del propietario.
2. Línea de tiempo cronológica con todas las consultas médicas atendidas.
3. Formulario exclusivo para médicos que registra motivo, diagnóstico, tratamiento y notas.
4. Persistencia inmediata en base de datos al guardar la consulta.

| Nº | Tarea Técnica | Responsable | Estimación | Estado |
| :---: | :--- | :---: | :---: | :---: |
| 5.1 | Tabla `historial_clinico` normalizada con FK a `mascotas` y `usuarios` | Backend | 4h | **Terminado** |
| 5.2 | Endpoints `GET /api/mascotas/:id` y `POST /api/mascotas/:id/historial` | Backend | 4h | **Terminado** |
| 5.3 | Interfaz `FichaMascotaPage.jsx` con layout en 2 columnas | Frontend | 5h | **Terminado** |
| 5.4 | Formulario clínico con validación de campos médicos | Frontend | 3h | **Terminado** |
| 5.5 | Pruebas de integración de expediente clínico | QA | 3h | **Terminado** |
* **Prioridad:** Alta | **Estimación:** 19h | **Avance:** 100% ✅

---

#### 🟢 HU-06: Panel de Monitoreo Operativo y Dashboard
* **Como:** Personal administrativo y clínico.
* **Quiero:** Visualizar un panel con indicadores clave (KPIs) y pacientes en clínica.
* **Para:** Tomar decisiones informadas y conocer el estado general del centro veterinario.

**Criterios de Aceptación:**
1. Tarjetas KPI de clientes, mascotas, citas del día y médicos activos.
2. Panel de reportes con gráfico Donut de distribución de citas y barras de concurrencia diaria.
3. Módulo de monitoreo de pacientes en espera y en atención.

| Nº | Tarea Técnica | Responsable | Estimación | Estado |
| :---: | :--- | :---: | :---: | :---: |
| 6.1 | Endpoint `GET /api/citas/dashboard-stats` | Backend | 3h | **Terminado** |
| 6.2 | Endpoints de reportes consolidados `GET /api/reportes/*` | Backend | 5h | **Terminado** |
| 6.3 | Vista `DashboardPage.jsx` adaptada a cada rol | Frontend | 4h | **Terminado** |
| 6.4 | Vista `ReportesPage.jsx` con gráficos SVG semánticos | Frontend | 5h | **Terminado** |
| 6.5 | Vista `MonitoreoPage.jsx` de pacientes activos | Frontend | 3h | **Terminado** |
* **Prioridad:** Media | **Estimación:** 20h | **Avance:** 95% ✅

---

#### 🟢 HU-08: Persistencia Real e Integridad de Citas Médicas
* **Como:** Administrador y Veterinario.
* **Quiero:** Que cada cita mantenga integridad de datos y auditoría de cambios en MariaDB.
* **Para:** Evitar inconsistencias de agenda tras recargar la página o cambiar de dispositivo.

**Criterios de Aceptación:**
1. Almacenamiento seguro en MySQL con claves foráneas enlazadas a mascotas y veterinarios.
2. Soporte para estados tipificados (`pendiente`, `atendida`, `cancelada`).
3. Sincronización instantánea entre la agenda del backend y la vista web/móvil.

| Nº | Tarea Técnica | Responsable | Estimación | Estado |
| :---: | :--- | :---: | :---: | :---: |
| 8.1 | Estructura DDL de `citas` y tabla maestra `estados_cita` | Backend | 3h | **Terminado** |
| 8.2 | Validación de horas de atención y conflictos de agenda | Backend | 3h | **Terminado** |
| 8.3 | Actualizaciones atómicas en `citas.service.js` | Backend | 3h | **Terminado** |
| 8.4 | Pruebas de persistencia y concurrencia | QA | 3h | **Terminado** |
* **Prioridad:** Alta | **Estimación:** 12h | **Avance:** 100% ✅

---

#### 🟢 HU-09: Suite de Testing Automatizado y Control de Calidad
* **Como:** Equipo de Desarrollo y Evaluadores.
* **Quiero:** Ejecutar una suite completa de pruebas unitarias y de integración.
* **Para:** Garantizar la estabilidad del sistema, tolerancia a fallos y cumplimiento de la definición de terminado (DoD).

**Criterios de Aceptación:**
1. 100% de los endpoints críticos cubiertos por pruebas automatizadas con Vitest y Supertest.
2. Verificación de códigos de estado HTTP (200, 201, 204, 400, 401, 403, 404, 422).
3. Ejecución continua en terminal mediante comando `npm test`.

| Nº | Tarea Técnica | Responsable | Estimación | Estado |
| :---: | :--- | :---: | :---: | :---: |
| 9.1 | Configuración de entorno de pruebas con Vitest | QA / Dev | 3h | **Terminado** |
| 9.2 | Pruebas de autenticación y generación de JWT (8 tests) | QA | 4h | **Terminado** |
| 9.3 | Pruebas de registro unificado y rollback (12 tests) | QA | 5h | **Terminado** |
| 9.4 | Pruebas de agenda de citas y actualización de estado (15 tests) | QA | 5h | **Terminado** |
| 9.5 | Pruebas de expediente clínico y reportes (24 tests) | QA | 5h | **Terminado** |
* **Prioridad:** Alta | **Estimación:** 22h | **Avance:** 100% (59/59 Tests Pasando) ✅

---

## 4. Tablero Scrum Consolidado (Estado Actual de Ejecución)

| ID | Historia de Usuario | Responsable | Prioridad | Estimación | Estado Scrum | % Avance Real |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **HU-01** | Login y Control de Roles | Backend / Frontend / QA | Urgente | 25 h | **Terminado** | **100%** |
| **HU-02** | Registro Unificado Cliente-Mascota | FullStack Dev / QA | Alta | 26 h | **Terminado** | **100%** |
| **HU-03** | Directorio y Búsqueda de Clientes | Frontend / Backend | Alta | 14 h | **Terminado** | **100%** |
| **HU-04** | Agenda Diaria del Veterinario | Frontend / Backend | Alta | 19 h | **Terminado** | **100%** |
| **HU-05** | Consulta y Registro de Historia Clínica | FullStack Dev / QA | Alta | 19 h | **Terminado** | **100%** |
| **HU-06** | Panel de Monitoreo y Dashboard | Frontend / Backend | Media | 20 h | **Terminado** | **95%** |
| **HU-07** | Protección de Rutas y Control de Acceso | Backend / Frontend | Alta | 15 h | **Terminado** | **100%** |
| **HU-08** | Persistencia Real de Citas en MySQL | Backend / QA | Alta | 12 h | **Terminado** | **100%** |
| **HU-09** | Testing General del Sistema (Vitest) | QA / Dev Team | Alta | 22 h | **Terminado** | **100%** |

### 📊 Resumen Estadístico del Proyecto
* **Total Horas Estimadas:** 172 horas
* **Historias Completadas:** 9 de 9 (8 al 100%, 1 al 95%)
* **Porcentaje Global de Avance del Backlog:** **98.5%**
* **Suite de Pruebas Unitarias:** **59 de 59 aprobadas (100% pasando)**

---

## 5. Criterios de "Definition of Done" (DoD) Cumplidos
1. ✅ **Código Funcional:** Implementado en arquitectura por capas limpia.
2. ✅ **Base de Datos Normalizada:** Tablas en 3FN con claves foráneas, restricciones e integridad transaccional.
3. ✅ **Pruebas Automatizadas:** Ejecución limpia con `npm test` sin errores.
4. ✅ **Seguridad:** Rutas protegidas por JWT y contraseñas encriptadas.
5. ✅ **Documentación OpenAPI:** Swagger interactivo en `/api/docs`.
6. ✅ **Móvil Integrado:** Login, registro, recuperación de clave y logout funcionando en Expo.
