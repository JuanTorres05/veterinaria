import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { ENDPOINTS } from '../config/apiConfig';
import { obtenerToken } from '../utils/authStorage';

export default function RegisterScreen({ onNavigateToLogin }) {
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [correoCliente, setCorreoCliente] = useState('');

  const [nombreMascota, setNombreMascota] = useState('');
  const [especieMascota, setEspecieMascota] = useState('Perro');
  const [razaMascota, setRazaMascota] = useState('');

  const [cargando, setCargando] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleRegister = async () => {
    setErrorText('');

    if (
      !nombreCliente.trim() ||
      !telefonoCliente.trim() ||
      !correoCliente.trim() ||
      !nombreMascota.trim() ||
      !especieMascota.trim() ||
      !razaMascota.trim()
    ) {
      const msg = 'Por favor completa todos los datos del cliente y de la mascota.';
      setErrorText(msg);
      Alert.alert('Campos Obligatorios', msg);
      return;
    }

    if (!correoCliente.includes('@') || !correoCliente.includes('.')) {
      const msg = 'Ingresa un correo electrónico válido.';
      setErrorText(msg);
      Alert.alert('Correo Inválido', msg);
      return;
    }

    setCargando(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const token = await obtenerToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const bodyPayload = {
        cliente: {
          nombre: nombreCliente.trim(),
          telefono: telefonoCliente.trim(),
          correo: correoCliente.trim().toLowerCase(),
        },
        mascota: {
          nombre: nombreMascota.trim(),
          especie: especieMascota.trim(),
          raza: razaMascota.trim(),
        },
      };

      const response = await fetch(ENDPOINTS.REGISTRAR_CLIENTE, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify(bodyPayload),
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.status === 201 || response.ok) {
        Alert.alert(
          '¡Registro Exitoso! 🐾',
          `Se ha dado de alta al cliente "${nombreCliente}" y a su mascota "${nombreMascota}" correctamente.`,
          [{ text: 'Ir a Iniciar Sesión', onPress: onNavigateToLogin }]
        );
      } else if (response.status === 409) {
        const msg = 'El correo electrónico ingresado ya se encuentra registrado.';
        setErrorText(msg);
        Alert.alert('Registro Duplicado', msg);
      } else if (response.status === 401 || response.status === 403) {
        const msg =
          data.message || 'Se requieren permisos de Recepcionista o Admin para registrar clientes.';
        setErrorText(msg);
        Alert.alert('Permiso Denegado', msg);
      } else if (response.status === 400) {
        let msg = 'Error en los datos suministrados.';
        if (data.errors && Array.isArray(data.errors)) {
          msg = data.errors.map((e) => `${e.path}: ${e.message}`).join('\n');
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
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error al registrar cliente:', err);
      let netMsg = 'No se pudo conectar con el servidor Express.';
      if (err.name === 'AbortError') {
        netMsg = 'Tiempo de espera agotado (8s). Revisa la IP y la conexión a red.';
      }
      setErrorText(netMsg);
      Alert.alert('Error de Red', netMsg);
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.brandHeader}>
            <Text style={styles.headerTitle}>Alta de Cliente y Paciente</Text>
            <Text style={styles.headerSubtitle}>
              Ingresa la información del propietario y su mascota
            </Text>
          </View>

          <View style={styles.card}>
            {errorText ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorText}</Text>
              </View>
            ) : null}

            <View style={styles.sectionHeaderBox}>
              <Text style={styles.sectionIcon}>👤</Text>
              <Text style={styles.sectionTitle}>Datos del Propietario (Cliente)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre Completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Ana María García"
                placeholderTextColor="#9CA3AF"
                value={nombreCliente}
                onChangeText={setNombreCliente}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono de Contacto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. 3001234567"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={telefonoCliente}
                onChangeText={setTelefonoCliente}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. ana.garcia@correo.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={correoCliente}
                onChangeText={setCorreoCliente}
              />
            </View>

            <View style={[styles.sectionHeaderBox, { marginTop: 16 }]}>
              <Text style={styles.sectionIcon}>🐶</Text>
              <Text style={styles.sectionTitle}>Datos de la Mascota (Paciente)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de la Mascota</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Max, Firulais, Michi"
                placeholderTextColor="#9CA3AF"
                value={nombreMascota}
                onChangeText={setNombreMascota}
              />
            </View>

            <View style={styles.rowTwo}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Especie</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Canino / Felino"
                  placeholderTextColor="#9CA3AF"
                  value={especieMascota}
                  onChangeText={setEspecieMascota}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Raza</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Golden Retriever"
                  placeholderTextColor="#9CA3AF"
                  value={razaMascota}
                  onChangeText={setRazaMascota}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, cargando && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={cargando}
              activeOpacity={0.8}
            >
              {cargando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Completar Registro</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryLink}
              onPress={onNavigateToLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryLinkText}>
                ¿Ya estás registrado? <Text style={styles.boldText}>Inicia Sesión</Text>
              </Text>
            </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  brandHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  },
  sectionHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0284C7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 14,
  },
  rowTwo: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  primaryButton: {
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
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
    marginTop: 16,
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
});
