import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { asistenciasApi } from '../api/asistencias';
import { mensajeDeError } from '../api/client';
import { colores } from '../lib/tema';

// El escáner es una hoja que sube desde abajo (no una pantalla completa): la pantalla de atrás se
// sigue viendo y se cierra tocando fuera, con el botón o deslizando hacia atrás.
export default function Escanear() {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null); // { ok: boolean, mensaje: string }
  const bloqueado = useRef(false); // evita enviar el mismo QR varias veces mientras se responde

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

  function cerrar() {
    router.back();
  }

  return (
    <View style={styles.contenedor}>
      <Pressable style={styles.fondo} onPress={cerrar} />
      <View style={styles.hoja}>
        <View style={styles.asa} />
        <Text style={styles.titulo}>Escanear QR de asistencia</Text>

        {!permiso ? (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color={colores.primario} />
          </View>
        ) : !permiso.granted ? (
          <View style={styles.centro}>
            <Text style={styles.subtitulo}>Necesitamos la cámara</Text>
            <Text style={styles.texto}>Se usa solo para leer el código QR que muestra el docente y registrar tu asistencia.</Text>
            <Pressable style={styles.boton} onPress={permiso.canAskAgain ? pedirPermiso : Linking.openSettings}>
              <Text style={styles.botonTexto}>{permiso.canAskAgain ? 'Permitir cámara' : 'Abrir ajustes'}</Text>
            </Pressable>
          </View>
        ) : resultado ? (
          <View style={styles.centro}>
            <View style={[styles.icono, { backgroundColor: resultado.ok ? colores.exito : colores.peligro }]}>
              <Text style={styles.iconoTexto}>{resultado.ok ? '✓' : '!'}</Text>
            </View>
            <Text style={styles.subtitulo}>{resultado.ok ? 'Asistencia registrada' : 'No se pudo registrar'}</Text>
            <Text style={styles.texto}>{resultado.mensaje}</Text>
            {resultado.ok ? (
              <Pressable
                style={styles.boton}
                onPress={() => {
                  router.back();
                  router.navigate('/tutorias');
                }}
              >
                <Text style={styles.botonTexto}>Ver mis tutorías</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.boton} onPress={escanearOtro}>
                <Text style={styles.botonTexto}>Intentar de nuevo</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            <View style={styles.visor}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={procesando ? undefined : alEscanear}
              />
              <View style={styles.marco} pointerEvents="none" />
            </View>
            <Text style={styles.ayuda}>{procesando ? 'Registrando asistencia…' : 'Apunta al código QR de la tutoría'}</Text>
          </>
        )}

        <Pressable style={styles.cerrar} onPress={cerrar}>
          <Text style={styles.cerrarTexto}>{resultado?.ok ? 'Cerrar' : 'Cancelar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, justifyContent: 'flex-end' },
  fondo: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000080' },
  hoja: { backgroundColor: colores.blanco, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, gap: 12, alignItems: 'center' },
  asa: { width: 44, height: 5, borderRadius: 3, backgroundColor: colores.linea, marginBottom: 4 },
  titulo: { color: colores.texto, fontSize: 18, fontWeight: '700' },
  visor: { width: '100%', maxWidth: 320, aspectRatio: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000' },
  marco: { ...StyleSheet.absoluteFillObject, margin: 36, borderRadius: 16, borderWidth: 3, borderColor: '#FFFFFFCC' },
  ayuda: { color: colores.texto, opacity: 0.7, fontWeight: '600' },
  centro: { alignItems: 'center', gap: 10, paddingVertical: 24, paddingHorizontal: 8 },
  icono: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  iconoTexto: { color: colores.blanco, fontSize: 30, fontWeight: '700' },
  subtitulo: { color: colores.texto, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  texto: { color: colores.texto, opacity: 0.7, textAlign: 'center' },
  boton: { backgroundColor: colores.primario, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 28, marginTop: 6 },
  botonTexto: { color: colores.blanco, fontWeight: '700' },
  cerrar: { paddingVertical: 8, paddingHorizontal: 24 },
  cerrarTexto: { color: colores.primario, fontWeight: '700' },
});
