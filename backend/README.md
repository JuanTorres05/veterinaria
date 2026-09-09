# DATAVET — Backend

API REST para la gestión veterinaria DATAVET, construida con Node.js, Express y MySQL.

## Requisitos

- Node.js 20 o superior
- MySQL 8 o superior

## Configuración

```bash
npm install
cp .env.example .env
```

Configura las credenciales de MySQL y aplica el esquema productivo:

```bash
mysql -u root -p datavet < ../database/schema.sql
```

## Despliegue

Configura `NODE_ENV=production`, un `JWT_SECRET` aleatorio de al menos 32 caracteres
y `CORS_ORIGINS` con los dominios web autorizados separados por comas. Si se usa un
proxy inverso, configura también `TRUST_PROXY=true`.

Inicia el servicio con:

```bash
npm start
```

La API incluye cabeceras de seguridad, CORS restringido, límite de tamaño de cuerpo,
rate limiting y un encabezado `X-Request-Id` para rastrear errores.

## Endpoints principales

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/api/health` | Público |
| POST | `/api/auth/login` | Público |
| POST | `/api/clientes/registrar` | Admin o recepcionista |
| GET | `/api/clientes` | Usuarios autenticados |
| GET | `/api/mascotas/:id` | Usuarios autenticados |
| GET/POST | `/api/citas` | Según rol |
