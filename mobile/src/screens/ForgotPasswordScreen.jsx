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

export default function ForgotPasswordScreen({ onNavigateToLogin }) {
  const [cedula, setCedula] = useState('');
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [exito, setExito] = useState(false);

  const handleRecuperar = async () => {
    setErrorText('');

    // Validaciones locales
    if (!cedula.trim()) {
      const msg = 'Por favor ingresa tu cédula de identidad.';
      setErrorText(msg);
      return;
    }
    if (!correo.trim()) {
      const msg = 'Por favor ingresa tu correo electrónico.';
      setErrorText(msg);
      return;
    }
    if (!correo.includes('@') || !correo.includes('.')) {
      const msg = 'Ingresa un correo electrónico válido.';
      setErrorText(msg);
      return;
    }

    setCargando(true);

    // AbortController con timeout de 8 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(ENDPOINTS.RECUPERAR_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          cedula: cedula.trim(),
          correo: correo.trim().toLowerCase(),
        }),
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok) {
        // Éxito: mostramos el mensaje de confirmación
        setExito(true);
      } else if (response.status === 404) {
        setErrorText(
          data.message || 'No encontramos una cuenta con esa cédula y correo. Verifica tus datos.'
        );
      } else if (response.status === 400) {
        let msg = 'Datos inválidos.';
        if (data.errors && Array.isArray(data.errors)) {
          msg = data.errors.map((e) => e.message).join('\n');
        } else if (data.message) {
          msg = data.message;
        }
        setErrorText(msg);
      } else {
        setErrorText(data.message || `Error en el servidor (${response.status})`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      let netMsg = 'No se pudo conectar con el servidor.';
      if (error.name === 'AbortError') {
        netMsg = 'Tiempo de espera agotado (8s). Verifica tu conexión Wi-Fi.';
      }
      setErrorText(netMsg);
    } finally {
      setCargando(false);
    }
  };

  // ──────────────────────────────────────────
  // PANTALLA DE ÉXITO
  // ──────────────────────────────────────────
  if (exito) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✉️</Text>
          </View>
          <Text style={styles.successTitle}>¡Solicitud enviada!</Text>
          <Text style={styles.successBody}>
            Hemos registrado tu solicitud de recuperación de contraseña.{'\n\n'}
            Un administrador del sistema se pondrá en contacto contigo en{' '}
            <Text style={styles.boldBlue}>{correo}</Text> con las instrucciones para restablecer tu acceso.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onNavigateToLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Volver al Inicio de Sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ──────────────────────────────────────────
  // FORMULARIO DE RECUPERACIÓN
  // ──────────────────────────────────────────
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
          {/* Header con botón de regreso */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={onNavigateToLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>

          {/* Ícono y título */}
          <View style={styles.brandHeader}>
            <View style={styles.iconBadge}>
              <Text style={styles.iconText}>🔑</Text>
            </View>
            <Text style={styles.pageTitle}>Recuperar Contraseña</Text>
            <Text style={styles.pageSubtitle}>
              Ingresa tu cédula y correo registrado. Recibirás instrucciones para restablecer tu contraseña.
            </Text>
          </View>

          {/* Tarjeta de formulario */}
          <View style={styles.card}>
            {errorText ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerIcon}>⚠️</Text>
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
                editable={!cargando}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo Electrónico Registrado</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. usuario@clinica.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={correo}
                onChangeText={setCorreo}
                editable={!cargando}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, cargando && styles.buttonDisabled]}
              onPress={handleRecuperar}
              disabled={cargando}
              activeOpacity={0.85}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Solicitar Recuperación</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryLink}
              onPress={onNavigateToLogin}
              activeOpacity={0.7}
              disabled={cargando}
            >
              <Text style={styles.secondaryLinkText}>
                ¿Recordaste tu contraseña?{' '}
                <Text style={styles.boldBlue}>Iniciar Sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nota informativa */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              🔒 Si no tienes acceso a tu correo registrado, comunícate directamente con el administrador del sistema.
            </Text>
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
    paddingVertical: 24,
  },
  // ── Regreso ──
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backButtonText: {
    fontSize: 15,
    color: '#0284C7',
    fontWeight: '600',
  },
  // ── Header ──
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#BAE6FD',
  },
  iconText: {
    fontSize: 34,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  // ── Card ──
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
  // ── Error Banner ──
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorBannerIcon: {
    fontSize: 15,
  },
  errorBannerText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  // ── Inputs ──
  inputGroup: {
    marginBottom: 18,
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
  // ── Botón principal ──
  primaryButton: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // ── Link secundario ──
  secondaryLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: '#475569',
    fontSize: 14,
  },
  boldBlue: {
    color: '#0284C7',
    fontWeight: '700',
  },
  // ── Nota informativa ──
  infoBox: {
    marginTop: 20,
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
    borderRadius: 8,
    padding: 12,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  // ── Pantalla de éxito ──
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  successIconText: {
    fontSize: 42,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  successBody: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
});
