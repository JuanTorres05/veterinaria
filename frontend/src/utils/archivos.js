const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function resolveArchivoUrl(rutaArchivo) {
  if (!rutaArchivo) return '';
  if (rutaArchivo.startsWith('http://') || rutaArchivo.startsWith('https://') || rutaArchivo.startsWith('data:')) {
    return rutaArchivo;
  }
  return `${BACKEND_ORIGIN}${rutaArchivo.startsWith('/') ? '' : '/'}${rutaArchivo}`;
}

export function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (!n || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export async function leerArchivosParaSubida(fileList) {
  const files = Array.from(fileList || []);
  const allowed = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
  const resultados = [];

  for (const file of files) {
    const mime = (file.type || '').toLowerCase();
    if (!allowed.has(mime)) {
      throw new Error(`El archivo "${file.name}" no tiene un formato permitido. Solo se aceptan imágenes (JPG, PNG, WEBP, GIF) o documentos PDF.`);
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`El archivo "${file.name}" supera el límite de 10 MB.`);
    }

    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`No se pudo leer el archivo "${file.name}".`));
      reader.readAsDataURL(file);
    });

    resultados.push({
      nombre_archivo: file.name,
      mime_type: mime,
      tamano_bytes: file.size,
      base64_data: base64Data,
      esImagen: mime.startsWith('image/'),
    });
  }

  return resultados;
}
