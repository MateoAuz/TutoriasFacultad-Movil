import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colores } from '../lib/tema';

// Cargando / error (con reintento) / vacío. Si no aplica ninguno, muestra los hijos.
export default function EstadoCarga({ cargando, error, vacio, mensajeVacio, onReintentar, children }) {
  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={colores.azul} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centro}>
        <Text style={styles.error}>{error}</Text>
        {onReintentar ? (
          <Pressable style={styles.boton} onPress={onReintentar}>
            <Text style={styles.botonTexto}>Reintentar</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  if (vacio) {
    return (
      <View style={styles.centro}>
        <Text style={styles.vacio}>{mensajeVacio}</Text>
      </View>
    );
  }
  return children;
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  error: { color: colores.peligro, textAlign: 'center' },
  vacio: { color: colores.ink, opacity: 0.6, textAlign: 'center' },
  boton: { backgroundColor: colores.azul, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  botonTexto: { color: colores.blanco, fontWeight: '700' },
});
