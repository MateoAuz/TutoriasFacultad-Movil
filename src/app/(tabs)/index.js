import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
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

export default function Inicio() {
  const { usuario } = useAuth();
  const { noLeidas } = useNotificaciones();
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

  const primerNombre = (usuario?.nombres || '').split(' ')[0];
  const nuevo = (valor) => (valor === null || valor === undefined ? '–' : valor);

  return (
    <ScrollView
      style={styles.pantalla}
      contentContainerStyle={styles.contenido}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} colors={[colores.azul]} />}
    >
      <View>
        <Text style={styles.saludo}>
          {saludo()}
          {primerNombre ? `, ${primerNombre}` : ''}
        </Text>
        <Text style={styles.fecha}>{fechaEtiqueta(fechaDeHoy())}</Text>
      </View>

      <Text style={styles.seccion}>En curso ahora</Text>
      {proximas.cargando ? (
        <ActivityIndicator color={colores.azul} style={{ marginVertical: 16 }} />
      ) : proximas.mensajeError ? (
        <Pressable style={styles.vacio} onPress={proximas.refrescar}>
          <Text style={styles.error}>{proximas.mensajeError}</Text>
          <Text style={styles.reintentar}>Reintentar</Text>
        </Pressable>
      ) : enCurso.length > 0 ? (
        <View style={{ gap: 12 }}>
          {enCurso.map((t) => (
            <TarjetaTutoria key={t.id_rev} tutoria={t} asistio={idsAsistidos.has(t.id_rev)} onPress={() => abrir(t)} onEscanear={() => router.navigate('/escanear')} />
          ))}
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <View style={styles.vacio}>
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

      <Text style={styles.seccion}>Tus datos</Text>
      <View style={styles.cuadricula}>
        <Dato valor={nuevo(proximas.data ? vigentes : null)} etiqueta="Tutorías próximas" onPress={() => router.navigate('/tutorias')} />
        <Dato valor={nuevo(solicitudes.data ? pendientes : null)} etiqueta="Solicitudes pendientes" onPress={() => router.navigate({ pathname: '/tutorias', params: { seccion: 'solicitudes', t: String(Date.now()) } })} />
        <Dato valor={nuevo(asistidas.data ? totalAsistencias : null)} etiqueta="Asistencias" onPress={() => router.navigate('/historial')} />
        <Dato valor={nuevo(asistidas.data ? esteMes : null)} etiqueta="Asistencias este mes" onPress={() => router.navigate('/historial')} />
      </View>

      <Text style={styles.seccion}>Accesos rápidos</Text>
      <View style={styles.cuadricula}>
        <Acceso titulo="Escanear QR" detalle="Registrar asistencia" destacado onPress={() => router.navigate('/escanear')} />
        <Acceso titulo="Espacios" detalle="Ver disponibilidad" onPress={() => router.navigate('/espacios')} />
        <Acceso titulo="Mis solicitudes" detalle="Estado de tus pedidos" onPress={() => router.navigate({ pathname: '/tutorias', params: { seccion: 'solicitudes', t: String(Date.now()) } })} />
        <Acceso titulo="Historial" detalle="Asistencias registradas" onPress={() => router.navigate('/historial')} />
        <Acceso titulo="Avisos" detalle={noLeidas > 0 ? `${noLeidas} sin leer` : 'Al día'} insignia={noLeidas} onPress={() => router.navigate('/notificaciones')} />
      </View>
    </ScrollView>
  );
}

function Dato({ valor, etiqueta, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.dato, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <Text style={styles.datoValor}>{valor}</Text>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
    </Pressable>
  );
}

function Acceso({ titulo, detalle, destacado = false, insignia = 0, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.acceso, destacado && styles.accesoDestacado, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <View style={styles.accesoCabecera}>
        <Text style={[styles.accesoTitulo, destacado && styles.accesoTextoDestacado]}>{titulo}</Text>
        {insignia > 0 ? (
          <View style={styles.insignia}>
            <Text style={styles.insigniaTexto}>{insignia > 99 ? '99+' : insignia}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.accesoDetalle, destacado && styles.accesoTextoDestacado]}>{detalle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.paper },
  contenido: { padding: 16, gap: 12, paddingBottom: 32 },
  saludo: { color: colores.ink, fontSize: 24, fontWeight: '800' },
  fecha: { color: colores.celeste, fontWeight: '600', marginTop: 2 },
  seccion: { color: colores.ink, fontSize: 17, fontWeight: '700', marginTop: 10 },
  subseccion: { color: colores.celeste, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  vacio: { backgroundColor: colores.blanco, borderRadius: 14, borderWidth: 1, borderColor: colores.linea, padding: 16, alignItems: 'center', gap: 6 },
  vacioTexto: { color: colores.ink, opacity: 0.6, textAlign: 'center' },
  error: { color: colores.peligro, textAlign: 'center' },
  reintentar: { color: colores.azul, fontWeight: '700' },
  cuadricula: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dato: { width: '48%', flexGrow: 1, backgroundColor: colores.blanco, borderRadius: 14, borderWidth: 1, borderColor: colores.linea, paddingVertical: 16, paddingHorizontal: 14 },
  datoValor: { color: colores.azul, fontSize: 28, fontWeight: '800' },
  datoEtiqueta: { color: colores.ink, opacity: 0.65, fontSize: 13, marginTop: 2 },
  acceso: { width: '48%', flexGrow: 1, backgroundColor: colores.blanco, borderRadius: 14, borderWidth: 1, borderColor: colores.linea, padding: 14, gap: 4 },
  accesoDestacado: { backgroundColor: colores.azul, borderColor: colores.azul },
  accesoCabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  accesoTitulo: { color: colores.ink, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  accesoDetalle: { color: colores.ink, opacity: 0.6, fontSize: 12 },
  accesoTextoDestacado: { color: colores.blanco, opacity: 1 },
  insignia: { backgroundColor: colores.peligro, borderRadius: 999, minWidth: 20, height: 20, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  insigniaTexto: { color: colores.blanco, fontSize: 11, fontWeight: '700' },
});
