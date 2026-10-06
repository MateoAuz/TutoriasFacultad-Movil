import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/auth';
import { mensajeDeError, setAlExpirarSesion, setToken } from '../api/client';

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [iniciando, setIniciando] = useState(true); // restaurando la sesión guardada
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cerrarSesion = useCallback(async () => {
    setToken(null);
    setUsuario(null);
    await Promise.all([SecureStore.deleteItemAsync(CLAVE_TOKEN), SecureStore.deleteItemAsync(CLAVE_USUARIO)]).catch(() => {});
  }, []);

  useEffect(() => {
    setAlExpirarSesion(cerrarSesion);
    (async () => {
      try {
        const [guardadoToken, guardadoUsuario] = await Promise.all([
          SecureStore.getItemAsync(CLAVE_TOKEN),
          SecureStore.getItemAsync(CLAVE_USUARIO),
        ]);
        if (guardadoToken && guardadoUsuario) {
          setToken(guardadoToken);
          setUsuario(JSON.parse(guardadoUsuario));
        }
      } catch {
        // Sin sesión guardada o almacenamiento ilegible: se pide login.
      } finally {
        setIniciando(false);
      }
    })();
  }, [cerrarSesion]);

  const iniciarSesion = useCallback(async (correo, password) => {
    setCargando(true);
    setError(null);
    try {
      const data = await authApi.login(correo.trim().toLowerCase(), password);
      if (data.usuario.rol !== 'ESTUDIANTE') {
        setError('Esta aplicación es solo para estudiantes. Usa la versión web con tu rol.');
        return false;
      }
      setToken(data.token);
      await SecureStore.setItemAsync(CLAVE_TOKEN, data.token);
      await SecureStore.setItemAsync(CLAVE_USUARIO, JSON.stringify(data.usuario));
      setUsuario(data.usuario);
      return true;
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo iniciar sesión.'));
      return false;
    } finally {
      setCargando(false);
    }
  }, []);

  const valor = useMemo(
    () => ({ usuario, iniciando, cargando, error, iniciarSesion, cerrarSesion }),
    [usuario, iniciando, cargando, error, iniciarSesion, cerrarSesion]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
