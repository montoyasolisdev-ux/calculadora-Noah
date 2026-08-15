import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  Plus,
  Trash2,
  Share2,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Target,
  History,
  BookOpen,
  Edit3,
  Check,
  Sparkles,
  Cloud,
} from 'lucide-react';
import { SistemaEscala } from '../data/escalas';
import { NotaItem, HistorialPromedioItem } from '../types';
import {
  guardarMateriaFirestore,
  subscribeMaterias,
  eliminarMateriaFirestore,
} from '../services/firebaseService';

interface RegistroProps {
  sistema: SistemaEscala;
  onSetSistema?: (s: SistemaEscala) => void;
  onVolver: () => void;
  materiaInicial?: HistorialPromedioItem | null;
  onVerHistorial?: () => void;
}

interface ResultadoProyeccion {
  materia: string;
  total: string;
  notaNecesaria: string;
  pctFaltante: string;
  estado: 'pass' | 'fail' | 'normal';
  examenFinal: number;
  sistema: SistemaEscala;
}

export const Registro: React.FC<RegistroProps> = ({
  sistema,
  onVolver,
  materiaInicial,
  onVerHistorial,
}) => {
  const [idMateriaActual, setIdMateriaActual] = useState<string | null>(null);
  const [nombreMateria, setNombreMateria] = useState('');
  const [filas, setFilas] = useState<NotaItem[]>([{ id: 1, nombre: 'Examen 1', valor: '' }]);
  const [examenFinal, setExamenFinal] = useState('');
  const [resultado, setResultado] = useState<ResultadoProyeccion | null>(null);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

  // Historial
  const [historial, setHistorial] = useState<HistorialPromedioItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeMaterias((data) => {
      setHistorial(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (materiaInicial) {
      handleCargarMateria(materiaInicial);
    }
  }, [materiaInicial]);

  const formatearFecha = () => {
    const ahora = new Date();
    return ahora.toLocaleDateString('es-CR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const guardarOActualizarEnHistorial = (item: HistorialPromedioItem) => {
    guardarMateriaFirestore(item);
  };

  const handleEliminarItem = (id: string) => {
    eliminarMateriaFirestore(id);
    if (idMateriaActual === id) {
      handleNuevaMateria();
    }
  };

  const handleLimpiarHistorial = async () => {
    if (window.confirm('¿Deseas vaciar todo el historial de materias y promedios?')) {
      for (const item of historial) {
        await eliminarMateriaFirestore(item.id);
      }
      setHistorial([]);
      handleNuevaMateria();
    }
  };

  const handleUpdateFila = (id: number, field: 'nombre' | 'valor', val: string) => {
    setFilas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: val } : f))
    );
    setResultado(null);
  };

  const handleEliminarFila = (id: number) => {
    if (filas.length <= 1) {
      setFilas([{ id: Date.now(), nombre: 'Examen 1', valor: '' }]);
    } else {
      setFilas((prev) => prev.filter((f) => f.id !== id));
    }
    setResultado(null);
  };

  const handleAgregarFila = (nombreSugerido?: string) => {
    const num = filas.length + 1;
    const defaultName = nombreSugerido || `Examen ${num}`;
    setFilas((prev) => [...prev, { id: Date.now(), nombre: defaultName, valor: '' }]);
  };

  const handleNuevaMateria = () => {
    setIdMateriaActual(null);
    setNombreMateria('');
    setFilas([{ id: Date.now(), nombre: 'Examen 1', valor: '' }]);
    setExamenFinal('');
    setResultado(null);
    setMensajeGuardado(null);
  };

  const handleProyectar = () => {
    const finalVal = parseFloat(examenFinal);
    const finalExamenNumerico = isNaN(finalVal) || finalVal <= 0 ? 0 : finalVal;

    const total = filas.reduce((acc, f) => acc + (parseFloat(f.valor) || 0), 0);
    const pctNecesario = sistema.meta - total;
    
    let nota = 0;
    if (finalExamenNumerico > 0) {
      nota = (pctNecesario / finalExamenNumerico) * sistema.escala;
    }

    const estado: 'pass' | 'fail' | 'normal' =
      total >= sistema.meta
        ? 'pass'
        : finalExamenNumerico > 0 && nota > sistema.escala
        ? 'fail'
        : 'normal';

    const notaNecesaria = nota > 0 ? nota.toFixed(2) : '0.00';
    const pctFaltante = pctNecesario > 0 ? pctNecesario.toFixed(2) : '0.00';

    const materiaFinal = nombreMateria.trim() || 'Materia / Curso';
    const targetId = idMateriaActual || Date.now().toString();

    setIdMateriaActual(targetId);

    setResultado({
      materia: materiaFinal,
      total: total.toFixed(2),
      notaNecesaria,
      pctFaltante,
      estado,
      examenFinal: finalExamenNumerico,
      sistema,
    });

    const itemActualizado: HistorialPromedioItem = {
      id: targetId,
      materia: materiaFinal,
      fecha: formatearFecha(),
      filas: filas.map((f, idx) => ({
        nombre: f.nombre.trim() || `Evaluación ${idx + 1}`,
        valor: f.valor,
      })),
      examenFinal: examenFinal,
      totalAcumulado: total.toFixed(2),
      notaNecesaria,
      pctFaltante,
      estado,
    };

    guardarOActualizarEnHistorial(itemActualizado);

    setMensajeGuardado(
      idMateriaActual ? '✓ Notas actualizadas en el historial' : '✓ Materia guardada en el historial'
    );
    setTimeout(() => setMensajeGuardado(null), 3500);
  };

  const handleCargarMateria = (item: HistorialPromedioItem) => {
    setIdMateriaActual(item.id);
    setNombreMateria(item.materia);
    setExamenFinal(item.examenFinal || '');
    
    if (item.filas && item.filas.length > 0) {
      setFilas(
        item.filas.map((f, idx) => ({
          id: Date.now() + idx,
          nombre: f.nombre,
          valor: f.valor,
        }))
      );
    } else {
      setFilas([{ id: Date.now(), nombre: 'Examen 1', valor: '' }]);
    }

    const finalVal = parseFloat(item.examenFinal);
    setResultado({
      materia: item.materia,
      total: item.totalAcumulado,
      notaNecesaria: item.notaNecesaria,
      pctFaltante: item.pctFaltante,
      estado: item.estado,
      examenFinal: isNaN(finalVal) ? 0 : finalVal,
      sistema,
    });

    setMensajeGuardado(`Cargaste "${item.materia}". Puedes añadir o editar evaluaciones.`);
    setTimeout(() => setMensajeGuardado(null), 4000);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleCompartir = async (res?: ResultadoProyeccion) => {
    const r = res || resultado;
    if (!r) return;
    const texto = `Reporte Académico: ${r.materia}\nCalculadora de Notas (Costa Rica)\nMeta de aprobación: ${r.sistema.meta}%\nAcumulado actual: ${r.total}%\nNota requerida en examen final (${r.examenFinal}%): ${r.notaNecesaria} (equivale a ${r.pctFaltante}% restante)`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Proyección: ${r.materia}`, text: texto });
      } catch (e) {
        /* canceled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(texto);
        alert('Reporte copiado al portapapeles.');
      } catch (err) {
        alert('No se pudo copiar automáticamente.');
      }
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
            <span>Ver historial ({historial.length})</span>
          </button>
        )}
      </div>

      <div className="mb-6">
        <h1 className="screen-title">Control de promedio</h1>
      </div>

      {/* Banner de edición activa si estamos editando una materia existente */}
      {idMateriaActual ? (
        <div className="mb-4 p-3 rounded-xl bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Edit3 className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-100 truncate">
                Editando materia: {nombreMateria || 'Sin nombre'}
              </p>
              <p className="text-[11px] text-blue-600 dark:text-blue-300">
                Puedes añadir nuevos exámenes (ej. Examen 2) o corregir notas.
              </p>
            </div>
          </div>
          <button
            onClick={handleNuevaMateria}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors shrink-0"
          >
            + Nueva materia
          </button>
        </div>
      ) : historial.length > 0 ? (
        /* Acceso rápido a materias guardadas para editarlas */
        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Materias guardadas:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {historial.slice(0, 4).map((h) => (
              <button
                key={h.id}
                onClick={() => handleCargarMateria(h)}
                className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors font-medium truncate max-w-[150px]"
                title={`Cargar ${h.materia}`}
              >
                {h.materia}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card card-blue">
        <div className="card-header-badge bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <BarChart3 className="w-4 h-4" />
          <h2 className="card-title-text">
            {idMateriaActual ? 'Editar evaluaciones de la materia' : 'Mis notas del período'}
          </h2>
        </div>

        {/* Nombre de la materia */}
        <div className="field mb-4">
          <label className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              Nombre de la materia / curso
            </span>
            {idMateriaActual && (
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                Guardado en historial
              </span>
            )}
          </label>
          <input
            type="text"
            id="nombre-materia"
            placeholder="Ej: Fisiología Humana, Cálculo I, Bioquímica..."
            value={nombreMateria}
            onChange={(e) => setNombreMateria(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 mb-4">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Puntaje mínimo para aprobar (Costa Rica)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-mono font-bold text-xs">
            {sistema.meta}%
          </span>
        </div>

        {/* Lista de filas / evaluaciones */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            Evaluaciones y Exámenes ({filas.length})
          </span>
          <span className="text-[11px] text-slate-400">
            % obtenido en cada prueba
          </span>
        </div>

        <div id="filas-slot" className="space-y-2 mb-3">
          {filas.map((f, idx) => (
            <div key={f.id} className="flex items-center gap-2">
              <input
                type="text"
                className="flex-1"
                placeholder={`Evaluación ${idx + 1} (ej. Examen ${idx + 1}, Quiz 1)`}
                value={f.nombre}
                onChange={(e) => handleUpdateFila(f.id, 'nombre', e.target.value)}
              />
              <div className="w-32 relative">
                <input
                  type="number"
                  inputMode="decimal"
                  className="pr-7 text-right"
                  placeholder="% ganado"
                  value={f.valor}
                  onChange={(e) => handleUpdateFila(f.id, 'valor', e.target.value)}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
              {filas.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleEliminarFila(f.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                  title="Eliminar esta evaluación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Botones para agregar exámenes rápidamente */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            className="btn btn-ghost text-xs py-2 px-3 flex-1 sm:flex-initial"
            id="btn-agregar-fila"
            onClick={() => handleAgregarFila()}
          >
            <Plus className="w-3.5 h-3.5" />
            + Agregar otra evaluación
          </button>
          
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>Sugerencias:</span>
            <button
              type="button"
              onClick={() => handleAgregarFila(`Examen ${filas.length + 1}`)}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors"
            >
              + Examen {filas.length + 1}
            </button>
            <button
              type="button"
              onClick={() => handleAgregarFila('Quiz')}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors"
            >
              + Quiz
            </button>
            <button
              type="button"
              onClick={() => handleAgregarFila('Proyecto')}
              className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors"
            >
              + Proyecto
            </button>
          </div>
        </div>

        <div className="field">
          <label className="flex items-center justify-between">
            <span>Ponderación del examen final (%)</span>
            <span className="text-[11px] text-slate-400 font-normal">Opcional</span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            id="examen-final"
            placeholder="Ej: 30 o 40"
            value={examenFinal}
            onChange={(e) => {
              setExamenFinal(e.target.value);
              setResultado(null);
            }}
          />
        </div>

        {mensajeGuardado && (
          <div className="p-2.5 mb-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{mensajeGuardado}</span>
          </div>
        )}

        <div className="btn-row">
          <button className="btn btn-gradient-blue" id="btn-proyectar" onClick={handleProyectar}>
            <TrendingUp className="w-4 h-4" />
            {idMateriaActual ? 'Proyectar y actualizar cambios' : 'Proyectar y guardar'}
          </button>
          <button className="btn btn-secondary" id="btn-compartir" onClick={() => handleCompartir()}>
            <Share2 className="w-4 h-4" />
            Compartir
          </button>
        </div>

        {resultado && (
          <div id="resultado-slot" className="mt-5">
            <div className={`stamp-result stamp-${resultado.estado}`}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                {resultado.estado === 'pass' && (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 dark:text-emerald-300">Curso Aprobado</span>
                  </>
                )}
                {resultado.estado === 'fail' && (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-rose-700 dark:text-rose-300">Meta Alta Requerida</span>
                  </>
                )}
                {resultado.estado === 'normal' && (
                  <>
                    <Target className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-blue-700 dark:text-blue-300">Proyección Estimada</span>
                  </>
                )}
              </div>

              <div className="mb-2">
                <p className="font-bold text-base text-slate-900 dark:text-white">
                  {resultado.materia}
                </p>
              </div>

              <p className="accum text-sm text-slate-600 dark:text-slate-300">
                Porcentaje acumulado: <b className="text-slate-900 dark:text-white font-mono">{resultado.total}%</b> de {sistema.meta}%
              </p>

              {resultado.examenFinal > 0 ? (
                <>
                  <p className="needed-label text-xs font-semibold text-slate-500 uppercase tracking-wider mt-3">
                    Calificación requerida en el examen final ({resultado.examenFinal}%)
                  </p>
                  <p className="needed-value font-mono font-extrabold text-4xl my-1">
                    {resultado.notaNecesaria}
                  </p>

                  {resultado.estado !== 'pass' && (
                    <p className="needed-percent text-xs text-slate-500">
                      Equivale a conseguir un <b className="text-slate-700 dark:text-slate-200 font-mono">{resultado.pctFaltante}%</b> de la nota total del curso
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-3 p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  {resultado.estado === 'pass' ? (
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                      ¡Felicidades! Ya alcanzaste el 70% requerido para aprobar la materia.
                    </span>
                  ) : (
                    <span>
                      Te faltan <b className="font-mono font-bold text-blue-600 dark:text-blue-400">{resultado.pctFaltante}%</b> puntos para alcanzar la aprobación (70%).
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Historial de materias y proyecciones */}
      <div className="card card-blue">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Historial de materias
              </h2>
              <p className="text-xs text-slate-500">
                {historial.length === 0
                  ? 'Tus proyecciones guardadas aparecerán aquí'
                  : `${historial.length} materia${historial.length === 1 ? '' : 's'} registrada${historial.length === 1 ? '' : 's'}`}
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
            <BookOpen className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Aún no has guardado ninguna materia.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Ingresa tus evaluaciones (ej. Examen 1) y presiona "Proyectar y guardar". Más adelante podrás agregar el Examen 2.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {historial.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  idMateriaActual === item.id
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/90 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {item.materia}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.estado === 'pass'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.estado === 'fail'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {item.estado === 'pass'
                          ? 'Aprobado'
                          : `Requiere ${item.notaNecesaria} pts`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Actualizado: {item.fecha}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCargarMateria(item)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors flex items-center gap-1 text-xs font-semibold"
                      title="Editar notas de esta materia"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{idMateriaActual === item.id ? 'Editando' : 'Editar'}</span>
                    </button>
                    <button
                      onClick={() => handleEliminarItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      title="Eliminar materia del historial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-2">
                  <span>
                    Acumulado: <b className="font-mono">{item.totalAcumulado}%</b> • Final ({item.examenFinal || '0'}%): <b className="font-mono">{item.notaNecesaria}</b>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {item.filas.length} evaluación{item.filas.length === 1 ? '' : 'es'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="disclaimer">
        <div className="flex items-start gap-2.5">
          <BarChart3 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            Herramienta diseñada con la escala 0-100 de Costa Rica. Permite guardar tus materias e ir agregando exámenes parciales progresivamente.
          </p>
        </div>
      </div>
    </div>
  );
};
