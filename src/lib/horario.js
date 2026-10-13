// Utilidades para mostrar y comparar el horario semanal de un paralelo
// (bloques { dia_semana, hora_ini, hora_fin, espacio? } de HorarioClase).
import { aHoraTxt } from './formato';

const ORDEN_DIA = { LUNES: 1, MARTES: 2, MIERCOLES: 3, JUEVES: 4, VIERNES: 5, SABADO: 6 };
export const ABREV_DIA = { LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié', JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb' };

// La hora puede llegar como "HH:MM" o como fecha ISO de una columna Time.
const aMinutos = (valor) => {
  const hhmm = String(valor).includes('T') ? aHoraTxt(valor) : String(valor).slice(0, 5);
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const aHora = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Une horas seguidas del mismo día y quita repeticiones: [{ dia, ini: '14:00', fin: '16:00' }, ...] de Lun a Vie.
function resumirHorario(bloques = []) {
  const unicos = new Map();
  for (const b of bloques) {
    const ini = aMinutos(b.hora_ini);
    const fin = aMinutos(b.hora_fin);
    unicos.set(`${b.dia_semana}|${ini}|${fin}`, { dia: b.dia_semana, ini, fin });
  }
  const ordenados = [...unicos.values()].sort((a, b) => (ORDEN_DIA[a.dia] ?? 9) - (ORDEN_DIA[b.dia] ?? 9) || a.ini - b.ini);

  const franjas = [];
  for (const f of ordenados) {
    const previa = franjas[franjas.length - 1];
    if (previa && previa.dia === f.dia && previa.fin === f.ini) previa.fin = f.fin;
    else franjas.push({ ...f });
  }
  return franjas.map((f) => ({ dia: f.dia, ini: aHora(f.ini), fin: aHora(f.fin) }));
}

// ["Lun 14:00–16:00", "Mar 17:00–19:00"]
export function franjasDeHorario(bloques = []) {
  return resumirHorario(bloques).map((f) => `${ABREV_DIA[f.dia] || f.dia} ${f.ini}–${f.fin}`);
}

// Primer bloque de `b` que se cruza con alguno de `a` (mismo día y horas solapadas), o null.
export function primerChoque(a = [], b = []) {
  for (const x of a) {
    for (const y of b) {
      if (x.dia_semana === y.dia_semana && aMinutos(x.hora_ini) < aMinutos(y.hora_fin) && aMinutos(y.hora_ini) < aMinutos(x.hora_fin)) {
        return y;
      }
    }
  }
  return null;
}

export function horaDeBloque(valor) {
  return aHora(aMinutos(valor));
}
