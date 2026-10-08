import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { horaAMinutos, minutosAHora } from '../lib/formato';
import { colores } from '../lib/tema';

const INICIO_JORNADA = 7 * 60;
const FIN_JORNADA = 20 * 60;
const PASO_MINUTOS = 5;
const ALTO_ITEM = 40;
const ALTO_COLUMNA = ALTO_ITEM * 4;

const HORAS_DESDE = rango(7, 19);
const HORAS_HASTA = rango(7, 20);
const MINUTOS = Array.from({ length: 60 / PASO_MINUTOS }, (_, i) => i * PASO_MINUTOS);

function rango(desde, hasta) {
  return Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);
}

const dos = (n) => String(n).padStart(2, '0');

// Selector de franja horaria con duración libre: "Desde" y "Hasta" con hora y minutos (de 5 en 5).
// `valorInicial` = { ini: 'HH:MM', fin: 'HH:MM' }.
export default function SelectorFranja({ visible, valorInicial, hayFranja, onAplicar, onLimpiar, onCerrar }) {
  const [ini, setIni] = useState(horaAMinutos(valorInicial.ini));
  const [fin, setFin] = useState(horaAMinutos(valorInicial.fin));

  // Cada vez que se abre, arranca con el valor sugerido o el actual.
  useEffect(() => {
    if (visible) {
      setIni(horaAMinutos(valorInicial.ini));
      setFin(horaAMinutos(valorInicial.fin));
    }
  }, [visible, valorInicial.ini, valorInicial.fin]);

  const error = fin <= ini ? 'La hora de fin debe ser posterior a la de inicio.' : fin > FIN_JORNADA || ini < INICIO_JORNADA ? 'La jornada es de 07:00 a 20:00.' : null;
  const duracion = fin - ini;

  // Al mover el inicio se conserva la duración elegida mientras entre en la jornada.
  function cambiarIni(nuevo) {
    const nuevoFin = Math.min(nuevo + Math.max(duracion, PASO_MINUTOS), FIN_JORNADA);
    setIni(nuevo);
    setFin(nuevoFin > nuevo ? nuevoFin : Math.min(nuevo + PASO_MINUTOS, FIN_JORNADA));
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar} />
      <View style={styles.hoja}>
        <Text style={styles.titulo}>Horario a consultar</Text>

        <View style={styles.columnasDoble}>
          <Bloque titulo="Desde" minutos={ini} horas={HORAS_DESDE} onChange={cambiarIni} />
          <Bloque titulo="Hasta" minutos={fin} horas={HORAS_HASTA} onChange={setFin} />
        </View>

        <Text style={error ? styles.error : styles.resumen}>
          {error || `${minutosAHora(ini)} – ${minutosAHora(fin)} · ${formatearDuracion(duracion)}`}
        </Text>

        <Pressable style={[styles.boton, error && { opacity: 0.5 }]} disabled={Boolean(error)} onPress={() => onAplicar(minutosAHora(ini), minutosAHora(fin))}>
          <Text style={styles.botonTexto}>Ver disponibilidad</Text>
        </Pressable>
        {hayFranja ? (
          <Pressable style={styles.secundario} onPress={onLimpiar}>
            <Text style={styles.secundarioTexto}>Ver todo el día</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.secundario} onPress={onCerrar}>
            <Text style={styles.secundarioTexto}>Cancelar</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

function formatearDuracion(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h && m) return `${h} h ${m} min`;
  return h ? `${h} h` : `${m} min`;
}

// Hora y minutos de una misma marca de tiempo (en minutos desde medianoche).
function Bloque({ titulo, minutos, horas, onChange }) {
  const hora = Math.floor(minutos / 60);
  const minuto = minutos % 60;

  function cambiarHora(h) {
    onChange(h * 60 + (h === 20 ? 0 : minuto)); // a las 20 solo existe 20:00
  }
  function cambiarMinuto(m) {
    onChange(hora * 60 + m);
  }

  return (
    <View style={styles.bloque}>
      <Text style={styles.bloqueTitulo}>{titulo}</Text>
      <View style={styles.columnas}>
        <Columna valores={horas} actual={hora} onChange={cambiarHora} />
        <Text style={styles.dosPuntos}>:</Text>
        <Columna valores={hora === 20 ? [0] : MINUTOS} actual={minuto} onChange={cambiarMinuto} />
      </View>
    </View>
  );
}

function Columna({ valores, actual, onChange }) {
  const ref = useRef(null);

  // Deja el valor actual visible al abrir y cuando cambia desde fuera (p. ej. al mover el inicio).
  useEffect(() => {
    const indice = Math.max(0, valores.indexOf(actual));
    ref.current?.scrollTo({ y: Math.max(0, indice - 1) * ALTO_ITEM, animated: false });
  }, [actual, valores]);

  return (
    <ScrollView ref={ref} style={styles.columna} showsVerticalScrollIndicator={false} nestedScrollEnabled>
      {valores.map((v) => (
        <Pressable key={v} style={[styles.item, v === actual && styles.itemActivo]} onPress={() => onChange(v)}>
          <Text style={[styles.itemTexto, v === actual && styles.itemTextoActivo]}>{dos(v)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#00000066' },
  hoja: { backgroundColor: colores.blanco, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 },
  titulo: { color: colores.ink, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  columnasDoble: { flexDirection: 'row', gap: 16 },
  bloque: { flex: 1, alignItems: 'center', gap: 6 },
  bloqueTitulo: { color: colores.celeste, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  columnas: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  columna: { height: ALTO_COLUMNA, width: 56, backgroundColor: colores.paper, borderRadius: 12 },
  dosPuntos: { color: colores.ink, fontSize: 20, fontWeight: '700' },
  item: { height: ALTO_ITEM, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  itemActivo: { backgroundColor: colores.azul },
  itemTexto: { color: colores.ink, fontSize: 18, fontWeight: '600' },
  itemTextoActivo: { color: colores.blanco },
  resumen: { color: colores.ink, textAlign: 'center', fontWeight: '600' },
  error: { color: colores.peligro, textAlign: 'center', fontWeight: '600' },
  boton: { backgroundColor: colores.azul, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  botonTexto: { color: colores.blanco, fontWeight: '700', fontSize: 15 },
  secundario: { paddingVertical: 10, alignItems: 'center' },
  secundarioTexto: { color: colores.azul, fontWeight: '700' },
});
