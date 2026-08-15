import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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

// Helper para obtener un ID persistente de usuario/estudiante
export function getOrCreateUserId(): string {
  const KEY = 'calculadoranotas_user_id';
  let uid = localStorage.getItem(KEY);
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem(KEY, uid);
  }
  return uid;
}
