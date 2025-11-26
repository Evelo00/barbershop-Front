'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface ReservaData {
    nombre: string;
    correo?: string;
    whatsapp: string;
}

const STORAGE_KEY = 'abalvi_reserva_cliente';
const FONT_AVENIR_BLACK = "'Avenir Black', 'Avenir-Heavy', 'Avenir', sans-serif";

const View2Page: React.FC = () => {
    const router = useRouter();
    const [submissionMessage, setSubmissionMessage] = useState<string>('');
    const [formData, setFormData] = useState<ReservaData>({
        nombre: '',
        correo: '',
        whatsapp: '',
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                setFormData(JSON.parse(storedData));
            }
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevData => {
            const newData = { ...prevData, [name]: value };
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
            }
            return newData;
        });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!formData.nombre.trim() || !formData.whatsapp.trim()) {
            setSubmissionMessage("Por favor, completa los campos obligatorios (Nombre y Whatsapp).");
            return;
        }

        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        }

        setSubmissionMessage("¡Datos guardados! Avanzando al siguiente paso...");

        setTimeout(() => {
            router.push('/view3');
        }, 500);
    };

    return (
        <div className="relative min-h-screen flex flex-col text-black overflow-hidden bg-white">

            {/* Fondo */}
            <div className="absolute w-full h-1/35 bottom-0 z-0">
                <img
                    src="https://tse1.mm.bing.net/th/id/OIP.Kl_r8lc2LQuHqlwbfmP7jwHaE8?w=1024&h=683&rs=1&pid=ImgDetMain&o=7&rm=3"
                    alt="Fondo de barbería moderna"
                    className="w-full h-full object-cover opacity-70 grayscale blur-sm"
                    onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/1024x683/000000/FFFFFF?text=Abalvi+Barber";
                    }}
                />
                <div className="absolute inset-0 bg-white opacity-20"></div>
            </div>

            {/* Contenido principal */}
            <div className="relative z-10 flex-grow flex flex-col items-center justify-center pb-12 w-full">
                <div className="w-full max-w-sm sm:max-w-md px-8 sm:px-0">

                    {submissionMessage && (
                        <div className={`mb-4 p-3 rounded-xl text-sm font-semibold text-center ${submissionMessage.includes('¡Datos guardados!') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {submissionMessage}
                        </div>
                    )}

                    <h1 className="text-4xl font-black leading-tight uppercase tracking-wide mb-12 text-center text-gray-900" style={{ fontFamily: FONT_AVENIR_BLACK }}>
                        AGENDA<br />TU CITA
                    </h1>

                    <form className="flex flex-col space-y-6" onSubmit={handleSubmit}>

                        <div className="flex flex-col">
                            <label htmlFor="nombre" className="text-sm font-medium mb-1 text-center text-gray-700">Nombre *</label>
                            <input
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                required
                                className="w-full border-2 border-black rounded-full py-3 px-4 focus:outline-none focus:ring-1 focus:ring-black bg-white/70 transition-all duration-200"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="correo" className="text-sm font-medium mb-1 text-center text-gray-700">Correo (opcional)</label>
                            <input
                                type="email"
                                id="correo"
                                name="correo"
                                value={formData.correo}
                                onChange={handleInputChange}
                                className="w-full border-2 border-black rounded-full py-3 px-4 focus:outline-none focus:ring-1 focus:ring-black bg-white/70 transition-all duration-200"
                            />
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="whatsapp" className="text-sm font-medium mb-1 text-center text-gray-700">Whatsapp *</label>
                            <input
                                type="tel"
                                id="whatsapp"
                                name="whatsapp"
                                value={formData.whatsapp}
                                onChange={handleInputChange}
                                required
                                className="w-full border-2 border-black rounded-full py-3 px-4 focus:outline-none focus:ring-1 focus:ring-black bg-white/70 transition-all duration-200"
                            />
                        </div>

                        <button
                            type="submit"
                            className="mt-16 self-center inline-flex items-center justify-center px-6 py-2 sm:px-8 bg-black text-gray-100 text-lg font-medium tracking-widest transition-colors duration-300 hover:bg-gray-800 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ fontFamily: FONT_AVENIR_BLACK }}
                            disabled={!formData.nombre.trim() || !formData.whatsapp.trim()}
                        >
                            Continuar
                        </button>

                    </form>
                </div>
            </div>

            {/* Footer */}
            <footer className="text-base tracking-[0.4em] uppercase text-center text-black w-full flex justify-center items-center pb-28 bg-white/80" style={{ fontFamily: "'Avenir', sans-serif" }}>
                <span className="font-bold mr-2">ABALVI</span>
                <span className="font-normal">BARBER</span>
            </footer>

        </div>
    );
};

export default View2Page;
