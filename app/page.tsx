'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface HomeProps {
  whatsappLink?: string;
  brandName?: string;
}

const Home: React.FC<HomeProps> = ({
  whatsappLink = 'https://w.app/abalvi',
  brandName = 'ABALVI BARBER',
}) => {
  const router = useRouter();

  const RESERVAS_ROUTE = '/view2'; // Ruta a tu view2

  const handleNavigate = () => {
    router.push(RESERVAS_ROUTE);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white justify-center items-center p-16 sm:p-10 lg:p-16">
      <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto">
        <h1 
          className="text-5xl sm:text-7xl lg:text-8xl font-black leading-tight uppercase tracking-wider mb-16 lg:mb-20 text-center"
          style={{ fontFamily: "'Avenir Black', 'Avenir-Heavy', 'Avenir', sans-serif" }}
        >
          AGENDA<br />
          TU CITA
        </h1>

        <div className="flex flex-col space-y-4 w-full max-w-sm md:max-w-md">
          {/* Botón que usa useRouter para navegar suavemente */}
          <button
            onClick={handleNavigate}
            className="w-full text-center flex items-center justify-center border border-white bg-black rounded-[18px] py-3 px-6 text-sm md:text-base lg:text-lg font-medium uppercase tracking-widest transition-colors duration-300 hover:bg-white hover:text-black"
          >
            Link reservas Alamedas
          </button>

          {/* Botón externo de Whatsapp */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center flex items-center justify-center border border-white bg-black rounded-[18px] py-3 px-6 text-sm md:text-base lg:text-lg font-medium uppercase tracking-widest transition-colors duration-300 hover:bg-white hover:text-black"
          >
            Whatsapp Alamedas
          </a>
        </div>
      </div>
      
      <footer 
        className="fixed bottom-10 w-full text-sm lg:text-lg tracking-[0.3em] uppercase text-center"
        style={{ fontFamily: "'Avenir', sans-serif" }}
      >
        {brandName}
      </footer>
    </div>
  );
};

export default Home;
