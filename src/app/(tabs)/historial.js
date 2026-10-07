import { useMemo } from 'react';
import { Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import EstadoCarga from '../../components/EstadoCarga';
import { tutoriasApi } from '../../api/tutorias';
import { useRecurso } from '../../hooks/useRecurso';
import { fechaDeHoy, formatearFecha, horaLocal, mesYAnio } from '../../lib/formato';
import { colores } from '../../lib/tema';

export default function Historial() {
  const { data, cargando, refrescando, mensajeError, refrescar } = useRecurso(
    tutoriasApi.asistidas,
    'No se pudo cargar tu historial de asistencia.'
  );

  // Más recientes primero y agrupadas por mes, junto con los totales de arriba.
  const { secciones, total, esteMes, cursos } = useMemo(() => {
    const lista = [...(data ?? [])].sort((a, b) => (a.fecha + a.hora_ini < b.fecha + b.hora_ini ? 1 : -1));
    const porMes = new Map();
    for (const t of lista) {
      const mes = mesYAnio(t.fecha);
      if (!porMes.has(mes)) porMes.set(mes, []);
      porMes.get(mes).push(t);
    }
    return {
      secciones: [...porMes].map(([title, items]) => ({ title, data: items })),
      total: lista.length,
      esteMes: lista.filter((t) => t.fecha.slice(0, 7) === fechaDeHoy().slice(0, 7)).length,
      cursos: new Set(lista.map((t) => t.curso).filter(Boolean)).size,
    };
  }, [data]);

  function abrir(tutoria) {
    router.push({ pathname: '/tutoria/[id]', params: { id: String(tutoria.id_rev), datos: JSON.stringify(tutoria) } });
  }

  return (
    <View style={styles.pantalla}>
      <EstadoCarga
        cargando={cargando}
        error={mensajeError}
        vacio={total === 0}
        mensajeVacio="Todavía no has registrado asistencia a ninguna tutoría. Escanea el QR cuando comience una."
        onReintentar={refrescar}
      >
        <SectionList
          sections={secciones}
          keyExtractor={(t) => String(t.id_rev)}
          contentContainerStyle={styles.lista}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} colors={[colores.azul]} />}
          ListHeaderComponent={
            <View style={styles.resumen}>
              <Dato valor={total} etiqueta="Asistencias" />
              <Dato valor={esteMes} etiqueta="Este mes" />
              <Dato valor={cursos} etiqueta="Cursos" />
            </View>
          }
          renderSectionHeader={({ section }) => <Text style={styles.mes}>{section.title}</Text>}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <Pressable style={({ pressed }) => [styles.fila, pressed && { opacity: 0.85 }]} onPress={() => abrir(item)}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.curso} numberOfLines={1}>
                  {item.curso || item.tema}
                </Text>
                <Text style={styles.fecha}>
                  {formatearFecha(item.fecha)} · {item.hora_ini} – {item.hora_fin}
                </Text>
                <Text style={styles.registro}>
                  Registrada a las {horaLocal(item.hora_registro)} · {item.validado_qr ? 'por QR' : 'manual'}
                </Text>
              </View>
            </Pressable>
          )}
        />
      </EstadoCarga>
    </View>
  );
}

function Dato({ valor, etiqueta }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoValor}>{valor}</Text>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.paper },
  lista: { padding: 16 },
  resumen: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  dato: { flex: 1, backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, paddingVertical: 14, alignItems: 'center' },
  datoValor: { color: colores.azul, fontSize: 26, fontWeight: '800' },
  datoEtiqueta: { color: colores.ink, opacity: 0.6, fontSize: 12 },
  mes: { color: colores.celeste, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  fila: { backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, padding: 14 },
  curso: { color: colores.ink, fontWeight: '700', fontSize: 15 },
  fecha: { color: colores.azul, fontSize: 13, fontWeight: '600' },
  registro: { color: colores.ink, opacity: 0.55, fontSize: 12 },
});
