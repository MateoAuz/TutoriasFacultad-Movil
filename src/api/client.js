import axios from 'axios';

// En el celular "localhost" no apunta a la PC: define EXPO_PUBLIC_API_URL en .env (ver .env.example).
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({ baseURL: API_URL, timeout: 15000 });

// El token vive en memoria para no leer el almacenamiento seguro en cada petición;
// AuthContext lo sincroniza al iniciar/cerrar sesión.
let token = null;
let alExpirarSesion = null;

export function setToken(nuevo) {
  token = nuevo;
}

export function setAlExpirarSesion(callback) {
  alExpirarSesion = callback;
}

api.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Igual que en el web: si el backend rechaza el token, se cierra la sesión.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const estado = error.response?.status;
    const mensaje = String(error.response?.data?.error || '').toLowerCase();
    if ((estado === 400 || estado === 401) && mensaje.includes('token')) {
      alExpirarSesion?.();
    }
    return Promise.reject(error);
  }
);

export function mensajeDeError(err, respaldo = 'Ocurrió un error inesperado.') {
  if (err?.response?.data?.error) return err.response.data.error;
  if (err?.code === 'ECONNABORTED' || err?.message === 'Network Error') {
    return 'No se pudo conectar con el servidor. Revisa tu conexión y la URL del backend.';
  }
  return respaldo;
}

export default api;
