// Manejador global de errores de Express
// Se pone AL FINAL en app.js (después de las rutas) para capturar cualquier error

export function errorHandler(err, req, res, next) {
  const statusCode = err?.statusCode || (err?.name === 'ZodError' ? 400 : err?.code === 'ER_DUP_ENTRY' ? 409 : 500);
  const log = { requestId: req.requestId, method: req.method, path: req.originalUrl, statusCode, error: err.message };
  console.error(JSON.stringify(log));

  // Error de validación de Zod - campos inválidos o faltantes
  if (err?.name === 'ZodError') {
    return res.status(400).json({
      requestId: req.requestId,
      message: 'Datos inválidos.',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ requestId: req.requestId, message: 'El cuerpo de la solicitud excede el tamaño permitido.' });
  }

  // Error de BD - cédula, correo u otro campo UNIQUE duplicado
  if (err?.code === 'ER_DUP_ENTRY') {
    const isCedula = err.sqlMessage?.toLowerCase().includes('cedula') || err.message?.toLowerCase().includes('cedula');
    const isCorreo = err.sqlMessage?.toLowerCase().includes('correo') || err.message?.toLowerCase().includes('correo');
    const message = isCedula
      ? 'Ya existe un cliente registrado con esta cédula.'
      : isCorreo
      ? 'Ya existe un cliente registrado con este correo electrónico.'
      : 'Dato duplicado. El registro ya existe.';
    return res.status(409).json({ requestId: req.requestId, message });
  }

  // Errores personalizados (como UnauthorizedError) que tienen statusCode definido
  if (err?.statusCode) {
    return res.status(err.statusCode).json({ requestId: req.requestId, message: err.message });
  }

  // Cualquier otro error inesperado
  return res.status(500).json({
    requestId: req.requestId,
    message: 'Error interno del servidor.',
    detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}
