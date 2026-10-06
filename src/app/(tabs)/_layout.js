import { Tabs } from 'expo-router';
import { colores } from '../../lib/tema';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colores.azul },
        headerTintColor: colores.blanco,
        tabBarActiveTintColor: colores.azul,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Tutorías' }} />
      <Tabs.Screen name="escanear" options={{ title: 'Escanear' }} />
      <Tabs.Screen name="historial" options={{ title: 'Historial' }} />
      <Tabs.Screen name="notificaciones" options={{ title: 'Avisos' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
