// Envoltura simple sobre localStorage. Todo se guarda en el dispositivo del usuario.
export const Storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* almacenamiento no disponible (modo privado, etc.) */
    }
  }
};
