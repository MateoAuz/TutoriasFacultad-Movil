import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import EstadoCarga from '../../components/EstadoCarga';
import TarjetaSolicitud from '../../components/TarjetaSolicitud';
import TarjetaTutoria from '../../components/TarjetaTutoria';
import { solicitudesApi } from '../../api/solicitudes';
import { tutoriasApi } from '../../api/tutorias';
import { useRecurso } from '../../hooks/useRecurso';
import { estadoDeTutoria } from '../../lib/formato';
import { colores } from '../../lib/tema';

// Las tutorías ya realizadas viven en la pestaña Historial; aquí solo lo que viene y lo que se pidió.
const SECCIONES = [
  { clave: 'proximas', etiqueta: 'Próximas' },
  { clave: 'solicitudes', etiqueta: 'Mis solicitudes' },
];

export default function Tutorias() {
  const { seccion: seccionInicial, t } = useLocalSearchParams();
  const [seccion, setSeccion] = useState('proximas');
  const proximas = useRecurso(tutoriasApi.proximas, 'No se pudieron cargar las tutorías.');
  const asistidas = useRecurso(tutoriasApi.asistidas, 'No se pudo cargar tu historial de tutorías.');
  const solicitudes = useRecurso(solicitudesApi.mias, 'No se pudieron cargar tus solicitudes.');

  // Permite abrir directo "Mis solicitudes" desde un aviso o tras enviar una solicitud.
  useEffect(() => {
    if (seccionInicial === 'solicitudes' || seccionInicial === 'proximas') setSeccion(seccionInicial);
  }, [seccionInicial, t]);

  // Tutorías donde ya registré asistencia, para marcarlas en "Próximas" (p. ej. la que está en curso).
  const idsAsistidos = useMemo(() => new Set((asistidas.data ?? []).map((a) => a.id_rev)), [asistidas.data]);

  // El estado depende de la hora: se recalcula cada minuto para que una tutoría pase sola a "En curso".
  const [minuto, setMinuto] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMinuto((m) => m + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // "En curso ahora" arriba y luego las próximas; las de hoy que ya terminaron se ocultan (están en Historial).
  const secciones = useMemo(() => {
    const vigentes = (proximas.data ?? []).filter((t) => estadoDeTutoria(t) !== 'CONCLUIDA');
    const enCurso = vigentes.filter((t) => estadoDeTutoria(t) === 'EN_CURSO');
    const siguientes = vigentes.filter((t) => estadoDeTutoria(t) !== 'EN_CURSO');
    return [
      ...(enCurso.length ? [{ title: 'En curso ahora', data: enCurso }] : []),
      ...(siguientes.length ? [{ title: 'Próximas', data: siguientes }] : []),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proximas.data, minuto]);

  const esProximas = seccion === 'proximas';
  const activa = esProximas ? proximas : solicitudes;
  const lista = esProximas ? secciones : (solicitudes.data ?? []);

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
          esProximas
            ? 'No tienes tutorías próximas. Revisa que estés matriculado en tus cursos o solicita una desde la pestaña Espacios.'
            : 'Aún no has enviado solicitudes. Busca un espacio libre en la pestaña Espacios y pide una tutoría.'
        }
        onReintentar={activa.refrescar}
      >
        {esProximas ? (
          <SectionList
            sections={secciones}
            keyExtractor={(item) => String(item.id_rev)}
            contentContainerStyle={styles.lista}
            stickySectionHeadersEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            refreshControl={<RefreshControl refreshing={activa.refrescando} onRefresh={activa.refrescar} colors={[colores.azul]} />}
            renderSectionHeader={({ section }) => <Text style={styles.encabezado}>{section.title}</Text>}
            renderItem={({ item }) => (
              <TarjetaTutoria
                tutoria={item}
                asistio={idsAsistidos.has(item.id_rev)}
                onPress={() => abrir(item)}
                onEscanear={() => router.navigate('/escanear')}
              />
            )}
          />
        ) : (
          <FlatList
            data={lista}
            keyExtractor={(item) => String(item.id_sol)}
            contentContainerStyle={styles.lista}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            refreshControl={<RefreshControl refreshing={activa.refrescando} onRefresh={activa.refrescar} colors={[colores.azul]} />}
            renderItem={({ item }) => <TarjetaSolicitud solicitud={item} />}
          />
        )}
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
  encabezado: { color: colores.celeste, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 8, marginBottom: 10 },
});
