import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colores } from '../lib/tema';

export default function Login() {
  const { iniciarSesion, cargando, error } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const incompleto = !correo.trim() || !password;

  return (
    <KeyboardAvoidingView style={styles.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Formas decorativas: un círculo coral y un cuadrado verde que se salen de la pantalla */}
      <View style={styles.circulo} pointerEvents="none" />
      <View style={styles.cuadrado} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.marca}>
          <View style={styles.sello}>
            <Feather name="book-open" size={24} color={colores.blanco} />
          </View>
          <Text style={styles.kicker}>FISEI · UTA</Text>
          <Text style={styles.titulo}>
            Tutorías<Text style={styles.punto}>.</Text>
          </Text>
          <Text style={styles.subtitulo}>Registra tu asistencia, reserva espacios y consulta tu material.</Text>
        </View>

        <View style={styles.formulario}>
          <Text style={styles.etiqueta}>Correo institucional</Text>
          <View style={styles.campo}>
            <Feather name="mail" size={18} color={colores.primario} />
            <TextInput
              style={styles.input}
              placeholder="usuario@uta.edu.ec"
              placeholderTextColor="#8A96A8"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={correo}
              onChangeText={setCorreo}
            />
          </View>

          <Text style={[styles.etiqueta, { marginTop: 18 }]}>Contraseña</Text>
          <View style={styles.campo}>
            <Feather name="lock" size={18} color={colores.primario} />
            <TextInput
              style={styles.input}
              placeholder="Tu contraseña"
              placeholderTextColor="#8A96A8"
              secureTextEntry={!verPassword}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={() => !incompleto && iniciarSesion(correo, password)}
            />
            <Pressable onPress={() => setVerPassword((v) => !v)} hitSlop={10}>
              <Feather name={verPassword ? 'eye-off' : 'eye'} size={18} color={colores.texto} style={{ opacity: 0.55 }} />
            </Pressable>
          </View>

          {error ? (
            <View style={styles.error}>
              <Feather name="alert-circle" size={16} color={colores.peligro} />
              <Text style={styles.errorTexto}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.boton, (incompleto || cargando) && styles.botonInactivo, pressed && { opacity: 0.88 }]}
            disabled={incompleto || cargando}
            onPress={() => iniciarSesion(correo, password)}
          >
            {cargando ? (
              <ActivityIndicator color={colores.blanco} />
            ) : (
              <>
                <Text style={styles.botonTexto}>Entrar</Text>
                <Feather name="arrow-right" size={18} color={colores.blanco} />
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo, overflow: 'hidden' },
  circulo: { position: 'absolute', top: -90, right: -70, width: 240, height: 240, borderRadius: 120, backgroundColor: colores.acentoSuave },
  cuadrado: { position: 'absolute', bottom: -60, left: -50, width: 190, height: 190, borderRadius: 28, backgroundColor: colores.primarioSuave, transform: [{ rotate: '18deg' }] },
  contenido: { flexGrow: 1, justifyContent: 'center', padding: 28, gap: 36 },
  marca: { gap: 6 },
  sello: { width: 56, height: 56, borderRadius: 12, backgroundColor: colores.primario, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  kicker: { color: colores.acento, fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  titulo: { color: colores.texto, fontSize: 44, fontWeight: '700', letterSpacing: -1.5 },
  punto: { color: colores.acento },
  subtitulo: { color: colores.texto, opacity: 0.65, fontSize: 15, lineHeight: 21, maxWidth: 300 },
  formulario: { gap: 4 },
  etiqueta: { color: colores.texto, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', opacity: 0.7 },
  campo: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 2, borderBottomColor: colores.primario, paddingVertical: 6 },
  input: { flex: 1, fontSize: 16, color: colores.texto, paddingVertical: 8 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#B4412F14', borderRadius: 10, padding: 10, marginTop: 14 },
  errorTexto: { color: colores.peligro, fontSize: 13, flex: 1 },
  boton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colores.primario, borderRadius: 10, paddingVertical: 16, marginTop: 26 },
  botonInactivo: { opacity: 0.45 },
  botonTexto: { color: colores.blanco, fontWeight: '700', fontSize: 16 },
});
