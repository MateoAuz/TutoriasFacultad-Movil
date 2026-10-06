import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colores } from '../../lib/tema';

export default function Perfil() {
  const { usuario, cerrarSesion } = useAuth();
  return (
    <View style={styles.pantalla}>
      <Text style={styles.nombre}>{usuario?.nombres}</Text>
      <Text style={styles.rol}>{usuario?.rol}</Text>
      <Pressable style={styles.boton} onPress={cerrarSesion}>
        <Text style={styles.botonTexto}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.paper, padding: 24, gap: 8 },
  nombre: { color: colores.ink, fontSize: 22, fontWeight: '700' },
  rol: { color: colores.celeste, fontWeight: '600', marginBottom: 16 },
  boton: { backgroundColor: colores.peligro, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  botonTexto: { color: colores.blanco, fontWeight: '700' },
});
