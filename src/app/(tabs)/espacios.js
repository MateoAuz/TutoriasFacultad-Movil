import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import EncabezadoPantalla from '../../components/EncabezadoPantalla';
import EstadoCarga from '../../components/EstadoCarga';
import SelectorFecha from '../../components/SelectorFecha';
import SelectorFranja from '../../components/SelectorFranja';
import SelectorOpciones from '../../components/SelectorOpciones';
import { espaciosApi } from '../../api/espacios';
import { useRecurso } from '../../hooks/useRecurso';
import { ETIQUETA_BLOQUE, ETIQUETA_TIPO, diasHabiles, fechaDeHoy, fechaEtiqueta, horaAMinutos, minutosAHora, primerDiaHabil } from '../../lib/formato';
import { colores } from '../../lib/tema';

// Franja sugerida al abrir el selector: la hora de inicio hábil más cercana (de media en media hora)
// y una hora de duración. Mirando otro día, arranca con la primera hora de la jornada (07:00).
function franjaSugerida(fecha) {
  let inicio = 7 * 60;
  if (fecha === fechaDeHoy()) {
    const ahora = minutosAhora();
    inicio = Math.ceil(ahora / 30) * 30;
    if (inicio < 7 * 60) inicio = 7 * 60; // antes de que abra la jornada
    else if (inicio >= ALMUERZO_INI && inicio < ALMUERZO_FIN) inicio = ALMUERZO_FIN; // media hora de almuerzo
    else if (inicio >= FIN_JORNADA) inicio = ahora < FIN_JORNADA ? FIN_JORNADA - 30 : 7 * 60; // últimos minutos o jornada terminada
  }
  return { ini: minutosAHora(inicio), fin: minutosAHora(Math.min(inicio + 60, FIN_JORNADA)) };
}

const FILTROS = {
  tipo: {
    titulo: 'Tipo de espacio',
    etiqueta: 'Tipo',
    opciones: [
      { clave: null, etiqueta: 'Todos' },
      { clave: 'LABORATORIO', etiqueta: 'Laboratorios' },
      { clave: 'AULA', etiqueta: 'Aulas' },
    ],
  },
  bloque: {
    titulo: 'Bloque',
    etiqueta: 'Bloque',
    opciones: [
      { clave: null, etiqueta: 'Todos' },
      { clave: 'BLOQUE_1', etiqueta: 'Bloque 1' },
      { clave: 'BLOQUE_2', etiqueta: 'Bloque 2' },
    ],
  },
  estado: {
    titulo: 'Mostrar espacios',
    etiqueta: 'Estado',
    opciones: [
      { clave: null, etiqueta: 'Todos' },
      { clave: 'DISPONIBLES', etiqueta: 'Solo disponibles' },
      { clave: 'OCUPADOS', etiqueta: 'Solo ocupados' },
    ],
  },
};

const INICIO_JORNADA = 7 * 60;
const FIN_JORNADA = 20 * 60;
const ALMUERZO_INI = 13 * 60;
const ALMUERZO_FIN = 14 * 60;

// Para buscar sin importar mayúsculas ni tildes.
const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const minutosAhora = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

// Día con el que abre la pantalla: hoy, salvo fin de semana o jornada terminada (ahí, el siguiente día hábil).
function diaPorDefecto() {
  const [primero, siguiente] = diasHabiles(2);
  return primero.iso === fechaDeHoy() && minutosAhora() >= FIN_JORNADA ? siguiente.iso : primero.iso;
}

// Hora que se usa para decir "disponible ahora" cuando no hay horario elegido y se mira hoy.
// Solo existe dentro de la jornada (07:00 a 20:00); en el almuerzo se toma la hora en que termina.
function momentoDeReferencia(ahora) {
  if (ahora >= FIN_JORNADA) return { minutos: null, motivo: 'la jornada de hoy ya terminó' };
  if (ahora < INICIO_JORNADA) return { minutos: null, motivo: 'la jornada comienza a las 07:00' };
  if (ahora >= ALMUERZO_INI && ahora < ALMUERZO_FIN) return { minutos: ALMUERZO_FIN, motivo: 'hora de almuerzo' };
  return { minutos: ahora, motivo: null };
}

// ¿Hay una clase o reserva en curso en este instante? (ocupaciones con horas "HH:MM")
const ocupadoAhora = (espacio, ahora) => espacio.ocupaciones.some((o) => horaAMinutos(o.hora_ini) <= ahora && ahora < horaAMinutos(o.hora_fin));

export default function Espacios() {
  const [fecha, setFecha] = useState(diaPorDefecto);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [franja, setFranja] = useState(null); // null = agenda de todo el día; { ini, fin } = franja a consultar
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtros, setFiltros] = useState({ tipo: null, bloque: null, estado: null });
  const [filtroAbierto, setFiltroAbierto] = useState(null); // 'tipo' | 'bloque' | 'estado' | null

  // Para que "ahora" se actualice solo mientras la pantalla está abierta.
  const [, setMinuto] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMinuto((m) => m + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const horaIni = franja?.ini ?? null;
  const horaFin = franja?.fin ?? null;
  const conFranja = Boolean(franja);
  const esHoy = fecha === fechaDeHoy();
  const hoyEsHabil = primerDiaHabil() === fechaDeHoy();
  const referencia = momentoDeReferencia(minutosAhora());
  const enMomento = !conFranja && esHoy && referencia.minutos !== null; // sin horario y mirando hoy: disponibilidad "en este momento"
  const horaReferencia = referencia.minutos;
  const esAhoraMismo = referencia.motivo === null;
  // El filtro de estado solo tiene sentido si hay una hora concreta que evaluar: un horario elegido
  // (siempre dentro de la jornada) o el momento actual dentro de la jornada de hoy.
  const mostrarFiltroEstado = conFranja || enMomento;
  const estadoFiltro = mostrarFiltroEstado ? filtros.estado : null;

  const cargar = useCallback(() => espaciosApi.disponibilidad(fecha, horaIni, horaFin), [fecha, horaIni, horaFin]);
  const { data, cargando, refrescando, mensajeError, refrescar } = useRecurso(cargar, 'No se pudo consultar la disponibilidad.');

  // Cada espacio con su estado según lo que se está mirando: la franja elegida, el momento actual o todo el día.
  const espacios = useMemo(() => {
    const lista = (data?.espacios ?? []).map((e) => ({
      ...e,
      disponible: conFranja ? e.libre : enMomento ? !ocupadoAhora(e, horaReferencia) : e.libre,
    }));
    const texto = normalizar(busqueda);
    const filtrados = lista.filter(
      (e) =>
        (!texto || normalizar(e.nom_esp).includes(texto)) &&
        (!filtros.tipo || e.tipo === filtros.tipo) &&
        (!filtros.bloque || e.bloque === filtros.bloque) &&
        (!estadoFiltro || (estadoFiltro === 'DISPONIBLES' ? e.disponible : !e.disponible))
    );
    // Los disponibles primero y luego por nombre.
    return filtrados.sort((a, b) => Number(b.disponible) - Number(a.disponible) || a.nom_esp.localeCompare(b.nom_esp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, busqueda, filtros, estadoFiltro, conFranja, enMomento, horaReferencia]);

  function solicitar(esp) {
    router.push({
      pathname: '/solicitar',
      params: { id_esp: String(esp.id_esp), nom_esp: esp.nom_esp, fecha, hor_ini: horaIni, hor_fin: horaFin },
    });
  }

  // Texto que aclara qué significa el filtro de estado según lo que se está mirando.
  const esDisponibles = estadoFiltro === 'DISPONIBLES';
  const textoFiltro = conFranja
    ? `${esDisponibles ? 'Disponibles' : 'Ocupados'} de ${horaIni} a ${horaFin}`
    : `${esDisponibles ? 'Disponibles' : 'Ocupados'} ${esAhoraMismo ? `ahora (${minutosAHora(horaReferencia ?? 0)})` : `a las ${minutosAHora(horaReferencia ?? 0)}`}`;
  const textoEstadoHoy = esAhoraMismo ? `Estado ahora (${minutosAHora(horaReferencia ?? 0)})` : `Estado a las ${minutosAHora(horaReferencia ?? 0)}`;

  return (
    <View style={styles.pantalla}>
      <EncabezadoPantalla titulo="Espacios" subtitulo="Disponibilidad de aulas y laboratorios" />
      <View style={styles.filtros}>
        <View style={styles.buscador}>
          <TextInput
            style={styles.buscadorInput}
            placeholder="Buscar aula o laboratorio"
            placeholderTextColor="#8A96A8"
            value={busqueda}
            onChangeText={setBusqueda}
            autoCorrect={false}
            returnKeyType="search"
          />
          {busqueda ? (
            <Pressable style={styles.buscadorLimpiar} onPress={() => setBusqueda('')} hitSlop={8}>
              <Text style={styles.buscadorLimpiarTexto}>✕</Text>
            </Pressable>
          ) : null}
        </View>
        <View>
          <Text style={styles.filaTitulo}>Cuándo</Text>
          <View style={styles.horario}>
            <Pressable style={[styles.selectorHora, styles.selectorHoraActivo]} onPress={() => setCalendarioAbierto(true)}>
              <Feather name="calendar" size={15} color={colores.blanco} />
              <Text style={[styles.selectorHoraTexto, styles.chipTextoActivo]}>{fechaEtiqueta(fecha)}</Text>
            </Pressable>
            <Pressable style={[styles.selectorHora, conFranja && styles.selectorHoraActivo]} onPress={() => setSelectorAbierto(true)}>
              <Feather name="clock" size={15} color={conFranja ? colores.blanco : colores.primario} />
              <Text style={[styles.selectorHoraTexto, conFranja && styles.chipTextoActivo]}>{conFranja ? `${horaIni} – ${horaFin}` : 'Todo el día'}</Text>
            </Pressable>
          </View>
          {(hoyEsHabil && !esHoy) || conFranja ? (
            <View style={styles.enlaces}>
              {hoyEsHabil && !esHoy ? (
                <Pressable onPress={() => setFecha(fechaDeHoy())} hitSlop={6}>
                  <Text style={styles.limpiarTexto}>Volver a hoy · {fechaEtiqueta(fechaDeHoy())}</Text>
                </Pressable>
              ) : null}
              {conFranja ? (
                <Pressable onPress={() => setFranja(null)} hitSlop={6}>
                  <Text style={styles.limpiarTexto}>Quitar horario</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
        <View>
          <Text style={styles.filaTitulo}>Filtrar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {Object.entries(FILTROS)
              .filter(([clave]) => clave !== 'estado' || mostrarFiltroEstado)
              .map(([clave, f]) => {
              const elegido = f.opciones.find((o) => o.clave === filtros[clave]);
              const activo = filtros[clave] !== null;
              return (
                <Pressable key={clave} style={[styles.chip, activo && styles.chipActivo]} onPress={() => setFiltroAbierto(clave)}>
                  <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
                    {f.etiqueta}: {elegido?.etiqueta} ▾
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <EstadoCarga
        cargando={cargando}
        error={mensajeError}
        vacio={espacios.length === 0}
        mensajeVacio="No hay espacios para mostrar con estos filtros."
        onReintentar={refrescar}
      >
        <FlatList
          data={espacios}
          keyExtractor={(e) => String(e.id_esp)}
          contentContainerStyle={styles.lista}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} colors={[colores.primario]} />}
          ListHeaderComponent={
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.encabezado}>
                {fechaEtiqueta(fecha)}
                {conFranja ? ` · ${horaIni} – ${horaFin}` : ''}
              </Text>
              {estadoFiltro ? (
                <Text style={styles.subencabezado}>
                  {textoFiltro}
                  {enMomento && referencia.motivo ? ` · ${referencia.motivo}` : ''}
                </Text>
              ) : enMomento ? (
                <Text style={styles.subencabezado}>
                  {textoEstadoHoy}
                  {referencia.motivo ? ` · ${referencia.motivo}` : ''}
                </Text>
              ) : !conFranja && esHoy ? (
                <Text style={styles.subencabezado}>Fuera de horario: {referencia.motivo}</Text>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <TarjetaEspacio
              espacio={item}
              conFranja={conFranja}
              enMomento={enMomento}
              textoMomento={esAhoraMismo ? 'ahora' : `a las ${minutosAHora(horaReferencia ?? 0)}`}
              minutoActual={enMomento && esAhoraMismo ? horaReferencia : null}
              onSolicitar={() => solicitar(item)}
            />
          )}
        />
      </EstadoCarga>

      <SelectorFecha
        visible={calendarioAbierto}
        fecha={fecha}
        onElegir={(iso) => {
          setFecha(iso);
          setCalendarioAbierto(false);
        }}
        onCerrar={() => setCalendarioAbierto(false)}
      />

      <SelectorFranja
        visible={selectorAbierto}
        valorInicial={franja ?? franjaSugerida(fecha)}
        hayFranja={conFranja}
        onAplicar={(ini, fin) => {
          setFranja({ ini, fin });
          setSelectorAbierto(false);
        }}
        onLimpiar={() => {
          setFranja(null);
          setSelectorAbierto(false);
        }}
        onCerrar={() => setSelectorAbierto(false)}
      />

      <SelectorOpciones
        visible={filtroAbierto !== null}
        titulo={filtroAbierto ? FILTROS[filtroAbierto].titulo : ''}
        opciones={filtroAbierto ? FILTROS[filtroAbierto].opciones : []}
        valor={filtroAbierto ? filtros[filtroAbierto] : null}
        onElegir={(clave) => {
          setFiltros((prev) => ({ ...prev, [filtroAbierto]: clave }));
          setFiltroAbierto(null);
        }}
        onCerrar={() => setFiltroAbierto(null)}
      />
    </View>
  );
}

function TarjetaEspacio({ espacio, conFranja, enMomento, textoMomento, minutoActual, onSolicitar }) {
  const ubicacion = [
    ETIQUETA_TIPO[espacio.tipo],
    espacio.bloque && ETIQUETA_BLOQUE[espacio.bloque],
    espacio.piso && `Piso ${espacio.piso}`,
    espacio.capacidad && `${espacio.capacidad} personas`,
  ]
    .filter(Boolean)
    .join(' · ');
  const nActividades = espacio.ocupaciones.length;

  // Texto y tono del estado: verde = se puede usar, rojo = no, azul = informativo (otro día con actividades).
  let estado;
  let tono = espacio.disponible ? 'si' : 'no';
  if (conFranja) {
    estado = espacio.disponible ? 'Disponible' : 'No disponible';
  } else if (enMomento) {
    estado = espacio.disponible ? `Disponible ${textoMomento}` : `No disponible ${textoMomento}`;
  } else if (espacio.libre) {
    estado = 'Sin actividades';
  } else {
    estado = `${nActividades} ${nActividades === 1 ? 'actividad' : 'actividades'}`;
    tono = 'info';
  }
  const colorTexto = { si: colores.exito, no: colores.peligro, info: colores.info }[tono];
  const colorFondo = { si: '#2E7D5B26', no: '#B4412F1A', info: '#3E7CB126' }[tono];

  return (
    <View style={styles.tarjeta}>
      <View style={styles.tarjetaCabecera}>
        <Text style={styles.nombre}>{espacio.nom_esp}</Text>
        <View style={[styles.estado, { backgroundColor: colorFondo }]}>
          <Text style={[styles.estadoTexto, { color: colorTexto }]}>{estado}</Text>
        </View>
      </View>
      <Text style={styles.ubicacion}>{ubicacion}</Text>

      {/* Con un horario elegido solo importa si está disponible; el detalle del día se ve sin horario. */}
      {!conFranja && espacio.ocupaciones.length > 0 ? (
        <View style={styles.ocupaciones}>
          {espacio.ocupaciones.map((o, i) => {
            const enCurso = minutoActual !== null && horaAMinutos(o.hora_ini) <= minutoActual && minutoActual < horaAMinutos(o.hora_fin);
            return (
              <Text key={`${o.hora_ini}-${i}`} style={[styles.ocupacion, enCurso && styles.ocupacionActual]} numberOfLines={1}>
                {o.hora_ini}–{o.hora_fin} · {o.tipo === 'CLASE' ? 'Clase' : 'Reserva'}: {o.etiqueta}
              </Text>
            );
          })}
        </View>
      ) : null}

      {conFranja && espacio.disponible ? (
        <Pressable style={({ pressed }) => [styles.boton, pressed && { opacity: 0.85 }]} onPress={onSolicitar}>
          <Text style={styles.botonTexto}>Solicitar tutoría aquí</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  filtros: { backgroundColor: colores.blanco, borderBottomWidth: 1, borderBottomColor: colores.linea, paddingVertical: 8, gap: 2 },
  filaTitulo: { color: colores.texto, opacity: 0.6, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 16, marginTop: 6 },
  buscador: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 4, marginBottom: 2, backgroundColor: colores.fondo, borderRadius: 12, borderWidth: 1, borderColor: colores.linea },
  buscadorInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colores.texto },
  buscadorLimpiar: { paddingHorizontal: 14 },
  buscadorLimpiarTexto: { color: colores.texto, opacity: 0.5, fontWeight: '700' },
  chips: { paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  chip: { borderRadius: 6, borderWidth: 1, borderColor: colores.linea, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colores.fondo },
  chipActivo: { backgroundColor: colores.primario, borderColor: colores.primario },
  chipTexto: { color: colores.texto, fontWeight: '600', fontSize: 13 },
  chipTextoActivo: { color: colores.blanco },
  horario: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 6 },
  selectorHora: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 6, borderWidth: 1, borderColor: colores.linea, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: colores.fondo },
  selectorHoraActivo: { backgroundColor: colores.primario, borderColor: colores.primario },
  selectorHoraTexto: { color: colores.texto, fontWeight: '600', fontSize: 13 },
  enlaces: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingHorizontal: 16, paddingBottom: 4 },
  limpiar: { paddingVertical: 8, paddingHorizontal: 4 },
  limpiarTexto: { color: colores.primario, fontWeight: '700', fontSize: 13 },
  lista: { padding: 16, paddingBottom: 110 },
  encabezado: { color: colores.texto, fontWeight: '700' },
  subencabezado: { color: colores.acento, fontWeight: '600', fontSize: 12, marginTop: 2 },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, padding: 14, gap: 6 },
  tarjetaCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  nombre: { color: colores.texto, fontSize: 16, fontWeight: '700', flexShrink: 1 },
  estado: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  estadoTexto: { fontSize: 11, fontWeight: '700' },
  ubicacion: { color: colores.texto, opacity: 0.6, fontSize: 13 },
  ocupaciones: { marginTop: 4, gap: 2 },
  ocupacion: { color: colores.texto, opacity: 0.6, fontSize: 12, paddingVertical: 2, paddingHorizontal: 6, marginHorizontal: -6 },
  ocupacionActual: { opacity: 1, fontWeight: '700', backgroundColor: '#3E7CB11F', borderRadius: 6, overflow: 'hidden' },
  boton: { backgroundColor: colores.primario, borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 8 },
  botonTexto: { color: colores.blanco, fontWeight: '700' },
});
