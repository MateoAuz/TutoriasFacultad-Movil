import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import EstadoCarga from '../../components/EstadoCarga';
import { useNotificaciones } from '../../context/NotificacionesContext';
import { tiempoRelativo } from '../../lib/formato';
import { colores } from '../../lib/tema';

// `t` fuerza a Tutorías a reaccionar aunque el parámetro `seccion` no haya cambiado.
const DESTINO_SOLICITUDES = () => ({ pathname: '/tutorias', params: { seccion: 'solicitudes', t: String(Date.now()) } });

// Etiqueta y destino al tocar cada tipo de aviso.
const TIPOS = {
  TUTORIA_INICIO: { etiqueta: 'Tutoría', destino: '/escanear' },
  DOCUMENTO_NUEVO: { etiqueta: 'Material', destino: '/tutorias' },
  RESERVA_CANCELADA: { etiqueta: 'Cancelada', destino: '/tutorias' },
  SOLICITUD_ACEPTADA: { etiqueta: 'Solicitud', destino: DESTINO_SOLICITUDES },
  SOLICITUD_RECHAZADA: { etiqueta: 'Solicitud', destino: DESTINO_SOLICITUDES },
  SOLICITUD_NUEVA: { etiqueta: 'Solicitud', destino: DESTINO_SOLICITUDES },
};

export default function Notificaciones() {
  const { notificaciones, noLeidas, cargando, error, recargar, marcarLeida, marcarTodasLeidas } = useNotificaciones();
  const [refrescando, setRefrescando] = useState(false);

  const refrescar = useCallback(async () => {
    setRefrescando(true);
    await recargar();
    setRefrescando(false);
  }, [recargar]);

  function abrir(n) {
    if (!n.leida) marcarLeida(n.id_not);
    const destino = TIPOS[n.tipo]?.destino;
    if (destino) router.navigate(typeof destino === 'function' ? destino() : destino);
  }

  return (
    <View style={styles.pantalla}>
      {noLeidas > 0 ? (
        <Pressable style={styles.marcarTodas} onPress={marcarTodasLeidas}>
          <Text style={styles.marcarTodasTexto}>Marcar todas como leídas ({noLeidas})</Text>
        </Pressable>
      ) : null}

      <EstadoCarga
        cargando={cargando}
        error={notificaciones.length === 0 ? error : null}
        vacio={notificaciones.length === 0}
        mensajeVacio="No tienes avisos por ahora."
        onReintentar={recargar}
      >
        <FlatList
          data={notificaciones}
          keyExtractor={(n) => String(n.id_not)}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} colors={[colores.azul]} />}
          renderItem={({ item }) => (
            <Pressable style={({ pressed }) => [styles.tarjeta, !item.leida && styles.tarjetaNueva, pressed && { opacity: 0.85 }]} onPress={() => abrir(item)}>
              <View style={styles.cabecera}>
                <Text style={styles.etiqueta}>{TIPOS[item.tipo]?.etiqueta ?? 'Aviso'}</Text>
                <View style={styles.derecha}>
                  <Text style={styles.tiempo}>{tiempoRelativo(item.creado_en)}</Text>
                  {!item.leida ? <View style={styles.punto} /> : null}
                </View>
              </View>
              <Text style={[styles.mensaje, !item.leida && styles.mensajeNuevo]}>{item.mensaje}</Text>
            </Pressable>
          )}
        />
      </EstadoCarga>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.paper },
  marcarTodas: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingTop: 12 },
  marcarTodasTexto: { color: colores.azul, fontWeight: '700' },
  lista: { padding: 16 },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, padding: 14, gap: 6 },
  tarjetaNueva: { borderColor: colores.azulClaro, backgroundColor: '#F4F9FE' },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etiqueta: { color: colores.celeste, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  derecha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tiempo: { color: colores.ink, opacity: 0.5, fontSize: 12 },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colores.azulClaro },
  mensaje: { color: colores.ink, opacity: 0.8, fontSize: 14, lineHeight: 20 },
  mensajeNuevo: { opacity: 1, fontWeight: '600' },
});
