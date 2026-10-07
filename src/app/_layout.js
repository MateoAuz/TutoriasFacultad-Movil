import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { colores } from '../lib/tema';

function Navegacion() {
  const { usuario, iniciando } = useAuth();

  if (iniciando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.paper }}>
        <ActivityIndicator size="large" color={colores.azul} />
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
            headerStyle: { backgroundColor: colores.azul },
            headerTintColor: colores.blanco,
          }}
        />
        <Stack.Screen
          name="solicitar"
          options={{
            headerShown: true,
            title: 'Solicitar tutoría',
            headerBackTitle: 'Atrás',
            headerStyle: { backgroundColor: colores.azul },
            headerTintColor: colores.blanco,
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
