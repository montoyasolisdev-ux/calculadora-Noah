import React from 'react';
import { SistemaEscala } from '../data/escalas';

interface SelectorProps {
  sistemaActual?: SistemaEscala;
  onSelect?: (sistema: SistemaEscala) => void;
}

export const Selector: React.FC<SelectorProps> = ({ sistemaActual }) => {
  const escala = sistemaActual?.escala ?? 100;
  const meta = sistemaActual?.meta ?? 70;

  return (
    <div className="selector-container relative mb-6">
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xs backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
            CR
          </span>
          <div>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight">
              Sistema Académico Costa Rica
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Escala 0–{escala} • Nota mínima de aprobación: {meta}
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 rounded-full border border-indigo-200/60 dark:border-indigo-900/60">
          UCR / TEC / UNA / MEP
        </span>
      </div>
    </div>
  );
};

