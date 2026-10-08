import { StyleSheet, Text, View } from 'react-native';
import { colores } from '../lib/tema';

const ESTILOS = {
  PROXIMA: { fondo: '#2378AD26', texto: colores.celeste, etiqueta: 'Próxima' },
  EN_CURSO: { fondo: '#1B7A5B26', texto: colores.exito, etiqueta: 'En curso' },
  CONCLUIDA: { fondo: '#002C561A', texto: colores.azulOscuro, etiqueta: 'Concluida' },
  CANCELADA: { fondo: '#B3261E1A', texto: colores.peligro, etiqueta: 'Cancelada' },
  PENDIENTE: { fondo: '#2378AD26', texto: colores.celeste, etiqueta: 'Pendiente' },
  ACEPTADA: { fondo: '#1B7A5B26', texto: colores.exito, etiqueta: 'Aceptada' },
  RECHAZADA: { fondo: '#B3261E1A', texto: colores.peligro, etiqueta: 'Rechazada' },
  ASISTIDA: { fondo: '#1B7A5B26', texto: colores.exito, etiqueta: 'Asistencia registrada' },
};

export default function Insignia({ tipo }) {
  const estilo = ESTILOS[tipo];
  if (!estilo) return null;
  return (
    <View style={[styles.caja, { backgroundColor: estilo.fondo }]}>
      <Text style={[styles.texto, { color: estilo.texto }]}>{estilo.etiqueta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  texto: { fontSize: 12, fontWeight: '700' },
});
