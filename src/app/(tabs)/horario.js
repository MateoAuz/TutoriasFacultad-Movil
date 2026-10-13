import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import EncabezadoPantalla from '../../components/EncabezadoPantalla';
import { matriculasApi, ofertaApi } from '../../api/matriculas';
import { tutoriasApi } from '../../api/tutorias';
import { useRecurso } from '../../hooks/useRecurso';
import { fechaDeHoy, semanaConDesplazamiento } from '../../lib/formato';
import { horaDeBloque } from '../../lib/horario';
import { colores } from '../../lib/tema';

const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Une bloques seguidos de la misma actividad (dos horas de la misma clase pasan a ser una sola franja).
function unirSeguidos(eventos) {
  const ordenados = [...eventos].sort((a, b) => aMinutos(a.ini) - aMinutos(b.ini));
  const unidos = [];
  for (const e of ordenados) {
    const previo = unidos[unidos.length - 1];
    if (previo && previo.tipo === e.tipo && previo.titulo === e.titulo && previo.aula === e.aula && previo.docente === e.docente && previo.fin === e.ini) {
      previo.fin = e.fin;
    } else if (!unidos.some((u) => u.tipo === e.tipo && u.titulo === e.titulo && u.aula === e.aula && u.ini === e.ini && u.fin === e.fin)) {
      unidos.push({ ...e });
    }
  }
  return unidos;
}

/**
 * Horario semanal del estudiante (como en la web): selector de día de lunes a viernes y, debajo,
 * sus clases y tutorías de ese día en orden cronológico.
 */
export default function Horario() {
  const [desplazamiento, setDesplazamiento] = useState(0);
  const semana = useMemo(() => semanaConDesplazamiento(desplazamiento), [desplazamiento]);
  const hoy = fechaDeHoy();
  const [diaElegido, setDiaElegido] = useState(() => {
    const idx = semanaConDesplazamiento(0).dias.findIndex((d) => d.iso === hoy);
    return idx >= 0 ? idx : 0;
  });

  const matriculas = useRecurso(matriculasApi.mias, 'No se pudieron cargar tus cursos.');
  const oferta = useRecurso(ofertaApi.paralelos, 'No se pudo cargar el horario de clases.');
  const proximas = useRecurso(tutoriasApi.proximas, 'No se pudieron cargar las tutorías.');
  const asistidas = useRecurso(tutoriasApi.asistidas, 'No se pudo cargar tu historial.');

  const recursos = [matriculas, oferta, proximas, asistidas];
  const cargando = recursos.some((r) => r.cargando);
  const mensajeError = recursos.find((r) => r.mensajeError)?.mensajeError ?? null;
  const refrescando = recursos.some((r) => r.refrescando);
  const refrescar = () => recursos.forEach((r) => r.refrescar());

  // Clases de la semana: bloques de los paralelos en los que estoy matriculado.
  const clases = useMemo(() => {
    const mios = new Set((matriculas.data ?? []).map((m) => m.id_par));
    return (oferta.data ?? [])
      .filter((p) => mios.has(p.id_par))
      .flatMap((p) =>
        (p.horarios ?? []).map((h) => ({
          tipo: 'CLASE',
          dia: h.dia_semana,
          titulo: p.materia?.nom_mat ?? 'Clase',
          detalle: `Paralelo ${p.nom_par}`,
          aula: h.espacio?.nom_esp ?? '—',
          docente: p.docente ? `${p.docente.nombres} ${p.docente.apellidos}` : '—',
          ini: horaDeBloque(h.hora_ini),
          fin: horaDeBloque(h.hora_fin),
        }))
      );
  }, [matriculas.data, oferta.data]);

  // Tutorías (próximas y a las que ya asistí), sin repetir.
  const tutorias = useMemo(() => {
    const porId = new Map();
    [...(asistidas.data ?? []), ...(proximas.data ?? [])].forEach((t) => {
      if (!t.cancelada) porId.set(t.id_rev, t);
    });
    return [...porId.values()];
  }, [asistidas.data, proximas.data]);

  const dia = semana.dias[diaElegido];
  const eventosDe = (d) =>
    unirSeguidos([
      ...clases.filter((c) => c.dia === d.clave),
      ...tutorias
        .filter((t) => t.fecha === d.iso)
        .map((t) => ({ tipo: 'TUTORIA', titulo: t.curso || t.tema, detalle: t.curso ? t.tema : 'Tutoría', aula: t.aula, docente: t.docente, ini: t.hora_ini, fin: t.hora_fin })),
    ]);
  const eventos = eventosDe(dia);

  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const esSemanaActual = desplazamiento === 0;

  function irAHoy() {
    setDesplazamiento(0);
    const idx = semanaConDesplazamiento(0).dias.findIndex((d) => d.iso === hoy);
    setDiaElegido(idx >= 0 ? idx : 0);
  }

  return (
    <View style={styles.pantalla}>
      <EncabezadoPantalla titulo="Horario" subtitulo="Tus clases y tutorías de la semana" />

      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} colors={[colores.primario]} />}
      >
        {/* Semana */}
        <View style={styles.semana}>
          <Pressable style={styles.flecha} onPress={() => setDesplazamiento((d) => d - 1)} hitSlop={8} accessibilityLabel="Semana anterior">
            <Feather name="chevron-left" size={20} color={colores.primario} />
          </Pressable>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={styles.rango}>{semana.rango}</Text>
            {!esSemanaActual || dia.iso !== hoy ? (
              <Pressable onPress={irAHoy} hitSlop={6}>
                <Text style={styles.irHoy}>Ir a hoy</Text>
              </Pressable>
            ) : (
              <Text style={styles.estaSemana}>Esta semana</Text>
            )}
          </View>
          <Pressable style={styles.flecha} onPress={() => setDesplazamiento((d) => d + 1)} hitSlop={8} accessibilityLabel="Semana siguiente">
            <Feather name="chevron-right" size={20} color={colores.primario} />
          </Pressable>
        </View>

        {/* Días */}
        <View style={styles.dias}>
          {semana.dias.map((d, i) => {
            const activo = i === diaElegido;
            const hayEventos = !cargando && eventosDe(d).length > 0;
            return (
              <Pressable key={d.iso} style={[styles.dia, activo && styles.diaActivo, d.iso === hoy && !activo && styles.diaHoy]} onPress={() => setDiaElegido(i)}>
                <Text style={[styles.diaAbrev, activo && styles.diaTextoActivo]}>{d.abrev}</Text>
                <Text style={[styles.diaNumero, activo && styles.diaTextoActivo]}>{d.numero}</Text>
                <View style={[styles.punto, hayEventos && { backgroundColor: activo ? colores.blanco : colores.primarioClaro }]} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.titulo}>
          <Text style={styles.tituloTexto}>{dia.nombre}</Text>
          {!cargando ? (
            <Text style={styles.contador}>
              {eventos.length} {eventos.length === 1 ? 'actividad' : 'actividades'}
            </Text>
          ) : null}
        </View>

        {cargando ? (
          <ActivityIndicator color={colores.primario} style={{ marginTop: 24 }} />
        ) : mensajeError ? (
          <Pressable style={styles.vacio} onPress={refrescar}>
            <Text style={styles.error}>{mensajeError}</Text>
            <Text style={styles.reintentar}>Reintentar</Text>
          </Pressable>
        ) : eventos.length === 0 ? (
          <View style={styles.vacio}>
            <Feather name="coffee" size={20} color={colores.primario} />
            <Text style={styles.vacioTexto}>No tienes clases ni tutorías este día.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {eventos.map((e, i) => {
              const enCurso = dia.iso === hoy && aMinutos(e.ini) <= minutosAhora && minutosAhora < aMinutos(e.fin);
              const esTutoria = e.tipo === 'TUTORIA';
              return (
                <View key={`${e.tipo}-${e.ini}-${i}`} style={[styles.evento, enCurso && styles.eventoActual]}>
                  <View style={styles.horas}>
                    <Text style={styles.horaIni}>{e.ini}</Text>
                    <View style={styles.horaLinea} />
                    <Text style={styles.horaFin}>{e.fin}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.etiquetas}>
                      <View style={[styles.etiqueta, { backgroundColor: esTutoria ? colores.acentoSuave : colores.primarioSuave }]}>
                        <Text style={[styles.etiquetaTexto, { color: esTutoria ? colores.acento : colores.primario }]}>{esTutoria ? 'Tutoría' : 'Clase'}</Text>
                      </View>
                      {enCurso ? (
                        <View style={[styles.etiqueta, { backgroundColor: colores.primario }]}>
                          <Text style={[styles.etiquetaTexto, { color: colores.blanco }]}>Ahora</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.eventoTitulo} numberOfLines={2}>
                      {e.titulo}
                    </Text>
                    <Text style={styles.eventoDetalle} numberOfLines={1}>
                      {e.detalle}
                    </Text>
                    <View style={styles.meta}>
                      <Feather name="map-pin" size={13} color={colores.texto} style={{ opacity: 0.55 }} />
                      <Text style={styles.metaTexto} numberOfLines={1}>
                        {e.aula}
                      </Text>
                      <Feather name="user" size={13} color={colores.texto} style={{ opacity: 0.55, marginLeft: 8 }} />
                      <Text style={[styles.metaTexto, { flexShrink: 1 }]} numberOfLines={1}>
                        {e.docente}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { paddingHorizontal: 20, paddingBottom: 120, gap: 14 },
  semana: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, paddingVertical: 10, paddingHorizontal: 8 },
  flecha: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  rango: { color: colores.texto, fontWeight: '700', fontSize: 15 },
  irHoy: { color: colores.primario, fontWeight: '700', fontSize: 12 },
  estaSemana: { color: colores.texto, opacity: 0.5, fontSize: 12 },
  dias: { flexDirection: 'row', gap: 8 },
  dia: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 10, borderRadius: 12, backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.linea },
  diaActivo: { backgroundColor: colores.primario, borderColor: colores.primario },
  diaHoy: { borderColor: colores.primario, borderWidth: 1.5 },
  diaAbrev: { color: colores.texto, opacity: 0.6, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  diaNumero: { color: colores.texto, fontSize: 19, fontWeight: '700' },
  diaTextoActivo: { color: colores.blanco, opacity: 1 },
  punto: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent', marginTop: 2 },
  titulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  tituloTexto: { color: colores.texto, fontSize: 17, fontWeight: '700' },
  contador: { color: colores.primario, backgroundColor: colores.primarioSuave, borderRadius: 6, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '600' },
  vacio: { backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, padding: 20, alignItems: 'center', gap: 8 },
  vacioTexto: { color: colores.texto, opacity: 0.6, textAlign: 'center' },
  error: { color: colores.peligro, textAlign: 'center' },
  reintentar: { color: colores.primario, fontWeight: '700' },
  evento: { flexDirection: 'row', gap: 14, backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, padding: 14 },
  eventoActual: { borderColor: colores.primario, borderWidth: 1.5 },
  horas: { alignItems: 'center', width: 46 },
  horaIni: { color: colores.texto, fontWeight: '700', fontSize: 15 },
  horaLinea: { width: 14, height: 1, backgroundColor: colores.linea, marginVertical: 4 },
  horaFin: { color: colores.texto, opacity: 0.5, fontSize: 13 },
  etiquetas: { flexDirection: 'row', gap: 6 },
  etiqueta: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  etiquetaTexto: { fontSize: 11, fontWeight: '700' },
  eventoTitulo: { color: colores.texto, fontSize: 15, fontWeight: '700' },
  eventoDetalle: { color: colores.texto, opacity: 0.6, fontSize: 13 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  metaTexto: { color: colores.texto, opacity: 0.7, fontSize: 12 },
});
