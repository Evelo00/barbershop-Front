"use client";

import { useEffect } from "react";

export default function View6() {

  useEffect(() => {
    localStorage.removeItem("clientInfo");
  }, []);

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-between p-6 bg-black">

      <div className="flex flex-col items-center justify-center flex-grow text-center">
        <img src="/CHECK.svg" alt="check" className="w-28 h-28 mb-8" />

        <h2 className="text-5xl font-extrabold leading-tight">
          Tu reserva ha sido agendada con éxito
        </h2>

        <p className="text-sm text-gray-300 px-4 mt-8 max-w-xs">
          Recuerda llegar puntual para vivir la mejor experiencia en nuestra barbería.
        </p>
      </div>



      {/* Footer */}
      <div className="pb-8 text-center">
        <p className="text-xs tracking-widest font-light text-white mb-4">
          <img src="/Logo.png" alt="logo" className="w-26 h-4 mb-8" />

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
