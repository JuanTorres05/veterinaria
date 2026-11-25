import { useEffect, useState } from 'react';
import api from '../services/api';
import { useFeedback } from '../context/FeedbackContext';
import Spinner from '../components/Spinner';
import { Phone, Envelope, MapPin, IdentificationCard, CheckCircle, PawPrint } from '@phosphor-icons/react';

export default function PortalPerfilPage() {
  const { notify } = useFeedback();
  const [perfil, setPerfil] = useState(null);
  const [totalMascotas, setTotalMascotas] = useState(0);
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/portal/resumen')
      .then((res) => {
        const p = res.data?.perfil;
        setPerfil(p);
        setTotalMascotas(res.data?.mascotas?.length || 0);
        setTelefono(p?.telefono || '');
        setCorreo(p?.correo || '');
        setDireccion(p?.direccion || '');
      })
      .catch(() => notify.error('No se pudo cargar tu perfil.'))
      .finally(() => setLoading(false));
  }, [notify]);

  async function handleSave(e) {
    e.preventDefault();
    if (!direccion.trim() || direccion.trim().length < 5) {
      return notify.error('La dirección de residencia es obligatoria (mínimo 5 caracteres).');
    }
    try {
      setSaving(true);
      const { data } = await api.patch('/portal/perfil', {
        telefono: telefono.trim(),
        correo: correo.trim(),
        direccion: direccion.trim(),
      });
      setPerfil(data);
      notify.success('¡Perfecto! Tus datos de contacto quedaron al día 🐾');
    } catch (err) {
      notify.error(err.response?.data?.message || 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-bold text-teal-700">Cargando tu perfil...</p>
      </div>
    );
  }

  const initials = (perfil?.nombre_completo || 'P')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mi Perfil ✨</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Mantén tus datos al día para avisarte sobre las citas y cuidados de tus mascotas.
        </p>
      </div>

      <div className="bg-white border border-amber-100 rounded-[2rem] overflow-hidden shadow-md shadow-amber-900/5">
        <div className="bg-gradient-to-r from-amber-100 via-orange-50 to-teal-50 px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-lg font-extrabold flex items-center justify-center shadow-md ring-4 ring-white">
              {initials}
            </div>
            <div>
              <p className="text-lg font-extrabold text-slate-900">{perfil?.nombre_completo}</p>
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <IdentificationCard size={14} />
                <span>C.C. {perfil?.cedula}</span>
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-teal-800 text-xs font-extrabold shadow-2xs">
            <PawPrint size={14} weight="fill" className="text-teal-600" />
            <span>{totalMascotas} {totalMascotas === 1 ? 'peludito' : 'peluditos'}</span>
          </span>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
              Teléfono celular *
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600" />
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
              Correo electrónico *
            </label>
            <div className="relative">
              <Envelope size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600" />
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
              Dirección de residencia *
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600" />
              <input
                type="text"
                required
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej. Calle 85 #15-20"
                className="w-full h-11 pl-10 pr-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-medium focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-11 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-md shadow-teal-900/15 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? <Spinner size="sm" /> : <CheckCircle size={16} weight="bold" />}
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
