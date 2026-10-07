// Las fechas y horas del backend son "naive": columnas Date/Time de Postgres leídas en UTC,
// por eso se formatean con getUTC* y nunca con la zona horaria del celular.
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
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
