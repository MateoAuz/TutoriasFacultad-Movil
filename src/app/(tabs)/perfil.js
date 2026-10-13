import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import EncabezadoPantalla from '../../components/EncabezadoPantalla';
import { useAuth } from '../../context/AuthContext';
import { colores } from '../../lib/tema';

export default function Perfil() {
  const { usuario, cerrarSesion } = useAuth();
  const nombres = (usuario?.nombres || '').trim();
  const iniciales = nombres
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <View style={styles.pantalla}>
      <EncabezadoPantalla titulo="Perfil" />
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.tarjeta}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{iniciales || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nombre}>{nombres}</Text>
            <View style={styles.rol}>
              <Text style={styles.rolTexto}>{usuario?.rol === 'ESTUDIANTE' ? 'Estudiante' : usuario?.rol}</Text>
            </View>
          </View>
        </View>

        <View style={styles.lista}>
          <Opcion icono="clipboard" titulo="Matrícula" detalle="Tus materias y paralelos" onPress={() => router.navigate('/matricula')} />
          <Opcion icono="clock" titulo="Historial de asistencia" detalle="Tutorías a las que asististe" onPress={() => router.navigate('/historial')} ultima />
        </View>

        <Pressable style={({ pressed }) => [styles.salir, pressed && { opacity: 0.85 }]} onPress={cerrarSesion}>
          <Feather name="log-out" size={18} color={colores.peligro} />
          <Text style={styles.salirTexto}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Opcion({ icono, titulo, detalle, ultima = false, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.opcion, !ultima && styles.opcionBorde, pressed && { backgroundColor: colores.fondo }]} onPress={onPress}>
      <View style={styles.opcionIcono}>
        <Feather name={icono} size={18} color={colores.primario} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.opcionTitulo}>{titulo}</Text>
        <Text style={styles.opcionDetalle}>{detalle}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colores.texto} style={{ opacity: 0.35 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { paddingHorizontal: 20, paddingBottom: 120, gap: 16 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, padding: 16 },
  avatar: { width: 60, height: 60, borderRadius: 12, backgroundColor: colores.primario, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: colores.blanco, fontSize: 22, fontWeight: '700' },
  nombre: { color: colores.texto, fontSize: 18, fontWeight: '700' },
  rol: { alignSelf: 'flex-start', backgroundColor: colores.acentoSuave, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  rolTexto: { color: colores.acento, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  lista: { backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, overflow: 'hidden' },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  opcionBorde: { borderBottomWidth: 1, borderBottomColor: colores.linea },
  opcionIcono: { width: 36, height: 36, borderRadius: 10, backgroundColor: colores.primarioSuave, alignItems: 'center', justifyContent: 'center' },
  opcionTitulo: { color: colores.texto, fontSize: 15, fontWeight: '700' },
  opcionDetalle: { color: colores.texto, opacity: 0.55, fontSize: 12, marginTop: 1 },
  salir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 12, borderWidth: 1.5, borderColor: colores.peligro, paddingVertical: 14 },
  salirTexto: { color: colores.peligro, fontWeight: '700', fontSize: 15 },
});
