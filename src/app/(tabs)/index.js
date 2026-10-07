import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import EstadoCarga from '../../components/EstadoCarga';
import TarjetaTutoria from '../../components/TarjetaTutoria';
import { tutoriasApi } from '../../api/tutorias';
import { useRecurso } from '../../hooks/useRecurso';
import { colores } from '../../lib/tema';

const SECCIONES = [
  { clave: 'proximas', etiqueta: 'Próximas' },
  { clave: 'realizadas', etiqueta: 'Realizadas' },
];

export default function Tutorias() {
  const [seccion, setSeccion] = useState('proximas');
  const proximas = useRecurso(tutoriasApi.proximas, 'No se pudieron cargar las tutorías.');
  const asistidas = useRecurso(tutoriasApi.asistidas, 'No se pudo cargar tu historial de tutorías.');

  // Ids de tutorías donde ya registré asistencia, para marcarlas también en "Próximas".
  const idsAsistidos = useMemo(() => new Set((asistidas.data ?? []).map((t) => t.id_rev)), [asistidas.data]);

  const activa = seccion === 'proximas' ? proximas : asistidas;
  const lista = activa.data ?? [];

  function abrir(tutoria) {
    router.push({ pathname: '/tutoria/[id]', params: { id: String(tutoria.id_rev), datos: JSON.stringify(tutoria) } });
  }

  return (
    <View style={styles.pantalla}>
      <View style={styles.segmentos}>
        {SECCIONES.map((s) => (
          <Pressable key={s.clave} style={[styles.segmento, seccion === s.clave && styles.segmentoActivo]} onPress={() => setSeccion(s.clave)}>
            <Text style={[styles.segmentoTexto, seccion === s.clave && styles.segmentoTextoActivo]}>{s.etiqueta}</Text>
          </Pressable>
        ))}
      </View>

      <EstadoCarga
        cargando={activa.cargando}
        error={activa.mensajeError}
        vacio={lista.length === 0}
        mensajeVacio={
          seccion === 'proximas'
            ? 'No tienes tutorías próximas. Revisa que estés matriculado en tus cursos.'
            : 'Todavía no has registrado asistencia a ninguna tutoría.'
        }
        onReintentar={activa.refrescar}
      >
        <FlatList
          data={lista}
          keyExtractor={(t) => String(t.id_rev)}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={<RefreshControl refreshing={activa.refrescando} onRefresh={activa.refrescar} colors={[colores.azul]} />}
          renderItem={({ item }) => <TarjetaTutoria tutoria={item} asistio={idsAsistidos.has(item.id_rev)} onPress={() => abrir(item)} />}
        />
      </EstadoCarga>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.paper },
  segmentos: { flexDirection: 'row', margin: 16, marginBottom: 4, backgroundColor: colores.linea, borderRadius: 12, padding: 4 },
  segmento: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  segmentoActivo: { backgroundColor: colores.blanco },
  segmentoTexto: { color: colores.ink, opacity: 0.6, fontWeight: '600' },
  segmentoTextoActivo: { color: colores.azul, opacity: 1 },
  lista: { padding: 16 },
});
