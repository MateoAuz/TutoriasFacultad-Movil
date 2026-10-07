import { useCallback, useMemo } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import EstadoCarga from '../../components/EstadoCarga';
import Insignia from '../../components/Insignia';
import { tutoriasApi } from '../../api/tutorias';
import { ORIGEN_ARCHIVOS } from '../../api/client';
import { useRecurso } from '../../hooks/useRecurso';
import { estadoDeTutoria, formatearFecha, formatearTamano } from '../../lib/formato';
import { colores } from '../../lib/tema';

// Los archivos subidos traen una ruta relativa ("/uploads/..."); los enlaces externos ya son absolutos.
function urlDelDocumento(doc) {
  return /^https?:\/\//.test(doc.url_archivo) ? doc.url_archivo : `${ORIGEN_ARCHIVOS}${doc.url_archivo}`;
}

export default function DetalleTutoria() {
  const { id, datos } = useLocalSearchParams();
  const tutoria = useMemo(() => {
    try {
      return JSON.parse(datos);
    } catch {
      return null;
    }
  }, [datos]);

  // 403 = no registró asistencia: el material queda bloqueado. Cualquier otro error sí se muestra.
  const cargarDocumentos = useCallback(
    () =>
      tutoriasApi
        .documentos(id)
        .then((documentos) => ({ bloqueado: false, documentos }))
        .catch((err) => {
          if (err.response?.status === 403) return { bloqueado: true, documentos: [] };
          throw err;
        }),
    [id]
  );
  const material = useRecurso(cargarDocumentos, 'No se pudo cargar el material de la tutoría.');

  async function abrirDocumento(doc) {
    try {
      await Linking.openURL(urlDelDocumento(doc));
    } catch {
      Alert.alert('No se pudo abrir', 'No hay una aplicación que pueda abrir este archivo.');
    }
  }

  if (!tutoria) {
    return (
      <View style={styles.pantalla}>
        <Text style={styles.vacio}>No se pudo cargar la tutoría.</Text>
      </View>
    );
  }

  const estado = tutoria.cancelada ? 'CANCELADA' : estadoDeTutoria(tutoria);
  const documentos = material.data?.documentos ?? [];

  return (
    <ScrollView style={styles.pantalla} contentContainerStyle={styles.contenido}>
      <View style={styles.tarjeta}>
        <Insignia tipo={estado} />
        <Text style={styles.titulo}>{tutoria.curso || tutoria.tema}</Text>
        {tutoria.curso ? <Text style={styles.tema}>{tutoria.tema}</Text> : null}

        <Dato etiqueta="Fecha" valor={formatearFecha(tutoria.fecha)} />
        <Dato etiqueta="Horario" valor={`${tutoria.hora_ini} – ${tutoria.hora_fin}`} />
        <Dato etiqueta="Aula" valor={[tutoria.aula, tutoria.bloque && `Bloque ${tutoria.bloque}`, tutoria.piso && `Piso ${tutoria.piso}`].filter(Boolean).join(' · ')} />
        <Dato etiqueta="Docente" valor={tutoria.docente} />
      </View>

      <Text style={styles.seccion}>Material de la tutoría</Text>
      <EstadoCarga
        cargando={material.cargando}
        error={material.mensajeError}
        vacio={!material.data?.bloqueado && documentos.length === 0}
        mensajeVacio="El docente todavía no ha compartido material."
        onReintentar={material.refrescar}
      >
        {material.data?.bloqueado ? (
          <View style={styles.bloqueado}>
            <Text style={styles.bloqueadoTitulo}>Material bloqueado</Text>
            <Text style={styles.bloqueadoTexto}>Solo lo ven los estudiantes que registraron su asistencia escaneando el QR de la tutoría.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {documentos.map((doc) => (
              <Pressable key={doc.id_docu} style={({ pressed }) => [styles.documento, pressed && { opacity: 0.85 }]} onPress={() => abrirDocumento(doc)}>
                <View style={styles.extension}>
                  <Text style={styles.extensionTexto}>{(doc.extension || 'link').toUpperCase().slice(0, 4)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docNombre} numberOfLines={2}>
                    {doc.nom_archivo}
                  </Text>
                  {doc.tamano_bytes ? <Text style={styles.docTamano}>{formatearTamano(doc.tamano_bytes)}</Text> : null}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </EstadoCarga>
    </ScrollView>
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.paper },
  contenido: { padding: 16, gap: 12 },
  vacio: { color: colores.ink, opacity: 0.6, textAlign: 'center', padding: 32 },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 14, borderWidth: 1, borderColor: colores.linea, padding: 16, gap: 8 },
  titulo: { color: colores.ink, fontSize: 20, fontWeight: '700', marginTop: 4 },
  tema: { color: colores.ink, opacity: 0.7, fontSize: 15 },
  dato: { marginTop: 6 },
  datoEtiqueta: { color: colores.celeste, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  datoValor: { color: colores.ink, fontSize: 15 },
  seccion: { color: colores.ink, fontSize: 17, fontWeight: '700', marginTop: 8 },
  bloqueado: { backgroundColor: colores.blanco, borderRadius: 14, borderWidth: 1, borderColor: colores.linea, padding: 16, gap: 4 },
  bloqueadoTitulo: { color: colores.ink, fontWeight: '700' },
  bloqueadoTexto: { color: colores.ink, opacity: 0.65 },
  documento: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 1, borderColor: colores.linea, padding: 12 },
  extension: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#00447D1A', alignItems: 'center', justifyContent: 'center' },
  extensionTexto: { color: colores.azul, fontWeight: '800', fontSize: 11 },
  docNombre: { color: colores.ink, fontWeight: '600' },
  docTamano: { color: colores.ink, opacity: 0.5, fontSize: 12, marginTop: 2 },
});
