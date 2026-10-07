import { Pressable, StyleSheet, Text, View } from 'react-native';
import Insignia from './Insignia';
import { estadoDeTutoria, formatearFecha } from '../lib/formato';
import { colores } from '../lib/tema';

export default function TarjetaTutoria({ tutoria, asistio = false, onPress }) {
  const estado = tutoria.cancelada ? 'CANCELADA' : estadoDeTutoria(tutoria);

  return (
    <Pressable style={({ pressed }) => [styles.tarjeta, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <View style={styles.insignias}>
        <Insignia tipo={estado} />
        {asistio && estado !== 'CANCELADA' ? <Insignia tipo="ASISTIDA" /> : null}
      </View>
      <Text style={styles.titulo} numberOfLines={2}>
        {tutoria.curso || tutoria.tema}
      </Text>
      {tutoria.curso ? (
        <Text style={styles.tema} numberOfLines={1}>
          {tutoria.tema}
        </Text>
      ) : null}
      <Text style={styles.linea}>
        {formatearFecha(tutoria.fecha)} · {tutoria.hora_ini} – {tutoria.hora_fin}
      </Text>
      <Text style={styles.lineaSuave}>
        {tutoria.aula} · {tutoria.docente}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 14, borderWidth: 1, borderColor: colores.linea, padding: 16, gap: 4 },
  insignias: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  titulo: { color: colores.ink, fontSize: 16, fontWeight: '700' },
  tema: { color: colores.ink, opacity: 0.7, fontSize: 14 },
  linea: { color: colores.azul, fontSize: 14, fontWeight: '600', marginTop: 6 },
  lineaSuave: { color: colores.ink, opacity: 0.6, fontSize: 13 },
});
