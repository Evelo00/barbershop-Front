"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Barber {
  id: string;
  nombre: string;
  avatar?: string;
}

interface SelectedService {
  id: string;
  name: string;
  price: number;
  duracionMinutos: number;
}

interface ReservationData {
  servicios: SelectedService[];
  duracionTotal: number;
  precioTotal: number;
}

const customColors = {
  "barber-dark": "#2A2A2A",
};

const View4Page: React.FC = () => {
  const router = useRouter();

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [reservation, setReservation] = useState<ReservationData | null>(null);

  // Cargar servicios seleccionados desde View3
  useEffect(() => {
    const stored = localStorage.getItem("abalvi_reserva_servicio");
    if (stored) setReservation(JSON.parse(stored));
  }, []);

  // Traer barberos del backend
  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/public/barbers`);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setBarbers(data);
      } catch (error) {
        console.error("❌ Error fetching barbers:", error);
      } finally {
        setLoadingBarbers(false);
      }
    };

    fetchBarbers();
  }, []);

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 1800);
  };

  // redirecciona a /view5
  const handleSelectBarber = (barberId: string, barberName: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setSelectedBarber(barberId);

    localStorage.setItem("abalvi_reserva_barbero", barberId);
    localStorage.setItem("abalvi_reserva_barbero_nombre", barberName);

    showMessage(`✔ Barbero ${barberName} seleccionado`);

    setTimeout(() => {
      router.push("/view5");
    }, 500);
  };

  return (
    <div className="w-full min-h-screen flex justify-center items-stretch bg-gray-100 sm:p-8">
      <div className="w-full max-w-sm sm:max-w-xl md:max-w-2xl shadow-2xl relative bg-white min-h-screen sm:min-h-[90vh] sm:rounded-xl">

        <div
          className="p-6 pb-20 text-center text-white rounded-b-[40px]"
          style={{ backgroundColor: customColors["barber-dark"] }}
        >
          <p className="text-xs tracking-widest text-gray-400">ABALVI BARBER</p>
          <h2 className="text-3xl font-extrabold mt-3">ELIGE A TU BARBERO</h2>

          {reservation && (
            <div className="mt-4 text-sm font-semibold text-gray-200">
              {reservation.servicios.length === 1 ? (
                <p>
                  {reservation.servicios[0].name} — $
                  {reservation.servicios[0].price.toLocaleString("es-CO")}
                </p>
              ) : (
                <div>
                  <p className="uppercase mb-1">Servicios seleccionados:</p>

                  {/* Lista */}
                  {reservation.servicios.map((s) => (
                    <p key={s.id} className="text-gray-300 text-xs">
                      • {s.name} — ${s.price.toLocaleString("es-CO")}
                    </p>
                  ))}

                  {/* Totales */}
                  <p className="mt-2 text-gray-100 text-sm font-bold">
                    TOTAL: ${reservation.precioTotal.toLocaleString("es-CO")}
                  </p>
                  <p className="text-gray-300 text-xs">
                    Duración total: {reservation.duracionTotal} min
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative -top-12 px-6 pb-6">
          {loadingBarbers ? (
            <div className="p-8 text-center bg-white rounded-lg shadow-md">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Cargando barberos...
            </div>
          ) : barbers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg shadow-md">
              ❌ No hay barberos disponibles
            </div>
          ) : (
            <div
              className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 ${
                isLoading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {barbers.map((barber) => (
                <div
                  key={barber.id}
                  onClick={() => handleSelectBarber(barber.id, barber.nombre)}
                  className={`p-2 text-center rounded-lg cursor-pointer transition-all border-2 ${
                    selectedBarber === barber.id
                      ? "bg-gray-200 border-black scale-105"
                      : "bg-white border-transparent hover:border-gray-300"
                  }`}
                >
                  <div className="w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    {barber.avatar ? (
                      <img
                        src={barber.avatar}
                        className="w-full h-full object-cover"
                        alt={barber.nombre}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <span>Sin foto</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-semibold mt-1 uppercase">
                    {barber.nombre}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="text-center p-4">
          <button
            onClick={() => router.push("/view3")}
            className="flex items-center justify-center text-gray-500 hover:text-black mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </button>
        </div>
      </div>

      {/* MENSAJE POPUP */}
      {message && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-xl">
          {message}
        </div>
      )}
    </div>
  );
};

export default View4Page;