import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { notificacionesApi } from '../api/notificaciones';
import { mensajeDeError } from '../api/client';

const INTERVALO_MS = 30000;

const NotificacionesContext = createContext(null);

// Mantiene las notificaciones al día mientras la app está abierta: consulta cada 30 s
// y al volver del segundo plano. Sirve para el contador de la pestaña y para la lista.
export function NotificacionesProvider({ children }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const recargar = useCallback(async () => {
    try {
      const lista = await notificacionesApi.listar();
      if (!montado.current) return;
      setNotificaciones(lista);
      setError(null);
    } catch (err) {
      if (montado.current) setError(mensajeDeError(err, 'No se pudieron cargar los avisos.'));
    } finally {
      if (montado.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
    const intervalo = setInterval(recargar, INTERVALO_MS);
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') recargar();
    });
    return () => {
      clearInterval(intervalo);
      suscripcion.remove();
    };
  }, [recargar]);

  const marcarLeida = useCallback(async (id) => {
    setNotificaciones((prev) => prev.map((n) => (n.id_not === id ? { ...n, leida: true } : n)));
    try {
      await notificacionesApi.marcarLeida(id);
    } catch {
      recargar(); // si falló, vuelve al estado real del servidor
    }
  }, [recargar]);

  const marcarTodasLeidas = useCallback(async () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    try {
      await notificacionesApi.marcarTodasLeidas();
    } catch {
      recargar();
    }
  }, [recargar]);

  const noLeidas = useMemo(() => notificaciones.filter((n) => !n.leida).length, [notificaciones]);

  const valor = useMemo(
    () => ({ notificaciones, noLeidas, cargando, error, recargar, marcarLeida, marcarTodasLeidas }),
    [notificaciones, noLeidas, cargando, error, recargar, marcarLeida, marcarTodasLeidas]
  );

  return <NotificacionesContext.Provider value={valor}>{children}</NotificacionesContext.Provider>;
}

export function useNotificaciones() {
  const ctx = useContext(NotificacionesContext);
  if (!ctx) throw new Error('useNotificaciones debe usarse dentro de NotificacionesProvider');
  return ctx;
}
