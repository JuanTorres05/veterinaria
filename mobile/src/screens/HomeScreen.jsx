import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { ENDPOINTS } from '../config/apiConfig';
import { eliminarToken, obtenerUsuario } from '../utils/authStorage';

export default function HomeScreen({ token, onLogout }) {
  const [usuario, setUsuario] = useState(null);
  const [veterinarios, setVeterinarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    cargarDatosProtegidos();
  }, [token]);

  // Consumir la ruta protegida enviando el token en el header Authorization: Bearer <token>
  const cargarDatosProtegidos = async () => {
    setCargando(true);
    setErrorText('');

    try {
      const userObj = await obtenerUsuario();
      setUsuario(userObj);

      // Petición a la ruta protegida real del Backend Express DATAVET
      const response = await fetch(ENDPOINTS.LISTAR_VETERINARIOS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Header con token JWT
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVeterinarios(data);
      } else if (response.status === 401) {
        Alert.alert(
          'Sesión Expirada',
          'Tu token de acceso ha expirado. Inicia sesión nuevamente.',
          [{ text: 'Aceptar', onPress: confirmarLogout }]
        );
      } else {
        const errData = await response.json().catch(() => ({}));
        setErrorText(errData.message || `Error en la solicitud (${response.status})`);
      }
    } catch (err) {
      console.error('Error cargando ruta protegida:', err);
      setErrorText('Error de conexión con el servidor Express.');
    } finally {
      setCargando(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir del sistema DATAVET?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, Salir', style: 'destructive', onPress: confirmarLogout },
      ]
    );
  };

  const confirmarLogout = async () => {
    try {
      await eliminarToken();
      if (onLogout) {
        onLogout();
      }
    } catch (err) {
      console.error('Error al realizar el logout:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0284C7" />

      {/* Header Principal de la Clínica */}
      <View style={styles.topHeader}>
        <View style={styles.userInfoBox}>
          <Text style={styles.welcomeSubtitle}>Panel Médico Veterinaria</Text>
          <Text style={styles.welcomeTitle}>
            ¡Hola, {usuario ? usuario.nombre : 'Personal DATAVET'}! 🐾
          </Text>
          {usuario?.rol ? (
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>Rol: {usuario.rol.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.headerLogoutBtn}
          onPress={handleLogoutPress}
          activeOpacity={0.8}
        >
          <Text style={styles.headerLogoutBtnText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Tarjeta de estado de conexión protegida */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Staff Médico Activo (Ruta Protegida)</Text>
          <Text style={styles.cardDesc}>
            Datos recuperados enviando Authorization: Bearer JWT al backend Express real.
          </Text>
        </View>

        {cargando ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={styles.loadingMsg}>Verificando token y cargando información...</Text>
          </View>
        ) : errorText ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{errorText}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={cargarDatosProtegidos}>
              <Text style={styles.retryBtnText}>Reintentar Conexión</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={veterinarios}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listPadding}
            renderItem={({ item }) => (
              <View style={styles.doctorItem}>
                <View style={styles.doctorAvatar}>
                  <Text style={styles.doctorAvatarText}>🩺</Text>
                </View>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>Dr(a). {item.nombre}</Text>
                  <Text style={styles.doctorId}>ID Profesional: #{item.id}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>Activo</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No hay veterinarios registrados o activos actualmente.</Text>
              </View>
            }
          />
        )}

        {/* Botón Destacado de Cerrar Sesión */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.fullLogoutButton}
            onPress={handleLogoutPress}
            activeOpacity={0.85}
          >
            <Text style={styles.fullLogoutButtonText}>🚪 Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0284C7',
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfoBox: {
    flex: 1,
  },
  welcomeSubtitle: {
    color: '#BAE6FD',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  roleTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  roleTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerLogoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  headerLogoutBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  cardHeader: {
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  listPadding: {
    paddingBottom: 80,
  },
  doctorItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorAvatarText: {
    fontSize: 22,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  doctorId: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingMsg: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 20,
  },
  errorBoxText: {
    color: '#991B1B',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  retryBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  fullLogoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  fullLogoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
