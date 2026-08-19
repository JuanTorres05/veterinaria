// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN (JWT)
// ============================================================================
// Este archivo actúa como un "filtro de seguridad" antes de que las peticiones
// lleguen a las rutas protegidas de nuestra API Express.

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Middleware: requireAuth
 * Verifica que la petición traiga un token JWT válido en los encabezados (Headers).
 * Si no trae token o está vencido/alterado, la petición se detiene y devuelve un error 401.
 */
export function requireAuth(req, res, next) {
  // 1. Extraemos el header 'Authorization' que envía el cliente móvil/navegador
  const auth = req.headers.authorization;
  console.log(
    `[requireAuth] ${req.method} ${req.originalUrl} - Header Authorization recibido:`,
    auth ? `${auth.slice(0, 20)}...` : 'Ninguno'
  );

  // 2. El token debe existir y tener el formato estándar: "Bearer <token_jwt>"
  if (!auth || !auth.startsWith('Bearer ')) {
    console.log('[requireAuth] Denegado: Token requerido o formato inválido.');
    return res.status(401).json({ message: 'Token requerido.' });
  }

  // 3. Cortamos la palabra "Bearer " para quedarnos únicamente con la cadena del token
  const token = auth.slice('Bearer '.length);

  try {
    // 4. Verificamos la firma digital del token usando nuestra clave secreta (env.jwt.secret)
    // Si la firma es correcta, jwt.verify desempaqueta los datos guardados en el token (id, nombre, rol)
    req.user = jwt.verify(token, env.jwt.secret);
    console.log(
      '[requireAuth] Token verificado correctamente para usuario:',
      req.user.nombre,
      'con rol:',
      req.user.rol
    );

    // 5. Dejamos que la petición continúe al siguiente controlador (next())
    return next();
  } catch (err) {
    // 6. Si el token expiró o la firma no coincide, capturamos el error y devolvemos 401
    console.log('[requireAuth] Falló la verificación del token. Error:', err.message);
    return res.status(401).json({ message: 'Token inválido o expirado.' });
  }
}

/**
 * Middleware: requireRole
 * Verifica que el usuario autenticado tenga alguno de los roles permitidos.
 * Ejemplo de uso en una ruta: requireRole('admin', 'recepcionista')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    // req.user fue guardado previamente por requireAuth.
    // Si el rol del usuario no está dentro de la lista de roles permitidos, devolvemos 403 (Prohibido)
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tiene permisos para esta acción.' });
    }

    // Si tiene permiso, dejamos pasar la petición
    return next();
  };
}
