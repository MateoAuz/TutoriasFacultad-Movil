import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { asistenciasApi } from '../../api/asistencias';
import { mensajeDeError } from '../../api/client';
import { colores } from '../../lib/tema';

export default function Escanear() {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [camaraActiva, setCamaraActiva] = useState(false); // solo con la pestaña enfocada
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null); // { ok: boolean, mensaje: string }
  const bloqueado = useRef(false); // evita enviar el mismo QR varias veces mientras se responde

  // La cámara solo debe estar encendida mientras esta pestaña está a la vista.
  useFocusEffect(
    useCallback(() => {
      setCamaraActiva(true);
      return () => setCamaraActiva(false);
    }, [])
  );

  async function alEscanear({ data }) {
    if (bloqueado.current) return;
    bloqueado.current = true;
    setProcesando(true);
    try {
      const respuesta = await asistenciasApi.registrar(String(data).trim());
      setResultado({ ok: true, mensaje: respuesta.mensaje || 'Asistencia registrada correctamente.' });
    } catch (err) {
      setResultado({ ok: false, mensaje: mensajeDeError(err, 'No se pudo registrar la asistencia.') });
    } finally {
      setProcesando(false);
    }
  }

  function escanearOtro() {
    bloqueado.current = false;
    setResultado(null);
  }

  if (!permiso) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={colores.azul} />
      </View>
    );
  }

  if (!permiso.granted) {
    return (
      <View style={styles.centro}>
        <Text style={styles.titulo}>Necesitamos la cámara</Text>
        <Text style={styles.texto}>La cámara se usa solo para escanear el código QR que muestra el docente y registrar tu asistencia.</Text>
        <Pressable style={styles.boton} onPress={permiso.canAskAgain ? pedirPermiso : Linking.openSettings}>
          <Text style={styles.botonTexto}>{permiso.canAskAgain ? 'Permitir cámara' : 'Abrir ajustes'}</Text>
        </Pressable>
      </View>
    );
  }

  if (resultado) {
    return (
      <View style={styles.centro}>
        <View style={[styles.icono, { backgroundColor: resultado.ok ? colores.exito : colores.peligro }]}>
          <Text style={styles.iconoTexto}>{resultado.ok ? '✓' : '!'}</Text>
        </View>
        <Text style={styles.titulo}>{resultado.ok ? 'Asistencia registrada' : 'No se pudo registrar'}</Text>
        <Text style={styles.texto}>{resultado.mensaje}</Text>
        {resultado.ok ? (
          <Pressable style={styles.boton} onPress={() => { escanearOtro(); router.navigate('/tutorias'); }}>
            <Text style={styles.botonTexto}>Ver mis tutorías</Text>
          </Pressable>
        ) : null}
        <Pressable style={resultado.ok ? styles.botonSecundario : styles.boton} onPress={escanearOtro}>
          <Text style={resultado.ok ? styles.botonSecundarioTexto : styles.botonTexto}>{resultado.ok ? 'Escanear otro' : 'Intentar de nuevo'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.pantalla}>
      {camaraActiva ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={procesando ? undefined : alEscanear}
        />
      ) : null}

      <View style={styles.superposicion} pointerEvents="none">
        <View style={styles.marco} />
        <Text style={styles.ayuda}>{procesando ? 'Registrando asistencia…' : 'Apunta al código QR de la tutoría'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#000' },
  superposicion: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 20 },
  marco: { width: 240, height: 240, borderRadius: 20, borderWidth: 3, borderColor: colores.blanco },
  ayuda: { color: colores.blanco, fontWeight: '600', backgroundColor: '#00000099', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, overflow: 'hidden' },
  centro: { flex: 1, backgroundColor: colores.paper, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  icono: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  iconoTexto: { color: colores.blanco, fontSize: 32, fontWeight: '800' },
  titulo: { color: colores.ink, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  texto: { color: colores.ink, opacity: 0.7, textAlign: 'center' },
  boton: { backgroundColor: colores.azul, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 28, marginTop: 8 },
  botonTexto: { color: colores.blanco, fontWeight: '700' },
  botonSecundario: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  botonSecundarioTexto: { color: colores.azul, fontWeight: '700' },
});
