// ============================================================================
// FUNCIONES HELPER DE ASYNCSTORAGE (PERSISTENCIA LOCAL DE SESIÓN)
// ============================================================================
// Usamos la librería @react-native-async-storage/async-storage para guardar
// datos en la memoria persistente del teléfono (similar al localStorage de la web).

import AsyncStorage from '@react-native-async-storage/async-storage';

// Definimos la clave en una constante para no cometer errores tipográficos
const TOKEN_KEY = '@user_jwt';
const USER_INFO_KEY = '@user_info';

/**
 * 1. guardarToken
 * Guarda la cadena del token JWT recibido desde el backend Express en el teléfono.
 */
export const guardarToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    console.log('✅ Token JWT guardado exitosamente en AsyncStorage.');
  } catch (error) {
    console.error('❌ Error al guardar el token en AsyncStorage:', error);
    throw error;
  }
};

/**
 * 2. obtenerToken
 * Lee el token JWT almacenado. Se usa al abrir la app para verificar si hay sesión activa.
 */
export const obtenerToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('❌ Error al obtener el token de AsyncStorage:', error);
    return null;
  }
};

/**
 * 3. eliminarToken (Logout)
 * Borra el token y los datos del usuario al cerrar sesión.
 */
export const eliminarToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_INFO_KEY);
    console.log('🚪 Sesión eliminada de AsyncStorage correctamente.');
  } catch (error) {
    console.error('❌ Error al eliminar la sesión de AsyncStorage:', error);
    throw error;
  }
};

/**
 * 4. guardarUsuario (Opcional)
 * Guarda el objeto JSON con el nombre e id del usuario logueado.
 */
export const guardarUsuario = async (user) => {
  try {
    await AsyncStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('❌ Error al guardar el usuario en AsyncStorage:', error);
  }
};

/**
 * 5. obtenerUsuario (Opcional)
 * Recupera el objeto JSON del usuario almacenado.
 */
export const obtenerUsuario = async () => {
  try {
    const raw = await AsyncStorage.getItem(USER_INFO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('❌ Error al obtener usuario de AsyncStorage:', error);
    return null;
  }
};
