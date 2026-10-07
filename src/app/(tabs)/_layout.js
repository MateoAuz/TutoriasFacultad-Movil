import { Tabs } from 'expo-router';
import { NotificacionesProvider, useNotificaciones } from '../../context/NotificacionesContext';
import { colores } from '../../lib/tema';

function Pestanas() {
  const { noLeidas } = useNotificaciones();

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
      <Tabs.Screen name="espacios" options={{ title: 'Espacios' }} />
      <Tabs.Screen name="historial" options={{ title: 'Historial' }} />
      <Tabs.Screen
        name="notificaciones"
        options={{ title: 'Avisos', tabBarBadge: noLeidas > 0 ? (noLeidas > 99 ? '99+' : noLeidas) : undefined }}
      />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}

export default function TabsLayout() {
  return (
    <NotificacionesProvider>
      <Pestanas />
    </NotificacionesProvider>
  );
}
