# Tutorías FISEI — App móvil

App del estudiante (Expo + React Native + Expo Router). Comparte backend con la web
(`TutoriasFacultad/backend-facultad`).

## Puesta en marcha
1. `npm install`
2. Copia `.env.example` a `.env` y pon la IP de tu PC en `EXPO_PUBLIC_API_URL`
   (celular y PC en el mismo Wi-Fi; el firewall debe permitir el puerto 3000).
3. `npx expo start` y abre la app con Expo Go.

## Estructura
- `src/app/` rutas (Expo Router): `login` y `(tabs)` con Tutorías, Escanear, Historial, Avisos y Perfil.
- `src/api/` cliente axios y endpoints.
- `src/context/AuthContext.js` sesión (token en `expo-secure-store`).
- Solo inician sesión usuarios con rol ESTUDIANTE.
