"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";

interface Sede {
  id: string;
  nombre: string;
}

const Home = () => {
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);

  const RESERVAS_ROUTE = "/view2";

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/sedes`)
      .then((res) => res.json())
      .then((data) => setSedes(Array.isArray(data) ? data : []))
      .catch(() => setSedes([]))
      .finally(() => setLoading(false));
  }, [API_BASE_URL]);

  const handleNavigate = (sedeId: string) => {
    localStorage.setItem("sedeId", sedeId);
    router.push(RESERVAS_ROUTE);
  };

  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col items-center justify-between overflow-hidden">
      {/* CONTENIDO CENTRAL */}
      <div className="flex flex-col items-center justify-center flex-1 w-full px-6">
        <h1
          className="text-5xl sm:text-6xl font-black uppercase tracking-wider text-center mb-14"
          style={{
            fontFamily:
              "'Avenir Black', 'Avenir-Heavy', 'Avenir', sans-serif",
          }}
        >
          AGENDA
          <br />
          TU CITA
        </h1>

        <div className="flex flex-col gap-6 w-full max-w-sm">
          {loading && (
            <div className="text-center text-sm text-gray-400">
              Cargando sedes…
            </div>
          )}

          {!loading &&
            sedes.map((sede) => (
              <div key={sede.id} className="flex flex-col gap-3">
                {/* BOTÓN RESERVAS */}
                <button
                  onClick={() => handleNavigate(sede.id)}
                  className="
                    w-full
                    border border-white
                    rounded-[18px]
                    py-4
                    text-sm sm:text-base
                    font-medium
                    uppercase
                    tracking-widest
                    transition
                    hover:bg-white
                    hover:text-black
                  "
                >
                  Reservas {sede.nombre}
                </button>

                {/* BOTONES WHATSAPP + UBICACIÓN */}
                <div className="flex gap-3">
                  <a
                    href={
                      sede.nombre.toLowerCase().includes("alameda")
                        ? "https://wa.me/message/2X7HHA2HSUDLJ1"
                        : "https://wa.me/message/J56BDE533GOCC1"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      flex-1
                      flex
                      items-center
                      justify-center
                      border
                      border-white
                      rounded-[16px]
                      py-3
                      transition
                      hover:bg-white
                      hover:text-black
                    "
                  >
                    <img src="/whatsapp.svg" alt="WhatsApp" width={30} height={30} />
                  </a>

                  <a
                    href={
                      sede.nombre.toLowerCase().includes("alameda")
                        ? "https://maps.google.com?q=alamedas"
                        : "https://maps.google.com?q=recreo"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      flex-1
                      flex
                      items-center
                      justify-center
                      border
                      border-white
                      rounded-[16px]
                      py-3
                      transition
                      hover:bg-white
                      hover:text-black
                    "
                  >
                    <MapPin size={30} />
                  </a>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer className="pb-8">
        <img src="/Logo.png" alt="ABALVI BARBER" className="h-4" />
      </footer>
    </div>
  );
};

export default Home;