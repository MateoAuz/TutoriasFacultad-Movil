import api from './client';

export const authApi = {
  // POST /api/auth/login -> { token, usuario: { id, nombres, rol } }
  login: (correo, password) => api.post('/auth/login', { correo, password }).then((r) => r.data),
};
