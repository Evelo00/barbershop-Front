'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Barber {
    id: string;
    nombre: string;
    avatar?: string;
}

interface Service {
    id: string;
    name: string;
    price: number;
    duration: number;
}

const customColors = {
    'barber-dark': '#2A2A2A',
    'barber-black': '#1c1c1c',
    'barber-highlight': '#F5F5F5',
};

const View4Page: React.FC = () => {
    const router = useRouter();
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [service, setService] = useState<Service | null>(null);
    const [loadingBarbers, setLoadingBarbers] = useState(true);

    useEffect(() => {
        const storedService = localStorage.getItem('abalvi_reserva_servicio');
        if (storedService) setService(JSON.parse(storedService));
    }, []);

    useEffect(() => {
        const fetchBarbers = async () => {
            setLoadingBarbers(true);
            try {
                const res = await fetch(`${API_BASE_URL}/api/users/public/barbers`);
                if (!res.ok) throw new Error(`Error ${res.status}`);
                const data = await res.json();
                setBarbers(data);
            } catch (error) {
                console.error('Error fetching barbers:', error);
            } finally {
                setLoadingBarbers(false);
            }
        };
        fetchBarbers();
    }, []);

    const showMessage = (text: string) => {
        setMessage(text);
        setTimeout(() => setMessage(null), 2500);
    };

    const handleSelectBarber = async (barberId: string, barberName: string) => {
        if (isLoading) return;

        setIsLoading(true);
        setSelectedBarber(barberId);
        showMessage(`Intentando confirmar selección con ${barberName}...`);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            showMessage(`¡Barbero ${barberName} confirmado!`);

            localStorage.setItem("abalvi_reserva_barbero", barberId);
            localStorage.setItem("abalvi_reserva_barbero_nombre", barberName);

            setTimeout(() => router.push('/view5'), 500);
        } catch (error) {
            console.error(error);
            showMessage('Error al confirmar el barbero.');
            setSelectedBarber(null);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="w-full min-h-screen flex justify-center items-stretch bg-gray-100 sm:p-8">
            <div className="w-full max-w-sm sm:max-w-xl md:max-w-2xl shadow-2xl relative bg-white min-h-screen sm:min-h-[90vh] sm:rounded-xl">
                
                <div
                    className="p-6 pb-20 rounded-b-[40px] text-center text-white sm:rounded-t-xl"
                    style={{ backgroundColor: customColors['barber-dark'] }}
                >
                    <p className="text-xs tracking-widest font-light mb-4 text-gray-400">ABALVI BARBER</p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-none">
                        ELIGE A TU BARBERO
                    </h2>
                    {service && (
                        <p className="mt-4 text-sm font-semibold text-gray-200">
                            Servicio: {service.name} - ${service.price.toLocaleString('es-CO')}
                        </p>
                    )}
                </div>

                <div className="relative -top-12 px-6 pb-6">
                    {loadingBarbers ? (
                        <p className="p-8 text-center flex items-center justify-center text-gray-700 bg-white rounded-lg shadow-md">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando barberos...
                        </p>
                    ) : barbers.length === 0 ? (
                        <p className="p-8 text-center text-gray-700 bg-white rounded-lg shadow-md">
                            No se encontraron barberos.
                        </p>
                    ) : (
                        <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 ${isLoading ? 'pointer-events-none opacity-60' : ''}`}>
                            {barbers.map(barber => (
                                <div
                                    key={barber.id}
                                    onClick={() => handleSelectBarber(barber.id, barber.nombre)}
                                    className={`text-center cursor-pointer p-2 transition duration-150 rounded-lg border-2 ${
                                        selectedBarber === barber.id 
                                            ? 'border-barber-black bg-gray-100 scale-105 shadow-md' 
                                            : 'border-white hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                    style={{ borderColor: selectedBarber === barber.id ? customColors['barber-black'] : 'white' }}
                                >
                                    {/* Contenedor de Imagen */}
                                    <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300">
                                        {barber.avatar ? (
                                            <img
                                                src={barber.avatar}
                                                alt={barber.nombre}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <svg className="w-1/2 h-1/2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                                            </svg>
                                        )}
                                    </div>
                                    <p className="text-xs text-barber-black mt-1 uppercase font-semibold">{barber.nombre}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 pt-0 text-center">
                    <button
                        onClick={() => router.push('/view3')}
                        disabled={isLoading}
                        className={`flex items-center justify-center mx-auto text-sm text-gray-500 transition ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-700'}`}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver a Servicios
                    </button>
                </div>
            </div>
            
            {message && (
                <div 
                    className="fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-white shadow-xl z-50 transition duration-300"
                    style={{ backgroundColor: customColors['barber-dark'] }}
                >
                    {message}
                </div>
            )}
        </div>
    );
};

export default View4Page;