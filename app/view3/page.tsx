'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
};

const View3Page: React.FC = () => {
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [activeCategory, setActiveCategory] = useState<ServiceCategory>('CORTES');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch(`${API_BASE_URL}/api/services`);
                if (!res.ok) throw new Error(`Error ${res.status}`);

                const data = await res.json();

                const mapped: Service[] = data.map((s: any) => ({
                    id: s.id,
                    nombre: s.nombre,
                    precio: s.precio,
                    duracionMinutos: s.duracion ?? s.duracionMinutos ?? 30,
                    categoria: determineCategory(s.nombre)
                }));

                // 🟢 ORDENAR DE MAYOR A MENOR PRECIO
                mapped.sort((a, b) => b.precio - a.precio);

                setServices(mapped);
            } catch (err) {
                console.error(err);
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, []);

    // 🟢 seleccionar o des-seleccionar servicio
    const toggleService = (service: Service) => {
        setSelectedServices(prev =>
            prev.some(s => s.id === service.id)
                ? prev.filter(s => s.id !== service.id)
                : [...prev, service]
        );
    };

    // 🟢 continuar → guardar servicios en localStorage
    const handleContinue = () => {
        if (selectedServices.length === 0) return;

        const duracionTotal = selectedServices.reduce((sum, s) => sum + s.duracionMinutos, 0);
        const precioTotal = selectedServices.reduce((sum, s) => sum + s.precio, 0);

        const payload = {
            servicios: selectedServices.map(s => ({
                id: s.id,
                name: s.nombre,
                price: s.precio,
                duracionMinutos: s.duracionMinutos
            })),
            duracionTotal,
            precioTotal
        };

        localStorage.setItem('abalvi_reserva_servicio', JSON.stringify(payload));
        router.push('/view4');
    };

    const filteredServices = services
        .filter(s => s.categoria === activeCategory)
        .filter(s => s.id !== "00000000-0000-0000-0000-000000000999");

    const categories: ServiceCategory[] = ['CORTES', 'BARBA', 'COMBOS', 'OTROS'];

    const FONT_AVENIR = "'Avenir', sans-serif";
    const FONT_AVENIR_BLACK = "'Avenir Black', 'Avenir-Heavy', 'Avenir', sans-serif";

    return (
        <div className="min-h-screen bg-white text-black pb-20">

            {/* HEADER */}
            <header className="top-0 left-0 right-0 z-20 bg-black py-4 shadow-lg text-center">
                <p className="text-sm uppercase tracking-widest text-white" style={{ fontFamily: FONT_AVENIR }}>
                    ABALVI BARBER
                </p>
                <div className="mt-4 mb-2 bg-white rounded-xl shadow-md py-6 px-4 mx-4">
                    <p className="text-lg font-bold uppercase tracking-widest text-black" style={{ fontFamily: FONT_AVENIR_BLACK }}>
                        ESPACIO PARA<br />FOTO O PAUTA
                    </p>
                </div>
            </header>

            <div className="mx-auto w-full max-w-md sm:max-w-lg">

                {/* CATEGORÍAS */}
                <div className="flex justify-between items-center py-3 px-4 bg-white border mt-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`text-xs font-bold uppercase tracking-wider rounded-md px-3 py-1 transition-all
                                ${activeCategory === cat
                                    ? 'bg-black text-white'
                                    : 'bg-white text-black hover:bg-black/10'
                                }`}
                            style={{ fontFamily: FONT_AVENIR_BLACK }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* LISTA DE SERVICIOS */}
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
                        filteredServices.map(service => {
                            const selected = selectedServices.some(s => s.id === service.id);
                            return (
                                <div
                                    key={service.id}
                                    onClick={() => toggleService(service)}
                                    className={`flex justify-between items-center p-4 cursor-pointer border border-black rounded-xl mb-2 transition-all
                                        ${selected ? 'bg-black/10' : 'hover:bg-gray-100'}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-lg font-bold uppercase" style={{ fontFamily: FONT_AVENIR_BLACK }}>
                                            {service.nombre}
                                        </span>
                                        <span className="text-xs text-gray-600" style={{ fontFamily: FONT_AVENIR }}>
                                            Duración: {formatDuration(service.duracionMinutos)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Checkbox de selección */}
                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            readOnly
                                            className="w-5 h-5 accent-black cursor-pointer"
                                        />

                                        <div className="bg-black text-white rounded-full py-2 px-4 shadow-md text-center min-w-[80px]">
                                            <span className="font-bold" style={{ fontFamily: FONT_AVENIR_BLACK }}>
                                                ${service.precio.toLocaleString('es-CO')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* BOTÓN CONTINUAR */}
            <div
                className={`fixed bottom-0 left-0 right-0 bg-white/95 p-4 shadow-2xl transition-all duration-300 
                ${selectedServices.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}
            >
                <button
                    onClick={handleContinue}
                    className="w-full bg-black text-white py-3 rounded-xl uppercase text-lg font-bold tracking-widest hover:bg-gray-800 transition"
                    style={{ fontFamily: FONT_AVENIR_BLACK }}
                >
                    Continuar
                </button>
            </div>
        </div>
    );
};

export default View3Page;
