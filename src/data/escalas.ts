export interface SistemaEscala {
  id: string;
  nombre: string;
  nombreLargo: string;
  escala: number;
  meta: number;
  desc: string;
  code: string;
  gradient: string;
  accent: string;
}

export const ESCALA_COSTA_RICA: SistemaEscala = {
  id: 'CR',
  nombre: 'Costa Rica',
  nombreLargo: 'Costa Rica (UCR / TEC / UNA / UNED / UTN / MEP / Privadas)',
  escala: 100,
  meta: 70,
  desc: 'Escala oficial 0–100 • Aprobación con 70',
  code: 'CR',
  gradient: 'from-blue-600 to-indigo-600',
  accent: '#3b82f6',
};

export const ESCALAS_CENTROAMERICA: SistemaEscala[] = [ESCALA_COSTA_RICA];

