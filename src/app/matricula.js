import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import EstadoCarga from '../components/EstadoCarga';
import SelectorOpciones from '../components/SelectorOpciones';
import { mensajeDeError } from '../api/client';
import { matriculasApi, ofertaApi } from '../api/matriculas';
import { useRecurso } from '../hooks/useRecurso';
import { ABREV_DIA, franjasDeHorario, primerChoque, horaDeBloque } from '../lib/horario';
import { colores } from '../lib/tema';

// Debe coincidir con MAX_MATERIAS_POR_ESTUDIANTE del backend (routes/matriculas.js).
const MAX_MATERIAS = 5;

const normalizar = (texto) => String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

async function cargarTodo() {
  const [carreras, paralelos, matriculas] = await Promise.all([ofertaApi.carreras(), ofertaApi.paralelos(), matriculasApi.mias()]);
  return { carreras, paralelos, matriculas };
}

/**
 * Automatrícula: se ve la oferta de paralelos de una carrera y el estudiante se inscribe.
 * Puede mezclar niveles; el sistema solo impide pasar de 5 materias, repetir una materia o cruzar horarios.
 */
export default function Matricula() {
  const { data, cargando, refrescando, mensajeError, refrescar } = useRecurso(cargarTodo, 'No se pudo cargar la oferta de materias.');
  const [idCarrera, setIdCarrera] = useState(null);
  const [idNivel, setIdNivel] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [selector, setSelector] = useState(null); // 'carrera' | 'nivel' | null
  const [procesando, setProcesando] = useState(null); // id_par o id_matricula en curso

  const carreras = data?.carreras ?? [];
  const paralelos = data?.paralelos ?? [];
  const matriculas = data?.matriculas ?? [];
  const paraleloPorId = useMemo(() => new Map(paralelos.map((p) => [p.id_par, p])), [paralelos]);

  // Mis materias con el horario completo del paralelo (viene en la oferta).
  const misMaterias = useMemo(() => matriculas.map((m) => ({ ...m, paralelo: paraleloPorId.get(m.id_par) || m.paralelo })), [matriculas, paraleloPorId]);

  // Carrera por defecto: la de la mayoría de mis materias; si no tengo, la primera.
  const carreraPorDefecto = useMemo(() => {
    const conteo = new Map();
    misMaterias.forEach((m) => {
      const id = m.paralelo?.nivel?.carrera?.id_car;
      if (id) conteo.set(id, (conteo.get(id) || 0) + 1);
    });
    return [...conteo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? carreras[0]?.id_car ?? null;
  }, [misMaterias, carreras]);
  const carreraActiva = idCarrera ?? carreraPorDefecto;
  const niveles = carreras.find((c) => c.id_car === carreraActiva)?.niveles ?? [];

  // Motivo por el que no puede inscribirse en un paralelo (o null si puede).
  function motivoBloqueo(p) {
    if (misMaterias.some((m) => m.id_par === p.id_par)) return { texto: 'Inscrito', tipo: 'ok' };
    if (misMaterias.length >= MAX_MATERIAS) return { texto: `Límite de ${MAX_MATERIAS} materias` };
    const misma = misMaterias.find((m) => m.paralelo?.materia?.id_mat === p.materia?.id_mat);
    if (misma) return { texto: `Ya tienes esta materia (paralelo ${misma.paralelo.nom_par})` };
    for (const m of misMaterias) {
      const choque = primerChoque(p.horarios, m.paralelo?.horarios);
      if (choque) return { texto: `Choca con ${m.paralelo.materia?.nom_mat} (${ABREV_DIA[choque.dia_semana]} ${horaDeBloque(choque.hora_ini)})` };
    }
    return null;
  }

  const oferta = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    return paralelos
      .filter((p) => p.nivel?.carrera?.id_car === carreraActiva)
      .filter((p) => !idNivel || p.nivel?.id_niv === idNivel)
      .filter((p) => {
        if (!palabras.length) return true;
        const texto = normalizar(`${p.materia?.nom_mat} paralelo ${p.nom_par} ${p.nivel?.nom_niv} ${p.docente?.nombres} ${p.docente?.apellidos}`);
        return palabras.every((x) => texto.includes(x));
      })
      .sort(
        (a, b) =>
          (a.nivel?.id_niv ?? 0) - (b.nivel?.id_niv ?? 0) || a.materia.nom_mat.localeCompare(b.materia.nom_mat) || a.nom_par.localeCompare(b.nom_par)
      );
  }, [paralelos, carreraActiva, idNivel, busqueda]);

  async function inscribirme(p) {
    setProcesando(p.id_par);
    try {
      await matriculasApi.inscribirme(p.id_par);
      Alert.alert('Inscripción lista', `Te inscribiste en ${p.materia?.nom_mat} · Paralelo ${p.nom_par}.`);
      await refrescar();
    } catch (err) {
      Alert.alert('No se pudo inscribir', mensajeDeError(err, 'No se pudo completar la inscripción.'));
    } finally {
      setProcesando(null);
    }
  }

  function confirmarRetiro(m) {
    Alert.alert('Retirarme de la materia', `¿Quieres retirarte de ${m.paralelo?.materia?.nom_mat} · Paralelo ${m.paralelo?.nom_par}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Retirarme',
        style: 'destructive',
        onPress: async () => {
          setProcesando(m.id_matricula);
          try {
            await matriculasApi.retirarme(m.id_matricula);
            await refrescar();
          } catch (err) {
            Alert.alert('No se pudo retirar', mensajeDeError(err, 'No se pudo retirar la materia.'));
          } finally {
            setProcesando(null);
          }
        },
      },
    ]);
  }

  const opcionesCarrera = carreras.map((c) => ({ clave: c.id_car, etiqueta: c.nom_car }));
  const opcionesNivel = [{ clave: null, etiqueta: 'Todos los niveles' }, ...niveles.map((n) => ({ clave: n.id_niv, etiqueta: n.nom_niv }))];
  const nombreCarrera = carreras.find((c) => c.id_car === carreraActiva)?.nom_car ?? 'Carrera';
  const nombreNivel = niveles.find((n) => n.id_niv === idNivel)?.nom_niv ?? 'Todos los niveles';

  const cabecera = (
    <View style={{ gap: 10 }}>
      <Text style={styles.intro}>Inscríbete hasta en {MAX_MATERIAS} materias. Puedes combinar niveles siempre que los horarios no se crucen.</Text>

      <View style={styles.tituloFila}>
        <Text style={styles.seccion}>Mis materias</Text>
        <Text style={styles.contador}>
          {misMaterias.length} de {MAX_MATERIAS}
        </Text>
      </View>
      {misMaterias.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioTexto}>Todavía no estás inscrito en ninguna materia. Elige tus paralelos en la oferta de abajo.</Text>
        </View>
      ) : (
        misMaterias.map((m) => (
          <View key={m.id_matricula} style={styles.tarjeta}>
            <Text style={styles.materia}>{m.paralelo?.materia?.nom_mat}</Text>
            <Text style={styles.detalle}>
              Paralelo {m.paralelo?.nom_par} · {m.paralelo?.nivel?.nom_niv}
            </Text>
            <Text style={styles.detalle}>
              {m.paralelo?.docente?.nombres} {m.paralelo?.docente?.apellidos}
            </Text>
            <Text style={styles.horario}>{franjasDeHorario(m.paralelo?.horarios).join('  ·  ') || 'Sin horario cargado'}</Text>
            <Pressable style={styles.retirar} disabled={procesando === m.id_matricula} onPress={() => confirmarRetiro(m)}>
              {procesando === m.id_matricula ? <ActivityIndicator color={colores.peligro} /> : <Text style={styles.retirarTexto}>Retirarme</Text>}
            </Pressable>
          </View>
        ))
      )}

      <Text style={[styles.seccion, { marginTop: 10 }]}>Oferta de paralelos</Text>
      {misMaterias.length >= MAX_MATERIAS ? (
        <View style={styles.aviso}>
          <Text style={styles.avisoTexto}>Ya tienes {MAX_MATERIAS} materias. Para inscribirte en otra, primero retírate de una.</Text>
        </View>
      ) : null}

      <View style={styles.filtros}>
        <Pressable style={styles.selector} onPress={() => setSelector('carrera')}>
          <Text style={styles.selectorTexto} numberOfLines={1}>
            {nombreCarrera} ▾
          </Text>
        </Pressable>
        <Pressable style={styles.selector} onPress={() => setSelector('nivel')}>
          <Text style={styles.selectorTexto} numberOfLines={1}>
            {nombreNivel} ▾
          </Text>
        </Pressable>
      </View>
      <TextInput
        style={styles.buscador}
        placeholder="Buscar materia o docente"
        placeholderTextColor="#8A96A8"
        value={busqueda}
        onChangeText={setBusqueda}
        autoCorrect={false}
      />
    </View>
  );

  return (
    <View style={styles.pantalla}>
      <EstadoCarga cargando={cargando} error={mensajeError} vacio={false} onReintentar={refrescar}>
        <FlatList
          data={oferta}
          keyExtractor={(p) => String(p.id_par)}
          contentContainerStyle={styles.lista}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={cabecera}
          ListEmptyComponent={<Text style={styles.sinResultados}>No hay paralelos que coincidan con los filtros.</Text>}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} colors={[colores.primario]} />}
          renderItem={({ item }) => {
            const bloqueo = motivoBloqueo(item);
            return (
              <View style={[styles.tarjeta, { marginTop: 0 }]}>
                <Text style={styles.materia}>{item.materia?.nom_mat}</Text>
                <Text style={styles.detalle}>
                  Paralelo {item.nom_par} · {item.nivel?.nom_niv}
                </Text>
                <Text style={styles.detalle}>
                  {item.docente?.nombres} {item.docente?.apellidos}
                </Text>
                <Text style={styles.horario}>{franjasDeHorario(item.horarios).join('  ·  ') || 'Sin horario cargado'}</Text>
                {bloqueo ? (
                  <Text style={[styles.bloqueo, bloqueo.tipo === 'ok' && styles.bloqueoOk]}>{bloqueo.texto}</Text>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.inscribir, (procesando !== null) && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}
                    disabled={procesando !== null}
                    onPress={() => inscribirme(item)}
                  >
                    {procesando === item.id_par ? <ActivityIndicator color={colores.blanco} /> : <Text style={styles.inscribirTexto}>Inscribirme</Text>}
                  </Pressable>
                )}
              </View>
            );
          }}
        />
      </EstadoCarga>

      <SelectorOpciones
        visible={selector !== null}
        titulo={selector === 'carrera' ? 'Carrera' : 'Nivel'}
        opciones={selector === 'carrera' ? opcionesCarrera : opcionesNivel}
        valor={selector === 'carrera' ? carreraActiva : idNivel}
        onElegir={(clave) => {
          if (selector === 'carrera') {
            setIdCarrera(clave);
            setIdNivel(null);
          } else {
            setIdNivel(clave);
          }
          setSelector(null);
        }}
        onCerrar={() => setSelector(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  lista: { padding: 16, paddingBottom: 40 },
  intro: { color: colores.texto, opacity: 0.65, fontSize: 13 },
  tituloFila: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  seccion: { color: colores.texto, fontSize: 17, fontWeight: '700' },
  contador: { color: colores.texto, opacity: 0.5, fontWeight: '600' },
  vacio: { backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, padding: 16 },
  vacioTexto: { color: colores.texto, opacity: 0.6, textAlign: 'center' },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, padding: 14, gap: 3 },
  materia: { color: colores.texto, fontSize: 16, fontWeight: '700' },
  detalle: { color: colores.texto, opacity: 0.65, fontSize: 13 },
  horario: { color: colores.primario, fontSize: 12, fontWeight: '600', marginTop: 4 },
  retirar: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4, marginTop: 4 },
  retirarTexto: { color: colores.peligro, fontWeight: '700' },
  aviso: { backgroundColor: '#3E7CB11F', borderRadius: 12, padding: 12 },
  avisoTexto: { color: colores.primarioOscuro, fontSize: 13 },
  filtros: { flexDirection: 'row', gap: 10 },
  selector: { flex: 1, backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, paddingHorizontal: 12, paddingVertical: 11 },
  selectorTexto: { color: colores.texto, fontWeight: '600', fontSize: 13 },
  buscador: { backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colores.texto, marginBottom: 4 },
  sinResultados: { color: colores.texto, opacity: 0.6, textAlign: 'center', paddingVertical: 24 },
  bloqueo: { color: colores.texto, opacity: 0.55, fontSize: 12, marginTop: 6 },
  bloqueoOk: { color: colores.exito, opacity: 1, fontWeight: '700' },
  inscribir: { backgroundColor: colores.primario, borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 8 },
  inscribirTexto: { color: colores.blanco, fontWeight: '700' },
});
