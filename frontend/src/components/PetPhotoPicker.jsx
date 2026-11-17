import { useEffect, useRef, useState } from 'react';
import { Camera, UploadSimple, Trash, X, Check, ArrowCounterClockwise, WarningCircle } from '@phosphor-icons/react';
import { leerArchivosParaSubida } from '../utils/archivos';
import { useFeedback } from '../context/FeedbackContext';

export function CameraCaptureModal({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camError, setCamError] = useState('');
  const [starting, setStarting] = useState(false);
  const [captured, setCaptured] = useState(null); // { base64_data, tamano_bytes }

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      stopStream();
      setCaptured(null);
      setCamError('');
      return;
    }

    let cancelled = false;
    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamError('Tu navegador no soporta acceso directo a la cámara o requiere HTTPS/localhost.');
        return;
      }
      try {
        setStarting(true);
        setCamError('');
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        if (!cancelled) {
          setCamError(
            err.name === 'NotAllowedError'
              ? 'Permiso de cámara denegado. Habilita el acceso a la cámara en tu navegador.'
              : 'No se detectó una cámara disponible en este equipo.'
          );
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open]);

  if (!open) return null;

  const handleTomarFoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const maxW = 1000;
    const scale = video.videoWidth > maxW ? maxW / video.videoWidth : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    const base64Len = dataUrl.split(',')[1]?.length || 0;
    const approxBytes = Math.round((base64Len * 3) / 4);
    setCaptured({ base64_data: dataUrl, tamano_bytes: approxBytes });
  };

  const handleConfirmar = () => {
    if (!captured) return;
    onCapture({
      nombre_archivo: `camara-${Date.now()}.jpg`,
      mime_type: 'image/jpeg',
      tamano_bytes: captured.tamano_bytes,
      base64_data: captured.base64_data,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-white">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={18} weight="bold" className="text-sky-400" />
            <h3 className="text-sm font-bold">Tomar Foto de la Mascota</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {camError ? (
            <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-200 text-xs flex items-center gap-2.5">
              <WarningCircle size={20} weight="fill" className="text-rose-400 flex-shrink-0" />
              <span>{camError}</span>
            </div>
          ) : (
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
              {captured ? (
                <img src={captured.base64_data} alt="Captura" className="w-full h-full object-cover" />
              ) : (
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              )}
              {starting && !captured && (
                <span className="absolute text-xs font-semibold text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg">
                  Iniciando cámara...
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancelar
            </button>

            {!camError && !captured && (
              <button
                type="button"
                disabled={starting}
                onClick={handleTomarFoto}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Camera size={15} weight="bold" />
                <span>Capturar Foto</span>
              </button>
            )}

            {captured && (
              <>
                <button
                  type="button"
                  onClick={() => setCaptured(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <ArrowCounterClockwise size={14} weight="bold" />
                  <span>Repetir</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmar}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Check size={14} weight="bold" />
                  <span>Usar esta foto</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PetPhotoPicker({ value, onChange }) {
  const { notify } = useFeedback();
  const [camOpen, setCamOpen] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify.error('Selecciona una imagen válida (JPG, PNG, WEBP o GIF).');
      return;
    }
    try {
      const [archivo] = await leerArchivosParaSubida([file]);
      onChange(archivo);
    } catch (err) {
      notify.error(err.message || 'No se pudo leer la imagen.');
    }
  };

  return (
    <div className="flex items-center gap-4 flex-wrap p-3 rounded-xl border border-slate-200 bg-slate-50/70">
      <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center flex-shrink-0">
        {value?.base64_data ? (
          <img src={value.base64_data} alt="Vista previa" className="w-full h-full object-cover" />
        ) : (
          <Camera size={24} className="text-slate-300" />
        )}
      </div>

      <div className="flex-1 min-w-[200px] space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Foto de perfil de la mascota (Opcional)
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setCamOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white text-xs font-semibold transition-colors"
          >
            <Camera size={14} weight="bold" />
            <span>Usar cámara</span>
          </button>

          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors">
            <UploadSimple size={14} weight="bold" />
            <span>Subir imagen</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFile}
              className="hidden"
            />
          </label>

          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
            >
              <Trash size={13} weight="bold" />
              <span>Quitar</span>
            </button>
          )}
        </div>
      </div>

      <CameraCaptureModal
        open={camOpen}
        onClose={() => setCamOpen(false)}
        onCapture={(foto) => onChange(foto)}
      />
    </div>
  );
}
