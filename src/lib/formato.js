// Las fechas y horas del backend son "naive": columnas Date/Time de Postgres leídas en UTC,
// por eso se formatean con getUTC* y nunca con la zona horaria del celular.
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const pad = (n) => String(n).padStart(2, '0');

// Date/ISO de columna Date -> "YYYY-MM-DD".
export function aFechaISO(valor) {
  return new Date(valor).toISOString().slice(0, 10);
}

// Date/ISO de columna Time -> "HH:MM".
export function aHoraTxt(valor) {
  const d = new Date(valor);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

// "2026-10-06" -> "martes 6 oct 2026"
export function formatearFecha(fechaISO) {
  const [y, m, d] = fechaISO.split('-').map(Number);
  const dia = DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${dia} ${d} ${MESES[m - 1]} ${y}`;
}

export function fechaDeHoy() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// PROXIMA | EN_CURSO | CONCLUIDA, comparando con el reloj local del celular.
export function estadoDeTutoria({ fecha, hora_ini, hora_fin }) {
  const hoy = fechaDeHoy();
  if (fecha < hoy) return 'CONCLUIDA';
  if (fecha > hoy) return 'PROXIMA';
  const ahora = new Date();
  const minutos = ahora.getHours() * 60 + ahora.getMinutes();
  if (minutos < aMinutos(hora_ini)) return 'PROXIMA';
  if (minutos >= aMinutos(hora_fin)) return 'CONCLUIDA';
  return 'EN_CURSO';
}

export function formatearTamano(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// "Ahora", "Hace 5 min", "Hace 3 h", "Hace 2 d" a partir de un instante real (ISO con zona).
export function tiempoRelativo(fechaISO) {
  const segundos = Math.max(0, Math.floor((Date.now() - new Date(fechaISO).getTime()) / 1000));
  if (segundos < 60) return 'Ahora';
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  return `Hace ${Math.floor(horas / 24)} d`;
}

// "2026-10-06" -> "octubre 2026"
export function mesYAnio(fechaISO) {
  const [y, m] = fechaISO.split('-').map(Number);
  return `${MESES_LARGOS[m - 1]} ${y}`;
}

// Instante real (ISO con zona) -> "HH:MM" en la hora local del celular.
export function horaLocal(valorISO) {
  const d = new Date(valorISO);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

// Próximos días hábiles (lunes a viernes) desde hoy, en hora local: [{ iso, dia, numero }].
export function diasHabiles(cantidad = 10) {
  const dias = [];
  const d = new Date();
  while (dias.length < cantidad) {
    const semana = d.getDay();
    if (semana !== 0 && semana !== 6) {
      dias.push({ iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, dia: DIAS_CORTOS[semana], numero: d.getDate() });
    }
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

export function horaAMinutos(hhmm) {
  return aMinutos(hhmm);
}

export function minutosAHora(minutos) {
  return `${pad(Math.floor(minutos / 60))}:${pad(minutos % 60)}`;
}

export const ETIQUETA_TIPO = { AULA: 'Aula', LABORATORIO: 'Laboratorio' };
export const ETIQUETA_BLOQUE = { BLOQUE_1: 'Bloque 1', BLOQUE_2: 'Bloque 2' };
