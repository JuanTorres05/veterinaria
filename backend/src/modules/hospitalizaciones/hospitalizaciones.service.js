import * as hospitalizacionesRepository from './hospitalizaciones.repository.js';

export const listarHospitalizaciones = hospitalizacionesRepository.listar;
export const crearHospitalizacion = hospitalizacionesRepository.crear;
export const actualizarHospitalizacion = hospitalizacionesRepository.actualizar;
