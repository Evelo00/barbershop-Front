'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface ReservaData {
  nombre: string;
  correo?: string;
  whatsapp: string;
}

const STORAGE_KEY = 'abalvi_reserva_cliente';
const SEDE_KEY = 'sedeId';
const FONT_AVENIR_BLACK = "'Avenir Black', 'Avenir-Heavy', 'Avenir', sans-serif";

const View2Page: React.FC = () => {
  const router = useRouter();

  const [submissionMessage, setSubmissionMessage] = useState<string>('');
  const [formData, setFormData] = useState<ReservaData>({
    nombre: '',
    correo: '',
    whatsapp: '',
  });

  const [sedeId, setSedeId] = useState<string | null>(null);

  /* 🔐 Validar sede seleccionada */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedSede = localStorage.getItem(SEDE_KEY);

    if (!storedSede) {
      // Entró directo sin elegir sede → volver al inicio
      router.replace('/');
      return;
    }

    setSedeId(storedSede);
  }, [router]);

  /* Cargar datos del cliente */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        try {
          setFormData(JSON.parse(storedData));
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, []);

  const saveToLocalStorage = (data: ReservaData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => {
      const newData = { ...prevData, [name]: value };
      saveToLocalStorage(newData);
      return newData;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.whatsapp.trim()) {
      setSubmissionMessage(
        "Por favor, completa los campos obligatorios (Nombre y Whatsapp)."
      );
      return;
    }

    // Guardar datos finales
    saveToLocalStorage(formData);

    setSubmissionMessage("¡Datos guardados! Avanzando al siguiente paso...");

    setTimeout(() => {
      router.push('/view3');
    }, 500);
  };

  /* ⏳ Evitar render si aún no validamos sede */
  if (!sedeId) return null;

  return (
    <div className="relative min-h-screen flex flex-col text-black overflow-hidden bg-white">
      {/* Fondo */}
      <div className="absolute w-full h-1/35 bottom-0 z-0">
        <img
          src="/FACHADA.png"
          alt="Fondo de barbería moderna"
          className="w-full h-full object-cover opacity-90 grayscale blur-sm"
          onError={(e) => { e.currentTarget.src = ""; }}
        />
        <div className="absolute inset-0 bg-white opacity-10"></div>
      </div>

      <div className="relative z-10 flex-grow flex flex-col items-center justify-center pb-12 w-full">
        <div className="w-full max-w-sm sm:max-w-md px-8 sm:px-0">

          {submissionMessage && (
            <div
              className={`mb-4 p-3 rounded-xl text-sm font-semibold text-center ${
                submissionMessage.includes('¡Datos guardados!')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {submissionMessage}
            </div>
          )}

          <h1
            className="text-4xl font-black leading-tight uppercase tracking-wide mb-12 text-center text-gray-900"
            style={{ fontFamily: FONT_AVENIR_BLACK }}
          >
            AGENDA<br />TU CITA
          </h1>

          <form className="flex flex-col space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-center text-gray-700">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                className="w-full border-2 border-black rounded-full py-3 px-4"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-center text-gray-700">
                Correo (opcional)
              </label>
              <input
                type="email"
                name="correo"
                value={formData.correo}
                onChange={handleInputChange}
                className="w-full border-2 border-black rounded-full py-3 px-4"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1 text-center text-gray-700">
                Whatsapp *
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                required
                className="w-full border-2 border-black rounded-full py-3 px-4"
              />
            </div>

            <button
              type="submit"
              disabled={!formData.nombre.trim() || !formData.whatsapp.trim()}
              className="mt-16 self-center px-8 py-2 bg-black text-white tracking-widest"
              style={{ fontFamily: FONT_AVENIR_BLACK }}
            >
              Continuar
            </button>
          </form>
        </div>
      </div>

      <footer className="text-base tracking-[0.4em] uppercase text-center pb-28 bg-white/80">
        <img
          src="/Logo.png"
          alt="logo"
          className="w-40 h-auto mb-8 mx-auto filter invert"
        />
      </footer>
    </div>
  );
};

export default View2Page;
