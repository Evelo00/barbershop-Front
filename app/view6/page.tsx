"use client";

import { useEffect, useState } from "react";

export default function View6() {
  const [barbero, setBarbero] = useState("");
  const [servicios, setServicios] = useState("");
  const [hora, setHora] = useState("");
  const [dia, setDia] = useState("");

  useEffect(() => {
    // BARBERO
    const barberName = localStorage.getItem("abalvi_reserva_barbero_nombre");
    if (barberName) setBarbero(barberName);

    // SERVICIOS (desde ReservationData)
    const reservationRaw = localStorage.getItem("abalvi_reserva_servicio");
    if (reservationRaw) {
      try {
        const reservation = JSON.parse(reservationRaw);
        if (Array.isArray(reservation.servicios)) {
          setServicios(
            reservation.servicios.map((s: any) => s.name).join(", ")
          );
        }
      } catch { }
    }

    // FECHA / HORA
    const fechaHoraRaw = localStorage.getItem("abalvi_reserva_fecha_hora");
    if (fechaHoraRaw) {
      const date = new Date(fechaHoraRaw);
      if (!isNaN(date.getTime())) {
        setHora(
          date.toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );

        setDia(
          date.toLocaleDateString("es-CO", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })
        );

      }
    }
  }, []);

  const limpiarStorage = () => {
    localStorage.removeItem("abalvi_reserva_cliente");
    localStorage.removeItem("abalvi_reserva_servicio");
    localStorage.removeItem("abalvi_reserva_barbero");
    localStorage.removeItem("abalvi_reserva_barbero_nombre");
    localStorage.removeItem("abalvi_reserva_fecha_hora");
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-between p-6 bg-black">
      <div className="flex flex-col items-center justify-center flex-grow text-center">
        <img src="/CHECK.svg" alt="check" className="w-28 h-28 mb-8" />

        <p className="text-4xl sm:text-5xl font-extrabold leading-tight">
          Tu reserva
          <br />
          ha sido agendada
          <br />
          con éxito
        </p>

        {(barbero || servicios || hora) && (
          <div className="mt-8 max-w-sm">
            <p className="text-sm text-gray-300">
              Tu cita es{" "}
              <span className="font-semibold text-white">{servicios}</span>{" "}
              con{" "}
              <span className="font-semibold text-white">{barbero}</span>{" "}
              el{" "}
              <span className="font-semibold text-white capitalize">{dia}</span>{" "}
              a las{" "}
              <span className="font-semibold text-white">{hora}</span>.
            </p>

            <p className="text-xs text-gray-400 mt-2">
              Te recomendamos tomar una captura de pantalla.
            </p>
          </div>
        )}
      </div>

      <div className="pb-8 text-center">
        <img src="/Logo.png" alt="logo" className="w-28 mx-auto mb-6" />

        <a
          href="/"
          onClick={limpiarStorage}
          className="text-sm text-gray-400 hover:text-gray-200 transition"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
