import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { ENDPOINTS } from '../config/apiConfig';
import { guardarToken, guardarUsuario } from '../utils/authStorage';

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }) {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleLogin = async () => {
    setErrorText('');

    if (!cedula.trim() || !password.trim()) {
      const msg = 'Por favor ingresa tu cédula y contraseña.';
      setErrorText(msg);
      Alert.alert('Campos Incompletos', msg);
      return;
    }

    if (password.length < 6) {
      const msg = 'La contraseña debe tener al menos 6 caracteres.';
      setErrorText(msg);
      Alert.alert('Contraseña Inválida', msg);
      return;
    }

    setCargando(true);

    // AbortController con timeout de 8 segundos para evitar estados infinitos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          cedula: cedula.trim(),
          password: password,
        }),
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok) {
        const { token, user } = data;
        await guardarToken(token);
        if (user) {
          await guardarUsuario(user);
        }

        Alert.alert(
          '¡Bienvenido a DATAVET!',
          `Hola ${user?.nombre || 'Usuario'}, inicio de sesión exitoso.`
        );

        if (onLoginSuccess) {
          onLoginSuccess(token, user);
        }
      } else if (response.status === 401) {
        const msg = data.message || 'Credenciales inválidas. Revisa tu cédula y contraseña.';
        setErrorText(msg);
        Alert.alert('Error de Autenticación', msg);
      } else if (response.status === 400) {
        let msg = 'Datos de ingreso no válidos.';
        if (data.errors && Array.isArray(data.errors)) {
          msg = data.errors.map((err) => err.message).join('\n');
        } else if (data.message) {
          msg = data.message;
        }
        setErrorText(msg);
        Alert.alert('Datos Inválidos', msg);
      } else {
        const msg = data.message || `Error en el servidor (${response.status})`;
        setErrorText(msg);
        Alert.alert('Error del Servidor', msg);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error en fetch login:', error);

      let netMsg = 'No se pudo conectar con el servidor Express en ' + ENDPOINTS.LOGIN;
      if (error.name === 'AbortError') {
        netMsg = 'Tiempo de espera agotado (8s). Verifica la IP y la conexión Wi-Fi.';
      }
      setErrorText(netMsg);
      Alert.alert('Error de Conexión', netMsg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexOne}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>🐾</Text>
            </View>
            <Text style={styles.appName}>DATAVET</Text>
            <Text style={styles.appTagline}>Gestión Médica y Clínica Veterinaria</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar Sesión</Text>
            <Text style={styles.cardSubtitle}>Accede a tu cuenta de personal o cliente</Text>

            {errorText ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorText}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cédula / Identificación</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 0000000001"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={cedula}
                onChangeText={setCedula}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, cargando && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={cargando}
              activeOpacity={0.8}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Ingresar al Sistema</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryLink}
              onPress={onNavigateToRegister}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryLinkText}>
                ¿Nuevo en la clínica? <Text style={styles.boldText}>Registra un Cliente y Mascota</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>DATAVET System v1.0 • IP: 10.48.73.97:3000</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  logoIcon: {
    fontSize: 32,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 20,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  primaryButton: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: '#475569',
    fontSize: 14,
  },
  boldText: {
    color: '#0284C7',
    fontWeight: '700',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
