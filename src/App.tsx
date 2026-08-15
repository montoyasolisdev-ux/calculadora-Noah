import React, { useState, useEffect } from 'react';
import {
  Calculator,
  TrendingUp,
  History,
  ChevronRight,
  Download,
  X,
} from 'lucide-react';
import { ESCALAS_CENTROAMERICA, SistemaEscala } from './data/escalas';
import { ScreenType, MenuItemInfo, HistorialCalculoItem, HistorialPromedioItem } from './types';
import { Calculadora } from './components/Calculadora';
import { Registro } from './components/Registro';
import { HistorialNotas } from './components/HistorialNotas';

const MENU_ITEMS: MenuItemInfo[] = [
  {
    id: 'calculadora',
    title: 'Calculadora rápida',
    desc: 'Calcula notas y porcentajes obtenidos en cada prueba',
    icon: Calculator,
    gradient: 'from-zinc-900 via-neutral-900 to-black',
    borderGlow: 'hover:border-zinc-800 hover:shadow-zinc-900/10',
  },
  {
    id: 'registro',
    title: 'Control de promedio',
    desc: 'Proyecta la calificación requerida para aprobar el curso',
    icon: TrendingUp,
    gradient: 'from-blue-600 via-indigo-600 to-blue-700',
    borderGlow: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
  },
  {
    id: 'historial',
    title: 'Historial de notas',
    desc: 'Consulta todas tus materias y cálculos guardados',
    icon: History,
    gradient: 'from-purple-600 via-indigo-600 to-violet-700',
    borderGlow: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
  },
];

const YA_DESCARTADO_KEY = 'calculadoradenotas.instalarDescartado';

export function App() {
  const [pantalla, setPantalla] = useState<ScreenType>('menu');
  const [sistemaActual, setSistemaActual] = useState<SistemaEscala>(ESCALAS_CENTROAMERICA[0]);
  const [calculoSeleccionado, setCalculoSeleccionado] = useState<HistorialCalculoItem | null>(null);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<HistorialPromedioItem | null>(null);

  // Installation banner state
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOSPrompt, setIsIOSPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const yaDescartado = typeof window !== 'undefined' && localStorage.getItem(YA_DESCARTADO_KEY);
    if (yaDescartado) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
      setIsIOSPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const esIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
    const yaInstalada =
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof window !== 'undefined' && (window.navigator as any).standalone);

    if (esIOS && !yaInstalada && !yaDescartado) {
      setShowInstallBanner(true);
      setIsIOSPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismissBanner = () => {
    setShowInstallBanner(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(YA_DESCARTADO_KEY, '1');
    }
  };

  const handleInstallClick = async () => {
    setShowInstallBanner(false);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(YA_DESCARTADO_KEY, '1');
    }
  };

  return (
    <div className="app-wrapper">
      <div id="app">
        {pantalla === 'menu' && (
          <div className="home-container">
            {/* Header Hero */}
            <div className="home-header">
              <h1 className="home-title">
                <span className="title-metallic-black font-extrabold">
                  Calculadora
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  de notas
                </span>
              </h1>
            </div>

            {/* Menu Cards */}
            <div className="menu-grid" id="menu-grid">
              {MENU_ITEMS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    id={`menu-card-${item.id}`}
                    className={`menu-card ${item.borderGlow} group`}
                    onClick={() => setPantalla(item.id)}
                  >
                    <span className={`menu-icon bg-gradient-to-br ${item.gradient}`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </span>
                    <div className="flex-1 text-left min-w-0">
                      <p className="menu-card-title group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </p>
                      <p className="menu-card-desc">{item.desc}</p>
                    </div>
                    <span className="menu-card-arrow-wrap">
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {pantalla === 'calculadora' && (
          <Calculadora
            sistema={sistemaActual}
            onSetSistema={setSistemaActual}
            onVolver={() => {
              setCalculoSeleccionado(null);
              setPantalla('menu');
            }}
            itemInicial={calculoSeleccionado}
            onVerHistorial={() => setPantalla('historial')}
          />
        )}

        {pantalla === 'registro' && (
          <Registro
            sistema={sistemaActual}
            onSetSistema={setSistemaActual}
            onVolver={() => {
              setMateriaSeleccionada(null);
              setPantalla('menu');
            }}
            materiaInicial={materiaSeleccionada}
            onVerHistorial={() => setPantalla('historial')}
          />
        )}

        {pantalla === 'historial' && (
          <HistorialNotas
            sistema={sistemaActual}
            onSetSistema={setSistemaActual}
            onVolver={() => setPantalla('menu')}
            onCargarCalculo={(calc) => {
              setCalculoSeleccionado(calc);
              setPantalla('calculadora');
            }}
            onCargarMateria={(mat) => {
              setMateriaSeleccionada(mat);
              setPantalla('registro');
            }}
          />
        )}
      </div>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="install-banner">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-white" />
            </div>
            {isIOSPrompt ? (
              <p className="text-xs text-slate-300">
                Instala Calculadora de notas: toca <b>Compartir</b> y luego <b>"Agregar a inicio"</b>.
              </p>
            ) : (
              <p className="text-xs text-slate-300">
                Instala Calculadora de notas en tu dispositivo para acceso rápido sin conexión.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isIOSPrompt && (
              <button id="btn-instalar" onClick={handleInstallClick} className="btn-install">
                Instalar
              </button>
            )}
            <button className="dismiss" aria-label="Cerrar" onClick={handleDismissBanner}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
