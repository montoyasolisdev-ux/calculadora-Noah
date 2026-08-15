import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA0It9vL6Q5x8e8clwBf8b0l1OcYKBKAQ0",
  authDomain: "calculador-notas-noah.firebaseapp.com",
  projectId: "calculador-notas-noah",
  storageBucket: "calculador-notas-noah.firebasestorage.app",
  messagingSenderId: "561512390713",
  appId: "1:561512390713:web:f2eadec1ed092390ccede8"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const NOMBRE_KEY = 'calculadoranotas_nombre_usuario';

// Espera a que la sesión anónima esté lista y devuelve el usuario autenticado.
// Debe llamarse (y resolverse) antes de usar cualquier función de firebaseService.ts.
export function ensureAuth(): Promise<User> {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (user) {
        resolve(user);
        return;
      }
      try {
        const cred = await signInAnonymously(auth);
        resolve(cred.user);
      } catch (e) {
        reject(e);
      }
    });
  });
}

export function getNombreUsuario(): string | null {
  return localStorage.getItem(NOMBRE_KEY);
}

export function setNombreUsuario(nombre: string): void {
  localStorage.setItem(NOMBRE_KEY, nombre.trim());
}

export function cerrarSesionLocal(): void {
  localStorage.removeItem(NOMBRE_KEY);
}

// El "userId" real ahora es el uid de Firebase Auth (sesión anónima).
// Solo válido después de que ensureAuth() se haya resuelto.
export function getOrCreateUserId(): string {
  return auth.currentUser?.uid || '';
}
