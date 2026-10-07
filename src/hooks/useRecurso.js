import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { mensajeDeError } from '../api/client';

// Carga un recurso al enfocar la pantalla y permite refrescarlo (pull-to-refresh).
// `cargar` debe ser estable (función de módulo o useCallback).
export function useRecurso(cargar, mensajeError = 'No se pudo cargar la información.') {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const ejecutar = useCallback(async () => {
    try {
      const resultado = await cargar();
      if (!montado.current) return;
      setData(resultado);
      setError(null);
    } catch (err) {
      if (!montado.current) return;
      setError(err);
    } finally {
      if (montado.current) {
        setCargando(false);
        setRefrescando(false);
      }
    }
  }, [cargar]);

  useFocusEffect(
    useCallback(() => {
      ejecutar();
    }, [ejecutar])
  );

  const refrescar = useCallback(() => {
    setRefrescando(true);
    return ejecutar();
  }, [ejecutar]);

  return {
    data,
    cargando,
    refrescando,
    error,
    mensajeError: error ? mensajeDeError(error, mensajeError) : null,
    refrescar,
  };
}
