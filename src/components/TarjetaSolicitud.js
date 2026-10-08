import { StyleSheet, Text, View } from 'react-native';
import Insignia from './Insignia';
import { formatearFecha, tiempoRelativo } from '../lib/formato';
import { colores } from '../lib/tema';

const AYUDA = {
  PENDIENTE: 'Esperando la respuesta del docente.',
  ACEPTADA: 'Aceptada: la tutoría ya aparece en Próximas.',
};

export default function TarjetaSolicitud({ solicitud }) {
  return (
    <View style={styles.tarjeta}>
      <View style={styles.cabecera}>
        <Insignia tipo={solicitud.estado} />
        <Text style={styles.tiempo}>Enviada {tiempoRelativo(solicitud.creado_en).toLowerCase()}</Text>
      </View>
      <Text style={styles.titulo} numberOfLines={2}>
        {solicitud.curso}
      </Text>
      {solicitud.tema ? (
        <Text style={styles.tema} numberOfLines={2}>
          {solicitud.tema}
        </Text>
      ) : null}
      <Text style={styles.linea}>
        {formatearFecha(solicitud.fecha)} · {solicitud.hora_ini} – {solicitud.hora_fin}
      </Text>
      <Text style={styles.lineaSuave}>
        {solicitud.aula} · {solicitud.docente}
      </Text>

      {solicitud.estado === 'RECHAZADA' ? (
        <View style={styles.rechazo}>
          <Text style={styles.rechazoTitulo}>Motivo del rechazo</Text>
          <Text style={styles.rechazoTexto}>{solicitud.razon_rechazo || 'El docente no indicó un motivo.'}</Text>
        </View>
      ) : (
        <Text style={styles.ayuda}>{AYUDA[solicitud.estado]}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 14, borderWidth: 1, borderColor: colores.linea, padding: 16, gap: 4 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  tiempo: { color: colores.ink, opacity: 0.5, fontSize: 12 },
  titulo: { color: colores.ink, fontSize: 16, fontWeight: '700' },
  tema: { color: colores.ink, opacity: 0.7, fontSize: 14 },
  linea: { color: colores.azul, fontSize: 14, fontWeight: '600', marginTop: 6 },
  lineaSuave: { color: colores.ink, opacity: 0.6, fontSize: 13 },
  ayuda: { color: colores.ink, opacity: 0.55, fontSize: 12, marginTop: 8 },
  rechazo: { backgroundColor: '#B3261E14', borderRadius: 10, padding: 10, marginTop: 8, gap: 2 },
  rechazoTitulo: { color: colores.peligro, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  rechazoTexto: { color: colores.ink, fontSize: 13 },
});
