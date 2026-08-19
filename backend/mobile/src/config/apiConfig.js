// ============================================================================
// CONFIGURACIÓN DE URLS Y ENDPOINTS DE LA API REAL (DATAVET)
// ============================================================================
// Centralizamos aquí la dirección de IP y rutas para poder cambiar la IP
// en un solo lugar si nuestra red Wi-Fi cambia.

// IP activa de tu máquina en la red local detectada por Expo
export const API_BASE_URL = 'http://10.48.73.97:3000/api';

// Mapeo de rutas de nuestro Backend Express
export const ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,               // POST: Autenticación
  REGISTRAR_CLIENTE: `${API_BASE_URL}/clientes/registrar`, // POST: Registro unificado
  LISTAR_CLIENTES: `${API_BASE_URL}/clientes`,         // GET: Ruta protegida
  LISTAR_VETERINARIOS: `${API_BASE_URL}/auth/veterinarios`, // GET: Ruta protegida
  HEALTH: `${API_BASE_URL}/health`,                   // GET: Estado del servicio
};
