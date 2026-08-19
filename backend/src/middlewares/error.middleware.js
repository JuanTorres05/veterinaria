// Manejador global de errores de Express
// Se pone AL FINAL en app.js (después de las rutas) para capturar cualquier error

export function errorHandler(err, req, res, next) {
  // Loguear el error completo en consola para depuración
  console.error(`[errorHandler] ❌ Error en ${req.method} ${req.originalUrl}:`, err);

  // Error de validación de Zod - campos inválidos o faltantes
  if (err?.name === 'ZodError') {
    return res.status(400).json({
      message: 'Datos inválidos.',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // Error de BD - cédula, correo u otro campo UNIQUE duplicado
  if (err?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Dato duplicado. El registro ya existe.' });
  }

  // Errores personalizados (como UnauthorizedError) que tienen statusCode definido
  if (err?.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Cualquier otro error inesperado
  return res.status(500).json({
    message: 'Error interno del servidor.',
    detail: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}
