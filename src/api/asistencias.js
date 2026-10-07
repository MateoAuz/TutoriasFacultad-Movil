import api from './client';

export const asistenciasApi = {
  // POST /api/asistencias/registrar con { qr_token }. El backend valida horario, matrícula y estado.
  registrar: (qrToken) => api.post('/asistencias/registrar', { qr_token: qrToken }).then((r) => r.data),
};
