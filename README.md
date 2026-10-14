# Tutorías FISEI — App móvil

Aplicación móvil del **estudiante** para el sistema de gestión de espacios y asistencia a tutorías de la
Facultad de Ingeniería en Sistemas, Electrónica e Industrial (FISEI) de la Universidad Técnica de Ambato.
Está hecha con **Expo + React Native + Expo Router** y comparte el mismo backend y la misma base de datos
que la aplicación web.

| Repositorio | Contenido |
|---|---|
| `TutoriasFacultad-Movil` (este) | App móvil del estudiante |
| `TutoriasFacultad-FrontendWeb` | Aplicación web (estudiante, docente, administrador y laboratorista) |
| `TutoriasFacultad` | Backend (Node.js, Express, Prisma y PostgreSQL en Supabase) |

## Qué puede hacer el estudiante

- **Inicio:** resumen con las tutorías en curso, cifras de su avance y accesos rápidos.
- **Horario:** sus clases y tutorías de la semana, día por día.
- **Tutorías:** próximas tutorías y estado de sus solicitudes, con el material que compartió el docente.
- **Escanear QR:** registra su asistencia a una tutoría (el sistema valida el horario, la matrícula y que no esté cancelada).
- **Espacios:** disponibilidad de aulas y laboratorios por día y horario, con búsqueda y filtros, y solicitud de una tutoría.
- **Matrícula:** inscribirse y retirarse de materias (máximo 5, sin repetir materia ni cruzar horarios).
- **Avisos:** inicio de tutoría, documentos nuevos, cancelaciones y respuesta a sus solicitudes.
- **Historial:** asistencias registradas, agrupadas por mes.

> Solo pueden iniciar sesión usuarios con rol **ESTUDIANTE**. Los demás roles usan la aplicación web.

## Requisitos

| Qué | Para qué |
|---|---|
| [Node.js](https://nodejs.org) 20 o superior | Ejecutar el proyecto |
| Un celular Android o iPhone | Probar la app |
| La app **Expo Go** en el celular | Abrir la app sin instalar nada más (ver más abajo) |
| El backend funcionando | La app necesita el servidor para iniciar sesión y mostrar datos |
| PC y celular en la **misma red Wi-Fi** | Para que el celular encuentre a la PC |

## 1. Instalar el proyecto

```bash
git clone https://github.com/MateoAuz/TutoriasFacultad-Movil.git
cd TutoriasFacultad-Movil
npm install
```

## 2. Poner en marcha el backend

La app no funciona sin el backend. En el repositorio `TutoriasFacultad`, dentro de `backend-facultad`:

```bash
cd TutoriasFacultad/backend-facultad
npm install
npm run dev
```

Necesita un archivo `.env` con las variables `PORT`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `EMAIL_USER`,
`EMAIL_PASS` y `FRONTEND_URL`. Cuando arranque bien verás en la terminal
un mensaje indicando que el servidor está escuchando en el puerto 3000.

Para comprobarlo abre en el navegador de la PC `http://localhost:3000/api/status/`: debe responder
`{"estado":"OK", ...}`.

## 3. Instalar Expo Go en el celular

**Expo Go** es una aplicación gratuita que permite abrir proyectos de Expo en el celular sin compilarlos.

- **Android:** búscala en **Google Play Store** como "Expo Go".
- **iPhone:** búscala en la **App Store** como "Expo Go".

Ábrela una vez instalada. No hace falta crear una cuenta para probar este proyecto.

## 4. Conectar la app con el backend

El celular no puede usar `localhost` (apuntaría al propio celular). Hay que usar la **dirección IP de la PC**
en la red local:

1. Averigua la IP de tu PC. En Windows, en PowerShell:
   ```powershell
   ipconfig
   ```
   Busca el adaptador **Wi-Fi** y copia el valor de **Dirección IPv4** (por ejemplo `192.168.1.25`).
   Si tienes varias interfaces (VPN, WSL, etc.), usa la del Wi-Fi.
2. Crea el archivo `.env` en la raíz de este proyecto copiando el ejemplo:
   ```bash
   cp .env.example .env
   ```
3. Edita `.env` y pon tu IP:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.25:3000/api
   ```

El archivo `.env` no se sube al repositorio. Si cambias la IP (por ejemplo al cambiar de red), vuelve a editarlo y
reinicia la app con `npx expo start -c`.

### Permitir el puerto 3000 en el firewall de Windows

Si el celular no logra conectarse, casi siempre es el firewall. Abre PowerShell **como administrador** y ejecuta:

```powershell
New-NetFirewallRule -DisplayName "Backend Tutorias 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
```

Si tu red Wi-Fi está marcada como *Pública*, cambia `-Profile Private` por `-Profile Any` o cámbiala a *Privada* en la
configuración de Windows.

### Comprobar que el celular llega al backend

Antes de abrir la app, abre el **navegador del celular** y entra a:

```
http://TU_IP:3000/api/status/
```

Si ves `{"estado":"OK", ...}`, la conexión funciona. Si no carga, revisa que estén en la misma red y el firewall.

## 5. Abrir la app en el celular

En la carpeta de este proyecto:

```bash
npx expo start
```

Aparecerá un **código QR** en la terminal. Escanéalo así:

- **Android:** abre **Expo Go** y toca **Scan QR code**.
- **iPhone:** abre la **Cámara** del iPhone, apunta al QR y toca la notificación que aparece (se abre en Expo Go).

La primera vez tarda un poco en cargar. Después, cada cambio en el código se actualiza solo en el celular.

Inicia sesión con un **estudiante** del sistema. Los usuarios de prueba están en `backend-facultad/prisma/seed.js`
del repositorio del backend; o puedes crear uno desde la aplicación web (rol estudiante) y matricularlo en un paralelo.

### Si la red no deja conectar: modo túnel

Algunas redes (por ejemplo las de la universidad o las de invitados) bloquean la comunicación entre dispositivos.
En ese caso puedes probar:

```bash
npx expo start --tunnel
```

El túnel solo comunica el celular con la app; **el backend sigue necesitando ser alcanzable** desde el celular, así que
en esas redes lo más práctico es desplegarlo en internet o usar un punto de acceso (compartir datos) desde tu celular
conectando la PC a esa red.

## Para ver las tutorías y el escáner funcionando

Para probar el flujo completo necesitas datos en el sistema, que se crean desde la aplicación web:

1. Un **docente** con un paralelo y un **estudiante matriculado** en ese paralelo (la matrícula se puede hacer desde la
   misma app, en *Matrícula*).
2. El docente crea una **reserva/tutoría** para el horario actual, con ese paralelo. Ahí se genera el **código QR**.
3. En la app, el estudiante la verá en **Inicio** como "En curso". Se escanea el QR de la pantalla del docente desde el
   botón **QR** de la app y se registra la asistencia.

> El escaneo solo funciona dentro del horario de la tutoría (desde 15 minutos antes hasta su hora de fin).

## Solución de problemas

| Problema | Qué revisar |
|---|---|
| "No se pudo conectar con el servidor" | La IP del `.env`, que el backend esté corriendo, que PC y celular estén en la misma red y el firewall (puerto 3000). |
| Cambié el `.env` y no pasa nada | Reinicia con `npx expo start -c`. |
| Expo Go dice que el proyecto es incompatible | Actualiza **Expo Go** desde la tienda de aplicaciones; este proyecto usa una versión reciente de Expo (SDK 57). |
| El QR de la terminal no abre nada | Comprueba que PC y celular estén en la misma red; si no, prueba `npx expo start --tunnel`. |
| "Esta aplicación es solo para estudiantes" | Iniciaste con un usuario que no es estudiante. Usa uno con rol ESTUDIANTE. |
| La cámara no abre al escanear | Acepta el permiso de cámara; si lo negaste, actívalo desde los ajustes del celular. |
| El puerto 3000 ya está en uso al iniciar el backend | Otro programa lo usa. Ciérralo o cambia `PORT` en el `.env` del backend (y la URL de la app). |

## Estructura del proyecto

```
src/
  app/                  Pantallas (Expo Router)
    (tabs)/             Pestañas: inicio, horario, tutorías, espacios, avisos, perfil, historial
    login.js            Inicio de sesión
    escanear.js         Escáner QR (hoja inferior)
    matricula.js        Matrícula
    solicitar.js        Solicitud de tutoría
    tutoria/[id].js     Detalle de la tutoría y material
  api/                  Cliente de la API (axios) y endpoints
  components/           Componentes reutilizables
  context/              Sesión y notificaciones
  hooks/                Hooks de carga de datos
  lib/                  Tema, formato de fechas y horarios
```

## Tecnologías

Expo SDK 57 · React Native · Expo Router · axios · expo-camera (escáner QR) · expo-secure-store (sesión) ·
@expo/vector-icons.

## Scripts

| Comando | Qué hace |
|---|---|
| `npx expo start` | Inicia la app en modo desarrollo |
| `npx expo start -c` | Igual, limpiando la caché (úsalo tras cambiar el `.env`) |
| `npx expo start --tunnel` | Inicia usando un túnel, para redes que bloquean la conexión directa |
| `npx expo-doctor` | Revisa que las dependencias sean compatibles |
