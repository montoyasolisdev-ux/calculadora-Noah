import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calculator,
  Percent,
  Target,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Flame,
  History,
  Trash2,
  RotateCcw,
  Bookmark,
  Cloud,
} from 'lucide-react';
import { SistemaEscala } from '../data/escalas';
import { HistorialCalculoItem } from '../types';
import {
  guardarCalculoFirestore,
  subscribeCalculos,
  eliminarCalculoFirestore,
} from '../services/firebaseService';

interface CalculadoraProps {
  sistema: SistemaEscala;
  onSetSistema: (s: SistemaEscala) => void;
  onVolver: () => void;
  itemInicial?: HistorialCalculoItem | null;
  onVerHistorial?: () => void;
}

export const Calculadora: React.FC<CalculadoraProps> = ({
  sistema,
  onVolver,
  itemInicial,
  onVerHistorial,
}) => {
  // Card 1: ¿Cuánto % obtuve?
  const [nombrePorcentaje, setNombrePorcentaje] = useState('');
  const [notaObtenida, setNotaObtenida] = useState('');
  const [valorExamen, setValorExamen] = useState('');
  const [resPorcentaje, setResPorcentaje] = useState<{ valor: string; sub: string } | null>(null);

  // Card 2: ¿Qué nota necesito?
  const [nombreNota, setNombreNota] = useState('');
  const [pctDeseado, setPctDeseado] = useState('');
  const [valorExamenInv, setValorExamenInv] = useState('');
  const [resNota, setResNota] = useState<{ valor: string; sub: string } | null>(null);

  // Historial
  const [historial, setHistorial] = useState<HistorialCalculoItem[]>([]);

  // Subscribe to Firebase Firestore and local cache
  useEffect(() => {
    const unsubscribe = subscribeCalculos((data) => {
      setHistorial(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (itemInicial) {
      handleCargarItem(itemInicial);
    }
  }, [itemInicial]);

  const guardarEnHistorial = (item: HistorialCalculoItem) => {
    guardarCalculoFirestore(item);
  };

  const handleEliminarItem = (id: string) => {
    eliminarCalculoFirestore(id);
  };

  const handleLimpiarHistorial = async () => {
    if (window.confirm('¿Deseas vaciar todo el historial de cálculos rápidos?')) {
      for (const item of historial) {
        await eliminarCalculoFirestore(item.id);
      }
      setHistorial([]);
    }
  };

  const formatearFecha = () => {
    const ahora = new Date();
    return ahora.toLocaleDateString('es-CR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCalcPorcentaje = () => {
    const nota = parseFloat(notaObtenida);
    const valor = parseFloat(valorExamen);
    if (isNaN(nota) || isNaN(valor) || valor <= 0) return;
    const notaClamp = Math.min(nota, sistema.escala);
    const resultado = ((notaClamp / sistema.escala) * valor).toFixed(2);
    const resultadoTexto = `${resultado}%`;
    const subtexto = `del ${valor}% total de la evaluación.`;

    setResPorcentaje({
      valor: resultadoTexto,
      sub: subtexto,
    });

    const nombreFinal = nombrePorcentaje.trim() || 'Examen / Evaluación';
    guardarEnHistorial({
      id: Date.now().toString(),
      nombre: nombreFinal,
      fecha: formatearFecha(),
      tipo: 'porcentaje',
      notaInput: notaObtenida,
      valorExamen: valorExamen,
      resultado: resultadoTexto,
      subtexto: `Nota ${notaObtenida}/${sistema.escala} en prueba de ${valorExamen}%`,
    });
  };

  const handleCalcNota = () => {
    const pct = parseFloat(pctDeseado);
    const valor = parseFloat(valorExamenInv);
    if (isNaN(pct) || isNaN(valor) || valor === 0) return;
    const resultado = ((pct / valor) * sistema.escala).toFixed(2);
    const resultadoTexto = resultado;
    const subtexto = `en escala de 0 a ${sistema.escala}.`;

    setResNota({
      valor: resultadoTexto,
      sub: subtexto,
    });

    const nombreFinal = nombreNota.trim() || 'Meta de examen';
    guardarEnHistorial({
      id: Date.now().toString(),
      nombre: nombreFinal,
      fecha: formatearFecha(),
      tipo: 'nota_requerida',
      notaInput: pctDeseado,
      valorExamen: valorExamenInv,
      resultado: `${resultadoTexto} pts`,
      subtexto: `Para ganar ${pctDeseado}% de ${valorExamenInv}% total`,
    });
  };

  const handleCargarItem = (item: HistorialCalculoItem) => {
    if (item.tipo === 'porcentaje') {
      setNombrePorcentaje(item.nombre);
      setNotaObtenida(item.notaInput);
      setValorExamen(item.valorExamen);
      setResPorcentaje({
        valor: item.resultado,
        sub: `del ${item.valorExamen}% total de la evaluación.`,
      });
      // Scroll to card 1
      window.scrollTo({ top: 100, behavior: 'smooth' });
    } else {
      setNombreNota(item.nombre);
      setPctDeseado(item.notaInput);
      setValorExamenInv(item.valorExamen);
      setResNota({
        valor: item.resultado.replace(' pts', ''),
        sub: `en escala de 0 a ${sistema.escala}.`,
      });
      // Scroll to card 2
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }
  };

  return (
    <div className="screen">
      <div className="topbar flex items-center justify-between">
        <button className="back-btn group" id="btn-volver" onClick={onVolver}>
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Volver al menú</span>
        </button>

        {onVerHistorial && (
          <button
            onClick={onVerHistorial}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-900/60 hover:bg-purple-100 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Ver historial</span>
          </button>
        )}
      </div>

      <div className="mb-6">
        <h1 className="screen-title">Calculadora rápida</h1>
      </div>

      {/* Tarjeta 1: ¿Cuánto % obtuve? */}
      <div className="card card-dark">
        <div className="card-header-badge bg-gradient-to-r from-zinc-900 to-black text-white">
          <Percent className="w-4 h-4" />
          <h2 className="card-title-text">¿Cuánto % obtuve?</h2>
        </div>

        <div className="field">
          <label className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-zinc-500" />
            Nombre de la prueba (opcional)
          </label>
          <input
            type="text"
            id="nombre-porcentaje"
            placeholder="Ej: Examen 1 de fisio, Quiz 2..."
            value={nombrePorcentaje}
            onChange={(e) => setNombrePorcentaje(e.target.value)}
          />
        </div>
        
        <div className="field">
          <label id="lbl-nota-escala">Mi nota obtenida (escala sobre {sistema.escala})</label>
          <input
            type="number"
            inputMode="decimal"
            id="nota-obtenida"
            placeholder="Ej: 85"
            value={notaObtenida}
            onChange={(e) => setNotaObtenida(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Valor de la prueba (%)</label>
          <input
            type="number"
            inputMode="decimal"
            id="valor-examen"
            placeholder="Ej: 25"
            value={valorExamen}
            onChange={(e) => setValorExamen(e.target.value)}
          />
        </div>

        <button className="btn btn-gradient-dark" id="btn-calc-porcentaje" onClick={handleCalcPorcentaje}>
          <Sparkles className="w-4 h-4" />
          Calcular porcentaje y guardar
        </button>

        {resPorcentaje && (
          <div className="result result-dark" id="res-porcentaje">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {nombrePorcentaje.trim() ? nombrePorcentaje.trim() : 'Obtuviste exactamente'}
            </div>
            <p className="result-value bg-gradient-to-r from-zinc-900 via-neutral-900 to-black bg-clip-text text-transparent" id="res-porcentaje-valor">
              {resPorcentaje.valor}
            </p>
            <p className="result-sub" id="res-porcentaje-sub">
              {resPorcentaje.sub}
            </p>
          </div>
        )}
      </div>

      {/* Tarjeta 2: ¿Qué nota necesito? */}
      <div className="card card-dark">
        <div className="card-header-badge bg-gradient-to-r from-zinc-900 to-black text-white">
          <Target className="w-4 h-4" />
          <h2 className="card-title-text">¿Qué nota necesito?</h2>
        </div>

        <div className="field">
          <label className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-zinc-500" />
            Nombre de la prueba (opcional)
          </label>
          <input
            type="text"
            id="nombre-nota"
            placeholder="Ej: Examen 2 de fisio, Proyecto final..."
            value={nombreNota}
            onChange={(e) => setNombreNota(e.target.value)}
          />
        </div>
        
        <div className="field">
          <label>% que deseo acumular</label>
          <input
            type="number"
            inputMode="decimal"
            id="pct-deseado"
            placeholder="Ej: 18"
            value={pctDeseado}
            onChange={(e) => setPctDeseado(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Valor total del examen (%)</label>
          <input
            type="number"
            inputMode="decimal"
            id="valor-examen-inv"
            placeholder="Ej: 25"
            value={valorExamenInv}
            onChange={(e) => setValorExamenInv(e.target.value)}
          />
        </div>

        <button className="btn btn-gradient-dark" id="btn-calc-nota" onClick={handleCalcNota}>
          <Flame className="w-4 h-4" />
          Calcular nota requerida y guardar
        </button>

        {resNota && (
          <div className="result result-dark" id="res-nota">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              <Target className="w-3.5 h-3.5" />
              {nombreNota.trim() ? nombreNota.trim() : 'Debes obtener al menos'}
            </div>
            <p className="result-value bg-gradient-to-r from-zinc-900 via-neutral-900 to-black bg-clip-text text-transparent" id="res-nota-valor">
              {resNota.valor}
            </p>
            <p className="result-sub" id="res-nota-sub">
              {resNota.sub}
            </p>
          </div>
        )}
      </div>

      {/* Historial de cálculos rápidos */}
      <div className="card card-dark">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Historial de cálculos
              </h2>
              <p className="text-xs text-slate-500">
                {historial.length === 0
                  ? 'Tus cálculos guardados aparecerán aquí'
                  : `${historial.length} cálculo${historial.length === 1 ? '' : 's'} guardado${historial.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          {historial.length > 0 && (
            <button
              onClick={handleLimpiarHistorial}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 dark:text-rose-400 p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1"
              title="Borrar todo el historial"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {historial.length === 0 ? (
          <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Bookmark className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Aún no hay cálculos guardados.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Calcula un porcentaje o nota requerida arriba y se registrará automáticamente con su nombre.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {historial.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {item.nombre}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        item.tipo === 'porcentaje'
                          ? 'bg-zinc-900 text-white'
                          : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {item.tipo === 'porcentaje' ? '% Obtenido' : 'Nota Requerida'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {item.subtexto}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <span>{item.fecha}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-base font-extrabold font-mono text-zinc-900 dark:text-white">
                      {item.resultado}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCargarItem(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                      title="Cargar datos en el formulario"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEliminarItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="disclaimer">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            <b>Aviso importante:</b> estas proyecciones matemáticas son un cálculo referencial. La calificación final puede variar según las políticas de redondeo institucional o criterios de cátedra. Se recomienda siempre estudiar para superar la meta mínima calculada.
          </p>
        </div>
      </div>
    </div>
  );
};

