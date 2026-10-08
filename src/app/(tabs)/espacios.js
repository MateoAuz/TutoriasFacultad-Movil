import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import EstadoCarga from '../../components/EstadoCarga';
import SelectorFecha from '../../components/SelectorFecha';
import SelectorFranja from '../../components/SelectorFranja';
import SelectorOpciones from '../../components/SelectorOpciones';
import { espaciosApi } from '../../api/espacios';
import { useRecurso } from '../../hooks/useRecurso';
import { ETIQUETA_BLOQUE, ETIQUETA_TIPO, diasHabiles, fechaDeHoy, fechaEtiqueta, horaAMinutos, minutosAHora, primerDiaHabil } from '../../lib/formato';
import { colores } from '../../lib/tema';

// Franja sugerida al abrir el selector: si miras hoy, desde la próxima media hora; si no, 09:00 – 10:00.
function franjaSugerida(fecha) {
  let inicio = 9 * 60;
  if (fecha === fechaDeHoy()) {
    const ahora = new Date();
    inicio = Math.min(Math.max(Math.ceil((ahora.getHours() * 60 + ahora.getMinutes()) / 30) * 30, 7 * 60), 19 * 60);
  }
  return { ini: minutosAHora(inicio), fin: minutosAHora(inicio + 60) };
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
// Si ahora no hay actividad en la facultad, se toma la siguiente hora en que sí la hay.
function momentoDeReferencia(ahora) {
  if (ahora >= FIN_JORNADA) return { minutos: null, motivo: 'la jornada de hoy ya terminó' };
  if (ahora < INICIO_JORNADA) return { minutos: INICIO_JORNADA, motivo: 'la jornada aún no comienza' };
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

  const cargar = useCallback(() => espaciosApi.disponibilidad(fecha, horaIni, horaFin), [fecha, horaIni, horaFin]);
  const { data, cargando, refrescando, mensajeError, refrescar } = useRecurso(cargar, 'No se pudo consultar la disponibilidad.');

  // Cada espacio con su estado según lo que se está mirando: la franja elegida, el momento actual o todo el día.
  const espacios = useMemo(() => {
    const lista = (data?.espacios ?? []).map((e) => ({
      ...e,
      disponible: conFranja ? e.libre : enMomento ? !ocupadoAhora(e, horaReferencia) : e.libre,
    }));
    const filtrados = lista.filter(
      (e) =>
        (!filtros.tipo || e.tipo === filtros.tipo) &&
        (!filtros.bloque || e.bloque === filtros.bloque) &&
        (!filtros.estado || (filtros.estado === 'DISPONIBLES' ? e.disponible : !e.disponible))
    );
    // Los disponibles primero y luego por nombre.
    return filtrados.sort((a, b) => Number(b.disponible) - Number(a.disponible) || a.nom_esp.localeCompare(b.nom_esp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filtros, conFranja, enMomento, horaReferencia]);

  function solicitar(esp) {
    router.push({
      pathname: '/solicitar',
      params: { id_esp: String(esp.id_esp), nom_esp: esp.nom_esp, fecha, hor_ini: horaIni, hor_fin: horaFin },
    });
  }

  const criterio = conFranja
    ? `de ${horaIni} a ${horaFin}`
    : enMomento
      ? esAhoraMismo
        ? `ahora (${minutosAHora(horaReferencia)})`
        : `a las ${minutosAHora(horaReferencia)}`
      : 'todo el día';

  return (
    <View style={styles.pantalla}>
      <View style={styles.filtros}>
        <View>
          <Text style={styles.filaTitulo}>Día</Text>
          <View style={styles.horario}>
            <Pressable style={[styles.selectorHora, styles.selectorHoraActivo]} onPress={() => setCalendarioAbierto(true)}>
              <Text style={[styles.selectorHoraTexto, styles.chipTextoActivo]}>{fechaEtiqueta(fecha)}</Text>
            </Pressable>
            {hoyEsHabil && !esHoy ? (
              <Pressable style={styles.limpiar} onPress={() => setFecha(fechaDeHoy())}>
                <Text style={styles.limpiarTexto}>Volver a hoy · {fechaEtiqueta(fechaDeHoy())}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        <View>
          <Text style={styles.filaTitulo}>Horario</Text>
          <View style={styles.horario}>
            <Pressable style={[styles.selectorHora, conFranja && styles.selectorHoraActivo]} onPress={() => setSelectorAbierto(true)}>
              <Text style={[styles.selectorHoraTexto, conFranja && styles.chipTextoActivo]}>
                {conFranja ? `${horaIni} – ${horaFin}` : 'Todo el día · elegir horario'}
              </Text>
            </Pressable>
            {conFranja ? (
              <Pressable style={styles.limpiar} onPress={() => setFranja(null)}>
                <Text style={styles.limpiarTexto}>Todo el día</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        <View>
          <Text style={styles.filaTitulo}>Filtrar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {Object.entries(FILTROS).map(([clave, f]) => {
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
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} colors={[colores.azul]} />}
          ListHeaderComponent={
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.encabezado}>
                {fechaEtiqueta(fecha)}
                {conFranja ? ` · ${horaIni} – ${horaFin}` : ''}
              </Text>
              {filtros.estado ? (
                <Text style={styles.subencabezado}>
                  {filtros.estado === 'DISPONIBLES' ? 'Disponibles' : 'Ocupados'} {criterio}
                  {enMomento && !esAhoraMismo ? ` · ${referencia.motivo}` : ''}
                </Text>
              ) : !conFranja && esHoy ? (
                <Text style={styles.subencabezado}>
                  {enMomento
                    ? esAhoraMismo
                      ? `Estado ${criterio}`
                      : `Estado ${criterio} · ${referencia.motivo}`
                    : `Fuera de horario: ${referencia.motivo}`}
                </Text>
              ) : null}
            </View>
          }
          renderItem={({ item }) => (
            <TarjetaEspacio
              espacio={item}
              conFranja={conFranja}
              enMomento={enMomento}
              textoMomento={esAhoraMismo ? 'ahora' : `a las ${minutosAHora(horaReferencia ?? 0)}`}
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

function TarjetaEspacio({ espacio, conFranja, enMomento, textoMomento, onSolicitar }) {
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
  } else if (espacio.libre) {
    estado = 'Disponible todo el día';
  } else if (enMomento) {
    estado = espacio.disponible ? `Disponible ${textoMomento}` : `No disponible ${textoMomento}`;
  } else {
    estado = `${nActividades} ${nActividades === 1 ? 'actividad' : 'actividades'}`;
    tono = 'info';
  }
  const colorTexto = { si: colores.exito, no: colores.peligro, info: colores.celeste }[tono];
  const colorFondo = { si: '#1B7A5B26', no: '#B3261E1A', info: '#2378AD26' }[tono];

  return (
    <View style={styles.tarjeta}>
      <View style={styles.tarjetaCabecera}>
        <Text style={styles.nombre}>{espacio.nom_esp}</Text>
        <View style={[styles.estado, { backgroundColor: colorFondo }]}>
          <Text style={[styles.estadoTexto, { color: colorTexto }]}>{estado}</Text>
        </View>
      </View>
      <Text style={styles.ubicacion}>{ubicacion}</Text>

      {espacio.ocupaciones.length > 0 ? (
        <View style={styles.ocupaciones}>
          {espacio.ocupaciones.map((o, i) => (
            <Text key={`${o.hora_ini}-${i}`} style={styles.ocupacion} numberOfLines={1}>
              {o.hora_ini}–{o.hora_fin} · {o.tipo === 'CLASE' ? 'Clase' : 'Reserva'}: {o.etiqueta}
            </Text>
          ))}
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
  pantalla: { flex: 1, backgroundColor: colores.paper },
  filtros: { backgroundColor: colores.blanco, borderBottomWidth: 1, borderBottomColor: colores.linea, paddingVertical: 8, gap: 2 },
  filaTitulo: { color: colores.celeste, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 16, marginTop: 6 },
  chips: { paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colores.linea, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: colores.paper },
  chipActivo: { backgroundColor: colores.azul, borderColor: colores.azul },
  chipTexto: { color: colores.ink, fontWeight: '600', fontSize: 13 },
  chipTextoActivo: { color: colores.blanco },
  horario: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 6 },
  selectorHora: { borderRadius: 999, borderWidth: 1, borderColor: colores.linea, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: colores.paper },
  selectorHoraActivo: { backgroundColor: colores.azul, borderColor: colores.azul },
  selectorHoraTexto: { color: colores.ink, fontWeight: '600', fontSize: 13 },
  limpiar: { paddingVertical: 8, paddingHorizontal: 4 },
  limpiarTexto: { color: colores.azul, fontWeight: '700', fontSize: 13 },
  lista: { padding: 16 },
  encabezado: { color: colores.ink, fontWeight: '700' },
  subencabezado: { color: colores.celeste, fontWeight: '600', fontSize: 12, marginTop: 2 },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 14, borderWidth: 1, borderColor: colores.linea, padding: 14, gap: 6 },
  tarjetaCabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  nombre: { color: colores.ink, fontSize: 16, fontWeight: '700', flexShrink: 1 },
  estado: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  estadoTexto: { fontSize: 11, fontWeight: '700' },
  ubicacion: { color: colores.ink, opacity: 0.6, fontSize: 13 },
  ocupaciones: { marginTop: 4, gap: 2 },
  ocupacion: { color: colores.ink, opacity: 0.75, fontSize: 12 },
  boton: { backgroundColor: colores.azul, borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginTop: 8 },
  botonTexto: { color: colores.blanco, fontWeight: '700' },
});
