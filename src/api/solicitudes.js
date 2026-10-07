import api from './client';

export const solicitudesApi = {
  // POST /api/solicitudes -> el docente del paralelo la acepta o la rechaza
  crear: ({ id_par, id_esp, fecha, hor_ini, hor_fin, tema }) =>
    api.post('/solicitudes', { id_par, id_esp, fecha, hor_ini, hor_fin, tema: tema || undefined }).then((r) => r.data),
};

export const matriculasApi = {
  // GET /api/matriculas: para un estudiante, solo las suyas
  mias: () => api.get('/matriculas').then((r) => r.data),
};
