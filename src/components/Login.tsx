import React, { useState } from 'react';
import { setNombreUsuario } from '../lib/firebase';

interface LoginProps {
  onLogin: (nombre: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [nombre, setNombre] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = nombre.trim();
    if (!limpio) return;
    setNombreUsuario(limpio);
    onLogin(limpio);
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">
          <span className="title-metallic-black font-extrabold">¿Cómo te</span>
          <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            llamas?
          </span>
        </h1>
      </div>
      <form onSubmit={handleSubmit} className="card card-blue">
        <div className="field">
          <label htmlFor="nombre">Tu nombre</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Noah"
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-gradient-blue">
          Entrar
        </button>
      </form>
    </div>
  );
};
