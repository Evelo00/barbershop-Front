"use client";

import { useEffect } from "react";

export default function View6() {

  useEffect(() => {
    localStorage.removeItem("clientInfo");
  }, []);

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-between p-6 bg-black">

      <div className="flex flex-col items-center justify-center flex-grow text-center pt-24">

        <svg
          className="w-28 h-28 mb-10 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" className="opacity-100 fill-white" />
          <path d="M8 12l3 3 5-5" className="text-black" strokeWidth="3" />
        </svg>

        <h1 className="text-5xl font-extrabold leading-tight mb-4">
          SU RESERVA
        </h1>
        <h1 className="text-5xl font-extrabold leading-tight mb-8">
          HA SIDO AGENDADA
        </h1>
        <h1 className="text-5xl font-extrabold leading-tight mb-12">
          CON ÉXITO
        </h1>

        <p className="text-sm text-gray-300 px-4 mt-8 max-w-xs">
          Recuerda llegar puntual para vivir la mejor experiencia en nuestra barbería.
        </p>
      </div>

      {/* Footer */}
      <div className="pb-8 text-center">
        <p className="text-xs tracking-widest font-light text-white mb-4">
          ABALVI BARBER
        </p>

        <a
          href="/"
          className="text-sm text-gray-400 hover:text-gray-200 transition"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
