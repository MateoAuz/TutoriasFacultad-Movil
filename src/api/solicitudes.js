import api from './client';
import { aFechaISO } from '../lib/formato';

export const solicitudesApi = {
  // POST /api/solicitudes -> el docente del paralelo la acepta o la rechaza
  crear: ({ id_par, id_esp, fecha, hor_ini, hor_fin, tema }) =>
    api.post('/solicitudes', { id_par, id_esp, fecha, hor_ini, hor_fin, tema: tema || undefined }).then((r) => r.data),

  // GET /api/solicitudes: para un estudiante, solo las suyas (más recientes primero).
  mias: () =>
    api.get('/solicitudes').then((r) =>
      r.data.map((s) => ({
        id_sol: s.id_sol,
        estado: s.estado, // PENDIENTE | ACEPTADA | RECHAZADA
        curso: `${s.paralelo?.materia?.nom_mat || 'Curso'} · Paralelo ${s.paralelo?.nom_par ?? ''}`.trim(),
        docente: s.paralelo?.docente ? `${s.paralelo.docente.nombres} ${s.paralelo.docente.apellidos}` : 'Docente',
        aula: s.espacio?.nom_esp || '—',
        fecha: aFechaISO(s.fecha),
        hora_ini: s.hor_ini,
        hora_fin: s.hor_fin,
        tema: s.tema,
        razon_rechazo: s.razon_rechazo,
        creado_en: s.creado_en,
      }))
    ),
};

export const matriculasApi = {
  // GET /api/matriculas: para un estudiante, solo las suyas
  mias: () => api.get('/matriculas').then((r) => r.data),
};
