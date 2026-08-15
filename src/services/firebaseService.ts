import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db, getOrCreateUserId } from '../lib/firebase';
import { HistorialCalculoItem, HistorialPromedioItem } from '../types';

const HISTORIAL_CALCULOS_KEY = 'calculadoranotas_historial_calculos';
const HISTORIAL_PROMEDIOS_KEY = 'calculadoranotas_historial_promedios';

// --- GESTIÓN DE MATERIAS Y PROYECCIONES ---

export async function guardarMateriaFirestore(item: HistorialPromedioItem): Promise<void> {
  const userId = getOrCreateUserId();
  const itemDoc = {
    ...item,
    userId,
    updatedAt: Date.now(),
  };

  // Guardar en localStorage primero para respuesta instantánea
  try {
    const raw = localStorage.getItem(HISTORIAL_PROMEDIOS_KEY);
    const prev: HistorialPromedioItem[] = raw ? JSON.parse(raw) : [];
    const idx = prev.findIndex((p) => p.id === item.id);
    let updated: HistorialPromedioItem[];
    if (idx >= 0) {
      updated = [...prev];
      updated[idx] = item;
    } else {
      updated = [item, ...prev].slice(0, 50);
    }
    localStorage.setItem(HISTORIAL_PROMEDIOS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error en caché local de materias', e);
  }

  // Guardar en Firestore
  try {
    const docRef = doc(db, 'materias', item.id);
    await setDoc(docRef, itemDoc, { merge: true });
  } catch (e) {
    console.warn('No se pudo sincronizar materia en Firestore (posible modo offline):', e);
  }
}

export function subscribeMaterias(
  callback: (materias: HistorialPromedioItem[]) => void
): () => void {
  const userId = getOrCreateUserId();
  
  // Cargar de caché local inmediatamente
  try {
    const raw = localStorage.getItem(HISTORIAL_PROMEDIOS_KEY);
    if (raw) {
      callback(JSON.parse(raw));
    }
  } catch (e) {
    console.error(e);
  }

  try {
    const q = query(
      collection(db, 'materias'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: HistorialPromedioItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: data.id || docSnap.id,
            materia: data.materia || '',
            fecha: data.fecha || '',
            filas: data.filas || [],
            examenFinal: data.examenFinal || '',
            totalAcumulado: data.totalAcumulado || '',
            notaNecesaria: data.notaNecesaria || '',
            pctFaltante: data.pctFaltante || '',
            estado: data.estado || 'normal',
          });
        });

        // Ordenar por ID o fecha descendente si existen
        items.sort((a, b) => (b.id > a.id ? 1 : -1));

        if (items.length > 0) {
          localStorage.setItem(HISTORIAL_PROMEDIOS_KEY, JSON.stringify(items));
          callback(items);
        }
      },
      (error) => {
        console.warn('Error en suscripción de materias en Firestore:', error);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn('Firestore no inicializado o sin conexión:', e);
    return () => {};
  }
}

export async function eliminarMateriaFirestore(id: string): Promise<void> {
  // Eliminar de localStorage
  try {
    const raw = localStorage.getItem(HISTORIAL_PROMEDIOS_KEY);
    if (raw) {
      const prev: HistorialPromedioItem[] = JSON.parse(raw);
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(HISTORIAL_PROMEDIOS_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error(e);
  }

  // Eliminar de Firestore
  try {
    const docRef = doc(db, 'materias', id);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Error al eliminar materia en Firestore:', e);
  }
}

// --- GESTIÓN DE CÁLCULOS RÁPIDOS ---

export async function guardarCalculoFirestore(item: HistorialCalculoItem): Promise<void> {
  const userId = getOrCreateUserId();
  const itemDoc = {
    ...item,
    userId,
    updatedAt: Date.now(),
  };

  // Guardar en localStorage
  try {
    const raw = localStorage.getItem(HISTORIAL_CALCULOS_KEY);
    const prev: HistorialCalculoItem[] = raw ? JSON.parse(raw) : [];
    const idx = prev.findIndex((p) => p.id === item.id);
    let updated: HistorialCalculoItem[];
    if (idx >= 0) {
      updated = [...prev];
      updated[idx] = item;
    } else {
      updated = [item, ...prev].slice(0, 50);
    }
    localStorage.setItem(HISTORIAL_CALCULOS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error en caché local de cálculos', e);
  }

  // Guardar en Firestore
  try {
    const docRef = doc(db, 'calculos', item.id);
    await setDoc(docRef, itemDoc, { merge: true });
  } catch (e) {
    console.warn('No se pudo sincronizar cálculo en Firestore:', e);
  }
}

export function subscribeCalculos(
  callback: (calculos: HistorialCalculoItem[]) => void
): () => void {
  const userId = getOrCreateUserId();

  // Cargar de caché local inmediatamente
  try {
    const raw = localStorage.getItem(HISTORIAL_CALCULOS_KEY);
    if (raw) {
      callback(JSON.parse(raw));
    }
  } catch (e) {
    console.error(e);
  }

  try {
    const q = query(
      collection(db, 'calculos'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: HistorialCalculoItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: data.id || docSnap.id,
            nombre: data.nombre || '',
            fecha: data.fecha || '',
            tipo: data.tipo || 'porcentaje',
            notaInput: data.notaInput || '',
            valorExamen: data.valorExamen || '',
            resultado: data.resultado || '',
            subtexto: data.subtexto || '',
          });
        });

        items.sort((a, b) => (b.id > a.id ? 1 : -1));

        if (items.length > 0) {
          localStorage.setItem(HISTORIAL_CALCULOS_KEY, JSON.stringify(items));
          callback(items);
        }
      },
      (error) => {
        console.warn('Error en suscripción de cálculos en Firestore:', error);
      }
    );

    return unsubscribe;
  } catch (e) {
    console.warn('Firestore no inicializado o sin conexión:', e);
    return () => {};
  }
}

export async function eliminarCalculoFirestore(id: string): Promise<void> {
  // Eliminar de localStorage
  try {
    const raw = localStorage.getItem(HISTORIAL_CALCULOS_KEY);
    if (raw) {
      const prev: HistorialCalculoItem[] = JSON.parse(raw);
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(HISTORIAL_CALCULOS_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error(e);
  }

  // Eliminar de Firestore
  try {
    const docRef = doc(db, 'calculos', id);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Error al eliminar cálculo en Firestore:', e);
  }
}

export async function limpiarTodoFirestore(): Promise<void> {
  const userId = getOrCreateUserId();

  localStorage.removeItem(HISTORIAL_CALCULOS_KEY);
  localStorage.removeItem(HISTORIAL_PROMEDIOS_KEY);

  try {
    const qM = query(collection(db, 'materias'), where('userId', '==', userId));
    const snapM = await getDocs(qM);
    const batch = writeBatch(db);
    snapM.forEach((d) => batch.delete(d.ref));

    const qC = query(collection(db, 'calculos'), where('userId', '==', userId));
    const snapC = await getDocs(qC);
    snapC.forEach((d) => batch.delete(d.ref));

    await batch.commit();
  } catch (e) {
    console.warn('Error al vaciar datos en Firestore:', e);
  }
}
