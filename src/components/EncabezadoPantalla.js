import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores } from '../lib/tema';

// Encabezado propio de las pestañas: título grande alineado a la izquierda con una barra coral debajo
// (en lugar de la barra superior con título centrado del sistema).
export default function EncabezadoPantalla({ titulo, subtitulo, atras = false, derecha = null }) {
  const { top } = useSafeAreaInsets();

  return (
    <View style={[styles.caja, { paddingTop: top + 16 }]}>
      <View style={styles.fila}>
        {atras ? (
          <Pressable style={styles.atras} onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={20} color={colores.texto} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>{titulo}</Text>
          {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
        </View>
        {derecha}
      </View>
      <View style={styles.barra} />
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { paddingHorizontal: 20, paddingBottom: 12, backgroundColor: colores.fondo },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  atras: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: colores.linea, backgroundColor: colores.blanco, alignItems: 'center', justifyContent: 'center' },
  titulo: { color: colores.texto, fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  subtitulo: { color: colores.texto, opacity: 0.6, fontSize: 13, marginTop: 2 },
  barra: { width: 32, height: 3, backgroundColor: colores.acento, borderRadius: 2, marginTop: 10 },
});
