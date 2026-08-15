import React from 'react';
import { SistemaEscala } from '../data/escalas';

export type ScreenType = 'menu' | 'calculadora' | 'registro' | 'historial';

export interface NotaItem {
  id: number;
  nombre: string;
  valor: string;
}

export interface MenuItemInfo {
  id: ScreenType;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  borderGlow: string;
}

export interface HistorialCalculoItem {
  id: string;
  nombre: string;
  fecha: string;
  tipo: 'porcentaje' | 'nota_requerida';
  notaInput: string;
  valorExamen: string;
  resultado: string;
  subtexto: string;
}

export interface HistorialPromedioItem {
  id: string;
  materia: string;
  fecha: string;
  filas: { nombre: string; valor: string }[];
  examenFinal: string;
  totalAcumulado: string;
  notaNecesaria: string;
  pctFaltante: string;
  estado: 'pass' | 'fail' | 'normal';
}

export { type SistemaEscala };
