import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import EstadoCarga from '../../components/EstadoCarga';
import SelectorFecha from '../../components/SelectorFecha';
import SelectorFranja from '../../components/SelectorFranja';
import { espaciosApi } from '../../api/espacios';
import { useRecurso } from '../../hooks/useRecurso';
import { ETIQUETA_BLOQUE, ETIQUETA_TIPO, fechaDeHoy, fechaEtiqueta, minutosAHora, primerDiaHabil } from '../../lib/formato';
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

const TIPOS = [
  { clave: null, etiqueta: 'Todos' },
  { clave: 'LABORATORIO', etiqueta: 'Laboratorios' },
  { clave: 'AULA', etiqueta: 'Aulas' },
];

export default function Espacios() {
  const [fecha, setFecha] = useState(primerDiaHabil); // hoy, o el lunes si hoy es fin de semana
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [franja, setFranja] = useState(null); // null = agenda de todo el día; { ini, fin } = franja libre
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [tipo, setTipo] = useState(null);

  const horaIni = franja?.ini ?? null;
  const horaFin = franja?.fin ?? null;
  const conFranja = Boolean(franja);

  const cargar = useCallback(() => espaciosApi.disponibilidad(fecha, horaIni, horaFin), [fecha, horaIni, horaFin]);
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
        <View>
          <Text style={styles.filaTitulo}>Día</Text>
          <View style={styles.horario}>
            <Pressable style={[styles.selectorHora, styles.selectorHoraActivo]} onPress={() => setCalendarioAbierto(true)}>
              <Text style={[styles.selectorHoraTexto, styles.chipTextoActivo]}>{fechaEtiqueta(fecha)}</Text>
            </Pressable>
            {fecha === fechaDeHoy() ? <Text style={styles.hoy}>Hoy</Text> : null}
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
        <Fila titulo="Tipo">
          {TIPOS.map((t) => (
            <Chip key={String(t.clave)} activo={tipo === t.clave} onPress={() => setTipo(t.clave)} etiqueta={t.etiqueta} />
          ))}
        </Fila>
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
            <Text style={styles.encabezado}>
              {fechaEtiqueta(fecha)}
              {conFranja ? ` · ${horaIni} – ${horaFin}` : ''}
            </Text>
          }
          renderItem={({ item }) => <TarjetaEspacio espacio={item} conFranja={conFranja} onSolicitar={() => solicitar(item)} />}
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
  const nActividades = espacio.ocupaciones.length;
  const estado = conFranja
    ? espacio.libre
      ? 'Disponible'
      : 'No disponible'
    : espacio.libre
      ? 'Disponible todo el día'
      : `${nActividades} ${nActividades === 1 ? 'actividad' : 'actividades'}`;

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
  horario: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 6 },
  selectorHora: { borderRadius: 999, borderWidth: 1, borderColor: colores.linea, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: colores.paper },
  selectorHoraActivo: { backgroundColor: colores.azul, borderColor: colores.azul },
  selectorHoraTexto: { color: colores.ink, fontWeight: '600', fontSize: 13 },
  hoy: { color: colores.celeste, fontWeight: '700', fontSize: 13 },
  limpiar: { paddingVertical: 8, paddingHorizontal: 4 },
  limpiarTexto: { color: colores.azul, fontWeight: '700', fontSize: 13 },
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
