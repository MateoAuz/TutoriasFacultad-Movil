import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TarjetaTutoria from '../../components/TarjetaTutoria';
import { solicitudesApi } from '../../api/solicitudes';
import { tutoriasApi } from '../../api/tutorias';
import { useAuth } from '../../context/AuthContext';
import { useNotificaciones } from '../../context/NotificacionesContext';
import { useRecurso } from '../../hooks/useRecurso';
import { estadoDeTutoria, fechaDeHoy, fechaEtiqueta } from '../../lib/formato';
import { colores } from '../../lib/tema';

function saludo() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

const irASolicitudes = () => router.navigate({ pathname: '/tutorias', params: { seccion: 'solicitudes', t: String(Date.now()) } });

export default function Inicio() {
  const { usuario } = useAuth();
  const { noLeidas } = useNotificaciones();
  const { top } = useSafeAreaInsets();
  const proximas = useRecurso(tutoriasApi.proximas, 'No se pudieron cargar las tutorías.');
  const asistidas = useRecurso(tutoriasApi.asistidas, 'No se pudo cargar tu historial.');
  const solicitudes = useRecurso(solicitudesApi.mias, 'No se pudieron cargar tus solicitudes.');

  // El estado depende de la hora: se recalcula cada minuto para que una tutoría pase sola a "En curso".
  const [minuto, setMinuto] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMinuto((m) => m + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const { enCurso, siguiente, vigentes } = useMemo(() => {
    const vig = (proximas.data ?? []).filter((t) => estadoDeTutoria(t) !== 'CONCLUIDA');
    return {
      vigentes: vig.length,
      enCurso: vig.filter((t) => estadoDeTutoria(t) === 'EN_CURSO'),
      siguiente: vig.find((t) => estadoDeTutoria(t) === 'PROXIMA') ?? null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proximas.data, minuto]);

  const idsAsistidos = useMemo(() => new Set((asistidas.data ?? []).map((a) => a.id_rev)), [asistidas.data]);
  const totalAsistencias = asistidas.data?.length ?? 0;
  const esteMes = (asistidas.data ?? []).filter((t) => t.fecha.slice(0, 7) === fechaDeHoy().slice(0, 7)).length;
  const pendientes = (solicitudes.data ?? []).filter((s) => s.estado === 'PENDIENTE').length;

  const refrescando = proximas.refrescando || asistidas.refrescando || solicitudes.refrescando;
  const refrescar = useCallback(() => {
    proximas.refrescar();
    asistidas.refrescar();
    solicitudes.refrescar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proximas.refrescar, asistidas.refrescar, solicitudes.refrescar]);

  function abrir(tutoria) {
    router.push({ pathname: '/tutoria/[id]', params: { id: String(tutoria.id_rev), datos: JSON.stringify(tutoria) } });
  }

  const nombres = (usuario?.nombres || '').trim();
  const primerNombre = nombres.split(' ')[0];
  const iniciales = nombres
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  const numero = (valor, cargado) => (cargado ? valor : '–');

  return (
    <ScrollView
      style={styles.pantalla}
      contentContainerStyle={[styles.contenido, { paddingTop: top + 16 }]}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} colors={[colores.primario]} progressViewOffset={top} />}
    >
      {/* Cabecera: iniciales, saludo y campana */}
      <View style={styles.cabecera}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciales || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.saludo}>{saludo()}</Text>
          <Text style={styles.nombre} numberOfLines={1}>
            {primerNombre || 'Estudiante'}
          </Text>
        </View>
        <Pressable style={styles.campana} onPress={() => router.navigate('/notificaciones')} accessibilityLabel="Avisos">
          <Feather name="bell" size={20} color={colores.texto} />
          {noLeidas > 0 ? <View style={styles.campanaPunto} /> : null}
        </Pressable>
      </View>
      <Text style={styles.fecha}>{fechaEtiqueta(fechaDeHoy())}</Text>

      {/* Ahora */}
      <Text style={styles.seccion}>Ahora</Text>
      {proximas.cargando ? (
        <ActivityIndicator color={colores.primario} style={{ marginVertical: 16 }} />
      ) : proximas.mensajeError ? (
        <Pressable style={styles.vacio} onPress={proximas.refrescar}>
          <Text style={styles.error}>{proximas.mensajeError}</Text>
          <Text style={styles.reintentar}>Reintentar</Text>
        </Pressable>
      ) : enCurso.length > 0 ? (
        <View style={{ gap: 12 }}>
          {enCurso.map((t) => (
            <TarjetaTutoria
              key={t.id_rev}
              tutoria={t}
              destacada
              asistio={idsAsistidos.has(t.id_rev)}
              onPress={() => abrir(t)}
              onEscanear={() => router.push('/escanear')}
            />
          ))}
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <View style={styles.vacio}>
            <Feather name="coffee" size={20} color={colores.primario} />
            <Text style={styles.vacioTexto}>No tienes tutorías en curso en este momento.</Text>
          </View>
          {siguiente ? (
            <>
              <Text style={styles.subseccion}>Siguiente tutoría</Text>
              <TarjetaTutoria tutoria={siguiente} asistio={idsAsistidos.has(siguiente.id_rev)} onPress={() => abrir(siguiente)} />
            </>
          ) : null}
        </View>
      )}

      {/* Datos: una sola franja con cuatro cifras */}
      <Text style={styles.seccion}>Tu avance</Text>
      <View style={styles.franja}>
        <Cifra valor={numero(vigentes, proximas.data)} etiqueta="Próximas" onPress={() => router.navigate('/tutorias')} />
        <View style={styles.divisor} />
        <Cifra valor={numero(pendientes, solicitudes.data)} etiqueta="Pendientes" onPress={irASolicitudes} />
        <View style={styles.divisor} />
        <Cifra valor={numero(totalAsistencias, asistidas.data)} etiqueta="Asistencias" onPress={() => router.navigate('/historial')} />
        <View style={styles.divisor} />
        <Cifra valor={numero(esteMes, asistidas.data)} etiqueta="Este mes" onPress={() => router.navigate('/historial')} />
      </View>

      {/* Accesos: mosaico con una pieza alta y dos apiladas, y una lista debajo */}
      <Text style={styles.seccion}>Accesos</Text>
      <View style={styles.mosaico}>
        <Pressable style={({ pressed }) => [styles.pieza, styles.piezaAlta, { backgroundColor: colores.primarioSuave }, pressed && { opacity: 0.9 }]} onPress={() => router.push('/escanear')}>
          <MaterialCommunityIcons name="qrcode-scan" size={34} color={colores.primario} />
          <View>
            <Text style={[styles.piezaTitulo, { color: colores.primario }]}>Escanear QR</Text>
            <Text style={[styles.piezaDetalle, { color: colores.texto }]}>Registra tu asistencia</Text>
          </View>
        </Pressable>
        <View style={{ flex: 1, gap: 10 }}>
          <Pressable style={({ pressed }) => [styles.pieza, { backgroundColor: colores.acentoSuave }, pressed && { opacity: 0.9 }]} onPress={() => router.navigate('/espacios')}>
            <Feather name="map-pin" size={22} color={colores.acento} />
            <Text style={styles.piezaTitulo}>Espacios</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.pieza, styles.piezaBlanca, pressed && { opacity: 0.9 }]} onPress={() => router.navigate('/matricula')}>
            <Feather name="clipboard" size={22} color={colores.primario} />
            <Text style={styles.piezaTitulo}>Matrícula</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.lista}>
        <Fila icono="calendar" titulo="Horario" detalle="Tus clases y tutorías de la semana" onPress={() => router.navigate('/horario')} />
        <Fila icono="send" titulo="Mis solicitudes" detalle="Estado de tus pedidos de tutoría" onPress={irASolicitudes} />
        <Fila icono="clock" titulo="Historial" detalle="Asistencias registradas" onPress={() => router.navigate('/historial')} />
        <Fila icono="bell" titulo="Avisos" detalle={noLeidas > 0 ? `${noLeidas} sin leer` : 'Estás al día'} insignia={noLeidas} onPress={() => router.navigate('/notificaciones')} ultima />
      </View>
    </ScrollView>
  );
}

function Cifra({ valor, etiqueta, onPress }) {
  return (
    <Pressable style={styles.cifra} onPress={onPress}>
      <Text style={styles.cifraValor}>{valor}</Text>
      <Text style={styles.cifraEtiqueta}>{etiqueta}</Text>
    </Pressable>
  );
}

function Fila({ icono, titulo, detalle, insignia = 0, ultima = false, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.fila, !ultima && styles.filaBorde, pressed && { backgroundColor: colores.fondo }]} onPress={onPress}>
      <View style={styles.filaIcono}>
        <Feather name={icono} size={18} color={colores.primario} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.filaTitulo}>{titulo}</Text>
        <Text style={styles.filaDetalle}>{detalle}</Text>
      </View>
      {insignia > 0 ? (
        <View style={styles.insignia}>
          <Text style={styles.insigniaTexto}>{insignia > 99 ? '99+' : insignia}</Text>
        </View>
      ) : null}
      <Feather name="chevron-right" size={18} color={colores.texto} style={{ opacity: 0.35 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { paddingHorizontal: 20, gap: 12, paddingBottom: 120 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 12, backgroundColor: colores.primario, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: colores.blanco, fontWeight: '700', fontSize: 16 },
  saludo: { color: colores.texto, opacity: 0.6, fontSize: 13 },
  nombre: { color: colores.texto, fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  campana: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, backgroundColor: colores.blanco, alignItems: 'center', justifyContent: 'center' },
  campanaPunto: { position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 6, backgroundColor: colores.peligro, borderWidth: 1.5, borderColor: colores.blanco },
  fecha: { color: colores.acento, fontWeight: '700', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  seccion: { color: colores.texto, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 14, opacity: 0.7 },
  subseccion: { color: colores.acento, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  vacio: { backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, padding: 16, alignItems: 'center', gap: 8 },
  vacioTexto: { color: colores.texto, opacity: 0.65, textAlign: 'center' },
  error: { color: colores.peligro, textAlign: 'center' },
  reintentar: { color: colores.primario, fontWeight: '700' },
  franja: { flexDirection: 'row', backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, paddingVertical: 14 },
  cifra: { flex: 1, alignItems: 'center', gap: 2 },
  cifraValor: { color: colores.primario, fontSize: 26, fontWeight: '700' },
  cifraEtiqueta: { color: colores.texto, opacity: 0.6, fontSize: 11, fontWeight: '600' },
  divisor: { width: 1, backgroundColor: colores.linea, marginVertical: 4 },
  mosaico: { flexDirection: 'row', gap: 10 },
  pieza: { borderRadius: 12, padding: 14, gap: 10, minHeight: 90, justifyContent: 'space-between' },
  piezaAlta: { flex: 1, minHeight: 190 },
  piezaBlanca: { backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.linea },
  piezaTitulo: { color: colores.texto, fontSize: 15, fontWeight: '700' },
  piezaDetalle: { opacity: 0.85, fontSize: 12, marginTop: 2 },
  lista: { backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, overflow: 'hidden' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  filaBorde: { borderBottomWidth: 1, borderBottomColor: colores.linea },
  filaIcono: { width: 36, height: 36, borderRadius: 10, backgroundColor: colores.primarioSuave, alignItems: 'center', justifyContent: 'center' },
  filaTitulo: { color: colores.texto, fontSize: 15, fontWeight: '700' },
  filaDetalle: { color: colores.texto, opacity: 0.55, fontSize: 12, marginTop: 1 },
  insignia: { backgroundColor: colores.peligro, borderRadius: 6, minWidth: 22, height: 22, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  insigniaTexto: { color: colores.blanco, fontSize: 11, fontWeight: '700' },
});
