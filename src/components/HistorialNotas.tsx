import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  History,
  BookOpen,
  Calculator,
  Percent,
  Target,
  Trash2,
  Share2,
  RotateCcw,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Edit3,
  PlusCircle,
  Cloud,
} from 'lucide-react';
import { SistemaEscala } from '../data/escalas';
import { HistorialCalculoItem, HistorialPromedioItem } from '../types';
import {
  subscribeMaterias,
  subscribeCalculos,
  eliminarMateriaFirestore,
  eliminarCalculoFirestore,
  limpiarTodoFirestore,
} from '../services/firebaseService';

interface HistorialNotasProps {
  sistema: SistemaEscala;
  onSetSistema?: (s: SistemaEscala) => void;
  onVolver: () => void;
  onCargarCalculo: (item: HistorialCalculoItem) => void;
  onCargarMateria: (item: HistorialPromedioItem) => void;
}

type TabFiltro = 'todos' | 'materias' | 'calculos';

export const HistorialNotas: React.FC<HistorialNotasProps> = ({
  sistema,
  onVolver,
  onCargarCalculo,
  onCargarMateria,
}) => {
  const [tab, setTab] = useState<TabFiltro>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [historialCalculos, setHistorialCalculos] = useState<HistorialCalculoItem[]>([]);
  const [historialMaterias, setHistorialMaterias] = useState<HistorialPromedioItem[]>([]);
  const [materiasExpandidas, setMateriasExpandidas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubCalculos = subscribeCalculos((data) => {
      setHistorialCalculos(data);
    });
    const unsubMaterias = subscribeMaterias((data) => {
      setHistorialMaterias(data);
    });

    return () => {
      unsubCalculos();
      unsubMaterias();
    };
  }, []);

  const toggleExpandirMateria = (id: string) => {
    setMateriasExpandidas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEliminarCalculo = (id: string) => {
    eliminarCalculoFirestore(id);
    setHistorialCalculos((prev) => prev.filter((i) => i.id !== id));
  };

  const handleEliminarMateria = (id: string) => {
    eliminarMateriaFirestore(id);
    setHistorialMaterias((prev) => prev.filter((i) => i.id !== id));
  };

  const handleLimpiarTodo = async () => {
    if (window.confirm('¿Deseas eliminar todos los registros del historial en Firebase y localmente?')) {
      setHistorialCalculos([]);
      setHistorialMaterias([]);
      await limpiarTodoFirestore();
    }
  };

  const handleCompartirMateria = async (m: HistorialPromedioItem) => {
    const texto = `Reporte de Materia: ${m.materia}\nCosta Rica (Aprobación: ${sistema.meta}%)\nTotal Acumulado: ${m.totalAcumulado}%\nExamen final (${m.examenFinal}%): ${m.notaNecesaria} pts requeridos\nEstado: ${m.estado === 'pass' ? 'Aprobado' : 'En proceso'}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Reporte de ${m.materia}`, text: texto });
      } catch (e) {
        /* cancelado */
      }
    } else {
      navigator.clipboard?.writeText(texto);
      alert('Reporte copiado al portapapeles');
    }
  };

  // Filtrado
  const q = busqueda.trim().toLowerCase();

  const materiasFiltradas = useMemo(() => {
    return historialMaterias.filter(
      (m) =>
        m.materia.toLowerCase().includes(q) ||
        m.filas.some((f) => f.nombre.toLowerCase().includes(q))
    );
  }, [historialMaterias, q]);

  const calculosFiltrados = useMemo(() => {
    return historialCalculos.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.subtexto.toLowerCase().includes(q) ||
        c.resultado.toLowerCase().includes(q)
    );
  }, [historialCalculos, q]);

  const totalItems = historialMaterias.length + historialCalculos.length;

  return (
    <div className="section-container" id="section-historial">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          className="btn-back"
          id="btn-volver-historial"
          onClick={onVolver}
          aria-label="Volver al menú principal"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al menú</span>
        </button>

        {totalItems > 0 && (
          <button
            onClick={handleLimpiarTodo}
            className="text-xs font-semibold text-rose-500 hover:text-rose-700 dark:text-rose-400 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5"
            title="Borrar todo el historial"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar todo</span>
          </button>
        )}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Historial de notas
        </h1>
      </div>

      {/* Barra de búsqueda y selector de pestañas */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            placeholder="Buscar materia o prueba (ej: fisio, parcial, quiz)..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Borrar
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl gap-1 border border-slate-200/60 dark:border-slate-800">
          <button
            onClick={() => setTab('todos')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'todos'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Todos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
              {totalItems}
            </span>
          </button>
          <button
            onClick={() => setTab('materias')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'materias'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Materias</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {historialMaterias.length}
            </span>
          </button>
          <button
            onClick={() => setTab('calculos')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              tab === 'calculos'
                ? 'bg-white dark:bg-slate-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Cálculos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
              {historialCalculos.length}
            </span>
          </button>
        </div>
      </div>

      {/* Contenido según tab */}
      {totalItems === 0 ? (
        <div className="card text-center py-12 px-6">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-3 border border-purple-100 dark:border-purple-900/50">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-800 mb-1">
            No tienes notas ni cálculos guardados aún
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Cuando calcules notas con nombre (ej. "Examen 1 de fisio") o proyectes materias en el control de promedio, se guardarán automáticamente aquí.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onVolver}
              className="btn btn-secondary text-xs px-4 py-2"
            >
              Ir a calcular notas
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECCIÓN MATERIAS */}
          {(tab === 'todos' || tab === 'materias') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Materias y Proyecciones ({materiasFiltradas.length})
                </h3>
              </div>

              {materiasFiltradas.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  {q ? 'No se encontraron materias con ese nombre.' : 'No hay materias registradas.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {materiasFiltradas.map((m) => {
                    const expandida = !!materiasExpandidas[m.id];
                    return (
                      <div
                        key={m.id}
                        className="card card-blue p-4 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="font-bold text-base text-slate-900 leading-snug">
                                {m.materia}
                              </h4>
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  m.estado === 'pass'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : m.estado === 'fail'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                }`}
                              >
                                {m.estado === 'pass'
                                  ? 'Aprobado'
                                  : `Requiere ${m.notaNecesaria} pts`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              Guardado el {m.fecha}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCompartirMateria(m)}
                              className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                              title="Compartir reporte"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onCargarMateria(m)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                              title="Editar notas o agregar examen"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar notas</span>
                            </button>
                            <button
                              onClick={() => handleEliminarMateria(m.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="Eliminar del historial"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Métricas clave */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-xs">
                          <div>
                            <span className="text-slate-400 text-[11px] block">Acumulado actual</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">
                              {m.totalAcumulado}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">Examen final ({m.examenFinal || '0'}%)</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">
                              {m.notaNecesaria} pts
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-start">
                            <span className="text-slate-400 text-[11px] block">Evaluaciones</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {m.filas.length} prueba{m.filas.length === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>

                        {/* Desglose de evaluaciones con acordeón */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => toggleExpandirMateria(m.id)}
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                            >
                              {expandida ? (
                                <>
                                  <ChevronUp className="w-3.5 h-3.5" />
                                  Ocultar evaluaciones ({m.filas.length})
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                  Ver desglose de evaluaciones ({m.filas.length})
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => onCargarMateria(m)}
                              className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                            >
                              <PlusCircle className="w-3 h-3" />
                              <span>+ Agregar siguiente examen</span>
                            </button>
                          </div>

                          {expandida && (
                            <div className="mt-2.5 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                              {m.filas.map((fila, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-white/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60"
                                >
                                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                                    {fila.nombre || `Evaluación ${idx + 1}`}
                                  </span>
                                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    {fila.valor}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN CÁLCULOS RÁPIDOS */}
          {(tab === 'todos' || tab === 'calculos') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
                  Cálculos Rápidos ({calculosFiltrados.length})
                </h3>
              </div>

              {calculosFiltrados.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  {q ? 'No se encontraron cálculos con ese término.' : 'No hay cálculos rápidos registrados.'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {calculosFiltrados.map((item) => (
                    <div
                      key={item.id}
                      className="card card-dark p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {item.nombre}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.fecha}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-lg font-black font-mono text-zinc-900">
                            {item.resultado}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onCargarCalculo(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                            title="Cargar en Calculadora rápida"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEliminarCalculo(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="Eliminar cálculo"
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
          )}
        </div>
      )}
    </div>
  );
};
