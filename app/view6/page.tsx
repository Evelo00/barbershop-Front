"use client";

import { useEffect } from "react";

export default function View6() {

  useEffect(() => {
    localStorage.removeItem("abalvi_reserva_cliente");
    localStorage.removeItem("abalvi_reserva_servicio");
    localStorage.removeItem("abalvi_reserva_barbero");
    localStorage.removeItem("abalvi_reserva_barbero_nombre");
  }, []);

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-between p-6 bg-black">

      <div className="flex flex-col items-center justify-center flex-grow text-center">
        <img src="/CHECK.svg" alt="check" className="w-28 h-28 mb-8" />

        <p className="text-4xl sm:text-5xl font-extrabold leading-tight">
          Tu reserva<br/>ha sido agendada<br/>con éxito
        </p>

        <p className="text-sm text-gray-300 px-4 mt-8 max-w-xs">
          Recuerda llegar puntual para vivir la mejor experiencia en nuestra barbería.
        </p>
      </div>

      <div className="pb-8 text-center">
        <img src="/Logo.png" alt="logo" className="w-28 mx-auto mb-6" />

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
