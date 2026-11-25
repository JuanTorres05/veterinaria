import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FeedbackProvider } from './context/FeedbackContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import PortalLayout from './components/PortalLayout';
import LoginPage from './pages/LoginPage';
import RegistroPropietarioPage from './pages/RegistroPropietarioPage';
import DashboardPage from './pages/DashboardPage';
import RegistrarPage from './pages/RegistrarPage';
import AgendaPage from './pages/AgendaPage';
import PacientesPage from './pages/PacientesPage';
import FichaMascotaPage from './pages/FichaMascotaPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ReportesPage from './pages/ReportesPage';
import MonitoreoPage from './pages/MonitoreoPage';
import HospitalizacionPage from './pages/HospitalizacionPage';
import UsuariosPage from './pages/UsuariosPage';
import AtenderCitaPage from './pages/AtenderCitaPage';
import PortalHomePage from './pages/PortalHomePage';
import PortalMascotaPage from './pages/PortalMascotaPage';
import PortalCitasPage from './pages/PortalCitasPage';
import PortalPerfilPage from './pages/PortalPerfilPage';

function HomeRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.rol === 'cliente') return <Navigate to="/portal" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <FeedbackProvider>
        <BrowserRouter>
          <Routes>
            {/* Públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro-propietario" element={<RegistroPropietarioPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Portal del Propietario (exclusivo rol 'cliente') */}
            <Route
              path="/portal"
              element={
                <PrivateRoute roles={['cliente']}>
                  <PortalLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<PortalHomePage />} />
              <Route path="mascotas/:id" element={<PortalMascotaPage />} />
              <Route path="citas" element={<PortalCitasPage />} />
              <Route path="perfil" element={<PortalPerfilPage />} />
            </Route>

            {/* Panel Clínico Interno (exclusivo personal de la clínica) */}
            <Route
              element={
                <PrivateRoute roles={['admin', 'veterinario', 'recepcionista']}>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/pacientes" element={<PacientesPage />} />
              <Route path="/monitoreo" element={<MonitoreoPage />} />
              <Route path="/hospitalizacion" element={<HospitalizacionPage />} />
              <Route path="/mascotas/:id" element={<FichaMascotaPage />} />
              <Route
                path="/atender/:citaId"
                element={
                  <PrivateRoute roles={['admin', 'veterinario']}>
                    <AtenderCitaPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/registrar"
                element={
                  <PrivateRoute roles={['admin', 'recepcionista']}>
                    <RegistrarPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/reportes"
                element={
                  <PrivateRoute roles={['admin']}>
                    <ReportesPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <PrivateRoute roles={['admin']}>
                    <UsuariosPage />
                  </PrivateRoute>
                }
              />
            </Route>

            {/* Redirect raíz y 404 */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </BrowserRouter>
      </FeedbackProvider>
    </AuthProvider>
  );
}
