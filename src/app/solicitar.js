import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import EstadoCarga from '../components/EstadoCarga';
import { matriculasApi, solicitudesApi } from '../api/solicitudes';
import { mensajeDeError } from '../api/client';
import { useRecurso } from '../hooks/useRecurso';
import { formatearFecha } from '../lib/formato';
import { colores } from '../lib/tema';

export default function SolicitarTutoria() {
  const { id_esp, nom_esp, fecha, hor_ini, hor_fin } = useLocalSearchParams();
  const matriculas = useRecurso(matriculasApi.mias, 'No se pudieron cargar tus cursos.');
  const [idParalelo, setIdParalelo] = useState(null);
  const [tema, setTema] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const cursos = matriculas.data ?? [];

  async function enviar() {
    setEnviando(true);
    setError(null);
    try {
      await solicitudesApi.crear({ id_par: idParalelo, id_esp: Number(id_esp), fecha, hor_ini, hor_fin, tema: tema.trim() });
      Alert.alert('Solicitud enviada', 'El docente recibirá tu solicitud. Puedes seguirla en Tutorías → Mis solicitudes y te avisaremos en Avisos cuando responda.', [
        { text: 'Ver mis solicitudes', onPress: () => router.navigate({ pathname: '/tutorias', params: { seccion: 'solicitudes', t: String(Date.now()) } }) },
      ]);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo enviar la solicitud.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.pantalla} contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.resumen}>
          <Text style={styles.etiqueta}>Espacio</Text>
          <Text style={styles.valor}>{nom_esp}</Text>
          <Text style={styles.etiqueta}>Cuándo</Text>
          <Text style={styles.valor}>
            {formatearFecha(fecha)} · {hor_ini} – {hor_fin}
          </Text>
        </View>

        <Text style={styles.seccion}>¿Para qué curso?</Text>
        <EstadoCarga
          cargando={matriculas.cargando}
          error={matriculas.mensajeError}
          vacio={cursos.length === 0}
          mensajeVacio="No estás matriculado en ningún curso, así que no puedes solicitar tutorías."
          onReintentar={matriculas.refrescar}
        >
          <View style={{ gap: 8 }}>
            {cursos.map((m) => {
              const activo = idParalelo === m.paralelo.id_par;
              return (
                <Pressable key={m.id_matricula} style={[styles.curso, activo && styles.cursoActivo]} onPress={() => setIdParalelo(m.paralelo.id_par)}>
                  <Text style={styles.cursoNombre}>
                    {m.paralelo.materia?.nom_mat} · Paralelo {m.paralelo.nom_par}
                  </Text>
                  <Text style={styles.cursoDocente}>
                    {m.paralelo.docente ? `${m.paralelo.docente.nombres} ${m.paralelo.docente.apellidos}` : 'Sin docente'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </EstadoCarga>

        <Text style={styles.seccion}>Tema (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Dudas del proyecto final"
          placeholderTextColor="#7A8CA0"
          value={tema}
          onChangeText={setTema}
          maxLength={200}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.boton, (!idParalelo || enviando) && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}
          disabled={!idParalelo || enviando}
          onPress={enviar}
        >
          {enviando ? <ActivityIndicator color={colores.blanco} /> : <Text style={styles.botonTexto}>Enviar solicitud</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.paper },
  contenido: { padding: 16, gap: 10 },
  resumen: { backgroundColor: colores.blanco, borderRadius: 14, borderWidth: 1, borderColor: colores.linea, padding: 16, gap: 2 },
  etiqueta: { color: colores.celeste, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 6 },
  valor: { color: colores.ink, fontSize: 16, fontWeight: '600' },
  seccion: { color: colores.ink, fontSize: 16, fontWeight: '700', marginTop: 10 },
  curso: { backgroundColor: colores.blanco, borderRadius: 12, borderWidth: 2, borderColor: colores.linea, padding: 14 },
  cursoActivo: { borderColor: colores.azul, backgroundColor: '#F4F9FE' },
  cursoNombre: { color: colores.ink, fontWeight: '700' },
  cursoDocente: { color: colores.ink, opacity: 0.6, fontSize: 13, marginTop: 2 },
  input: { backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.linea, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colores.ink },
  error: { color: colores.peligro, fontSize: 13 },
  boton: { backgroundColor: colores.azul, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  botonTexto: { color: colores.blanco, fontWeight: '700', fontSize: 15 },
});
