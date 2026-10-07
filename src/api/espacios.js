import api from './client';

export const espaciosApi = {
  // GET /api/disponibilidad?fecha=YYYY-MM-DD[&hora_ini=HH:MM&hora_fin=HH:MM]
  // Sin franja devuelve la agenda del día; con franja, `libre` indica si esa franja está disponible.
  disponibilidad: (fecha, horaIni, horaFin) =>
    api
      .get('/disponibilidad', { params: { fecha, ...(horaIni && horaFin ? { hora_ini: horaIni, hora_fin: horaFin } : {}) } })
      .then((r) => r.data),
};
