'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type ServiceCategory = 'CORTES' | 'BARBA' | 'COMBOS' | 'OTROS';

interface Service {
    id: string;
    nombre: string;
    precio: number;
    duracionMinutos: number;
    categoria: ServiceCategory;
}

const formatDuration = (minutos: number): string => `${minutos} min`;

const determineCategory = (nombre: string): Service['categoria'] => {
    const name = nombre.toUpperCase();
    if (name.includes('BARBA') && name.includes('+')) return 'COMBOS';
    if (name.includes('BARBA')) return 'BARBA';
    if (name.includes('+')) return 'COMBOS';
    if (name.includes('CERA') || name.includes('TINTE') || name.includes('CEJAS')) return 'OTROS';
    return 'CORTES';
}

const View3Page: React.FC = () => {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [activeCategory, setActiveCategory] = useState<ServiceCategory>('CORTES');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            setError(null);
            if (!API_BASE_URL || API_BASE_URL.includes('your-backend-api.com')) {
                setError("ADVERTENCIA: API_BASE_URL no configurada.");
                setLoading(false);
                return;
            }
            try {
                const serviceRes = await fetch(`${API_BASE_URL}/api/services`);
                if (!serviceRes.ok) throw new Error(`Error ${serviceRes.status}`);
                const servicesData = await serviceRes.json();
                const mappedServices: Service[] = servicesData.map((s: any) => ({
                    id: s.id || s._id,
                    nombre: s.nombre || s.name || 'Servicio sin nombre',
                    precio: s.precio || s.price || 0,
                    duracionMinutos: s.duracionMinutos || s.duration_minutes || 30,
                    categoria: determineCategory(s.nombre || s.name || 'Corte') as ServiceCategory
                }));
                setServices(mappedServices);
            } catch (err) {
                console.error(err);
                setError((err as Error).message);
                setServices([]);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    const handleServiceSelect = (service: Service) => setSelectedService(service);

    const handleContinue = () => {
        if (!selectedService) return;
        localStorage.setItem('abalvi_reserva_servicio', JSON.stringify({
            id: selectedService.id,
            name: selectedService.nombre,
            price: selectedService.precio,
            duration: selectedService.duracionMinutos
        }));
        router.push('/view4');
    };

    const filteredServices = services.filter(s => s.categoria === activeCategory);
    const categories: ServiceCategory[] = ['CORTES', 'BARBA', 'COMBOS', 'OTROS'];

    const FONT_AVENIR = "'Avenir', sans-serif";
    const FONT_AVENIR_BLACK = "'Avenir Black', 'Avenir-Heavy', 'Avenir', sans-serif";

    return (
        <div className="min-h-screen bg-white text-black pb-20">

            <header className="top-0 left-0 right-0 z-20 bg-black py-4 shadow-lg text-center">
                <p className="text-sm uppercase tracking-widest text-white" style={{ fontFamily: FONT_AVENIR }}>
                    ABALVI BARBER
                </p>
                {/* Foto / Pauta dentro del header */}
                <div className="mt-4 mb-2 bg-white rounded-xl shadow-md py-6 px-4 mx-4">
                    <p className="text-lg font-bold uppercase tracking-widest text-black" style={{ fontFamily: FONT_AVENIR_BLACK }}>
                        ESPACIO PARA<br />FOTO O PAUTA
                    </p>
                </div>
            </header>
            <div className="mx-auto w-full max-w-md sm:max-w-lg">

                <div className="flex justify-between items-center py-3 px-4 bg-white border mt-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`text-xs font-bold uppercase tracking-wider transition-all duration-200 rounded-md px-3 py-1
        ${activeCategory === cat
                                    ? 'bg-black text-white'   // botón seleccionado: fondo negro, letras blancas
                                    : 'bg-white text-black hover:bg-black/10 hover:text-black' // no seleccionado
                                }`}
                            style={{ fontFamily: FONT_AVENIR_BLACK }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Lista de servicios */}
                <div className="bg-white shadow-xl pt-2 pb-20 rounded-b-xl min-h-[300px] mt-2">
                    {error ? (
                        <div className="p-4 text-center text-red-600 bg-red-100 border border-red-400 rounded-lg mx-4 mt-4">
                            Error: {error}
                        </div>
                    ) : loading ? (
                        <p className="p-4 text-center text-gray-700 flex justify-center items-center">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando servicios...
                        </p>
                    ) : filteredServices.length === 0 ? (
                        <p className="p-4 text-center text-gray-700">No hay servicios en esta categoría.</p>
                    ) : (
                        filteredServices.map(service => (
                            <div
                                key={service.id}
                                onClick={() => handleServiceSelect(service)}
                                className={`flex justify-between items-center p-4 cursor-pointer transition-all duration-150 
      border border-black rounded-xl mb-2
      ${selectedService?.id === service.id ? 'bg-black/10' : 'hover:bg-gray-100'}`}
                            >
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold uppercase" style={{ fontFamily: FONT_AVENIR_BLACK }}>
                                        {service.nombre}
                                    </span>
                                    <span className="text-xs text-gray-600" style={{ fontFamily: FONT_AVENIR }}>
                                        Duración: {formatDuration(service.duracionMinutos)}
                                    </span>
                                </div>
                                <div className="bg-black text-white rounded-full py-2 px-4 shadow-md text-center min-w-[80px]">
                                    <span className="font-bold" style={{ fontFamily: FONT_AVENIR_BLACK }}>
                                        ${service.precio.toLocaleString('es-CO')}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div
                className={`fixed bottom-0 left-0 right-0 bg-white/95 p-4 shadow-2xl transition-all duration-300 
    ${selectedService ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}
            >
                <button
                    onClick={handleContinue}
                    className="w-full bg-black text-white py-3 rounded-xl uppercase text-lg font-bold tracking-widest transition-colors duration-300 hover:bg-gray-800"
                    style={{ fontFamily: FONT_AVENIR_BLACK }}
                >
                    Continuar
                </button>
            </div>
        </div>
    );
};

export default View3Page;
