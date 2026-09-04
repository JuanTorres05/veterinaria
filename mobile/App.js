// ============================================================================
// COMPONENTE PRINCIPAL (App.js) - NAVEGACIÓN Y VALIDACIÓN DE SESIÓN INICIAL
// ============================================================================
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, StatusBar } from 'react-native';
import { obtenerToken } from './src/utils/authStorage';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

export default function App() {
  // Estado para la carga inicial mientras leemos AsyncStorage
  const [cargandoInicial, setCargandoInicial] = useState(true);
  // Estado para almacenar el token activo en memoria de React
  const [token, setToken] = useState(null);
  // Estado de navegación simple: 'login' | 'register' | 'home' | 'forgotPassword'
  const [screenActual, setScreenActual] = useState('login');

  // ==========================================================================
  // useEffect: Se ejecuta 1 sola vez cuando la aplicación se abre en el teléfono
  // ==========================================================================
  useEffect(() => {
    verificarSesionInicial();
  }, []);

  const verificarSesionInicial = async () => {
    try {
      // 1. Consultamos si existe un token guardado en AsyncStorage
      const tokenGuardado = await obtenerToken();

      if (tokenGuardado) {
        // Si hay token, iniciamos sesión automáticamente en la pantalla Home
        setToken(tokenGuardado);
        setScreenActual('home');
      } else {
        // Si no hay token, mandamos al usuario a iniciar sesión
        setScreenActual('login');
      }
    } catch (error) {
      console.error('Error al verificar la sesión inicial:', error);
      setScreenActual('login');
    } finally {
      // Apagamos el indicador de carga inicial
      setCargandoInicial(false);
    }
  };

  // Callback cuando el login fue exitoso desde LoginScreen
  const handleLoginExitoso = (newToken) => {
    setToken(newToken);
    setScreenActual('home');
  };

  // Callback cuando el usuario presiona Logout desde HomeScreen
  const handleLogoutExitoso = () => {
    setToken(null);
    setScreenActual('login');
  };

  // 1. Si aún está verificando AsyncStorage, muestra pantalla de carga
  if (cargandoInicial) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F0F9FF" />
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Conectando con DATAVET...</Text>
      </View>
    );
  }

  // 2. Navegación Condicional basada en el estado de sesión y pantalla actual
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F9FF" />

      {token && screenActual === 'home' ? (
        // ── Pantalla principal (autenticado) ──
        <HomeScreen token={token} onLogout={handleLogoutExitoso} />

      ) : screenActual === 'register' ? (
        // ── Registro de cliente y mascota ──
        <RegisterScreen onNavigateToLogin={() => setScreenActual('login')} />

      ) : screenActual === 'forgotPassword' ? (
        // ── Recuperación de contraseña ──
        <ForgotPasswordScreen onNavigateToLogin={() => setScreenActual('login')} />

      ) : (
        // ── Login (pantalla por defecto) ──
        <LoginScreen
          onLoginSuccess={handleLoginExitoso}
          onNavigateToRegister={() => setScreenActual('register')}
          onNavigateToForgotPassword={() => setScreenActual('forgotPassword')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: '#0284C7',
    fontWeight: '600',
  },
});
