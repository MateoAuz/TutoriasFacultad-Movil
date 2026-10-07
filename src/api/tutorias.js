import api from './client';
import { aFechaISO, aHoraTxt } from '../lib/formato';

// Forma única de tutoría para las pantallas, venga de /tutorias o de /asistencias/mias.
function desdeReserva(r) {
  return {
    id_rev: r.id_rev,
    aula: r.espacio?.nom_esp || '—',
    bloque: r.espacio?.bloque || null,
    piso: r.espacio?.piso || null,
    fecha: aFechaISO(r.fecha),
    hora_ini: aHoraTxt(r.hor_ini),
    hora_fin: aHoraTxt(r.hor_fin),
    docente: r.solicitante ? `${r.solicitante.nombres} ${r.solicitante.apellidos}` : 'Docente',
    curso: r.paralelo ? `${r.paralelo.materia?.nom_mat || ''} · Paralelo ${r.paralelo.nom_par}` : null,
    tema: r.motivo || 'Tutoría',
    cancelada: r.estado === 'CANCELADA',
  };
}

export const tutoriasApi = {
  // GET /api/tutorias: tutorías confirmadas de hoy en adelante, de mis paralelos.
  proximas: () =>
    api.get('/tutorias').then((r) =>
      r.data.map((t) => ({
        id_rev: t.id_rev,
        aula: t.aula,
        bloque: t.bloque,
        piso: t.piso,
        fecha: aFechaISO(t.fecha),
        hora_ini: t.hora_ini,
        hora_fin: t.hora_fin,
        docente: t.docente,
        curso: t.curso,
        tema: t.tema,
        cancelada: false,
      }))
    ),

  // GET /api/asistencias/mias: tutorías a las que ya registré asistencia.
  asistidas: () =>
    api.get('/asistencias/mias').then((r) =>
      r.data.map((a) => ({ ...desdeReserva(a.reserva), hora_registro: a.hora_registro, validado_qr: a.validado_qr }))
    ),

  // GET /api/documentos/reserva/:id. Responde 403 si el estudiante no registró asistencia.
  documentos: (idReserva) => api.get(`/documentos/reserva/${idReserva}`).then((r) => r.data),
};
