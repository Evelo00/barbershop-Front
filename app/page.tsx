"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface HomeProps {
  whatsappLink?: string;
  whatsappLinkRecreo?: string;
}

interface Sede {
  id: string;
  nombre: string;
}

const Home: React.FC<HomeProps> = ({
  whatsappLink = "https://wa.me/message/2X7HHA2HSUDLJ1",
  whatsappLinkRecreo = "https://wa.me/message/J56BDE533GOCC1",
}) => {
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);

  const RESERVAS_ROUTE = "/view2";

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/sedes`)
      .then((res) => res.json())
      .then((data) => {
        setSedes(Array.isArray(data) ? data : []);
      })
      .catch(() => setSedes([]))
      .finally(() => setLoading(false));
  }, [API_BASE_URL]);

  const handleNavigate = (sedeId: string) => {
    localStorage.setItem("sedeId", sedeId);
    router.push(RESERVAS_ROUTE);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white justify-center items-center p-16 sm:p-10 lg:p-16 pb-32 sm:pb-32 lg:pb-36">
      <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto">
        <h1
          className="text-5xl sm:text-5xl lg:text-6xl font-black leading-tight uppercase tracking-wider mb-16 lg:mb-20 text-center"
          style={{
            fontFamily:
              "'Avenir Black', 'Avenir-Heavy', 'Avenir', sans-serif",
          }}
        >
          AGENDA
          <br />
          TU CITA
        </h1>

        <div className="flex flex-col space-y-4 w-full max-w-sm md:max-w-md">
          {loading && (
            <div className="text-center text-sm text-gray-400">
              Cargando sedes…
            </div>
          )}

          {!loading &&
            sedes.map((sede) => (
              <button
                key={sede.id}
                onClick={() => handleNavigate(sede.id)}
                className="w-full flex items-center justify-center border border-white bg-black rounded-[18px] py-3 px-6 text-sm md:text-base lg:text-lg font-medium uppercase tracking-widest transition-colors duration-300 hover:bg-white hover:text-black"
              >
                Reservas · {sede.nombre}
              </button>
            ))}

          {/* WhatsApp Alamedas */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex text-center items-center justify-center border border-white bg-black rounded-[18px] py-3 px-6 text-sm md:text-base lg:text-lg font-medium uppercase tracking-widest transition-colors duration-300 hover:bg-white hover:text-black"
          >
            WhatsApp Sede Alamedas
          </a>

          {/* WhatsApp Recreo */}
          <a
            href={whatsappLinkRecreo}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex text-center items-center justify-center border border-white bg-black rounded-[18px] py-3 px-6 text-sm md:text-base lg:text-lg font-medium uppercase tracking-widest transition-colors duration-300 hover:bg-white hover:text-black"
          >
            WhatsApp Sede Recreo
          </a>
        </div>
      </div>

      <footer className="fixed bottom-10 w-full text-sm lg:text-lg tracking-[0.3em] uppercase flex justify-center items-center">
        <img src="/Logo.png" alt="logo" className="w-26 h-4" />
      </footer>
    </div>
  );
};

export default Home;
