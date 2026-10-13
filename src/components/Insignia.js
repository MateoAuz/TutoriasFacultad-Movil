import { StyleSheet, Text, View } from 'react-native';
import { colores } from '../lib/tema';

const ESTILOS = {
  PROXIMA: { fondo: '#3E7CB126', texto: colores.info, etiqueta: 'Próxima' },
  EN_CURSO: { fondo: '#2E7D5B26', texto: colores.exito, etiqueta: 'En curso' },
  CONCLUIDA: { fondo: '#0F4C811A', texto: colores.primarioOscuro, etiqueta: 'Concluida' },
  CANCELADA: { fondo: '#B4412F1A', texto: colores.peligro, etiqueta: 'Cancelada' },
  PENDIENTE: { fondo: '#3E7CB126', texto: colores.info, etiqueta: 'Pendiente' },
  ACEPTADA: { fondo: '#2E7D5B26', texto: colores.exito, etiqueta: 'Aceptada' },
  RECHAZADA: { fondo: '#B4412F1A', texto: colores.peligro, etiqueta: 'Rechazada' },
  ASISTIDA: { fondo: '#2E7D5B26', texto: colores.exito, etiqueta: 'Asistencia registrada' },
};

// `sobreOscuro` = versión clara para usar encima de fondos oscuros (tarjeta destacada).
export default function Insignia({ tipo, sobreOscuro = false }) {
  const estilo = ESTILOS[tipo];
  if (!estilo) return null;
  return (
    <View style={[styles.caja, { backgroundColor: sobreOscuro ? '#FFFFFF2E' : estilo.fondo }]}>
      <Text style={[styles.texto, { color: sobreOscuro ? colores.blanco : estilo.texto }]}>{estilo.etiqueta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  texto: { fontSize: 12, fontWeight: '700' },
});
