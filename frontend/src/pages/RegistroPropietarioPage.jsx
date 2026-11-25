import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Spinner from '../components/Spinner';
import {
  PawPrint,
  IdentificationCard,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  WarningCircle,
  Lock,
  User,
  Phone,
  Envelope,
  MapPin,
  ShieldCheck,
} from '@phosphor-icons/react';

export default function RegistroPropietarioPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // paso 1 = verificar cédula | paso 2 = activar o registrar
  const [paso, setPaso] = useState(1);
  const [cedula, setCedula] = useState('');
  const [estadoCedula, setEstadoCedula] = useState(null); // { estado, nombre, pistaCorreo, pistaTelefono, totalMascotas, requiereCorreo }

  // Campos comunes
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  // Campos activación
  const [verificacion, setVerificacion] = useState('');
  const [correoAlternativo, setCorreoAlternativo] = useState('');

  // Campos nuevo registro
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [agregarMascota, setAgregarMascota] = useState(true);
  const [mascotaNombre, setMascotaNombre] = useState('');
  const [mascotaEspecie, setMascotaEspecie] = useState('Perro');
  const [mascotaRaza, setMascotaRaza] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleVerificar(e) {
    e.preventDefault();
    if (!cedula.trim() || cedula.trim().length < 3) {
      return setError('Ingresa un número de cédula válido.');
    }
    try {
      setLoading(true);
      setError('');
      const { data } = await api.post('/auth/verificar-propietario', { cedula: cedula.trim() });
      setEstadoCedula(data);
      if (data.estado !== 'tiene_cuenta') {
        setPaso(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo verificar la cédula.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegistrar(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }
    if (password !== confirmarPassword) {
      return setError('Las contraseñas no coinciden.');
    }

    const modo = estadoCedula?.estado === 'activar' ? 'activar' : 'nuevo';

    const payload = {
      modo,
      cedula: cedula.trim(),
      password,
      confirmarPassword,
    };

    if (modo === 'activar') {
      if (!verificacion.trim()) {
        return setError('Ingresa tu correo electrónico o los últimos 4 dígitos de tu teléfono para verificar tu identidad.');
      }
      payload.verificacion = verificacion.trim();
      if (estadoCedula.requiereCorreo) {
        payload.correoAlternativo = correoAlternativo.trim();
      }
    } else {
      if (!direccion.trim() || direccion.trim().length < 5) {
        return setError('La dirección de residencia es obligatoria (mínimo 5 caracteres).');
      }
      payload.nombre = nombre.trim();
      payload.telefono = telefono.trim();
      payload.correo = correo.trim();
      payload.direccion = direccion.trim();
      if (agregarMascota && mascotaNombre.trim()) {
        payload.mascota = {
          nombre: mascotaNombre.trim(),
          especie: mascotaEspecie,
          raza: mascotaRaza.trim() || 'Criollo',
        };
      }
    }

    try {
      setLoading(true);
      const { data } = await api.post('/auth/registro-propietario', payload);
      login(data.token, data.user);
      navigate('/portal', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-3 sm:p-4 py-6 sm:py-10 overflow-x-hidden"
      style={{
        background:
          'radial-gradient(circle at 0% 0%, #FFF7ED 0%, #FFFDF9 42%, #F0FDFA 100%)',
      }}
    >
      {/* Huellas decorativas de fondo contenidas sin desbordar en móvil */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-12 left-2 sm:left-10 opacity-[0.16] text-teal-500 rotate-[-22deg]">
          <PawPrint size={120} weight="fill" />
        </div>
        <div className="absolute top-28 -right-4 sm:right-16 opacity-[0.16] text-amber-400 rotate-[18deg]">
          <PawPrint size={150} weight="fill" />
        </div>
        <div className="absolute bottom-12 left-4 sm:left-20 opacity-[0.15] text-orange-400 rotate-[14deg]">
          <PawPrint size={140} weight="fill" />
        </div>
        <div className="absolute bottom-8 -right-4 sm:right-12 opacity-[0.18] text-teal-500 rotate-[-24deg]">
          <PawPrint size={175} weight="fill" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-lg bg-white border border-amber-100 rounded-3xl shadow-xl overflow-hidden">
        {/* Cabecera */}
        <div className="bg-[#0F172A] text-white px-5 sm:px-7 py-5 sm:py-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-sky-500 to-cyan-600 flex items-center justify-center shadow-sm flex-shrink-0">
                <PawPrint size={22} weight="fill" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight truncate">Portal de Propietarios</h1>
                <p className="text-xs text-slate-400 truncate">Crea o activa tu cuenta en DataVet</p>
              </div>
            </div>
            <Link
              to="/login"
              className="text-xs font-bold text-sky-300 hover:text-sky-200 transition-colors whitespace-nowrap"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold">
              <WarningCircle size={18} weight="bold" className="flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── PASO 1: VERIFICAR CÉDULA ── */}
          {paso === 1 && (
            <form onSubmit={handleVerificar} className="space-y-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Ingresa tu número de cédula
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Si ya has visitado la clínica antes, vincularemos automáticamente tus mascotas e historial clínico. Si eres nuevo, te guiaremos para crear tu cuenta.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Número de cédula / documento
                </label>
                <div className="relative">
                  <IdentificationCard
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={cedula}
                    onChange={(e) => {
                      setCedula(e.target.value);
                      setEstadoCedula(null);
                      setError('');
                    }}
                    placeholder="Ej. 1031650543"
                    autoFocus
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15"
                  />
                </div>
              </div>

              {estadoCedula?.estado === 'tiene_cuenta' && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle size={20} weight="fill" className="text-sky-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-sky-900 leading-relaxed">
                      {estadoCedula.mensaje}
                    </p>
                  </div>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all"
                  >
                    <span>Ir a Iniciar Sesión</span>
                    <ArrowRight size={14} weight="bold" />
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar</span>
                    <ArrowRight size={17} weight="bold" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── PASO 2A: ACTIVAR CUENTA DE CLIENTE EXISTENTE ── */}
          {paso === 2 && estadoCedula?.estado === 'activar' && (
            <form onSubmit={handleRegistrar} className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
                <ShieldCheck size={22} weight="fill" className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-extrabold text-emerald-950">
                    ¡Hola, {estadoCedula.nombre}!
                  </p>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    Encontramos tu registro en la clínica con{' '}
                    <strong>{estadoCedula.totalMascotas} mascota(s)</strong>. Confirma tu identidad y elige una contraseña para activar tu portal.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Confirma tu correo o los últimos 4 dígitos de tu teléfono
                </label>
                <input
                  type="text"
                  value={verificacion}
                  onChange={(e) => setVerificacion(e.target.value)}
                  placeholder="Ej. tu correo completo o los últimos 4 dígitos"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-medium focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Pista:{' '}
                  {[estadoCedula.pistaCorreo, estadoCedula.pistaTelefono].filter(Boolean).join(' • ') ||
                    'Dato registrado en recepción'}
                </p>
              </div>

              {estadoCedula.requiereCorreo && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Correo electrónico para tu cuenta *
                  </label>
                  <input
                    type="email"
                    value={correoAlternativo}
                    onChange={(e) => setCorreoAlternativo(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Nueva contraseña *
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Confirmar contraseña *
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaso(1);
                    setError('');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 h-11 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  <ArrowLeft size={15} />
                  <span>Cambiar cédula</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="sm:flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? <Spinner size="sm" /> : <CheckCircle size={17} weight="bold" />}
                  <span>{loading ? 'Activando...' : 'Activar mi Portal'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ── PASO 2B: REGISTRO DE PROPIETARIO NUEVO ── */}
          {paso === 2 && estadoCedula?.estado === 'nuevo' && (
            <form onSubmit={handleRegistrar} className="space-y-4">
              <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-xs text-sky-900 font-semibold">
                Creando cuenta nueva para cédula <strong>{cedula}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nombre completo *
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Sofía Martínez"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Teléfono celular *
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="3001234567"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Correo electrónico *
                  </label>
                  <div className="relative">
                    <Envelope size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      placeholder="sofia@correo.com"
                      className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Dirección de residencia *
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ej. Calle 80 #15-20"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Confirmar contraseña *
                  </label>
                  <input
                    type="password"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Mascota inicial opcional */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <label className="flex items-center gap-2 text-xs font-extrabold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agregarMascota}
                    onChange={(e) => setAgregarMascota(e.target.checked)}
                    className="w-4 h-4 rounded accent-sky-600"
                  />
                  <span>Registrar mi primera mascota ahora</span>
                </label>

                {agregarMascota && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      value={mascotaNombre}
                      onChange={(e) => setMascotaNombre(e.target.value)}
                      placeholder="Nombre (ej. Luna)"
                      className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                    />
                    <select
                      value={mascotaEspecie}
                      onChange={(e) => setMascotaEspecie(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                    >
                      <option value="Perro">Perro</option>
                      <option value="Gato">Gato</option>
                      <option value="Conejo">Conejo</option>
                      <option value="Ave">Ave</option>
                      <option value="Reptil">Reptil</option>
                      <option value="Otro">Otro</option>
                    </select>
                    <input
                      type="text"
                      value={mascotaRaza}
                      onChange={(e) => setMascotaRaza(e.target.value)}
                      placeholder="Raza (ej. Criollo)"
                      className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaso(1);
                    setError('');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-4 h-11 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  <ArrowLeft size={15} />
                  <span>Volver</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="sm:flex-1 h-11 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? <Spinner size="sm" /> : <CheckCircle size={17} weight="bold" />}
                  <span>{loading ? 'Creando cuenta...' : 'Crear Cuenta y Entrar'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
