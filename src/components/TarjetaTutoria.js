import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Insignia from './Insignia';
import { estadoDeTutoria, fechaEtiqueta } from '../lib/formato';
import { colores } from '../lib/tema';

// `destacada` = versión oscura para la tutoría que está en curso.
export default function TarjetaTutoria({ tutoria, asistio = false, destacada = false, onPress, onEscanear }) {
  const estado = tutoria.cancelada ? 'CANCELADA' : estadoDeTutoria(tutoria);
  const claro = destacada ? colores.blanco : colores.texto;

  return (
    <Pressable
      style={({ pressed }) => [styles.tarjeta, destacada && styles.tarjetaDestacada, pressed && { opacity: 0.9 }]}
      onPress={onPress}
    >
      <Text style={[styles.cuando, destacada && { color: '#A9C8E6' }]}>
        {fechaEtiqueta(tutoria.fecha)} · {tutoria.hora_ini} – {tutoria.hora_fin}
      </Text>
      <Text style={[styles.titulo, { color: claro }]} numberOfLines={2}>
        {tutoria.curso || tutoria.tema}
      </Text>
      {tutoria.curso ? (
        <Text style={[styles.tema, { color: claro }]} numberOfLines={1}>
          {tutoria.tema}
        </Text>
      ) : null}

      <View style={styles.datos}>
        <View style={styles.dato}>
          <Feather name="map-pin" size={14} color={claro} style={{ opacity: 0.7 }} />
          <Text style={[styles.datoTexto, { color: claro }]} numberOfLines={1}>
            {tutoria.aula}
          </Text>
        </View>
        <View style={styles.dato}>
          <Feather name="user" size={14} color={claro} style={{ opacity: 0.7 }} />
          <Text style={[styles.datoTexto, { color: claro }]} numberOfLines={1}>
            {tutoria.docente}
          </Text>
        </View>
      </View>

      <View style={styles.insignias}>
        <Insignia tipo={estado} sobreOscuro={destacada} />
        {asistio && estado !== 'CANCELADA' ? <Insignia tipo="ASISTIDA" sobreOscuro={destacada} /> : null}
      </View>

      {onEscanear && estado === 'EN_CURSO' && !asistio ? (
        <Pressable style={({ pressed }) => [styles.escanear, destacada && styles.escanearClaro, pressed && { opacity: 0.88 }]} onPress={onEscanear}>
          <Text style={[styles.escanearTexto, destacada && { color: colores.primario }]}>Escanear QR para registrar asistencia</Text>
          <Feather name="arrow-right" size={16} color={destacada ? colores.primario : colores.blanco} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, padding: 16, gap: 4 },
  tarjetaDestacada: { backgroundColor: colores.primario, borderColor: colores.primario },
  cuando: { color: colores.acento, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  titulo: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  tema: { opacity: 0.75, fontSize: 14 },
  datos: { marginTop: 8, gap: 5 },
  dato: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  datoTexto: { opacity: 0.85, fontSize: 13, flexShrink: 1 },
  insignias: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  escanear: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colores.primario, borderRadius: 10, paddingVertical: 12, marginTop: 12 },
  escanearClaro: { backgroundColor: colores.blanco },
  escanearTexto: { color: colores.blanco, fontWeight: '700' },
});
