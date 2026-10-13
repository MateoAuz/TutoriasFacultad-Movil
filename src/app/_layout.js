import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { colores } from '../lib/tema';

function Navegacion() {
  const { usuario, iniciando } = useAuth();

  if (iniciando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo }}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!usuario}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="tutoria/[id]"
          options={{
            headerShown: true,
            title: 'Tutoría',
            headerBackTitle: 'Atrás',
            headerStyle: { backgroundColor: colores.primario },
            headerTintColor: colores.blanco,
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <Stack.Screen name="escanear" options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }} />
        <Stack.Screen
          name="matricula"
          options={{
            headerShown: true,
            title: 'Matrícula',
            headerBackTitle: 'Atrás',
            headerStyle: { backgroundColor: colores.primario },
            headerTintColor: colores.blanco,
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <Stack.Screen
          name="solicitar"
          options={{
            headerShown: true,
            title: 'Solicitar tutoría',
            headerBackTitle: 'Atrás',
            headerStyle: { backgroundColor: colores.primario },
            headerTintColor: colores.blanco,
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!usuario}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Navegacion />
    </AuthProvider>
  );
}
