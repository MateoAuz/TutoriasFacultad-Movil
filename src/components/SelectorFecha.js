import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { NOMBRES_MES, fechaDeHoy } from '../lib/formato';
import { colores } from '../lib/tema';

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MESES_ADELANTE = 6;

const dos = (n) => String(n).padStart(2, '0');
const aISO = (y, m, d) => `${y}-${dos(m + 1)}-${dos(d)}`; // m: 0-11

// Calendario mensual para elegir el día. Los fines de semana y los días pasados no se pueden elegir
// (la facultad solo tiene actividades de lunes a viernes).
export default function SelectorFecha({ visible, fecha, onElegir, onCerrar }) {
  const hoy = fechaDeHoy();
  const [anioHoy, mesHoy] = hoy.split('-').map(Number);
  const [anio, setAnio] = useState(Number(fecha.slice(0, 4)));
  const [mes, setMes] = useState(Number(fecha.slice(5, 7)) - 1);

  // Al abrir, muestra el mes del día elegido.
  useEffect(() => {
    if (visible) {
      setAnio(Number(fecha.slice(0, 4)));
      setMes(Number(fecha.slice(5, 7)) - 1);
    }
  }, [visible, fecha]);

  const mesesDesdeHoy = (anio - anioHoy) * 12 + (mes - (mesHoy - 1));
  const puedeRetroceder = mesesDesdeHoy > 0;
  const puedeAvanzar = mesesDesdeHoy < MESES_ADELANTE;

  function moverMes(delta) {
    const nuevo = new Date(anio, mes + delta, 1);
    setAnio(nuevo.getFullYear());
    setMes(nuevo.getMonth());
  }

  // Semana que empieza en lunes: getDay() 0=domingo -> posición 6.
  const primero = new Date(anio, mes, 1).getDay();
  const relleno = (primero + 6) % 7;
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();
  const celdas = [...Array(relleno).fill(null), ...Array.from({ length: diasDelMes }, (_, i) => i + 1)];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar}>
        <Pressable style={styles.tarjeta} onPress={() => {}}>
          <View style={styles.cabecera}>
            <Pressable style={[styles.flecha, !puedeRetroceder && { opacity: 0.25 }]} disabled={!puedeRetroceder} onPress={() => moverMes(-1)}>
              <Text style={styles.flechaTexto}>‹</Text>
            </Pressable>
            <Text style={styles.mes}>
              {NOMBRES_MES[mes].charAt(0).toUpperCase() + NOMBRES_MES[mes].slice(1)} {anio}
            </Text>
            <Pressable style={[styles.flecha, !puedeAvanzar && { opacity: 0.25 }]} disabled={!puedeAvanzar} onPress={() => moverMes(1)}>
              <Text style={styles.flechaTexto}>›</Text>
            </Pressable>
          </View>

          <View style={styles.fila}>
            {DIAS_SEMANA.map((d, i) => (
              <Text key={i} style={styles.diaSemana}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.cuadricula}>
            {celdas.map((dia, i) => {
              if (!dia) return <View key={`v${i}`} style={styles.celda} />;
              const iso = aISO(anio, mes, dia);
              const finDeSemana = (relleno + dia - 1) % 7 >= 5;
              const deshabilitado = finDeSemana || iso < hoy;
              const elegido = iso === fecha;
              return (
                <Pressable key={iso} style={styles.celda} disabled={deshabilitado} onPress={() => onElegir(iso)}>
                  <View style={[styles.circulo, elegido && styles.circuloElegido, iso === hoy && !elegido && styles.circuloHoy]}>
                    <Text style={[styles.numero, deshabilitado && styles.numeroInactivo, elegido && styles.numeroElegido]}>{dia}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.cerrar} onPress={onCerrar}>
            <Text style={styles.cerrarTexto}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center', padding: 20 },
  tarjeta: { width: '100%', maxWidth: 380, backgroundColor: colores.blanco, borderRadius: 18, padding: 16, gap: 8 },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mes: { color: colores.ink, fontSize: 17, fontWeight: '700' },
  flecha: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  flechaTexto: { color: colores.azul, fontSize: 28, lineHeight: 30, fontWeight: '700' },
  fila: { flexDirection: 'row' },
  diaSemana: { flex: 1, textAlign: 'center', color: colores.celeste, fontWeight: '700', fontSize: 12, paddingVertical: 4 },
  cuadricula: { flexDirection: 'row', flexWrap: 'wrap' },
  celda: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  circulo: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  circuloElegido: { backgroundColor: colores.azul },
  circuloHoy: { borderWidth: 1.5, borderColor: colores.azul },
  numero: { color: colores.ink, fontSize: 15, fontWeight: '600' },
  numeroInactivo: { color: colores.ink, opacity: 0.25 },
  numeroElegido: { color: colores.blanco },
  cerrar: { alignItems: 'center', paddingVertical: 10 },
  cerrarTexto: { color: colores.azul, fontWeight: '700' },
});
