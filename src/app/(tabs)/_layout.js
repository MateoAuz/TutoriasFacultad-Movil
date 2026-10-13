import { Pressable, StyleSheet, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificacionesProvider, useNotificaciones } from '../../context/NotificacionesContext';
import { colores } from '../../lib/tema';

const icono = (nombre) =>
  function Icono({ color }) {
    return <Feather name={nombre} size={21} color={color} />;
  };

function Pestanas() {
  const { noLeidas } = useNotificaciones();
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // cada pantalla dibuja su propio encabezado
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: '#7B8798',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colores.blanco,
          borderTopColor: colores.linea,
          borderTopWidth: 1,
          height: 60 + bottom,
          paddingTop: 6,
          paddingBottom: 6 + bottom,
        },
        tabBarBadgeStyle: { backgroundColor: colores.peligro, color: colores.blanco, fontSize: 10 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icono('home') }} />
      <Tabs.Screen name="horario" options={{ title: 'Horario', tabBarIcon: icono('calendar') }} />
      <Tabs.Screen name="tutorias" options={{ title: 'Tutorías', tabBarIcon: icono('book-open') }} />
      <Tabs.Screen name="espacios" options={{ title: 'Espacios', tabBarIcon: icono('map-pin') }} />
      <Tabs.Screen name="historial" options={{ title: 'Historial', href: null }} />
      <Tabs.Screen
        name="notificaciones"
        options={{ title: 'Avisos', tabBarIcon: icono('bell'), tabBarBadge: noLeidas > 0 ? (noLeidas > 99 ? '99+' : noLeidas) : undefined }}
      />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarIcon: icono('user') }} />
    </Tabs>
  );
}

// Botón flotante para abrir el escáner desde cualquier pestaña (el escáner es una hoja, no una pestaña).
function BotonEscanear() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Pressable
      style={({ pressed }) => [styles.fab, { bottom: 76 + bottom }, pressed && { opacity: 0.85 }]}
      onPress={() => router.push('/escanear')}
      accessibilityLabel="Escanear código QR"
    >
      <MaterialCommunityIcons name="qrcode-scan" size={26} color={colores.blanco} />
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <NotificacionesProvider>
      <View style={{ flex: 1 }}>
        <Pestanas />
        <BotonEscanear />
      </View>
    </NotificacionesProvider>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
