import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import EstadoCarga from '../../components/EstadoCarga';
import { espaciosApi } from '../../api/espacios';
import { useRecurso } from '../../hooks/useRecurso';
import { ETIQUETA_BLOQUE, ETIQUETA_TIPO, diasHabiles, formatearFecha, horaAMinutos, minutosAHora } from '../../lib/formato';
import { colores } from '../../lib/tema';

const FIN_JORNADA = 20 * 60;
// 07:00 a 19:30 cada 30 minutos
const HORAS_INICIO = Array.from({ length: 25 }, (_, i) => 7 * 60 + i * 30)
  .filter((m) => m < FIN_JORNADA)
  .map(minutosAHora);
const DURACIONES = [
  { minutos: 60, etiqueta: '1 h' },
  { minutos: 90, etiqueta: '1 h 30' },
  { minutos: 120, etiqueta: '2 h' },
];
const TIPOS = [
  { clave: null, etiqueta: 'Todos' },
  { clave: 'LABORATORIO', etiqueta: 'Laboratorios' },
  { clave: 'AULA', etiqueta: 'Aulas' },
];

export default function Espacios() {
  const dias = useMemo(() => diasHabiles(10), []);
  const [fecha, setFecha] = useState(dias[0].iso);
  const [horaIni, setHoraIni] = useState(null); // null = agenda de todo el día
  const [duracion, setDuracion] = useState(60);
  const [tipo, setTipo] = useState(null);

  const horaFin = horaIni ? minutosAHora(horaAMinutos(horaIni) + duracion) : null;
  const franjaValida = !horaIni || horaAMinutos(horaFin) <= FIN_JORNADA;
  const conFranja = Boolean(horaIni) && franjaValida;

  const cargar = useCallback(
    () => espaciosApi.disponibilidad(fecha, conFranja ? horaIni : null, conFranja ? horaFin : null),
    [fecha, horaIni, horaFin, conFranja]
  );
  const { data, cargando, refrescando, mensajeError, refrescar } = useRecurso(cargar, 'No se pudo consultar la disponibilidad.');

  const espacios = useMemo(() => {
    const lista = data?.espacios ?? [];
    const filtrados = tipo ? lista.filter((e) => e.tipo === tipo) : lista;
    // Los libres primero y luego por nombre.
    return [...filtrados].sort((a, b) => Number(b.libre) - Number(a.libre) || a.nom_esp.localeCompare(b.nom_esp));
  }, [data, tipo]);

  function solicitar(esp) {
    router.push({
      pathname: '/solicitar',
      params: { id_esp: String(esp.id_esp), nom_esp: esp.nom_esp, fecha, hor_ini: horaIni, hor_fin: horaFin },
    });
  }

  return (
    <View style={styles.pantalla}>
      <View style={styles.filtros}>
        <Fila titulo="Día">
          {dias.map((d) => (
            <Chip key={d.iso} activo={fecha === d.iso} onPress={() => setFecha(d.iso)} etiqueta={`${d.dia} ${d.numero}`} />
          ))}
        </Fila>
        <Fila titulo="Hora de inicio">
          <Chip activo={!horaIni} onPress={() => setHoraIni(null)} etiqueta="Todo el día" />
          {HORAS_INICIO.map((h) => (
            <Chip key={h} activo={horaIni === h} onPress={() => setHoraIni(h)} etiqueta={h} />
          ))}
        </Fila>
        {horaIni ? (
          <Fila titulo="Duración">
            {DURACIONES.map((d) => (
              <Chip key={d.minutos} activo={duracion === d.minutos} onPress={() => setDuracion(d.minutos)} etiqueta={d.etiqueta} />
            ))}
          </Fila>
        ) : null}
        <Fila titulo="Tipo">
          {TIPOS.map((t) => (
            <Chip key={String(t.clave)} activo={tipo === t.clave} onPress={() => setTipo(t.clave)} etiqueta={t.etiqueta} />
          ))}
        </Fila>
        {!franjaValida ? <Text style={styles.aviso}>La jornada termina a las 20:00: elige una hora más temprano o una duración menor.</Text> : null}
      </View>

      <EstadoCarga
        cargando={cargando}
        error={mensajeError}
        vacio={!franjaValida || espacios.length === 0}
        mensajeVacio={franjaValida ? 'No hay espacios para mostrar con estos filtros.' : ''}
        onReintentar={refrescar}
      >
        <FlatList
          data={espacios}
          keyExtractor={(e) => String(e.id_esp)}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} colors={[colores.azul]} />}
          ListHeaderComponent={
            <Text style={styles.encabezado}>
              {formatearFecha(fecha)}
              {conFranja ? ` · ${horaIni} – ${horaFin}` : ''}
            </Text>
          }
          renderItem={({ item }) => <TarjetaEspacio espacio={item} conFranja={conFranja} onSolicitar={() => solicitar(item)} />}
        />
      </EstadoCarga>
    </View>
  );
}

function TarjetaEspacio({ espacio, conFranja, onSolicitar }) {
  const ubicacion = [
    ETIQUETA_TIPO[espacio.tipo],
    espacio.bloque && ETIQUETA_BLOQUE[espacio.bloque],
    espacio.piso && `Piso ${espacio.piso}`,
    espacio.capacidad && `${espacio.capacidad} personas`,
  ]
    .filter(Boolean)
    .join(' · ');
  const estado = conFranja
    ? espacio.libre
      ? 'Libre en esa franja'
      : 'Ocupada en esa franja'
    : espacio.libre
      ? 'Libre todo el día'
      : `${espacio.ocupaciones.length} actividad(es)`;

  return (
    <View style={styles.tarjeta}>
      <View style={styles.tarjetaCabecera}>
        <Text style={styles.nombre}>{espacio.nom_esp}</Text>
        <View style={[styles.estado, { backgroundColor: espacio.libre ? '#1B7A5B26' : '#B3261E1A' }]}>
          <Text style={[styles.estadoTexto, { color: espacio.libre ? colores.exito : colores.peligro }]}>{estado}</Text>
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

      {conFranja && espacio.libre ? (
        <Pressable style={({ pressed }) => [styles.boton, pressed && { opacity: 0.85 }]} onPress={onSolicitar}>
          <Text style={styles.botonTexto}>Solicitar tutoría aquí</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Fila({ titulo, children }) {
  return (
    <View>
      <Text style={styles.filaTitulo}>{titulo}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {children}
      </ScrollView>
    </View>
  );
}

function Chip({ etiqueta, activo, onPress }) {
  return (
    <Pressable style={[styles.chip, activo && styles.chipActivo]} onPress={onPress}>
      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{etiqueta}</Text>
    </Pressable>
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
  aviso: { color: colores.peligro, fontSize: 12, marginHorizontal: 16, marginTop: 4 },
  lista: { padding: 16 },
  encabezado: { color: colores.ink, fontWeight: '700', marginBottom: 10 },
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
