import api from './client';

export const matriculasApi = {
  // GET /api/matriculas: para un estudiante, solo las suyas
  mias: () => api.get('/matriculas').then((r) => r.data),

  // POST /api/matriculas/mias con { id_par }: valida máximo 5 materias, materia repetida y cruce de horarios
  inscribirme: (idParalelo) => api.post('/matriculas/mias', { id_par: idParalelo }).then((r) => r.data),

  // DELETE /api/matriculas/mias/:id
  retirarme: (idMatricula) => api.delete(`/matriculas/mias/${idMatricula}`).then((r) => r.data),
};

export const ofertaApi = {
  // GET /api/carreras -> carreras con sus niveles
  carreras: () => api.get('/carreras').then((r) => r.data),

  // GET /api/paralelos?conHorarios=1 -> oferta con horario semanal y docente
  paralelos: () => api.get('/paralelos', { params: { conHorarios: 1 } }).then((r) => r.data),
};
