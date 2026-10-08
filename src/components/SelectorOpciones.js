import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colores } from '../lib/tema';

// Lista de opciones en una hoja inferior. `opciones` = [{ clave, etiqueta }]; `valor` = clave elegida.
export default function SelectorOpciones({ visible, titulo, opciones, valor, onElegir, onCerrar }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar} />
      <View style={styles.hoja}>
        <Text style={styles.titulo}>{titulo}</Text>
        {opciones.map((o) => {
          const activa = o.clave === valor;
          return (
            <Pressable key={String(o.clave)} style={[styles.opcion, activa && styles.opcionActiva]} onPress={() => onElegir(o.clave)}>
              <Text style={[styles.opcionTexto, activa && styles.opcionTextoActiva]}>{o.etiqueta}</Text>
              {activa ? <Text style={styles.marca}>✓</Text> : null}
            </Pressable>
          );
        })}
        <Pressable style={styles.cancelar} onPress={onCerrar}>
          <Text style={styles.cancelarTexto}>Cancelar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#00000066' },
  hoja: { backgroundColor: colores.blanco, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 8 },
  titulo: { color: colores.ink, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  opcion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: colores.linea, paddingHorizontal: 16, paddingVertical: 14 },
  opcionActiva: { borderColor: colores.azul, backgroundColor: '#F4F9FE' },
  opcionTexto: { color: colores.ink, fontSize: 15, fontWeight: '600' },
  opcionTextoActiva: { color: colores.azul },
  marca: { color: colores.azul, fontSize: 16, fontWeight: '800' },
  cancelar: { alignItems: 'center', paddingVertical: 10 },
  cancelarTexto: { color: colores.azul, fontWeight: '700' },
});
