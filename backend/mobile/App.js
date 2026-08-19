import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, StatusBar } from 'react-native';
import { obtenerToken } from './src/utils/authStorage';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [token, setToken] = useState(null);
  const [screenActual, setScreenActual] = useState('login'); // 'login' | 'register' | 'home'

  // Revisar si ya existe token JWT guardado en AsyncStorage al abrir la app
  useEffect(() => {
    verificarSesionInicial();
  }, []);

  const verificarSesionInicial = async () => {
    try {
      const tokenGuardado = await obtenerToken();
      if (tokenGuardado) {
        setToken(tokenGuardado);
        setScreenActual('home');
      } else {
        setScreenActual('login');
      }
    } catch (error) {
      console.error('Error al verificar la sesión inicial:', error);
      setScreenActual('login');
    } finally {
      setCargandoInicial(false);
    }
  };

  const handleLoginExitoso = (newToken) => {
    setToken(newToken);
    setScreenActual('home');
  };

  const handleLogoutExitoso = () => {
    setToken(null);
    setScreenActual('login');
  };

  // Pantalla de carga mientras se consulta AsyncStorage
  if (cargandoInicial) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F0F9FF" />
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Conectando con DATAVET...</Text>
      </View>
    );
  }

  // Navegación condicional
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F9FF" />
      {token && screenActual === 'home' ? (
        <HomeScreen token={token} onLogout={handleLogoutExitoso} />
      ) : screenActual === 'register' ? (
        <RegisterScreen onNavigateToLogin={() => setScreenActual('login')} />
      ) : (
        <LoginScreen
          onLoginSuccess={handleLoginExitoso}
          onNavigateToRegister={() => setScreenActual('register')}
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
