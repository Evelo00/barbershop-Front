import React, { useState, useEffect } from 'react';
import { Scissors, AlertTriangle, Loader2, ListChecks } from 'lucide-react';

// URL Base de tu API. Si estás en Next.js y el back está en el mismo proyecto, 
// puedes dejarlo vacío o usar una variable de entorno.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Funciones auxiliares para formatear los datos que vienen del backend
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
};

const formatDuration = (minutes: any) => `${minutes} min`;

// Lógica para asignar categoría basada en el nombre (ya que no viene en la BD)
const determineCategory = (nombre: string) => {
    const name = nombre ? nombre.toUpperCase() : '';
    if (name.includes('BARBA') && name.includes('+')) return 'COMBOS';
    if (name.includes('BARBA')) return 'BARBA';
    if (name.includes('+')) return 'COMBOS';
    if (name.includes('CERA') || name.includes('TINTE') || name.includes('CEJAS') || name.includes('FACIAL')) return 'OTROS';
    return 'CORTES';
};

// Define a typed shape for the services shown in the UI
type ServiceView = {
    id: string | number;
    name: string;
    price: string;
    duration: string;
    category: string;
};

export default function ServiceListApp() {
    const [services, setServices] = useState<ServiceView[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cargar datos desde el Backend
    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            setError(null);
            try {
                // Llamada al endpoint GET /api/services definido en tu router
                const response = await fetch(`${API_BASE_URL}/api/services`);

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: No se pudieron obtener los servicios.`);
                }

                const data = await response.json();

                // Mapear los datos crudos de la BD (ServiceAttributes) al formato de la vista
                const mappedServices = Array.isArray(data) ? data.map(service => ({
                    id: service.id,
                    name: service.nombre,
                    price: formatPrice(service.precio),
                    duration: formatDuration(service.duracion),
                    category: determineCategory(service.nombre)
                })) : [];

                setServices(mappedServices);
            } catch (err) {
                console.error("Error fetching services:", err);
            } finally {
                setLoading(false);
            }
        };

        // Ejecutar fetch cuando el componente se monta
        fetchServices();
    }, []);

    // Función para agrupar servicios por categoría para la vista
    const groupedServices = services.reduce<Record<string, ServiceView[]>>((acc, service) => {
        const cat = service.category;
        if (!acc[cat]) {
            acc[cat] = [];
        }
        acc[cat].push(service);
        return acc;
    }, {});

    // Orden de categorías preferido
    const categoryOrder = ['CORTES', 'BARBA', 'COMBOS', 'OTROS'];

    // --- Renderizado de estados ---

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="mt-4 text-lg font-medium text-indigo-700">Cargando servicios desde la base de datos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center border-t-4 border-red-500">
                    <AlertTriangle className="w-10 h-10 mx-auto text-red-500" />
                    <h2 className="mt-4 text-xl font-bold text-red-700">Error de Conexión</h2>
                    <p className="mt-2 text-sm text-gray-600">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (services.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
                <div className="text-center">
                    <Scissors className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <h3 className="text-lg font-medium text-gray-900">No hay servicios disponibles</h3>
                    <p className="text-gray-500">Parece que aún no se han creado servicios en la base de datos.</p>
                </div>
            </div>
        );
    }

    // --- Renderizado de servicios ---

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
                    <Scissors className="inline-block w-8 h-8 mr-2 text-indigo-600" />
                    ABALVI BARBER
                </h1>
                <p className="text-lg text-gray-500 mt-2">Nuestros Servicios y Combos</p>
            </header>

            <div className="max-w-4xl mx-auto space-y-8">
                {categoryOrder.map(category => {
                    const items = groupedServices[category];
                    if (!items || items.length === 0) return null;

                    return (
                        <section key={category} className="bg-white p-6 rounded-2xl shadow-xl transition hover:shadow-2xl">
                            <h2 className="text-3xl font-bold mb-6 text-indigo-700 border-b-2 pb-2 flex items-center">
                                <ListChecks className="w-6 h-6 mr-2" />
                                {category}
                            </h2>
                            <div className="grid gap-6 md:grid-cols-2">
                                {items.map(service => (
                                    <div key={service.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-400 transition duration-300">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-semibold text-gray-800">{service.name}</h3>
                                            <span className="text-xl font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full whitespace-nowrap">
                                                {service.price}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex justify-between items-center text-gray-500 text-sm">
                                            <p>
                                                <span className="font-medium text-gray-700">Duración:</span> {service.duration}
                                            </p>
                                            <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition shadow-md hover:shadow-lg">
                                                Reservar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })}

                {/* Renderizar categorías que no estén en el orden predefinido (si las hubiera) */}
                {Object.keys(groupedServices).filter(cat => !categoryOrder.includes(cat)).map(category => (
                    <section key={category} className="bg-white p-6 rounded-2xl shadow-xl transition hover:shadow-2xl">
                        <h2 className="text-3xl font-bold mb-6 text-indigo-700 border-b-2 pb-2 flex items-center">
                            <ListChecks className="w-6 h-6 mr-2" />
                            {category}
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            {groupedServices[category].map(service => (
                                <div key={service.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-400 transition duration-300">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-xl font-semibold text-gray-800">{service.name}</h3>
                                        <span className="text-xl font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full whitespace-nowrap">
                                            {service.price}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex justify-between items-center text-gray-500 text-sm">
                                        <p><span className="font-medium text-gray-700">Duración:</span> {service.duration}</p>
                                        <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition shadow-md hover:shadow-lg">
                                            Reservar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

            </div>
        </div>
    );
}