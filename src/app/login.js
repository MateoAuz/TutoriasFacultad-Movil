import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colores } from '../lib/tema';

export default function Login() {
  const { iniciarSesion, cargando, error } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const incompleto = !correo.trim() || !password;

  return (
    <KeyboardAvoidingView style={styles.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.tarjeta}>
        <Text style={styles.kicker}>UTA · FISEI</Text>
        <Text style={styles.titulo}>Tutorías</Text>
        <Text style={styles.subtitulo}>Inicia sesión para registrar tu asistencia y ver tus tutorías.</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo institucional"
          placeholderTextColor="#7A8CA0"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={correo}
          onChangeText={setCorreo}
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#7A8CA0"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={() => !incompleto && iniciarSesion(correo, password)}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.boton, (incompleto || cargando) && styles.botonInactivo, pressed && { opacity: 0.85 }]}
          disabled={incompleto || cargando}
          onPress={() => iniciarSesion(correo, password)}
        >
          {cargando ? <ActivityIndicator color={colores.blanco} /> : <Text style={styles.botonTexto}>Iniciar sesión</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.paper, justifyContent: 'center', padding: 20 },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: colores.linea, gap: 12 },
  kicker: { color: colores.celeste, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  titulo: { color: colores.ink, fontSize: 30, fontWeight: '700' },
  subtitulo: { color: colores.ink, opacity: 0.65, fontSize: 14, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colores.linea, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colores.ink, backgroundColor: colores.paper },
  error: { color: colores.peligro, fontSize: 13 },
  boton: { backgroundColor: colores.azul, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  botonInactivo: { opacity: 0.5 },
  botonTexto: { color: colores.blanco, fontWeight: '700', fontSize: 15 },
});
