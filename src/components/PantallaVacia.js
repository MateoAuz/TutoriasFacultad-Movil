import { StyleSheet, Text, View } from 'react-native';
import { colores } from '../lib/tema';

// Marcador temporal de las pantallas que aún no se implementan.
export default function PantallaVacia({ titulo, detalle }) {
  return (
    <View style={styles.pantalla}>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.detalle}>{detalle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.paper, alignItems: 'center', justifyContent: 'center', padding: 24 },
  titulo: { color: colores.ink, fontSize: 20, fontWeight: '700', marginBottom: 6 },
  detalle: { color: colores.ink, opacity: 0.6, textAlign: 'center' },
});
