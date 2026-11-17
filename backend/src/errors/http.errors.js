/**
 * Clase base para errores HTTP con código de estado.
 */
export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

/**
 * 400 Bad Request — datos o precondiciones de negocio inválidas.
 */
export class BadRequestError extends HttpError {
  constructor(message = 'Solicitud inválida.') {
    super(400, message);
  }
}

/**
 * 401 Unauthorized — credenciales inválidas o token ausente.
 */
export class UnauthorizedError extends HttpError {
  constructor(message = 'No autorizado.') {
    super(401, message);
  }
}

/**
 * 403 Forbidden — autenticado pero sin permisos suficientes.
 */
export class ForbiddenError extends HttpError {
  constructor(message = 'No tiene permisos para esta acción.') {
    super(403, message);
  }
}

/**
 * 404 Not Found — recurso no encontrado.
 */
export class NotFoundError extends HttpError {
  constructor(message = 'Recurso no encontrado.') {
    super(404, message);
  }
}

/**
 * 409 Conflict — conflicto con el estado actual del recurso (ej. duplicados).
 */
export class ConflictError extends HttpError {
  constructor(message = 'El recurso ya existe o genera un conflicto.') {
    super(409, message);
  }
}
